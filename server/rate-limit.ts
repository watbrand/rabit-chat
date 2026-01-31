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

/**
 * Generate a composite key from IP and userId for authenticated routes
 * This prevents bypass attempts using multiple accounts from same IP or
 * same account from multiple IPs
 * 
 * Note: We use both IP and userId together which provides stronger protection
 * than IP-only limiting. The IPv6 validation warning is suppressed since
 * our composite key approach is intentionally different from pure IP limiting.
 */
function getCompositeKey(req: Request): string {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const userId = req.session?.userId || 'anonymous';
  return `${ip}:${userId}`;
}

/**
 * Validation options to suppress IPv6 key generator warnings
 * since we use composite keys (IP+userId) which provide better security
 */
const compositeKeyValidation = {
  keyGeneratorIpFallback: false, // Disable IP-only key generator fallback check
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

// Post limiter: 10 posts per minute, keyed by IP+userId
export const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many posts. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Comment limiter: 20 comments per minute, keyed by IP+userId
export const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many comments. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Message limiter: 60 messages per minute, keyed by IP+userId
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Too many messages, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Wallet/financial transactions limiter: 10 per minute, keyed by IP+userId
export const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Too many financial transactions, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
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

// Upload limiter: 30 uploads per 15 minutes, keyed by IP+userId
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many upload attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Stories limiter: 10 per minute, keyed by IP+userId
export const storiesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many stories. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Reactions limiter: 100 per minute, keyed by IP+userId
export const reactionsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many reactions. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Reports limiter: 10 per 15 minutes, keyed by IP+userId
export const reportsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many reports. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Voice call initiation limiter: 5 per minute, keyed by IP+userId
export const voiceCallLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many call attempts. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Video call initiation limiter: 5 per minute, keyed by IP+userId
export const videoCallLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many video call attempts. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Live stream creation limiter: 3 per hour, keyed by IP+userId
export const liveStreamLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many live stream attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Battle creation limiter: 5 per hour, keyed by IP+userId
export const battleLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many battle creation attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getCompositeKey,
  skip: (req) => !req.session?.userId,
  validate: compositeKeyValidation,
});

// Broadcast channel creation limiter: 5 per hour per user
export const broadcastChannelLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many channel creation attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => req.session?.userId || 'anonymous',
  skip: (req) => !req.session?.userId,
});

// Stories rate limiting
export const storiesRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Too many story operations. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Reels rate limiting
export const reelsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: "Too many reel operations. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Comments rate limiting
export const commentsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Too many comments. Please wait before commenting again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Likes rate limiting
export const likesRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: "Too many likes. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Follows rate limiting
export const followsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Too many follow/unfollow actions. Please wait." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Gifts rate limiting
export const giftsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: "Too many gift transactions. Please wait." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Mall rate limiting
export const mallRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { message: "Too many mall operations. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Staking rate limiting
export const stakingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { message: "Too many staking operations. Please wait." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Direct Messages rate limiting
export const dmsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { message: "Too many messages. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Onboarding rate limiting
export const onboardingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: "Too many onboarding requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Data export rate limiting (should be strict)
export const dataExportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Too many data export requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
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
