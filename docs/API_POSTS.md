# Posts API Documentation

## Overview

The Posts API provides endpoints for creating, retrieving, and interacting with posts. Posts can be of four types: TEXT, PHOTO, VIDEO, and VOICE. All endpoints require authentication.

## Post Types

| Type | Required Fields | Optional Fields |
|------|-----------------|-----------------|
| TEXT | content | - |
| PHOTO | mediaUrl | caption, aspectRatio |
| VIDEO | mediaUrl, thumbnailUrl, durationMs | caption, aspectRatio |
| VOICE | mediaUrl, thumbnailUrl, durationMs | caption |

## Visibility Options

- `PUBLIC` - Visible to everyone
- `FOLLOWERS` - Visible only to followers
- `PRIVATE` - Visible only to the author

---

## Endpoints

### Create Post

**POST** `/api/posts`

Creates a new post.

**Request Body:**
```json
{
  "type": "TEXT | PHOTO | VIDEO | VOICE",
  "content": "string (required for TEXT)",
  "caption": "string (optional, max 500 chars)",
  "mediaUrl": "string (required for PHOTO/VIDEO/VOICE)",
  "thumbnailUrl": "string (required for VIDEO/VOICE)",
  "durationMs": "number (required for VIDEO/VOICE)",
  "aspectRatio": "number (optional)",
  "visibility": "PUBLIC | FOLLOWERS | PRIVATE",
  "commentsEnabled": "boolean (default: true)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "authorId": "uuid",
  "type": "TEXT",
  "content": "Hello world!",
  "visibility": "PUBLIC",
  "likesCount": 0,
  "commentsCount": 0,
  "savesCount": 0,
  "sharesCount": 0,
  "viewsCount": 0,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "author": { ... },
  "hasLiked": false,
  "hasSaved": false
}
```

---

### Get All Posts

**GET** `/api/posts`

Returns all visible posts.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "type": "TEXT",
    "content": "...",
    "author": { ... },
    "hasLiked": true,
    "hasSaved": false,
    "likesCount": 5,
    "commentsCount": 2,
    "savesCount": 1,
    "sharesCount": 0,
    "viewsCount": 100
  }
]
```

---

### Get Feed Posts

**GET** `/api/posts/feed`

Returns posts from followed users and the current user.

**Response:** Same as Get All Posts

---

### Search Posts

**GET** `/api/posts/search?q={query}`

Searches posts by content.

**Query Parameters:**
- `q` - Search query string

**Response:** Same as Get All Posts

---

### Get Single Post

**GET** `/api/posts/:id`

Returns a single post by ID.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "type": "VIDEO",
  "mediaUrl": "https://...",
  "thumbnailUrl": "https://...",
  "durationMs": 30000,
  "caption": "Check out this video!",
  "author": { ... },
  "hasLiked": false,
  "hasSaved": true
}
```

**Errors:**
- `404` - Post not found
- `403` - Not allowed to view (privacy/blocked)

---

### Delete Post

**DELETE** `/api/posts/:id`

Deletes a post. Only the author can delete their own posts.

**Response:** `200 OK`
```json
{ "message": "Post deleted" }
```

---

## Interactions

### Like Post

**POST** `/api/posts/:id/like`

Likes a post. Creates a notification for the post author.

**Response:** `200 OK`
```json
{ "message": "Liked" }
```

---

### Unlike Post

**DELETE** `/api/posts/:id/like`

Removes a like from a post.

**Response:** `200 OK`
```json
{ "message": "Unliked" }
```

---

### Save Post (Bookmark)

**POST** `/api/posts/:id/save`

Saves a post to the user's bookmarks.

**Response:** `200 OK`
```json
{ "message": "Post saved", "saved": true }
```

---

### Unsave Post

**DELETE** `/api/posts/:id/save`

Removes a post from bookmarks.

**Response:** `200 OK`
```json
{ "message": "Post unsaved", "saved": false }
```

---

### Share Post

**POST** `/api/posts/:id/share`

Records a share action. Increments the share count.

**Request Body (optional):**
```json
{
  "platform": "twitter | facebook | instagram | copy_link"
}
```

**Response:** `200 OK`
```json
{ "message": "Share recorded", "shareId": "uuid" }
```

---

### View Post

**POST** `/api/posts/:id/view`

Records a view for VIDEO/VOICE posts. Each user can only increment the view count once per post.

**Response:** `200 OK`
```json
{ "message": "View recorded", "isNew": true }
```

Or if already viewed:
```json
{ "message": "Already viewed", "isNew": false }
```

---

### Get User Bookmarks

**GET** `/api/bookmarks`

Returns all posts saved by the current user.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "type": "PHOTO",
    "mediaUrl": "https://...",
    "author": { ... },
    "hasLiked": true,
    "hasSaved": true
  }
]
```

---

## Comments

### Get Post Comments

**GET** `/api/posts/:id/comments`

Returns all comments on a post.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "content": "Great post!",
    "authorId": "uuid",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "author": { ... }
  }
]
```

---

### Create Comment

**POST** `/api/posts/:id/comments`

Adds a comment to a post.

**Request Body:**
```json
{
  "content": "string (required, max 1000 chars)"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "content": "Great post!",
  "author": { ... }
}
```

---

## Policy Enforcement

All post endpoints are subject to the centralized policy engine:

- **Visibility**: Posts are filtered based on visibility settings
- **Blocking**: Posts from blocked users are hidden
- **Admin Override**: Admins with `users.read` permission can view hidden posts
- **Comments**: Can be disabled per-post via `commentsEnabled` field

See `/docs/POLICY.md` for full policy documentation.

---

## Rate Limiting

- **Create Post**: Limited by `postLimiter`
- **Create Comment**: Limited by `commentLimiter`
- Other interactions: Standard rate limits apply

---

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid type, missing fields) |
| 401 | Not authenticated |
| 403 | Not authorized (privacy, blocked, or post hidden) |
| 404 | Post not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
