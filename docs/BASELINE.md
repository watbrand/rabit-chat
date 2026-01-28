# RabitChat Baseline Lock

## Status: LOCKED AND VERIFIED

**Baseline Date:** January 15, 2026

---

## Confirmation

RabitChat is **fully operational** and has passed end-to-end verification for all core systems.

---

## Core Features Summary

### Authentication System
- User signup with email, username, password, and display name
- Login supporting both email and username (case-insensitive)
- Session-based authentication with PostgreSQL session storage
- Secure password hashing with bcrypt
- Protected routes with `requireAuth` middleware
- Logout functionality with session destruction

### Social Feed
- Create posts with text content and optional media
- Like/unlike posts with real-time count updates
- Comment on posts
- View feed with author information
- Influence score tracking (increases with engagement)

### Follow System
- Follow/unfollow users
- Followers and following counts
- Follow status checking
- Block detection (cannot follow blocked users)

### Discover/Search
- User search by username and display name
- Hidden user filtering (blocked users excluded)

### Real-time 1-on-1 Chat
- WebSocket-based real-time messaging
- Database persistence for all messages
- Conversation creation and management
- Read status tracking
- Block detection (cannot message blocked users)
- Chat enable/disable via admin settings

### User Management
- Profile editing (display name, bio, avatar, net worth)
- Account deletion with cascade cleanup
- User blocking system
- Suspension system with duration and reason

### Notifications
- Real-time notifications via WebSocket
- Notification types: FOLLOW, LIKE, COMMENT, MESSAGE
- Read/unread status tracking

### Content Moderation
- Report system for users and posts
- Hide/unhide posts and comments
- Hard delete posts and comments
- Featured posts functionality

---

## Admin System Summary

### Access Control
- `isAdmin` flag on user accounts
- `requireAdmin` middleware for all admin routes
- RBAC (Role-Based Access Control) with granular permissions

### Admin Modules
1. **Overview/Analytics** - Dashboard with key metrics
2. **Users Management** - View, edit, suspend, unsuspend users
3. **Content Management** - Posts and comments moderation
4. **Reports** - Content and user report handling with actions
5. **Roles & Permissions** - RBAC management
6. **App Settings** - Feature flags and configuration
7. **Audit Logs** - Complete activity tracking

### Roles
- **SUPER_ADMIN** - Full access, cannot be deleted
- **ADMIN** - Full admin panel access
- **MODERATOR** - Content moderation access
- **SUPPORT** - User support access

### Permissions (27 total)
Grouped by: users, posts, comments, reports, roles, settings, audit, analytics

---

## Technical Stack

### Frontend
- Expo SDK 54 with React Native 0.81
- React Navigation v7
- TanStack React Query
- Purple glassmorphism UI (#8B5CF6)

### Backend
- Express.js with TypeScript (port 5000)
- Session-based auth with `express-session`
- WebSocket server for real-time features
- Rate limiting and Helmet security

### Database
- PostgreSQL with Drizzle ORM
- Centralized schema in `/shared/schema.ts`

### Media
- Cloudinary for image/video storage

---

## Environment Variables Required

See `.env.example` for the complete list:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary credentials
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## Warning

**DO NOT MODIFY CORE SYSTEMS WITHOUT A BACKUP**

Before making changes to:
- Authentication logic
- Database schema
- Session management
- Admin permission system
- WebSocket handlers

Always:
1. Create a checkpoint
2. Test changes in development first
3. Verify admin access is maintained
4. Check audit logging is functional

---

## Verification Tests Passed

| System | Status |
|--------|--------|
| Signup | ✓ Verified |
| Login (email/username) | ✓ Verified |
| Logout | ✓ Verified |
| Protected Routes | ✓ Verified |
| Create Post | ✓ Verified |
| Like Post | ✓ Verified |
| Comment | ✓ Verified |
| Follow User | ✓ Verified |
| User Search | ✓ Verified |
| Create Conversation | ✓ Verified |
| Send Message | ✓ Verified |
| Admin Overview | ✓ Verified |
| Admin Users | ✓ Verified |
| Admin Reports | ✓ Verified |
| Admin Roles | ✓ Verified |
| Admin Permissions | ✓ Verified |
| Admin Settings | ✓ Verified |
| Admin Audit Logs | ✓ Verified |
| Permission Gating | ✓ Verified (19 audit log calls) |

---

**RabitChat baseline is locked and verified. Safe to continue development.**
