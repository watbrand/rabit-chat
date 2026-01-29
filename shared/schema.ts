import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, bigint, boolean, primaryKey, unique, index, pgEnum, real, jsonb, date, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ===== NEW ENUMS FOR POSTS, SETTINGS, PROFILE =====

// Post type enum - content types
export const postTypeEnum = pgEnum("post_type", ["TEXT", "PHOTO", "VIDEO", "VOICE"]);

// Visibility enum - post visibility levels
export const visibilityEnum = pgEnum("visibility", ["PUBLIC", "FOLLOWERS", "PRIVATE"]);

// User category enum - profile types
export const userCategoryEnum = pgEnum("user_category", ["PERSONAL", "CREATOR", "BUSINESS"]);

// Privacy policy enum - for settings
export const policyEnum = pgEnum("policy", ["EVERYONE", "FOLLOWERS", "NOBODY"]);

// Playlist type enum
export const playlistTypeEnum = pgEnum("playlist_type", ["VIDEO", "VOICE"]);

// Verification request status enum
export const verificationStatusEnum = pgEnum("verification_status", ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "DENIED", "MORE_INFO_NEEDED"]);

// Verification category enum
export const verificationCategoryEnum = pgEnum("verification_category", ["CELEBRITY", "INFLUENCER", "BUSINESS", "ORGANIZATION", "GOVERNMENT", "OTHER"]);

// Relationship status enum
export const relationshipStatusEnum = pgEnum("relationship_status", ["SINGLE", "IN_RELATIONSHIP", "ENGAGED", "MARRIED", "COMPLICATED", "OPEN", "PREFER_NOT_TO_SAY"]);

// Profile theme style enum
export const themeStyleEnum = pgEnum("theme_style", ["DEFAULT", "MINIMAL", "BOLD", "ELEGANT", "DARK", "VIBRANT"]);

// Font size preference enum
export const fontSizeEnum = pgEnum("font_size", ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"]);

// Data export status enum
export const exportStatusEnum = pgEnum("export_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "EXPIRED"]);

// Scheduled post status enum
export const scheduledStatusEnum = pgEnum("scheduled_status", ["PENDING", "PUBLISHED", "FAILED", "CANCELLED"]);

// Link icon type enum
export const linkIconTypeEnum = pgEnum("link_icon_type", ["LINK", "WEBSITE", "INSTAGRAM", "TWITTER", "YOUTUBE", "TIKTOK", "LINKEDIN", "GITHUB", "DISCORD", "TWITCH", "SPOTIFY", "AMAZON", "SHOP", "OTHER"]);

// Industry enum - for networking and recommendations
export const industryEnum = pgEnum("industry", [
  "TECH", "FINANCE", "REAL_ESTATE", "ENTERTAINMENT", "SPORTS", 
  "HEALTHCARE", "LEGAL", "FASHION", "HOSPITALITY", "MEDIA",
  "AUTOMOTIVE", "AVIATION", "ART", "EDUCATION", "CONSULTING",
  "CRYPTO", "VENTURE_CAPITAL", "PRIVATE_EQUITY", "PHILANTHROPY", "OTHER"
]);

// Net worth tier enum - for showcase during onboarding
export const netWorthTierEnum = pgEnum("net_worth_tier", [
  "BUILDING", "SILVER", "GOLD", "PLATINUM", "DIAMOND"
]);

// Gender enum
export const genderEnum = pgEnum("gender", [
  "MALE", "FEMALE", "NON_BINARY", "OTHER", "PREFER_NOT_TO_SAY"
]);

// Creator category enum - 15 options
export const creatorCategoryEnum = pgEnum("creator_category", [
  "INFLUENCER", "ARTIST_MUSICIAN", "PHOTOGRAPHER", "VIDEOGRAPHER", "BLOGGER",
  "DJ_PRODUCER", "COMEDIAN", "PUBLIC_FIGURE", "GAMER_STREAMER", "EDUCATOR",
  "FASHION_MODEL", "FITNESS_COACH", "BEAUTY_MAKEUP", "BUSINESS_CREATOR", "OTHER"
]);

// Business category enum - 16 options
export const businessCategoryEnum = pgEnum("business_category", [
  "LUXURY_BRAND", "RESTAURANT_FOOD", "REAL_ESTATE", "FASHION_CLOTHING", "AUTOMOTIVE",
  "BEAUTY_SALON_SPA", "FINANCE_TRADING", "MEDIA_ENTERTAINMENT", "NIGHTLIFE_CLUB_EVENTS",
  "TECH_SOFTWARE", "EDUCATION", "HEALTH_MEDICAL", "ECOMMERCE_STORE", "SERVICES",
  "AGENCY_MARKETING", "OTHER"
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio").default(""),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  category: userCategoryEnum("category").default("PERSONAL").notNull(),
  location: text("location"),
  linkUrl: text("link_url"),
  netWorth: bigint("net_worth", { mode: "number" }).default(0).notNull(),
  influenceScore: integer("influence_score").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  suspendedAt: timestamp("suspended_at"),
  suspendedUntil: timestamp("suspended_until"),
  suspendedReason: text("suspended_reason"),
  suspendedById: varchar("suspended_by_id"),
  deactivatedAt: timestamp("deactivated_at"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  pronouns: text("pronouns"),
  lastActiveAt: timestamp("last_active_at"),
  birthday: timestamp("birthday"),
  profileSongUrl: text("profile_song_url"),
  profileSongTitle: text("profile_song_title"),
  profileSongArtist: text("profile_song_artist"),
  avatarVideoUrl: text("avatar_video_url"),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").default(false).notNull(),
  voiceBioUrl: text("voice_bio_url"),
  voiceBioDurationMs: integer("voice_bio_duration_ms"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  relationshipStatus: relationshipStatusEnum("relationship_status"),
  relationshipPartnerId: varchar("relationship_partner_id"),
  themeColor: text("theme_color"),
  themeStyle: themeStyleEnum("theme_style").default("DEFAULT"),
  // New profile fields
  customHandle: text("custom_handle").unique(), // Vanity URL like @username
  headline: text("headline"), // Professional headline
  extendedBio: text("extended_bio"), // Longer bio (500 chars)
  timezone: text("timezone"), // User's timezone
  profileEffects: jsonb("profile_effects").default({}), // Custom profile effects
  lastSeenAt: timestamp("last_seen_at"), // For activity status
  // Milestones
  followerMilestone: integer("follower_milestone").default(0), // Last reached milestone
  totalLikesReceived: integer("total_likes_received").default(0),
  totalViewsReceived: integer("total_views_received").default(0),
  // Onboarding fields
  industry: industryEnum("industry"),
  netWorthTier: netWorthTierEnum("net_worth_tier").default("BUILDING"),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingStep: integer("onboarding_step").default(0).notNull(),
  netWorthVisibility: policyEnum("net_worth_visibility").default("EVERYONE"),
  profileVisibility: policyEnum("profile_visibility").default("EVERYONE"),
  firstSessionCompleted: boolean("first_session_completed").default(false).notNull(),
  // Location fields (all account types)
  country: text("country"),
  province: text("province"),
  city: text("city"),
  gender: genderEnum("gender"),
  // Creator-specific fields
  creatorCategory: creatorCategoryEnum("creator_category"),
  portfolioUrl: text("portfolio_url"),
  primaryPlatforms: jsonb("primary_platforms").default([]), // Array of platforms: TikTok, Instagram, YouTube, X
  contentLanguage: text("content_language"),
  contentTags: jsonb("content_tags").default([]), // Array of content focus tags
  hasManagement: boolean("has_management").default(false),
  managementName: text("management_name"),
  showLocationPublicly: boolean("show_location_publicly").default(true),
  // Business-specific fields
  businessCategory: businessCategoryEnum("business_category"),
  dateEstablished: timestamp("date_established"),
  whatsappNumber: text("whatsapp_number"),
  businessHours: jsonb("business_hours").default({}), // Object with day keys and open/close times
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Social auth fields
  authProvider: text("auth_provider").default("email"), // email, google, apple
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  profileComplete: boolean("profile_complete").default(false).notNull(), // For social auth users to complete profile
  // Legal agreement tracking
  termsAcceptedAt: timestamp("terms_accepted_at"),
  privacyAcceptedAt: timestamp("privacy_accepted_at"),
  communityGuidelinesAcceptedAt: timestamp("community_guidelines_accepted_at"),
  legalVersion: text("legal_version"), // Version of agreements accepted (e.g., "1.0")
  marketingOptIn: boolean("marketing_opt_in").default(false), // Optional marketing consent
  
  // End-to-end encryption key pair
  encryptionPublicKey: text("encryption_public_key"), // RSA public key for E2E encryption
  encryptionKeyCreatedAt: timestamp("encryption_key_created_at"),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "followers" }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
}));

export const posts = pgTable("posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: postTypeEnum("type").default("TEXT").notNull(),
  content: text("content"),
  caption: text("caption"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationMs: integer("duration_ms"),
  aspectRatio: real("aspect_ratio"),
  visibility: visibilityEnum("visibility").default("PUBLIC").notNull(),
  commentsEnabled: boolean("comments_enabled").default(true).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  savesCount: integer("saves_count").default(0).notNull(),
  sharesCount: integer("shares_count").default(0).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  hiddenReason: text("hidden_reason"),
  hiddenAt: timestamp("hidden_at"),
  hiddenById: varchar("hidden_by_id"),
  deletedAt: timestamp("deleted_at"),
  deletedById: varchar("deleted_by_id"),
  deleteReason: text("delete_reason"),
  editedAt: timestamp("edited_at"),
  isArchived: boolean("is_archived").default(false).notNull(),
  archivedAt: timestamp("archived_at"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  pinnedAt: timestamp("pinned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("posts_created_at_idx").on(table.createdAt),
  index("posts_author_id_idx").on(table.authorId),
  index("posts_type_created_at_idx").on(table.type, table.createdAt),
  index("posts_author_created_at_idx").on(table.authorId, table.createdAt),
  index("posts_is_pinned_idx").on(table.isPinned, table.authorId),
]);

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
}));

export const comments = pgTable("comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  hiddenReason: text("hidden_reason"),
  hiddenAt: timestamp("hidden_at"),
  hiddenById: varchar("hidden_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const likes = pgTable("likes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("likes_user_post_unique").on(table.userId, table.postId),
  index("likes_post_id_idx").on(table.postId),
]);

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

// ===== SAVED POSTS (Bookmarks) =====

export const savedPosts = pgTable("saved_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("saved_posts_user_post_unique").on(table.userId, table.postId),
  index("saved_posts_user_id_idx").on(table.userId),
  index("saved_posts_post_id_idx").on(table.postId),
]);

export const savedPostsRelations = relations(savedPosts, ({ one }) => ({
  post: one(posts, {
    fields: [savedPosts.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [savedPosts.userId],
    references: [users.id],
  }),
}));

// ===== HIDDEN POSTS (User-specific feed hiding) =====

export const hiddenPosts = pgTable("hidden_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("hidden_posts_user_post_unique").on(table.userId, table.postId),
  index("hidden_posts_user_id_idx").on(table.userId),
]);

export const hiddenPostsRelations = relations(hiddenPosts, ({ one }) => ({
  post: one(posts, {
    fields: [hiddenPosts.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [hiddenPosts.userId],
    references: [users.id],
  }),
}));

// ===== NOT INTERESTED (Algorithm feedback) =====

export const notInterestedPosts = pgTable("not_interested_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("not_interested_user_post_unique").on(table.userId, table.postId),
  index("not_interested_user_id_idx").on(table.userId),
]);

export const notInterestedPostsRelations = relations(notInterestedPosts, ({ one }) => ({
  post: one(posts, {
    fields: [notInterestedPosts.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [notInterestedPosts.userId],
    references: [users.id],
  }),
}));

export const follows = pgTable("follows", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("follows_unique").on(table.followerId, table.followingId),
  index("follows_follower_id_idx").on(table.followerId),
  index("follows_following_id_idx").on(table.followingId),
]);

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "followers",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const conversations = pgTable("conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  participant2Id: varchar("participant2_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("ACCEPTED").notNull(),
  inboxFolder: text("inbox_folder").default("PRIMARY").notNull(),
  requestedByUserId: varchar("requested_by_user_id")
    .references(() => users.id, { onDelete: "set null" }),
  acceptedAt: timestamp("accepted_at"),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("conversations_participants_unique").on(table.participant1Id, table.participant2Id),
]);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(users, {
    fields: [conversations.participant1Id],
    references: [users.id],
  }),
  participant2: one(users, {
    fields: [conversations.participant2Id],
    references: [users.id],
  }),
  messages: many(messages),
}));

// User-specific conversation settings (mute, pin, archive)
export const conversationSettings = pgTable("conversation_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isMuted: boolean("is_muted").default(false).notNull(),
  mutedUntil: timestamp("muted_until"), // null = muted forever
  isPinned: boolean("is_pinned").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  notificationSound: text("notification_sound").default("default"),
  customName: text("custom_name"), // Custom nickname for conversation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("conversation_settings_unique").on(table.conversationId, table.userId),
  index("conversation_settings_user_idx").on(table.userId),
]);

export const messageTypeEnum = pgEnum("message_type", ["TEXT", "PHOTO", "VIDEO", "VOICE", "FILE", "GIF", "STICKER", "LINK"]);

// Message delivery status enum
export const messageStatusEnum = pgEnum("message_status", ["SENDING", "SENT", "DELIVERED", "READ", "FAILED"]);

export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").default("TEXT"),
  
  // End-to-end encryption fields
  encryptedContent: text("encrypted_content"), // Encrypted message content
  encryptedKey: text("encrypted_key"), // Symmetric key encrypted with recipient's public key
  iv: text("iv"), // Initialization vector for decryption
  
  // Delivery status
  status: messageStatusEnum("status").default("SENT"),
  deliveredAt: timestamp("delivered_at"),
  
  // Media fields
  mediaUrl: text("media_url"),
  mediaThumbnail: text("media_thumbnail"),
  mediaDuration: integer("media_duration"),
  
  // File fields
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  fileMimeType: text("file_mime_type"),
  
  // Voice note fields
  voiceWaveform: jsonb("voice_waveform"), // Array of amplitude values for visualization
  
  // Link preview fields
  linkUrl: text("link_url"),
  linkTitle: text("link_title"),
  linkDescription: text("link_description"),
  linkImage: text("link_image"),
  linkDomain: text("link_domain"),
  
  // Reply/quote
  replyToId: varchar("reply_to_id"),
  
  // Read/delete status
  read: boolean("read").default(false).notNull(),
  readAt: timestamp("read_at"),
  deletedAt: timestamp("deleted_at"),
  deletedForSender: boolean("deleted_for_sender").default(false),
  deletedForReceiver: boolean("deleted_for_receiver").default(false),
  
  // Disappearing messages (optional feature)
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("messages_conversation_created_idx").on(table.conversationId, table.createdAt),
  index("messages_reply_to_idx").on(table.replyToId),
  index("messages_status_idx").on(table.status),
]);

export const messageReactions = pgTable("message_reactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  messageId: varchar("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reaction: varchar("reaction", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("message_reactions_unique").on(table.messageId, table.userId),
  index("message_reactions_message_idx").on(table.messageId),
]);

export const userOnlineStatus = pgTable("user_online_status", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  isOnline: boolean("is_online").default(false).notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
});

export const typingIndicators = pgTable("typing_indicators", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isTyping: boolean("is_typing").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("typing_indicators_unique").on(table.conversationId, table.userId),
]);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

// Notification types enum
export const notificationTypeEnum = pgEnum("notification_type", [
  "LIKE", "COMMENT", "FOLLOW", "MESSAGE", "MENTION",
  "VERIFICATION_APPROVED", "VERIFICATION_DENIED", "VERIFICATION_INFO_NEEDED",
  "STORY_MENTION", "STORY_REPLY", "STORY_REACTION", "STORY_STICKER_RESPONSE",
  "AD_CAMPAIGN_ENDED", "AD_LOW_BALANCE", "AD_REFUND_PROCESSED", "AD_DISPUTE_RESOLVED"
]);

// Report status enum
export const reportStatusEnum = pgEnum("report_status", ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]);

// Blocks table - for blocking users
export const blocks = pgTable("blocks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  blockerId: varchar("blocker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  blockedId: varchar("blocked_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("blocks_unique").on(table.blockerId, table.blockedId),
  index("blocks_blocker_id_idx").on(table.blockerId),
  index("blocks_blocked_id_idx").on(table.blockedId),
]);

export const blocksRelations = relations(blocks, ({ one }) => ({
  blocker: one(users, {
    fields: [blocks.blockerId],
    references: [users.id],
    relationName: "blocker",
  }),
  blocked: one(users, {
    fields: [blocks.blockedId],
    references: [users.id],
    relationName: "blocked",
  }),
}));

// Reports table - for reporting users and content
export const reports = pgTable("reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reportedUserId: varchar("reported_user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  reportedPostId: varchar("reported_post_id")
    .references(() => posts.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  status: reportStatusEnum("status").default("PENDING").notNull(),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  resolvedById: varchar("resolved_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("reports_status_idx").on(table.status),
  index("reports_reporter_id_idx").on(table.reporterId),
  index("reports_created_at_idx").on(table.createdAt),
]);

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
    relationName: "reportedUser",
  }),
  reportedPost: one(posts, {
    fields: [reports.reportedPostId],
    references: [posts.id],
  }),
  resolvedBy: one(users, {
    fields: [reports.resolvedById],
    references: [users.id],
    relationName: "resolver",
  }),
}));

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actorId: varchar("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  entityId: varchar("entity_id"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  index("notifications_user_read_idx").on(table.userId, table.readAt),
  index("notifications_created_at_idx").on(table.createdAt),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
    relationName: "recipient",
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
    relationName: "actor",
  }),
}));

// ===== BOOKMARKS =====

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("bookmarks_user_post_unique").on(table.userId, table.postId),
  index("bookmarks_user_id_idx").on(table.userId),
  index("bookmarks_post_id_idx").on(table.postId),
]);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [bookmarks.postId],
    references: [posts.id],
  }),
}));

// ===== SHARES =====

export const shares = pgTable("shares", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  platform: text("platform"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("shares_user_id_idx").on(table.userId),
  index("shares_post_id_idx").on(table.postId),
]);

export const sharesRelations = relations(shares, ({ one }) => ({
  user: one(users, {
    fields: [shares.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [shares.postId],
    references: [posts.id],
  }),
}));

// ===== POST VIEWS =====

export const postViews = pgTable("post_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => [
  unique("post_views_user_post_date_unique").on(table.userId, table.postId),
  index("post_views_user_id_idx").on(table.userId),
  index("post_views_post_id_idx").on(table.postId),
]);

export const postViewsRelations = relations(postViews, ({ one }) => ({
  user: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [postViews.postId],
    references: [posts.id],
  }),
}));

// ===== USER SETTINGS (1:1 with user) =====

export const userSettings = pgTable("user_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  // Account Privacy
  privateAccount: boolean("private_account").default(false).notNull(),
  activityStatusVisible: boolean("activity_status_visible").default(true).notNull(),
  readReceiptsEnabled: boolean("read_receipts_enabled").default(true).notNull(),
  profileViewHistoryEnabled: boolean("profile_view_history_enabled").default(true).notNull(),
  anonymousViewingEnabled: boolean("anonymous_viewing_enabled").default(false).notNull(),
  hideLikesTab: boolean("hide_likes_tab").default(false).notNull(),
  tagApprovalRequired: boolean("tag_approval_required").default(false).notNull(),
  searchEngineVisible: boolean("search_engine_visible").default(true).notNull(),
  emailDiscoverable: boolean("email_discoverable").default(false).notNull(),
  phoneDiscoverable: boolean("phone_discoverable").default(false).notNull(),
  // Content Policies
  commentPolicy: policyEnum("comment_policy").default("EVERYONE").notNull(),
  messagePolicy: policyEnum("message_policy").default("EVERYONE").notNull(),
  mentionPolicy: policyEnum("mention_policy").default("EVERYONE").notNull(),
  storyViewPolicy: policyEnum("story_view_policy").default("FOLLOWERS").notNull(),
  followersListVisibility: policyEnum("followers_list_visibility").default("EVERYONE").notNull(),
  followingListVisibility: policyEnum("following_list_visibility").default("EVERYONE").notNull(),
  // Push Notifications
  pushNotifications: jsonb("push_notifications").default({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    mentions: true,
    storyViews: false,
    profileViews: false,
    newFollowers: true,
    liveVideos: true,
    promotions: false,
  }).notNull(),
  // Email Notifications
  emailNotifications: jsonb("email_notifications").default({
    weeklyDigest: true,
    newFollowers: false,
    messages: false,
    mentions: false,
    productUpdates: true,
    securityAlerts: true,
  }).notNull(),
  // Quiet Hours / Do Not Disturb
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
  quietHoursStart: text("quiet_hours_start"), // "22:00" format
  quietHoursEnd: text("quiet_hours_end"), // "07:00" format
  quietHoursTimezone: text("quiet_hours_timezone"),
  // Content Preferences
  contentPreferences: jsonb("content_preferences").default({
    showSensitiveContent: false,
    autoTranslate: true,
    prioritizeFollowing: true,
  }).notNull(),
  sensitiveContentFilter: boolean("sensitive_content_filter").default(true).notNull(),
  // Security
  loginAlertsEnabled: boolean("login_alerts_enabled").default(true).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  // Accessibility
  fontSizePreference: fontSizeEnum("font_size_preference").default("MEDIUM").notNull(),
  // Legacy (keeping for compatibility)
  notifications: jsonb("notifications").default({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    mentions: true,
  }).notNull(),
  mediaPrefs: jsonb("media_prefs").default({
    autoplay: true,
    dataSaver: false,
    uploadQuality: "high",
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// ===== VERIFICATION REQUESTS =====

export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  category: verificationCategoryEnum("category").notNull(),
  documentUrls: jsonb("document_urls").default([]).notNull(),
  links: jsonb("links").default([]).notNull(),
  reason: text("reason").notNull(),
  status: verificationStatusEnum("status").default("SUBMITTED").notNull(),
  adminNotes: text("admin_notes"),
  denialReason: text("denial_reason"),
  reviewedById: varchar("reviewed_by_id"),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("verification_requests_user_id_idx").on(table.userId),
  index("verification_requests_status_idx").on(table.status),
  index("verification_requests_submitted_at_idx").on(table.submittedAt),
]);

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  user: one(users, {
    fields: [verificationRequests.userId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [verificationRequests.reviewedById],
    references: [users.id],
  }),
}));

// ===== STUDIO ANALYTICS =====

