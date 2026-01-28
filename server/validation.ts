import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username too long"),
  password: z.string().min(1, "Password is required"),
});

const accountTypeEnum = z.enum(["PERSONAL", "CREATOR", "BUSINESS"]);
const genderEnum = z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER", "PREFER_NOT_TO_SAY"]);
const creatorCategoryEnum = z.enum([
  "INFLUENCER", "ARTIST_MUSICIAN", "PHOTOGRAPHER", "VIDEOGRAPHER", "BLOGGER",
  "DJ_PRODUCER", "COMEDIAN", "PUBLIC_FIGURE", "GAMER_STREAMER", "EDUCATOR",
  "FASHION_MODEL", "FITNESS_COACH", "BEAUTY_MAKEUP", "BUSINESS_CREATOR", "OTHER"
]);
const businessCategoryEnum = z.enum([
  "LUXURY_BRAND", "RESTAURANT_FOOD", "REAL_ESTATE", "FASHION_CLOTHING", "AUTOMOTIVE",
  "BEAUTY_SALON_SPA", "FINANCE_TRADING", "MEDIA_ENTERTAINMENT", "NIGHTLIFE_CLUB_EVENTS",
  "TECH_SOFTWARE", "EDUCATION", "HEALTH_MEDICAL", "ECOMMERCE_STORE", "SERVICES",
  "AGENCY_MARKETING", "OTHER"
]);

export const signupSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z.string().min(10, "Invalid phone number").optional(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long"),
  displayName: z.string()
    .min(1, "Display name is required")
    .max(50, "Display name too long"),
  birthday: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  province: z.string().min(1, "Province is required"),
  city: z.string().min(1, "City is required"),
  category: accountTypeEnum.default("PERSONAL"),
  gender: genderEnum.optional(),
  avatarUrl: z.string().url().optional().nullable(),
  creatorCategory: creatorCategoryEnum.optional(),
  bio: z.string().max(500).optional(),
  portfolioUrl: z.string().url().optional().nullable(),
  primaryPlatforms: z.array(z.string()).optional(),
  contentLanguage: z.string().optional(),
  contentTags: z.array(z.string()).optional(),
  hasManagement: z.boolean().optional(),
  managementName: z.string().optional(),
  showLocationPublicly: z.boolean().optional(),
  businessCategory: businessCategoryEnum.optional(),
  dateEstablished: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  websiteUrl: z.string().url().optional().nullable(),
  whatsappNumber: z.string().optional(),
  businessHours: z.record(z.string(), z.any()).optional(),
}).refine(data => data.email || data.phoneNumber, {
  message: "Either email or phone number is required",
  path: ["email"],
}).refine(data => {
  if (data.category === "CREATOR" && !data.creatorCategory) {
    return false;
  }
  return true;
}, {
  message: "Creator category is required for creator accounts",
  path: ["creatorCategory"],
}).refine(data => {
  if (data.category === "BUSINESS" && !data.businessCategory) {
    return false;
  }
  return true;
}, {
  message: "Business category is required for business accounts",
  path: ["businessCategory"],
});

const postTypeEnum = z.enum(["TEXT", "PHOTO", "VIDEO", "VOICE"]);
const visibilityEnum = z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]);

export const createPostSchema = z.object({
  type: postTypeEnum.default("TEXT"),
  content: z.string().max(5000, "Post content too long").optional().nullable(),
  caption: z.string().max(500, "Caption too long").optional().nullable(),
  mediaUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationMs: z.number().int().positive().optional().nullable(),
  aspectRatio: z.number().positive().optional().nullable(),
  visibility: visibilityEnum.default("PUBLIC"),
  commentsEnabled: z.boolean().default(true),
}).superRefine((data, ctx) => {
  switch (data.type) {
    case "TEXT":
      if (!data.content || data.content.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Content is required for text posts",
          path: ["content"],
        });
      }
      if (data.mediaUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Text posts cannot have media",
          path: ["mediaUrl"],
        });
      }
      break;

    case "PHOTO":
      if (!data.mediaUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Media URL is required for photo posts",
          path: ["mediaUrl"],
        });
      }
      break;

    case "VIDEO":
      if (!data.mediaUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Media URL is required for video posts",
          path: ["mediaUrl"],
        });
      }
      if (!data.thumbnailUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thumbnail URL is required for video posts",
          path: ["thumbnailUrl"],
        });
      }
      if (!data.durationMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duration is required for video posts",
          path: ["durationMs"],
        });
      }
      break;

    case "VOICE":
      if (!data.mediaUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Media URL is required for voice posts",
          path: ["mediaUrl"],
        });
      }
      if (!data.thumbnailUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thumbnail URL is required for voice posts",
          path: ["thumbnailUrl"],
        });
      }
      if (!data.durationMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duration is required for voice posts",
          path: ["durationMs"],
        });
      }
      break;
  }
});

export const createCommentSchema = z.object({
  content: z.string()
    .min(1, "Comment is required")
    .max(2000, "Comment too long"),
});

