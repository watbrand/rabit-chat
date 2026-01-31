import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { apiError, ErrorCodes } from "./validation";

const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json(
    apiError(
      ErrorCodes.RATE_LIMITED,
      "Too many requests. Please try again later."
    )
  );
};

// Login limiter: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// General auth limiter (for other auth operations)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Password reset limiter: 3 requests per 15 minutes per IP
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { message: "Too many password reset attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Signup limiter: 10 registrations per hour per IP
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
  message: "Too many account creation attempts. Please try again in an hour.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many posts. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => !req.session?.userId,
});

export const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many comments. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => !req.session?.userId,
});

// Message limiter: 60 messages per minute per user
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many messages, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.session?.userId || 'anonymous',
  skip: (req) => !req.session?.userId,
});

// Wallet/financial transactions limiter: 10 per minute per user
export const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many financial transactions, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.session?.userId || 'anonymous',
  skip: (req) => !req.session?.userId,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  message: "Too many API requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Higher limit for read-only feed/content endpoints
export const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: "Too many feed requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many upload attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => !req.session?.userId,
});

export const storiesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many stories. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => !req.session?.userId,
});

export const reactionsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many reactions. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => !req.session?.userId,
});

export const reportsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many reports. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => !req.session?.userId,
});

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function createRateLimit(options: RateLimitOptions) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || "Too many requests. Please slow down.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: (req) => !req.session?.userId,
  });
}
