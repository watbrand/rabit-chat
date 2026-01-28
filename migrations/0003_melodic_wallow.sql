CREATE TYPE "public"."anon_reaction_type" AS ENUM('FIRE', 'MINDBLOWN', 'LAUGH', 'SKULL', 'EYES');--> statement-breakpoint
CREATE TYPE "public"."anon_report_status" AS ENUM('PENDING', 'REVIEWED', 'DISMISSED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."call_status" AS ENUM('RINGING', 'ONGOING', 'ENDED', 'MISSED', 'DECLINED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."call_type" AS ENUM('AUDIO', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."coin_transaction_type" AS ENUM('PURCHASE', 'GIFT_SENT', 'GIFT_RECEIVED', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'SUBSCRIPTION_PAYMENT');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('REEL', 'VOICE', 'PHOTO', 'TEXT', 'STORY');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('REQUEST', 'ACCEPTED');--> statement-breakpoint
CREATE TYPE "public"."duet_stitch_type" AS ENUM('DUET', 'STITCH');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('IN_PERSON', 'VIRTUAL', 'HYBRID');--> statement-breakpoint
CREATE TYPE "public"."gossip_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."group_conversation_member_role" AS ENUM('ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."group_join_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."group_member_role" AS ENUM('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."group_privacy" AS ENUM('PUBLIC', 'PRIVATE', 'SECRET');--> statement-breakpoint
CREATE TYPE "public"."inbox_folder" AS ENUM('PRIMARY', 'GENERAL');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('VIEW', 'LIKE', 'SAVE', 'SHARE', 'COMMENT', 'SKIP', 'REWATCH');--> statement-breakpoint
CREATE TYPE "public"."live_stream_status" AS ENUM('PREPARING', 'LIVE', 'ENDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('TEXT', 'PHOTO', 'VIDEO', 'VOICE', 'FILE', 'GIF', 'STICKER');--> statement-breakpoint
CREATE TYPE "public"."net_worth_reason" AS ENUM('MALL_PURCHASE', 'ADMIN_ADJUST', 'GIFT', 'ACHIEVEMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."platform_import_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."post_reaction_type" AS ENUM('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'FIRE', 'DIAMOND', 'CROWN');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('GOING', 'INTERESTED', 'NOT_GOING');--> statement-breakpoint
CREATE TYPE "public"."story_font" AS ENUM('MODERN', 'SERIF', 'HANDWRITTEN', 'BOLD', 'LUXURY');--> statement-breakpoint
CREATE TYPE "public"."story_reaction_type" AS ENUM('FIRE', 'HEART', 'LAUGH', 'WOW', 'SAD', 'CLAP');--> statement-breakpoint
CREATE TYPE "public"."story_reply_setting" AS ENUM('ALL', 'FOLLOWERS', 'CLOSE_FRIENDS', 'OFF');--> statement-breakpoint
CREATE TYPE "public"."story_sticker_type" AS ENUM('POLL', 'QUESTION', 'SLIDER', 'QUIZ', 'COUNTDOWN', 'LOCATION', 'TIME', 'LINK', 'MENTION', 'HASHTAG', 'GIF', 'SHOPPING', 'TIP');--> statement-breakpoint
CREATE TYPE "public"."story_text_align" AS ENUM('LEFT', 'CENTER', 'RIGHT');--> statement-breakpoint
CREATE TYPE "public"."story_text_animation" AS ENUM('NONE', 'TYPEWRITER', 'FADE', 'BOUNCE', 'GLOW', 'SPARKLE', 'RAINBOW');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAUSED');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'USER_BANNED' BEFORE 'CONTENT_HIDDEN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'USER_UNBANNED' BEFORE 'CONTENT_HIDDEN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'SETTINGS_UPDATED' BEFORE 'USER_PROFILE_EDITED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'MENTION' BEFORE 'VERIFICATION_APPROVED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'STORY_MENTION';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'STORY_REPLY';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'STORY_REACTION';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'STORY_STICKER_RESPONSE';--> statement-breakpoint
ALTER TYPE "public"."story_type" ADD VALUE 'TEXT';--> statement-breakpoint
ALTER TYPE "public"."story_type" ADD VALUE 'VOICE';--> statement-breakpoint
CREATE TABLE "account_backups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"backup_type" varchar(50) NOT NULL,
	"download_url" text,
	"file_size" bigint,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_avatars" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(100),
	"source_image_url" text,
	"avatar_url" text NOT NULL,
	"style" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_translations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_text" text NOT NULL,
	"source_language" varchar(10),
	"target_language" varchar(10) NOT NULL,
	"translated_text" text NOT NULL,
	"content_type" varchar(50),
	"content_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anon_gossip_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"country_code" varchar(2),
	"za_location_id" varchar,
	"location_display" varchar(300),
	"type" "gossip_type" DEFAULT 'TEXT' NOT NULL,
	"content" text,
	"media_url" text,
	"thumbnail_url" text,
	"duration_ms" integer,
	"is_whisper" boolean DEFAULT false NOT NULL,
	"whisper_expires_at" timestamp,
	"tea_meter" integer DEFAULT 0 NOT NULL,
	"fire_count" integer DEFAULT 0 NOT NULL,
	"mindblown_count" integer DEFAULT 0 NOT NULL,
	"laugh_count" integer DEFAULT 0 NOT NULL,
	"skull_count" integer DEFAULT 0 NOT NULL,
	"eyes_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_removed_by_admin" boolean DEFAULT false NOT NULL,
	"removed_reason" text,
	"removed_at" timestamp,
	"removed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anon_gossip_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"reaction_type" "anon_reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "anon_gossip_reactions_unique" UNIQUE("post_id","device_hash","reaction_type")
);
--> statement-breakpoint
CREATE TABLE "anon_gossip_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"parent_reply_id" varchar,
	"device_hash" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"depth" integer DEFAULT 1 NOT NULL,
	"fire_count" integer DEFAULT 0 NOT NULL,
	"mindblown_count" integer DEFAULT 0 NOT NULL,
	"laugh_count" integer DEFAULT 0 NOT NULL,
	"skull_count" integer DEFAULT 0 NOT NULL,
	"eyes_count" integer DEFAULT 0 NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_removed_by_admin" boolean DEFAULT false NOT NULL,
	"removed_reason" text,
	"removed_at" timestamp,
	"removed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anon_gossip_reply_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reply_id" varchar NOT NULL,
	"device_hash" varchar(64) NOT NULL,
	"reaction_type" "anon_reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "anon_reply_reactions_unique" UNIQUE("reply_id","device_hash","reaction_type")
);
--> statement-breakpoint
CREATE TABLE "anon_gossip_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar,
	"reply_id" varchar,
	"device_hash" varchar(64) NOT NULL,
	"reason" text NOT NULL,
	"status" "anon_report_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_filters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"creator_id" varchar,
	"thumbnail_url" text NOT NULL,
	"filter_url" text NOT NULL,
	"category" varchar(50),
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"code" varchar(20) NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bff_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"bff_id" varchar NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"last_interaction_at" timestamp DEFAULT now() NOT NULL,
	"became_bff_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bff_status_unique" UNIQUE("user_id","bff_id")
);
--> statement-breakpoint
CREATE TABLE "broadcast_channel_subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"mute_notifications" boolean DEFAULT false NOT NULL,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "broadcast_channel_subscribers_unique" UNIQUE("channel_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "broadcast_channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"avatar_url" text,
	"subscriber_count" integer DEFAULT 0 NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcast_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_id" varchar NOT NULL,
	"content" text,
	"media_url" text,
	"media_type" varchar(20),
	"is_pinned" boolean DEFAULT false NOT NULL,
	"reactions_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_folder_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" varchar NOT NULL,
	"conversation_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_folder_conversations_unique" UNIQUE("folder_id","conversation_id")
);
--> statement-breakpoint
CREATE TABLE "chat_folders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(50) NOT NULL,
	"icon_name" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"venue_id" varchar,
	"post_id" varchar,
	"custom_location_name" text,
	"latitude" real,
	"longitude" real,
	"caption" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" varchar NOT NULL,
	"type" "coin_transaction_type" NOT NULL,
	"amount" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"description" text,
	"reference_id" varchar,
	"reference_type" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"parent_reply_id" varchar,
	"content" text NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_fatigue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" varchar NOT NULL,
	"content_type" "content_type" NOT NULL,
	"total_impressions" integer DEFAULT 0 NOT NULL,
	"total_skips" integer DEFAULT 0 NOT NULL,
	"skip_rate" real DEFAULT 0,
	"avg_watch_time_ms" integer DEFAULT 0,
	"avg_completion_rate" real DEFAULT 0,
	"last_shown_at" timestamp,
	"fatigue_score" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_fatigue_content" UNIQUE("content_id")
);
--> statement-breakpoint
CREATE TABLE "content_interactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content_id" varchar NOT NULL,
	"content_type" "content_type" NOT NULL,
	"interaction_type" "interaction_type" NOT NULL,
	"watch_time_ms" integer DEFAULT 0,
	"completion_rate" real DEFAULT 0,
	"rewatch_count" integer DEFAULT 0,
	"skipped_at_ms" integer,
	"creator_id" varchar,
	"session_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_velocity" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" varchar NOT NULL,
	"content_type" "content_type" NOT NULL,
	"hour_number" integer NOT NULL,
	"views" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"saves" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"velocity_score" real DEFAULT 0,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_velocity_content_hour" UNIQUE("content_id","hour_number")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(2) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_south_africa" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "creator_affinities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"affinity_score" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0,
	"total_likes" integer DEFAULT 0,
	"total_shares" integer DEFAULT 0,
	"total_saves" integer DEFAULT 0,
	"avg_watch_time_ms" integer DEFAULT 0,
	"avg_completion_rate" real DEFAULT 0,
	"last_interacted_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_affinities_user_creator" UNIQUE("user_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "duet_stitch_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"original_post_id" varchar NOT NULL,
	"type" "duet_stitch_type" NOT NULL,
	"stitch_start_ms" integer,
	"stitch_end_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "duet_stitch_posts_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"email" text NOT NULL,
	"token" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "rsvp_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_rsvps_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" varchar NOT NULL,
	"group_id" varchar,
	"title" varchar(200) NOT NULL,
	"description" text,
	"cover_url" text,
	"event_type" "event_type" DEFAULT 'IN_PERSON' NOT NULL,
	"status" "event_status" DEFAULT 'DRAFT' NOT NULL,
	"location_name" text,
	"location_address" text,
	"location_lat" real,
	"location_lng" real,
	"virtual_link" text,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"timezone" varchar(50),
	"max_attendees" integer,
	"going_count" integer DEFAULT 0 NOT NULL,
	"interested_count" integer DEFAULT 0 NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"require_approval" boolean DEFAULT false NOT NULL,
	"ticket_price" integer,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "explore_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon_name" varchar(50),
	"cover_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "explore_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"rollout_percentage" integer DEFAULT 100,
	"allowed_user_ids" jsonb DEFAULT '[]'::jsonb,
	"blocked_user_ids" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "focus_mode_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"daily_limit_minutes" integer,
	"break_reminder_minutes" integer,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"hide_notification_counts" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "focus_mode_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "gift_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"gift_type_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_coins" integer NOT NULL,
	"context_type" varchar(50),
	"context_id" varchar,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon_url" text NOT NULL,
	"animation_url" text,
	"coin_cost" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"category" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gossip_blocked_words" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" varchar(100) NOT NULL,
	"is_regex" boolean DEFAULT false NOT NULL,
	"severity" integer DEFAULT 1 NOT NULL,
	"added_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_blocked_words_word_unique" UNIQUE("word")
);
--> statement-breakpoint
CREATE TABLE "gossip_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gossip_post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gossip_engagement_velocity" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"hour_number" integer NOT NULL,
	"reactions" integer DEFAULT 0 NOT NULL,
	"replies" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"velocity_score" real DEFAULT 0 NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_velocity_post_hour" UNIQUE("post_id","hour_number")
);
--> statement-breakpoint
CREATE TABLE "gossip_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gossip_post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_likes_user_post_unique" UNIQUE("user_id","gossip_post_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_location_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_type" varchar(20) NOT NULL,
	"location_id" varchar(300) NOT NULL,
	"location_display" varchar(300) NOT NULL,
	"total_posts" integer DEFAULT 0 NOT NULL,
	"posts_today" integer DEFAULT 0 NOT NULL,
	"posts_this_week" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"last_post_at" timestamp,
	"milestone_reached" integer DEFAULT 0 NOT NULL,
	"trending_score" real DEFAULT 0 NOT NULL,
	"last_calculated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_location_stats_unique" UNIQUE("location_type","location_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_user_id" varchar NOT NULL,
	"type" "gossip_type" NOT NULL,
	"text" text,
	"media_url" text,
	"thumbnail_url" text,
	"duration_ms" integer,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"retweet_count" integer DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gossip_retweets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_gossip_post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_retweets_user_post_unique" UNIQUE("user_id","original_gossip_post_id")
);
--> statement-breakpoint
CREATE TABLE "gossip_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gossip_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "group_conversation_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "group_conversation_member_role" DEFAULT 'MEMBER' NOT NULL,
	"nickname" varchar(50),
	"mute_until" timestamp,
	"last_read_at" timestamp,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_conversation_members_unique" UNIQUE("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "group_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100),
	"avatar_url" text,
	"creator_id" varchar NOT NULL,
	"member_count" integer DEFAULT 1 NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_join_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text,
	"status" "group_join_request_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_join_requests_unique" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" "group_member_role" DEFAULT 'MEMBER' NOT NULL,
	"invited_by_id" varchar,
	"mute_notifications" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_unique" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "group_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text,
	"message_type" "message_type" DEFAULT 'TEXT',
	"media_url" text,
	"media_thumbnail" text,
	"media_duration" integer,
	"file_name" text,
	"file_size" integer,
	"reply_to_id" varchar,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"post_id" varchar NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"pinned_by_id" varchar,
	"pinned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_posts_unique" UNIQUE("group_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"cover_url" text,
	"icon_url" text,
	"privacy" "group_privacy" DEFAULT 'PUBLIC' NOT NULL,
	"owner_id" varchar NOT NULL,
	"member_count" integer DEFAULT 1 NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"rules" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"require_approval" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"net_worth_requirement" bigint,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hashtags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag" varchar(100) NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"weekly_post_count" integer DEFAULT 0 NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hashtags_tag_unique" UNIQUE("tag")
);
--> statement-breakpoint
CREATE TABLE "hidden_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hidden_posts_user_post_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "hidden_words" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"word" varchar(100) NOT NULL,
	"filter_in_comments" boolean DEFAULT true NOT NULL,
	"filter_in_messages" boolean DEFAULT true NOT NULL,
	"filter_in_story_replies" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hidden_words_unique" UNIQUE("user_id","word")
);
--> statement-breakpoint
CREATE TABLE "linked_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_user_id" varchar NOT NULL,
	"linked_user_id" varchar NOT NULL,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "linked_accounts_unique" UNIQUE("primary_user_id","linked_user_id")
);
--> statement-breakpoint
CREATE TABLE "live_stream_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_stream_gifts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" varchar NOT NULL,
	"gift_transaction_id" varchar NOT NULL,
	"displayed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_stream_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_stream_viewers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp,
	"watch_time_seconds" integer DEFAULT 0,
	CONSTRAINT "live_stream_viewers_unique" UNIQUE("stream_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "live_streams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" varchar NOT NULL,
	"co_host_id" varchar,
	"title" varchar(200),
	"description" text,
	"thumbnail_url" text,
	"status" "live_stream_status" DEFAULT 'PREPARING' NOT NULL,
	"stream_key" varchar(100),
	"viewer_count" integer DEFAULT 0 NOT NULL,
	"peak_viewer_count" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_gifts_received" integer DEFAULT 0 NOT NULL,
	"total_coins_received" bigint DEFAULT 0 NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"shares_count" integer DEFAULT 0 NOT NULL,
	"is_recorded" boolean DEFAULT false NOT NULL,
	"recording_url" text,
	"saved_to_profile" boolean DEFAULT false NOT NULL,
	"duration_seconds" integer DEFAULT 0,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_sharing_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ghost_mode" boolean DEFAULT false NOT NULL,
	"share_with_followers" boolean DEFAULT true NOT NULL,
	"share_with_close_friends" boolean DEFAULT true NOT NULL,
	"show_last_seen" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "location_sharing_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "mall_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mall_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "mall_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"value" integer NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mall_purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"item_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"net_worth_gained" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_reactions_unique" UNIQUE("message_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "net_worth_ledger" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"delta" bigint NOT NULL,
	"reason" "net_worth_reason" NOT NULL,
	"ref_type" varchar(50),
	"ref_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "not_interested" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" varchar NOT NULL,
	"reason" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "not_interested_user_target" UNIQUE("user_id","target_type","target_id")
);
--> statement-breakpoint
CREATE TABLE "not_interested_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "not_interested_user_post_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"digest_mode" boolean DEFAULT false NOT NULL,
	"digest_frequency" varchar(20) DEFAULT 'DAILY',
	"prioritize_close_friends" boolean DEFAULT true NOT NULL,
	"mute_low_engagement" boolean DEFAULT false NOT NULL,
	"smart_bundling" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phone_verification_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"phone_number" text NOT NULL,
	"token" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"message_id" varchar NOT NULL,
	"pinned_by_id" varchar NOT NULL,
	"pinned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pinned_messages_unique" UNIQUE("conversation_id","message_id")
);
--> statement-breakpoint
CREATE TABLE "platform_imports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"platform" varchar(50) NOT NULL,
	"status" "platform_import_status" DEFAULT 'PENDING' NOT NULL,
	"imported_followers" integer DEFAULT 0,
	"imported_posts" integer DEFAULT 0,
	"error_message" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"poke_type" varchar(20) DEFAULT 'WAVE' NOT NULL,
	"seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_hashtags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"hashtag_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_hashtags_unique" UNIQUE("post_id","hashtag_id")
);
--> statement-breakpoint
CREATE TABLE "post_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" "post_reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_reactions_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_threads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" varchar NOT NULL,
	"title" varchar(200),
	"post_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"device_id" text,
	"platform" varchar(20),
	"device_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_tokens_token" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "saved_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_posts_user_post_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "scheduled_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"content" text NOT NULL,
	"message_type" "message_type" DEFAULT 'TEXT',
	"media_url" text,
	"scheduled_for" timestamp NOT NULL,
	"sent_at" timestamp,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_checkups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"checkup_date" timestamp DEFAULT now() NOT NULL,
	"password_strength" varchar(20),
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"recovery_email_set" boolean DEFAULT false NOT NULL,
	"login_alerts_enabled" boolean DEFAULT false NOT NULL,
	"suspicious_activity_found" boolean DEFAULT false NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "seen_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content_id" varchar NOT NULL,
	"content_type" "content_type" NOT NULL,
	"session_id" varchar,
	"seen_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "seen_content_user_content" UNIQUE("user_id","content_id")
);
--> statement-breakpoint
CREATE TABLE "seen_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"profile_id" varchar NOT NULL,
	"session_id" varchar,
	"seen_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "seen_profiles_user_profile" UNIQUE("user_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "story_countdown_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sticker_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_countdown_subscription_unique" UNIQUE("sticker_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "story_drafts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "story_type" NOT NULL,
	"media_url" text,
	"thumbnail_url" text,
	"text_content" text,
	"background_color" text,
	"is_gradient" boolean DEFAULT false,
	"gradient_colors" jsonb,
	"font_family" "story_font" DEFAULT 'MODERN',
	"text_alignment" "story_text_align" DEFAULT 'CENTER',
	"text_animation" "story_text_animation" DEFAULT 'NONE',
	"font_size" integer DEFAULT 24,
	"audio_url" text,
	"audio_duration" integer,
	"music_url" text,
	"music_title" text,
	"music_artist" text,
	"filter_name" text,
	"text_overlays" jsonb,
	"drawings" jsonb,
	"stickers" jsonb,
	"is_close_friends" boolean DEFAULT false,
	"reply_setting" "story_reply_setting" DEFAULT 'ALL',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"viewer_id" varchar NOT NULL,
	"view_duration" integer,
	"tapped_forward" boolean DEFAULT false,
	"tapped_back" boolean DEFAULT false,
	"exited" boolean DEFAULT false,
	"shared" boolean DEFAULT false,
	"profile_visited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_insights_unique" UNIQUE("story_id","viewer_id")
);
--> statement-breakpoint
CREATE TABLE "story_music_library" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"album" text,
	"genre" text,
	"duration" integer NOT NULL,
	"preview_url" text NOT NULL,
	"full_url" text,
	"cover_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"reaction_type" "story_reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_reaction_unique" UNIQUE("story_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "story_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text,
	"media_url" text,
	"media_type" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_sticker_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sticker_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"response_type" text NOT NULL,
	"response_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_sticker_response_unique" UNIQUE("sticker_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "story_stickers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"type" "story_sticker_type" NOT NULL,
	"position_x" real DEFAULT 0.5 NOT NULL,
	"position_y" real DEFAULT 0.5 NOT NULL,
	"scale" real DEFAULT 1 NOT NULL,
	"rotation" real DEFAULT 0 NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_streaks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_story_at" timestamp,
	"streak_started_at" timestamp,
	"milestone_7_claimed" boolean DEFAULT false,
	"milestone_30_claimed" boolean DEFAULT false,
	"milestone_100_claimed" boolean DEFAULT false,
	"milestone_365_claimed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_streaks_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "story_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"thumbnail_url" text,
	"background_color" text,
	"is_gradient" boolean DEFAULT false,
	"gradient_colors" jsonb,
	"font_family" "story_font" DEFAULT 'MODERN',
	"text_alignment" "story_text_align" DEFAULT 'CENTER',
	"text_animation" "story_text_animation" DEFAULT 'NONE',
	"font_size" integer DEFAULT 24,
	"filter_name" text,
	"sticker_presets" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_tips" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_tiers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"monthly_price_coins" integer NOT NULL,
	"yearly_price_coins" integer,
	"benefits" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"subscriber_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"tier_id" varchar NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"is_yearly" boolean DEFAULT false NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_unique" UNIQUE("subscriber_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "thread_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" varchar NOT NULL,
	"post_id" varchar NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "thread_posts_unique" UNIQUE("thread_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "totp_secrets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"secret" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "totp_secrets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "trends_daily" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar(200) NOT NULL,
	"score" real NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "typing_indicators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"is_typing" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "typing_indicators_unique" UNIQUE("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "usage_stats" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" timestamp NOT NULL,
	"screen_time_minutes" integer DEFAULT 0 NOT NULL,
	"sessions_count" integer DEFAULT 0 NOT NULL,
	"posts_viewed" integer DEFAULT 0 NOT NULL,
	"stories_viewed" integer DEFAULT 0 NOT NULL,
	"messages_sent" integer DEFAULT 0 NOT NULL,
	"notifications_received" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_stats_user_date" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "user_interest_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reel_preference" integer DEFAULT 50 NOT NULL,
	"voice_preference" integer DEFAULT 50 NOT NULL,
	"photo_preference" integer DEFAULT 50 NOT NULL,
	"text_preference" integer DEFAULT 50 NOT NULL,
	"avg_watch_time_ms" integer DEFAULT 0,
	"avg_completion_rate" real DEFAULT 0,
	"total_interactions" integer DEFAULT 0,
	"preferred_hours" jsonb DEFAULT '[]',
	"topic_scores" jsonb DEFAULT '{}',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_interest_profiles_user" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"accuracy" real,
	"location_name" text,
	"is_sharing" boolean DEFAULT false NOT NULL,
	"sharing_mode" varchar(20) DEFAULT 'FRIENDS',
	"expires_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_locations_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_online_status" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vanish_mode_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"enabled_by_id" varchar,
	"enabled_at" timestamp,
	"disabled_at" timestamp,
	CONSTRAINT "vanish_mode_settings_conv" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" varchar(100),
	"address" text,
	"city" varchar(100),
	"country" varchar(100),
	"latitude" real,
	"longitude" real,
	"photo_url" text,
	"check_in_count" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_calls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caller_id" varchar NOT NULL,
	"callee_id" varchar NOT NULL,
	"call_type" "call_type" DEFAULT 'VIDEO' NOT NULL,
	"status" "call_status" DEFAULT 'RINGING' NOT NULL,
	"room_id" varchar(100),
	"duration_seconds" integer,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"coin_balance" bigint DEFAULT 0 NOT NULL,
	"lifetime_earned" bigint DEFAULT 0 NOT NULL,
	"lifetime_spent" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_id" varchar NOT NULL,
	"event" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"response_status" integer,
	"response_body" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(100) NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "za_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"province" varchar(100) NOT NULL,
	"city" varchar(100),
	"kasi" varchar(100),
	"full_path" varchar(300) NOT NULL,
	"level" integer NOT NULL,
	"parent_id" varchar,
	"population" integer,
	"latitude" real,
	"longitude" real,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "media_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "net_worth" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "status" text DEFAULT 'ACCEPTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "inbox_folder" text DEFAULT 'PRIMARY' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "requested_by_user_id" varchar;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_type" "message_type" DEFAULT 'TEXT';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_thumbnail" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_duration" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "file_name" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reply_to_id" varchar;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_for_sender" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_for_receiver" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "pinned_at" timestamp;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "text_content" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "background_color" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "is_gradient" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "gradient_colors" jsonb;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "font_family" "story_font" DEFAULT 'MODERN';--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "text_alignment" "story_text_align" DEFAULT 'CENTER';--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "text_animation" "story_text_animation" DEFAULT 'NONE';--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "text_background_pill" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "font_size" integer DEFAULT 24;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "audio_url" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "audio_duration" integer;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "audio_transcript" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "music_url" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "music_title" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "music_artist" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "music_start_time" integer;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "music_duration" integer;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "filter_name" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "text_overlays" jsonb;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "drawings" jsonb;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "is_close_friends" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "reply_setting" "story_reply_setting" DEFAULT 'ALL';--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "scheduled_at" timestamp;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "location_name" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "location_lat" real;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "location_lng" real;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "reshared_from_id" varchar;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "reshare_comment" text;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "reactions_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "replies_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "shares_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "taps_forward_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "taps_back_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "exits_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_notifications_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "account_backups" ADD CONSTRAINT "account_backups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_avatars" ADD CONSTRAINT "ai_avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anon_gossip_reactions" ADD CONSTRAINT "anon_gossip_reactions_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anon_gossip_replies" ADD CONSTRAINT "anon_gossip_replies_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anon_gossip_reply_reactions" ADD CONSTRAINT "anon_gossip_reply_reactions_reply_id_anon_gossip_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."anon_gossip_replies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anon_gossip_reports" ADD CONSTRAINT "anon_gossip_reports_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anon_gossip_reports" ADD CONSTRAINT "anon_gossip_reports_reply_id_anon_gossip_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."anon_gossip_replies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ar_filters" ADD CONSTRAINT "ar_filters_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_codes" ADD CONSTRAINT "backup_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bff_status" ADD CONSTRAINT "bff_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bff_status" ADD CONSTRAINT "bff_status_bff_id_users_id_fk" FOREIGN KEY ("bff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_channel_subscribers" ADD CONSTRAINT "broadcast_channel_subscribers_channel_id_broadcast_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."broadcast_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_channel_subscribers" ADD CONSTRAINT "broadcast_channel_subscribers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_channels" ADD CONSTRAINT "broadcast_channels_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcast_messages" ADD CONSTRAINT "broadcast_messages_channel_id_broadcast_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."broadcast_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_folder_conversations" ADD CONSTRAINT "chat_folder_conversations_folder_id_chat_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."chat_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_folder_conversations" ADD CONSTRAINT "chat_folder_conversations_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_folders" ADD CONSTRAINT "chat_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_replies" ADD CONSTRAINT "comment_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_interactions" ADD CONSTRAINT "content_interactions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_affinities" ADD CONSTRAINT "creator_affinities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_affinities" ADD CONSTRAINT "creator_affinities_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duet_stitch_posts" ADD CONSTRAINT "duet_stitch_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duet_stitch_posts" ADD CONSTRAINT "duet_stitch_posts_original_post_id_posts_id_fk" FOREIGN KEY ("original_post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "focus_mode_settings" ADD CONSTRAINT "focus_mode_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_transactions" ADD CONSTRAINT "gift_transactions_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_transactions" ADD CONSTRAINT "gift_transactions_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_transactions" ADD CONSTRAINT "gift_transactions_gift_type_id_gift_types_id_fk" FOREIGN KEY ("gift_type_id") REFERENCES "public"."gift_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_comments" ADD CONSTRAINT "gossip_comments_gossip_post_id_gossip_posts_id_fk" FOREIGN KEY ("gossip_post_id") REFERENCES "public"."gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_comments" ADD CONSTRAINT "gossip_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_engagement_velocity" ADD CONSTRAINT "gossip_engagement_velocity_post_id_anon_gossip_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."anon_gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_likes" ADD CONSTRAINT "gossip_likes_gossip_post_id_gossip_posts_id_fk" FOREIGN KEY ("gossip_post_id") REFERENCES "public"."gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_likes" ADD CONSTRAINT "gossip_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_posts" ADD CONSTRAINT "gossip_posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_retweets" ADD CONSTRAINT "gossip_retweets_original_gossip_post_id_gossip_posts_id_fk" FOREIGN KEY ("original_gossip_post_id") REFERENCES "public"."gossip_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gossip_retweets" ADD CONSTRAINT "gossip_retweets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_conversation_members" ADD CONSTRAINT "group_conversation_members_conversation_id_group_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."group_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_conversation_members" ADD CONSTRAINT "group_conversation_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_conversations" ADD CONSTRAINT "group_conversations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_conversation_id_group_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."group_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_pinned_by_id_users_id_fk" FOREIGN KEY ("pinned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_posts" ADD CONSTRAINT "hidden_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_posts" ADD CONSTRAINT "hidden_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_words" ADD CONSTRAINT "hidden_words_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_primary_user_id_users_id_fk" FOREIGN KEY ("primary_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_linked_user_id_users_id_fk" FOREIGN KEY ("linked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_comments" ADD CONSTRAINT "live_stream_comments_stream_id_live_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."live_streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_comments" ADD CONSTRAINT "live_stream_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_gifts" ADD CONSTRAINT "live_stream_gifts_stream_id_live_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."live_streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_gifts" ADD CONSTRAINT "live_stream_gifts_gift_transaction_id_gift_transactions_id_fk" FOREIGN KEY ("gift_transaction_id") REFERENCES "public"."gift_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_reactions" ADD CONSTRAINT "live_stream_reactions_stream_id_live_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."live_streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_reactions" ADD CONSTRAINT "live_stream_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_viewers" ADD CONSTRAINT "live_stream_viewers_stream_id_live_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."live_streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_stream_viewers" ADD CONSTRAINT "live_stream_viewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_co_host_id_users_id_fk" FOREIGN KEY ("co_host_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_sharing_settings" ADD CONSTRAINT "location_sharing_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mall_items" ADD CONSTRAINT "mall_items_category_id_mall_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."mall_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mall_purchases" ADD CONSTRAINT "mall_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mall_purchases" ADD CONSTRAINT "mall_purchases_item_id_mall_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."mall_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net_worth_ledger" ADD CONSTRAINT "net_worth_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "not_interested" ADD CONSTRAINT "not_interested_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "not_interested_posts" ADD CONSTRAINT "not_interested_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "not_interested_posts" ADD CONSTRAINT "not_interested_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_verification_tokens" ADD CONSTRAINT "phone_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_pinned_by_id_users_id_fk" FOREIGN KEY ("pinned_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_imports" ADD CONSTRAINT "platform_imports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokes" ADD CONSTRAINT "pokes_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokes" ADD CONSTRAINT "pokes_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_hashtag_id_hashtags_id_fk" FOREIGN KEY ("hashtag_id") REFERENCES "public"."hashtags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_threads" ADD CONSTRAINT "post_threads_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_checkups" ADD CONSTRAINT "security_checkups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seen_content" ADD CONSTRAINT "seen_content_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seen_profiles" ADD CONSTRAINT "seen_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seen_profiles" ADD CONSTRAINT "seen_profiles_profile_id_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_countdown_subscriptions" ADD CONSTRAINT "story_countdown_subscriptions_sticker_id_story_stickers_id_fk" FOREIGN KEY ("sticker_id") REFERENCES "public"."story_stickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_countdown_subscriptions" ADD CONSTRAINT "story_countdown_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_drafts" ADD CONSTRAINT "story_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_insights" ADD CONSTRAINT "story_insights_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_insights" ADD CONSTRAINT "story_insights_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_reactions" ADD CONSTRAINT "story_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_replies" ADD CONSTRAINT "story_replies_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_replies" ADD CONSTRAINT "story_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_sticker_responses" ADD CONSTRAINT "story_sticker_responses_sticker_id_story_stickers_id_fk" FOREIGN KEY ("sticker_id") REFERENCES "public"."story_stickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_sticker_responses" ADD CONSTRAINT "story_sticker_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_stickers" ADD CONSTRAINT "story_stickers_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_streaks" ADD CONSTRAINT "story_streaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tips" ADD CONSTRAINT "story_tips_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tips" ADD CONSTRAINT "story_tips_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tips" ADD CONSTRAINT "story_tips_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_tiers" ADD CONSTRAINT "subscription_tiers_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriber_id_users_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_subscription_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."subscription_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_posts" ADD CONSTRAINT "thread_posts_thread_id_post_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."post_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_posts" ADD CONSTRAINT "thread_posts_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "totp_secrets" ADD CONSTRAINT "totp_secrets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "typing_indicators" ADD CONSTRAINT "typing_indicators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_stats" ADD CONSTRAINT "usage_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interest_profiles" ADD CONSTRAINT "user_interest_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_online_status" ADD CONSTRAINT "user_online_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vanish_mode_settings" ADD CONSTRAINT "vanish_mode_settings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vanish_mode_settings" ADD CONSTRAINT "vanish_mode_settings_enabled_by_id_users_id_fk" FOREIGN KEY ("enabled_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_calls" ADD CONSTRAINT "video_calls_caller_id_users_id_fk" FOREIGN KEY ("caller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_calls" ADD CONSTRAINT "video_calls_callee_id_users_id_fk" FOREIGN KEY ("callee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_backups_user_idx" ON "account_backups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_backups_status_idx" ON "account_backups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_avatars_user_idx" ON "ai_avatars" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_translations_content_idx" ON "ai_translations" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_device_hash_idx" ON "anon_gossip_posts" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_country_code_idx" ON "anon_gossip_posts" USING btree ("country_code");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_za_location_idx" ON "anon_gossip_posts" USING btree ("za_location_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_created_at_idx" ON "anon_gossip_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_tea_meter_idx" ON "anon_gossip_posts" USING btree ("tea_meter");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_is_whisper_idx" ON "anon_gossip_posts" USING btree ("is_whisper");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_whisper_expires_idx" ON "anon_gossip_posts" USING btree ("whisper_expires_at");--> statement-breakpoint
CREATE INDEX "anon_gossip_posts_is_hidden_idx" ON "anon_gossip_posts" USING btree ("is_hidden");--> statement-breakpoint
CREATE INDEX "anon_gossip_reactions_post_idx" ON "anon_gossip_reactions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_reactions_device_idx" ON "anon_gossip_reactions" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "anon_gossip_replies_post_idx" ON "anon_gossip_replies" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_replies_parent_idx" ON "anon_gossip_replies" USING btree ("parent_reply_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_replies_device_idx" ON "anon_gossip_replies" USING btree ("device_hash");--> statement-breakpoint
CREATE INDEX "anon_gossip_replies_depth_idx" ON "anon_gossip_replies" USING btree ("depth");--> statement-breakpoint
CREATE INDEX "anon_reply_reactions_reply_idx" ON "anon_gossip_reply_reactions" USING btree ("reply_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_reports_post_idx" ON "anon_gossip_reports" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_reports_reply_idx" ON "anon_gossip_reports" USING btree ("reply_id");--> statement-breakpoint
CREATE INDEX "anon_gossip_reports_status_idx" ON "anon_gossip_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "anon_gossip_reports_created_idx" ON "anon_gossip_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ar_filters_category_idx" ON "ar_filters" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ar_filters_active_idx" ON "ar_filters" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ar_filters_featured_idx" ON "ar_filters" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "backup_codes_user_idx" ON "backup_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bff_status_user_idx" ON "bff_status" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bff_status_streak_idx" ON "bff_status" USING btree ("streak_count");--> statement-breakpoint
CREATE INDEX "broadcast_channel_subscribers_channel_idx" ON "broadcast_channel_subscribers" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "broadcast_channel_subscribers_user_idx" ON "broadcast_channel_subscribers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "broadcast_channels_owner_idx" ON "broadcast_channels" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "broadcast_channels_active_idx" ON "broadcast_channels" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "broadcast_messages_channel_idx" ON "broadcast_messages" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "broadcast_messages_created_idx" ON "broadcast_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_folder_conversations_folder_idx" ON "chat_folder_conversations" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "chat_folders_user_idx" ON "chat_folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "check_ins_user_idx" ON "check_ins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "check_ins_venue_idx" ON "check_ins" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "check_ins_created_idx" ON "check_ins" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coin_transactions_wallet_idx" ON "coin_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "coin_transactions_created_idx" ON "coin_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "comment_replies_comment_idx" ON "comment_replies" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "comment_replies_parent_idx" ON "comment_replies" USING btree ("parent_reply_id");--> statement-breakpoint
CREATE INDEX "comment_replies_author_idx" ON "comment_replies" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "content_fatigue_score_idx" ON "content_fatigue" USING btree ("fatigue_score");--> statement-breakpoint
CREATE INDEX "content_fatigue_updated_idx" ON "content_fatigue" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "content_interactions_user_idx" ON "content_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_interactions_content_idx" ON "content_interactions" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "content_interactions_creator_idx" ON "content_interactions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "content_interactions_user_type_idx" ON "content_interactions" USING btree ("user_id","content_type");--> statement-breakpoint
CREATE INDEX "content_interactions_created_idx" ON "content_interactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_velocity_score_idx" ON "content_velocity" USING btree ("velocity_score");--> statement-breakpoint
CREATE INDEX "content_velocity_content_idx" ON "content_velocity" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "countries_code_idx" ON "countries" USING btree ("code");--> statement-breakpoint
CREATE INDEX "countries_is_active_idx" ON "countries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "creator_affinities_user_idx" ON "creator_affinities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creator_affinities_score_idx" ON "creator_affinities" USING btree ("affinity_score");--> statement-breakpoint
CREATE INDEX "duet_stitch_posts_original_idx" ON "duet_stitch_posts" USING btree ("original_post_id");--> statement-breakpoint
CREATE INDEX "duet_stitch_posts_type_idx" ON "duet_stitch_posts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "event_rsvps_event_idx" ON "event_rsvps" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_rsvps_user_idx" ON "event_rsvps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_host_idx" ON "events" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_group_idx" ON "events" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "explore_categories_slug_idx" ON "explore_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "explore_categories_active_idx" ON "explore_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "feature_flags_key_idx" ON "feature_flags" USING btree ("key");--> statement-breakpoint
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "gift_transactions_sender_idx" ON "gift_transactions" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "gift_transactions_recipient_idx" ON "gift_transactions" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "gift_transactions_context_idx" ON "gift_transactions" USING btree ("context_type","context_id");--> statement-breakpoint
CREATE INDEX "gift_types_active_idx" ON "gift_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "gift_types_category_idx" ON "gift_types" USING btree ("category");--> statement-breakpoint
CREATE INDEX "gossip_blocked_words_word_idx" ON "gossip_blocked_words" USING btree ("word");--> statement-breakpoint
CREATE INDEX "gossip_comments_post_id_idx" ON "gossip_comments" USING btree ("gossip_post_id");--> statement-breakpoint
CREATE INDEX "gossip_velocity_post_idx" ON "gossip_engagement_velocity" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "gossip_velocity_score_idx" ON "gossip_engagement_velocity" USING btree ("velocity_score");--> statement-breakpoint
CREATE INDEX "gossip_likes_post_id_idx" ON "gossip_likes" USING btree ("gossip_post_id");--> statement-breakpoint
CREATE INDEX "gossip_location_stats_type_idx" ON "gossip_location_stats" USING btree ("location_type");--> statement-breakpoint
CREATE INDEX "gossip_location_stats_trending_idx" ON "gossip_location_stats" USING btree ("trending_score");--> statement-breakpoint
CREATE INDEX "gossip_location_stats_streak_idx" ON "gossip_location_stats" USING btree ("streak_days");--> statement-breakpoint
CREATE INDEX "gossip_posts_created_at_idx" ON "gossip_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gossip_retweets_post_id_idx" ON "gossip_retweets" USING btree ("original_gossip_post_id");--> statement-breakpoint
CREATE INDEX "gossip_settings_key_idx" ON "gossip_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "group_conversation_members_conv_idx" ON "group_conversation_members" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "group_conversation_members_user_idx" ON "group_conversation_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_conversations_creator_idx" ON "group_conversations" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "group_conversations_last_message_idx" ON "group_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "group_join_requests_status_idx" ON "group_join_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "group_members_group_idx" ON "group_members" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_members_user_idx" ON "group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "group_messages_conv_idx" ON "group_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "group_messages_created_idx" ON "group_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "group_posts_group_idx" ON "group_posts" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "group_posts_pinned_idx" ON "group_posts" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "groups_owner_idx" ON "groups" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "groups_privacy_idx" ON "groups" USING btree ("privacy");--> statement-breakpoint
CREATE INDEX "groups_created_idx" ON "groups" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hashtags_tag_idx" ON "hashtags" USING btree ("tag");--> statement-breakpoint
CREATE INDEX "hashtags_post_count_idx" ON "hashtags" USING btree ("post_count");--> statement-breakpoint
CREATE INDEX "hashtags_weekly_idx" ON "hashtags" USING btree ("weekly_post_count");--> statement-breakpoint
CREATE INDEX "hidden_posts_user_id_idx" ON "hidden_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "hidden_words_user_idx" ON "hidden_words" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "linked_accounts_primary_idx" ON "linked_accounts" USING btree ("primary_user_id");--> statement-breakpoint
CREATE INDEX "linked_accounts_linked_idx" ON "linked_accounts" USING btree ("linked_user_id");--> statement-breakpoint
CREATE INDEX "live_stream_comments_stream_idx" ON "live_stream_comments" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "live_stream_comments_created_idx" ON "live_stream_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "live_stream_gifts_stream_idx" ON "live_stream_gifts" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "live_stream_reactions_stream_idx" ON "live_stream_reactions" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "live_stream_viewers_stream_idx" ON "live_stream_viewers" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "live_stream_viewers_user_idx" ON "live_stream_viewers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "live_streams_host_idx" ON "live_streams" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "live_streams_status_idx" ON "live_streams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "live_streams_created_idx" ON "live_streams" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "mall_items_category_id_idx" ON "mall_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "mall_purchases_user_id_idx" ON "mall_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mall_purchases_item_id_idx" ON "mall_purchases" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "message_reactions_message_idx" ON "message_reactions" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "net_worth_ledger_user_id_idx" ON "net_worth_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "net_worth_ledger_created_at_idx" ON "net_worth_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "not_interested_user_idx" ON "not_interested" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "not_interested_user_id_idx" ON "not_interested_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "phone_verification_tokens_user_id_idx" ON "phone_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "phone_verification_tokens_token_idx" ON "phone_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "pinned_messages_conv_idx" ON "pinned_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "platform_imports_user_idx" ON "platform_imports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_imports_status_idx" ON "platform_imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pokes_sender_idx" ON "pokes" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "pokes_recipient_idx" ON "pokes" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "pokes_created_idx" ON "pokes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "post_hashtags_post_idx" ON "post_hashtags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_hashtags_hashtag_idx" ON "post_hashtags" USING btree ("hashtag_id");--> statement-breakpoint
CREATE INDEX "post_reactions_post_idx" ON "post_reactions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_reactions_type_idx" ON "post_reactions" USING btree ("reaction_type");--> statement-breakpoint
CREATE INDEX "post_threads_author_idx" ON "post_threads" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "push_tokens_user_idx" ON "push_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_tokens_active_idx" ON "push_tokens" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "saved_posts_user_id_idx" ON "saved_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_posts_post_id_idx" ON "saved_posts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "scheduled_messages_scheduled_for_idx" ON "scheduled_messages" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "scheduled_messages_sender_idx" ON "scheduled_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "security_checkups_user_idx" ON "security_checkups" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "security_checkups_date_idx" ON "security_checkups" USING btree ("checkup_date");--> statement-breakpoint
CREATE INDEX "seen_content_user_idx" ON "seen_content" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seen_content_expires_idx" ON "seen_content" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "seen_profiles_user_idx" ON "seen_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "seen_profiles_expires_idx" ON "seen_profiles" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "story_countdown_subscriptions_sticker_id_idx" ON "story_countdown_subscriptions" USING btree ("sticker_id");--> statement-breakpoint
CREATE INDEX "story_drafts_user_id_idx" ON "story_drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "story_insights_story_id_idx" ON "story_insights" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_insights_viewer_id_idx" ON "story_insights" USING btree ("viewer_id");--> statement-breakpoint
CREATE INDEX "story_music_library_genre_idx" ON "story_music_library" USING btree ("genre");--> statement-breakpoint
CREATE INDEX "story_music_library_featured_idx" ON "story_music_library" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "story_reactions_story_id_idx" ON "story_reactions" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_reactions_user_id_idx" ON "story_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "story_replies_story_id_idx" ON "story_replies" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_replies_user_id_idx" ON "story_replies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "story_sticker_responses_sticker_id_idx" ON "story_sticker_responses" USING btree ("sticker_id");--> statement-breakpoint
CREATE INDEX "story_sticker_responses_user_id_idx" ON "story_sticker_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "story_stickers_story_id_idx" ON "story_stickers" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_streaks_user_id_idx" ON "story_streaks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "story_templates_category_idx" ON "story_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "story_templates_active_idx" ON "story_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "story_tips_story_id_idx" ON "story_tips" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_tips_sender_id_idx" ON "story_tips" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "story_tips_recipient_id_idx" ON "story_tips" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "subscription_tiers_creator_idx" ON "subscription_tiers" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "subscription_tiers_active_idx" ON "subscription_tiers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "subscriptions_subscriber_idx" ON "subscriptions" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "subscriptions_creator_idx" ON "subscriptions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "thread_posts_thread_idx" ON "thread_posts" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_posts_position_idx" ON "thread_posts" USING btree ("thread_id","position");--> statement-breakpoint
CREATE INDEX "trends_daily_window_start_idx" ON "trends_daily" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "trends_daily_score_idx" ON "trends_daily" USING btree ("score");--> statement-breakpoint
CREATE INDEX "usage_stats_user_idx" ON "usage_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usage_stats_date_idx" ON "usage_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "user_interest_profiles_user_idx" ON "user_interest_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_locations_user_idx" ON "user_locations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_locations_sharing_idx" ON "user_locations" USING btree ("is_sharing");--> statement-breakpoint
CREATE INDEX "vanish_mode_settings_enabled_idx" ON "vanish_mode_settings" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "venues_location_idx" ON "venues" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city");--> statement-breakpoint
CREATE INDEX "venues_category_idx" ON "venues" USING btree ("category");--> statement-breakpoint
CREATE INDEX "video_calls_caller_idx" ON "video_calls" USING btree ("caller_id");--> statement-breakpoint
CREATE INDEX "video_calls_callee_idx" ON "video_calls" USING btree ("callee_id");--> statement-breakpoint
CREATE INDEX "video_calls_status_idx" ON "video_calls" USING btree ("status");--> statement-breakpoint
CREATE INDEX "video_calls_created_idx" ON "video_calls" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wallets_user_id_idx" ON "wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_webhook_idx" ON "webhook_deliveries" USING btree ("webhook_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_created_idx" ON "webhook_deliveries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "webhooks_user_idx" ON "webhooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "webhooks_active_idx" ON "webhooks" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "za_locations_province_idx" ON "za_locations" USING btree ("province");--> statement-breakpoint
CREATE INDEX "za_locations_city_idx" ON "za_locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "za_locations_kasi_idx" ON "za_locations" USING btree ("kasi");--> statement-breakpoint
CREATE INDEX "za_locations_full_path_idx" ON "za_locations" USING btree ("full_path");--> statement-breakpoint
CREATE INDEX "za_locations_level_idx" ON "za_locations" USING btree ("level");--> statement-breakpoint
CREATE INDEX "za_locations_parent_idx" ON "za_locations" USING btree ("parent_id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_reply_to_idx" ON "messages" USING btree ("reply_to_id");--> statement-breakpoint
CREATE INDEX "posts_is_pinned_idx" ON "posts" USING btree ("is_pinned","author_id");--> statement-breakpoint
CREATE INDEX "stories_type_idx" ON "stories" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stories_close_friends_idx" ON "stories" USING btree ("is_close_friends");