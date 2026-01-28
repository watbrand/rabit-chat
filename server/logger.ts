import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface RequestLog {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode?: number;
  userId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  error?: string;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

function formatLog(log: RequestLog): string {
  const parts = [
    `[${log.timestamp}]`,
    `[${log.requestId}]`,
    log.userId ? `[user:${log.userId}]` : "[user:-]",
    `${log.method} ${log.path}`,
  ];
  
  if (log.statusCode !== undefined) {
    parts.push(`${log.statusCode}`);
  }
  
  if (log.duration !== undefined) {
    parts.push(`${log.duration}ms`);
  }
  
  if (log.error) {
    parts.push(`ERROR: ${log.error}`);
  }
  
  return parts.join(" ");
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  req.requestId = crypto.randomUUID().slice(0, 8);
  req.startTime = Date.now();
  
  const log: RequestLog = {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    userId: req.session?.userId,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
  };
  
  res.on("finish", () => {
    log.statusCode = res.statusCode;
    log.duration = Date.now() - req.startTime;
    log.userId = req.session?.userId;
    
    if (res.statusCode >= 400) {
      console.error(formatLog(log));
    } else {
      console.log(formatLog(log));
    }
  });
  
  next();
}

export function log(level: "info" | "warn" | "error", message: string, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  const output = `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  
  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

export function logError(error: Error, context?: Record<string, unknown>) {
  log("error", error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
  });
}