// Traffic source enum - where views come from
export const trafficSourceEnum = pgEnum("traffic_source", ["FEED", "PROFILE", "SEARCH", "SHARE", "DIRECT", "OTHER"]);

// Profile views table
export const profileViews = pgTable("profile_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  profileUserId: varchar("profile_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  viewerId: varchar("viewer_id")
    .references(() => users.id, { onDelete: "set null" }),
  source: trafficSourceEnum("source").default("DIRECT").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => [
  index("profile_views_profile_user_id_idx").on(table.profileUserId),
  index("profile_views_viewed_at_idx").on(table.viewedAt),
  index("profile_views_profile_date_idx").on(table.profileUserId, table.viewedAt),
]);

export const profileViewsRelations = relations(profileViews, ({ one }) => ({
  profileUser: one(users, {
    fields: [profileViews.profileUserId],
    references: [users.id],
  }),
  viewer: one(users, {
    fields: [profileViews.viewerId],
    references: [users.id],
  }),
}));

// Watch events for video/voice content (tracks watch time)
export const watchEvents = pgTable("watch_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  watchTimeMs: integer("watch_time_ms").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  source: trafficSourceEnum("source").default("FEED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("watch_events_post_id_idx").on(table.postId),
  index("watch_events_user_id_idx").on(table.userId),
  index("watch_events_created_at_idx").on(table.createdAt),
  index("watch_events_post_date_idx").on(table.postId, table.createdAt),
]);

export const watchEventsRelations = relations(watchEvents, ({ one }) => ({
  user: one(users, {
    fields: [watchEvents.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [watchEvents.postId],
    references: [posts.id],
  }),
}));

// Daily user analytics rollup
export const dailyUserAnalytics = pgTable("daily_user_analytics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  profileViews: integer("profile_views").default(0).notNull(),
  postViews: integer("post_views").default(0).notNull(),
  likesReceived: integer("likes_received").default(0).notNull(),
  commentsReceived: integer("comments_received").default(0).notNull(),
  sharesReceived: integer("shares_received").default(0).notNull(),
  savesReceived: integer("saves_received").default(0).notNull(),
  newFollowers: integer("new_followers").default(0).notNull(),
  unfollows: integer("unfollows").default(0).notNull(),
  totalWatchTimeMs: integer("total_watch_time_ms").default(0).notNull(),
  sourceFromFeed: integer("source_from_feed").default(0).notNull(),
  sourceFromProfile: integer("source_from_profile").default(0).notNull(),
  sourceFromSearch: integer("source_from_search").default(0).notNull(),
  sourceFromShare: integer("source_from_share").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("daily_user_analytics_user_date_unique").on(table.userId, table.date),
  index("daily_user_analytics_user_id_idx").on(table.userId),
  index("daily_user_analytics_date_idx").on(table.date),
]);

export const dailyUserAnalyticsRelations = relations(dailyUserAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [dailyUserAnalytics.userId],
    references: [users.id],
  }),
}));

// Daily post analytics rollup
export const dailyPostAnalytics = pgTable("daily_post_analytics", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  views: integer("views").default(0).notNull(),
  uniqueViews: integer("unique_views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  comments: integer("comments").default(0).notNull(),
  shares: integer("shares").default(0).notNull(),
  saves: integer("saves").default(0).notNull(),
  totalWatchTimeMs: integer("total_watch_time_ms").default(0).notNull(),
  avgWatchTimeMs: integer("avg_watch_time_ms").default(0).notNull(),
  completions: integer("completions").default(0).notNull(),
  sourceFromFeed: integer("source_from_feed").default(0).notNull(),
  sourceFromProfile: integer("source_from_profile").default(0).notNull(),
  sourceFromSearch: integer("source_from_search").default(0).notNull(),
  sourceFromShare: integer("source_from_share").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("daily_post_analytics_post_date_unique").on(table.postId, table.date),
  index("daily_post_analytics_post_id_idx").on(table.postId),
  index("daily_post_analytics_date_idx").on(table.date),
]);

export const dailyPostAnalyticsRelations = relations(dailyPostAnalytics, ({ one }) => ({
  post: one(posts, {
    fields: [dailyPostAnalytics.postId],
    references: [posts.id],
  }),
}));

// ===== PLAYLISTS (for video/voice content) =====

export const playlists = pgTable("playlists", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  type: playlistTypeEnum("type").notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("playlists_user_id_idx").on(table.userId),
  index("playlists_type_idx").on(table.type),
]);

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  items: many(playlistItems),
}));

// ===== PLAYLIST ITEMS =====

export const playlistItems = pgTable("playlist_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id")
    .notNull()
    .references(() => playlists.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("playlist_items_playlist_post_unique").on(table.playlistId, table.postId),
  index("playlist_items_playlist_id_idx").on(table.playlistId),
  index("playlist_items_order_idx").on(table.playlistId, table.order),
]);

export const playlistItemsRelations = relations(playlistItems, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistItems.playlistId],
    references: [playlists.id],
  }),
  post: one(posts, {
    fields: [playlistItems.postId],
    references: [posts.id],
  }),
}));

// ===== FEATURED INTRO (1:1 with user) =====

export const featuredIntros = pgTable("featured_intros", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  body: text("body").notNull(),
  ctaText: varchar("cta_text", { length: 50 }),
  ctaUrl: text("cta_url"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const featuredIntrosRelations = relations(featuredIntros, ({ one }) => ({
  user: one(users, {
    fields: [featuredIntros.userId],
    references: [users.id],
  }),
}));

// ===== PINS (max 3 per user, enforced in app logic) =====

export const pins = pgTable("pins", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("pins_user_post_unique").on(table.userId, table.postId),
  index("pins_user_id_idx").on(table.userId),
  index("pins_order_idx").on(table.userId, table.order),
]);

export const pinsRelations = relations(pins, ({ one }) => ({
  user: one(users, {
    fields: [pins.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [pins.postId],
    references: [posts.id],
  }),
}));

// ===== STORIES =====

export const storyTypeEnum = pgEnum("story_type", ["PHOTO", "VIDEO", "TEXT", "VOICE", "SHARED_POST"]);

// Story styling enums
export const storyFontEnum = pgEnum("story_font", ["MODERN", "SERIF", "HANDWRITTEN", "BOLD", "LUXURY"]);
export const storyTextAlignEnum = pgEnum("story_text_align", ["LEFT", "CENTER", "RIGHT"]);
export const storyTextAnimationEnum = pgEnum("story_text_animation", ["NONE", "TYPEWRITER", "FADE", "BOUNCE", "GLOW", "SPARKLE", "RAINBOW"]);
export const storyReplySettingEnum = pgEnum("story_reply_setting", ["ALL", "FOLLOWERS", "CLOSE_FRIENDS", "OFF"]);
export const storyStickerTypeEnum = pgEnum("story_sticker_type", [
  "POLL", "QUESTION", "SLIDER", "QUIZ", "COUNTDOWN", "LOCATION", "TIME", "LINK", 
  "MENTION", "HASHTAG", "GIF", "SHOPPING", "TIP"
]);
export const storyReactionTypeEnum = pgEnum("story_reaction_type", ["FIRE", "HEART", "LAUGH", "WOW", "SAD", "CLAP"]);

export const stories = pgTable("stories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: storyTypeEnum("type").notNull(),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationMs: integer("duration_ms"),
  caption: text("caption"),
  viewsCount: integer("views_count").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Text story fields
  textContent: text("text_content"),
  backgroundColor: text("background_color"),
  isGradient: boolean("is_gradient").default(false),
  gradientColors: jsonb("gradient_colors"),
  fontFamily: storyFontEnum("font_family").default("MODERN"),
  textAlignment: storyTextAlignEnum("text_alignment").default("CENTER"),
  textAnimation: storyTextAnimationEnum("text_animation").default("NONE"),
  textBackgroundPill: boolean("text_background_pill").default(false),
  fontSize: integer("font_size").default(24),
  
  // Voice story fields
  audioUrl: text("audio_url"),
  audioDuration: integer("audio_duration"),
  audioTranscript: text("audio_transcript"),
  
  // Music overlay
  musicUrl: text("music_url"),
  musicTitle: text("music_title"),
  musicArtist: text("music_artist"),
  musicStartTime: integer("music_start_time"),
  musicDuration: integer("music_duration"),
  
  // Filters & effects
  filterName: text("filter_name"),
  
  // Text overlays (for photo/video stories)
  textOverlays: jsonb("text_overlays"),
  
  // Drawing data
  drawings: jsonb("drawings"),
  
  // Settings
  isCloseFriends: boolean("is_close_friends").default(false),
  replySetting: storyReplySettingEnum("reply_setting").default("ALL"),
  scheduledAt: timestamp("scheduled_at"),
  
  // Location
  locationName: text("location_name"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  
  // Reshare (for story resharing)
  resharedFromId: varchar("reshared_from_id"),
  reshareComment: text("reshare_comment"),
  
  // Shared Post (for sharing feed posts to story - Instagram-style)
  sharedPostId: varchar("shared_post_id"),
  
  // Stats
  reactionsCount: integer("reactions_count").default(0).notNull(),
  repliesCount: integer("replies_count").default(0).notNull(),
  sharesCount: integer("shares_count").default(0).notNull(),
  tapsForwardCount: integer("taps_forward_count").default(0).notNull(),
  tapsBackCount: integer("taps_back_count").default(0).notNull(),
  exitsCount: integer("exits_count").default(0).notNull(),
}, (table) => [
  index("stories_user_id_idx").on(table.userId),
  index("stories_expires_at_idx").on(table.expiresAt),
  index("stories_user_created_idx").on(table.userId, table.createdAt),
  index("stories_type_idx").on(table.type),
  index("stories_close_friends_idx").on(table.isCloseFriends),
]);

export const storiesRelations = relations(stories, ({ one, many }) => ({
  user: one(users, {
    fields: [stories.userId],
    references: [users.id],
  }),
  views: many(storyViews),
}));

export const storyViews = pgTable("story_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: varchar("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  viewerId: varchar("viewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => [
  unique("story_views_unique").on(table.storyId, table.viewerId),
  index("story_views_story_id_idx").on(table.storyId),
  index("story_views_viewer_id_idx").on(table.viewerId),
]);

export const storyViewsRelations = relations(storyViews, ({ one }) => ({
  story: one(stories, {
    fields: [storyViews.storyId],
    references: [stories.id],
  }),
  viewer: one(users, {
    fields: [storyViews.viewerId],
    references: [users.id],
  }),
}));

// ===== STORY HIGHLIGHTS =====

export const storyHighlights = pgTable("story_highlights", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  coverUrl: text("cover_url"),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("story_highlights_user_id_idx").on(table.userId),
  index("story_highlights_order_idx").on(table.userId, table.order),
]);

export const storyHighlightItems = pgTable("story_highlight_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  highlightId: varchar("highlight_id")
    .notNull()
    .references(() => storyHighlights.id, { onDelete: "cascade" }),
  storyId: varchar("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  order: integer("order").default(0).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
}, (table) => [
  unique("highlight_story_unique").on(table.highlightId, table.storyId),
  index("story_highlight_items_highlight_idx").on(table.highlightId),
]);

export const storyHighlightsRelations = relations(storyHighlights, ({ one, many }) => ({
  user: one(users, {
    fields: [storyHighlights.userId],
    references: [users.id],
  }),
  items: many(storyHighlightItems),
}));

export const storyHighlightItemsRelations = relations(storyHighlightItems, ({ one }) => ({
  highlight: one(storyHighlights, {
    fields: [storyHighlightItems.highlightId],
    references: [storyHighlights.id],
  }),
  story: one(stories, {
    fields: [storyHighlightItems.storyId],
    references: [stories.id],
  }),
}));

// ===== STORY STICKERS =====

export const storyStickers = pgTable("story_stickers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: varchar("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  type: storyStickerTypeEnum("type").notNull(),
  positionX: real("position_x").default(0.5).notNull(),
  positionY: real("position_y").default(0.5).notNull(),
  scale: real("scale").default(1).notNull(),
  rotation: real("rotation").default(0).notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_stickers_story_id_idx").on(table.storyId),
]);

export const storyStickersRelations = relations(storyStickers, ({ one, many }) => ({
  story: one(stories, {
    fields: [storyStickers.storyId],
    references: [stories.id],
  }),
  responses: many(storyStickerResponses),
}));

// ===== STORY STICKER RESPONSES =====

export const storyStickerResponses = pgTable("story_sticker_responses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  stickerId: varchar("sticker_id")
    .notNull()
    .references(() => storyStickers.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  responseType: text("response_type").notNull(),
  responseData: jsonb("response_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_sticker_responses_sticker_id_idx").on(table.stickerId),
  index("story_sticker_responses_user_id_idx").on(table.userId),
  unique("story_sticker_response_unique").on(table.stickerId, table.userId),
]);

export const storyStickerResponsesRelations = relations(storyStickerResponses, ({ one }) => ({
  sticker: one(storyStickers, {
    fields: [storyStickerResponses.stickerId],
    references: [storyStickers.id],
  }),
  user: one(users, {
    fields: [storyStickerResponses.userId],
    references: [users.id],
  }),
}));

// ===== STORY REACTIONS (Quick emoji while viewing) =====

export const storyReactions = pgTable("story_reactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: varchar("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reactionType: storyReactionTypeEnum("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_reactions_story_id_idx").on(table.storyId),
  index("story_reactions_user_id_idx").on(table.userId),
  unique("story_reaction_unique").on(table.storyId, table.userId),
]);

export const storyReactionsRelations = relations(storyReactions, ({ one }) => ({
  story: one(stories, {
    fields: [storyReactions.storyId],
    references: [stories.id],
  }),
  user: one(users, {
    fields: [storyReactions.userId],
    references: [users.id],
  }),
}));

// ===== STORY REPLIES =====

export const storyReplies = pgTable("story_replies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: varchar("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_replies_story_id_idx").on(table.storyId),
  index("story_replies_user_id_idx").on(table.userId),
]);

export const storyRepliesRelations = relations(storyReplies, ({ one }) => ({
  story: one(stories, {
    fields: [storyReplies.storyId],
    references: [stories.id],
  }),
  user: one(users, {
    fields: [storyReplies.userId],
    references: [users.id],
  }),
}));

// ===== STORY DRAFTS =====

export const storyDrafts = pgTable("story_drafts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: storyTypeEnum("type").notNull(),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  textContent: text("text_content"),
  backgroundColor: text("background_color"),
  isGradient: boolean("is_gradient").default(false),
  gradientColors: jsonb("gradient_colors"),
  fontFamily: storyFontEnum("font_family").default("MODERN"),
  textAlignment: storyTextAlignEnum("text_alignment").default("CENTER"),
  textAnimation: storyTextAnimationEnum("text_animation").default("NONE"),
  fontSize: integer("font_size").default(24),
  audioUrl: text("audio_url"),
  audioDuration: integer("audio_duration"),
  musicUrl: text("music_url"),
  musicTitle: text("music_title"),
  musicArtist: text("music_artist"),
  filterName: text("filter_name"),
  textOverlays: jsonb("text_overlays"),
  drawings: jsonb("drawings"),
  stickers: jsonb("stickers"),
  isCloseFriends: boolean("is_close_friends").default(false),
  replySetting: storyReplySettingEnum("reply_setting").default("ALL"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("story_drafts_user_id_idx").on(table.userId),
]);

export const storyDraftsRelations = relations(storyDrafts, ({ one }) => ({
  user: one(users, {
    fields: [storyDrafts.userId],
    references: [users.id],
  }),
}));

// ===== STORY INSIGHTS =====

export const storyInsights = pgTable("story_insights", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: varchar("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  viewerId: varchar("viewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  viewDuration: integer("view_duration"),
  tappedForward: boolean("tapped_forward").default(false),
  tappedBack: boolean("tapped_back").default(false),
  exited: boolean("exited").default(false),
  shared: boolean("shared").default(false),
  profileVisited: boolean("profile_visited").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_insights_story_id_idx").on(table.storyId),
  index("story_insights_viewer_id_idx").on(table.viewerId),
  unique("story_insights_unique").on(table.storyId, table.viewerId),
]);

export const storyInsightsRelations = relations(storyInsights, ({ one }) => ({
  story: one(stories, {
    fields: [storyInsights.storyId],
    references: [stories.id],
  }),
  viewer: one(users, {
    fields: [storyInsights.viewerId],
    references: [users.id],
  }),
}));

// ===== STORY STREAKS =====

export const storyStreaks = pgTable("story_streaks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastStoryAt: timestamp("last_story_at"),
  streakStartedAt: timestamp("streak_started_at"),
  milestone7Claimed: boolean("milestone_7_claimed").default(false),
  milestone30Claimed: boolean("milestone_30_claimed").default(false),
  milestone100Claimed: boolean("milestone_100_claimed").default(false),
  milestone365Claimed: boolean("milestone_365_claimed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("story_streaks_user_id_idx").on(table.userId),
]);

export const storyStreaksRelations = relations(storyStreaks, ({ one }) => ({
  user: one(users, {
    fields: [storyStreaks.userId],
    references: [users.id],
  }),
}));

// ===== STORY TEMPLATES =====

export const storyTemplates = pgTable("story_templates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  backgroundColor: text("background_color"),
  isGradient: boolean("is_gradient").default(false),
  gradientColors: jsonb("gradient_colors"),
  fontFamily: storyFontEnum("font_family").default("MODERN"),
  textAlignment: storyTextAlignEnum("text_alignment").default("CENTER"),
  textAnimation: storyTextAnimationEnum("text_animation").default("NONE"),
  fontSize: integer("font_size").default(24),
  filterName: text("filter_name"),
  stickerPresets: jsonb("sticker_presets"),
  isActive: boolean("is_active").default(true).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("story_templates_category_idx").on(table.category),
  index("story_templates_active_idx").on(table.isActive),
]);

// ===== STORY MUSIC LIBRARY =====

export const storyMusicLibrary = pgTable("story_music_library", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  genre: text("genre"),
  duration: integer("duration").notNull(),
  previewUrl: text("preview_url").notNull(),
  fullUrl: text("full_url"),
  coverUrl: text("cover_url"),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_music_library_genre_idx").on(table.genre),
  index("story_music_library_featured_idx").on(table.isFeatured),
]);

// ===== STORY TIPS =====

export const storyTips = pgTable("story_tips", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  storyId: varchar("story_id")
    .notNull()
    .references(() => stories.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_tips_story_id_idx").on(table.storyId),
  index("story_tips_sender_id_idx").on(table.senderId),
  index("story_tips_recipient_id_idx").on(table.recipientId),
]);

export const storyTipsRelations = relations(storyTips, ({ one }) => ({
  story: one(stories, {
    fields: [storyTips.storyId],
    references: [stories.id],
  }),
  sender: one(users, {
    fields: [storyTips.senderId],
    references: [users.id],
    relationName: "tipSender",
  }),
  recipient: one(users, {
    fields: [storyTips.recipientId],
    references: [users.id],
    relationName: "tipRecipient",
  }),
}));

// ===== STORY COUNTDOWN SUBSCRIPTIONS =====

export const storyCountdownSubscriptions = pgTable("story_countdown_subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  stickerId: varchar("sticker_id")
    .notNull()
    .references(() => storyStickers.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  notified: boolean("notified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("story_countdown_subscriptions_sticker_id_idx").on(table.stickerId),
  unique("story_countdown_subscription_unique").on(table.stickerId, table.userId),
]);

// ===== USER NOTES (24h Status) =====

export const userNotes = pgTable("user_notes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("user_notes_user_id_idx").on(table.userId),
  index("user_notes_expires_at_idx").on(table.expiresAt),
]);

export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(users, {
    fields: [userNotes.userId],
    references: [users.id],
  }),
}));

// ===== USER LINKS (Multiple Links) =====

export const userLinks = pgTable("user_links", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  iconType: linkIconTypeEnum("icon_type").default("LINK").notNull(),
  order: integer("order").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("user_links_user_id_idx").on(table.userId),
  index("user_links_order_idx").on(table.userId, table.order),
]);

export const userLinksRelations = relations(userLinks, ({ one }) => ({
  user: one(users, {
    fields: [userLinks.userId],
    references: [users.id],
  }),
}));

// ===== INTEREST CATEGORIES (Predefined luxury categories for onboarding) =====

export const interestCategories = pgTable("interest_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Feather icon name
  color: varchar("color", { length: 20 }), // Hex color for UI
  gradientColors: jsonb("gradient_colors").default([]), // For animated backgrounds
  order: integer("order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("interest_categories_order_idx").on(table.order),
  index("interest_categories_active_idx").on(table.isActive),
]);

// ===== USER INTERESTS (Links users to interest categories) =====

export const userInterests = pgTable("user_interests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id")
    .references(() => interestCategories.id, { onDelete: "cascade" }),
  interest: text("interest").notNull(), // Category slug or custom interest
  affinityScore: real("affinity_score").default(1.0).notNull(), // 0-10 scale, learned from engagement
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("user_interest_unique").on(table.userId, table.interest),
  index("user_interests_user_id_idx").on(table.userId),
  index("user_interests_category_idx").on(table.categoryId),
  index("user_interests_affinity_idx").on(table.affinityScore),
]);

export const userInterestsRelations = relations(userInterests, ({ one }) => ({
  user: one(users, {
    fields: [userInterests.userId],
    references: [users.id],
  }),
  category: one(interestCategories, {
    fields: [userInterests.categoryId],
    references: [interestCategories.id],
  }),
}));

// ===== CONTENT CATEGORIES (AI-assigned categories to posts) =====

export const contentCategories = pgTable("content_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id")
    .references(() => interestCategories.id, { onDelete: "cascade" }),
  categorySlug: varchar("category_slug", { length: 50 }).notNull(),
  confidence: real("confidence").default(0.5).notNull(), // 0-1 confidence score
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
  analyzedBy: varchar("analyzed_by", { length: 20 }).default("gemini"), // AI model used
}, (table) => [
  unique("content_category_unique").on(table.postId, table.categorySlug),
  index("content_categories_post_idx").on(table.postId),
  index("content_categories_category_idx").on(table.categoryId),
  index("content_categories_slug_idx").on(table.categorySlug),
]);

export const contentCategoriesRelations = relations(contentCategories, ({ one }) => ({
  post: one(posts, {
    fields: [contentCategories.postId],
    references: [posts.id],
  }),
  category: one(interestCategories, {
    fields: [contentCategories.categoryId],
    references: [interestCategories.id],
  }),
}));

// ===== LOGIN SESSIONS (Login History) =====

