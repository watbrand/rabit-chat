# Profile API Documentation

**Last Updated:** January 15, 2026

## Overview

The Profile API powers the user profile experience including header data, featured content, tab-based content grids, and vertical swipe viewers. All endpoints apply strict privacy policies and admin overrides.

---

## Privacy & Access Control

### Profile Visibility Rules

1. **Public profiles**: Visible to all users (authenticated or not)
2. **Private profiles**: Only visible to:
   - The profile owner
   - Users who follow the profile owner
   - Admins with `users.read` permission

3. **Blocked users**: Cannot see each other's profiles unless admin with `users.read` permission

4. **Suspended accounts**: Only visible to admins with `users.read` permission

### Post Visibility Rules

Posts are filtered by visibility setting:
- **PUBLIC**: Visible to everyone
- **FOLLOWERS**: Only visible to followers and the author
- **PRIVATE**: Only visible to the author and admins with `posts.read` permission

Hidden posts are excluded unless viewer has admin `posts.read` permission.

---

## Endpoints

### GET `/api/users/:username/profile`

Returns full profile header data with relationship and privacy status.

**Authentication:** Optional (more data available when authenticated)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "johndoe",
  "displayName": "John Doe",
  "bio": "Entrepreneur & Investor",
  "avatarUrl": "https://...",
  "coverUrl": "https://...",
  "category": "CREATOR",
  "location": "New York, NY",
  "linkUrl": "https://example.com",
  "netWorth": 1000000,
  "influenceScore": 5000,
  "verified": true,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "counts": {
    "posts": 42,
    "followers": 1500,
    "following": 200,
    "totalLikes": 25000
  },
  "relationship": {
    "isFollowing": false,
    "isBlocked": false,
    "canMessage": true
  },
  "privacy": {
    "isPrivate": false,
    "viewerCanSeeContent": true
  },
  "contentRestricted": false
}
```

**Notes:**
- `contentRestricted=true` indicates the viewer cannot see posts/featured content
- `relationship` is only populated for authenticated viewers viewing other profiles
- `verified` is derived from `isAdmin` status

**Errors:**
| Status | Message |
|--------|---------|
| 404 | "User not found" |

---

### GET `/api/users/:username/featured`

Returns pinned posts (max 3), playlists summary, and featured intro card.

**Authentication:** Optional

**Response:** `200 OK`
```json
{
  "pinnedPosts": [
    {
      "id": "post-uuid",
      "type": "VIDEO",
      "thumbnailUrl": "https://...",
      "mediaUrl": "https://...",
      "durationMs": 30000,
      "caption": "My best video",
      "likesCount": 500,
      "viewsCount": 10000,
      "commentsCount": 45,
      "hasLiked": false,
      "hasSaved": false,
      "author": { ... }
    }
  ],
  "playlists": [
    {
      "id": "playlist-uuid",
      "title": "My Videos",
      "type": "VIDEO",
      "itemCount": 12,
      "isPublic": true
    }
  ],
  "featuredIntro": {
    "id": "intro-uuid",
    "title": "Welcome!",
    "body": "Check out my latest content...",
    "ctaText": "Learn More",
    "ctaUrl": "https://example.com"
  }
}
```

**Notes:**
- Pinned posts are limited to max 3
- Only public playlists are returned
- Posts are filtered by visibility policy
- `featuredIntro` is `null` if not set

**Errors:**
| Status | Message |
|--------|---------|
| 403 | "Cannot view this profile" (with `restricted: true` for private accounts) |
| 404 | "User not found" |

---

### GET `/api/users/:username/posts`

Returns posts for the profile grid, supporting tab filtering and cursor pagination.

**Authentication:** Optional

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `tab` | string | "ALL" | Filter: ALL, VIDEO, PHOTO, VOICE, TEXT, PINNED |
| `cursor` | string | - | ISO timestamp for pagination |
| `limit` | number | 24 | Items per page (max 50) |

**Response:** `200 OK`
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "type": "VIDEO",
      "thumbnailUrl": "https://...",
      "durationMs": 30000,
      "likesCount": 100,
      "viewsCount": 5000,
      "commentsCount": 10,
      "isPinned": false
    }
  ],
  "nextCursor": "2025-01-15T10:00:00.000Z"
}
```

**Notes:**
- Response is optimized for 4-column grid tiles
- `nextCursor` is `null` when no more pages
- `PINNED` tab returns all pinned posts without pagination
- `isPinned` only present for PINNED tab

**Errors:**
| Status | Message |
|--------|---------|
| 403 | "Cannot view this profile" |
| 404 | "User not found" |

---

### GET `/api/users/:username/swipe`

Returns posts with full detail for vertical swipe viewer.

**Authentication:** Optional

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `cursor` | string | - | ISO timestamp for pagination |
| `limit` | number | 10 | Items per page (max 20) |

**Response:** `200 OK`
```json
{
  "posts": [
    {
      "id": "post-uuid",
      "type": "VIDEO",
      "content": null,
      "caption": "Check this out!",
      "mediaUrl": "https://...",
      "thumbnailUrl": "https://...",
      "durationMs": 30000,
      "aspectRatio": 1.78,
      "likesCount": 100,
      "commentsCount": 10,
      "sharesCount": 5,
      "viewsCount": 5000,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "hasLiked": false,
      "hasSaved": false,
      "author": {
        "id": "user-uuid",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://...",
        "verified": true
      }
    }
  ],
  "nextCursor": "2025-01-15T09:00:00.000Z"
}
```

