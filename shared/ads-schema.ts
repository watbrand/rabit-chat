import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, bigint, boolean, unique, index, pgEnum, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// ===== ADVERTISING SYSTEM ENUMS =====

export const advertiserStatusEnum = pgEnum("advertiser_status", [
  "PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"
]);

export const advertiserVerificationStatusEnum = pgEnum("advertiser_verification_status", [
  "NOT_SUBMITTED", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "MORE_INFO_NEEDED"
]);

export const campaignObjectiveEnum = pgEnum("campaign_objective", [
  "AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "SALES", "APP_PROMOTION", "VIDEO_VIEWS", "COMMUNITY_GROWTH", "BOOST_POST"
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "DRAFT", "PENDING_REVIEW", "IN_REVIEW", "APPROVED", "REJECTED", "ACTIVE", "PAUSED", "COMPLETED", "DISABLED", "ARCHIVED"
]);

export const adGroupStatusEnum = pgEnum("ad_group_status", [
  "DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "DISABLED"
]);

export const adStatusEnum = pgEnum("ad_status", [
  "DRAFT", "PENDING_REVIEW", "IN_REVIEW", "APPROVED", "REJECTED", "ACTIVE", "PAUSED", "COMPLETED", "DISABLED"
]);

export const adFormatEnum = pgEnum("ad_format", [
  "IMAGE", "VIDEO", "CAROUSEL", "STORIES", "COLLECTION", "VOICE", "POLL", "CONVERSATION", "DARK_POST"
]);

export const adPlacementEnum = pgEnum("ad_placement", [
  "FEED", "DISCOVER", "STORIES", "REELS", "VOICE_REELS", "SEARCH", "PROFILE_SUGGESTIONS", "MESSAGES"
]);

export const billingModelEnum = pgEnum("billing_model", [
  "CPM", "CPC", "CPV", "CPA"
]);

export const budgetTypeEnum = pgEnum("budget_type", [
  "DAILY", "LIFETIME"
]);

export const pacingTypeEnum = pgEnum("pacing_type", [
  "EVEN", "ACCELERATED", "SMART"
]);

export const reviewActionEnum = pgEnum("review_action", [
  "APPROVE", "REJECT", "REQUEST_CHANGES", "ESCALATE"
]);

export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", [
  "TOP_UP", "AD_SPEND", "REFUND", "ADJUSTMENT", "PROMO_CREDIT", "REFERRAL_CREDIT", "ADMIN_CREDIT", "ADMIN_DEBIT"
]);

export const walletTransactionStatusEnum = pgEnum("wallet_transaction_status", [
  "PENDING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"
]);

export const adEventTypeEnum = pgEnum("ad_event_type", [
  "IMPRESSION", "VIEWABLE_IMPRESSION", "CLICK", "VIDEO_START", "VIDEO_25", "VIDEO_50", "VIDEO_75", "VIDEO_COMPLETE",
  "VOICE_START", "VOICE_COMPLETE", "POLL_VOTE", "CONVERSION", "HIDE", "REPORT", "SAVE"
]);

export const conversionTypeEnum = pgEnum("conversion_type", [
  "PURCHASE", "LEAD", "SIGNUP", "FOLLOW", "MESSAGE", "APP_INSTALL", "ADD_TO_CART", "CUSTOM"
]);

export const attributionModelEnum = pgEnum("attribution_model", [
  "LAST_CLICK", "FIRST_CLICK", "LINEAR", "TIME_DECAY"
]);

export const audienceTypeEnum = pgEnum("audience_type", [
  "CUSTOM", "SAVED", "LOOKALIKE", "RETARGETING"
]);

export const diagnosticIssueEnum = pgEnum("diagnostic_issue", [
  "LOW_BALANCE", "ZERO_BALANCE", "BUDGET_EXHAUSTED", "SCHEDULE_NOT_STARTED", "SCHEDULE_ENDED",
  "TARGETING_TOO_NARROW", "LOW_BID", "AD_REJECTED", "CAMPAIGN_PAUSED", "FREQUENCY_CAP_REACHED",
  "LOW_QUALITY_SCORE", "POLICY_VIOLATION", "PENDING_REVIEW", "NO_ELIGIBLE_USERS"
]);

export const achievementTypeEnum = pgEnum("achievement_type", [
  "FIRST_CAMPAIGN", "FIRST_CONVERSION", "SPEND_MILESTONE", "ROAS_MILESTONE", "IMPRESSION_MILESTONE",
  "ENGAGEMENT_MILESTONE", "STREAK_7_DAYS", "STREAK_30_DAYS", "TOP_PERFORMER", "VERIFIED_ADVERTISER"
]);

export const adAuditActionEnum = pgEnum("ad_audit_action", [
  "ADVERTISER_CREATED", "ADVERTISER_VERIFIED", "ADVERTISER_SUSPENDED", "ADVERTISER_BANNED",
  "CAMPAIGN_CREATED", "CAMPAIGN_UPDATED", "CAMPAIGN_PAUSED", "CAMPAIGN_ACTIVATED", "CAMPAIGN_DELETED",
  "AD_GROUP_CREATED", "AD_GROUP_UPDATED", "AD_GROUP_PAUSED", "AD_GROUP_DELETED",
  "AD_CREATED", "AD_UPDATED", "AD_SUBMITTED", "AD_APPROVED", "AD_REJECTED", "AD_PAUSED", "AD_DELETED",
  "WALLET_TOP_UP", "WALLET_SPEND", "WALLET_REFUND", "WALLET_ADJUSTMENT",
  "SPEND_CAP_SET", "SPEND_CAP_UPDATED", "ALGORITHM_TUNED", "POLICY_UPDATED", "TERMS_UPDATED",
  "POST_BOOSTED"
]);