export const loginSessions = pgTable("login_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull(),
  deviceName: text("device_name"),
  deviceType: text("device_type"), // mobile, desktop, tablet
  browser: text("browser"),
  os: text("os"),
  ipAddress: text("ip_address"),
  location: text("location"), // City, Country
  isTrusted: boolean("is_trusted").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("login_sessions_user_id_idx").on(table.userId),
  index("login_sessions_token_idx").on(table.sessionToken),
  index("login_sessions_active_idx").on(table.userId, table.isActive),
]);

export const loginSessionsRelations = relations(loginSessions, ({ one }) => ({
  user: one(users, {
    fields: [loginSessions.userId],
    references: [users.id],
  }),
}));

// ===== TRUSTED DEVICES =====

export const trustedDevices = pgTable("trusted_devices", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id").notNull(), // Unique device identifier
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type"),
  browser: text("browser"),
  os: text("os"),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("trusted_device_user_device_unique").on(table.userId, table.deviceId),
  index("trusted_devices_user_id_idx").on(table.userId),
]);

export const trustedDevicesRelations = relations(trustedDevices, ({ one }) => ({
  user: one(users, {
    fields: [trustedDevices.userId],
    references: [users.id],
  }),
}));

// ===== RESTRICTED ACCOUNTS (Limited interaction, not blocked) =====

export const restrictedAccounts = pgTable("restricted_accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restrictedUserId: varchar("restricted_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("restricted_unique").on(table.userId, table.restrictedUserId),
  index("restricted_accounts_user_id_idx").on(table.userId),
]);

export const restrictedAccountsRelations = relations(restrictedAccounts, ({ one }) => ({
  user: one(users, {
    fields: [restrictedAccounts.userId],
    references: [users.id],
    relationName: "restricter",
  }),
  restrictedUser: one(users, {
    fields: [restrictedAccounts.restrictedUserId],
    references: [users.id],
    relationName: "restricted",
  }),
}));

// ===== MUTED ACCOUNTS =====

export const mutedAccounts = pgTable("muted_accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mutedUserId: varchar("muted_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mutePosts: boolean("mute_posts").default(true).notNull(),
  muteStories: boolean("mute_stories").default(true).notNull(),
  muteMessages: boolean("mute_messages").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("muted_unique").on(table.userId, table.mutedUserId),
  index("muted_accounts_user_id_idx").on(table.userId),
]);

export const mutedAccountsRelations = relations(mutedAccounts, ({ one }) => ({
  user: one(users, {
    fields: [mutedAccounts.userId],
    references: [users.id],
    relationName: "muter",
  }),
  mutedUser: one(users, {
    fields: [mutedAccounts.mutedUserId],
    references: [users.id],
    relationName: "muted",
  }),
}));

// ===== KEYWORD FILTERS =====

export const keywordFilters = pgTable("keyword_filters", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  filterComments: boolean("filter_comments").default(true).notNull(),
  filterMessages: boolean("filter_messages").default(true).notNull(),
  filterPosts: boolean("filter_posts").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("keyword_filter_unique").on(table.userId, table.keyword),
  index("keyword_filters_user_id_idx").on(table.userId),
]);

export const keywordFiltersRelations = relations(keywordFilters, ({ one }) => ({
  user: one(users, {
    fields: [keywordFilters.userId],
    references: [users.id],
  }),
}));

// ===== DRAFTS =====

export const drafts = pgTable("drafts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: postTypeEnum("type").default("TEXT").notNull(),
  content: text("content"),
  caption: text("caption"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationMs: integer("duration_ms"),
  aspectRatio: real("aspect_ratio"),
  visibility: visibilityEnum("visibility").default("PUBLIC").notNull(),
  commentsEnabled: boolean("comments_enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("drafts_user_id_idx").on(table.userId),
  index("drafts_updated_at_idx").on(table.userId, table.updatedAt),
]);

export const draftsRelations = relations(drafts, ({ one }) => ({
  user: one(users, {
    fields: [drafts.userId],
    references: [users.id],
  }),
}));

// ===== SCHEDULED POSTS =====

export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: postTypeEnum("type").default("TEXT").notNull(),
  content: text("content"),
  caption: text("caption"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationMs: integer("duration_ms"),
  aspectRatio: real("aspect_ratio"),
  visibility: visibilityEnum("visibility").default("PUBLIC").notNull(),
  commentsEnabled: boolean("comments_enabled").default(true).notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: scheduledStatusEnum("status").default("PENDING").notNull(),
  publishedPostId: varchar("published_post_id")
    .references(() => posts.id, { onDelete: "set null" }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("scheduled_posts_user_id_idx").on(table.userId),
  index("scheduled_posts_scheduled_for_idx").on(table.scheduledFor),
  index("scheduled_posts_status_idx").on(table.status, table.scheduledFor),
]);

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  user: one(users, {
    fields: [scheduledPosts.userId],
    references: [users.id],
  }),
  publishedPost: one(posts, {
    fields: [scheduledPosts.publishedPostId],
    references: [posts.id],
  }),
}));

// ===== POST COLLABORATORS (Co-Authors) =====

export const postCollaborators = pgTable("post_collaborators", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(), // pending, accepted, declined
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
}, (table) => [
  unique("post_collaborator_unique").on(table.postId, table.userId),
  index("post_collaborators_post_id_idx").on(table.postId),
  index("post_collaborators_user_id_idx").on(table.userId),
]);

export const postCollaboratorsRelations = relations(postCollaborators, ({ one }) => ({
  post: one(posts, {
    fields: [postCollaborators.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postCollaborators.userId],
    references: [users.id],
  }),
}));

// ===== ADMIN USER NOTES =====

export const adminUserNotes = pgTable("admin_user_notes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("admin_user_notes_user_id_idx").on(table.userId),
  index("admin_user_notes_admin_id_idx").on(table.adminId),
]);

export const adminUserNotesRelations = relations(adminUserNotes, ({ one }) => ({
  user: one(users, {
    fields: [adminUserNotes.userId],
    references: [users.id],
    relationName: "targetUser",
  }),
  admin: one(users, {
    fields: [adminUserNotes.adminId],
    references: [users.id],
    relationName: "noteAuthor",
  }),
}));

// ===== CLOSE FRIENDS =====

export const closeFriends = pgTable("close_friends", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  friendId: varchar("friend_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("close_friend_unique").on(table.userId, table.friendId),
  index("close_friends_user_id_idx").on(table.userId),
]);

export const closeFriendsRelations = relations(closeFriends, ({ one }) => ({
  user: one(users, {
    fields: [closeFriends.userId],
    references: [users.id],
    relationName: "owner",
  }),
  friend: one(users, {
    fields: [closeFriends.friendId],
    references: [users.id],
    relationName: "friend",
  }),
}));

// ===== STORY VIEWER RESTRICTIONS (Hide stories from specific users) =====

export const storyViewerRestrictions = pgTable("story_viewer_restrictions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  restrictedViewerId: varchar("restricted_viewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("story_viewer_restriction_unique").on(table.userId, table.restrictedViewerId),
  index("story_viewer_restrictions_user_id_idx").on(table.userId),
]);

export const storyViewerRestrictionsRelations = relations(storyViewerRestrictions, ({ one }) => ({
  user: one(users, {
    fields: [storyViewerRestrictions.userId],
    references: [users.id],
    relationName: "storyOwner",
  }),
  restrictedViewer: one(users, {
    fields: [storyViewerRestrictions.restrictedViewerId],
    references: [users.id],
    relationName: "restrictedViewer",
  }),
}));

// ===== DATA EXPORT REQUESTS =====

export const dataExportRequests = pgTable("data_export_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: exportStatusEnum("status").default("PENDING").notNull(),
  includeProfile: boolean("include_profile").default(true).notNull(),
  includePosts: boolean("include_posts").default(true).notNull(),
  includeMessages: boolean("include_messages").default(true).notNull(),
  includeMedia: boolean("include_media").default(false).notNull(),
  downloadUrl: text("download_url"),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("data_export_requests_user_id_idx").on(table.userId),
  index("data_export_requests_status_idx").on(table.status),
]);

export const dataExportRequestsRelations = relations(dataExportRequests, ({ one }) => ({
  user: one(users, {
    fields: [dataExportRequests.userId],
    references: [users.id],
  }),
}));

// ===== PENDING TAG APPROVALS =====

export const pendingTagApprovals = pgTable("pending_tag_approvals", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  taggedById: varchar("tagged_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(), // pending, approved, declined
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
}, (table) => [
  unique("pending_tag_unique").on(table.userId, table.postId),
  index("pending_tag_approvals_user_id_idx").on(table.userId),
]);

export const pendingTagApprovalsRelations = relations(pendingTagApprovals, ({ one }) => ({
  user: one(users, {
    fields: [pendingTagApprovals.userId],
    references: [users.id],
    relationName: "taggedUser",
  }),
  post: one(posts, {
    fields: [pendingTagApprovals.postId],
    references: [posts.id],
  }),
  taggedBy: one(users, {
    fields: [pendingTagApprovals.taggedById],
    references: [users.id],
    relationName: "tagger",
  }),
}));

// ===== RBAC SYSTEM =====

// Roles table - defines available roles in the system
export const roles = pgTable("roles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  description: text("description"),
  level: integer("level").default(0).notNull(), // Higher = more authority
  isSystem: boolean("is_system").default(false).notNull(), // Cannot be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Permissions table - defines all available permissions
export const permissions = pgTable("permissions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(), // e.g., "users.view", "posts.delete"
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  group: varchar("group", { length: 50 }).notNull(), // e.g., "users", "posts", "reports"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Role-Permission junction table
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  roleId: varchar("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("role_permission_unique").on(table.roleId, table.permissionId),
  index("role_permissions_role_id_idx").on(table.roleId),
]);

// User-Role junction table
export const userRoles = pgTable("user_roles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("user_role_unique").on(table.userId, table.roleId),
  index("user_roles_user_id_idx").on(table.userId),
]);

// Audit action enum
export const auditActionEnum = pgEnum("audit_action", [
  "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", 
  "ROLE_ASSIGNED", "ROLE_REMOVED", "PERMISSION_GRANTED", "PERMISSION_REVOKED",
  "USER_SUSPENDED", "USER_ACTIVATED", "USER_FORCE_LOGOUT", "USER_DEACTIVATED", "USER_REACTIVATED",
  "USER_BANNED", "USER_UNBANNED",
  "CONTENT_HIDDEN", "CONTENT_UNHIDDEN", "CONTENT_SOFT_DELETED", "FEATURED_REMOVED",
  "REPORT_RESOLVED", "SETTING_CHANGED", "SETTINGS_UPDATED",
  "USER_PROFILE_EDITED", "USER_PASSWORD_RESET", "USER_IMPERSONATED",
  "USER_NOTE_ADDED", "MASS_ACTION_PERFORMED", "DATA_EXPORTED", "DATA_IMPORTED",
  "AR_FILTER_CREATED", "AR_FILTER_UPDATED", "AR_FILTER_FEATURED", "AR_FILTER_UNFEATURED",
  "AR_FILTER_ENABLED", "AR_FILTER_DISABLED", "AR_FILTER_DELETED",
  "AI_AVATAR_APPROVED", "AI_AVATAR_REJECTED", "AI_AVATAR_DELETED",
  "EXPLORE_CATEGORY_CREATED", "EXPLORE_CATEGORY_UPDATED", "EXPLORE_CATEGORY_DELETED",
  "ADMIN_UPDATE_GROUP_SETTINGS", "ADMIN_REMOVE_GROUP_MEMBER", "ADMIN_APPROVE_JOIN_REQUEST",
  "ADMIN_REJECT_JOIN_REQUEST", "ADMIN_DELETE_GROUP", "ADMIN_REMOVE_STREAM_VIEWER",
  "ADMIN_KICK_STREAM_VIEWER", "WALLET_ADJUSTED", "GIFT_TYPE_CREATED", "GIFT_TYPE_UPDATED",
  "WITHDRAWAL_APPROVED", "WITHDRAWAL_REJECTED", "KYC_APPROVED", "KYC_REJECTED"
]);

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 6 }).notNull(), // 6-digit code
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("password_reset_tokens_user_id_idx").on(table.userId),
  index("password_reset_tokens_token_idx").on(table.token),
]);

// Email verification tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: varchar("token", { length: 6 }).notNull(), // 6-digit code
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("email_verification_tokens_user_id_idx").on(table.userId),
  index("email_verification_tokens_token_idx").on(table.token),
]);

// Phone verification tokens for SMS-based verification
export const phoneVerificationTokens = pgTable("phone_verification_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: text("phone_number").notNull(),
  token: varchar("token", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("phone_verification_tokens_user_id_idx").on(table.userId),
  index("phone_verification_tokens_token_idx").on(table.token),
]);

// Audit log table - tracks admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  action: auditActionEnum("action").notNull(),
  targetType: varchar("target_type", { length: 50 }), // "user", "post", "role", etc.
  targetId: varchar("target_id"),
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("audit_logs_user_id_idx").on(table.userId),
  index("audit_logs_action_idx").on(table.action),
  index("audit_logs_created_at_idx").on(table.createdAt),
  index("audit_logs_target_idx").on(table.targetType, table.targetId),
]);

// App settings table - stores application configuration
export const appSettings = pgTable("app_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 20 }).default("string").notNull(), // "string", "number", "boolean", "json"
  description: text("description"),
  updatedBy: varchar("updated_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RBAC Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assigner: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: "assigner",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const appSettingsRelations = relations(appSettings, ({ one }) => ({
  updater: one(users, {
    fields: [appSettings.updatedBy],
    references: [users.id],
  }),
}));

// ===== PLATFORM WORD FILTERS =====
// Admin-managed word filters for content moderation

export const wordFilterActionEnum = pgEnum("word_filter_action", ["BLOCK", "REPLACE", "FLAG"]);

export const wordFilters = pgTable("word_filters", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  word: text("word").notNull().unique(),
  action: wordFilterActionEnum("action").default("BLOCK").notNull(),
  replacement: text("replacement"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("word_filters_word_idx").on(table.word),
  index("word_filters_active_idx").on(table.isActive),
]);

export const wordFiltersRelations = relations(wordFilters, ({ one }) => ({
  creator: one(users, {
    fields: [wordFilters.createdBy],
    references: [users.id],
  }),
}));

// ===== ADMIN KEYWORD FILTERS =====
// Platform-wide keyword filters (different from user-level keywordFilters)

export const adminKeywordFilterActionEnum = pgEnum("admin_keyword_filter_action", ["BLOCK", "FLAG", "SHADOW_BAN", "WARN"]);

export const adminKeywordFilters = pgTable("admin_keyword_filters", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull().unique(),
  action: adminKeywordFilterActionEnum("action").default("FLAG").notNull(),
  filterComments: boolean("filter_comments").default(true).notNull(),
  filterMessages: boolean("filter_messages").default(true).notNull(),
  filterPosts: boolean("filter_posts").default(true).notNull(),
  filterUsernames: boolean("filter_usernames").default(true).notNull(),
  filterBios: boolean("filter_bios").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("admin_keyword_filters_keyword_idx").on(table.keyword),
  index("admin_keyword_filters_active_idx").on(table.isActive),
]);

export const adminKeywordFiltersRelations = relations(adminKeywordFilters, ({ one }) => ({
  creator: one(users, {
    fields: [adminKeywordFilters.createdBy],
    references: [users.id],
  }),
}));

// ===== NOTIFICATION DEFAULTS =====
// Platform default notification settings for new users

export const notificationDefaults = pgTable("notification_defaults", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  defaultEnabled: boolean("default_enabled").default(true).notNull(),
  canUserDisable: boolean("can_user_disable").default(true).notNull(),
  updatedBy: varchar("updated_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationDefaultsRelations = relations(notificationDefaults, ({ one }) => ({
  updater: one(users, {
    fields: [notificationDefaults.updatedBy],
    references: [users.id],
  }),
}));

// ===== CONVERSATION ENHANCEMENTS =====

// Conversation status enum - for message requests
export const conversationStatusEnum = pgEnum("conversation_status", ["REQUEST", "ACCEPTED"]);

// Inbox folder enum - for organizing conversations
export const inboxFolderEnum = pgEnum("inbox_folder", ["PRIMARY", "GENERAL"]);

// ===== GOSSIP SYSTEM (Anonymous Posts) =====

// Gossip post type enum - only text and voice allowed
export const gossipTypeEnum = pgEnum("gossip_type", ["TEXT", "VOICE"]);

// Gossip Posts - anonymous posts (author never exposed)
export const gossipPosts = pgTable("gossip_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  authorUserId: varchar("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: gossipTypeEnum("type").notNull(),
  text: text("text"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationMs: integer("duration_ms"),
  likeCount: integer("like_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  retweetCount: integer("retweet_count").default(0).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_posts_created_at_idx").on(table.createdAt),
]);

// Gossip Likes
export const gossipLikes = pgTable("gossip_likes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  gossipPostId: varchar("gossip_post_id")
    .notNull()
    .references(() => gossipPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_likes_user_post_unique").on(table.userId, table.gossipPostId),
  index("gossip_likes_post_id_idx").on(table.gossipPostId),
]);

// Gossip Comments - commenter identity never exposed
export const gossipComments = pgTable("gossip_comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  gossipPostId: varchar("gossip_post_id")
    .notNull()
    .references(() => gossipPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_comments_post_id_idx").on(table.gossipPostId),
]);

// Gossip Retweets
export const gossipRetweets = pgTable("gossip_retweets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  originalGossipPostId: varchar("original_gossip_post_id")
    .notNull()
    .references(() => gossipPosts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_retweets_user_post_unique").on(table.userId, table.originalGossipPostId),
  index("gossip_retweets_post_id_idx").on(table.originalGossipPostId),
]);

// ===== ANONYMOUS GOSSIP SYSTEM (Zero-Identity Architecture) =====

// Reaction type enum for anonymous gossip
export const anonReactionTypeEnum = pgEnum("anon_reaction_type", ["FIRE", "MINDBLOWN", "LAUGH", "SKULL", "EYES"]);

// Report status enum for anonymous gossip
export const anonReportStatusEnum = pgEnum("anon_report_status", ["PENDING", "REVIEWED", "DISMISSED", "REMOVED"]);

// Countries table for Southern Africa location tracking
export const countries = pgTable("countries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 2 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  isSouthAfrica: boolean("is_south_africa").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("countries_code_idx").on(table.code),
  index("countries_is_active_idx").on(table.isActive),
]);

// South African locations (Province → City → Kasi hierarchy)
export const zaLocations = pgTable("za_locations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  province: varchar("province", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  kasi: varchar("kasi", { length: 100 }),
  fullPath: varchar("full_path", { length: 300 }).notNull(),
  level: integer("level").notNull(),
  parentId: varchar("parent_id"),
  population: integer("population"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("za_locations_province_idx").on(table.province),
  index("za_locations_city_idx").on(table.city),
  index("za_locations_kasi_idx").on(table.kasi),
  index("za_locations_full_path_idx").on(table.fullPath),
  index("za_locations_level_idx").on(table.level),
  index("za_locations_parent_idx").on(table.parentId),
]);

// Anonymous Gossip Posts - ZERO identity tracking
export const anonGossipPosts = pgTable("anon_gossip_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }),
  zaLocationId: varchar("za_location_id"),
  locationDisplay: varchar("location_display", { length: 300 }),
  type: gossipTypeEnum("type").notNull().default("TEXT"),
  content: text("content"),
  mediaUrl: text("media_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationMs: integer("duration_ms"),
  isWhisper: boolean("is_whisper").default(false).notNull(),
  whisperExpiresAt: timestamp("whisper_expires_at"),
  teaMeter: integer("tea_meter").default(0).notNull(),
  fireCount: integer("fire_count").default(0).notNull(),
  mindblownCount: integer("mindblown_count").default(0).notNull(),
  laughCount: integer("laugh_count").default(0).notNull(),
  skullCount: integer("skull_count").default(0).notNull(),
  eyesCount: integer("eyes_count").default(0).notNull(),
  replyCount: integer("reply_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  reportCount: integer("report_count").default(0).notNull(),
  // V2 Extensions
  postType: varchar("post_type", { length: 20 }).default("REGULAR"),
  isInsider: boolean("is_insider").default(false).notNull(),
  hasUpdate: boolean("has_update").default(false).notNull(),
  repostCount: integer("repost_count").default(0).notNull(),
  saveCount: integer("save_count").default(0).notNull(),
  followCount: integer("follow_count").default(0).notNull(),
  accuracyTrueVotes: integer("accuracy_true_votes").default(0).notNull(),
  accuracyFalseVotes: integer("accuracy_false_votes").default(0).notNull(),
  accuracyUnsureVotes: integer("accuracy_unsure_votes").default(0).notNull(),
  isVerifiedTea: boolean("is_verified_tea").default(false).notNull(),
  isBreaking: boolean("is_breaking").default(false).notNull(),
  trendingScore: real("trending_score").default(0).notNull(),
  velocityScore: real("velocity_score").default(0).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  isRemovedByAdmin: boolean("is_removed_by_admin").default(false).notNull(),
  removedReason: text("removed_reason"),
  removedAt: timestamp("removed_at"),
  removedBy: varchar("removed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("anon_gossip_posts_device_hash_idx").on(table.deviceHash),
  index("anon_gossip_posts_country_code_idx").on(table.countryCode),
  index("anon_gossip_posts_za_location_idx").on(table.zaLocationId),
  index("anon_gossip_posts_created_at_idx").on(table.createdAt),
  index("anon_gossip_posts_tea_meter_idx").on(table.teaMeter),
  index("anon_gossip_posts_is_whisper_idx").on(table.isWhisper),
  index("anon_gossip_posts_whisper_expires_idx").on(table.whisperExpiresAt),
  index("anon_gossip_posts_is_hidden_idx").on(table.isHidden),
  index("anon_gossip_posts_post_type_idx").on(table.postType),
  index("anon_gossip_posts_trending_idx").on(table.trendingScore),
  index("anon_gossip_posts_verified_idx").on(table.isVerifiedTea),
]);

// Anonymous Gossip Reactions
export const anonGossipReactions = pgTable("anon_gossip_reactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  reactionType: anonReactionTypeEnum("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("anon_gossip_reactions_unique").on(table.postId, table.deviceHash, table.reactionType),
  index("anon_gossip_reactions_post_idx").on(table.postId),
  index("anon_gossip_reactions_device_idx").on(table.deviceHash),
]);

// Anonymous Gossip Replies (max depth 2)
export const anonGossipReplies = pgTable("anon_gossip_replies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  parentReplyId: varchar("parent_reply_id"),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  content: text("content").notNull(),
  depth: integer("depth").default(1).notNull(),
  fireCount: integer("fire_count").default(0).notNull(),
  mindblownCount: integer("mindblown_count").default(0).notNull(),
  laughCount: integer("laugh_count").default(0).notNull(),
  skullCount: integer("skull_count").default(0).notNull(),
  eyesCount: integer("eyes_count").default(0).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  isRemovedByAdmin: boolean("is_removed_by_admin").default(false).notNull(),
  removedReason: text("removed_reason"),
  removedAt: timestamp("removed_at"),
  removedBy: varchar("removed_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("anon_gossip_replies_post_idx").on(table.postId),
  index("anon_gossip_replies_parent_idx").on(table.parentReplyId),
  index("anon_gossip_replies_device_idx").on(table.deviceHash),
  index("anon_gossip_replies_depth_idx").on(table.depth),
]);

// Anonymous Gossip Reply Reactions
export const anonGossipReplyReactions = pgTable("anon_gossip_reply_reactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  replyId: varchar("reply_id")
    .notNull()
    .references(() => anonGossipReplies.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  reactionType: anonReactionTypeEnum("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("anon_reply_reactions_unique").on(table.replyId, table.deviceHash, table.reactionType),
  index("anon_reply_reactions_reply_idx").on(table.replyId),
]);

// Anonymous Gossip Reports
export const anonGossipReports = pgTable("anon_gossip_reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  replyId: varchar("reply_id")
    .references(() => anonGossipReplies.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  reason: text("reason").notNull(),
  status: anonReportStatusEnum("status").default("PENDING").notNull(),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("anon_gossip_reports_post_idx").on(table.postId),
  index("anon_gossip_reports_reply_idx").on(table.replyId),
  index("anon_gossip_reports_status_idx").on(table.status),
  index("anon_gossip_reports_created_idx").on(table.createdAt),
]);

// Gossip System Settings (admin-controlled)
export const gossipSettings = pgTable("gossip_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_settings_key_idx").on(table.key),
]);

