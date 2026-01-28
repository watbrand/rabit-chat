CREATE TYPE "public"."business_category" AS ENUM('LUXURY_BRAND', 'RESTAURANT_FOOD', 'REAL_ESTATE', 'FASHION_CLOTHING', 'AUTOMOTIVE', 'BEAUTY_SALON_SPA', 'FINANCE_TRADING', 'MEDIA_ENTERTAINMENT', 'NIGHTLIFE_CLUB_EVENTS', 'TECH_SOFTWARE', 'EDUCATION', 'HEALTH_MEDICAL', 'ECOMMERCE_STORE', 'SERVICES', 'AGENCY_MARKETING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."creator_category" AS ENUM('INFLUENCER', 'ARTIST_MUSICIAN', 'PHOTOGRAPHER', 'VIDEOGRAPHER', 'BLOGGER', 'DJ_PRODUCER', 'COMEDIAN', 'PUBLIC_FIGURE', 'GAMER_STREAMER', 'EDUCATOR', 'FASHION_MODEL', 'FITNESS_COACH', 'BEAUTY_MAKEUP', 'BUSINESS_CREATOR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."industry" AS ENUM('TECH', 'FINANCE', 'REAL_ESTATE', 'ENTERTAINMENT', 'SPORTS', 'HEALTHCARE', 'LEGAL', 'FASHION', 'HOSPITALITY', 'MEDIA', 'AUTOMOTIVE', 'AVIATION', 'ART', 'EDUCATION', 'CONSULTING', 'CRYPTO', 'VENTURE_CAPITAL', 'PRIVATE_EQUITY', 'PHILANTHROPY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."net_worth_tier" AS ENUM('BUILDING', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');--> statement-breakpoint
CREATE TYPE "public"."payfast_order_status" AS ENUM('PENDING', 'COMPLETE', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."achievement_type" AS ENUM('FIRST_CAMPAIGN', 'FIRST_CONVERSION', 'SPEND_MILESTONE', 'ROAS_MILESTONE', 'IMPRESSION_MILESTONE', 'ENGAGEMENT_MILESTONE', 'STREAK_7_DAYS', 'STREAK_30_DAYS', 'TOP_PERFORMER', 'VERIFIED_ADVERTISER');--> statement-breakpoint
CREATE TYPE "public"."ad_audit_action" AS ENUM('ADVERTISER_CREATED', 'ADVERTISER_VERIFIED', 'ADVERTISER_SUSPENDED', 'ADVERTISER_BANNED', 'CAMPAIGN_CREATED', 'CAMPAIGN_UPDATED', 'CAMPAIGN_PAUSED', 'CAMPAIGN_ACTIVATED', 'CAMPAIGN_DELETED', 'AD_GROUP_CREATED', 'AD_GROUP_UPDATED', 'AD_GROUP_PAUSED', 'AD_GROUP_DELETED', 'AD_CREATED', 'AD_UPDATED', 'AD_SUBMITTED', 'AD_APPROVED', 'AD_REJECTED', 'AD_PAUSED', 'AD_DELETED', 'WALLET_TOP_UP', 'WALLET_SPEND', 'WALLET_REFUND', 'WALLET_ADJUSTMENT', 'SPEND_CAP_SET', 'SPEND_CAP_UPDATED', 'ALGORITHM_TUNED', 'POLICY_UPDATED', 'TERMS_UPDATED');--> statement-breakpoint
CREATE TYPE "public"."ad_event_type" AS ENUM('IMPRESSION', 'VIEWABLE_IMPRESSION', 'CLICK', 'VIDEO_START', 'VIDEO_25', 'VIDEO_50', 'VIDEO_75', 'VIDEO_COMPLETE', 'VOICE_START', 'VOICE_COMPLETE', 'POLL_VOTE', 'CONVERSION', 'HIDE', 'REPORT', 'SAVE');--> statement-breakpoint
CREATE TYPE "public"."ad_format" AS ENUM('IMAGE', 'VIDEO', 'CAROUSEL', 'STORIES', 'COLLECTION', 'VOICE', 'POLL', 'CONVERSATION', 'DARK_POST');--> statement-breakpoint
CREATE TYPE "public"."ad_group_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."ad_placement" AS ENUM('FEED', 'DISCOVER', 'STORIES', 'REELS', 'VOICE_REELS', 'SEARCH', 'PROFILE_SUGGESTIONS', 'MESSAGES');--> statement-breakpoint
CREATE TYPE "public"."ad_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."advertiser_status" AS ENUM('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED');--> statement-breakpoint
CREATE TYPE "public"."advertiser_verification_status" AS ENUM('NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFO_NEEDED');--> statement-breakpoint
CREATE TYPE "public"."attribution_model" AS ENUM('LAST_CLICK', 'FIRST_CLICK', 'LINEAR', 'TIME_DECAY');--> statement-breakpoint
CREATE TYPE "public"."audience_type" AS ENUM('CUSTOM', 'SAVED', 'LOOKALIKE', 'RETARGETING');--> statement-breakpoint
CREATE TYPE "public"."billing_model" AS ENUM('CPM', 'CPC', 'CPV', 'CPA');--> statement-breakpoint
CREATE TYPE "public"."budget_type" AS ENUM('DAILY', 'LIFETIME');--> statement-breakpoint
CREATE TYPE "public"."campaign_objective" AS ENUM('AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'SALES', 'APP_PROMOTION', 'VIDEO_VIEWS', 'COMMUNITY_GROWTH');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."conversion_type" AS ENUM('PURCHASE', 'LEAD', 'SIGNUP', 'FOLLOW', 'MESSAGE', 'APP_INSTALL', 'ADD_TO_CART', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."diagnostic_issue" AS ENUM('LOW_BALANCE', 'ZERO_BALANCE', 'BUDGET_EXHAUSTED', 'SCHEDULE_NOT_STARTED', 'SCHEDULE_ENDED', 'TARGETING_TOO_NARROW', 'LOW_BID', 'AD_REJECTED', 'CAMPAIGN_PAUSED', 'FREQUENCY_CAP_REACHED', 'LOW_QUALITY_SCORE', 'POLICY_VIOLATION', 'PENDING_REVIEW', 'NO_ELIGIBLE_USERS');--> statement-breakpoint
CREATE TYPE "public"."pacing_type" AS ENUM('EVEN', 'ACCELERATED', 'SMART');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('APPROVE', 'REJECT', 'REQUEST_CHANGES', 'ESCALATE');--> statement-breakpoint
CREATE TYPE "public"."wallet_transaction_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."wallet_transaction_type" AS ENUM('TOP_UP', 'AD_SPEND', 'REFUND', 'ADJUSTMENT', 'PROMO_CREDIT', 'REFERRAL_CREDIT', 'ADMIN_CREDIT', 'ADMIN_DEBIT');--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"category_id" varchar,
	"category_slug" varchar(50) NOT NULL,
	"confidence" real DEFAULT 0.5 NOT NULL,
	"analyzed_at" timestamp DEFAULT now() NOT NULL,
	"analyzed_by" varchar(20) DEFAULT 'gemini',
	CONSTRAINT "content_category_unique" UNIQUE("post_id","category_slug")
);
--> statement-breakpoint
CREATE TABLE "interest_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(20),
	"gradient_colors" jsonb DEFAULT '[]'::jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interest_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payfast_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"mall_item_id" varchar,
	"quantity" integer DEFAULT 1 NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payfast_order_status" DEFAULT 'PENDING' NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"item_description" text,
	"email_address" varchar(255),
	"pf_payment_id" varchar(255),
	"payment_status" varchar(50),
	"amount_gross" varchar(50),
	"amount_fee" varchar(50),
	"amount_net" varchar(50),
	"signature" varchar(255),
	"itn_payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ad_audience_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audience_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "ad_audience_members_unique" UNIQUE("audience_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "ad_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar,
	"actor_id" varchar,
	"actor_type" varchar(20) NOT NULL,
	"action" "ad_audit_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100),
	"previous_state" jsonb,
	"new_state" jsonb,
	"changes_summary" text,
	"ip_address" varchar(50),
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"objective" "campaign_objective" NOT NULL,
	"status" "campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"budget_type" "budget_type" DEFAULT 'DAILY' NOT NULL,
	"budget_amount" bigint NOT NULL,
	"budget_spent" bigint DEFAULT 0 NOT NULL,
	"budget_remaining" bigint,
	"lifetime_budget" bigint,
	"pacing" "pacing_type" DEFAULT 'EVEN' NOT NULL,
	"bid_strategy" varchar(50) DEFAULT 'AUTO',
	"bid_amount" bigint,
	"target_cpa" bigint,
	"start_date" timestamp,
	"end_date" timestamp,
	"timezone" varchar(50) DEFAULT 'Africa/Johannesburg',
	"dayparting" jsonb DEFAULT '{}'::jsonb,
	"placements" jsonb DEFAULT '["FEED"]'::jsonb,
	"submitted_at" timestamp,
	"review_started_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by_id" varchar,
	"rejection_reason" text,
	"rejection_details" text,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"conversions" bigint DEFAULT 0 NOT NULL,
	"conversion_value" bigint DEFAULT 0 NOT NULL,
	"reach" bigint DEFAULT 0 NOT NULL,
	"frequency" real DEFAULT 0,
	"ctr" real DEFAULT 0,
	"cpc" real DEFAULT 0,
	"cpm" real DEFAULT 0,
	"roas" real DEFAULT 0,
	"quality_score" real DEFAULT 50,
	"relevance_score" real DEFAULT 50,
	"is_in_learning_phase" boolean DEFAULT true NOT NULL,
	"learning_phase_ends_at" timestamp,
	"learning_phase_conversions" integer DEFAULT 0,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"is_dark_post" boolean DEFAULT false NOT NULL,
	"is_clone" boolean DEFAULT false NOT NULL,
	"cloned_from_id" varchar,
	"version" integer DEFAULT 1 NOT NULL,
	"last_edited_at" timestamp,
	"last_edited_by_id" varchar,
	"paused_at" timestamp,
	"paused_by_id" varchar,
	"paused_reason" text,
	"completed_at" timestamp,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_conversion_pixels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"pixel_code" varchar(50) NOT NULL,
	"conversion_type" "conversion_type" DEFAULT 'PURCHASE' NOT NULL,
	"default_value" bigint,
	"default_currency" varchar(3) DEFAULT 'ZAR',
	"is_active" boolean DEFAULT true NOT NULL,
	"total_fires" bigint DEFAULT 0 NOT NULL,
	"last_fired_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_conversion_pixels_pixel_code_unique" UNIQUE("pixel_code")
);
--> statement-breakpoint
CREATE TABLE "ad_custom_audiences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"type" "audience_type" DEFAULT 'CUSTOM' NOT NULL,
	"source_type" varchar(50),
	"rules" jsonb DEFAULT '{}'::jsonb,
	"estimated_size" bigint DEFAULT 0,
	"actual_size" bigint DEFAULT 0,
	"last_calculated_at" timestamp,
	"source_audience_id" varchar,
	"lookalike_similarity" real,
	"uploaded_file_url" text,
	"uploaded_record_count" integer,
	"matched_count" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_processing" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_delivery_diagnostics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" varchar,
	"campaign_id" varchar NOT NULL,
	"issue" "diagnostic_issue" NOT NULL,
	"severity" varchar(20) DEFAULT 'MEDIUM',
	"message" text NOT NULL,
	"suggested_fix" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" varchar NOT NULL,
	"ad_group_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"user_id" varchar,
	"event_type" "ad_event_type" NOT NULL,
	"placement" "ad_placement" NOT NULL,
	"session_id" varchar(100),
	"device_id" varchar(100),
	"ip_address" varchar(50),
	"user_agent" text,
	"platform" varchar(20),
	"cost_amount" bigint DEFAULT 0,
	"bid_amount" bigint,
	"watch_time_ms" integer,
	"percent_watched" real,
	"sound_on" boolean,
	"conversion_type" "conversion_type",
	"conversion_value" bigint,
	"conversion_currency" varchar(3),
	"referrer" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"event_hash" varchar(64),
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_frequency_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ad_id" varchar NOT NULL,
	"ad_group_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"impression_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"last_impression_at" timestamp,
	"last_click_at" timestamp,
	"converted_at" timestamp,
	"cooldown_until" timestamp,
	"period_start_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_frequency_tracking_unique" UNIQUE("user_id","ad_id")
);
--> statement-breakpoint
CREATE TABLE "ad_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"status" "ad_group_status" DEFAULT 'DRAFT' NOT NULL,
	"budget_amount" bigint,
	"budget_spent" bigint DEFAULT 0 NOT NULL,
	"bid_amount" bigint,
	"billing_model" "billing_model" DEFAULT 'CPM' NOT NULL,
	"placements" jsonb DEFAULT '[]'::jsonb,
	"targeting" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"age_min" integer DEFAULT 18,
	"age_max" integer DEFAULT 65,
	"genders" jsonb DEFAULT '[]'::jsonb,
	"countries" jsonb DEFAULT '[]'::jsonb,
	"provinces" jsonb DEFAULT '[]'::jsonb,
	"cities" jsonb DEFAULT '[]'::jsonb,
	"excluded_locations" jsonb DEFAULT '[]'::jsonb,
	"net_worth_tiers" jsonb DEFAULT '[]'::jsonb,
	"min_net_worth" bigint,
	"max_net_worth" bigint,
	"min_influence_score" integer,
	"max_influence_score" integer,
	"interests" jsonb DEFAULT '[]'::jsonb,
	"behaviors" jsonb DEFAULT '[]'::jsonb,
	"industries" jsonb DEFAULT '[]'::jsonb,
	"custom_audience_ids" jsonb DEFAULT '[]'::jsonb,
	"excluded_audience_ids" jsonb DEFAULT '[]'::jsonb,
	"device_types" jsonb DEFAULT '[]'::jsonb,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"connection_types" jsonb DEFAULT '[]'::jsonb,
	"frequency_cap_impressions" integer DEFAULT 3,
	"frequency_cap_period_hours" integer DEFAULT 24,
	"frequency_cap_cooldown_hours" integer,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"conversions" bigint DEFAULT 0 NOT NULL,
	"reach" bigint DEFAULT 0 NOT NULL,
	"estimated_audience_size" bigint,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"violation_severity" varchar(20) DEFAULT 'MODERATE',
	"auto_reject" boolean DEFAULT false NOT NULL,
	"keywords" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_promo_code_redemptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" varchar NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"wallet_transaction_id" varchar,
	"amount_credited" bigint NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_promo_redemption_unique" UNIQUE("promo_code_id","advertiser_id")
);
--> statement-breakpoint
CREATE TABLE "ad_promo_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"amount" bigint NOT NULL,
	"percentage" real,
	"max_amount" bigint,
	"usage_limit" integer,
	"usage_limit_per_user" integer DEFAULT 1,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"min_spend" bigint,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"new_advertisers_only" boolean DEFAULT false NOT NULL,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ad_review_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"reviewer_id" varchar,
	"action" "review_action" NOT NULL,
	"previous_status" "ad_status",
	"new_status" "ad_status",
	"reason" text,
	"details" text,
	"policy_violations" jsonb DEFAULT '[]'::jsonb,
	"review_duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_stats_daily" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"ad_id" varchar,
	"ad_group_id" varchar,
	"campaign_id" varchar,
	"advertiser_id" varchar NOT NULL,
	"placement" "ad_placement",
	"impressions" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"conversions" bigint DEFAULT 0 NOT NULL,
	"conversion_value" bigint DEFAULT 0 NOT NULL,
	"reach" bigint DEFAULT 0 NOT NULL,
	"frequency" real DEFAULT 0,
	"spend" bigint DEFAULT 0 NOT NULL,
	"ctr" real DEFAULT 0,
	"cpc" real DEFAULT 0,
	"cpm" real DEFAULT 0,
	"cpa" real DEFAULT 0,
	"roas" real DEFAULT 0,
	"video_views" bigint DEFAULT 0,
	"video_views_25" bigint DEFAULT 0,
	"video_views_50" bigint DEFAULT 0,
	"video_views_75" bigint DEFAULT 0,
	"video_views_100" bigint DEFAULT 0,
	"avg_watch_time_ms" real DEFAULT 0,
	"saves" bigint DEFAULT 0,
	"hides" bigint DEFAULT 0,
	"reports" bigint DEFAULT 0,
	"breakdowns" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_stats_daily_unique" UNIQUE("date","ad_id","placement")
);
--> statement-breakpoint
CREATE TABLE "ad_system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"category" varchar(50),
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_by_id" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "ad_wallet_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"reserved_amount" bigint DEFAULT 0 NOT NULL,
	"lifetime_deposits" bigint DEFAULT 0 NOT NULL,
	"lifetime_spend" bigint DEFAULT 0 NOT NULL,
	"lifetime_refunds" bigint DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'ZAR' NOT NULL,
	"auto_top_up_enabled" boolean DEFAULT false NOT NULL,
	"auto_top_up_threshold" bigint,
	"auto_top_up_amount" bigint,
	"low_balance_alert_threshold" bigint DEFAULT 10000,
	"last_low_balance_alert_at" timestamp,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"frozen_reason" text,
	"frozen_at" timestamp,
	"frozen_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ad_wallet_accounts_advertiser_id_unique" UNIQUE("advertiser_id")
);
--> statement-breakpoint
CREATE TABLE "ad_wallet_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" varchar NOT NULL,
	"type" "wallet_transaction_type" NOT NULL,
	"amount" bigint NOT NULL,
	"balance_before" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"status" "wallet_transaction_status" DEFAULT 'PENDING' NOT NULL,
	"reference" varchar(100),
	"description" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"campaign_id" varchar,
	"promo_code_id" varchar,
	"admin_id" varchar,
	"admin_notes" text,
	"payfast_payment_id" varchar(100),
	"invoice_number" varchar(50),
	"invoice_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ad_webhooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(100),
	"events" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp,
	"last_status" integer,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ad_group_id" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"format" "ad_format" DEFAULT 'IMAGE' NOT NULL,
	"status" "ad_status" DEFAULT 'DRAFT' NOT NULL,
	"headline" varchar(125),
	"description" text,
	"call_to_action" varchar(50),
	"destination_url" text,
	"display_url" text,
	"primary_media_url" text,
	"primary_media_thumbnail" text,
	"primary_media_type" varchar(20),
	"primary_media_duration" integer,
	"primary_media_aspect_ratio" real,
	"carousel_items" jsonb DEFAULT '[]'::jsonb,
	"voice_url" text,
	"voice_duration" integer,
	"voice_transcript" text,
	"poll_question" text,
	"poll_options" jsonb DEFAULT '[]'::jsonb,
	"placement_creatives" jsonb DEFAULT '{}'::jsonb,
	"submitted_at" timestamp,
	"review_started_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by_id" varchar,
	"rejection_reason" text,
	"rejection_details" text,
	"policy_violations" jsonb DEFAULT '[]'::jsonb,
	"ai_moderation_score" real,
	"ai_moderation_flags" jsonb DEFAULT '[]'::jsonb,
	"ai_performance_prediction" real,
	"ai_suggestions" jsonb DEFAULT '[]'::jsonb,
	"quality_score" real DEFAULT 50,
	"relevance_score" real DEFAULT 50,
	"engagement_score" real DEFAULT 50,
	"feedback_positive" integer DEFAULT 0 NOT NULL,
	"feedback_negative" integer DEFAULT 0 NOT NULL,
	"impressions" bigint DEFAULT 0 NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"conversions" bigint DEFAULT 0 NOT NULL,
	"spend" bigint DEFAULT 0 NOT NULL,
	"ctr" real DEFAULT 0,
	"is_variant" boolean DEFAULT false NOT NULL,
	"variant_of" varchar,
	"variant_label" varchar(50),
	"variant_weight" integer DEFAULT 50,
	"linked_post_id" varchar,
	"linked_mall_item_id" varchar,
	"paused_at" timestamp,
	"paused_by_id" varchar,
	"paused_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertiser_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"type" "achievement_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon_url" text,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advertiser_terms_acceptance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"terms_id" varchar NOT NULL,
	"terms_version" varchar(20) NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertiser_terms_version_unique" UNIQUE("advertiser_id","terms_version")
);
--> statement-breakpoint
CREATE TABLE "advertisers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"business_name" varchar(200),
	"business_type" varchar(50),
	"industry" varchar(50),
	"website" text,
	"phone" varchar(30),
	"address" text,
	"tax_id" varchar(50),
	"status" "advertiser_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"verification_status" "advertiser_verification_status" DEFAULT 'NOT_SUBMITTED' NOT NULL,
	"verification_documents" jsonb DEFAULT '[]'::jsonb,
	"verification_notes" text,
	"verified_at" timestamp,
	"verified_by_id" varchar,
	"terms_accepted_version" varchar(20),
	"terms_accepted_at" timestamp,
	"spend_cap_daily" bigint,
	"spend_cap_monthly" bigint,
	"velocity_limit_hourly" bigint,
	"trust_score" integer DEFAULT 50 NOT NULL,
	"total_spend" bigint DEFAULT 0 NOT NULL,
	"total_campaigns" integer DEFAULT 0 NOT NULL,
	"total_impressions" bigint DEFAULT 0 NOT NULL,
	"total_clicks" bigint DEFAULT 0 NOT NULL,
	"total_conversions" bigint DEFAULT 0 NOT NULL,
	"avg_ctr" real DEFAULT 0,
	"avg_roas" real DEFAULT 0,
	"vip_tier" varchar(20) DEFAULT 'BRONZE',
	"vip_points" integer DEFAULT 0 NOT NULL,
	"suspended_at" timestamp,
	"suspended_by_id" varchar,
	"suspended_reason" text,
	"banned_at" timestamp,
	"banned_by_id" varchar,
	"banned_reason" text,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertisers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "advertising_terms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"effective_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advertising_terms_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "user_ad_interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ad_id" varchar NOT NULL,
	"action" varchar(30) NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_ad_interactions_unique" UNIQUE("user_id","ad_id","action")
);
--> statement-breakpoint
CREATE TABLE "user_ad_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"interested_categories" jsonb DEFAULT '[]'::jsonb,
	"not_interested_categories" jsonb DEFAULT '[]'::jsonb,
	"hidden_advertisers" jsonb DEFAULT '[]'::jsonb,
	"prefer_video_ads" boolean DEFAULT true,
	"prefer_voice_ads" boolean DEFAULT true,
	"prefer_interactive_ads" boolean DEFAULT true,
	"enable_personalization" boolean DEFAULT true NOT NULL,
	"share_activity_for_ads" boolean DEFAULT true NOT NULL,
	"max_ads_per_session" integer DEFAULT 10,
	"min_posts_between_ads" integer DEFAULT 4,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_ad_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "category_id" varchar;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "affinity_score" real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_interests" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "industry" "industry";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "net_worth_tier" "net_worth_tier" DEFAULT 'BUILDING';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_step" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "net_worth_visibility" "policy" DEFAULT 'EVERYONE';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_visibility" "policy" DEFAULT 'EVERYONE';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_session_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "province" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "creator_category" "creator_category";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "portfolio_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "primary_platforms" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "content_language" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "content_tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_management" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "management_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_location_publicly" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_category" "business_category";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_established" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_hours" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_provider" text DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "apple_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "community_guidelines_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_version" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "marketing_opt_in" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_category_id_interest_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."interest_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payfast_orders" ADD CONSTRAINT "payfast_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payfast_orders" ADD CONSTRAINT "payfast_orders_mall_item_id_mall_items_id_fk" FOREIGN KEY ("mall_item_id") REFERENCES "public"."mall_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_categories_post_idx" ON "content_categories" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "content_categories_category_idx" ON "content_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "content_categories_slug_idx" ON "content_categories" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "interest_categories_order_idx" ON "interest_categories" USING btree ("order");--> statement-breakpoint