export const adDisputeStatusEnum = pgEnum("ad_dispute_status", [
  "PENDING", "UNDER_REVIEW", "RESOLVED_APPROVED", "RESOLVED_DENIED", "CANCELLED"
]);

export const adDisputeTypeEnum = pgEnum("ad_dispute_type", [
  "BILLING_ERROR", "UNDER_DELIVERY", "POLICY_VIOLATION", "TECHNICAL_ISSUE", "REFUND_REQUEST", "OTHER"
]);

// ===== ADVERTISING TERMS =====

export const advertisingTerms = pgTable("advertising_terms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  version: varchar("version", { length: 20 }).notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  effectiveDate: timestamp("effective_date").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdById: varchar("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("advertising_terms_active_idx").on(table.isActive),
  index("advertising_terms_effective_idx").on(table.effectiveDate),
]);

// ===== AD POLICIES =====

export const adPolicies = pgTable("ad_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  violationSeverity: varchar("violation_severity", { length: 20 }).default("MODERATE"),
  autoReject: boolean("auto_reject").default(false).notNull(),
  keywords: jsonb("keywords").default([]),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ad_policies_category_idx").on(table.category),
  index("ad_policies_active_idx").on(table.isActive),
]);

// ===== ADVERTISERS =====

export const advertisers = pgTable("advertisers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  businessName: varchar("business_name", { length: 200 }),
  businessType: varchar("business_type", { length: 50 }),
  industry: varchar("industry", { length: 50 }),
  website: text("website"),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  taxId: varchar("tax_id", { length: 50 }),
  status: advertiserStatusEnum("status").default("PENDING_VERIFICATION").notNull(),
  verificationStatus: advertiserVerificationStatusEnum("verification_status").default("NOT_SUBMITTED").notNull(),
  verificationDocuments: jsonb("verification_documents").default([]),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  verifiedById: varchar("verified_by_id"),
  termsAcceptedVersion: varchar("terms_accepted_version", { length: 20 }),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  spendCapDaily: bigint("spend_cap_daily", { mode: "number" }),
  spendCapMonthly: bigint("spend_cap_monthly", { mode: "number" }),
  velocityLimitHourly: bigint("velocity_limit_hourly", { mode: "number" }),
  trustScore: integer("trust_score").default(50).notNull(),
  totalSpend: bigint("total_spend", { mode: "number" }).default(0).notNull(),
  totalCampaigns: integer("total_campaigns").default(0).notNull(),
  totalImpressions: bigint("total_impressions", { mode: "number" }).default(0).notNull(),
  totalClicks: bigint("total_clicks", { mode: "number" }).default(0).notNull(),
  totalConversions: bigint("total_conversions", { mode: "number" }).default(0).notNull(),
  avgCtr: real("avg_ctr").default(0),
  avgRoas: real("avg_roas").default(0),
  vipTier: varchar("vip_tier", { length: 20 }).default("BRONZE"),
  vipPoints: integer("vip_points").default(0).notNull(),
  suspendedAt: timestamp("suspended_at"),
  suspendedById: varchar("suspended_by_id"),
  suspendedReason: text("suspended_reason"),
  bannedAt: timestamp("banned_at"),
  bannedById: varchar("banned_by_id"),
  bannedReason: text("banned_reason"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("advertisers_user_idx").on(table.userId),
  index("advertisers_status_idx").on(table.status),
  index("advertisers_verification_idx").on(table.verificationStatus),
  index("advertisers_vip_tier_idx").on(table.vipTier),
]);

// ===== ADVERTISER TERMS ACCEPTANCE =====

export const advertiserTermsAcceptance = pgTable("advertiser_terms_acceptance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  termsId: varchar("terms_id").notNull(),
  termsVersion: varchar("terms_version", { length: 20 }).notNull(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
}, (table) => [
  index("advertiser_terms_acceptance_advertiser_idx").on(table.advertiserId),
  unique("advertiser_terms_version_unique").on(table.advertiserId, table.termsVersion),
]);

// ===== AD WALLET ACCOUNTS =====

export const adWalletAccounts = pgTable("ad_wallet_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull().unique(),
  balance: bigint("balance", { mode: "number" }).default(0).notNull(),
  reservedAmount: bigint("reserved_amount", { mode: "number" }).default(0).notNull(),
  lifetimeDeposits: bigint("lifetime_deposits", { mode: "number" }).default(0).notNull(),
  lifetimeSpend: bigint("lifetime_spend", { mode: "number" }).default(0).notNull(),
  lifetimeRefunds: bigint("lifetime_refunds", { mode: "number" }).default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR").notNull(),
  autoTopUpEnabled: boolean("auto_top_up_enabled").default(false).notNull(),
  autoTopUpThreshold: bigint("auto_top_up_threshold", { mode: "number" }),
  autoTopUpAmount: bigint("auto_top_up_amount", { mode: "number" }),
  lowBalanceAlertThreshold: bigint("low_balance_alert_threshold", { mode: "number" }).default(10000),
  lastLowBalanceAlertAt: timestamp("last_low_balance_alert_at"),
  isFrozen: boolean("is_frozen").default(false).notNull(),
  frozenReason: text("frozen_reason"),
  frozenAt: timestamp("frozen_at"),
  frozenById: varchar("frozen_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ad_wallet_accounts_advertiser_idx").on(table.advertiserId),
  index("ad_wallet_accounts_balance_idx").on(table.balance),
]);

