# RabitChat Database Schema

Last Updated: January 15, 2026

## Overview

RabitChat uses PostgreSQL with Drizzle ORM. The schema is defined in `/shared/schema.ts`.

## Enums

| Enum | Values | Description |
|------|--------|-------------|
| `notification_type` | LIKE, COMMENT, FOLLOW, MESSAGE | Notification categories |
| `report_status` | PENDING, REVIEWED, RESOLVED, DISMISSED | Report workflow states |
| `post_type` | TEXT, PHOTO, VIDEO, VOICE | Content type for posts |
| `visibility` | PUBLIC, FOLLOWERS, PRIVATE | Post visibility levels |
| `user_category` | PERSONAL, CREATOR, BUSINESS | User account types |
| `policy` | EVERYONE, FOLLOWERS, NOBODY | Privacy policy options |
| `playlist_type` | VIDEO, VOICE | Media playlist categories |

## Core Tables

### users
Primary user account table.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| username | TEXT | NO | - | Unique username |
| email | TEXT | NO | - | Unique email |
| password | TEXT | NO | - | Hashed password (bcrypt) |
| display_name | TEXT | NO | - | Display name |
| bio | TEXT | YES | '' | User biography |
| avatar_url | TEXT | YES | - | Profile image URL |
| cover_url | TEXT | YES | - | Cover/banner image URL |
| category | user_category | NO | 'PERSONAL' | Account type |
| location | TEXT | YES | - | User location |
| link_url | TEXT | YES | - | External link |
| net_worth | INTEGER | NO | 0 | Net worth badge value |
| influence_score | INTEGER | NO | 0 | Influence badge value |
| is_admin | BOOLEAN | NO | false | Legacy admin flag |
| suspended_at | TIMESTAMP | YES | - | When suspended |
| suspended_until | TIMESTAMP | YES | - | Suspension end time |
| suspended_reason | TEXT | YES | - | Suspension reason |
| suspended_by_id | VARCHAR | YES | - | Admin who suspended |
| created_at | TIMESTAMP | NO | NOW() | Account creation time |

### posts
User-created content posts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| author_id | VARCHAR | NO | - | FK to users |
| type | post_type | NO | 'TEXT' | Content type |
| content | TEXT | YES | - | Text content (for TEXT posts) |
| caption | TEXT | YES | - | Caption (for media posts) |
| media_url | TEXT | YES | - | Media file URL |
| thumbnail_url | TEXT | YES | - | Video/voice thumbnail |
| duration_ms | INTEGER | YES | - | Media duration in ms |
| aspect_ratio | REAL | YES | - | Media aspect ratio |
| visibility | visibility | NO | 'PUBLIC' | Who can see post |
| comments_enabled | BOOLEAN | NO | true | Allow comments |
| likes_count | INTEGER | NO | 0 | Cached like count |
| comments_count | INTEGER | NO | 0 | Cached comment count |
| is_featured | BOOLEAN | NO | false | Admin featured |
| is_hidden | BOOLEAN | NO | false | Admin hidden |
| hidden_reason | TEXT | YES | - | Why hidden |
| hidden_at | TIMESTAMP | YES | - | When hidden |
| hidden_by_id | VARCHAR | YES | - | Admin who hid |
| edited_at | TIMESTAMP | YES | - | Last edit time |
| created_at | TIMESTAMP | NO | NOW() | Post creation time |

**Indexes:**
- `posts_created_at_idx` - Timeline queries
- `posts_author_id_idx` - User profile posts
- `posts_type_created_at_idx` - Filter by type
- `posts_author_created_at_idx` - Compound index

### comments
Comments on posts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| post_id | VARCHAR | NO | - | FK to posts |
| author_id | VARCHAR | NO | - | FK to users |
| content | TEXT | NO | - | Comment text |
| is_hidden | BOOLEAN | NO | false | Admin hidden |
| hidden_reason | TEXT | YES | - | Why hidden |
| hidden_at | TIMESTAMP | YES | - | When hidden |
| hidden_by_id | VARCHAR | YES | - | Admin who hid |
| created_at | TIMESTAMP | NO | NOW() | Comment creation |

### likes
Post likes (user-post unique constraint).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | FK to users |
| post_id | VARCHAR | NO | - | FK to posts |
| created_at | TIMESTAMP | NO | NOW() | When liked |