// Gossip Blocked Words (auto-moderation)
export const gossipBlockedWords = pgTable("gossip_blocked_words", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  word: varchar("word", { length: 100 }).notNull().unique(),
  isRegex: boolean("is_regex").default(false).notNull(),
  severity: integer("severity").default(1).notNull(),
  addedBy: varchar("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_blocked_words_word_idx").on(table.word),
]);

// Gossip Location Stats (milestones, streaks, trending)
export const gossipLocationStats = pgTable("gossip_location_stats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  locationType: varchar("location_type", { length: 20 }).notNull(),
  locationId: varchar("location_id", { length: 300 }).notNull(),
  locationDisplay: varchar("location_display", { length: 300 }).notNull(),
  totalPosts: integer("total_posts").default(0).notNull(),
  postsToday: integer("posts_today").default(0).notNull(),
  postsThisWeek: integer("posts_this_week").default(0).notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  lastPostAt: timestamp("last_post_at"),
  milestoneReached: integer("milestone_reached").default(0).notNull(),
  trendingScore: real("trending_score").default(0).notNull(),
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_location_stats_unique").on(table.locationType, table.locationId),
  index("gossip_location_stats_type_idx").on(table.locationType),
  index("gossip_location_stats_trending_idx").on(table.trendingScore),
  index("gossip_location_stats_streak_idx").on(table.streakDays),
]);

// Gossip Engagement Velocity (for "golden hour" trending)
export const gossipEngagementVelocity = pgTable("gossip_engagement_velocity", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  hourNumber: integer("hour_number").notNull(),
  reactions: integer("reactions").default(0).notNull(),
  replies: integer("replies").default(0).notNull(),
  views: integer("views").default(0).notNull(),
  velocityScore: real("velocity_score").default(0).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_velocity_post_hour").on(table.postId, table.hourNumber),
  index("gossip_velocity_post_idx").on(table.postId),
  index("gossip_velocity_score_idx").on(table.velocityScore),
]);

// ===== GOSSIP V2 EXTENSIONS =====

// Post type enum for gossip v2
export const gossipPostTypeEnum = pgEnum("gossip_post_type", ["REGULAR", "CONFESSION", "AMA", "I_SAW", "I_HEARD"]);

// Tea spiller level enum
export const teaSpillerLevelEnum = pgEnum("tea_spiller_level", ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]);

// Accuracy vote enum
export const accuracyVoteEnum = pgEnum("accuracy_vote", ["TRUE", "FALSE", "UNSURE"]);

// Award type enum
export const gossipAwardTypeEnum = pgEnum("gossip_award_type", ["WEEKLY_TOP", "MONTHLY_TOP", "MOST_ACCURATE", "FUNNIEST", "MOST_SHOCKING", "LOCAL_LEGEND"]);

// Spill session status enum
export const spillSessionStatusEnum = pgEnum("spill_session_status", ["SCHEDULED", "ACTIVE", "ENDED"]);

// Anonymous Gossip Aliases - throwaway names per post
export const gossipAliases = pgTable("gossip_aliases", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  alias: varchar("alias", { length: 50 }).notNull(),
  aliasColor: varchar("alias_color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_aliases_post_unique").on(table.postId),
  index("gossip_aliases_alias_idx").on(table.alias),
]);

// Gossip Reposts (regular + quote reposts)
export const gossipReposts = pgTable("gossip_reposts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  originalPostId: varchar("original_post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  quoteText: text("quote_text"),
  isQuoteRepost: boolean("is_quote_repost").default(false).notNull(),
  zaLocationId: varchar("za_location_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_reposts_unique").on(table.originalPostId, table.deviceHash),
  index("gossip_reposts_post_idx").on(table.originalPostId),
  index("gossip_reposts_device_idx").on(table.deviceHash),
  index("gossip_reposts_location_idx").on(table.zaLocationId),
]);

// Gossip Saves (bookmarks)
export const gossipSaves = pgTable("gossip_saves", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_saves_unique").on(table.postId, table.deviceHash),
  index("gossip_saves_post_idx").on(table.postId),
  index("gossip_saves_device_idx").on(table.deviceHash),
]);

// Gossip Post Follows (get notified on updates)
export const gossipPostFollows = pgTable("gossip_post_follows", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_post_follows_unique").on(table.postId, table.deviceHash),
  index("gossip_post_follows_post_idx").on(table.postId),
  index("gossip_post_follows_device_idx").on(table.deviceHash),
]);

// Gossip Polls
export const gossipPolls = pgTable("gossip_polls", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  option1: varchar("option_1", { length: 100 }).notNull(),
  option2: varchar("option_2", { length: 100 }).notNull(),
  option3: varchar("option_3", { length: 100 }),
  option4: varchar("option_4", { length: 100 }),
  option1Votes: integer("option_1_votes").default(0).notNull(),
  option2Votes: integer("option_2_votes").default(0).notNull(),
  option3Votes: integer("option_3_votes").default(0).notNull(),
  option4Votes: integer("option_4_votes").default(0).notNull(),
  totalVotes: integer("total_votes").default(0).notNull(),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_polls_post_unique").on(table.postId),
  index("gossip_polls_ends_idx").on(table.endsAt),
]);

// Gossip Poll Votes
export const gossipPollVotes = pgTable("gossip_poll_votes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id")
    .notNull()
    .references(() => gossipPolls.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  optionNumber: integer("option_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_poll_votes_unique").on(table.pollId, table.deviceHash),
  index("gossip_poll_votes_poll_idx").on(table.pollId),
]);

// Anonymous DM Conversations
export const gossipDMConversations = pgTable("gossip_dm_conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .references(() => anonGossipPosts.id, { onDelete: "set null" }),
  participant1Hash: varchar("participant_1_hash", { length: 64 }).notNull(),
  participant2Hash: varchar("participant_2_hash", { length: 64 }).notNull(),
  participant1Alias: varchar("participant_1_alias", { length: 50 }).notNull(),
  participant2Alias: varchar("participant_2_alias", { length: 50 }).notNull(),
  lastMessageAt: timestamp("last_message_at"),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_dm_participants_unique").on(table.participant1Hash, table.participant2Hash, table.postId),
  index("gossip_dm_conv_p1_idx").on(table.participant1Hash),
  index("gossip_dm_conv_p2_idx").on(table.participant2Hash),
  index("gossip_dm_conv_post_idx").on(table.postId),
]);

// Anonymous DM Messages
export const gossipDMMessages = pgTable("gossip_dm_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => gossipDMConversations.id, { onDelete: "cascade" }),
  senderHash: varchar("sender_hash", { length: 64 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_dm_msg_conv_idx").on(table.conversationId),
  index("gossip_dm_msg_sender_idx").on(table.senderHash),
  index("gossip_dm_msg_created_idx").on(table.createdAt),
]);

// Gossip Accuracy Votes
export const gossipAccuracyVotes = pgTable("gossip_accuracy_votes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  vote: accuracyVoteEnum("vote").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_accuracy_votes_unique").on(table.postId, table.deviceHash),
  index("gossip_accuracy_votes_post_idx").on(table.postId),
  index("gossip_accuracy_votes_vote_idx").on(table.vote),
]);

// Tea Spiller Stats (device-based reputation)
export const teaSpillerStats = pgTable("tea_spiller_stats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  deviceHash: varchar("device_hash", { length: 64 }).notNull().unique(),
  level: teaSpillerLevelEnum("level").default("BRONZE").notNull(),
  totalPosts: integer("total_posts").default(0).notNull(),
  totalReactions: integer("total_reactions").default(0).notNull(),
  totalReposts: integer("total_reposts").default(0).notNull(),
  totalReplies: integer("total_replies").default(0).notNull(),
  accurateCount: integer("accurate_count").default(0).notNull(),
  inaccurateCount: integer("inaccurate_count").default(0).notNull(),
  accuracyRate: real("accuracy_rate").default(0).notNull(),
  cooldownUntil: timestamp("cooldown_until"),
  isShadowBanned: boolean("is_shadow_banned").default(false).notNull(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("tea_spiller_stats_level_idx").on(table.level),
  index("tea_spiller_stats_accuracy_idx").on(table.accuracyRate),
  index("tea_spiller_stats_cooldown_idx").on(table.cooldownUntil),
]);

// Gossip Hashtags
export const gossipHashtags = pgTable("gossip_hashtags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 100 }).notNull().unique(),
  useCount: integer("use_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_hashtags_tag_idx").on(table.tag),
  index("gossip_hashtags_count_idx").on(table.useCount),
]);

// Post-Hashtag Junction
export const gossipPostHashtags = pgTable("gossip_post_hashtags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  hashtagId: varchar("hashtag_id")
    .notNull()
    .references(() => gossipHashtags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_post_hashtags_unique").on(table.postId, table.hashtagId),
  index("gossip_post_hashtags_post_idx").on(table.postId),
  index("gossip_post_hashtags_tag_idx").on(table.hashtagId),
]);

// Part 2 Linking (follow-up posts)
export const gossipPostLinks = pgTable("gossip_post_links", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  originalPostId: varchar("original_post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  linkedPostId: varchar("linked_post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  linkType: varchar("link_type", { length: 20 }).default("PART_2").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_post_links_unique").on(table.originalPostId, table.linkedPostId),
  index("gossip_post_links_original_idx").on(table.originalPostId),
  index("gossip_post_links_linked_idx").on(table.linkedPostId),
]);

// Hood Rivalries (engagement competition)
export const hoodRivalries = pgTable("hood_rivalries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  hood1Id: varchar("hood_1_id").notNull(),
  hood2Id: varchar("hood_2_id").notNull(),
  hood1Name: varchar("hood_1_name", { length: 100 }).notNull(),
  hood2Name: varchar("hood_2_name", { length: 100 }).notNull(),
  hood1Score: integer("hood_1_score").default(0).notNull(),
  hood2Score: integer("hood_2_score").default(0).notNull(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  winnerId: varchar("winner_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("hood_rivalries_active_idx").on(table.isActive),
  index("hood_rivalries_week_idx").on(table.weekStart),
]);

// Gossip Awards
export const gossipAwards = pgTable("gossip_awards", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  awardType: gossipAwardTypeEnum("award_type").notNull(),
  zaLocationId: varchar("za_location_id"),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  rank: integer("rank").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_awards_post_idx").on(table.postId),
  index("gossip_awards_type_idx").on(table.awardType),
  index("gossip_awards_period_idx").on(table.periodStart, table.periodEnd),
  index("gossip_awards_location_idx").on(table.zaLocationId),
]);

// Local Legends Board
export const gossipLocalLegends = pgTable("gossip_local_legends", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  zaLocationId: varchar("za_location_id").notNull(),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  totalEngagement: integer("total_engagement").default(0).notNull(),
  totalVerifiedPosts: integer("total_verified_posts").default(0).notNull(),
  rank: integer("rank").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => [
  unique("gossip_local_legends_unique").on(table.zaLocationId, table.deviceHash),
  index("gossip_local_legends_location_idx").on(table.zaLocationId),
  index("gossip_local_legends_rank_idx").on(table.rank),
]);

// Weekly Spill Sessions
export const gossipSpillSessions = pgTable("gossip_spill_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  zaLocationId: varchar("za_location_id"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end").notNull(),
  status: spillSessionStatusEnum("status").default("SCHEDULED").notNull(),
  engagementBoost: real("engagement_boost").default(1.5).notNull(),
  totalPosts: integer("total_posts").default(0).notNull(),
  totalReactions: integer("total_reactions").default(0).notNull(),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gossip_spill_sessions_scheduled_idx").on(table.scheduledStart),
  index("gossip_spill_sessions_status_idx").on(table.status),
  index("gossip_spill_sessions_location_idx").on(table.zaLocationId),
]);

// Gossip Post Views (for analytics)
export const gossipPostViews = pgTable("gossip_post_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => anonGossipPosts.id, { onDelete: "cascade" }),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
}, (table) => [
  unique("gossip_post_views_unique").on(table.postId, table.deviceHash),
  index("gossip_post_views_post_idx").on(table.postId),
  index("gossip_post_views_time_idx").on(table.viewedAt),
]);

// Hood Activity Stats (peak hours tracking)
export const hoodActivityStats = pgTable("hood_activity_stats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  zaLocationId: varchar("za_location_id").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  hourOfDay: integer("hour_of_day").notNull(),
  avgPosts: real("avg_posts").default(0).notNull(),
  avgEngagement: real("avg_engagement").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => [
  unique("hood_activity_stats_unique").on(table.zaLocationId, table.dayOfWeek, table.hourOfDay),
  index("hood_activity_stats_location_idx").on(table.zaLocationId),
]);

// Trending hashtags per location
export const gossipTrendingHashtags = pgTable("gossip_trending_hashtags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  hashtagId: varchar("hashtag_id")
    .notNull()
    .references(() => gossipHashtags.id, { onDelete: "cascade" }),
  zaLocationId: varchar("za_location_id"),
  trendingScore: real("trending_score").default(0).notNull(),
  useLast24h: integer("use_last_24h").default(0).notNull(),
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
}, (table) => [
  unique("gossip_trending_hashtags_unique").on(table.hashtagId, table.zaLocationId),
  index("gossip_trending_hashtags_score_idx").on(table.trendingScore),
  index("gossip_trending_hashtags_location_idx").on(table.zaLocationId),
]);

// Device Rate Limiting
export const gossipRateLimits = pgTable("gossip_rate_limits", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  deviceHash: varchar("device_hash", { length: 64 }).notNull(),
  actionType: varchar("action_type", { length: 20 }).notNull(),
  count: integer("count").default(0).notNull(),
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
}, (table) => [
  unique("gossip_rate_limits_unique").on(table.deviceHash, table.actionType, table.windowStart),
  index("gossip_rate_limits_device_idx").on(table.deviceHash),
  index("gossip_rate_limits_window_idx").on(table.windowEnd),
]);

// ===== MALL SYSTEM =====

// Mall Categories
export const mallCategories = pgTable("mall_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mall Items
export const mallItems = pgTable("mall_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => mallCategories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  value: integer("value").notNull(),
  coinPrice: integer("coin_price").notNull().default(0),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("mall_items_category_id_idx").on(table.categoryId),
]);

// Mall Purchases - unlimited purchases allowed
export const mallPurchases = pgTable("mall_purchases", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: varchar("item_id")
    .notNull()
    .references(() => mallItems.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1).notNull(),
  netWorthGained: bigint("net_worth_gained", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("mall_purchases_user_id_idx").on(table.userId),
  index("mall_purchases_item_id_idx").on(table.itemId),
]);

// ===== NET WORTH LEDGER =====

// Reason for net worth change
export const netWorthReasonEnum = pgEnum("net_worth_reason", ["MALL_PURCHASE", "ADMIN_ADJUST", "GIFT", "ACHIEVEMENT", "OTHER"]);

// Net Worth Ledger - tracks all net worth changes for audit
export const netWorthLedger = pgTable("net_worth_ledger", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  delta: bigint("delta", { mode: "number" }).notNull(),
  reason: netWorthReasonEnum("reason").notNull(),
  refType: varchar("ref_type", { length: 50 }),
  refId: varchar("ref_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("net_worth_ledger_user_id_idx").on(table.userId),
  index("net_worth_ledger_created_at_idx").on(table.createdAt),
]);

// ===== TRENDS SYSTEM =====

// Daily trends rollup
export const trendsDaily = pgTable("trends_daily", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  topic: varchar("topic", { length: 200 }).notNull(),
  score: real("score").notNull(),
  postCount: integer("post_count").default(0).notNull(),
  windowStart: timestamp("window_start").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("trends_daily_window_start_idx").on(table.windowStart),
  index("trends_daily_score_idx").on(table.score),
]);

// ===== RELATIONS FOR NEW TABLES =====

export const gossipPostsRelations = relations(gossipPosts, ({ many }) => ({
  likes: many(gossipLikes),
  comments: many(gossipComments),
  retweets: many(gossipRetweets),
}));

export const gossipLikesRelations = relations(gossipLikes, ({ one }) => ({
  gossipPost: one(gossipPosts, {
    fields: [gossipLikes.gossipPostId],
    references: [gossipPosts.id],
  }),
}));

export const gossipCommentsRelations = relations(gossipComments, ({ one }) => ({
  gossipPost: one(gossipPosts, {
    fields: [gossipComments.gossipPostId],
    references: [gossipPosts.id],
  }),
}));

export const gossipRetweetsRelations = relations(gossipRetweets, ({ one }) => ({
  originalGossipPost: one(gossipPosts, {
    fields: [gossipRetweets.originalGossipPostId],
    references: [gossipPosts.id],
  }),
}));

export const mallCategoriesRelations = relations(mallCategories, ({ many }) => ({
  items: many(mallItems),
}));

export const mallItemsRelations = relations(mallItems, ({ one, many }) => ({
  category: one(mallCategories, {
    fields: [mallItems.categoryId],
    references: [mallCategories.id],
  }),
  purchases: many(mallPurchases),
}));

export const mallPurchasesRelations = relations(mallPurchases, ({ one }) => ({
  user: one(users, {
    fields: [mallPurchases.userId],
    references: [users.id],
  }),
  item: one(mallItems, {
    fields: [mallPurchases.itemId],
    references: [mallItems.id],
  }),
}));

export const netWorthLedgerRelations = relations(netWorthLedger, ({ one }) => ({
  user: one(users, {
    fields: [netWorthLedger.userId],
    references: [users.id],
  }),
}));

// Anonymous Gossip Relations
export const anonGossipPostsRelations = relations(anonGossipPosts, ({ one, many }) => ({
  reactions: many(anonGossipReactions),
  replies: many(anonGossipReplies),
  reports: many(anonGossipReports),
  velocityRecords: many(gossipEngagementVelocity),
  // V2 Relations
  alias: one(gossipAliases),
  reposts: many(gossipReposts),
  saves: many(gossipSaves),
  follows: many(gossipPostFollows),
  poll: one(gossipPolls),
  accuracyVotes: many(gossipAccuracyVotes),
  hashtags: many(gossipPostHashtags),
  linkedFrom: many(gossipPostLinks, { relationName: "linkedPosts" }),
  linkedTo: many(gossipPostLinks, { relationName: "originalPosts" }),
  views: many(gossipPostViews),
  awards: many(gossipAwards),
}));

export const anonGossipReactionsRelations = relations(anonGossipReactions, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [anonGossipReactions.postId],
    references: [anonGossipPosts.id],
  }),
}));

export const anonGossipRepliesRelations = relations(anonGossipReplies, ({ one, many }) => ({
  post: one(anonGossipPosts, {
    fields: [anonGossipReplies.postId],
    references: [anonGossipPosts.id],
  }),
  parentReply: one(anonGossipReplies, {
    fields: [anonGossipReplies.parentReplyId],
    references: [anonGossipReplies.id],
    relationName: "parentChild",
  }),
  childReplies: many(anonGossipReplies, { relationName: "parentChild" }),
  reactions: many(anonGossipReplyReactions),
}));

export const anonGossipReplyReactionsRelations = relations(anonGossipReplyReactions, ({ one }) => ({
  reply: one(anonGossipReplies, {
    fields: [anonGossipReplyReactions.replyId],
    references: [anonGossipReplies.id],
  }),
}));

export const anonGossipReportsRelations = relations(anonGossipReports, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [anonGossipReports.postId],
    references: [anonGossipPosts.id],
  }),
  reply: one(anonGossipReplies, {
    fields: [anonGossipReports.replyId],
    references: [anonGossipReplies.id],
  }),
}));

export const gossipEngagementVelocityRelations = relations(gossipEngagementVelocity, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipEngagementVelocity.postId],
    references: [anonGossipPosts.id],
  }),
}));

// Gossip V2 Relations
export const gossipAliasesRelations = relations(gossipAliases, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipAliases.postId],
    references: [anonGossipPosts.id],
  }),
}));

export const gossipRepostsRelations = relations(gossipReposts, ({ one }) => ({
  originalPost: one(anonGossipPosts, {
    fields: [gossipReposts.originalPostId],
    references: [anonGossipPosts.id],
  }),
}));

export const gossipSavesRelations = relations(gossipSaves, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipSaves.postId],
    references: [anonGossipPosts.id],
  }),
}));

export const gossipPostFollowsRelations = relations(gossipPostFollows, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipPostFollows.postId],
    references: [anonGossipPosts.id],
  }),
}));

export const gossipPollsRelations = relations(gossipPolls, ({ one, many }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipPolls.postId],
    references: [anonGossipPosts.id],
  }),
  votes: many(gossipPollVotes),
}));

export const gossipPollVotesRelations = relations(gossipPollVotes, ({ one }) => ({
  poll: one(gossipPolls, {
    fields: [gossipPollVotes.pollId],
    references: [gossipPolls.id],
  }),
}));