// ===== AD WALLET TRANSACTIONS =====

export const adWalletTransactions = pgTable("ad_wallet_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull(),
  type: walletTransactionTypeEnum("type").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  balanceBefore: bigint("balance_before", { mode: "number" }).notNull(),
  balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
  status: walletTransactionStatusEnum("status").default("PENDING").notNull(),
  reference: varchar("reference", { length: 100 }),
  description: text("description"),
  metadata: jsonb("metadata").default({}),
  campaignId: varchar("campaign_id"),
  promoCodeId: varchar("promo_code_id"),
  adminId: varchar("admin_id"),
  adminNotes: text("admin_notes"),
  payfastPaymentId: varchar("payfast_payment_id", { length: 100 }),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  invoiceUrl: text("invoice_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("ad_wallet_transactions_wallet_idx").on(table.walletId),
  index("ad_wallet_transactions_type_idx").on(table.type),
  index("ad_wallet_transactions_status_idx").on(table.status),
  index("ad_wallet_transactions_created_idx").on(table.createdAt),
  index("ad_wallet_transactions_campaign_idx").on(table.campaignId),
]);

// ===== PROMO CODES =====

export const adPromoCodes = pgTable("ad_promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  amount: bigint("amount", { mode: "number" }).notNull(),
  percentage: real("percentage"),
  maxAmount: bigint("max_amount", { mode: "number" }),
  usageLimit: integer("usage_limit"),
  usageLimitPerUser: integer("usage_limit_per_user").default(1),
  usageCount: integer("usage_count").default(0).notNull(),
  minSpend: bigint("min_spend", { mode: "number" }),
  validFrom: timestamp("valid_from").defaultNow().notNull(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true).notNull(),
  newAdvertisersOnly: boolean("new_advertisers_only").default(false).notNull(),
  createdById: varchar("created_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_promo_codes_code_idx").on(table.code),
  index("ad_promo_codes_active_idx").on(table.isActive),
]);

// ===== PROMO CODE REDEMPTIONS =====

export const adPromoCodeRedemptions = pgTable("ad_promo_code_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promoCodeId: varchar("promo_code_id").notNull(),
  advertiserId: varchar("advertiser_id").notNull(),
  walletTransactionId: varchar("wallet_transaction_id"),
  amountCredited: bigint("amount_credited", { mode: "number" }).notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
}, (table) => [
  index("ad_promo_redemptions_promo_idx").on(table.promoCodeId),
  index("ad_promo_redemptions_advertiser_idx").on(table.advertiserId),
  unique("ad_promo_redemption_unique").on(table.promoCodeId, table.advertiserId),
]);

// ===== CAMPAIGNS =====

