# Admin Modules - Extended Features

This document covers the extended admin management features added to RabitChat for comprehensive platform administration.

## Overview

The admin system provides comprehensive tools for managing:
- **Users** - Profile editing, settings, force logout, deactivation
- **Content** - Posts/comments filtering, hiding, soft delete
- **Playlists** - User playlist management
- **Featured Intros** - Featured content management

---

## User Management Extensions

### View/Edit User Settings
**Permission Required:** `users.settings.read` / `users.settings.write`

**Endpoint:** `GET /api/admin/users/:id/settings`
Returns the user's privacy and notification settings snapshot.

**Editable Fields via PATCH /api/admin/users/:id:**
- `displayName` - User's display name
- `username` - Unique username
- `bio` - Profile biography
- `avatarUrl` - Profile avatar URL
- `coverUrl` - Profile cover image URL
- `category` - User category (PERSONAL, CREATOR, BUSINESS)
- `linkUrl` - External link URL
- `location` - User location
- `netWorth` - Net worth value
- `influenceScore` - Influence score

### Force Logout
**Permission Required:** `users.force_logout`

**Endpoint:** `POST /api/admin/users/:id/force-logout`

Immediately invalidates all active sessions for a user. Useful when:
- User reports account compromise
- Admin needs to revoke access immediately
- Testing session handling

**Audit Action:** `USER_FORCE_LOGOUT`

### Deactivate/Reactivate User
**Permission Required:** Admin access

**Endpoints:**
- `POST /api/admin/users/:id/deactivate` - Deactivates user and logs them out
- `POST /api/admin/users/:id/reactivate` - Reactivates deactivated user

**Audit Actions:** `USER_DEACTIVATED`, `USER_REACTIVATED`

---

## Content Management Extensions

### Posts Filtering
**Endpoint:** `GET /api/admin/posts`

**Query Parameters:**
| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `type` | string | TEXT, PHOTO, VIDEO, VOICE | Filter by post type |
| `visibility` | string | PUBLIC, FOLLOWERS, PRIVATE | Filter by visibility |
| `hidden` | boolean | true, false | Filter hidden posts |
| `deleted` | boolean | true, false | Filter soft-deleted posts |
| `limit` | number | 1-100 (default: 100) | Page size |
| `offset` | number | 0+ | Pagination offset |

### Hide/Unhide Posts
**Permission Required:** `content.hide` / `content.unhide`

**Endpoint:** `PATCH /api/admin/posts/:id`

```json
{
  "action": "hide",
  "reason": "Violation of community guidelines"
}
```

```json
{
  "action": "unhide"
}
```

**Audit Actions:** `CONTENT_HIDDEN`, `CONTENT_UNHIDDEN`

### Soft Delete Posts
**Permission Required:** `content.soft_delete`

**Endpoint:** `PATCH /api/admin/posts/:id`

```json
{
  "action": "soft_delete",
  "reason": "Optional deletion reason"
}
```

Soft delete marks the post as deleted without removing it from the database. The post can be recovered by admins if needed.

**Audit Action:** `CONTENT_SOFT_DELETED`

### Hard Delete Posts
**Permission Required:** SUPER_ADMIN only

**Endpoint:** `DELETE /api/admin/posts/:id`

Permanently removes the post from the database. This action is irreversible.

---

## Playlists Management

### List All Playlists
**Permission Required:** `playlists.view`

**Endpoint:** `GET /api/admin/playlists`

**Query Parameters:**
| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `type` | string | VIDEO, VOICE | Filter by playlist type |
| `userId` | string | UUID | Filter by user ID |
| `limit` | number | 1-100 (default: 100) | Page size |
| `offset` | number | 0+ | Pagination offset |

**Response:** Array of playlists with user details

### Delete Playlist
**Permission Required:** `playlists.manage`

**Endpoint:** `DELETE /api/admin/playlists/:id`

Removes a playlist and all its items.

**Audit Action:** `DELETE` (target_type: playlist)

---

## Featured Intros Management

Featured intros are custom content blocks displayed on user profiles.

### List All Featured Intros
**Permission Required:** `featured.view`

**Endpoint:** `GET /api/admin/featured-intros`

Returns all featured intros with associated user information.

### Delete Featured Intro
**Permission Required:** `featured.manage`

**Endpoint:** `DELETE /api/admin/featured-intros/:id`

Removes a user's featured intro.

**Audit Action:** `FEATURED_REMOVED`

---

## RBAC Permissions Reference

### User Management Permissions
| Permission | Description |
|------------|-------------|
| `users.settings.read` | View user settings |
| `users.settings.write` | Edit user settings |
| `users.force_logout` | Force logout user from all sessions |

### Content Management Permissions
| Permission | Description |
|------------|-------------|
| `content.hide` | Hide posts from public view |
| `content.unhide` | Unhide previously hidden posts |
| `content.soft_delete` | Soft delete posts (recoverable) |

### Playlist Permissions
| Permission | Description |
|------------|-------------|
| `playlists.view` | View all playlists |
| `playlists.manage` | Delete playlists |

### Featured Items Permissions
| Permission | Description |
|------------|-------------|
| `featured.view` | View all featured intros |
| `featured.manage` | Delete featured intros |

---

## Audit Action Types

### New Audit Actions
| Action | Target Type | Description |
|--------|-------------|-------------|
| `USER_FORCE_LOGOUT` | user | User forcibly logged out |
| `USER_DEACTIVATED` | user | User account deactivated |
| `USER_REACTIVATED` | user | User account reactivated |
| `CONTENT_HIDDEN` | post | Post hidden from public |
| `CONTENT_UNHIDDEN` | post | Post unhidden |
| `CONTENT_SOFT_DELETED` | post | Post soft deleted |
| `FEATURED_REMOVED` | featured_intro | Featured intro removed |

---

## Database Schema Additions

### Posts Table - Soft Delete Columns
```sql
deleted_at TIMESTAMP - When post was soft deleted
deleted_by_id VARCHAR - Admin who soft deleted
delete_reason TEXT - Reason for deletion
```

---

**Document Version:** 1.0  
**Last Updated:** January 15, 2026