export const sendMessageSchema = z.object({
  content: z.string()
    .min(1, "Message content is required")
    .max(5000, "Message too long"),
  receiverId: z.string().uuid().optional(),
});

export const createConversationSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(50, "Display name too long").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  avatarUrl: z.string().url().optional().nullable(),
  netWorth: z.number().min(0).optional(),
});

export const reportSchema = z.object({
  reason: z.string()
    .min(10, "Please provide more details (at least 10 characters)")
    .max(1000, "Reason too long"),
  reportedUserId: z.string().uuid().optional(),
  reportedPostId: z.string().uuid().optional(),
});

export const updateReportSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]),
  adminNotes: z.string().max(2000, "Admin notes too long").optional(),
});

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationError[];
  };
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export function formatZodError(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

export function validateBody<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      const apiError: ApiError = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: formatZodError(result.error),
        },
      };
      return res.status(400).json(apiError);
    }
    
    req.body = result.data;
    next();
  };
}

export function apiError(code: string, message: string, details?: ValidationError[]): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return {
    success: true,
    data,
  };
}

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

const policyOptionEnum = z.enum(["EVERYONE", "FOLLOWERS", "NOBODY"]);
const userCategoryEnum = z.enum(["PERSONAL", "CREATOR", "BUSINESS"]);

export const updateSettingsSchema = z.object({
  privateAccount: z.boolean().optional(),
  commentPolicy: policyOptionEnum.optional(),
  messagePolicy: policyOptionEnum.optional(),
  mentionPolicy: policyOptionEnum.optional(),
  storyViewPolicy: policyOptionEnum.optional(),
  followersListVisibility: policyOptionEnum.optional(),
  followingListVisibility: policyOptionEnum.optional(),
  // Legacy notifications (keeping for compatibility)
  notifications: z.object({
    likes: z.boolean().optional(),
    comments: z.boolean().optional(),
    follows: z.boolean().optional(),
    messages: z.boolean().optional(),
    mentions: z.boolean().optional(),
  }).optional(),
  // Push Notifications (granular)
  pushNotifications: z.object({
    likes: z.boolean().optional(),
    comments: z.boolean().optional(),
    follows: z.boolean().optional(),
    messages: z.boolean().optional(),
    mentions: z.boolean().optional(),
    storyViews: z.boolean().optional(),
    profileViews: z.boolean().optional(),
    newFollowers: z.boolean().optional(),
    liveVideos: z.boolean().optional(),
    promotions: z.boolean().optional(),
  }).optional(),
  // Email Notifications
  emailNotifications: z.object({
    weeklyDigest: z.boolean().optional(),
    newFollowers: z.boolean().optional(),
    messages: z.boolean().optional(),
    mentions: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    securityAlerts: z.boolean().optional(),
  }).optional(),
  // Quiet Hours / Do Not Disturb
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM").optional().nullable(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, "Format: HH:MM").optional().nullable(),
  quietHoursTimezone: z.string().optional().nullable(),
  // Content Preferences
  contentPreferences: z.object({
    showSensitiveContent: z.boolean().optional(),
    autoTranslate: z.boolean().optional(),
    prioritizeFollowing: z.boolean().optional(),
  }).optional(),
  sensitiveContentFilter: z.boolean().optional(),
  // Security
  loginAlertsEnabled: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  // Accessibility
  fontSizePreference: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  // Media prefs
  mediaPrefs: z.object({
    autoplay: z.boolean().optional(),
    dataSaver: z.boolean().optional(),
    uploadQuality: z.enum(["low", "medium", "high"]).optional(),
  }).optional(),
});

export const updateFullProfileSchema = z.object({
  displayName: z.string().max(50, "Display name too long").optional(),
  bio: z.string().max(500, "Bio too long").optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().url().max(200, "Link URL too long").optional().nullable(),
  location: z.string().max(100, "Location too long").optional().nullable(),
  pronouns: z.string().max(30, "Pronouns too long").optional().nullable(),
  category: userCategoryEnum.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters")
    .max(100, "Password too long"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required for account deletion"),
});

// Verification Request Schemas
const verificationCategoryEnum = z.enum(["CELEBRITY", "INFLUENCER", "BUSINESS", "ORGANIZATION", "GOVERNMENT", "OTHER"]);

export const submitVerificationSchema = z.object({
  fullName: z.string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name too long"),
  category: verificationCategoryEnum,
  documentUrls: z.array(z.string()).max(5, "Maximum 5 documents allowed").default([]),
  links: z.array(z.string()).max(5, "Maximum 5 links allowed").default([]),
  reason: z.string()
    .min(50, "Reason must be at least 50 characters")
    .max(2000, "Reason too long"),
});

export const updateVerificationSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "APPROVED", "DENIED", "MORE_INFO_NEEDED"]).optional(),
  adminNotes: z.string().max(2000).optional().nullable(),
  denialReason: z.string().max(500).optional().nullable(),
});

export const verificationActionSchema = z.object({
  action: z.enum(["approve", "deny", "request_info"]),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});
