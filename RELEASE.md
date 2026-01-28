# RabitChat Release Notes

## Version 1.0.0 MVP (January 14, 2026)

**Status:** Stable  
**Commit:** fa462a9c405843787af7f42978f2c9c451b5b906  
**Published:** b95b6d19a9af22882bd32381a5898f6d773c92dd

### Overview

First stable release of RabitChat, a Forbes-style social network mobile application. This MVP includes all core social features with a premium purple glassmorphism design.

### Features

#### Authentication
- Secure signup with bcrypt password hashing
- Session-based login with PostgreSQL session storage
- Logout with session cleanup

#### Social Feed
- Create text posts
- Like/unlike posts with real-time count updates
- Comment on posts
- Influence score tracking (+10 per post, +1 per like received)

#### Follow System
- Follow/unfollow users
- Follower/following counts on profiles
- Influence score bonus (+5 per new follower)

#### User Profiles
- Net Worth badge (gold)
- Influence Score badge (silver)
- Display name and avatar URL
- Post history

#### Discovery
- Search users by username/display name
- Search posts by content

#### Real-time Chat
- 1-on-1 messaging
- WebSocket delivery for real-time messages
- Database persistence for message history
- Automatic reconnection with exponential backoff

#### Account Management
- Edit profile (display name, avatar, net worth)
- Delete account with full cascade cleanup

### Technical Stack

- **Frontend:** Expo SDK 54, React Native 0.81, React Navigation v7
- **Backend:** Express.js with TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Real-time:** WebSocket (ws) with session authentication
- **Styling:** Custom glassmorphism theme (#8B5CF6 purple accent)

### Known Limitations

1. No rate limiting (planned for 1.1.0)
2. No feed pagination (returns all posts)
3. Basic ILIKE search (no full-text search)
4. No email verification
5. No password reset flow
6. No image upload for posts/avatars

### Breaking Changes

N/A - Initial release

### Upgrade Path

N/A - Initial release

### Rollback Instructions

#### Via Replit UI
1. Open the Replit project
2. Click three-dot menu → History
3. Select the checkpoint for this release
4. Click "Restore"

#### Manual Backup
Before upgrading to future versions:
1. Fork the Repl to create a backup copy
2. Export database using Drizzle Studio or psql
3. Document schema changes in migration notes

---

## Changelog Format

Future releases will follow this format:

```
## Version X.Y.Z (Date)

### Added
- New features

### Changed
- Modifications to existing features

### Fixed
- Bug fixes

### Removed
- Deprecated features removed

### Security
- Security patches

### Breaking Changes
- Changes requiring migration
```

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | Jan 14, 2026 | Stable | MVP release |
