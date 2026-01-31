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

// ===== MESSAGE SCHEMAS =====

const messageTypeEnum = z.enum(["TEXT", "PHOTO", "VIDEO", "VOICE", "FILE", "LINK"]);

export const sendMediaMessageSchema = z.object({
  content: z.string().max(2000, "Message content too long").optional().default(""),
  messageType: messageTypeEnum.default("TEXT"),
  mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
  replyToId: z.string().uuid("Invalid reply message ID").optional().nullable(),
}).superRefine((data, ctx) => {
  // For non-TEXT types, mediaUrl is required
  if (data.messageType !== "TEXT" && !data.mediaUrl) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Media URL is required for ${data.messageType} messages`,
      path: ["mediaUrl"],
    });
  }
  // For TEXT type, content is required
  if (data.messageType === "TEXT" && (!data.content || data.content.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Content is required for text messages",
      path: ["content"],
    });
  }
});

export const messageReactionSchema = z.object({
  emoji: z.string()
    .min(1, "Emoji is required")
    .max(10, "Invalid emoji"),
});

// ===== GROUP SCHEMAS =====

const groupCategoryEnum = z.enum([
  "SOCIAL", "BUSINESS", "ENTERTAINMENT", "EDUCATION", "GAMING", 
  "SPORTS", "MUSIC", "ART", "TECHNOLOGY", "LIFESTYLE", "OTHER"
]).optional();

export const createGroupSchema = z.object({
  name: z.string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name cannot exceed 50 characters")
    .transform(val => val.trim()),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
  isPrivate: z.boolean().default(false),
  category: groupCategoryEnum,
});

// ===== EVENT SCHEMAS =====

const rsvpStatusEnum = z.enum(["GOING", "INTERESTED", "NOT_GOING"]);

export const createEventSchema = z.object({
  title: z.string()
    .min(3, "Event title must be at least 3 characters")
    .max(100, "Event title cannot exceed 100 characters")
    .transform(val => val.trim()),
  description: z.string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
  startDate: z.string()
    .min(1, "Start date is required")
    .refine(val => !isNaN(new Date(val).getTime()), "Invalid start date format"),
  endDate: z.string()
    .optional()
    .nullable()
    .refine(val => !val || !isNaN(new Date(val).getTime()), "Invalid end date format"),
  location: z.string().max(200, "Location too long").optional().nullable(),
  isVirtual: z.boolean().default(false),
  maxAttendees: z.union([z.number().int().positive(), z.string().transform(v => parseInt(v, 10))])
    .optional()
    .nullable()
    .refine(val => !val || (val > 0 && val <= 100000), "Invalid attendee limit"),
}).refine(data => {
  if (data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const rsvpEventSchema = z.object({
  status: rsvpStatusEnum,
});

// ===== WALLET/ECONOMY SCHEMAS =====

const transactionTypeEnum = z.enum([
  "PURCHASE", "GIFT_SENT", "GIFT_RECEIVED", "REWARD", "REFUND", 
  "WITHDRAWAL", "DEPOSIT", "TRANSFER", "ADMIN_ADJUSTMENT"
]);

export const coinPurchaseSchema = z.object({
  bundleId: z.string().uuid("Invalid bundle ID"),
});

export const customCoinPurchaseSchema = z.object({
  coinAmount: z.number()
    .int("Coin amount must be a whole number")
    .min(10, "Minimum purchase is 10 coins")
    .max(1000000, "Maximum single purchase is 1,000,000 coins"),
});

export const walletAdjustmentSchema = z.object({
  amount: z.number()
    .int("Amount must be a whole number")
    .refine(val => val !== 0, "Amount cannot be zero"),
  reason: z.string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason too long"),
  transactionType: transactionTypeEnum.optional().default("ADMIN_ADJUSTMENT"),
});

export const sendGiftSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  giftTypeId: z.string().uuid("Invalid gift type ID"),
  message: z.string().max(200, "Gift message too long").optional(),
});

export const withdrawalRequestSchema = z.object({
  amount: z.number()
    .int("Amount must be a whole number")
    .positive("Amount must be positive")
    .min(100, "Minimum withdrawal is 100 coins"),
  bankName: z.string().min(2, "Bank name required").max(100, "Bank name too long"),
  accountNumber: z.string().min(5, "Invalid account number").max(30, "Account number too long"),
  accountHolder: z.string().min(2, "Account holder name required").max(100, "Name too long"),
});

const storyTypeEnum = z.enum(["PHOTO", "VIDEO", "TEXT", "VOICE"]);
const replySettingEnum = z.enum(["EVERYONE", "FOLLOWING", "NOBODY"]);
const storyReactionTypeEnum = z.enum(["FIRE", "HEART", "LAUGH", "WOW", "SAD", "CLAP"]);

export const createStorySchema = z.object({
  type: storyTypeEnum,
  caption: z.string().max(500, "Caption too long").optional().nullable(),
  mediaUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  durationMs: z.union([z.number().int().positive(), z.string().transform(val => parseInt(val, 10))]).optional().nullable(),
  textContent: z.string().max(500, "Text content too long").optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  isGradient: z.union([z.boolean(), z.string().transform(val => val === "true")]).optional(),
  gradientColors: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  textAlignment: z.string().optional().nullable(),
  textAnimation: z.string().optional().nullable(),
  textBackgroundPill: z.union([z.boolean(), z.string().transform(val => val === "true")]).optional(),
  fontSize: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
  audioDuration: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).optional().nullable(),
  audioTranscript: z.string().optional().nullable(),
  musicUrl: z.string().url().optional().nullable(),
  musicTitle: z.string().optional().nullable(),
  musicArtist: z.string().optional().nullable(),
  musicStartTime: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).optional().nullable(),
  musicDuration: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).optional().nullable(),
  filterName: z.string().optional().nullable(),
  textOverlays: z.any().optional().nullable(),
  drawings: z.any().optional().nullable(),
  isCloseFriends: z.union([z.boolean(), z.string().transform(val => val === "true")]).optional(),
  replySetting: replySettingEnum.optional(),
  scheduledAt: z.string().optional().nullable(),
  locationName: z.string().optional().nullable(),
  locationLat: z.union([z.number(), z.string().transform(val => parseFloat(val))]).optional().nullable(),
  locationLng: z.union([z.number(), z.string().transform(val => parseFloat(val))]).optional().nullable(),
  stickers: z.any().optional().nullable(),
});

export const storyReactionSchema = z.object({
  reactionType: storyReactionTypeEnum,
});

// ===== VOICE/VIDEO CALL SCHEMAS =====

export const voiceCallSchema = z.object({
  targetUserId: z.string().uuid("Invalid target user ID"),
  callType: z.enum(["audio", "video"]).optional().default("audio"),
});

export const videoCallSchema = z.object({
  targetUserId: z.string().uuid("Invalid target user ID"),
  callType: z.enum(["audio", "video"]).optional().default("video"),
});

export const callIdSchema = z.object({
  callId: z.string().uuid("Invalid call ID"),
});

export const callActionSchema = z.object({
  callId: z.string().uuid("Invalid call ID"),
  action: z.enum(["accept", "reject", "end"]),
});

// ===== LIVE STREAM SCHEMAS =====

export const liveStreamSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  isPrivate: z.boolean().optional().default(false),
  scheduledAt: z.string()
    .refine(val => !val || !isNaN(new Date(val).getTime()), "Invalid scheduled date")
    .optional()
    .nullable(),
});

export const updateLiveStreamSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
});

export const liveStreamCommentSchema = z.object({
  content: z.string()
    .min(1, "Comment is required")
    .max(500, "Comment cannot exceed 500 characters"),
});

export const liveStreamReactionSchema = z.object({
  reactionType: z.enum(["HEART", "FIRE", "CLAP", "WOW", "LAUGH"]),
});

// ===== BATTLE SCHEMAS =====

const battleTypeEnum = z.enum(["likes", "comments", "shares", "views", "gifts"]);
const battleStatusEnum = z.enum(["pending", "active", "completed", "cancelled"]);

export const battleSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters"),
  type: battleTypeEnum.optional().default("likes"),
  duration: z.number()
    .int("Duration must be a whole number")
    .min(60, "Minimum duration is 60 seconds")
    .max(86400, "Maximum duration is 24 hours")
    .optional()
    .default(3600),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  entryFee: z.number()
    .int("Entry fee must be a whole number")
    .min(0, "Entry fee cannot be negative")
    .optional()
    .default(0),
  prizePool: z.number()
    .int("Prize pool must be a whole number")
    .min(0, "Prize pool cannot be negative")
    .optional()
    .default(0),
});

export const updateBattleSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  status: battleStatusEnum.optional(),
});

export const battleParticipationSchema = z.object({
  battleId: z.string().uuid("Invalid battle ID"),
});

// ===== BROADCAST CHANNEL SCHEMAS =====

export const broadcastChannelSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  isPrivate: z.boolean().optional().default(false),
  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
});

export const updateBroadcastChannelSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .nullable(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
});

export const broadcastMessageSchema = z.object({
  content: z.string()
    .min(1, "Message is required")
    .max(2000, "Message cannot exceed 2000 characters"),
  mediaUrl: z.string().url("Invalid media URL").optional().nullable(),
  mediaType: z.enum(["image", "video", "audio"]).optional().nullable(),
});

export const dataImportSchema = z.object({
  data: z.object({
    users: z.array(z.any()).optional(),
    posts: z.array(z.any()).optional(),
    follows: z.array(z.any()).optional(),
    likes: z.array(z.any()).optional(),
    comments: z.array(z.any()).optional(),
  }),
  overwrite: z.boolean().optional().default(false),
});