export const adCampaigns = pgTable("ad_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  objective: campaignObjectiveEnum("objective").notNull(),
  status: campaignStatusEnum("status").default("DRAFT").notNull(),
  budgetType: budgetTypeEnum("budget_type").default("DAILY").notNull(),
  budgetAmount: bigint("budget_amount", { mode: "number" }).notNull(),
  budgetSpent: bigint("budget_spent", { mode: "number" }).default(0).notNull(),
  budgetRemaining: bigint("budget_remaining", { mode: "number" }),
  lifetimeBudget: bigint("lifetime_budget", { mode: "number" }),
  pacing: pacingTypeEnum("pacing").default("EVEN").notNull(),
  bidStrategy: varchar("bid_strategy", { length: 50 }).default("AUTO"),
  bidAmount: bigint("bid_amount", { mode: "number" }),
  targetCpa: bigint("target_cpa", { mode: "number" }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  timezone: varchar("timezone", { length: 50 }).default("Africa/Johannesburg"),
  dayparting: jsonb("dayparting").default({}),
  placements: jsonb("placements").default(["FEED"]),
  submittedAt: timestamp("submitted_at"),
  reviewStartedAt: timestamp("review_started_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedById: varchar("reviewed_by_id"),
  rejectionReason: text("rejection_reason"),
  rejectionDetails: text("rejection_details"),
  impressions: bigint("impressions", { mode: "number" }).default(0).notNull(),
  clicks: bigint("clicks", { mode: "number" }).default(0).notNull(),
  conversions: bigint("conversions", { mode: "number" }).default(0).notNull(),
  conversionValue: bigint("conversion_value", { mode: "number" }).default(0).notNull(),
  reach: bigint("reach", { mode: "number" }).default(0).notNull(),
  frequency: real("frequency").default(0),
  ctr: real("ctr").default(0),
  cpc: real("cpc").default(0),
  cpm: real("cpm").default(0),
  roas: real("roas").default(0),
  qualityScore: real("quality_score").default(50),
  relevanceScore: real("relevance_score").default(50),
  isInLearningPhase: boolean("is_in_learning_phase").default(true).notNull(),
  learningPhaseEndsAt: timestamp("learning_phase_ends_at"),
  learningPhaseConversions: integer("learning_phase_conversions").default(0),
  tags: jsonb("tags").default([]),
  notes: text("notes"),
  isDarkPost: boolean("is_dark_post").default(false).notNull(),
  isClone: boolean("is_clone").default(false).notNull(),
  clonedFromId: varchar("cloned_from_id"),
  version: integer("version").default(1).notNull(),
  lastEditedAt: timestamp("last_edited_at"),
  lastEditedById: varchar("last_edited_by_id"),
  pausedAt: timestamp("paused_at"),
  pausedById: varchar("paused_by_id"),
  pausedReason: text("paused_reason"),
  metadata: jsonb("metadata").default({}),
  completedAt: timestamp("completed_at"),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ad_campaigns_advertiser_idx").on(table.advertiserId),
  index("ad_campaigns_status_idx").on(table.status),
  index("ad_campaigns_objective_idx").on(table.objective),
  index("ad_campaigns_dates_idx").on(table.startDate, table.endDate),
  index("ad_campaigns_created_idx").on(table.createdAt),
]);

// ===== AD GROUPS =====

export const adGroups = pgTable("ad_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  status: adGroupStatusEnum("status").default("DRAFT").notNull(),
  budgetAmount: bigint("budget_amount", { mode: "number" }),
  budgetSpent: bigint("budget_spent", { mode: "number" }).default(0).notNull(),
  bidAmount: bigint("bid_amount", { mode: "number" }),
  billingModel: billingModelEnum("billing_model").default("CPM").notNull(),
  placements: jsonb("placements").default([]),
  targeting: jsonb("targeting").default({}).notNull(),
  ageMin: integer("age_min").default(18),
  ageMax: integer("age_max").default(65),
  genders: jsonb("genders").default([]),
  countries: jsonb("countries").default([]),
  provinces: jsonb("provinces").default([]),
  cities: jsonb("cities").default([]),
  excludedLocations: jsonb("excluded_locations").default([]),
  netWorthTiers: jsonb("net_worth_tiers").default([]),
  minNetWorth: bigint("min_net_worth", { mode: "number" }),
  maxNetWorth: bigint("max_net_worth", { mode: "number" }),
  minInfluenceScore: integer("min_influence_score"),
  maxInfluenceScore: integer("max_influence_score"),
  interests: jsonb("interests").default([]),
  behaviors: jsonb("behaviors").default([]),
  industries: jsonb("industries").default([]),
  customAudienceIds: jsonb("custom_audience_ids").default([]),
  excludedAudienceIds: jsonb("excluded_audience_ids").default([]),
  deviceTypes: jsonb("device_types").default([]),
  platforms: jsonb("platforms").default([]),
  connectionTypes: jsonb("connection_types").default([]),
  frequencyCapImpressions: integer("frequency_cap_impressions").default(3),
  frequencyCapPeriodHours: integer("frequency_cap_period_hours").default(24),
  frequencyCapCooldownHours: integer("frequency_cap_cooldown_hours"),
  impressions: bigint("impressions", { mode: "number" }).default(0).notNull(),
  clicks: bigint("clicks", { mode: "number" }).default(0).notNull(),
  conversions: bigint("conversions", { mode: "number" }).default(0).notNull(),
  reach: bigint("reach", { mode: "number" }).default(0).notNull(),
  estimatedAudienceSize: bigint("estimated_audience_size", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ad_groups_campaign_idx").on(table.campaignId),
  index("ad_groups_status_idx").on(table.status),
]);

// ===== ADS =====

export const ads = pgTable("ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adNumber: varchar("ad_number", { length: 12 }).unique(), // Short reference code like AD-001234
  adGroupId: varchar("ad_group_id").notNull(),
  campaignId: varchar("campaign_id").notNull(),
  advertiserId: varchar("advertiser_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  format: adFormatEnum("format").default("IMAGE").notNull(),
  status: adStatusEnum("status").default("DRAFT").notNull(),
  headline: varchar("headline", { length: 125 }),
  description: text("description"),
  callToAction: varchar("call_to_action", { length: 50 }),
  destinationUrl: text("destination_url"),
  displayUrl: text("display_url"),
  primaryMediaUrl: text("primary_media_url"),
  primaryMediaThumbnail: text("primary_media_thumbnail"),
  primaryMediaType: varchar("primary_media_type", { length: 20 }),
  primaryMediaDuration: integer("primary_media_duration"),
  primaryMediaAspectRatio: real("primary_media_aspect_ratio"),
  carouselItems: jsonb("carousel_items").default([]),
  voiceUrl: text("voice_url"),
  voiceDuration: integer("voice_duration"),
  voiceTranscript: text("voice_transcript"),
  pollQuestion: text("poll_question"),
  pollOptions: jsonb("poll_options").default([]),
  placementCreatives: jsonb("placement_creatives").default({}),
  submittedAt: timestamp("submitted_at"),
  reviewStartedAt: timestamp("review_started_at"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedById: varchar("reviewed_by_id"),
  rejectionReason: text("rejection_reason"),
  rejectionDetails: text("rejection_details"),
  policyViolations: jsonb("policy_violations").default([]),
  aiModerationScore: real("ai_moderation_score"),
  aiModerationFlags: jsonb("ai_moderation_flags").default([]),
  aiPerformancePrediction: real("ai_performance_prediction"),
  aiSuggestions: jsonb("ai_suggestions").default([]),
  qualityScore: real("quality_score").default(50),
  relevanceScore: real("relevance_score").default(50),
  engagementScore: real("engagement_score").default(50),
  feedbackPositive: integer("feedback_positive").default(0).notNull(),
  feedbackNegative: integer("feedback_negative").default(0).notNull(),
  impressions: bigint("impressions", { mode: "number" }).default(0).notNull(),
  clicks: bigint("clicks", { mode: "number" }).default(0).notNull(),
  conversions: bigint("conversions", { mode: "number" }).default(0).notNull(),
  spend: bigint("spend", { mode: "number" }).default(0).notNull(),
  ctr: real("ctr").default(0),
  isVariant: boolean("is_variant").default(false).notNull(),
  variantOf: varchar("variant_of"),
  variantLabel: varchar("variant_label", { length: 50 }),
  variantWeight: integer("variant_weight").default(50),
  linkedPostId: varchar("linked_post_id"),
  linkedMallItemId: varchar("linked_mall_item_id"),
  pausedAt: timestamp("paused_at"),
  pausedById: varchar("paused_by_id"),
  pausedReason: text("paused_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ads_ad_group_idx").on(table.adGroupId),
  index("ads_campaign_idx").on(table.campaignId),
  index("ads_advertiser_idx").on(table.advertiserId),
  index("ads_status_idx").on(table.status),
  index("ads_format_idx").on(table.format),
]);

// ===== AD EVENTS =====

export const adEvents = pgTable("ad_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").notNull(),
  adGroupId: varchar("ad_group_id").notNull(),
  campaignId: varchar("campaign_id").notNull(),
  advertiserId: varchar("advertiser_id").notNull(),
  userId: varchar("user_id"),
  eventType: adEventTypeEnum("event_type").notNull(),
  placement: adPlacementEnum("placement").notNull(),
  sessionId: varchar("session_id", { length: 100 }),
  deviceId: varchar("device_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  platform: varchar("platform", { length: 20 }),
  costAmount: bigint("cost_amount", { mode: "number" }).default(0),
  bidAmount: bigint("bid_amount", { mode: "number" }),
  watchTimeMs: integer("watch_time_ms"),
  percentWatched: real("percent_watched"),
  soundOn: boolean("sound_on"),
  conversionType: conversionTypeEnum("conversion_type"),
  conversionValue: bigint("conversion_value", { mode: "number" }),
  conversionCurrency: varchar("conversion_currency", { length: 3 }),
  referrer: text("referrer"),
  metadata: jsonb("metadata").default({}),
  eventHash: varchar("event_hash", { length: 64 }),
  isDuplicate: boolean("is_duplicate").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_events_ad_idx").on(table.adId),
  index("ad_events_campaign_idx").on(table.campaignId),
  index("ad_events_user_idx").on(table.userId),
  index("ad_events_type_idx").on(table.eventType),
  index("ad_events_created_idx").on(table.createdAt),
  index("ad_events_hash_idx").on(table.eventHash),
]);

// ===== AD STATS DAILY =====

export const adStatsDaily = pgTable("ad_stats_daily", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  adId: varchar("ad_id"),
  adGroupId: varchar("ad_group_id"),
  campaignId: varchar("campaign_id"),
  advertiserId: varchar("advertiser_id").notNull(),
  placement: adPlacementEnum("placement"),
  impressions: bigint("impressions", { mode: "number" }).default(0).notNull(),
  clicks: bigint("clicks", { mode: "number" }).default(0).notNull(),
  conversions: bigint("conversions", { mode: "number" }).default(0).notNull(),
  conversionValue: bigint("conversion_value", { mode: "number" }).default(0).notNull(),
  reach: bigint("reach", { mode: "number" }).default(0).notNull(),
  frequency: real("frequency").default(0),
  spend: bigint("spend", { mode: "number" }).default(0).notNull(),
  ctr: real("ctr").default(0),
  cpc: real("cpc").default(0),
  cpm: real("cpm").default(0),
  cpa: real("cpa").default(0),
  roas: real("roas").default(0),
  videoViews: bigint("video_views", { mode: "number" }).default(0),
  videoViews25: bigint("video_views_25", { mode: "number" }).default(0),
  videoViews50: bigint("video_views_50", { mode: "number" }).default(0),
  videoViews75: bigint("video_views_75", { mode: "number" }).default(0),
  videoViews100: bigint("video_views_100", { mode: "number" }).default(0),
  avgWatchTimeMs: real("avg_watch_time_ms").default(0),
  saves: bigint("saves", { mode: "number" }).default(0),
  hides: bigint("hides", { mode: "number" }).default(0),
  reports: bigint("reports", { mode: "number" }).default(0),
  breakdowns: jsonb("breakdowns").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_stats_daily_date_idx").on(table.date),
  index("ad_stats_daily_ad_idx").on(table.adId),
  index("ad_stats_daily_campaign_idx").on(table.campaignId),
  index("ad_stats_daily_advertiser_idx").on(table.advertiserId),
  unique("ad_stats_daily_unique").on(table.date, table.adId, table.placement),
]);

