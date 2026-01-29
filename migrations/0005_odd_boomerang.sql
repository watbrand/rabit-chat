CREATE TYPE "public"."accuracy_vote" AS ENUM('TRUE', 'FALSE', 'UNSURE');--> statement-breakpoint
CREATE TYPE "public"."achievement_category" AS ENUM('WEALTH', 'SOCIAL', 'CONTENT', 'SHOPPING', 'GIFTING', 'STREAMING', 'SPECIAL');--> statement-breakpoint
CREATE TYPE "public"."admin_keyword_filter_action" AS ENUM('BLOCK', 'FLAG', 'SHADOW_BAN', 'WARN');--> statement-breakpoint
CREATE TYPE "public"."api_service" AS ENUM('CLOUDINARY', 'RESEND', 'OPENAI', 'GEMINI', 'TWILIO', 'PAYFAST', 'EXPO_PUSH');--> statement-breakpoint
CREATE TYPE "public"."appeal_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'MORE_INFO_NEEDED');--> statement-breakpoint
CREATE TYPE "public"."appeal_type" AS ENUM('ACCOUNT_SUSPENDED', 'CONTENT_REMOVED', 'VERIFICATION_DENIED', 'WITHDRAWAL_REJECTED', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."attachment_type" AS ENUM('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'ARCHIVE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."battle_status" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."feature_request_status" AS ENUM('NEW', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."gossip_award_type" AS ENUM('WEEKLY_TOP', 'MONTHLY_TOP', 'MOST_ACCURATE', 'FUNNIEST', 'MOST_SHOCKING', 'LOCAL_LEGEND');--> statement-breakpoint
CREATE TYPE "public"."gossip_post_type" AS ENUM('REGULAR', 'CONFESSION', 'AMA', 'I_SAW', 'I_HEARD');--> statement-breakpoint
CREATE TYPE "public"."help_article_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."help_difficulty" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."platform_revenue_source" AS ENUM('COIN_PURCHASE', 'WITHDRAWAL_FEE', 'MARKETPLACE_FEE', 'BATTLE_FEE', 'PREMIUM_FEATURE', 'ADVERTISEMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."spill_session_status" AS ENUM('SCHEDULED', 'ACTIVE', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."stake_status" AS ENUM('ACTIVE', 'MATURED', 'CLAIMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."system_status_type" AS ENUM('OPERATIONAL', 'DEGRADED', 'PARTIAL_OUTAGE', 'MAJOR_OUTAGE', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."tea_spiller_level" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');--> statement-breakpoint
CREATE TYPE "public"."ticket_category" AS ENUM('ACCOUNT', 'PAYMENT', 'WITHDRAWAL', 'COINS', 'GIFTS', 'MALL', 'TECHNICAL', 'REPORT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."ticket_sender_type" AS ENUM('USER', 'ADMIN', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."wealth_club_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."word_filter_action" AS ENUM('BLOCK', 'REPLACE', 'FLAG');--> statement-breakpoint
CREATE TYPE "public"."ad_dispute_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'RESOLVED_APPROVED', 'RESOLVED_DENIED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."ad_dispute_type" AS ENUM('BILLING_ERROR', 'UNDER_DELIVERY', 'POLICY_VIOLATION', 'TECHNICAL_ISSUE', 'REFUND_REQUEST', 'OTHER');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AR_FILTER_CREATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AR_FILTER_UPDATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AR_FILTER_FEATURED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AR_FILTER_UNFEATURED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AR_FILTER_ENABLED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AR_FILTER_DISABLED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AR_FILTER_DELETED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AI_AVATAR_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AI_AVATAR_REJECTED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'AI_AVATAR_DELETED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'EXPLORE_CATEGORY_CREATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'EXPLORE_CATEGORY_UPDATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'EXPLORE_CATEGORY_DELETED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ADMIN_UPDATE_GROUP_SETTINGS';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ADMIN_REMOVE_GROUP_MEMBER';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ADMIN_APPROVE_JOIN_REQUEST';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ADMIN_REJECT_JOIN_REQUEST';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ADMIN_DELETE_GROUP';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ADMIN_REMOVE_STREAM_VIEWER';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ADMIN_KICK_STREAM_VIEWER';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'WALLET_ADJUSTED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GIFT_TYPE_CREATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'GIFT_TYPE_UPDATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'WITHDRAWAL_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'WITHDRAWAL_REJECTED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'KYC_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'KYC_REJECTED';--> statement-breakpoint
ALTER TYPE "public"."message_type" ADD VALUE 'LINK';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'AD_CAMPAIGN_ENDED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'AD_LOW_BALANCE';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'AD_REFUND_PROCESSED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'AD_DISPUTE_RESOLVED';--> statement-breakpoint
ALTER TYPE "public"."story_type" ADD VALUE 'SHARED_POST';--> statement-breakpoint
ALTER TYPE "public"."ad_audit_action" ADD VALUE 'POST_BOOSTED';--> statement-breakpoint
ALTER TYPE "public"."campaign_objective" ADD VALUE 'BOOST_POST';--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"category" "achievement_category" NOT NULL,
	"icon_url" text,
	"requirement" text NOT NULL,
	"reward_coins" integer DEFAULT 0 NOT NULL,
	"reward_badge" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_keyword_filters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"action" "admin_keyword_filter_action" DEFAULT 'FLAG' NOT NULL,
	"filter_comments" boolean DEFAULT true NOT NULL,
	"filter_messages" boolean DEFAULT true NOT NULL,
	"filter_posts" boolean DEFAULT true NOT NULL,
	"filter_usernames" boolean DEFAULT true NOT NULL,
	"filter_bios" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_keyword_filters_keyword_unique" UNIQUE("keyword")
);
--> statement-breakpoint
CREATE TABLE "api_access_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"token" varchar(255) NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_access_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "api_usage_alert_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" integer,
	"service" "api_service" NOT NULL,
	"alert_type" text NOT NULL,
	"current_value" integer NOT NULL,
	"threshold_value" integer NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_usage_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" "api_service" NOT NULL,
	"alert_type" text NOT NULL,
	"threshold_value" integer NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"last_triggered_at" timestamp,
	"notify_email" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_usage_daily" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" "api_service" NOT NULL,
	"date" date NOT NULL,
	"request_count" integer DEFAULT 0,
	"bytes_transferred" bigint DEFAULT 0,
	"estimated_cost_cents" integer DEFAULT 0,
	"errors" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_usage_daily_service_date_idx" UNIQUE("service","date")
);
--> statement-breakpoint
CREATE TABLE "app_changelog" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"improvements" jsonb DEFAULT '[]'::jsonb,
	"bug_fixes" jsonb DEFAULT '[]'::jsonb,
	"image_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "appeal_type" NOT NULL,
	"status" "appeal_status" DEFAULT 'PENDING' NOT NULL,
	"subject" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"reference_id" varchar,
	"attachment_urls" jsonb DEFAULT '[]'::jsonb,
	"admin_response" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"total_gifts_received" integer DEFAULT 0 NOT NULL,
	"total_coins_received" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "battle_participants_unique" UNIQUE("battle_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "canned_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"category" "ticket_category",
	"shortcut" varchar(50),
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_bundles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"coin_amount" integer NOT NULL,
	"bonus_coins" integer DEFAULT 0 NOT NULL,
	"price_rands" integer NOT NULL,
	"icon_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"bundle_id" varchar NOT NULL,
	"coins_received" integer NOT NULL,
	"amount_paid_rands" integer NOT NULL,
	"payment_method" varchar(50) DEFAULT 'payfast' NOT NULL,
	"payment_reference" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "community_answer_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"answer_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_upvote" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_answer_votes_user_answer_idx" UNIQUE("user_id","answer_id")
);
--> statement-breakpoint
CREATE TABLE "community_answers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"body" text NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"is_accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category_id" varchar,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"answer_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"is_solved" boolean DEFAULT false NOT NULL,
	"accepted_answer_id" varchar,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_muted" boolean DEFAULT false NOT NULL,
	"muted_until" timestamp,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"notification_sound" text DEFAULT 'default',
	"custom_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_settings_unique" UNIQUE("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "creator_earnings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_earnings_coins" bigint DEFAULT 0 NOT NULL,
	"pending_withdrawal_coins" bigint DEFAULT 0 NOT NULL,
	"withdrawn_coins" bigint DEFAULT 0 NOT NULL,
	"platform_fee_paid" bigint DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_earnings_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "daily_reward_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_number" integer NOT NULL,
	"base_coins" integer NOT NULL,
	"streak_bonus" integer DEFAULT 0 NOT NULL,
	"description" text,
	"icon_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_reward_config_day_number_unique" UNIQUE("day_number")
);
--> statement-breakpoint
CREATE TABLE "daily_rewards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"last_claim_date" date,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"total_claimed" integer DEFAULT 0 NOT NULL,
	"total_coins_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_rewards_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "earnings_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" varchar,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "economy_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "economy_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "feature_request_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_upvote" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_request_votes_user_request_idx" UNIQUE("user_id","request_id")
);
--> statement-breakpoint
CREATE TABLE "feature_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50),
	"status" "feature_request_status" DEFAULT 'NEW' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"admin_response" text,
	"admin_responded_at" timestamp,
	"admin_responded_by" varchar,
	"planned_version" varchar(20),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_stakes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"gift_transaction_id" varchar NOT NULL,
	"staked_coins" integer NOT NULL,
	"stake_duration_days" integer NOT NULL,
	"bonus_percent" integer NOT NULL,
	"expected_return" integer NOT NULL,
	"status" "stake_status" DEFAULT 'ACTIVE' NOT NULL,
	"staked_at" timestamp DEFAULT now() NOT NULL,
	"matures_at" timestamp NOT NULL,
	"claimed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "gossip_accuracy_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"vote" "accuracy_vote" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_accuracy_votes_unique" UNIQUE("post_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE "gossip_aliases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"alias" varchar(50) NOT NULL,
	"alias_color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_aliases_post_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_awards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"award_type" "gossip_award_type" NOT NULL,
	"za_location_id" varchar,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"rank" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gossip_dm_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar,
	"participant_1_hash" varchar(64) NOT NULL,
	"participant_2_hash" varchar(64) NOT NULL,
	"participant_1_alias" varchar(50) NOT NULL,
	"participant_2_alias" varchar(50) NOT NULL,
	"last_message_at" timestamp,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_dm_participants_unique" UNIQUE("participant_1_hash","participant_2_hash","post_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_dm_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_hash" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gossip_hashtags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag" varchar(100) NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_hashtags_tag_unique" UNIQUE("tag")
);
--> statement-breakpoint
CREATE TABLE "gossip_local_legends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"za_location_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"total_engagement" integer DEFAULT 0 NOT NULL,
	"total_verified_posts" integer DEFAULT 0 NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_local_legends_unique" UNIQUE("za_location_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE "gossip_poll_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"option_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_poll_votes_unique" UNIQUE("poll_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE "gossip_polls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"question" text NOT NULL,
	"option_1" varchar(100) NOT NULL,
	"option_2" varchar(100) NOT NULL,
	"option_3" varchar(100),
	"option_4" varchar(100),
	"option_1_votes" integer DEFAULT 0 NOT NULL,
	"option_2_votes" integer DEFAULT 0 NOT NULL,
	"option_3_votes" integer DEFAULT 0 NOT NULL,
	"option_4_votes" integer DEFAULT 0 NOT NULL,
	"total_votes" integer DEFAULT 0 NOT NULL,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_polls_post_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_post_follows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_post_follows_unique" UNIQUE("post_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE "gossip_post_hashtags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"hashtag_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_post_hashtags_unique" UNIQUE("post_id","hashtag_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_post_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_post_id" varchar NOT NULL,
	"linked_post_id" varchar NOT NULL,
	"link_type" varchar(20) DEFAULT 'PART_2' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_post_links_unique" UNIQUE("original_post_id","linked_post_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_post_views" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_post_views_unique" UNIQUE("post_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE "gossip_rate_limits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"action_type" varchar(20) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	CONSTRAINT "gossip_rate_limits_unique" UNIQUE("device_hash","action_type","window_start")
);
--> statement-breakpoint
CREATE TABLE "gossip_reposts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_post_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"quote_text" text,
	"is_quote_repost" boolean DEFAULT false NOT NULL,
	"za_location_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_reposts_unique" UNIQUE("original_post_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE "gossip_saves" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_saves_unique" UNIQUE("post_id","device_hash")
);
--> statement-breakpoint
CREATE TABLE "gossip_spill_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"za_location_id" varchar,
	"scheduled_start" timestamp NOT NULL,
	"scheduled_end" timestamp NOT NULL,
	"status" "spill_session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"engagement_boost" real DEFAULT 1.5 NOT NULL,
	"total_posts" integer DEFAULT 0 NOT NULL,
	"total_reactions" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gossip_trending_hashtags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hashtag_id" varchar NOT NULL,
	"za_location_id" varchar,
	"trending_score" real DEFAULT 0 NOT NULL,
	"use_last_24h" integer DEFAULT 0 NOT NULL,
	"last_calculated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_trending_hashtags_unique" UNIQUE("hashtag_id","za_location_id")
);
--> statement-breakpoint
CREATE TABLE "help_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"icon" varchar(50) NOT NULL,
	"badge_color" varchar(20),
	"requirement" varchar(50) NOT NULL,
	"threshold" integer NOT NULL,
	"coin_reward" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_article_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"video_url" text,
	"target_element" varchar(100),
	"screen_name" varchar(100),
	"action_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"difficulty" "help_difficulty" DEFAULT 'BEGINNER',
	"status" "help_article_status" DEFAULT 'DRAFT' NOT NULL,
	"has_walkthrough" boolean DEFAULT false NOT NULL,
	"has_video" boolean DEFAULT false NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"estimated_read_time" integer DEFAULT 2,
	"view_count" integer DEFAULT 0 NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"not_helpful_count" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"related_article_ids" jsonb DEFAULT '[]'::jsonb,
	"meta_title" varchar(100),
	"meta_description" text,
	"author_id" varchar,
	"last_updated_by" varchar,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "help_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "help_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"color" varchar(20),
	"parent_id" varchar,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"article_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "help_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "help_faqs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"not_helpful_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"article_id" varchar,
	"faq_id" varchar,
	"is_helpful" boolean NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "help_search_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"query" text NOT NULL,
	"results_count" integer DEFAULT 0 NOT NULL,
	"clicked_article_id" varchar,
	"session_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hood_activity_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"za_location_id" varchar NOT NULL,
	"day_of_week" integer NOT NULL,
	"hour_of_day" integer NOT NULL,
	"avg_posts" real DEFAULT 0 NOT NULL,
	"avg_engagement" real DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hood_activity_stats_unique" UNIQUE("za_location_id","day_of_week","hour_of_day")
);
--> statement-breakpoint
CREATE TABLE "hood_rivalries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hood_1_id" varchar NOT NULL,
	"hood_2_id" varchar NOT NULL,
	"hood_1_name" varchar(100) NOT NULL,
	"hood_2_name" varchar(100) NOT NULL,
	"hood_1_score" integer DEFAULT 0 NOT NULL,
	"hood_2_score" integer DEFAULT 0 NOT NULL,
	"week_start" timestamp NOT NULL,
	"week_end" timestamp NOT NULL,
	"winner_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "known_issues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"affected_platforms" jsonb DEFAULT '[]'::jsonb,
	"workaround" text,
	"priority" "ticket_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(20) DEFAULT 'INVESTIGATING' NOT NULL,
	"fixed_in_version" varchar(20),
	"report_count" integer DEFAULT 1 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"reported_at" timestamp DEFAULT now() NOT NULL,
	"fixed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mall_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"item_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"review" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mall_reviews_unique" UNIQUE("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "mall_wishlists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"item_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mall_wishlists_unique" UNIQUE("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "notification_defaults" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"default_enabled" boolean DEFAULT true NOT NULL,
	"can_user_disable" boolean DEFAULT true NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_defaults_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "platform_battles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"creator_id" varchar NOT NULL,
	"status" "battle_status" DEFAULT 'PENDING' NOT NULL,
	"entry_fee_coins" integer DEFAULT 0 NOT NULL,
	"prize_pool_coins" integer DEFAULT 0 NOT NULL,
	"platform_fee_percent" integer DEFAULT 20 NOT NULL,
	"max_participants" integer,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"winner_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"value_type" varchar(20) DEFAULT 'string' NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"is_editable" boolean DEFAULT true NOT NULL,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "platform_revenue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "platform_revenue_source" NOT NULL,
	"amount_rands" integer NOT NULL,
	"reference_type" varchar(50),
	"reference_id" varchar,
	"user_id" varchar,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stat_date" date NOT NULL,
	"total_coins_in_circulation" bigint DEFAULT 0 NOT NULL,
	"total_coins_issued_today" integer DEFAULT 0 NOT NULL,
	"total_coins_burned_today" integer DEFAULT 0 NOT NULL,
	"daily_active_wallets" integer DEFAULT 0 NOT NULL,
	"total_revenue_today" integer DEFAULT 0 NOT NULL,
	"total_withdrawals_today" integer DEFAULT 0 NOT NULL,
	"total_gifts_sent" integer DEFAULT 0 NOT NULL,
	"total_mall_purchases" integer DEFAULT 0 NOT NULL,
	"average_wallet_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "platform_stats_stat_date_unique" UNIQUE("stat_date")
);
--> statement-breakpoint
CREATE TABLE "safety_resources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"contact_number" varchar(50),
	"contact_email" varchar(100),
	"website_url" text,
	"country" varchar(50),
	"is_emergency" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staking_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"duration_days" integer NOT NULL,
	"bonus_percent" integer NOT NULL,
	"min_coins" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_inboxes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_tickets" integer DEFAULT 0 NOT NULL,
	"open_tickets" integer DEFAULT 0 NOT NULL,
	"unread_messages" integer DEFAULT 0 NOT NULL,
	"priority_level" varchar(20) DEFAULT 'STANDARD',
	"last_activity_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_inboxes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_type" "ticket_sender_type" DEFAULT 'USER' NOT NULL,
	"content" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"attachment_urls" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" "ticket_category" NOT NULL,
	"priority" "ticket_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"assigned_to" varchar,
	"resolved_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"component" varchar(100) NOT NULL,
	"status" "system_status_type" DEFAULT 'OPERATIONAL' NOT NULL,
	"title" varchar(200),
	"description" text,
	"affected_features" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tea_spiller_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"level" "tea_spiller_level" DEFAULT 'BRONZE' NOT NULL,
	"total_posts" integer DEFAULT 0 NOT NULL,
	"total_reactions" integer DEFAULT 0 NOT NULL,
	"total_reposts" integer DEFAULT 0 NOT NULL,
	"total_replies" integer DEFAULT 0 NOT NULL,
	"accurate_count" integer DEFAULT 0 NOT NULL,
	"inaccurate_count" integer DEFAULT 0 NOT NULL,
	"accuracy_rate" real DEFAULT 0 NOT NULL,
	"cooldown_until" timestamp,
	"is_shadow_banned" boolean DEFAULT false NOT NULL,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tea_spiller_stats_device_hash_unique" UNIQUE("device_hash")
);
--> statement-breakpoint
CREATE TABLE "ticket_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"ticket_id" varchar NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" "attachment_type" NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" bigint NOT NULL,
	"file_url" text NOT NULL,
	"thumbnail_url" text,
	"public_id" varchar(200),
	"uploaded_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_internal_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" varchar NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"progress_max" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"reward_claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_bank_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"account_holder_name" varchar(200) NOT NULL,
	"branch_code" varchar(20),
	"account_type" varchar(50) DEFAULT 'savings' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_help_achievements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"achievement_id" varchar NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"coin_reward_claimed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_help_achievements_unique_idx" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_help_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"articles_read" integer DEFAULT 0 NOT NULL,
	"tutorials_completed" integer DEFAULT 0 NOT NULL,
	"questions_asked" integer DEFAULT 0 NOT NULL,
	"answers_posted" integer DEFAULT 0 NOT NULL,
	"answers_verified" integer DEFAULT 0 NOT NULL,
	"helpful_votes_received" integer DEFAULT 0 NOT NULL,
	"tickets_created" integer DEFAULT 0 NOT NULL,
	"tickets_resolved" integer DEFAULT 0 NOT NULL,
	"last_article_read_at" timestamp,
	"last_tutorial_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_help_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_kyc" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "kyc_status" DEFAULT 'NOT_STARTED' NOT NULL,
	"id_type" varchar(50),
	"id_number" varchar(50),
	"id_document_url" text,
	"selfie_url" text,
	"proof_of_address_url" text,
	"full_legal_name" varchar(200),
	"date_of_birth" date,
	"nationality" varchar(100),
	"address" text,
	"rejection_reason" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"submitted_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_kyc_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_wealth_club" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"club_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_wealth_club_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "wealth_clubs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tier" "wealth_club_tier" NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"min_net_worth" bigint NOT NULL,
	"max_net_worth" bigint,
	"badge_icon_url" text,
	"perks" text,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"bonus_coin_percent" integer DEFAULT 0 NOT NULL,
	"priority_support" boolean DEFAULT false NOT NULL,
	"exclusive_content" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wealth_clubs_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"bank_account_id" varchar NOT NULL,
	"amount_coins" integer NOT NULL,
	"platform_fee_coins" integer NOT NULL,
	"net_amount_coins" integer NOT NULL,
	"amount_rands" integer NOT NULL,
	"status" "withdrawal_status" DEFAULT 'PENDING' NOT NULL,
	"payment_reference" varchar(255),
	"rejection_reason" text,
	"admin_notes" text,
	"processed_by" varchar,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "word_filters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"action" "word_filter_action" DEFAULT 'BLOCK' NOT NULL,
	"replacement" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "word_filters_word_unique" UNIQUE("word")
);
--> statement-breakpoint
CREATE TABLE "ad_disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar NOT NULL,
	"campaign_id" varchar,
	"dispute_type" "ad_dispute_type" NOT NULL,
	"status" "ad_dispute_status" DEFAULT 'PENDING' NOT NULL,
	"subject" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"requested_refund_amount" bigint,
	"approved_refund_amount" bigint,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"admin_response" text,
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "post_type" varchar(20) DEFAULT 'REGULAR';--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "is_insider" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "has_update" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "repost_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "save_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "follow_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "accuracy_true_votes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "accuracy_false_votes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "accuracy_unsure_votes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "is_verified_tea" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "is_breaking" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "trending_score" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "anon_gossip_posts" ADD COLUMN "velocity_score" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "gift_types" ADD COLUMN "net_worth_value" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mall_items" ADD COLUMN "coin_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "encrypted_content" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "encrypted_key" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "iv" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "status" "message_status" DEFAULT 'SENT';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "file_mime_type" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "voice_waveform" jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "link_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "link_title" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "link_description" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "link_image" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "link_domain" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "shared_post_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "encryption_public_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "encryption_key_created_at" timestamp;--> statement-breakpoint
ALTER TABLE "wallets" ADD COLUMN "is_frozen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD COLUMN "success" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "ads" ADD COLUMN "ad_number" varchar(12);--> statement-breakpoint
ALTER TABLE "admin_keyword_filters" ADD CONSTRAINT "admin_keyword_filters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_access_tokens" ADD CONSTRAINT "api_access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_alert_history" ADD CONSTRAINT "api_usage_alert_history_alert_id_api_usage_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."api_usage_alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_battle_id_platform_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."platform_battles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_participants" ADD CONSTRAINT "battle_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canned_responses" ADD CONSTRAINT "canned_responses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_purchases" ADD CONSTRAINT "coin_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_purchases" ADD CONSTRAINT "coin_purchases_bundle_id_coin_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."coin_bundles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answer_votes" ADD CONSTRAINT "community_answer_votes_answer_id_community_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."community_answers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answer_votes" ADD CONSTRAINT "community_answer_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answers" ADD CONSTRAINT "community_answers_question_id_community_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."community_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answers" ADD CONSTRAINT "community_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_answers" ADD CONSTRAINT "community_answers_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_questions" ADD CONSTRAINT "community_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_questions" ADD CONSTRAINT "community_questions_category_id_help_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."help_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_settings" ADD CONSTRAINT "conversation_settings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_settings" ADD CONSTRAINT "conversation_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_earnings" ADD CONSTRAINT "creator_earnings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_rewards" ADD CONSTRAINT "daily_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "earnings_history" ADD CONSTRAINT "earnings_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "economy_config" ADD CONSTRAINT "economy_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request_votes" ADD CONSTRAINT "feature_request_votes_request_id_feature_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."feature_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_request_votes" ADD CONSTRAINT "feature_request_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_requests" ADD CONSTRAINT "feature_requests_admin_responded_by_users_id_fk" FOREIGN KEY ("admin_responded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_stakes" ADD CONSTRAINT "gift_stakes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_stakes" ADD CONSTRAINT "gift_stakes_gift_transaction_id_gift_transactions_id_fk" FOREIGN KEY ("gift_transaction_id") REFERENCES "public"."gift_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_accuracy_votes" ADD CONSTRAINT "gossip_accuracy_votes_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_aliases" ADD CONSTRAINT "gossip_aliases_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_awards" ADD CONSTRAINT "gossip_awards_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_dm_conversations" ADD CONSTRAINT "gossip_dm_conversations_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_dm_messages" ADD CONSTRAINT "gossip_dm_messages_conversation_id_gossip_dm_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."gossip_dm_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_poll_votes" ADD CONSTRAINT "gossip_poll_votes_poll_id_gossip_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."gossip_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_polls" ADD CONSTRAINT "gossip_polls_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_post_follows" ADD CONSTRAINT "gossip_post_follows_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_post_hashtags" ADD CONSTRAINT "gossip_post_hashtags_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_post_hashtags" ADD CONSTRAINT "gossip_post_hashtags_hashtag_id_gossip_hashtags_id_fk" FOREIGN KEY ("hashtag_id") REFERENCES "public"."gossip_hashtags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_post_links" ADD CONSTRAINT "gossip_post_links_original_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("original_post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_post_links" ADD CONSTRAINT "gossip_post_links_linked_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("linked_post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_post_views" ADD CONSTRAINT "gossip_post_views_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_reposts" ADD CONSTRAINT "gossip_reposts_original_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("original_post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_saves" ADD CONSTRAINT "gossip_saves_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_trending_hashtags" ADD CONSTRAINT "gossip_trending_hashtags_hashtag_id_gossip_hashtags_id_fk" FOREIGN KEY ("hashtag_id") REFERENCES "public"."gossip_hashtags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_article_steps" ADD CONSTRAINT "help_article_steps_article_id_help_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."help_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_category_id_help_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."help_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_faqs" ADD CONSTRAINT "help_faqs_category_id_help_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."help_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_feedback" ADD CONSTRAINT "help_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_feedback" ADD CONSTRAINT "help_feedback_article_id_help_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."help_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_feedback" ADD CONSTRAINT "help_feedback_faq_id_help_faqs_id_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."help_faqs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_search_history" ADD CONSTRAINT "help_search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_search_history" ADD CONSTRAINT "help_search_history_clicked_article_id_help_articles_id_fk" FOREIGN KEY ("clicked_article_id") REFERENCES "public"."help_articles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mall_reviews" ADD CONSTRAINT "mall_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mall_reviews" ADD CONSTRAINT "mall_reviews_item_id_mall_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."mall_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mall_wishlists" ADD CONSTRAINT "mall_wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mall_wishlists" ADD CONSTRAINT "mall_wishlists_item_id_mall_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."mall_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_defaults" ADD CONSTRAINT "notification_defaults_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_battles" ADD CONSTRAINT "platform_battles_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_battles" ADD CONSTRAINT "platform_battles_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config" ADD CONSTRAINT "platform_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_revenue" ADD CONSTRAINT "platform_revenue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_inboxes" ADD CONSTRAINT "support_inboxes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_status" ADD CONSTRAINT "system_status_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_message_id_support_ticket_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."support_ticket_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_internal_notes" ADD CONSTRAINT "ticket_internal_notes_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_internal_notes" ADD CONSTRAINT "ticket_internal_notes_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bank_accounts" ADD CONSTRAINT "user_bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_help_achievements" ADD CONSTRAINT "user_help_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_help_achievements" ADD CONSTRAINT "user_help_achievements_achievement_id_help_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."help_achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_help_progress" ADD CONSTRAINT "user_help_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_kyc" ADD CONSTRAINT "user_kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_kyc" ADD CONSTRAINT "user_kyc_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wealth_club" ADD CONSTRAINT "user_wealth_club_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wealth_club" ADD CONSTRAINT "user_wealth_club_club_id_wealth_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."wealth_clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_bank_account_id_user_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."user_bank_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_filters" ADD CONSTRAINT "word_filters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_category_idx" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "achievements_active_idx" ON "achievements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "admin_keyword_filters_keyword_idx" ON "admin_keyword_filters" USING btree ("keyword");--> statement-breakpoint
CREATE INDEX "admin_keyword_filters_active_idx" ON "admin_keyword_filters" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "api_tokens_user_idx" ON "api_access_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_tokens_token_idx" ON "api_access_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "api_tokens_revoked_idx" ON "api_access_tokens" USING btree ("is_revoked");--> statement-breakpoint
CREATE INDEX "app_changelog_version_idx" ON "app_changelog" USING btree ("version");--> statement-breakpoint
CREATE INDEX "app_changelog_published_idx" ON "app_changelog" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "appeals_user_idx" ON "appeals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appeals_status_idx" ON "appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appeals_type_idx" ON "appeals" USING btree ("type");--> statement-breakpoint
CREATE INDEX "battle_participants_battle_idx" ON "battle_participants" USING btree ("battle_id");--> statement-breakpoint
CREATE INDEX "battle_participants_user_idx" ON "battle_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "canned_responses_category_idx" ON "canned_responses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "coin_bundles_active_idx" ON "coin_bundles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coin_bundles_sort_idx" ON "coin_bundles" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "coin_purchases_user_idx" ON "coin_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coin_purchases_status_idx" ON "coin_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "coin_purchases_reference_idx" ON "coin_purchases" USING btree ("payment_reference");--> statement-breakpoint
CREATE INDEX "community_answer_votes_answer_idx" ON "community_answer_votes" USING btree ("answer_id");--> statement-breakpoint
CREATE INDEX "community_answers_question_idx" ON "community_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "community_answers_user_idx" ON "community_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_questions_user_idx" ON "community_questions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_questions_category_idx" ON "community_questions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "community_questions_solved_idx" ON "community_questions" USING btree ("is_solved");--> statement-breakpoint
CREATE INDEX "conversation_settings_user_idx" ON "conversation_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creator_earnings_user_idx" ON "creator_earnings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_rewards_user_idx" ON "daily_rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "earnings_history_user_idx" ON "earnings_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "earnings_history_created_idx" ON "earnings_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "feature_request_votes_request_idx" ON "feature_request_votes" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "feature_requests_user_idx" ON "feature_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feature_requests_status_idx" ON "feature_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gift_stakes_user_idx" ON "gift_stakes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gift_stakes_status_idx" ON "gift_stakes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gift_stakes_matures_idx" ON "gift_stakes" USING btree ("matures_at");--> statement-breakpoint
CREATE INDEX "gossip_accuracy_votes_post_idx" ON "gossip_accuracy_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_accuracy_votes_vote_idx" ON "gossip_accuracy_votes" USING btree ("vote");--> statement-breakpoint
CREATE INDEX "gossip_aliases_alias_idx" ON "gossip_aliases" USING btree ("alias");--> statement-breakpoint
CREATE INDEX "gossip_awards_post_idx" ON "gossip_awards" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_awards_type_idx" ON "gossip_awards" USING btree ("award_type");--> statement-breakpoint
CREATE INDEX "gossip_awards_period_idx" ON "gossip_awards" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "gossip_awards_location_idx" ON "gossip_awards" USING btree ("za_location_id");--> statement-breakpoint
CREATE INDEX "gossip_dm_conv_p1_idx" ON "gossip_dm_conversations" USING btree ("participant_1_hash");--> statement-breakpoint
CREATE INDEX "gossip_dm_conv_p2_idx" ON "gossip_dm_conversations" USING btree ("participant_2_hash");--> statement-breakpoint
CREATE INDEX "gossip_dm_conv_post_idx" ON "gossip_dm_conversations" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_dm_msg_conv_idx" ON "gossip_dm_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "gossip_dm_msg_sender_idx" ON "gossip_dm_messages" USING btree ("sender_hash");--> statement-breakpoint
CREATE INDEX "gossip_dm_msg_created_idx" ON "gossip_dm_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gossip_hashtags_tag_idx" ON "gossip_hashtags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "gossip_hashtags_count_idx" ON "gossip_hashtags" USING btree ("use_count");--> statement-breakpoint
CREATE INDEX "gossip_local_legends_location_idx" ON "gossip_local_legends" USING btree ("za_location_id");--> statement-breakpoint
CREATE INDEX "gossip_local_legends_rank_idx" ON "gossip_local_legends" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "gossip_poll_votes_poll_idx" ON "gossip_poll_votes" USING btree ("poll_id");--> statement-breakpoint
CREATE INDEX "gossip_polls_ends_idx" ON "gossip_polls" USING btree ("ends_at");--> statement-breakpoint
CREATE INDEX "gossip_post_follows_post_idx" ON "gossip_post_follows" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_post_follows_device_idx" ON "gossip_post_follows" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "gossip_post_hashtags_post_idx" ON "gossip_post_hashtags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_post_hashtags_tag_idx" ON "gossip_post_hashtags" USING btree ("hashtag_id");--> statement-breakpoint
CREATE INDEX "gossip_post_links_original_idx" ON "gossip_post_links" USING btree ("original_post_id");--> statement-breakpoint
CREATE INDEX "gossip_post_links_linked_idx" ON "gossip_post_links" USING btree ("linked_post_id");--> statement-breakpoint
CREATE INDEX "gossip_post_views_post_idx" ON "gossip_post_views" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_post_views_time_idx" ON "gossip_post_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX "gossip_rate_limits_device_idx" ON "gossip_rate_limits" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "gossip_rate_limits_window_idx" ON "gossip_rate_limits" USING btree ("window_end");--> statement-breakpoint
CREATE INDEX "gossip_reposts_post_idx" ON "gossip_reposts" USING btree ("original_post_id");--> statement-breakpoint
CREATE INDEX "gossip_reposts_device_idx" ON "gossip_reposts" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "gossip_reposts_location_idx" ON "gossip_reposts" USING btree ("za_location_id");--> statement-breakpoint
CREATE INDEX "gossip_saves_post_idx" ON "gossip_saves" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_saves_device_idx" ON "gossip_saves" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "gossip_spill_sessions_scheduled_idx" ON "gossip_spill_sessions" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "gossip_spill_sessions_status_idx" ON "gossip_spill_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gossip_spill_sessions_location_idx" ON "gossip_spill_sessions" USING btree ("za_location_id");--> statement-breakpoint
CREATE INDEX "gossip_trending_hashtags_score_idx" ON "gossip_trending_hashtags" USING btree ("trending_score");--> statement-breakpoint
CREATE INDEX "gossip_trending_hashtags_location_idx" ON "gossip_trending_hashtags" USING btree ("za_location_id");--> statement-breakpoint
CREATE INDEX "help_achievements_active_idx" ON "help_achievements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "help_article_steps_article_idx" ON "help_article_steps" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "help_articles_category_idx" ON "help_articles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "help_articles_slug_idx" ON "help_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "help_articles_status_idx" ON "help_articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "help_categories_slug_idx" ON "help_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "help_categories_parent_idx" ON "help_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "help_categories_active_idx" ON "help_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "help_faqs_category_idx" ON "help_faqs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "help_faqs_active_idx" ON "help_faqs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "help_feedback_article_idx" ON "help_feedback" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "help_feedback_faq_idx" ON "help_feedback" USING btree ("faq_id");--> statement-breakpoint
CREATE INDEX "help_search_history_user_idx" ON "help_search_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "help_search_history_query_idx" ON "help_search_history" USING btree ("query");--> statement-breakpoint
CREATE INDEX "hood_activity_stats_location_idx" ON "hood_activity_stats" USING btree ("za_location_id");--> statement-breakpoint
CREATE INDEX "hood_rivalries_active_idx" ON "hood_rivalries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "hood_rivalries_week_idx" ON "hood_rivalries" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "known_issues_status_idx" ON "known_issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "known_issues_public_idx" ON "known_issues" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "mall_reviews_item_idx" ON "mall_reviews" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "mall_reviews_user_idx" ON "mall_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mall_wishlists_user_idx" ON "mall_wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_battles_creator_idx" ON "platform_battles" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "platform_battles_status_idx" ON "platform_battles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "platform_battles_starts_idx" ON "platform_battles" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "platform_config_category_idx" ON "platform_config" USING btree ("category");--> statement-breakpoint
CREATE INDEX "platform_revenue_source_idx" ON "platform_revenue" USING btree ("source");--> statement-breakpoint
CREATE INDEX "platform_revenue_created_idx" ON "platform_revenue" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_revenue_user_idx" ON "platform_revenue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_stats_date_idx" ON "platform_stats" USING btree ("stat_date");--> statement-breakpoint
CREATE INDEX "safety_resources_category_idx" ON "safety_resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "safety_resources_country_idx" ON "safety_resources" USING btree ("country");--> statement-breakpoint
CREATE INDEX "support_inboxes_user_idx" ON "support_inboxes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_ticket_idx" ON "support_ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_tickets_user_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_category_idx" ON "support_tickets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "support_tickets_assigned_idx" ON "support_tickets" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "system_status_component_idx" ON "system_status" USING btree ("component");--> statement-breakpoint
CREATE INDEX "system_status_status_idx" ON "system_status" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tea_spiller_stats_level_idx" ON "tea_spiller_stats" USING btree ("level");--> statement-breakpoint
CREATE INDEX "tea_spiller_stats_accuracy_idx" ON "tea_spiller_stats" USING btree ("accuracy_rate");--> statement-breakpoint
CREATE INDEX "tea_spiller_stats_cooldown_idx" ON "tea_spiller_stats" USING btree ("cooldown_until");--> statement-breakpoint
CREATE INDEX "ticket_attachments_message_idx" ON "ticket_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ticket_attachments_ticket_idx" ON "ticket_attachments" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_internal_notes_ticket_idx" ON "ticket_internal_notes" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_achievements_completed_idx" ON "user_achievements" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "user_bank_accounts_user_idx" ON "user_bank_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_help_achievements_user_idx" ON "user_help_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_help_progress_user_idx" ON "user_help_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_kyc_user_idx" ON "user_kyc" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_kyc_status_idx" ON "user_kyc" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_wealth_club_user_idx" ON "user_wealth_club" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_wealth_club_club_idx" ON "user_wealth_club" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "withdrawal_requests_user_idx" ON "withdrawal_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "withdrawal_requests_status_idx" ON "withdrawal_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "withdrawal_requests_created_idx" ON "withdrawal_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "word_filters_word_idx" ON "word_filters" USING btree ("word");--> statement-breakpoint
CREATE INDEX "word_filters_active_idx" ON "word_filters" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ad_disputes_advertiser_idx" ON "ad_disputes" USING btree ("advertiser_id");--> statement-breakpoint
CREATE INDEX "ad_disputes_campaign_idx" ON "ad_disputes" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_disputes_status_idx" ON "ad_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_post_type_idx" ON "anon_gossip_posts" USING btree ("post_type");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_trending_idx" ON "anon_gossip_posts" USING btree ("trending_score");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_verified_idx" ON "anon_gossip_posts" USING btree ("is_verified_tea");--> statement-breakpoint
CREATE INDEX "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_success_idx" ON "webhook_deliveries" USING btree ("success");--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_ad_number_unique" UNIQUE("ad_number");