export const gossipDMConversationsRelations = relations(gossipDMConversations, ({ one, many }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipDMConversations.postId],
    references: [anonGossipPosts.id],
  }),
  messages: many(gossipDMMessages),
}));

export const gossipDMMessagesRelations = relations(gossipDMMessages, ({ one }) => ({
  conversation: one(gossipDMConversations, {
    fields: [gossipDMMessages.conversationId],
    references: [gossipDMConversations.id],
  }),
}));

export const gossipAccuracyVotesRelations = relations(gossipAccuracyVotes, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipAccuracyVotes.postId],
    references: [anonGossipPosts.id],
  }),
}));

export const gossipHashtagsRelations = relations(gossipHashtags, ({ many }) => ({
  posts: many(gossipPostHashtags),
  trending: many(gossipTrendingHashtags),
}));

export const gossipPostHashtagsRelations = relations(gossipPostHashtags, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipPostHashtags.postId],
    references: [anonGossipPosts.id],
  }),
  hashtag: one(gossipHashtags, {
    fields: [gossipPostHashtags.hashtagId],
    references: [gossipHashtags.id],
  }),
}));

export const gossipPostLinksRelations = relations(gossipPostLinks, ({ one }) => ({
  originalPost: one(anonGossipPosts, {
    fields: [gossipPostLinks.originalPostId],
    references: [anonGossipPosts.id],
    relationName: "originalPosts",
  }),
  linkedPost: one(anonGossipPosts, {
    fields: [gossipPostLinks.linkedPostId],
    references: [anonGossipPosts.id],
    relationName: "linkedPosts",
  }),
}));

export const gossipAwardsRelations = relations(gossipAwards, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipAwards.postId],
    references: [anonGossipPosts.id],
  }),
}));

export const gossipPostViewsRelations = relations(gossipPostViews, ({ one }) => ({
  post: one(anonGossipPosts, {
    fields: [gossipPostViews.postId],
    references: [anonGossipPosts.id],
  }),
}));

export const gossipTrendingHashtagsRelations = relations(gossipTrendingHashtags, ({ one }) => ({
  hashtag: one(gossipHashtags, {
    fields: [gossipTrendingHashtags.hashtagId],
    references: [gossipHashtags.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  authorId: true,
  type: true,
  content: true,
  caption: true,
  mediaUrl: true,
  thumbnailUrl: true,
  durationMs: true,
  aspectRatio: true,
  visibility: true,
  commentsEnabled: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  authorId: true,
  content: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  senderId: true,
  receiverId: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type Notification = typeof notifications.$inferSelect;
export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW" | "MESSAGE" | "MENTION" | "VERIFICATION_APPROVED" | "VERIFICATION_DENIED" | "VERIFICATION_INFO_NEEDED" | "STORY_MENTION" | "STORY_REPLY" | "STORY_REACTION" | "STORY_STICKER_RESPONSE" | "AD_CAMPAIGN_ENDED" | "AD_LOW_BALANCE" | "AD_REFUND_PROCESSED" | "AD_DISPUTE_RESOLVED";
export type Block = typeof blocks.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";

export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type WordFilter = typeof wordFilters.$inferSelect;
export type AdminKeywordFilter = typeof adminKeywordFilters.$inferSelect;
export type NotificationDefault = typeof notificationDefaults.$inferSelect;
export type WordFilterAction = "BLOCK" | "REPLACE" | "FLAG";
export type AdminKeywordFilterAction = "BLOCK" | "FLAG" | "SHADOW_BAN" | "WARN";

export type PostWithAuthor = Post & { author: User };
export type CommentWithAuthor = Comment & { author: User };
export type ConversationWithParticipants = Conversation & { 
  participant1: User; 
  participant2: User;
  lastMessage?: Message;
};
export type MessageWithSender = Message & { sender: User };
export type NotificationWithActor = Notification & { actor: User };
export type UserWithRoles = User & { roles: Role[] };
export type RoleWithPermissions = Role & { permissions: Permission[] };

// New types for Posts, Settings, Profile, Playlists
export type Bookmark = typeof bookmarks.$inferSelect;
export type Share = typeof shares.$inferSelect;
export type PostView = typeof postViews.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistItem = typeof playlistItems.$inferSelect;
export type FeaturedIntro = typeof featuredIntros.$inferSelect;
export type Pin = typeof pins.$inferSelect;

export type PostType = "TEXT" | "PHOTO" | "VIDEO" | "VOICE";
export type Visibility = "PUBLIC" | "FOLLOWERS" | "PRIVATE";
export type UserCategory = "PERSONAL" | "CREATOR" | "BUSINESS";
export type Policy = "EVERYONE" | "FOLLOWERS" | "NOBODY";
export type PlaylistType = "VIDEO" | "VOICE";

export type PlaylistWithItems = Playlist & { items: (PlaylistItem & { post: Post })[] };
export type UserWithSettings = User & { settings?: UserSettings };

// Verification types
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type VerificationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "DENIED" | "MORE_INFO_NEEDED";
export type VerificationCategory = "CELEBRITY" | "INFLUENCER" | "BUSINESS" | "ORGANIZATION" | "GOVERNMENT" | "OTHER";
export type VerificationRequestWithUser = VerificationRequest & { user: User; reviewedBy?: User };

// Studio Analytics types
export type ProfileView = typeof profileViews.$inferSelect;
export type WatchEvent = typeof watchEvents.$inferSelect;
export type DailyUserAnalytics = typeof dailyUserAnalytics.$inferSelect;
export type DailyPostAnalytics = typeof dailyPostAnalytics.$inferSelect;
export type TrafficSource = "FEED" | "PROFILE" | "SEARCH" | "SHARE" | "DIRECT" | "OTHER";

// Stories types
export type Story = typeof stories.$inferSelect;
export type StoryView = typeof storyViews.$inferSelect;
export type StoryType = "PHOTO" | "VIDEO" | "TEXT" | "VOICE";
export type StoryFont = "MODERN" | "SERIF" | "HANDWRITTEN" | "BOLD" | "LUXURY";
export type StoryTextAlign = "LEFT" | "CENTER" | "RIGHT";
export type StoryTextAnimation = "NONE" | "TYPEWRITER" | "FADE" | "BOUNCE" | "GLOW" | "SPARKLE" | "RAINBOW";
export type StoryReplySetting = "ALL" | "FOLLOWERS" | "CLOSE_FRIENDS" | "OFF";
export type StoryStickerType = "POLL" | "QUESTION" | "SLIDER" | "QUIZ" | "COUNTDOWN" | "LOCATION" | "TIME" | "LINK" | "MENTION" | "HASHTAG" | "GIF" | "SHOPPING" | "TIP";
export type StoryReactionType = "FIRE" | "HEART" | "LAUGH" | "WOW" | "SAD" | "CLAP";
export type StoryWithUser = Story & { user: User };
export type StoryWithViews = Story & { user: User; views: StoryView[] };

// New story-related types
export type StorySticker = typeof storyStickers.$inferSelect;
export type StoryStickerResponse = typeof storyStickerResponses.$inferSelect;
export type StoryReaction = typeof storyReactions.$inferSelect;
export type StoryReply = typeof storyReplies.$inferSelect;
export type StoryDraft = typeof storyDrafts.$inferSelect;
export type StoryInsight = typeof storyInsights.$inferSelect;
export type StoryStreak = typeof storyStreaks.$inferSelect;
export type StoryTemplate = typeof storyTemplates.$inferSelect;
export type StoryMusic = typeof storyMusicLibrary.$inferSelect;
export type StoryTip = typeof storyTips.$inferSelect;
export type StoryCountdownSubscription = typeof storyCountdownSubscriptions.$inferSelect;

export type StoryWithFullData = Story & {
  user: User;
  views: StoryView[];
  stickers: StorySticker[];
  reactions: StoryReaction[];
};

export const insertStorySchema = createInsertSchema(stories).pick({
  userId: true,
  type: true,
  mediaUrl: true,
  thumbnailUrl: true,
  durationMs: true,
  caption: true,
  textContent: true,
  backgroundColor: true,
  isGradient: true,
  gradientColors: true,
  fontFamily: true,
  textAlignment: true,
  textAnimation: true,
  fontSize: true,
  audioUrl: true,
  audioDuration: true,
  musicUrl: true,
  musicTitle: true,
  musicArtist: true,
  filterName: true,
  textOverlays: true,
  drawings: true,
  isCloseFriends: true,
  replySetting: true,
  locationName: true,
  locationLat: true,
  locationLng: true,
});

export const insertStoryDraftSchema = createInsertSchema(storyDrafts).pick({
  userId: true,
  type: true,
  mediaUrl: true,
  textContent: true,
  backgroundColor: true,
  isGradient: true,
  gradientColors: true,
  fontFamily: true,
  textAlignment: true,
  textAnimation: true,
  fontSize: true,
  audioUrl: true,
  audioDuration: true,
  musicUrl: true,
  musicTitle: true,
  musicArtist: true,
  filterName: true,
  textOverlays: true,
  drawings: true,
  stickers: true,
  isCloseFriends: true,
  replySetting: true,
});

// ===== DISCOVERY ALGORITHM SYSTEM =====
// TikTok/Instagram-style recommendation engine

// Content interaction type enum
export const interactionTypeEnum = pgEnum("interaction_type", ["VIEW", "LIKE", "SAVE", "SHARE", "COMMENT", "SKIP", "REWATCH"]);

// Content type enum for preferences
export const contentTypeEnum = pgEnum("content_type", ["REEL", "VOICE", "PHOTO", "TEXT", "STORY"]);

// Content Interactions - Track all user interactions with content
export const contentInteractions = pgTable("content_interactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contentId: varchar("content_id").notNull(), // Can be postId, storyId, gossipId
  contentType: contentTypeEnum("content_type").notNull(),
  interactionType: interactionTypeEnum("interaction_type").notNull(),
  watchTimeMs: integer("watch_time_ms").default(0), // How long they watched
  completionRate: real("completion_rate").default(0), // 0-1 percentage watched
  rewatchCount: integer("rewatch_count").default(0), // How many times rewatched
  skippedAtMs: integer("skipped_at_ms"), // When they skipped (null if didn't skip)
  creatorId: varchar("creator_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("session_id"), // Group interactions by session
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("content_interactions_user_idx").on(table.userId),
  index("content_interactions_content_idx").on(table.contentId),
  index("content_interactions_creator_idx").on(table.creatorId),
  index("content_interactions_user_type_idx").on(table.userId, table.contentType),
  index("content_interactions_created_idx").on(table.createdAt),
]);

// User Interest Profiles - Learned preferences from behavior
export const userInterestProfiles = pgTable("user_interest_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Content type preferences (0-100 score)
  reelPreference: integer("reel_preference").default(50).notNull(),
  voicePreference: integer("voice_preference").default(50).notNull(),
  photoPreference: integer("photo_preference").default(50).notNull(),
  textPreference: integer("text_preference").default(50).notNull(),
  // Engagement patterns
  avgWatchTimeMs: integer("avg_watch_time_ms").default(0),
  avgCompletionRate: real("avg_completion_rate").default(0),
  totalInteractions: integer("total_interactions").default(0),
  // Time-based patterns
  preferredHours: jsonb("preferred_hours").default("[]"), // Array of hours (0-23) when most active
  // Topic preferences (keywords from engaged content)
  topicScores: jsonb("topic_scores").default("{}"), // { "luxury": 80, "cars": 60, etc }
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("user_interest_profiles_user").on(table.userId),
  index("user_interest_profiles_user_idx").on(table.userId),
]);

// Creator Affinity - Track affinity scores with specific creators
export const creatorAffinities = pgTable("creator_affinities", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  affinityScore: integer("affinity_score").default(0).notNull(), // 0-1000
  totalViews: integer("total_views").default(0),
  totalLikes: integer("total_likes").default(0),
  totalShares: integer("total_shares").default(0),
  totalSaves: integer("total_saves").default(0),
  avgWatchTimeMs: integer("avg_watch_time_ms").default(0),
  avgCompletionRate: real("avg_completion_rate").default(0),
  lastInteractedAt: timestamp("last_interacted_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("creator_affinities_user_creator").on(table.userId, table.creatorId),
  index("creator_affinities_user_idx").on(table.userId),
  index("creator_affinities_score_idx").on(table.affinityScore),
]);

// Seen Content - Track what user has seen in current/recent sessions (avoid repeats)
export const seenContent = pgTable("seen_content", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contentId: varchar("content_id").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  sessionId: varchar("session_id"),
  seenAt: timestamp("seen_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Auto-cleanup after 24-48 hours
}, (table) => [
  unique("seen_content_user_content").on(table.userId, table.contentId),
  index("seen_content_user_idx").on(table.userId),
  index("seen_content_expires_idx").on(table.expiresAt),
]);

// Seen Profiles - Track which profiles user has seen (for People rotation)
export const seenProfiles = pgTable("seen_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id"),
  seenAt: timestamp("seen_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // Rotate after 24 hours
}, (table) => [
  unique("seen_profiles_user_profile").on(table.userId, table.profileId),
  index("seen_profiles_user_idx").on(table.userId),
  index("seen_profiles_expires_idx").on(table.expiresAt),
]);

// Content Fatigue - Track how many times content has been shown (prevent overexposure)
export const contentFatigue = pgTable("content_fatigue", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  totalImpressions: integer("total_impressions").default(0).notNull(),
  totalSkips: integer("total_skips").default(0).notNull(),
  skipRate: real("skip_rate").default(0), // totalSkips / totalImpressions
  avgWatchTimeMs: integer("avg_watch_time_ms").default(0),
  avgCompletionRate: real("avg_completion_rate").default(0),
  lastShownAt: timestamp("last_shown_at"),
  fatigueScore: integer("fatigue_score").default(0), // Higher = show less often
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("content_fatigue_content").on(table.contentId),
  index("content_fatigue_score_idx").on(table.fatigueScore),
  index("content_fatigue_updated_idx").on(table.updatedAt),
]);

// Content Velocity - Track engagement velocity for viral detection
export const contentVelocity = pgTable("content_velocity", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  hourNumber: integer("hour_number").notNull(), // Hours since creation
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  saves: integer("saves").default(0),
  comments: integer("comments").default(0),
  velocityScore: real("velocity_score").default(0), // Engagement per hour
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
}, (table) => [
  unique("content_velocity_content_hour").on(table.contentId, table.hourNumber),
  index("content_velocity_score_idx").on(table.velocityScore),
  index("content_velocity_content_idx").on(table.contentId),
]);

// Not Interested - Track content/creators user doesn't want to see
export const notInterested = pgTable("not_interested", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetType: varchar("target_type", { length: 20 }).notNull(), // "CONTENT" or "CREATOR"
  targetId: varchar("target_id").notNull(), // contentId or creatorId
  reason: varchar("reason", { length: 50 }), // Optional: "not_relevant", "seen_too_much", etc
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("not_interested_user_target").on(table.userId, table.targetType, table.targetId),
  index("not_interested_user_idx").on(table.userId),
]);

// Push Notification Tokens - Store Expo push tokens for each user device
export const pushTokens = pgTable("push_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(), // Expo push token (ExponentPushToken[xxx])
  deviceId: text("device_id"), // Optional device identifier for managing multiple devices
  platform: varchar("platform", { length: 20 }), // "ios", "android", "web"
  deviceName: text("device_name"), // Optional friendly device name
  isActive: boolean("is_active").default(true).notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("push_tokens_token").on(table.token),
  index("push_tokens_user_idx").on(table.userId),
  index("push_tokens_active_idx").on(table.isActive),
]);

// New Profile Enhancement Types
export type StoryHighlight = typeof storyHighlights.$inferSelect;
export type StoryHighlightItem = typeof storyHighlightItems.$inferSelect;
export type UserNote = typeof userNotes.$inferSelect;
export type UserLink = typeof userLinks.$inferSelect;
export type UserInterest = typeof userInterests.$inferSelect;
export type InterestCategory = typeof interestCategories.$inferSelect;
export type ContentCategory = typeof contentCategories.$inferSelect;

export type Industry = "TECH" | "FINANCE" | "REAL_ESTATE" | "ENTERTAINMENT" | "SPORTS" | 
  "HEALTHCARE" | "LEGAL" | "FASHION" | "HOSPITALITY" | "MEDIA" |
  "AUTOMOTIVE" | "AVIATION" | "ART" | "EDUCATION" | "CONSULTING" |
  "CRYPTO" | "VENTURE_CAPITAL" | "PRIVATE_EQUITY" | "PHILANTHROPY" | "OTHER";

export type NetWorthTier = "BUILDING" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export type RelationshipStatus = "SINGLE" | "IN_RELATIONSHIP" | "ENGAGED" | "MARRIED" | "COMPLICATED" | "OPEN" | "PREFER_NOT_TO_SAY";
export type ThemeStyle = "DEFAULT" | "MINIMAL" | "BOLD" | "ELEGANT" | "DARK" | "VIBRANT";
export type LinkIconType = "LINK" | "WEBSITE" | "INSTAGRAM" | "TWITTER" | "YOUTUBE" | "TIKTOK" | "LINKEDIN" | "GITHUB" | "DISCORD" | "TWITCH" | "SPOTIFY" | "AMAZON" | "SHOP" | "OTHER";

export type StoryHighlightWithItems = StoryHighlight & { items: (StoryHighlightItem & { story: Story })[] };
export type UserWithEnhancements = User & { 
  highlights?: StoryHighlight[];
  note?: UserNote;
  links?: UserLink[];
  interests?: UserInterest[];
  relationshipPartner?: User;
};

// New Types for Extended Profile Features
export type LoginSession = typeof loginSessions.$inferSelect;
export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type RestrictedAccount = typeof restrictedAccounts.$inferSelect;
export type MutedAccount = typeof mutedAccounts.$inferSelect;
export type KeywordFilter = typeof keywordFilters.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type PostCollaborator = typeof postCollaborators.$inferSelect;
export type AdminUserNote = typeof adminUserNotes.$inferSelect;
export type CloseFriend = typeof closeFriends.$inferSelect;
export type StoryViewerRestriction = typeof storyViewerRestrictions.$inferSelect;
export type DataExportRequest = typeof dataExportRequests.$inferSelect;
export type PendingTagApproval = typeof pendingTagApprovals.$inferSelect;

// New types for Gossip, Mall, and Trends
export type GossipPost = typeof gossipPosts.$inferSelect;
export type GossipLike = typeof gossipLikes.$inferSelect;
export type GossipComment = typeof gossipComments.$inferSelect;
export type GossipRetweet = typeof gossipRetweets.$inferSelect;
export type MallCategory = typeof mallCategories.$inferSelect;
export type MallItem = typeof mallItems.$inferSelect;
export type MallPurchase = typeof mallPurchases.$inferSelect;
export type NetWorthLedgerEntry = typeof netWorthLedger.$inferSelect;
export type TrendDaily = typeof trendsDaily.$inferSelect;

// Anonymous Gossip System Types
export type Country = typeof countries.$inferSelect;
export type ZaLocation = typeof zaLocations.$inferSelect;
export type AnonGossipPost = typeof anonGossipPosts.$inferSelect;
export type AnonGossipReaction = typeof anonGossipReactions.$inferSelect;
export type AnonGossipReply = typeof anonGossipReplies.$inferSelect;
export type AnonGossipReplyReaction = typeof anonGossipReplyReactions.$inferSelect;
export type AnonGossipReport = typeof anonGossipReports.$inferSelect;
export type GossipSetting = typeof gossipSettings.$inferSelect;
export type GossipBlockedWord = typeof gossipBlockedWords.$inferSelect;
export type GossipLocationStat = typeof gossipLocationStats.$inferSelect;
export type GossipEngagementVelocity = typeof gossipEngagementVelocity.$inferSelect;

// Gossip V2 Types
export type GossipAlias = typeof gossipAliases.$inferSelect;
export type GossipRepost = typeof gossipReposts.$inferSelect;
export type GossipSave = typeof gossipSaves.$inferSelect;
export type GossipPostFollow = typeof gossipPostFollows.$inferSelect;
export type GossipPoll = typeof gossipPolls.$inferSelect;
export type GossipPollVote = typeof gossipPollVotes.$inferSelect;
export type GossipDMConversation = typeof gossipDMConversations.$inferSelect;
export type GossipDMMessage = typeof gossipDMMessages.$inferSelect;
export type GossipAccuracyVote = typeof gossipAccuracyVotes.$inferSelect;
export type TeaSpillerStat = typeof teaSpillerStats.$inferSelect;
export type GossipHashtag = typeof gossipHashtags.$inferSelect;
export type GossipPostHashtag = typeof gossipPostHashtags.$inferSelect;
export type GossipPostLink = typeof gossipPostLinks.$inferSelect;
export type HoodRivalry = typeof hoodRivalries.$inferSelect;
export type GossipAward = typeof gossipAwards.$inferSelect;
export type GossipLocalLegend = typeof gossipLocalLegends.$inferSelect;
export type GossipSpillSession = typeof gossipSpillSessions.$inferSelect;
export type GossipPostView = typeof gossipPostViews.$inferSelect;
export type HoodActivityStat = typeof hoodActivityStats.$inferSelect;
export type GossipTrendingHashtag = typeof gossipTrendingHashtags.$inferSelect;
export type GossipRateLimit = typeof gossipRateLimits.$inferSelect;

export type GossipPostType = "REGULAR" | "CONFESSION" | "AMA" | "I_SAW" | "I_HEARD";
export type TeaSpillerLevel = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
export type AccuracyVote = "TRUE" | "FALSE" | "UNSURE";
export type GossipAwardType = "WEEKLY_TOP" | "MONTHLY_TOP" | "MOST_ACCURATE" | "FUNNIEST" | "MOST_SHOCKING" | "LOCAL_LEGEND";
export type SpillSessionStatus = "SCHEDULED" | "ACTIVE" | "ENDED";

// Discovery Algorithm Types
export type ContentInteraction = typeof contentInteractions.$inferSelect;
export type UserInterestProfile = typeof userInterestProfiles.$inferSelect;
export type CreatorAffinity = typeof creatorAffinities.$inferSelect;
export type SeenContent = typeof seenContent.$inferSelect;
export type SeenProfile = typeof seenProfiles.$inferSelect;
export type ContentFatigue = typeof contentFatigue.$inferSelect;
export type ContentVelocity = typeof contentVelocity.$inferSelect;
export type NotInterested = typeof notInterested.$inferSelect;

export type InteractionType = "VIEW" | "LIKE" | "SAVE" | "SHARE" | "COMMENT" | "SKIP" | "REWATCH";
export type ContentType = "REEL" | "VOICE" | "PHOTO" | "TEXT" | "STORY";