**Notes:**
- Richer payload than grid endpoint for full-screen viewing
- Author info is compact (no password, only essential fields)
- Policy-filtered per post

---

## Current User Endpoints

### POST `/api/me/pins`

Set pinned posts (replaces all current pins).

**Authentication:** Required

**Request Body:**
```json
{
  "postIds": ["post-uuid-1", "post-uuid-2", "post-uuid-3"]
}
```

**Response:** `200 OK`
```json
{
  "pins": [...],
  "message": "Pins updated successfully"
}
```

**Validation:**
- Maximum 3 posts allowed
- All posts must belong to the authenticated user
- Posts must exist

**Errors:**
| Status | Message |
|--------|---------|
| 400 | "postIds must be an array" |
| 400 | "Maximum 3 pinned posts allowed" |
| 403 | "Can only pin your own posts" |
| 404 | "Post not found: {id}" |

---

### GET `/api/me/pins`

Get current user's pinned posts with full post data.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "pin-uuid",
    "userId": "user-uuid",
    "postId": "post-uuid",
    "order": 0,
    "post": { ... }
  }
]
```

---

### POST `/api/me/playlists`

Create a new playlist.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "My Video Collection",
  "type": "VIDEO",
  "description": "Best videos"
}
```

**Response:** `201 Created`
```json
{
  "id": "playlist-uuid",
  "userId": "user-uuid",
  "title": "My Video Collection",
  "type": "VIDEO",
  "description": "Best videos",
  "isPublic": true,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Validation:**
- `title`: Required, max 100 characters
- `type`: Required, must be "VIDEO" or "VOICE"
- `description`: Optional

---

### GET `/api/me/playlists`

Get current user's playlists summary.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "playlist-uuid",
    "title": "My Videos",
    "type": "VIDEO",
    "itemCount": 12,
    "isPublic": true
  }
]
```

---

### GET `/api/playlists/:id`

Get playlist with all items.

**Authentication:** Optional (required for private playlists)

**Response:** `200 OK`
```json
{
  "id": "playlist-uuid",
  "title": "My Videos",
  "type": "VIDEO",
  "description": "Best videos",
  "isPublic": true,
  "items": [
    {
      "id": "item-uuid",
      "postId": "post-uuid",
      "order": 0,
      "post": { ... }
    }
  ]
}
```

**Errors:**
| Status | Message |
|--------|---------|
| 403 | "This playlist is private" |
| 404 | "Playlist not found" |

---

### PATCH `/api/playlists/:id`

Update playlist metadata.

**Authentication:** Required (must be owner)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "New description",
  "isPublic": false
}
```

**Response:** `200 OK` (updated playlist)

---

### DELETE `/api/playlists/:id`

Delete a playlist.

**Authentication:** Required (must be owner)

**Response:** `200 OK`
```json
{
  "message": "Playlist deleted"
}
```

---

### POST `/api/playlists/:id/items`

Add a post to playlist.

**Authentication:** Required (must be owner)

**Request Body:**
```json
{
  "postId": "post-uuid"
}
```

**Response:** `201 Created`

**Validation:**
- Post must belong to authenticated user
- Post type must match playlist type (VIDEO playlist = VIDEO posts only)

**Errors:**
| Status | Message |
|--------|---------|
| 400 | "This playlist only accepts video posts" |
| 403 | "Can only add your own posts to playlists" |
| 404 | "Post not found" |

---

### DELETE `/api/playlists/:id/items/:postId`

Remove a post from playlist.

**Authentication:** Required (must be owner)

**Response:** `200 OK`
```json
{
  "message": "Item removed from playlist"
}
```

---

### GET `/api/me/featured-intro`

Get current user's featured intro card.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "id": "intro-uuid",
  "title": "Welcome!",
  "body": "Check out my content...",
  "ctaText": "Learn More",
  "ctaUrl": "https://example.com",
  "updatedAt": "..."
}
```

Returns `null` if not set.

---

### PATCH `/api/me/featured-intro`

Create or update featured intro card.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Welcome!",
  "body": "Check out my latest content and connect with me.",
  "ctaText": "Learn More",
  "ctaUrl": "https://example.com"
}
```

**Response:** `200 OK` (created or updated intro)

**Validation:**
- `title`: Required, max 100 characters
- `body`: Required
- `ctaText`: Optional, max 50 characters
- `ctaUrl`: Optional, must be valid URL (http/https)

---

### DELETE `/api/me/featured-intro`

Delete featured intro card.

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "message": "Featured intro deleted"
}
```

---

## Admin Overrides

Admins with appropriate permissions can bypass privacy restrictions:

| Permission | Override |
|------------|----------|
| `users.read` | View private profiles, suspended accounts, blocked users |
| `posts.read` | View hidden posts, private/followers-only posts |

---

## Related Documentation

- [Posts API](./API_POSTS.md)
- [Policy Engine](./POLICY.md)
- [Media Upload](./MEDIA.md)
- [Database Schema](./DB_SCHEMA.md)