// ===== CUSTOM AUDIENCES =====

export const adCustomAudiences = pgTable("ad_custom_audiences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: audienceTypeEnum("type").default("CUSTOM").notNull(),
  sourceType: varchar("source_type", { length: 50 }),
  rules: jsonb("rules").default({}),
  estimatedSize: bigint("estimated_size", { mode: "number" }).default(0),
  actualSize: bigint("actual_size", { mode: "number" }).default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),
  sourceAudienceId: varchar("source_audience_id"),
  lookalikeSimilarity: real("lookalike_similarity"),
  uploadedFileUrl: text("uploaded_file_url"),
  uploadedRecordCount: integer("uploaded_record_count"),
  matchedCount: integer("matched_count"),
  isActive: boolean("is_active").default(true).notNull(),
  isProcessing: boolean("is_processing").default(false).notNull(),
  processingError: text("processing_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ad_custom_audiences_advertiser_idx").on(table.advertiserId),
  index("ad_custom_audiences_type_idx").on(table.type),
]);

// ===== AUDIENCE MEMBERS =====

export const adAudienceMembers = pgTable("ad_audience_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  audienceId: varchar("audience_id").notNull(),
  userId: varchar("user_id").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("ad_audience_members_audience_idx").on(table.audienceId),
  index("ad_audience_members_user_idx").on(table.userId),
  unique("ad_audience_members_unique").on(table.audienceId, table.userId),
]);