export type AnonReactionType = "FIRE" | "MINDBLOWN" | "LAUGH" | "SKULL" | "EYES";
export type AnonReportStatus = "PENDING" | "REVIEWED" | "DISMISSED" | "REMOVED";

export type GossipType = "TEXT" | "VOICE";
export type ConversationStatus = "REQUEST" | "ACCEPTED";
export type InboxFolder = "PRIMARY" | "GENERAL";
export type NetWorthReason = "MALL_PURCHASE" | "ADMIN_ADJUST" | "GIFT" | "ACHIEVEMENT" | "OTHER";

export type FontSize = "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
export type ExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED";
export type ScheduledStatus = "PENDING" | "PUBLISHED" | "FAILED" | "CANCELLED";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | 
  "ROLE_ASSIGNED" | "ROLE_REMOVED" | "PERMISSION_GRANTED" | "PERMISSION_REVOKED" |
  "USER_SUSPENDED" | "USER_ACTIVATED" | "USER_FORCE_LOGOUT" | "USER_DEACTIVATED" | "USER_REACTIVATED" |
  "USER_BANNED" | "USER_UNBANNED" |
  "CONTENT_HIDDEN" | "CONTENT_UNHIDDEN" | "CONTENT_SOFT_DELETED" | "FEATURED_REMOVED" |
  "REPORT_RESOLVED" | "SETTING_CHANGED" | "SETTINGS_UPDATED" |
  "USER_PROFILE_EDITED" | "USER_PASSWORD_RESET" | "USER_IMPERSONATED" |
  "USER_NOTE_ADDED" | "MASS_ACTION_PERFORMED" | "DATA_EXPORTED" | "DATA_IMPORTED" |
  "AR_FILTER_CREATED" | "AR_FILTER_UPDATED" | "AR_FILTER_FEATURED" | "AR_FILTER_UNFEATURED" |
  "AR_FILTER_ENABLED" | "AR_FILTER_DISABLED" | "AR_FILTER_DELETED" |
  "AI_AVATAR_APPROVED" | "AI_AVATAR_REJECTED" | "AI_AVATAR_DELETED" |
  "EXPLORE_CATEGORY_CREATED" | "EXPLORE_CATEGORY_UPDATED" | "EXPLORE_CATEGORY_DELETED" |
  "ADMIN_UPDATE_GROUP_SETTINGS" | "ADMIN_REMOVE_GROUP_MEMBER" | "ADMIN_APPROVE_JOIN_REQUEST" |
  "ADMIN_REJECT_JOIN_REQUEST" | "ADMIN_DELETE_GROUP" | "ADMIN_REMOVE_STREAM_VIEWER" |
  "ADMIN_KICK_STREAM_VIEWER" | "WALLET_ADJUSTED" | "GIFT_TYPE_CREATED" | "GIFT_TYPE_UPDATED" |
  "WITHDRAWAL_APPROVED" | "WITHDRAWAL_REJECTED" | "KYC_APPROVED" | "KYC_REJECTED";

// Extended user type with all settings
export type UserWithFullSettings = User & {
  settings?: UserSettings;
  loginSessions?: LoginSession[];
  trustedDevices?: TrustedDevice[];
  blockedAccounts?: Block[];
  restrictedAccounts?: RestrictedAccount[];
  mutedAccounts?: MutedAccount[];
  closeFriends?: CloseFriend[];
  keywordFilters?: KeywordFilter[];
};

// Admin view of user
export type AdminUserView = User & {
  settings?: UserSettings;
  roles?: Role[];
  adminNotes?: AdminUserNote[];
  loginSessions?: LoginSession[];
  reports?: Report[];
};

// Insert schemas for new tables
export const insertDraftSchema = createInsertSchema(drafts).pick({
  userId: true,
  type: true,
  content: true,
  caption: true,
  mediaUrl: true,
  thumbnailUrl: true,
  durationMs: true,
  aspectRatio: true,
  visibility: true,
  commentsEnabled: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).pick({
  userId: true,
  type: true,
  content: true,
  caption: true,
  mediaUrl: true,
  thumbnailUrl: true,
  durationMs: true,
  aspectRatio: true,
  visibility: true,
  commentsEnabled: true,
  scheduledFor: true,
});

// ===== ADVANCED FEATURES SCHEMA =====
// Virtual Currency, Live Streaming, Groups, Events, Subscriptions, etc.

// ===== VIRTUAL CURRENCY / COINS SYSTEM =====

export const wallets = pgTable("wallets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  coinBalance: bigint("coin_balance", { mode: "number" }).default(0).notNull(),
  lifetimeEarned: bigint("lifetime_earned", { mode: "number" }).default(0).notNull(),
  lifetimeSpent: bigint("lifetime_spent", { mode: "number" }).default(0).notNull(),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("wallets_user_id_idx").on(table.userId),
]);

export const coinTransactionTypeEnum = pgEnum("coin_transaction_type", [
  "PURCHASE", "GIFT_SENT", "GIFT_RECEIVED", "REFUND", "ADMIN_CREDIT", "ADMIN_DEBIT", "SUBSCRIPTION_PAYMENT"
]);

// ===== PAYFAST ORDERS =====
export const payfastOrderStatusEnum = pgEnum("payfast_order_status", [
  "PENDING", "COMPLETE", "FAILED", "CANCELLED"
]);

export const payfastOrders = pgTable("payfast_orders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mallItemId: varchar("mall_item_id")
    .references(() => mallItems.id, { onDelete: "set null" }),
  quantity: integer("quantity").default(1).notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: payfastOrderStatusEnum("status").default("PENDING").notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemDescription: text("item_description"),
  emailAddress: varchar("email_address", { length: 255 }),
  pfPaymentId: varchar("pf_payment_id", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 50 }),
  amountGross: varchar("amount_gross", { length: 50 }),
  amountFee: varchar("amount_fee", { length: 50 }),
  amountNet: varchar("amount_net", { length: 50 }),
  signature: varchar("signature", { length: 255 }),
  itnPayload: text("itn_payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("payfast_orders_user_id_idx").on(table.userId),
  index("payfast_orders_status_idx").on(table.status),
  index("payfast_orders_pf_payment_id_idx").on(table.pfPaymentId),
]);

export type PayfastOrder = typeof payfastOrders.$inferSelect;
export type InsertPayfastOrder = typeof payfastOrders.$inferInsert;

export const coinTransactions = pgTable("coin_transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id")
    .notNull()
    .references(() => wallets.id, { onDelete: "cascade" }),
  type: coinTransactionTypeEnum("type").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
  description: text("description"),
  referenceId: varchar("reference_id"),
  referenceType: varchar("reference_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("coin_transactions_wallet_idx").on(table.walletId),
  index("coin_transactions_created_idx").on(table.createdAt),
]);

export const giftTypes = pgTable("gift_types", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url").notNull(),
  animationUrl: text("animation_url"),
  coinCost: integer("coin_cost").notNull(),
  netWorthValue: integer("net_worth_value").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  category: varchar("category", { length: 50 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gift_types_active_idx").on(table.isActive),
  index("gift_types_category_idx").on(table.category),
]);

export const giftTransactions = pgTable("gift_transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  giftTypeId: varchar("gift_type_id")
    .notNull()
    .references(() => giftTypes.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1).notNull(),
  totalCoins: integer("total_coins").notNull(),
  contextType: varchar("context_type", { length: 50 }),
  contextId: varchar("context_id"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("gift_transactions_sender_idx").on(table.senderId),
  index("gift_transactions_recipient_idx").on(table.recipientId),
  index("gift_transactions_context_idx").on(table.contextType, table.contextId),
]);

// ===== COIN BUNDLES SYSTEM =====

export const coinBundles = pgTable("coin_bundles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  coinAmount: integer("coin_amount").notNull(),
  bonusCoins: integer("bonus_coins").default(0).notNull(),
  priceRands: integer("price_rands").notNull(),
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("coin_bundles_active_idx").on(table.isActive),
  index("coin_bundles_sort_idx").on(table.sortOrder),
]);

export const coinPurchases = pgTable("coin_purchases", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bundleId: varchar("bundle_id")
    .notNull()
    .references(() => coinBundles.id, { onDelete: "restrict" }),
  coinsReceived: integer("coins_received").notNull(),
  amountPaidRands: integer("amount_paid_rands").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("payfast").notNull(),
  paymentReference: varchar("payment_reference", { length: 255 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("coin_purchases_user_idx").on(table.userId),
  index("coin_purchases_status_idx").on(table.status),
  index("coin_purchases_reference_idx").on(table.paymentReference),
]);

// ===== DAILY REWARDS SYSTEM =====

export const dailyRewards = pgTable("daily_rewards", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  lastClaimDate: date("last_claim_date"),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  totalClaimed: integer("total_claimed").default(0).notNull(),
  totalCoinsEarned: integer("total_coins_earned").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("daily_rewards_user_idx").on(table.userId),
]);

export const dailyRewardConfig = pgTable("daily_reward_config", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  dayNumber: integer("day_number").notNull().unique(),
  baseCoins: integer("base_coins").notNull(),
  streakBonus: integer("streak_bonus").default(0).notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== MALL ENHANCEMENTS =====

export const mallWishlists = pgTable("mall_wishlists", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: varchar("item_id")
    .notNull()
    .references(() => mallItems.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("mall_wishlists_unique").on(table.userId, table.itemId),
  index("mall_wishlists_user_idx").on(table.userId),
]);

export const mallReviews = pgTable("mall_reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: varchar("item_id")
    .notNull()
    .references(() => mallItems.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  review: text("review"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("mall_reviews_unique").on(table.userId, table.itemId),
  index("mall_reviews_item_idx").on(table.itemId),
  index("mall_reviews_user_idx").on(table.userId),
]);

// ===== WITHDRAWAL SYSTEM =====

export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "PENDING", "PROCESSING", "APPROVED", "REJECTED", "COMPLETED", "FAILED", "CANCELLED"
]);

export const userBankAccounts = pgTable("user_bank_accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  accountHolderName: varchar("account_holder_name", { length: 200 }).notNull(),
  branchCode: varchar("branch_code", { length: 20 }),
  accountType: varchar("account_type", { length: 50 }).default("savings").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_bank_accounts_user_idx").on(table.userId),
]);

export const kycStatusEnum = pgEnum("kyc_status", [
  "NOT_STARTED", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"
]);

export const userKyc = pgTable("user_kyc", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  status: kycStatusEnum("status").default("NOT_STARTED").notNull(),
  idType: varchar("id_type", { length: 50 }),
  idNumber: varchar("id_number", { length: 50 }),
  idDocumentUrl: text("id_document_url"),
  selfieUrl: text("selfie_url"),
  proofOfAddressUrl: text("proof_of_address_url"),
  fullLegalName: varchar("full_legal_name", { length: 200 }),
  dateOfBirth: date("date_of_birth"),
  nationality: varchar("nationality", { length: 100 }),
  address: text("address"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: varchar("reviewed_by")
    .references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_kyc_user_idx").on(table.userId),
  index("user_kyc_status_idx").on(table.status),
]);

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankAccountId: varchar("bank_account_id")
    .notNull()
    .references(() => userBankAccounts.id, { onDelete: "restrict" }),
  amountCoins: integer("amount_coins").notNull(),
  platformFeeCoins: integer("platform_fee_coins").notNull(),
  netAmountCoins: integer("net_amount_coins").notNull(),
  amountRands: integer("amount_rands").notNull(),
  status: withdrawalStatusEnum("status").default("PENDING").notNull(),
  paymentReference: varchar("payment_reference", { length: 255 }),
  rejectionReason: text("rejection_reason"),
  adminNotes: text("admin_notes"),
  processedBy: varchar("processed_by")
    .references(() => users.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("withdrawal_requests_user_idx").on(table.userId),
  index("withdrawal_requests_status_idx").on(table.status),
  index("withdrawal_requests_created_idx").on(table.createdAt),
]);

// ===== PLATFORM REVENUE & STATS =====

export const platformRevenueSourceEnum = pgEnum("platform_revenue_source", [
  "COIN_PURCHASE", "WITHDRAWAL_FEE", "MARKETPLACE_FEE", "BATTLE_FEE", "PREMIUM_FEATURE", "ADVERTISEMENT", "OTHER"
]);

export const platformRevenue = pgTable("platform_revenue", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  source: platformRevenueSourceEnum("source").notNull(),
  amountRands: integer("amount_rands").notNull(),
  referenceType: varchar("reference_type", { length: 50 }),
  referenceId: varchar("reference_id"),
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("platform_revenue_source_idx").on(table.source),
  index("platform_revenue_created_idx").on(table.createdAt),
  index("platform_revenue_user_idx").on(table.userId),
]);

export const platformStats = pgTable("platform_stats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  statDate: date("stat_date").notNull().unique(),
  totalCoinsInCirculation: bigint("total_coins_in_circulation", { mode: "number" }).default(0).notNull(),
  totalCoinsIssuedToday: integer("total_coins_issued_today").default(0).notNull(),
  totalCoinsBurnedToday: integer("total_coins_burned_today").default(0).notNull(),
  dailyActiveWallets: integer("daily_active_wallets").default(0).notNull(),
  totalRevenueToday: integer("total_revenue_today").default(0).notNull(),
  totalWithdrawalsToday: integer("total_withdrawals_today").default(0).notNull(),
  totalGiftsSent: integer("total_gifts_sent").default(0).notNull(),
  totalMallPurchases: integer("total_mall_purchases").default(0).notNull(),
  averageWalletBalance: integer("average_wallet_balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("platform_stats_date_idx").on(table.statDate),
]);

// ===== ACHIEVEMENTS SYSTEM =====

export const achievementCategoryEnum = pgEnum("achievement_category", [
  "WEALTH", "SOCIAL", "CONTENT", "SHOPPING", "GIFTING", "STREAMING", "SPECIAL"
]);

export const achievements = pgTable("achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  category: achievementCategoryEnum("category").notNull(),
  iconUrl: text("icon_url"),
  requirement: text("requirement").notNull(),
  rewardCoins: integer("reward_coins").default(0).notNull(),
  rewardBadge: varchar("reward_badge", { length: 100 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isSecret: boolean("is_secret").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("achievements_category_idx").on(table.category),
  index("achievements_active_idx").on(table.isActive),
]);

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id")
    .notNull()
    .references(() => achievements.id, { onDelete: "cascade" }),
  progress: integer("progress").default(0).notNull(),
  progressMax: integer("progress_max").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  rewardClaimed: boolean("reward_claimed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("user_achievements_unique").on(table.userId, table.achievementId),
  index("user_achievements_user_idx").on(table.userId),
  index("user_achievements_completed_idx").on(table.isCompleted),
]);

// ===== WEALTH CLUBS SYSTEM =====

export const wealthClubTierEnum = pgEnum("wealth_club_tier", [
  "BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"
]);

export const wealthClubs = pgTable("wealth_clubs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tier: wealthClubTierEnum("tier").notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  minNetWorth: bigint("min_net_worth", { mode: "number" }).notNull(),
  maxNetWorth: bigint("max_net_worth", { mode: "number" }),
  badgeIconUrl: text("badge_icon_url"),
  perks: text("perks"),
  discountPercent: integer("discount_percent").default(0).notNull(),
  bonusCoinPercent: integer("bonus_coin_percent").default(0).notNull(),
  prioritySupport: boolean("priority_support").default(false).notNull(),
  exclusiveContent: boolean("exclusive_content").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userWealthClub = pgTable("user_wealth_club", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  clubId: varchar("club_id")
    .notNull()
    .references(() => wealthClubs.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_wealth_club_user_idx").on(table.userId),
  index("user_wealth_club_club_idx").on(table.clubId),
]);

// ===== GIFT STAKING SYSTEM =====

export const stakeStatusEnum = pgEnum("stake_status", [
  "ACTIVE", "MATURED", "CLAIMED", "CANCELLED"
]);

export const giftStakes = pgTable("gift_stakes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  giftTransactionId: varchar("gift_transaction_id")
    .notNull()
    .references(() => giftTransactions.id, { onDelete: "cascade" }),
  stakedCoins: integer("staked_coins").notNull(),
  stakeDurationDays: integer("stake_duration_days").notNull(),
  bonusPercent: integer("bonus_percent").notNull(),
  expectedReturn: integer("expected_return").notNull(),
  status: stakeStatusEnum("status").default("ACTIVE").notNull(),
  stakedAt: timestamp("staked_at").defaultNow().notNull(),
  maturesAt: timestamp("matures_at").notNull(),
  claimedAt: timestamp("claimed_at"),
}, (table) => [
  index("gift_stakes_user_idx").on(table.userId),
  index("gift_stakes_status_idx").on(table.status),
  index("gift_stakes_matures_idx").on(table.maturesAt),
]);

export const stakingTiers = pgTable("staking_tiers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  bonusPercent: integer("bonus_percent").notNull(),
  minCoins: integer("min_coins").default(100).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ===== PLATFORM BATTLES SYSTEM =====

export const battleStatusEnum = pgEnum("battle_status", [
  "PENDING", "ACTIVE", "COMPLETED", "CANCELLED"
]);

export const platformBattles = pgTable("platform_battles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: battleStatusEnum("status").default("PENDING").notNull(),
  entryFeeCoins: integer("entry_fee_coins").default(0).notNull(),
  prizePoolCoins: integer("prize_pool_coins").default(0).notNull(),
  platformFeePercent: integer("platform_fee_percent").default(20).notNull(),
  maxParticipants: integer("max_participants"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  winnerId: varchar("winner_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("platform_battles_creator_idx").on(table.creatorId),
  index("platform_battles_status_idx").on(table.status),
  index("platform_battles_starts_idx").on(table.startsAt),
]);

export const battleParticipants = pgTable("battle_participants", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  battleId: varchar("battle_id")
    .notNull()
    .references(() => platformBattles.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  totalGiftsReceived: integer("total_gifts_received").default(0).notNull(),
  totalCoinsReceived: integer("total_coins_received").default(0).notNull(),
  rank: integer("rank"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
  unique("battle_participants_unique").on(table.battleId, table.userId),
  index("battle_participants_battle_idx").on(table.battleId),
  index("battle_participants_user_idx").on(table.userId),
]);

// ===== CREATOR MONETIZATION SYSTEM =====

export const creatorEarnings = pgTable("creator_earnings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  totalEarningsCoins: bigint("total_earnings_coins", { mode: "number" }).default(0).notNull(),
  pendingWithdrawalCoins: bigint("pending_withdrawal_coins", { mode: "number" }).default(0).notNull(),
  withdrawnCoins: bigint("withdrawn_coins", { mode: "number" }).default(0).notNull(),
  platformFeePaid: bigint("platform_fee_paid", { mode: "number" }).default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("creator_earnings_user_unique").on(table.userId),
  index("creator_earnings_user_idx").on(table.userId),
]);

export const earningsHistory = pgTable("earnings_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(),
  sourceId: varchar("source_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("earnings_history_user_idx").on(table.userId),
  index("earnings_history_created_idx").on(table.createdAt),
]);

// ===== ECONOMY CONFIG (Emergency Controls) =====

export const economyConfig = pgTable("economy_config", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by")
    .references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== SUPPORT TICKETS SYSTEM =====

export const ticketStatusEnum = pgEnum("ticket_status", [
  "OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "LOW", "MEDIUM", "HIGH", "URGENT"
]);

export const ticketCategoryEnum = pgEnum("ticket_category", [
  "ACCOUNT", "PAYMENT", "WITHDRAWAL", "COINS", "GIFTS", "MALL", "TECHNICAL", "REPORT", "OTHER"
]);

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: ticketCategoryEnum("category").notNull(),
  priority: ticketPriorityEnum("priority").default("MEDIUM").notNull(),
  status: ticketStatusEnum("status").default("OPEN").notNull(),
  assignedTo: varchar("assigned_to")
    .references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("support_tickets_user_idx").on(table.userId),
  index("support_tickets_status_idx").on(table.status),
  index("support_tickets_category_idx").on(table.category),
  index("support_tickets_assigned_idx").on(table.assignedTo),
]);

export const ticketSenderTypeEnum = pgEnum("ticket_sender_type", ["USER", "ADMIN", "SYSTEM"]);

export const supportTicketMessages = pgTable("support_ticket_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  senderType: ticketSenderTypeEnum("sender_type").default("USER").notNull(),
  content: text("content").notNull(),
  isInternal: boolean("is_internal").default(false).notNull(),
  attachmentUrls: text("attachment_urls"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("support_ticket_messages_ticket_idx").on(table.ticketId),
]);

// ===== PLATFORM CONFIG =====

export const platformConfig = pgTable("platform_config", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  valueType: varchar("value_type", { length: 20 }).default("string").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  isEditable: boolean("is_editable").default(true).notNull(),
  updatedBy: varchar("updated_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("platform_config_category_idx").on(table.category),
]);

// ===== LIVE STREAMING SYSTEM =====

export const liveStreamStatusEnum = pgEnum("live_stream_status", ["PREPARING", "LIVE", "ENDED", "CANCELLED"]);

export const liveStreams = pgTable("live_streams", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  hostId: varchar("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  coHostId: varchar("co_host_id")
    .references(() => users.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  status: liveStreamStatusEnum("status").default("PREPARING").notNull(),
  streamKey: varchar("stream_key", { length: 100 }),
  viewerCount: integer("viewer_count").default(0).notNull(),
  peakViewerCount: integer("peak_viewer_count").default(0).notNull(),
  totalViews: integer("total_views").default(0).notNull(),
  totalGiftsReceived: integer("total_gifts_received").default(0).notNull(),
  totalCoinsReceived: bigint("total_coins_received", { mode: "number" }).default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  sharesCount: integer("shares_count").default(0).notNull(),
  isRecorded: boolean("is_recorded").default(false).notNull(),
  recordingUrl: text("recording_url"),
  savedToProfile: boolean("saved_to_profile").default(false).notNull(),
  durationSeconds: integer("duration_seconds").default(0),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("live_streams_host_idx").on(table.hostId),
  index("live_streams_status_idx").on(table.status),
  index("live_streams_created_idx").on(table.createdAt),
]);

export const liveStreamViewers = pgTable("live_stream_viewers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id")
    .notNull()
    .references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
}, (table) => [
  index("live_stream_viewers_stream_idx").on(table.streamId),
  index("live_stream_viewers_user_idx").on(table.userId),
  unique("live_stream_viewers_unique").on(table.streamId, table.userId),
]);

export const liveStreamComments = pgTable("live_stream_comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id")
    .notNull()
    .references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("live_stream_comments_stream_idx").on(table.streamId),
  index("live_stream_comments_created_idx").on(table.createdAt),
]);