CREATE INDEX "interest_categories_active_idx" ON "interest_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payfast_orders_user_id_idx" ON "payfast_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payfast_orders_status_idx" ON "payfast_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payfast_orders_pf_payment_id_idx" ON "payfast_orders" USING btree ("pf_payment_id");--> statement-breakpoint
CREATE INDEX "ad_audience_members_audience_idx" ON "ad_audience_members" USING btree ("audience_id");--> statement-breakpoint
CREATE INDEX "ad_audience_members_user_idx" ON "ad_audience_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ad_audit_logs_advertiser_idx" ON "ad_audit_logs" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_audit_logs_actor_idx" ON "ad_audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "ad_audit_logs_action_idx" ON "ad_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "ad_audit_logs_entity_idx" ON "ad_audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ad_audit_logs_created_idx" ON "ad_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ad_campaigns_advertiser_idx" ON "ad_campaigns" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_campaigns_objective_idx" ON "ad_campaigns" USING btree ("objective");--> statement-breakpoint
CREATE INDEX "ad_campaigns_dates_idx" ON "ad_campaigns" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "ad_campaigns_created_idx" ON "ad_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ad_conversion_pixels_advertiser_idx" ON "ad_conversion_pixels" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_conversion_pixels_code_idx" ON "ad_conversion_pixels" USING btree ("pixel_code");--> statement-breakpoint
CREATE INDEX "ad_custom_audiences_advertiser_idx" ON "ad_custom_audiences" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_custom_audiences_type_idx" ON "ad_custom_audiences" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ad_delivery_diagnostics_ad_idx" ON "ad_delivery_diagnostics" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "ad_delivery_diagnostics_campaign_idx" ON "ad_delivery_diagnostics" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_delivery_diagnostics_issue_idx" ON "ad_delivery_diagnostics" USING btree ("issue");--> statement-breakpoint
CREATE INDEX "ad_events_ad_idx" ON "ad_events" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "ad_events_campaign_idx" ON "ad_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_events_user_idx" ON "ad_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ad_events_type_idx" ON "ad_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "ad_events_created_idx" ON "ad_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ad_events_hash_idx" ON "ad_events" USING btree ("event_hash");--> statement-breakpoint
CREATE INDEX "ad_frequency_tracking_user_idx" ON "ad_frequency_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ad_frequency_tracking_ad_idx" ON "ad_frequency_tracking" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "ad_frequency_tracking_campaign_idx" ON "ad_frequency_tracking" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_groups_campaign_idx" ON "ad_groups" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_groups_status_idx" ON "ad_groups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_policies_category_idx" ON "ad_policies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ad_policies_active_idx" ON "ad_policies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ad_promo_redemptions_promo_idx" ON "ad_promo_code_redemptions" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "ad_promo_redemptions_advertiser_idx" ON "ad_promo_code_redemptions" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_promo_codes_code_idx" ON "ad_promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "ad_promo_codes_active_idx" ON "ad_promo_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ad_review_history_ad_idx" ON "ad_review_history" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "ad_review_history_campaign_idx" ON "ad_review_history" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_review_history_reviewer_idx" ON "ad_review_history" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "ad_stats_daily_date_idx" ON "ad_stats_daily" USING btree ("date");--> statement-breakpoint
CREATE INDEX "ad_stats_daily_ad_idx" ON "ad_stats_daily" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "ad_stats_daily_campaign_idx" ON "ad_stats_daily" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_stats_daily_advertiser_idx" ON "ad_stats_daily" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_system_settings_key_idx" ON "ad_system_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "ad_system_settings_category_idx" ON "ad_system_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ad_wallet_accounts_advertiser_idx" ON "ad_wallet_accounts" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_wallet_accounts_balance_idx" ON "ad_wallet_accounts" USING btree ("balance");--> statement-breakpoint
CREATE INDEX "ad_wallet_transactions_wallet_idx" ON "ad_wallet_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "ad_wallet_transactions_type_idx" ON "ad_wallet_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ad_wallet_transactions_status_idx" ON "ad_wallet_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_wallet_transactions_created_idx" ON "ad_wallet_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ad_wallet_transactions_campaign_idx" ON "ad_wallet_transactions" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_webhooks_advertiser_idx" ON "ad_webhooks" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ads_ad_group_idx" ON "ads" USING btree ("ad_group_id");--> statement-breakpoint
CREATE INDEX "ads_campaign_idx" ON "ads" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ads_advertiser_idx" ON "ads" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ads_status_idx" ON "ads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ads_format_idx" ON "ads" USING btree ("format");--> statement-breakpoint
CREATE INDEX "advertiser_achievements_advertiser_idx" ON "advertiser_achievements" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "advertiser_achievements_type_idx" ON "advertiser_achievements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "advertiser_terms_acceptance_advertiser_idx" ON "advertiser_terms_acceptance" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "advertisers_user_idx" ON "advertisers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "advertisers_status_idx" ON "advertisers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "advertisers_verification_idx" ON "advertisers" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "advertisers_vip_tier_idx" ON "advertisers" USING btree ("vip_tier");--> statement-breakpoint
CREATE INDEX "advertising_terms_active_idx" ON "advertising_terms" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "advertising_terms_effective_idx" ON "advertising_terms" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "user_ad_interactions_user_idx" ON "user_ad_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_ad_interactions_ad_idx" ON "user_ad_interactions" USING btree ("ad_id");--> statement-breakpoint
CREATE INDEX "user_ad_preferences_user_idx" ON "user_ad_preferences" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_category_id_interest_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."interest_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_interests_category_idx" ON "user_interests" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "user_interests_affinity_idx" ON "user_interests" USING btree ("affinity_score");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_apple_id_unique" UNIQUE("apple_id");