// ===== AD REVIEW HISTORY =====

export const adReviewHistory = pgTable("ad_review_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id").notNull(),
  campaignId: varchar("campaign_id").notNull(),
  reviewerId: varchar("reviewer_id"),
  action: reviewActionEnum("action").notNull(),
  previousStatus: adStatusEnum("previous_status"),
  newStatus: adStatusEnum("new_status"),
  reason: text("reason"),
  details: text("details"),
  policyViolations: jsonb("policy_violations").default([]),
  reviewDurationMs: integer("review_duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_review_history_ad_idx").on(table.adId),
  index("ad_review_history_campaign_idx").on(table.campaignId),
  index("ad_review_history_reviewer_idx").on(table.reviewerId),
]);

// ===== USER AD PREFERENCES =====

export const userAdPreferences = pgTable("user_ad_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  interestedCategories: jsonb("interested_categories").default([]),
  notInterestedCategories: jsonb("not_interested_categories").default([]),
  hiddenAdvertisers: jsonb("hidden_advertisers").default([]),
  preferVideoAds: boolean("prefer_video_ads").default(true),
  preferVoiceAds: boolean("prefer_voice_ads").default(true),
  preferInteractiveAds: boolean("prefer_interactive_ads").default(true),
  enablePersonalization: boolean("enable_personalization").default(true).notNull(),
  shareActivityForAds: boolean("share_activity_for_ads").default(true).notNull(),
  maxAdsPerSession: integer("max_ads_per_session").default(10),
  minPostsBetweenAds: integer("min_posts_between_ads").default(4),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("user_ad_preferences_user_idx").on(table.userId),
]);

// ===== USER AD INTERACTIONS =====

export const userAdInteractions = pgTable("user_ad_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  adId: varchar("ad_id").notNull(),
  action: varchar("action", { length: 30 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("user_ad_interactions_user_idx").on(table.userId),
  index("user_ad_interactions_ad_idx").on(table.adId),
  unique("user_ad_interactions_unique").on(table.userId, table.adId, table.action),
]);

// ===== AD FREQUENCY TRACKING =====

export const adFrequencyTracking = pgTable("ad_frequency_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  adId: varchar("ad_id").notNull(),
  adGroupId: varchar("ad_group_id").notNull(),
  campaignId: varchar("campaign_id").notNull(),
  impressionCount: integer("impression_count").default(0).notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  lastImpressionAt: timestamp("last_impression_at"),
  lastClickAt: timestamp("last_click_at"),
  convertedAt: timestamp("converted_at"),
  cooldownUntil: timestamp("cooldown_until"),
  periodStartAt: timestamp("period_start_at").defaultNow().notNull(),
}, (table) => [
  index("ad_frequency_tracking_user_idx").on(table.userId),
  index("ad_frequency_tracking_ad_idx").on(table.adId),
  index("ad_frequency_tracking_campaign_idx").on(table.campaignId),
  unique("ad_frequency_tracking_unique").on(table.userId, table.adId),
]);

// ===== DELIVERY DIAGNOSTICS =====

export const adDeliveryDiagnostics = pgTable("ad_delivery_diagnostics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adId: varchar("ad_id"),
  campaignId: varchar("campaign_id").notNull(),
  issue: diagnosticIssueEnum("issue").notNull(),
  severity: varchar("severity", { length: 20 }).default("MEDIUM"),
  message: text("message").notNull(),
  suggestedFix: text("suggested_fix"),
  isResolved: boolean("is_resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_delivery_diagnostics_ad_idx").on(table.adId),
  index("ad_delivery_diagnostics_campaign_idx").on(table.campaignId),
  index("ad_delivery_diagnostics_issue_idx").on(table.issue),
]);

// ===== ADVERTISER ACHIEVEMENTS =====

export const advertiserAchievements = pgTable("advertiser_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  type: achievementTypeEnum("type").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  xpAwarded: integer("xp_awarded").default(0).notNull(),
  metadata: jsonb("metadata").default({}),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
}, (table) => [
  index("advertiser_achievements_advertiser_idx").on(table.advertiserId),
  index("advertiser_achievements_type_idx").on(table.type),
]);

