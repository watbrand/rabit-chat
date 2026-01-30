import { QueryClient, QueryFunction } from "@tanstack/react-query";
import Constants from "expo-constants";

/**
 * Gets the base URL for the Express API server (e.g., "https://domain.replit.dev")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Debug logging for production troubleshooting
  console.log("[getApiUrl] Starting domain resolution...");
  console.log("[getApiUrl] process.env.EXPO_PUBLIC_DOMAIN:", process.env.EXPO_PUBLIC_DOMAIN);
  console.log("[getApiUrl] Constants.expoConfig:", JSON.stringify(Constants.expoConfig?.extra, null, 2));
  console.log("[getApiUrl] Constants.manifest2?.extra:", JSON.stringify((Constants as any).manifest2?.extra, null, 2));
  console.log("[getApiUrl] Constants.manifest?.extra:", JSON.stringify((Constants as any).manifest?.extra, null, 2));
  
  // Try multiple sources for the domain
  let host = process.env.EXPO_PUBLIC_DOMAIN;
  
  // Fallback to Expo Constants if available (for published static builds)
  // The build script sets this at manifest.extra.expoClient.extra.apiDomain
  if (!host && Constants.expoConfig?.extra?.apiDomain) {
    host = Constants.expoConfig.extra.apiDomain;
  }
  
  // Also check expoClient.extra.apiDomain (static build manifest structure)
  if (!host && (Constants as any).expoConfig?.extra?.expoClient?.extra?.apiDomain) {
    host = (Constants as any).expoConfig.extra.expoClient.extra.apiDomain;
  }
  
  // Check manifest2 structure for static builds
  if (!host && (Constants as any).manifest2?.extra?.expoClient?.extra?.apiDomain) {
    host = (Constants as any).manifest2.extra.expoClient.extra.apiDomain;
  }
  
  // Also check the direct manifest structure that Expo Go might use
  if (!host && (Constants as any).manifest?.extra?.expoClient?.extra?.apiDomain) {
    host = (Constants as any).manifest.extra.expoClient.extra.apiDomain;
  }
  
  // Check if expoGo contains the production domain (build.js sets debuggerHost to include domain)
  if (!host && (Constants as any).manifest2?.extra?.expoGo?.debuggerHost) {
    // debuggerHost format: "domain.replit.app/ios" - extract just the domain
    const debuggerHost = (Constants as any).manifest2.extra.expoGo.debuggerHost;
    const parts = debuggerHost.split('/');
    if (parts[0] && (parts[0].includes('replit.app') || parts[0].includes('replit.dev'))) {
      host = parts[0];
      console.log("[getApiUrl] Extracted domain from debuggerHost:", host);
    }
  }
  
  // Fallback to hostUri for Expo Go development mode
  // This is set by Metro bundler when running in Expo Go
  if (!host && Constants.expoConfig?.hostUri) {
    // hostUri format: "domain.replit.dev:8081" or just "domain.replit.dev"
    const hostUri = Constants.expoConfig.hostUri;
    host = hostUri.split(':')[0];
  }
  
  // Try expoGo debuggerHost as another fallback
  if (!host && (Constants as any).manifest2?.extra?.expoGo?.debuggerHost) {
    const debuggerHost = (Constants as any).manifest2.extra.expoGo.debuggerHost;
    host = debuggerHost.split(':')[0];
  }
  
  // Try manifest hostUri (legacy Expo Go)
  if (!host && (Constants as any).manifest?.hostUri) {
    const hostUri = (Constants as any).manifest.hostUri;
    host = hostUri.split(':')[0];
  }
  
  // For web: try to get the domain from the current location
  if (!host && typeof window !== 'undefined' && window.location?.hostname) {
    // Use current page hostname for web builds
    const hostname = window.location.hostname;
    // Only use this if it looks like a Replit domain
    if (hostname.includes('replit.dev') || hostname.includes('repl.co') || hostname.includes('replit.app')) {
      host = hostname;
      console.log("[getApiUrl] Using window.location.hostname:", host);
    }
  }
  
  // For Expo static builds, check the runtime manifest
  if (!host) {
    try {
      // In static builds, the manifest extra may have the domain
      const extra = (Constants as any).manifest?.extra || 
                    (Constants as any).expoConfig?.extra || 
                    (Constants as any).manifest2?.extra;
      if (extra?.apiDomain) {
        host = extra.apiDomain;
        console.log("[getApiUrl] Found apiDomain in manifest extra:", host);
      }
    } catch (e) {
      console.log("[getApiUrl] Error checking manifest extra:", e);
    }
  }
  
  // Final fallback for web: use current origin
  if (!host && typeof window !== 'undefined' && window.location?.origin) {
    // Just use current origin directly for API calls
    const url = new URL(window.location.origin);
    console.log("[getApiUrl] Using current origin as fallback:", url.href);
    return url.href;
  }
  
  if (!host) {
    console.error("[getApiUrl] CRITICAL: Could not determine API host from any source!");
    console.log("[getApiUrl] Constants:", JSON.stringify({
      expoConfig: Constants.expoConfig,
      manifest: (Constants as any).manifest,
      manifest2: (Constants as any).manifest2,
    }, null, 2));
    // Use relative URLs as last resort - this works for web but not native
    console.log("[getApiUrl] Using empty string (relative URLs)");
    return "";
  }

  console.log("[getApiUrl] Resolved host:", host);

  // Remove port suffix if present - Replit's HTTPS proxy handles routing
  // e.g., "domain.replit.dev:5000" -> "domain.replit.dev"
  host = host.replace(/:5000$/, "").replace(/:8081$/, "");

  let url = new URL(`https://${host}`);

  console.log("[getApiUrl] Final URL:", url.href);

  return url.href;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const path = queryKey[0] as string;
    const url = new URL(path, baseUrl);
    
    if (queryKey.length > 1 && typeof queryKey[1] === 'object' && queryKey[1] !== null) {
      const params = queryKey[1] as Record<string, unknown>;
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    console.log("[QueryClient] Fetching:", url.toString());
    
    const res = await fetch(url, {
      credentials: "include",
    });

    console.log("[QueryClient] Response status:", res.status, "for", path);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: false,
    },
  },
});