export const liveStreamReactions = pgTable("live_stream_reactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id")
    .notNull()
    .references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reactionType: varchar("reaction_type", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("live_stream_reactions_stream_idx").on(table.streamId),
]);

export const liveStreamGifts = pgTable("live_stream_gifts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id")
    .notNull()
    .references(() => liveStreams.id, { onDelete: "cascade" }),
  giftTransactionId: varchar("gift_transaction_id")
    .notNull()
    .references(() => giftTransactions.id, { onDelete: "cascade" }),
  displayedAt: timestamp("displayed_at").defaultNow().notNull(),
}, (table) => [
  index("live_stream_gifts_stream_idx").on(table.streamId),
]);

// ===== GROUPS / ELITE CIRCLES SYSTEM =====

export const groupPrivacyEnum = pgEnum("group_privacy", ["PUBLIC", "PRIVATE", "SECRET"]);
export const groupMemberRoleEnum = pgEnum("group_member_role", ["OWNER", "ADMIN", "MODERATOR", "MEMBER"]);

export const groups = pgTable("groups", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  iconUrl: text("icon_url"),
  privacy: groupPrivacyEnum("privacy").default("PUBLIC").notNull(),
  ownerId: varchar("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memberCount: integer("member_count").default(1).notNull(),
  postCount: integer("post_count").default(0).notNull(),
  rules: jsonb("rules").default([]),
  tags: jsonb("tags").default([]),
  requireApproval: boolean("require_approval").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  netWorthRequirement: bigint("net_worth_requirement", { mode: "number" }),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("groups_owner_idx").on(table.ownerId),
  index("groups_privacy_idx").on(table.privacy),
  index("groups_created_idx").on(table.createdAt),
]);

export const groupMembers = pgTable("group_members", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: groupMemberRoleEnum("role").default("MEMBER").notNull(),
  invitedById: varchar("invited_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  muteNotifications: boolean("mute_notifications").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
  unique("group_members_unique").on(table.groupId, table.userId),
  index("group_members_group_idx").on(table.groupId),
  index("group_members_user_idx").on(table.userId),
]);

export const groupJoinRequestStatusEnum = pgEnum("group_join_request_status", ["PENDING", "APPROVED", "REJECTED"]);

export const groupJoinRequests = pgTable("group_join_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  message: text("message"),
  status: groupJoinRequestStatusEnum("status").default("PENDING").notNull(),
  reviewedById: varchar("reviewed_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("group_join_requests_unique").on(table.groupId, table.userId),
  index("group_join_requests_status_idx").on(table.status),
]);

export const groupPosts = pgTable("group_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: varchar("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  isPinned: boolean("is_pinned").default(false).notNull(),
  pinnedById: varchar("pinned_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  pinnedAt: timestamp("pinned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("group_posts_unique").on(table.groupId, table.postId),
  index("group_posts_group_idx").on(table.groupId),
  index("group_posts_pinned_idx").on(table.isPinned),
]);

// ===== EVENTS SYSTEM =====

export const eventStatusEnum = pgEnum("event_status", ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]);
export const eventTypeEnum = pgEnum("event_type", ["IN_PERSON", "VIRTUAL", "HYBRID"]);
export const rsvpStatusEnum = pgEnum("rsvp_status", ["GOING", "INTERESTED", "NOT_GOING"]);

export const events = pgTable("events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  hostId: varchar("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  groupId: varchar("group_id")
    .references(() => groups.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  eventType: eventTypeEnum("event_type").default("IN_PERSON").notNull(),
  status: eventStatusEnum("status").default("DRAFT").notNull(),
  locationName: text("location_name"),
  locationAddress: text("location_address"),
  locationLat: real("location_lat"),
  locationLng: real("location_lng"),
  virtualLink: text("virtual_link"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at"),
  timezone: varchar("timezone", { length: 50 }),
  maxAttendees: integer("max_attendees"),
  goingCount: integer("going_count").default(0).notNull(),
  interestedCount: integer("interested_count").default(0).notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  requireApproval: boolean("require_approval").default(false).notNull(),
  ticketPrice: integer("ticket_price"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("events_host_idx").on(table.hostId),
  index("events_status_idx").on(table.status),
  index("events_starts_at_idx").on(table.startsAt),
  index("events_group_idx").on(table.groupId),
]);

export const eventRsvps = pgTable("event_rsvps", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  eventId: varchar("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: rsvpStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("event_rsvps_unique").on(table.eventId, table.userId),
  index("event_rsvps_event_idx").on(table.eventId),
  index("event_rsvps_user_idx").on(table.userId),
]);

// ===== SUBSCRIPTIONS / SUPER FOLLOWS SYSTEM =====

export const subscriptionTiers = pgTable("subscription_tiers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  monthlyPriceCoins: integer("monthly_price_coins").notNull(),
  yearlyPriceCoins: integer("yearly_price_coins"),
  benefits: jsonb("benefits").default([]),
  isActive: boolean("is_active").default(true).notNull(),
  subscriberCount: integer("subscriber_count").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("subscription_tiers_creator_idx").on(table.creatorId),
  index("subscription_tiers_active_idx").on(table.isActive),
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "CANCELLED", "EXPIRED", "PAUSED"]);

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tierId: varchar("tier_id")
    .notNull()
    .references(() => subscriptionTiers.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
  isYearly: boolean("is_yearly").default(false).notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("subscriptions_unique").on(table.subscriberId, table.creatorId),
  index("subscriptions_subscriber_idx").on(table.subscriberId),
  index("subscriptions_creator_idx").on(table.creatorId),
  index("subscriptions_status_idx").on(table.status),
]);

// ===== BROADCAST CHANNELS SYSTEM =====

export const broadcastChannels = pgTable("broadcast_channels", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  subscriberCount: integer("subscriber_count").default(0).notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("broadcast_channels_owner_idx").on(table.ownerId),
  index("broadcast_channels_active_idx").on(table.isActive),
]);

export const broadcastChannelSubscribers = pgTable("broadcast_channel_subscribers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id")
    .notNull()
    .references(() => broadcastChannels.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  muteNotifications: boolean("mute_notifications").default(false).notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
}, (table) => [
  unique("broadcast_channel_subscribers_unique").on(table.channelId, table.userId),
  index("broadcast_channel_subscribers_channel_idx").on(table.channelId),
  index("broadcast_channel_subscribers_user_idx").on(table.userId),
]);

export const broadcastMessages = pgTable("broadcast_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id")
    .notNull()
    .references(() => broadcastChannels.id, { onDelete: "cascade" }),
  content: text("content"),
  mediaUrl: text("media_url"),
  mediaType: varchar("media_type", { length: 20 }),
  isPinned: boolean("is_pinned").default(false).notNull(),
  reactionsCount: integer("reactions_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("broadcast_messages_channel_idx").on(table.channelId),
  index("broadcast_messages_created_idx").on(table.createdAt),
]);

// ===== ENHANCED POST REACTIONS SYSTEM =====

export const postReactionTypeEnum = pgEnum("post_reaction_type", [
  "LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY", "FIRE", "DIAMOND", "CROWN"
]);

export const postReactions = pgTable("post_reactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reactionType: postReactionTypeEnum("reaction_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("post_reactions_unique").on(table.postId, table.userId),
  index("post_reactions_post_idx").on(table.postId),
  index("post_reactions_type_idx").on(table.reactionType),
]);

// ===== LOCATION SHARING / SNAP MAP SYSTEM =====

export const userLocations = pgTable("user_locations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"),
  locationName: text("location_name"),
  isSharing: boolean("is_sharing").default(false).notNull(),
  sharingMode: varchar("sharing_mode", { length: 20 }).default("FRIENDS"),
  expiresAt: timestamp("expires_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_locations_user_idx").on(table.userId),
  index("user_locations_sharing_idx").on(table.isSharing),
]);

export const locationSharingSettings = pgTable("location_sharing_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  ghostMode: boolean("ghost_mode").default(false).notNull(),
  shareWithFollowers: boolean("share_with_followers").default(true).notNull(),
  shareWithCloseFriends: boolean("share_with_close_friends").default(true).notNull(),
  showLastSeen: boolean("show_last_seen").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== CHECK-INS / VENUES SYSTEM =====

export const venues = pgTable("venues", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  photoUrl: text("photo_url"),
  checkInCount: integer("check_in_count").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("venues_location_idx").on(table.latitude, table.longitude),
  index("venues_city_idx").on(table.city),
  index("venues_category_idx").on(table.category),
]);

export const checkIns = pgTable("check_ins", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  venueId: varchar("venue_id")
    .references(() => venues.id, { onDelete: "set null" }),
  postId: varchar("post_id")
    .references(() => posts.id, { onDelete: "set null" }),
  customLocationName: text("custom_location_name"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("check_ins_user_idx").on(table.userId),
  index("check_ins_venue_idx").on(table.venueId),
  index("check_ins_created_idx").on(table.createdAt),
]);

// ===== GROUP CHATS SYSTEM =====

export const groupConversations = pgTable("group_conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  memberCount: integer("member_count").default(1).notNull(),
  messageCount: integer("message_count").default(0).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("group_conversations_creator_idx").on(table.creatorId),
  index("group_conversations_last_message_idx").on(table.lastMessageAt),
]);

export const groupConversationMemberRoleEnum = pgEnum("group_conversation_member_role", ["ADMIN", "MEMBER"]);

export const groupConversationMembers = pgTable("group_conversation_members", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => groupConversations.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: groupConversationMemberRoleEnum("role").default("MEMBER").notNull(),
  nickname: varchar("nickname", { length: 50 }),
  muteUntil: timestamp("mute_until"),
  lastReadAt: timestamp("last_read_at"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => [
  unique("group_conversation_members_unique").on(table.conversationId, table.userId),
  index("group_conversation_members_conv_idx").on(table.conversationId),
  index("group_conversation_members_user_idx").on(table.userId),
]);

export const groupMessages = pgTable("group_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => groupConversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  messageType: messageTypeEnum("message_type").default("TEXT"),
  mediaUrl: text("media_url"),
  mediaThumbnail: text("media_thumbnail"),
  mediaDuration: integer("media_duration"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  replyToId: varchar("reply_to_id"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  reactions: jsonb("reactions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("group_messages_conv_idx").on(table.conversationId),
  index("group_messages_created_idx").on(table.createdAt),
]);

// ===== VIDEO CALLING SYSTEM =====

export const callStatusEnum = pgEnum("call_status", ["RINGING", "ONGOING", "ENDED", "MISSED", "DECLINED", "CANCELLED"]);
export const callTypeEnum = pgEnum("call_type", ["AUDIO", "VIDEO"]);

export const videoCalls = pgTable("video_calls", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  callerId: varchar("caller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  calleeId: varchar("callee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  callType: callTypeEnum("call_type").default("VIDEO").notNull(),
  status: callStatusEnum("status").default("RINGING").notNull(),
  roomId: varchar("room_id", { length: 100 }),
  durationSeconds: integer("duration_seconds"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("video_calls_caller_idx").on(table.callerId),
  index("video_calls_callee_idx").on(table.calleeId),
  index("video_calls_status_idx").on(table.status),
  index("video_calls_created_idx").on(table.createdAt),
]);

// ===== VANISH MODE FOR MESSAGES =====

export const vanishModeSettings = pgTable("vanish_mode_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  enabledById: varchar("enabled_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  enabledAt: timestamp("enabled_at"),
  disabledAt: timestamp("disabled_at"),
}, (table) => [
  unique("vanish_mode_settings_conv").on(table.conversationId),
  index("vanish_mode_settings_enabled_idx").on(table.isEnabled),
]);

// ===== HIDDEN WORDS FILTER =====

export const hiddenWords = pgTable("hidden_words", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  word: varchar("word", { length: 100 }).notNull(),
  filterInComments: boolean("filter_in_comments").default(true).notNull(),
  filterInMessages: boolean("filter_in_messages").default(true).notNull(),
  filterInStoryReplies: boolean("filter_in_story_replies").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("hidden_words_unique").on(table.userId, table.word),
  index("hidden_words_user_idx").on(table.userId),
]);

// ===== LINKED ACCOUNTS (ACCOUNT SWITCHING) =====

export const linkedAccounts = pgTable("linked_accounts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  primaryUserId: varchar("primary_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  linkedUserId: varchar("linked_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
}, (table) => [
  unique("linked_accounts_unique").on(table.primaryUserId, table.linkedUserId),
  index("linked_accounts_primary_idx").on(table.primaryUserId),
  index("linked_accounts_linked_idx").on(table.linkedUserId),
]);

// ===== TWO-FACTOR AUTHENTICATION =====

export const totpSecrets = pgTable("totp_secrets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const backupCodes = pgTable("backup_codes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 20 }).notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("backup_codes_user_idx").on(table.userId),
]);

// ===== AR FILTERS / LENSES =====

export const arFilters = pgTable("ar_filters", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  creatorId: varchar("creator_id")
    .references(() => users.id, { onDelete: "set null" }),
  thumbnailUrl: text("thumbnail_url").notNull(),
  filterUrl: text("filter_url").notNull(),
  category: varchar("category", { length: 50 }),
  usageCount: integer("usage_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ar_filters_category_idx").on(table.category),
  index("ar_filters_active_idx").on(table.isActive),
  index("ar_filters_featured_idx").on(table.isFeatured),
]);

// ===== HASHTAGS / TRENDING =====

export const hashtags = pgTable("hashtags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 100 }).notNull().unique(),
  postCount: integer("post_count").default(0).notNull(),
  weeklyPostCount: integer("weekly_post_count").default(0).notNull(),
  isBlocked: boolean("is_blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("hashtags_tag_idx").on(table.tag),
  index("hashtags_post_count_idx").on(table.postCount),
  index("hashtags_weekly_idx").on(table.weeklyPostCount),
]);

export const postHashtags = pgTable("post_hashtags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  hashtagId: varchar("hashtag_id")
    .notNull()
    .references(() => hashtags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("post_hashtags_unique").on(table.postId, table.hashtagId),
  index("post_hashtags_post_idx").on(table.postId),
  index("post_hashtags_hashtag_idx").on(table.hashtagId),
]);

// ===== THREAD / CHAIN POSTS =====

export const postThreads = pgTable("post_threads", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }),
  postCount: integer("post_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("post_threads_author_idx").on(table.authorId),
]);

export const threadPosts = pgTable("thread_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id")
    .notNull()
    .references(() => postThreads.id, { onDelete: "cascade" }),
  postId: varchar("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("thread_posts_unique").on(table.threadId, table.postId),
  index("thread_posts_thread_idx").on(table.threadId),
  index("thread_posts_position_idx").on(table.threadId, table.position),
]);

// ===== DUET / STITCH POSTS =====

export const duetStitchTypeEnum = pgEnum("duet_stitch_type", ["DUET", "STITCH"]);

export const duetStitchPosts = pgTable("duet_stitch_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .unique()
    .references(() => posts.id, { onDelete: "cascade" }),
  originalPostId: varchar("original_post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  type: duetStitchTypeEnum("type").notNull(),
  stitchStartMs: integer("stitch_start_ms"),
  stitchEndMs: integer("stitch_end_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("duet_stitch_posts_original_idx").on(table.originalPostId),
  index("duet_stitch_posts_type_idx").on(table.type),
]);

// ===== WEBHOOKS (DEVELOPER API) =====

export const webhooks = pgTable("webhooks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 100 }).notNull(),
  events: jsonb("events").default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  failureCount: integer("failure_count").default(0).notNull(),
  lastDeliveredAt: timestamp("last_delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("webhooks_user_idx").on(table.userId),
  index("webhooks_active_idx").on(table.isActive),
]);

export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  webhookId: varchar("webhook_id")
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  event: varchar("event", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  retryCount: integer("retry_count").default(0).notNull(),
  success: boolean("success").default(false).notNull(),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("webhook_deliveries_webhook_idx").on(table.webhookId),
  index("webhook_deliveries_created_idx").on(table.createdAt),
  index("webhook_deliveries_success_idx").on(table.success),
]);

// ===== API ACCESS TOKENS =====

export const apiAccessTokens = pgTable("api_access_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  scopes: jsonb("scopes").default([]).notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("api_tokens_user_idx").on(table.userId),
  index("api_tokens_token_idx").on(table.token),
  index("api_tokens_revoked_idx").on(table.isRevoked),
]);

// ===== FEATURE FLAGS =====

export const featureFlags = pgTable("feature_flags", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  rolloutPercentage: integer("rollout_percentage").default(100),
  allowedUserIds: jsonb("allowed_user_ids").default([]),
  blockedUserIds: jsonb("blocked_user_ids").default([]),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("feature_flags_key_idx").on(table.key),
  index("feature_flags_enabled_idx").on(table.isEnabled),
]);

// ===== REPLY THREADS (NESTED COMMENTS) =====

export const commentReplies = pgTable("comment_replies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  authorId: varchar("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentReplyId: varchar("parent_reply_id"),
  content: text("content").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("comment_replies_comment_idx").on(table.commentId),
  index("comment_replies_parent_idx").on(table.parentReplyId),
  index("comment_replies_author_idx").on(table.authorId),
]);

// ===== POKE / WAVE FEATURE =====

export const pokes = pgTable("pokes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  recipientId: varchar("recipient_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pokeType: varchar("poke_type", { length: 20 }).default("WAVE").notNull(),
  seenAt: timestamp("seen_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("pokes_sender_idx").on(table.senderId),
  index("pokes_recipient_idx").on(table.recipientId),
  index("pokes_created_idx").on(table.createdAt),
]);

// ===== BFF STATUS =====

export const bffStatus = pgTable("bff_status", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bffId: varchar("bff_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  streakCount: integer("streak_count").default(0).notNull(),
  lastInteractionAt: timestamp("last_interaction_at").defaultNow().notNull(),
  becameBffAt: timestamp("became_bff_at").defaultNow().notNull(),
}, (table) => [
  unique("bff_status_unique").on(table.userId, table.bffId),
  index("bff_status_user_idx").on(table.userId),
  index("bff_status_streak_idx").on(table.streakCount),
]);

// ===== SCHEDULED MESSAGES =====

export const scheduledMessages = pgTable("scheduled_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").default("TEXT"),
  mediaUrl: text("media_url"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  isCancelled: boolean("is_cancelled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("scheduled_messages_scheduled_for_idx").on(table.scheduledFor),
  index("scheduled_messages_sender_idx").on(table.senderId),
]);

// ===== PINNED MESSAGES =====

export const pinnedMessages = pgTable("pinned_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  messageId: varchar("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  pinnedById: varchar("pinned_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
}, (table) => [
  unique("pinned_messages_unique").on(table.conversationId, table.messageId),
  index("pinned_messages_conv_idx").on(table.conversationId),
]);

// ===== CHAT FOLDERS =====

export const chatFolders = pgTable("chat_folders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  iconName: varchar("icon_name", { length: 50 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("chat_folders_user_idx").on(table.userId),
]);

export const chatFolderConversations = pgTable("chat_folder_conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  folderId: varchar("folder_id")
    .notNull()
    .references(() => chatFolders.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("chat_folder_conversations_unique").on(table.folderId, table.conversationId),
  index("chat_folder_conversations_folder_idx").on(table.folderId),
]);

// ===== USAGE TRACKING / FOCUS MODE =====

export const usageStats = pgTable("usage_stats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  screenTimeMinutes: integer("screen_time_minutes").default(0).notNull(),
  sessionsCount: integer("sessions_count").default(0).notNull(),
  postsViewed: integer("posts_viewed").default(0).notNull(),
  storiesViewed: integer("stories_viewed").default(0).notNull(),
  messagesSent: integer("messages_sent").default(0).notNull(),
  notificationsReceived: integer("notifications_received").default(0).notNull(),
}, (table) => [
  unique("usage_stats_user_date").on(table.userId, table.date),
  index("usage_stats_user_idx").on(table.userId),
  index("usage_stats_date_idx").on(table.date),
]);

export const focusModeSettings = pgTable("focus_mode_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  dailyLimitMinutes: integer("daily_limit_minutes"),
  breakReminderMinutes: integer("break_reminder_minutes"),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }),
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }),
  hideNotificationCounts: boolean("hide_notification_counts").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== SMART NOTIFICATIONS =====

export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  digestMode: boolean("digest_mode").default(false).notNull(),
  digestFrequency: varchar("digest_frequency", { length: 20 }).default("DAILY"),
  prioritizeCloseFriends: boolean("prioritize_close_friends").default(true).notNull(),
  muteLowEngagement: boolean("mute_low_engagement").default(false).notNull(),
  smartBundling: boolean("smart_bundling").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ===== SECURITY CHECKUP / BACKUP =====

export const securityCheckups = pgTable("security_checkups", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  checkupDate: timestamp("checkup_date").defaultNow().notNull(),
  passwordStrength: varchar("password_strength", { length: 20 }),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  recoveryEmailSet: boolean("recovery_email_set").default(false).notNull(),
  loginAlertsEnabled: boolean("login_alerts_enabled").default(false).notNull(),
  suspiciousActivityFound: boolean("suspicious_activity_found").default(false).notNull(),
  recommendations: jsonb("recommendations").default([]),
}, (table) => [
  index("security_checkups_user_idx").on(table.userId),
  index("security_checkups_date_idx").on(table.checkupDate),
]);

export const accountBackups = pgTable("account_backups", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  backupType: varchar("backup_type", { length: 50 }).notNull(),
  downloadUrl: text("download_url"),
  fileSize: bigint("file_size", { mode: "number" }),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("account_backups_user_idx").on(table.userId),
  index("account_backups_status_idx").on(table.status),
]);

// ===== AI FEATURES =====

export const aiAvatars = pgTable("ai_avatars", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }),
  sourceImageUrl: text("source_image_url"),
  avatarUrl: text("avatar_url").notNull(),
  style: varchar("style", { length: 50 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_avatars_user_idx").on(table.userId),
]);

export const aiTranslations = pgTable("ai_translations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sourceText: text("source_text").notNull(),
  sourceLanguage: varchar("source_language", { length: 10 }),
  targetLanguage: varchar("target_language", { length: 10 }).notNull(),
  translatedText: text("translated_text").notNull(),
  contentType: varchar("content_type", { length: 50 }),
  contentId: varchar("content_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ai_translations_content_idx").on(table.contentType, table.contentId),
]);

// ===== IMPORT FROM OTHER PLATFORMS =====

export const platformImportStatusEnum = pgEnum("platform_import_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED"]);

export const platformImports = pgTable("platform_imports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform", { length: 50 }).notNull(),
  status: platformImportStatusEnum("status").default("PENDING").notNull(),
  importedFollowers: integer("imported_followers").default(0),
  importedPosts: integer("imported_posts").default(0),
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("platform_imports_user_idx").on(table.userId),
  index("platform_imports_status_idx").on(table.status),
]);