// ===== AD AUDIT LOG =====

export const adAuditLogs = pgTable("ad_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id"),
  actorId: varchar("actor_id"),
  actorType: varchar("actor_type", { length: 20 }).notNull(),
  action: adAuditActionEnum("action").notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  changesSummary: text("changes_summary"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_audit_logs_advertiser_idx").on(table.advertiserId),
  index("ad_audit_logs_actor_idx").on(table.actorId),
  index("ad_audit_logs_action_idx").on(table.action),
  index("ad_audit_logs_entity_idx").on(table.entityType, table.entityId),
  index("ad_audit_logs_created_idx").on(table.createdAt),
]);

// ===== AD SYSTEM SETTINGS =====

export const adSystemSettings = pgTable("ad_system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  isPublic: boolean("is_public").default(false).notNull(),
  updatedById: varchar("updated_by_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ad_system_settings_key_idx").on(table.key),
  index("ad_system_settings_category_idx").on(table.category),
]);

// ===== CONVERSION PIXELS =====

export const adConversionPixels = pgTable("ad_conversion_pixels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  pixelCode: varchar("pixel_code", { length: 50 }).notNull().unique(),
  conversionType: conversionTypeEnum("conversion_type").default("PURCHASE").notNull(),
  defaultValue: bigint("default_value", { mode: "number" }),
  defaultCurrency: varchar("default_currency", { length: 3 }).default("ZAR"),
  isActive: boolean("is_active").default(true).notNull(),
  totalFires: bigint("total_fires", { mode: "number" }).default(0).notNull(),
  lastFiredAt: timestamp("last_fired_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_conversion_pixels_advertiser_idx").on(table.advertiserId),
  index("ad_conversion_pixels_code_idx").on(table.pixelCode),
]);

// ===== AD WEBHOOKS =====

export const adWebhooks = pgTable("ad_webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 100 }),
  events: jsonb("events").default([]),
  isActive: boolean("is_active").default(true).notNull(),
  lastTriggeredAt: timestamp("last_triggered_at"),
  lastStatus: integer("last_status"),
  failureCount: integer("failure_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_webhooks_advertiser_idx").on(table.advertiserId),
]);

// ===== AD DISPUTES =====

export const adDisputes = pgTable("ad_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  campaignId: varchar("campaign_id"),
  disputeType: adDisputeTypeEnum("dispute_type").notNull(),
  status: adDisputeStatusEnum("status").default("PENDING").notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  description: text("description").notNull(),
  requestedRefundAmount: bigint("requested_refund_amount", { mode: "number" }),
  approvedRefundAmount: bigint("approved_refund_amount", { mode: "number" }),
  attachments: jsonb("attachments").default([]),
  adminResponse: text("admin_response"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ad_disputes_advertiser_idx").on(table.advertiserId),
  index("ad_disputes_campaign_idx").on(table.campaignId),
  index("ad_disputes_status_idx").on(table.status),
]);

// ===== TYPE EXPORTS =====

export type AdDispute = typeof adDisputes.$inferSelect;
export type InsertAdDispute = typeof adDisputes.$inferInsert;
export type AdvertisingTerms = typeof advertisingTerms.$inferSelect;
export type InsertAdvertisingTerms = typeof advertisingTerms.$inferInsert;
export type AdPolicy = typeof adPolicies.$inferSelect;
export type InsertAdPolicy = typeof adPolicies.$inferInsert;
export type Advertiser = typeof advertisers.$inferSelect;
export type InsertAdvertiser = typeof advertisers.$inferInsert;
export type AdvertiserTermsAcceptance = typeof advertiserTermsAcceptance.$inferSelect;
export type AdWalletAccount = typeof adWalletAccounts.$inferSelect;
export type AdWalletTransaction = typeof adWalletTransactions.$inferSelect;
export type InsertAdWalletTransaction = typeof adWalletTransactions.$inferInsert;
export type AdPromoCode = typeof adPromoCodes.$inferSelect;
export type AdPromoCodeRedemption = typeof adPromoCodeRedemptions.$inferSelect;
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = typeof adCampaigns.$inferInsert;
export type AdGroup = typeof adGroups.$inferSelect;
export type InsertAdGroup = typeof adGroups.$inferInsert;
export type Ad = typeof ads.$inferSelect;
export type InsertAd = typeof ads.$inferInsert;
export type AdEvent = typeof adEvents.$inferSelect;
export type InsertAdEvent = typeof adEvents.$inferInsert;
export type AdStatsDaily = typeof adStatsDaily.$inferSelect;
export type AdCustomAudience = typeof adCustomAudiences.$inferSelect;
export type AdAudienceMember = typeof adAudienceMembers.$inferSelect;
export type AdReviewHistory = typeof adReviewHistory.$inferSelect;
export type UserAdPreferences = typeof userAdPreferences.$inferSelect;
export type UserAdInteraction = typeof userAdInteractions.$inferSelect;
export type AdFrequencyTracking = typeof adFrequencyTracking.$inferSelect;
export type AdDeliveryDiagnostic = typeof adDeliveryDiagnostics.$inferSelect;
export type AdvertiserAchievement = typeof advertiserAchievements.$inferSelect;
export type AdAuditLog = typeof adAuditLogs.$inferSelect;
export type InsertAdAuditLog = typeof adAuditLogs.$inferInsert;
export type AdSystemSetting = typeof adSystemSettings.$inferSelect;
export type AdConversionPixel = typeof adConversionPixels.$inferSelect;
export type AdWebhook = typeof adWebhooks.$inferSelect;

