import type { Express, Request, Response as ExpressResponse } from "express";
import rateLimit from "express-rate-limit";
import { apiError, ErrorCodes } from "./validation";

const MAX_RESPONSE_SIZE = 1024 * 1024;
const FETCH_TIMEOUT = 5000;
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_MAX_SIZE = 1000;

interface LinkPreviewData {
  url: string;
  title: string;
  description: string;
  image: string | null;
  domain: string;
}

interface CacheEntry {
  data: LinkPreviewData;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const cacheOrder: string[] = [];

function getCached(url: string): LinkPreviewData | null {
  const entry = cache.get(url);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(url);
    const idx = cacheOrder.indexOf(url);
    if (idx !== -1) cacheOrder.splice(idx, 1);
    return null;
  }
  
  return entry.data;
}

function setCache(url: string, data: LinkPreviewData): void {
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldest = cacheOrder.shift();
    if (oldest) cache.delete(oldest);
  }
  
  cache.set(url, { data, timestamp: Date.now() });
  cacheOrder.push(url);
}

const rateLimitHandler = (req: Request, res: ExpressResponse) => {
  res.status(429).json(
    apiError(
      ErrorCodes.RATE_LIMITED,
      "Too many link preview requests. Please try again later."
    )
  );
};

export const linkPreviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many link preview requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => !req.session?.userId,
});

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPrivateOrLocalhost(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return true;
    }
    
    if (hostname === "0.0.0.0") {
      return true;
    }
    
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);
      
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 127) return true;
      if (a === 169 && b === 254) return true;
      if (a === 0) return true;
    }
    
    if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      return true;
    }
    
    return false;
  } catch {
    return true;
  }
}

function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, 500);
}

function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

function extractDomain(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function extractTitle(html: string): string {
  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) return sanitizeText(ogTitle);
  
  const twitterTitle = extractMetaContent(html, "twitter:title");
  if (twitterTitle) return sanitizeText(twitterTitle);
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return sanitizeText(titleMatch[1]);
  }
  
  return "";
}

function extractDescription(html: string): string {
  const ogDesc = extractMetaContent(html, "og:description");
  if (ogDesc) return sanitizeText(ogDesc);
  
  const twitterDesc = extractMetaContent(html, "twitter:description");
  if (twitterDesc) return sanitizeText(twitterDesc);
  
  const metaDesc = extractMetaContent(html, "description");
  if (metaDesc) return sanitizeText(metaDesc);
  
  return "";
}

function extractImage(html: string, baseUrl: string): string | null {
  const ogImage = extractMetaContent(html, "og:image");
  if (ogImage) {
    const sanitized = sanitizeUrl(ogImage);
    if (sanitized) return sanitized;
    try {
      return new URL(ogImage, baseUrl).href;
    } catch {}
  }
  
  const twitterImage = extractMetaContent(html, "twitter:image");
  if (twitterImage) {
    const sanitized = sanitizeUrl(twitterImage);
    if (sanitized) return sanitized;
    try {
      return new URL(twitterImage, baseUrl).href;
    } catch {}
  }
  
  return null;
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RabitChatBot/1.0; +https://rabitchat.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export function registerLinkPreviewRoutes(app: Express): void {
  app.get("/api/link-preview", linkPreviewLimiter, async (req: Request, res: ExpressResponse) => {
    const url = req.query.url as string;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL parameter is required",
      });
    }
    
    if (!isValidUrl(url)) {
      return res.status(400).json({
        success: false,
        error: "Invalid URL format. Must be http or https.",
      });
    }
    
    if (isPrivateOrLocalhost(url)) {
      return res.status(400).json({
        success: false,
        error: "Cannot fetch private or local URLs",
      });
    }
    
    const cached = getCached(url);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
      });
    }
    
    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT);
      
      if (!response.ok) {
        return res.status(502).json({
          success: false,
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        });
      }
      
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        const domain = extractDomain(url);
        const data: LinkPreviewData = {
          url,
          title: domain,
          description: "",
          image: null,
          domain,
        };
        setCache(url, data);
        return res.json({ success: true, data });
      }
      
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
        return res.status(413).json({
          success: false,
          error: "Response too large",
        });
      }
      
      let html = "";
      let bytesRead = 0;
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (bytesRead < MAX_RESPONSE_SIZE) {
          const { done, value } = await reader.read();
          if (done) break;
          
          bytesRead += value.length;
          if (bytesRead > MAX_RESPONSE_SIZE) {
            reader.cancel();
            break;
          }
          
          html += decoder.decode(value, { stream: true });
          
          if (html.includes("</head>")) {
            reader.cancel();
            break;
          }
        }
      } else {
        html = await response.text();
        if (html.length > MAX_RESPONSE_SIZE) {
          html = html.slice(0, MAX_RESPONSE_SIZE);
        }
      }
      
      const title = extractTitle(html);
      const description = extractDescription(html);
      const image = extractImage(html, url);
      const domain = extractDomain(url);
      
      const data: LinkPreviewData = {
        url,
        title: title || domain,
        description,
        image,
        domain,
      };
      
      setCache(url, data);
      
      return res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      if (error.name === "AbortError") {
        return res.status(504).json({
          success: false,
          error: "Request timed out",
        });
      }
      
      console.error("[LinkPreview] Error fetching URL:", error.message);
      
      return res.status(502).json({
        success: false,
        error: "Failed to fetch URL",
      });
    }
  });
}