// ===== EXPLORE CATEGORIES =====

export const exploreCategories = pgTable("explore_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  iconName: varchar("icon_name", { length: 50 }),
  coverUrl: text("cover_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("explore_categories_slug_idx").on(table.slug),
  index("explore_categories_active_idx").on(table.isActive),
]);

// ===== API USAGE TRACKING =====

// Service types for API usage tracking
export const apiServiceEnum = pgEnum("api_service", [
  "CLOUDINARY", "RESEND", "OPENAI", "GEMINI", "TWILIO", "PAYFAST", "EXPO_PUSH"
]);

// Daily API usage tracking per service
export const apiUsageDaily = pgTable("api_usage_daily", {
  id: serial("id").primaryKey(),
  service: apiServiceEnum("service").notNull(),
  date: date("date").notNull(),
  requestCount: integer("request_count").default(0),
  bytesTransferred: bigint("bytes_transferred", { mode: "number" }).default(0),
  estimatedCostCents: integer("estimated_cost_cents").default(0),
  errors: integer("errors").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("api_usage_daily_service_date_idx").on(table.service, table.date),
]);

// API usage alerts configuration
export const apiUsageAlerts = pgTable("api_usage_alerts", {
  id: serial("id").primaryKey(),
  service: apiServiceEnum("service").notNull(),
  alertType: text("alert_type").notNull(), // DAILY_LIMIT, MONTHLY_LIMIT, ERROR_RATE
  thresholdValue: integer("threshold_value").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  notifyEmail: text("notify_email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API usage alert history
export const apiUsageAlertHistory = pgTable("api_usage_alert_history", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => apiUsageAlerts.id),
  service: apiServiceEnum("service").notNull(),
  alertType: text("alert_type").notNull(),
  currentValue: integer("current_value").notNull(),
  thresholdValue: integer("threshold_value").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ===== HELP CENTER SYSTEM =====

// Help article status enum
export const helpArticleStatusEnum = pgEnum("help_article_status", [
  "DRAFT", "PUBLISHED", "ARCHIVED"
]);

// Help article difficulty enum
export const helpDifficultyEnum = pgEnum("help_difficulty", [
  "BEGINNER", "INTERMEDIATE", "ADVANCED"
]);

// Support ticket attachment type enum
export const attachmentTypeEnum = pgEnum("attachment_type", [
  "IMAGE", "VIDEO", "DOCUMENT", "AUDIO", "ARCHIVE", "OTHER"
]);

// Feature request status enum
export const featureRequestStatusEnum = pgEnum("feature_request_status", [
  "NEW", "UNDER_REVIEW", "PLANNED", "IN_PROGRESS", "COMPLETED", "DECLINED"
]);

// System status type enum
export const systemStatusTypeEnum = pgEnum("system_status_type", [
  "OPERATIONAL", "DEGRADED", "PARTIAL_OUTAGE", "MAJOR_OUTAGE", "MAINTENANCE"
]);

// Appeal status enum
export const appealStatusEnum = pgEnum("appeal_status", [
  "PENDING", "UNDER_REVIEW", "APPROVED", "DENIED", "MORE_INFO_NEEDED"
]);

// Appeal type enum
export const appealTypeEnum = pgEnum("appeal_type", [
  "ACCOUNT_SUSPENDED", "CONTENT_REMOVED", "VERIFICATION_DENIED", "WITHDRAWAL_REJECTED", "OTHER"
]);

// Help categories - organized by app features
export const helpCategories = pgTable("help_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }), // Icon name from icon library
  color: varchar("color", { length: 20 }), // Hex color for category
  parentId: varchar("parent_id"), // For subcategories
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  articleCount: integer("article_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("help_categories_slug_idx").on(table.slug),
  index("help_categories_parent_idx").on(table.parentId),
  index("help_categories_active_idx").on(table.isActive),
]);

// Help articles - the main help content
export const helpArticles = pgTable("help_articles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => helpCategories.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  summary: text("summary"), // Short description for search results
  content: text("content").notNull(), // Rich text content (markdown/HTML)
  difficulty: helpDifficultyEnum("difficulty").default("BEGINNER"),
  status: helpArticleStatusEnum("status").default("DRAFT").notNull(),
  hasWalkthrough: boolean("has_walkthrough").default(false).notNull(),
  hasVideo: boolean("has_video").default(false).notNull(),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  estimatedReadTime: integer("estimated_read_time").default(2), // In minutes
  viewCount: integer("view_count").default(0).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  notHelpfulCount: integer("not_helpful_count").default(0).notNull(),
  tags: jsonb("tags").default([]), // Array of tags for search
  relatedArticleIds: jsonb("related_article_ids").default([]), // Array of related article IDs
  metaTitle: varchar("meta_title", { length: 100 }), // SEO
  metaDescription: text("meta_description"), // SEO
  authorId: varchar("author_id")
    .references(() => users.id, { onDelete: "set null" }),
  lastUpdatedBy: varchar("last_updated_by")
    .references(() => users.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("help_articles_category_idx").on(table.categoryId),
  index("help_articles_slug_idx").on(table.slug),
  index("help_articles_status_idx").on(table.status),
]);

// Help article steps - for interactive walkthroughs
export const helpArticleSteps = pgTable("help_article_steps", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  articleId: varchar("article_id")
    .notNull()
    .references(() => helpArticles.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"), // Screenshot
  videoUrl: text("video_url"), // Optional video for step
  targetElement: varchar("target_element", { length: 100 }), // CSS selector for highlighting
  screenName: varchar("screen_name", { length: 100 }), // App screen this relates to
  actionType: varchar("action_type", { length: 50 }), // TAP, SWIPE, TYPE, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("help_article_steps_article_idx").on(table.articleId),
]);

// Support inboxes - one per user (like Facebook support inbox)
export const supportInboxes = pgTable("support_inboxes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  totalTickets: integer("total_tickets").default(0).notNull(),
  openTickets: integer("open_tickets").default(0).notNull(),
  unreadMessages: integer("unread_messages").default(0).notNull(),
  priorityLevel: varchar("priority_level", { length: 20 }).default("STANDARD"), // STANDARD, VIP, DIAMOND
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("support_inboxes_user_idx").on(table.userId),
]);

// Ticket attachments - separate table for large file support (up to 1GB)
export const ticketAttachments = pgTable("ticket_attachments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  messageId: varchar("message_id")
    .notNull()
    .references(() => supportTicketMessages.id, { onDelete: "cascade" }),
  ticketId: varchar("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: attachmentTypeEnum("file_type").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(), // In bytes
  fileUrl: text("file_url").notNull(), // Cloudinary URL
  thumbnailUrl: text("thumbnail_url"), // For images/videos
  publicId: varchar("public_id", { length: 200 }), // Cloudinary public ID
  uploadedById: varchar("uploaded_by_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_attachments_message_idx").on(table.messageId),
  index("ticket_attachments_ticket_idx").on(table.ticketId),
]);

// Ticket internal notes - admin-only notes on tickets
export const ticketInternalNotes = pgTable("ticket_internal_notes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id")
    .notNull()
    .references(() => supportTickets.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_internal_notes_ticket_idx").on(table.ticketId),
]);

// Canned responses - pre-written responses for common issues
export const cannedResponses = pgTable("canned_responses", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: ticketCategoryEnum("category"),
  shortcut: varchar("shortcut", { length: 50 }), // e.g., /password to insert password reset response
  usageCount: integer("usage_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("canned_responses_category_idx").on(table.category),
]);

// FAQs - frequently asked questions
export const helpFaqs = pgTable("help_faqs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id")
    .references(() => helpCategories.id, { onDelete: "set null" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  notHelpfulCount: integer("not_helpful_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("help_faqs_category_idx").on(table.categoryId),
  index("help_faqs_active_idx").on(table.isActive),
]);

// System status - platform health indicators
export const systemStatus = pgTable("system_status", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  component: varchar("component", { length: 100 }).notNull(), // e.g., "Feed", "Messaging", "Payments"
  status: systemStatusTypeEnum("status").default("OPERATIONAL").notNull(),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  affectedFeatures: jsonb("affected_features").default([]),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  updatedBy: varchar("updated_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("system_status_component_idx").on(table.component),
  index("system_status_status_idx").on(table.status),
]);

// Known issues - current bugs/issues being worked on
export const knownIssues = pgTable("known_issues", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  affectedPlatforms: jsonb("affected_platforms").default([]), // iOS, Android, Web
  workaround: text("workaround"),
  priority: ticketPriorityEnum("priority").default("MEDIUM").notNull(),
  status: varchar("status", { length: 20 }).default("INVESTIGATING").notNull(), // INVESTIGATING, FIXING, FIXED
  fixedInVersion: varchar("fixed_in_version", { length: 20 }),
  reportCount: integer("report_count").default(1).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
  fixedAt: timestamp("fixed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("known_issues_status_idx").on(table.status),
  index("known_issues_public_idx").on(table.isPublic),
]);

// Feature requests - user-submitted feature ideas with voting
export const featureRequests = pgTable("feature_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }),
  status: featureRequestStatusEnum("status").default("NEW").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  adminResponse: text("admin_response"),
  adminRespondedAt: timestamp("admin_responded_at"),
  adminRespondedBy: varchar("admin_responded_by")
    .references(() => users.id, { onDelete: "set null" }),
  plannedVersion: varchar("planned_version", { length: 20 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("feature_requests_user_idx").on(table.userId),
  index("feature_requests_status_idx").on(table.status),
]);

// Feature request votes
export const featureRequestVotes = pgTable("feature_request_votes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  requestId: varchar("request_id")
    .notNull()
    .references(() => featureRequests.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isUpvote: boolean("is_upvote").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("feature_request_votes_request_idx").on(table.requestId),
  unique("feature_request_votes_user_request_idx").on(table.userId, table.requestId),
]);

// Help feedback - user ratings on help content
export const helpFeedback = pgTable("help_feedback", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  articleId: varchar("article_id")
    .references(() => helpArticles.id, { onDelete: "cascade" }),
  faqId: varchar("faq_id")
    .references(() => helpFaqs.id, { onDelete: "cascade" }),
  isHelpful: boolean("is_helpful").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("help_feedback_article_idx").on(table.articleId),
  index("help_feedback_faq_idx").on(table.faqId),
]);

// Community questions - user-submitted questions
export const communityQuestions = pgTable("community_questions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id")
    .references(() => helpCategories.id, { onDelete: "set null" }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  answerCount: integer("answer_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  isSolved: boolean("is_solved").default(false).notNull(),
  acceptedAnswerId: varchar("accepted_answer_id"),
  isLocked: boolean("is_locked").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("community_questions_user_idx").on(table.userId),
  index("community_questions_category_idx").on(table.categoryId),
  index("community_questions_solved_idx").on(table.isSolved),
]);

// Community answers
export const communityAnswers = pgTable("community_answers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  questionId: varchar("question_id")
    .notNull()
    .references(() => communityQuestions.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  upvotes: integer("upvotes").default(0).notNull(),
  downvotes: integer("downvotes").default(0).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(), // Verified by staff
  verifiedBy: varchar("verified_by")
    .references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  isAccepted: boolean("is_accepted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("community_answers_question_idx").on(table.questionId),
  index("community_answers_user_idx").on(table.userId),
]);

// Community answer votes
export const communityAnswerVotes = pgTable("community_answer_votes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  answerId: varchar("answer_id")
    .notNull()
    .references(() => communityAnswers.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isUpvote: boolean("is_upvote").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("community_answer_votes_answer_idx").on(table.answerId),
  unique("community_answer_votes_user_answer_idx").on(table.userId, table.answerId),
]);

// Help achievements - gamification for helping others
export const helpAchievements = pgTable("help_achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  badgeColor: varchar("badge_color", { length: 20 }),
  requirement: varchar("requirement", { length: 50 }).notNull(), // e.g., ANSWERS_10, VERIFIED_5, HELPFUL_50
  threshold: integer("threshold").notNull(),
  coinReward: integer("coin_reward").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("help_achievements_active_idx").on(table.isActive),
]);

// User help achievements
export const userHelpAchievements = pgTable("user_help_achievements", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  achievementId: varchar("achievement_id")
    .notNull()
    .references(() => helpAchievements.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  coinRewardClaimed: boolean("coin_reward_claimed").default(false).notNull(),
}, (table) => [
  index("user_help_achievements_user_idx").on(table.userId),
  unique("user_help_achievements_unique_idx").on(table.userId, table.achievementId),
]);

// User help progress - track learning and engagement
export const userHelpProgress = pgTable("user_help_progress", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  articlesRead: integer("articles_read").default(0).notNull(),
  tutorialsCompleted: integer("tutorials_completed").default(0).notNull(),
  questionsAsked: integer("questions_asked").default(0).notNull(),
  answersPosted: integer("answers_posted").default(0).notNull(),
  answersVerified: integer("answers_verified").default(0).notNull(),
  helpfulVotesReceived: integer("helpful_votes_received").default(0).notNull(),
  ticketsCreated: integer("tickets_created").default(0).notNull(),
  ticketsResolved: integer("tickets_resolved").default(0).notNull(),
  lastArticleReadAt: timestamp("last_article_read_at"),
  lastTutorialCompletedAt: timestamp("last_tutorial_completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_help_progress_user_idx").on(table.userId),
]);

// Appeals - for account/content appeals
export const appeals = pgTable("appeals", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: appealTypeEnum("type").notNull(),
  status: appealStatusEnum("status").default("PENDING").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  description: text("description").notNull(),
  referenceId: varchar("reference_id"), // ID of the suspended account, removed content, etc.
  attachmentUrls: jsonb("attachment_urls").default([]),
  adminResponse: text("admin_response"),
  reviewedBy: varchar("reviewed_by")
    .references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("appeals_user_idx").on(table.userId),
  index("appeals_status_idx").on(table.status),
  index("appeals_type_idx").on(table.type),
]);

// App changelog - what's new in each version
export const appChangelog = pgTable("app_changelog", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  version: varchar("version", { length: 20 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  features: jsonb("features").default([]), // Array of new features
  improvements: jsonb("improvements").default([]), // Array of improvements
  bugFixes: jsonb("bug_fixes").default([]), // Array of bug fixes
  imageUrl: text("image_url"),
  isPublished: boolean("is_published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("app_changelog_version_idx").on(table.version),
  index("app_changelog_published_idx").on(table.isPublished),
]);

// Safety resources - crisis and emergency contacts
export const safetyResources = pgTable("safety_resources", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // CRISIS, HARASSMENT, LEGAL, etc.
  contactNumber: varchar("contact_number", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 100 }),
  websiteUrl: text("website_url"),
  country: varchar("country", { length: 50 }), // For country-specific resources
  isEmergency: boolean("is_emergency").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("safety_resources_category_idx").on(table.category),
  index("safety_resources_country_idx").on(table.country),
]);

// Help search history - for analytics and personalization
export const helpSearchHistory = pgTable("help_search_history", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  resultsCount: integer("results_count").default(0).notNull(),
  clickedArticleId: varchar("clicked_article_id")
    .references(() => helpArticles.id, { onDelete: "set null" }),
  sessionId: varchar("session_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("help_search_history_user_idx").on(table.userId),
  index("help_search_history_query_idx").on(table.query),
]);

// ===== TYPE EXPORTS FOR NEW TABLES =====

export type HelpCategory = typeof helpCategories.$inferSelect;
export type HelpArticle = typeof helpArticles.$inferSelect;
export type HelpArticleStep = typeof helpArticleSteps.$inferSelect;
export type SupportInbox = typeof supportInboxes.$inferSelect;
export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type TicketInternalNote = typeof ticketInternalNotes.$inferSelect;
export type CannedResponse = typeof cannedResponses.$inferSelect;
export type HelpFaq = typeof helpFaqs.$inferSelect;
export type SystemStatusRecord = typeof systemStatus.$inferSelect;
export type KnownIssue = typeof knownIssues.$inferSelect;
export type FeatureRequest = typeof featureRequests.$inferSelect;
export type FeatureRequestVote = typeof featureRequestVotes.$inferSelect;
export type HelpFeedbackRecord = typeof helpFeedback.$inferSelect;
export type CommunityQuestion = typeof communityQuestions.$inferSelect;
export type CommunityAnswer = typeof communityAnswers.$inferSelect;
export type CommunityAnswerVote = typeof communityAnswerVotes.$inferSelect;
export type HelpAchievement = typeof helpAchievements.$inferSelect;
export type UserHelpAchievement = typeof userHelpAchievements.$inferSelect;
export type UserHelpProgress = typeof userHelpProgress.$inferSelect;
export type Appeal = typeof appeals.$inferSelect;
export type AppChangelogEntry = typeof appChangelog.$inferSelect;
export type SafetyResource = typeof safetyResources.$inferSelect;
export type HelpSearchHistoryEntry = typeof helpSearchHistory.$inferSelect;

export type ApiUsageDaily = typeof apiUsageDaily.$inferSelect;
export type ApiUsageAlert = typeof apiUsageAlerts.$inferSelect;
export type ApiUsageAlertHistory = typeof apiUsageAlertHistory.$inferSelect;

export type Wallet = typeof wallets.$inferSelect;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type GiftType = typeof giftTypes.$inferSelect;
export type GiftTransaction = typeof giftTransactions.$inferSelect;
export type CoinBundle = typeof coinBundles.$inferSelect;
export type CoinPurchase = typeof coinPurchases.$inferSelect;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type DailyRewardConfig = typeof dailyRewardConfig.$inferSelect;
export type MallWishlist = typeof mallWishlists.$inferSelect;
export type MallReview = typeof mallReviews.$inferSelect;
export type UserBankAccount = typeof userBankAccounts.$inferSelect;
export type UserKyc = typeof userKyc.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type PlatformRevenue = typeof platformRevenue.$inferSelect;
export type PlatformStat = typeof platformStats.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type WealthClub = typeof wealthClubs.$inferSelect;
export type UserWealthClub = typeof userWealthClub.$inferSelect;
export type GiftStake = typeof giftStakes.$inferSelect;
export type StakingTier = typeof stakingTiers.$inferSelect;
export type PlatformBattle = typeof platformBattles.$inferSelect;
export type BattleParticipant = typeof battleParticipants.$inferSelect;
export type CreatorEarnings = typeof creatorEarnings.$inferSelect;
export type EarningsHistory = typeof earningsHistory.$inferSelect;
export type EconomyConfig = typeof economyConfig.$inferSelect;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type PlatformConfig = typeof platformConfig.$inferSelect;
export type LiveStream = typeof liveStreams.$inferSelect;
export type LiveStreamViewer = typeof liveStreamViewers.$inferSelect;
export type LiveStreamComment = typeof liveStreamComments.$inferSelect;
export type LiveStreamReaction = typeof liveStreamReactions.$inferSelect;
export type LiveStreamGift = typeof liveStreamGifts.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupJoinRequest = typeof groupJoinRequests.$inferSelect;
export type GroupPost = typeof groupPosts.$inferSelect;
export type Event = typeof events.$inferSelect;
export type EventRsvp = typeof eventRsvps.$inferSelect;
export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type BroadcastChannel = typeof broadcastChannels.$inferSelect;
export type BroadcastChannelSubscriber = typeof broadcastChannelSubscribers.$inferSelect;
export type BroadcastMessage = typeof broadcastMessages.$inferSelect;
export type PostReaction = typeof postReactions.$inferSelect;
export type UserLocation = typeof userLocations.$inferSelect;
export type LocationSharingSetting = typeof locationSharingSettings.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type CheckIn = typeof checkIns.$inferSelect;
export type GroupConversation = typeof groupConversations.$inferSelect;
export type GroupConversationMember = typeof groupConversationMembers.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type VideoCall = typeof videoCalls.$inferSelect;
export type VanishModeSetting = typeof vanishModeSettings.$inferSelect;
export type HiddenWord = typeof hiddenWords.$inferSelect;
export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type TotpSecret = typeof totpSecrets.$inferSelect;
export type BackupCode = typeof backupCodes.$inferSelect;
export type ArFilter = typeof arFilters.$inferSelect;
export type Hashtag = typeof hashtags.$inferSelect;
export type PostHashtag = typeof postHashtags.$inferSelect;
export type PostThread = typeof postThreads.$inferSelect;
export type ThreadPost = typeof threadPosts.$inferSelect;
export type DuetStitchPost = typeof duetStitchPosts.$inferSelect;
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type ApiAccessToken = typeof apiAccessTokens.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type CommentReply = typeof commentReplies.$inferSelect;
export type Poke = typeof pokes.$inferSelect;
export type BffStatus = typeof bffStatus.$inferSelect;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type PinnedMessage = typeof pinnedMessages.$inferSelect;
export type ChatFolder = typeof chatFolders.$inferSelect;
export type ChatFolderConversation = typeof chatFolderConversations.$inferSelect;
export type UsageStat = typeof usageStats.$inferSelect;
export type FocusModeSetting = typeof focusModeSettings.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type SecurityCheckup = typeof securityCheckups.$inferSelect;
export type AccountBackup = typeof accountBackups.$inferSelect;
export type AiAvatar = typeof aiAvatars.$inferSelect;
export type AiTranslation = typeof aiTranslations.$inferSelect;
export type PlatformImport = typeof platformImports.$inferSelect;
export type ExploreCategory = typeof exploreCategories.$inferSelect;

export type CoinTransactionType = "PURCHASE" | "GIFT_SENT" | "GIFT_RECEIVED" | "REFUND" | "ADMIN_CREDIT" | "ADMIN_DEBIT" | "SUBSCRIPTION_PAYMENT";
export type LiveStreamStatus = "PREPARING" | "LIVE" | "ENDED" | "CANCELLED";
export type GroupPrivacy = "PUBLIC" | "PRIVATE" | "SECRET";
export type GroupMemberRole = "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
export type GroupJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
export type EventType = "IN_PERSON" | "VIRTUAL" | "HYBRID";
export type RsvpStatus = "GOING" | "INTERESTED" | "NOT_GOING";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAUSED";
export type PostReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY" | "FIRE" | "DIAMOND" | "CROWN";
export type CallStatus = "RINGING" | "ONGOING" | "ENDED" | "MISSED" | "DECLINED" | "CANCELLED";
export type CallType = "AUDIO" | "VIDEO";
export type DuetStitchType = "DUET" | "STITCH";
export type GroupConversationMemberRole = "ADMIN" | "MEMBER";
export type PlatformImportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

// ===== ADVERTISING SYSTEM =====
// Re-export all ads schema tables and types
export * from "./ads-schema";
