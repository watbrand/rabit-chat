CREATE TYPE "public"."export_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."font_size" AS ENUM('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE');--> statement-breakpoint
CREATE TYPE "public"."link_icon_type" AS ENUM('LINK', 'WEBSITE', 'INSTAGRAM', 'TWITTER', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'GITHUB', 'DISCORD', 'TWITCH', 'SPOTIFY', 'AMAZON', 'SHOP', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."relationship_status" AS ENUM('SINGLE', 'IN_RELATIONSHIP', 'ENGAGED', 'MARRIED', 'COMPLICATED', 'OPEN', 'PREFER_NOT_TO_SAY');--> statement-breakpoint
CREATE TYPE "public"."scheduled_status" AS ENUM('PENDING', 'PUBLISHED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."story_type" AS ENUM('PHOTO', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."theme_style" AS ENUM('DEFAULT', 'MINIMAL', 'BOLD', 'ELEGANT', 'DARK', 'VIBRANT');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'USER_PROFILE_EDITED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'USER_PASSWORD_RESET';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'USER_IMPERSONATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'USER_NOTE_ADDED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'MASS_ACTION_PERFORMED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'DATA_EXPORTED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'DATA_IMPORTED';--> statement-breakpoint
CREATE TABLE "admin_user_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "close_friends" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"friend_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "close_friend_unique" UNIQUE("user_id","friend_id")
);
--> statement-breakpoint
CREATE TABLE "data_export_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "export_status" DEFAULT 'PENDING' NOT NULL,
	"include_profile" boolean DEFAULT true NOT NULL,
	"include_posts" boolean DEFAULT true NOT NULL,
	"include_messages" boolean DEFAULT true NOT NULL,
	"include_media" boolean DEFAULT false NOT NULL,
	"download_url" text,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "post_type" DEFAULT 'TEXT' NOT NULL,
	"content" text,
	"caption" text,
	"media_url" text,
	"thumbnail_url" text,
	"duration_ms" integer,
	"aspect_ratio" real,
	"visibility" "visibility" DEFAULT 'PUBLIC' NOT NULL,
	"comments_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyword_filters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"keyword" text NOT NULL,
	"filter_comments" boolean DEFAULT true NOT NULL,
	"filter_messages" boolean DEFAULT true NOT NULL,
	"filter_posts" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "keyword_filter_unique" UNIQUE("user_id","keyword")
);
--> statement-breakpoint
CREATE TABLE "login_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_token" text NOT NULL,
	"device_name" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"ip_address" text,
	"location" text,
	"is_trusted" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "muted_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"muted_user_id" varchar NOT NULL,
	"mute_posts" boolean DEFAULT true NOT NULL,
	"mute_stories" boolean DEFAULT true NOT NULL,
	"mute_messages" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "muted_unique" UNIQUE("user_id","muted_user_id")
);
--> statement-breakpoint
CREATE TABLE "pending_tag_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"post_id" varchar NOT NULL,
	"tagged_by_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	CONSTRAINT "pending_tag_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE "post_collaborators" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp,
	CONSTRAINT "post_collaborator_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "restricted_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"restricted_user_id" varchar NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restricted_unique" UNIQUE("user_id","restricted_user_id")
);
--> statement-breakpoint
CREATE TABLE "scheduled_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "post_type" DEFAULT 'TEXT' NOT NULL,
	"content" text,
	"caption" text,
	"media_url" text,
	"thumbnail_url" text,
	"duration_ms" integer,
	"aspect_ratio" real,
	"visibility" "visibility" DEFAULT 'PUBLIC' NOT NULL,
	"comments_enabled" boolean DEFAULT true NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"status" "scheduled_status" DEFAULT 'PENDING' NOT NULL,
	"published_post_id" varchar,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" "story_type" NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"duration_ms" integer,
	"caption" text,
	"views_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_highlight_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"highlight_id" varchar NOT NULL,
	"story_id" varchar NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "highlight_story_unique" UNIQUE("highlight_id","story_id")
);
--> statement-breakpoint
CREATE TABLE "story_highlights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"cover_url" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_viewer_restrictions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"restricted_viewer_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_viewer_restriction_unique" UNIQUE("user_id","restricted_viewer_id")
);
--> statement-breakpoint
CREATE TABLE "story_views" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"viewer_id" varchar NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_views_unique" UNIQUE("story_id","viewer_id")
);
--> statement-breakpoint
CREATE TABLE "trusted_devices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"device_id" text NOT NULL,
	"device_name" text NOT NULL,
	"device_type" text,
	"browser" text,
	"os" text,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trusted_device_user_device_unique" UNIQUE("user_id","device_id")
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"interest" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_interest_unique" UNIQUE("user_id","interest")
);
--> statement-breakpoint
CREATE TABLE "user_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"icon_type" "link_icon_type" DEFAULT 'LINK' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "activity_status_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "read_receipts_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "profile_view_history_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "anonymous_viewing_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "hide_likes_tab" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "tag_approval_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "search_engine_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "email_discoverable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "phone_discoverable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "story_view_policy" "policy" DEFAULT 'FOLLOWERS' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "followers_list_visibility" "policy" DEFAULT 'EVERYONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "following_list_visibility" "policy" DEFAULT 'EVERYONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "push_notifications" jsonb DEFAULT '{"likes":true,"comments":true,"follows":true,"messages":true,"mentions":true,"storyViews":false,"profileViews":false,"newFollowers":true,"liveVideos":true,"promotions":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "email_notifications" jsonb DEFAULT '{"weeklyDigest":true,"newFollowers":false,"messages":false,"mentions":false,"productUpdates":true,"securityAlerts":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "quiet_hours_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "quiet_hours_start" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "quiet_hours_end" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "quiet_hours_timezone" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "content_preferences" jsonb DEFAULT '{"showSensitiveContent":false,"autoTranslate":true,"prioritizeFollowing":true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "sensitive_content_filter" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "login_alerts_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "font_size_preference" "font_size" DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pronouns" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birthday" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_song_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_song_title" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_song_artist" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_video_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "voice_bio_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "voice_bio_duration_ms" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "relationship_status" "relationship_status";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "relationship_partner_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme_color" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "theme_style" "theme_style" DEFAULT 'DEFAULT';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_handle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "extended_bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_effects" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "follower_milestone" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_likes_received" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_views_received" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "admin_user_notes" ADD CONSTRAINT "admin_user_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_user_notes" ADD CONSTRAINT "admin_user_notes_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_friends" ADD CONSTRAINT "close_friends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "close_friends" ADD CONSTRAINT "close_friends_friend_id_users_id_fk" FOREIGN KEY ("friend_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_requests" ADD CONSTRAINT "data_export_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyword_filters" ADD CONSTRAINT "keyword_filters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muted_accounts" ADD CONSTRAINT "muted_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "muted_accounts" ADD CONSTRAINT "muted_accounts_muted_user_id_users_id_fk" FOREIGN KEY ("muted_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_tag_approvals" ADD CONSTRAINT "pending_tag_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_tag_approvals" ADD CONSTRAINT "pending_tag_approvals_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_tag_approvals" ADD CONSTRAINT "pending_tag_approvals_tagged_by_id_users_id_fk" FOREIGN KEY ("tagged_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_collaborators" ADD CONSTRAINT "post_collaborators_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_collaborators" ADD CONSTRAINT "post_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_accounts" ADD CONSTRAINT "restricted_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restricted_accounts" ADD CONSTRAINT "restricted_accounts_restricted_user_id_users_id_fk" FOREIGN KEY ("restricted_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_published_post_id_posts_id_fk" FOREIGN KEY ("published_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_highlight_items" ADD CONSTRAINT "story_highlight_items_highlight_id_story_highlights_id_fk" FOREIGN KEY ("highlight_id") REFERENCES "public"."story_highlights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_highlight_items" ADD CONSTRAINT "story_highlight_items_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_highlights" ADD CONSTRAINT "story_highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_viewer_restrictions" ADD CONSTRAINT "story_viewer_restrictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_viewer_restrictions" ADD CONSTRAINT "story_viewer_restrictions_restricted_viewer_id_users_id_fk" FOREIGN KEY ("restricted_viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_links" ADD CONSTRAINT "user_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_user_notes_user_id_idx" ON "admin_user_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_user_notes_admin_id_idx" ON "admin_user_notes" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "close_friends_user_id_idx" ON "close_friends" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "data_export_requests_user_id_idx" ON "data_export_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "data_export_requests_status_idx" ON "data_export_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "drafts_user_id_idx" ON "drafts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "drafts_updated_at_idx" ON "drafts" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "keyword_filters_user_id_idx" ON "keyword_filters" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_sessions_user_id_idx" ON "login_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_sessions_token_idx" ON "login_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "login_sessions_active_idx" ON "login_sessions" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "muted_accounts_user_id_idx" ON "muted_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pending_tag_approvals_user_id_idx" ON "pending_tag_approvals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "post_collaborators_post_id_idx" ON "post_collaborators" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_collaborators_user_id_idx" ON "post_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "restricted_accounts_user_id_idx" ON "restricted_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_posts_user_id_idx" ON "scheduled_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_posts_scheduled_for_idx" ON "scheduled_posts" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "scheduled_posts_status_idx" ON "scheduled_posts" USING btree ("status","scheduled_for");--> statement-breakpoint
CREATE INDEX "stories_user_id_idx" ON "stories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stories_expires_at_idx" ON "stories" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "stories_user_created_idx" ON "stories" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "story_highlight_items_highlight_idx" ON "story_highlight_items" USING btree ("highlight_id");--> statement-breakpoint
CREATE INDEX "story_highlights_user_id_idx" ON "story_highlights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "story_highlights_order_idx" ON "story_highlights" USING btree ("user_id","order");--> statement-breakpoint
CREATE INDEX "story_viewer_restrictions_user_id_idx" ON "story_viewer_restrictions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "story_views_story_id_idx" ON "story_views" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "story_views_viewer_id_idx" ON "story_views" USING btree ("viewer_id");--> statement-breakpoint
CREATE INDEX "trusted_devices_user_id_idx" ON "trusted_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_interests_user_id_idx" ON "user_interests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_links_user_id_idx" ON "user_links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_links_order_idx" ON "user_links" USING btree ("user_id","order");--> statement-breakpoint
CREATE INDEX "user_notes_user_id_idx" ON "user_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_notes_expires_at_idx" ON "user_notes" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_custom_handle_unique" UNIQUE("custom_handle");