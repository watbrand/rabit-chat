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

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : 5,
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

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many messages. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
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