// Type aliases for enums
export type AdvertiserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "BANNED" | "DEACTIVATED";
export type AdvertiserVerificationStatus = "NOT_SUBMITTED" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "MORE_INFO_NEEDED";
export type CampaignObjective = "AWARENESS" | "TRAFFIC" | "ENGAGEMENT" | "LEADS" | "SALES" | "APP_PROMOTION" | "VIDEO_VIEWS" | "COMMUNITY_GROWTH" | "BOOST_POST";
export type CampaignStatus = "DRAFT" | "PENDING_REVIEW" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "DISABLED" | "ARCHIVED";
export type AdGroupStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "DISABLED";
export type AdStatus = "DRAFT" | "PENDING_REVIEW" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "DISABLED";
export type AdFormat = "IMAGE" | "VIDEO" | "CAROUSEL" | "STORIES" | "COLLECTION" | "VOICE" | "POLL" | "CONVERSATION" | "DARK_POST";
export type AdPlacement = "FEED" | "DISCOVER" | "STORIES" | "REELS" | "VOICE_REELS" | "SEARCH" | "PROFILE_SUGGESTIONS" | "MESSAGES";
export type BillingModel = "CPM" | "CPC" | "CPV" | "CPA";
export type BudgetType = "DAILY" | "LIFETIME";
export type PacingType = "EVEN" | "ACCELERATED" | "SMART";
export type ReviewAction = "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "ESCALATE";
export type WalletTransactionType = "TOP_UP" | "AD_SPEND" | "REFUND" | "ADJUSTMENT" | "PROMO_CREDIT" | "REFERRAL_CREDIT" | "ADMIN_CREDIT" | "ADMIN_DEBIT";
export type WalletTransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
export type AdEventType = "IMPRESSION" | "VIEWABLE_IMPRESSION" | "CLICK" | "VIDEO_START" | "VIDEO_25" | "VIDEO_50" | "VIDEO_75" | "VIDEO_COMPLETE" | "VOICE_START" | "VOICE_COMPLETE" | "POLL_VOTE" | "CONVERSION" | "HIDE" | "REPORT" | "SAVE";
export type ConversionType = "PURCHASE" | "LEAD" | "SIGNUP" | "FOLLOW" | "MESSAGE" | "APP_INSTALL" | "ADD_TO_CART" | "CUSTOM";
export type AttributionModel = "LAST_CLICK" | "FIRST_CLICK" | "LINEAR" | "TIME_DECAY";
export type AudienceType = "CUSTOM" | "SAVED" | "LOOKALIKE" | "RETARGETING";
export type DiagnosticIssue = "LOW_BALANCE" | "ZERO_BALANCE" | "BUDGET_EXHAUSTED" | "SCHEDULE_NOT_STARTED" | "SCHEDULE_ENDED" | "TARGETING_TOO_NARROW" | "LOW_BID" | "AD_REJECTED" | "CAMPAIGN_PAUSED" | "FREQUENCY_CAP_REACHED" | "LOW_QUALITY_SCORE" | "POLICY_VIOLATION" | "PENDING_REVIEW" | "NO_ELIGIBLE_USERS";
export type AchievementType = "FIRST_CAMPAIGN" | "FIRST_CONVERSION" | "SPEND_MILESTONE" | "ROAS_MILESTONE" | "IMPRESSION_MILESTONE" | "ENGAGEMENT_MILESTONE" | "STREAK_7_DAYS" | "STREAK_30_DAYS" | "TOP_PERFORMER" | "VERIFIED_ADVERTISER";
export type AdAuditAction = "ADVERTISER_CREATED" | "ADVERTISER_VERIFIED" | "ADVERTISER_SUSPENDED" | "ADVERTISER_BANNED" | "CAMPAIGN_CREATED" | "CAMPAIGN_UPDATED" | "CAMPAIGN_PAUSED" | "CAMPAIGN_ACTIVATED" | "CAMPAIGN_DELETED" | "AD_GROUP_CREATED" | "AD_GROUP_UPDATED" | "AD_GROUP_PAUSED" | "AD_GROUP_DELETED" | "AD_CREATED" | "AD_UPDATED" | "AD_SUBMITTED" | "AD_APPROVED" | "AD_REJECTED" | "AD_PAUSED" | "AD_DELETED" | "WALLET_TOP_UP" | "WALLET_SPEND" | "WALLET_REFUND" | "WALLET_ADJUSTMENT" | "SPEND_CAP_SET" | "SPEND_CAP_UPDATED" | "ALGORITHM_TUNED" | "POLICY_UPDATED" | "TERMS_UPDATED";

// Zod schemas
export const insertAdvertiserSchema = createInsertSchema(advertisers);
export const insertCampaignSchema = createInsertSchema(adCampaigns);
export const insertAdGroupSchema = createInsertSchema(adGroups);
export const insertAdSchema = createInsertSchema(ads);
export const insertAdEventSchema = createInsertSchema(adEvents);
