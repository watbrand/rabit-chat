import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { log } from "./logger";

let sentryModule: {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, context?: Record<string, unknown>) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
  Handlers: {
    requestHandler: () => (req: Request, res: Response, next: NextFunction) => void;
    errorHandler: () => ErrorRequestHandler;
  };
} | null = null;

export async function initSentry(): Promise<boolean> {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    log("info", "Sentry DSN not configured, error tracking disabled");
    return false;
  }
  
  try {
    // Dynamic import - module may not be installed (optional dependency)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = await (Function('return import("@sentry/node")')() as Promise<any>);
    sentryModule = Sentry;
    
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1,
      beforeSend(event: Record<string, unknown>) {
        if (event.user && typeof event.user === "object") {
          delete (event.user as Record<string, unknown>).ip_address;
        }
        return event;
      },
    });
    
    log("info", "Sentry initialized successfully");
    return true;
  } catch (error) {
    log("warn", "Sentry not installed or failed to initialize - run 'npm install @sentry/node' to enable", { error: String(error) });
    return false;
  }
}

export function sentryRequestHandler() {
  if (sentryModule) {
    return sentryModule.Handlers.requestHandler();
  }
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export function sentryErrorHandler(): ErrorRequestHandler {
  if (sentryModule) {
    return sentryModule.Handlers.errorHandler();
  }
  return (err: Error, _req: Request, _res: Response, next: NextFunction) => next(err);
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (sentryModule) {
    sentryModule.captureException(error, { extra: context });
  }
}

export function setUser(userId: string, email?: string) {
  if (sentryModule) {
    sentryModule.setUser({ id: userId, email });
  }
}

export function clearUser() {
  if (sentryModule) {
    sentryModule.setUser(null);
  }
}
