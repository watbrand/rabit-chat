import express from "express";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { validateEnvironment } from "./validate-env";
import { apiError, ErrorCodes } from "./validation";
import { apiLimiter, feedLimiter } from "./rate-limit";
import { requestLogger, log as structuredLog } from "./logger";
import { initSentry, sentryRequestHandler, sentryErrorHandler, captureException } from "./sentry";
import healthRouter from "./health";
import * as fs from "fs";
import * as path from "path";
import { initGossipJobs } from "./gossip-jobs";
import { runStartupMigrations } from "./db";
import { cleanupOldTempFiles, UPLOAD_TEMP_DIR } from "./cloudinary";
import { seedGossipLocations } from "./seed-gossip-locations";

validateEnvironment();

const app = express();
const log = console.log;

// Trust Replit's HTTPS proxy so secure cookies work in production
app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d: string) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    // Allow localhost origins for Expo web development (any port)
    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Content-Length, X-Requested-With, x-device-id, X-Device-Id");
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Expose-Headers", "Content-Length");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  // Skip body parsing for upload endpoints - multer handles those
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    const isUploadRoute = req.path === '/api/upload' || req.path.startsWith('/api/upload/');
    const isMultipart = contentType.includes('multipart/form-data');
    
    // Skip body parsing completely for upload routes with multipart data
    if (isUploadRoute && isMultipart) {
      console.log(`[BodyParser] Skipping body parsing for upload: ${req.path}`);
      return next();
    }
    
    // Use JSON parser for non-multipart requests
    if (!isMultipart) {
      return express.json({
        limit: "100mb",
        verify: (req, _res, buf) => {
          (req as any).rawBody = buf;
        },
      })(req, res, next);
    }
    
    next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return express.urlencoded({ extended: false, limit: "100mb" })(req, res, next);
    }
    next();
  });
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
  }

  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  // Serve admin panel
  const adminPanelPath = path.resolve(process.cwd(), "server", "admin", "index.html");
  app.get("/admin", (req: Request, res: Response) => {
    res.sendFile(adminPanelPath);
  });
  app.get("/admin/*", (req: Request, res: Response) => {
    res.sendFile(adminPanelPath);
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }

    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }

    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName,
      });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupSecurityHeaders(app: express.Application) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
          scriptSrcAttr: ["'unsafe-inline'"],
          connectSrc: ["'self'", "https:", "wss:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          formAction: ["'self'", "javascript:"],
          upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      originAgentCluster: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      xDownloadOptions: true,
      xFrameOptions: { action: "deny" },
      xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
      xPoweredBy: false,
      xXssProtection: true,
    })
  );
}

function setupRateLimiting(app: express.Application) {
  // Higher limits for read-heavy content endpoints
  app.use("/api/posts", feedLimiter);
  app.use("/api/discover", feedLimiter);
  app.use("/api/feed", feedLimiter);
  app.use("/api/reels", feedLimiter);
  app.use("/api/stories", feedLimiter);
  app.use("/api/users", feedLimiter);
  
  // Default limit for all other API routes
  app.use("/api/", apiLimiter);
}

function setupErrorHandler(app: express.Application) {
  app.use(sentryErrorHandler());
  
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
      code?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = status === 500 
      ? "An unexpected error occurred" 
      : (error.message || "Internal Server Error");
    
    const errorCode = error.code || (status === 500 ? ErrorCodes.INTERNAL_ERROR : "ERROR");

    structuredLog("error", "Unhandled error", {
      requestId: req.requestId,
      userId: req.session?.userId,
      path: req.path,
      method: req.method,
      error: error.message,
      status,
    });

    if (status === 500 && err instanceof Error) {
      captureException(err, {
        requestId: req.requestId,
        userId: req.session?.userId,
        path: req.path,
      });
    }

    res.status(status).json(apiError(errorCode, message));
  });
}

(async () => {
  // Initialize Sentry first (fast, non-blocking)
  initSentry().catch(err => console.error('Sentry init failed:', err));
  
  // Early request logging for debugging
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/upload')) {
      console.log(`[EARLY] Upload request received: ${req.method} ${req.path}`);
      console.log(`[EARLY] Content-Length: ${req.headers['content-length']}`);
      console.log(`[EARLY] Content-Type: ${req.headers['content-type']?.substring(0, 60)}`);
    }
    next();
  });
  
  app.use(sentryRequestHandler());
  setupSecurityHeaders(app);
  
  // Enable gzip compression for all responses
  app.use(compression({
    filter: (req, res) => {
      // Skip compression for already compressed responses or uploads
      if (req.headers['x-no-compression'] || req.path.startsWith('/api/upload')) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level (1-9, where 9 is max compression)
    threshold: 1024, // Only compress responses larger than 1KB
  }));
  
  setupCors(app);
  setupBodyParsing(app);
  setupRateLimiting(app);
  setupRequestLogging(app);
  app.use(requestLogger);
  
  app.use(healthRouter);

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  // Configure server timeouts for large file uploads
  server.keepAliveTimeout = 600000; // 10 minutes
  server.headersTimeout = 610000; // Slightly longer than keepAliveTimeout
  server.timeout = 900000; // 15 minutes for request timeout

  const port = parseInt(process.env.PORT || "5000", 10);
  
  // OPEN PORT IMMEDIATELY - this is critical for deployment health checks
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`express server serving on port ${port}`);
      log(`Server timeouts configured: keepAlive=${server.keepAliveTimeout}ms, headers=${server.headersTimeout}ms, request=${server.timeout}ms`);
      
      // Run startup tasks AFTER port is open (non-blocking for deployment)
      try {
        await runStartupMigrations();
        await seedGossipLocations();
      } catch (err) {
        console.error('Startup migrations failed:', err);
      }
      
      initGossipJobs();

      // Initialize periodic temp file cleanup (every 30 minutes)
      if (fs.existsSync(UPLOAD_TEMP_DIR)) {
        cleanupOldTempFiles(30 * 60 * 1000);
      }
      setInterval(() => {
        cleanupOldTempFiles(30 * 60 * 1000);
      }, 30 * 60 * 1000);
    },
  );
})();