**Constraints:** UNIQUE(user_id, post_id)

### follows
User follow relationships.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| follower_id | VARCHAR | NO | - | Who is following |
| following_id | VARCHAR | NO | - | Who is followed |
| created_at | TIMESTAMP | NO | NOW() | When followed |

**Constraints:** UNIQUE(follower_id, following_id)

## Messaging Tables

### conversations
Chat conversation containers.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| participant1_id | VARCHAR | NO | - | First participant |
| participant2_id | VARCHAR | NO | - | Second participant |
| last_message_at | TIMESTAMP | YES | - | Last activity time |
| created_at | TIMESTAMP | NO | NOW() | Conversation start |

**Constraints:** UNIQUE(participant1_id, participant2_id)

### messages
Individual chat messages.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| conversation_id | VARCHAR | NO | - | FK to conversations |
| sender_id | VARCHAR | NO | - | Who sent |
| receiver_id | VARCHAR | NO | - | Who receives |
| content | TEXT | NO | - | Message text |
| read_at | TIMESTAMP | YES | - | When read |
| created_at | TIMESTAMP | NO | NOW() | When sent |

## User Features Tables

### bookmarks
User saved posts.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | FK to users |
| post_id | VARCHAR | NO | - | FK to posts |
| created_at | TIMESTAMP | NO | NOW() | When bookmarked |

**Constraints:** UNIQUE(user_id, post_id)

### user_settings
User privacy and notification preferences (1:1 with user).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | FK to users (UNIQUE) |
| private_account | BOOLEAN | NO | false | Private profile |
| comment_policy | policy | NO | 'EVERYONE' | Who can comment |
| message_policy | policy | NO | 'EVERYONE' | Who can message |
| mention_policy | policy | NO | 'EVERYONE' | Who can mention |
| notifications | JSONB | NO | {...} | Notification prefs |
| media_prefs | JSONB | NO | {...} | Media settings |
| created_at | TIMESTAMP | NO | NOW() | Created |
| updated_at | TIMESTAMP | NO | NOW() | Last updated |

**Notifications default:** `{likes: true, comments: true, follows: true, messages: true, mentions: true}`
**Media prefs default:** `{autoplay: true, dataSaver: false, uploadQuality: "high"}`

### playlists
Video/voice content playlists.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | FK to users |
| title | VARCHAR(100) | NO | - | Playlist name |
| description | TEXT | YES | - | Description |
| type | playlist_type | NO | - | VIDEO or VOICE |
| is_public | BOOLEAN | NO | true | Public visibility |
| created_at | TIMESTAMP | NO | NOW() | Created |
| updated_at | TIMESTAMP | NO | NOW() | Last updated |

### playlist_items
Posts in playlists.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| playlist_id | VARCHAR | NO | - | FK to playlists |
| post_id | VARCHAR | NO | - | FK to posts |
| order | INTEGER | NO | 0 | Sort order |
| created_at | TIMESTAMP | NO | NOW() | When added |

**Constraints:** UNIQUE(playlist_id, post_id)

### featured_intros
User profile intro cards (1:1 with user).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | FK to users (UNIQUE) |
| title | VARCHAR(100) | NO | - | Intro title |
| body | TEXT | NO | - | Intro content |
| cta_text | VARCHAR(50) | YES | - | Button text |
| cta_url | TEXT | YES | - | Button link |
| updated_at | TIMESTAMP | NO | NOW() | Last updated |

### pins
Pinned posts on user profile (max 3 per user, enforced in app).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | FK to users |
| post_id | VARCHAR | NO | - | FK to posts |
| order | INTEGER | NO | 0 | Display order |
| created_at | TIMESTAMP | NO | NOW() | When pinned |

**Constraints:** UNIQUE(user_id, post_id)

## Moderation Tables

### blocks
User blocking relationships.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| blocker_id | VARCHAR | NO | - | Who blocked |
| blocked_id | VARCHAR | NO | - | Who is blocked |
| created_at | TIMESTAMP | NO | NOW() | When blocked |

### reports
Content/user reports for moderation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| reporter_id | VARCHAR | NO | - | Who reported |
| reported_user_id | VARCHAR | YES | - | Reported user |
| reported_post_id | VARCHAR | YES | - | Reported post |
| reason | TEXT | NO | - | Report reason |
| details | TEXT | YES | - | Additional details |
| status | report_status | NO | 'PENDING' | Current status |
| resolved_by_id | VARCHAR | YES | - | Admin who resolved |
| resolution_notes | TEXT | YES | - | Resolution notes |
| resolved_at | TIMESTAMP | YES | - | When resolved |
| created_at | TIMESTAMP | NO | NOW() | When reported |

### notifications
User notifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | Who receives |
| actor_id | VARCHAR | NO | - | Who triggered |
| type | notification_type | NO | - | LIKE/COMMENT/FOLLOW/MESSAGE |
| entity_id | VARCHAR | YES | - | Related entity ID |
| read_at | TIMESTAMP | YES | - | When read |
| created_at | TIMESTAMP | NO | NOW() | When created |

## RBAC Tables

### roles
System roles for permissions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| name | VARCHAR(50) | NO | - | Role key (SUPER_ADMIN, etc) |
| display_name | VARCHAR(100) | NO | - | Human-readable name |
| description | TEXT | YES | - | Role description |
| level | INTEGER | NO | 0 | Authority level |
| is_system | BOOLEAN | NO | false | Cannot be deleted |
| created_at | TIMESTAMP | NO | NOW() | Created |
| updated_at | TIMESTAMP | NO | NOW() | Updated |

### permissions
Granular permissions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| key | VARCHAR(100) | NO | - | Permission key (users.view) |
| name | VARCHAR(100) | NO | - | Human-readable name |
| description | TEXT | YES | - | Description |
| group | VARCHAR(50) | NO | - | Group (users, posts, etc) |
| created_at | TIMESTAMP | NO | NOW() | Created |

### role_permissions
Role to permission mapping.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| role_id | VARCHAR | NO | - | FK to roles |
| permission_id | VARCHAR | NO | - | FK to permissions |
| created_at | TIMESTAMP | NO | NOW() | Created |

**Constraints:** UNIQUE(role_id, permission_id)

### user_roles
User to role assignment.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | NO | - | FK to users |
| role_id | VARCHAR | NO | - | FK to roles |
| assigned_by | VARCHAR | YES | - | Who assigned |
| created_at | TIMESTAMP | NO | NOW() | When assigned |

**Constraints:** UNIQUE(user_id, role_id)

### audit_logs
System audit trail.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| user_id | VARCHAR | YES | - | Who performed action |
| action | VARCHAR(50) | NO | - | Action type |
| target_type | VARCHAR(50) | YES | - | Target entity type |
| target_id | VARCHAR | YES | - | Target entity ID |
| details | JSONB | YES | - | Action details |
| ip_address | VARCHAR(45) | YES | - | Client IP |
| user_agent | TEXT | YES | - | Client user agent |
| created_at | TIMESTAMP | NO | NOW() | When logged |

### app_settings
Application configuration.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | VARCHAR | NO | gen_random_uuid() | Primary key |
| key | VARCHAR(100) | NO | - | Setting key (UNIQUE) |
| value | JSONB | NO | - | Setting value |
| description | TEXT | YES | - | Description |
| updated_by | VARCHAR | YES | - | Last updater |
| created_at | TIMESTAMP | NO | NOW() | Created |
| updated_at | TIMESTAMP | NO | NOW() | Updated |

## Session Tables

### user_sessions
Express session storage (connect-pg-simple).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| sid | VARCHAR | NO | - | Session ID (PK) |
| sess | JSON | NO | - | Session data |
| expire | TIMESTAMP | NO | - | Expiration time |

## Type Definitions

See `/shared/schema.ts` for TypeScript type exports:
- `User`, `Post`, `Comment`, `Like`, `Follow`
- `Conversation`, `Message`, `Notification`
- `Block`, `Report`
- `Role`, `Permission`, `RolePermission`, `UserRole`
- `AuditLog`, `AppSetting`
- `Bookmark`, `UserSettings`, `Playlist`, `PlaylistItem`
- `FeaturedIntro`, `Pin`
- `PostType`, `Visibility`, `UserCategory`, `Policy`, `PlaylistType`
- Composite types: `PostWithAuthor`, `UserWithRoles`, `PlaylistWithItems`, etc.
