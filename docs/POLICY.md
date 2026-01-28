# RabitChat Policy Engine

## Overview

The policy engine (`server/policy.ts`) provides centralized access control for all user interactions in RabitChat. It enforces privacy settings, blocking rules, visibility controls, and admin overrides across all API endpoints.

## Core Concepts

### ViewerContext

Every policy check starts with a `ViewerContext` that represents the requesting user:

```typescript
interface ViewerContext {
  user: User | null;
  userId: string | null;
  roles: Role[];
  permissions: string[];
  settings: UserSettings | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}
```

Use `getViewerContext(userId)` to create this context at the start of request handling.

### PolicyResult

All policy functions return a `PolicyResult`:

```typescript
interface PolicyResult {
  allowed: boolean;
  reason?: string;      // Human-readable denial reason
  restricted?: boolean; // True for private accounts (shows limited profile header)
}
```

## Policy Functions

### `canViewProfile(viewer, targetUser)`

Determines if a viewer can see another user's full profile.

**Checks performed:**
1. Self-view always allowed
2. Suspended accounts hidden (admins with `users.read` can bypass)
3. Blocked users cannot view each other (admins with `users.read` can bypass)
4. Private accounts only visible to followers (admins with `users.read` can bypass)

**Returns `restricted: true`** for private accounts when denied (allows displaying limited header info like username, display name, and avatar).

### `canViewPost(viewer, post, postAuthor?)`

Determines if a viewer can see a specific post.

**Checks performed:**
1. Author always sees their own posts
2. Hidden posts only visible to admins with `posts.read`
3. Blocked users cannot view each other's posts (admin bypass available)
4. Visibility levels:
   - `PUBLIC`: Everyone can view
   - `FOLLOWERS`: Only followers and author can view
   - `PRIVATE`: Only author can view (admins with `posts.read` can bypass)

### `canComment(viewer, post, authorSettings?)`

Determines if a viewer can comment on a post.

**Checks performed:**
1. Must be logged in
2. Author can always comment on their own posts
3. Cannot comment on hidden posts
4. Respects `post.commentsEnabled` flag
5. Blocked users cannot comment on each other's posts
6. Respects author's `commentPolicy`:
   - `EVERYONE`: Anyone can comment
   - `FOLLOWERS`: Only followers can comment
   - `NOBODY`: No one can comment

### `canMessage(viewer, targetUser, targetSettings?)`

Determines if a viewer can send a message to another user.

**Checks performed:**
1. Must be logged in
2. Cannot message suspended users
3. Blocked users cannot message each other (admins with `users.support.contact` can bypass)
4. Respects target's `messagePolicy`:
   - `EVERYONE`: Anyone can message
   - `FOLLOWERS`: Only users they follow can message
   - `NOBODY`: No messages allowed

**Special Permission:** Admins with `users.support.contact` permission can bypass blocking and message policies for support purposes.

### `canMention(viewer, targetUser, targetSettings?)`

Determines if a viewer can @mention another user.

**Checks performed:**
1. Must be logged in
2. Self-mention always allowed
3. Blocked users cannot mention each other
4. Respects target's `mentionPolicy`:
   - `EVERYONE`: Anyone can mention
   - `FOLLOWERS`: Only users they follow can mention
   - `NOBODY`: No mentions allowed

### `canFollow(viewer, targetUser)`

Determines if a viewer can follow another user.

**Checks performed:**
1. Must be logged in
2. Cannot follow yourself
3. Cannot follow suspended users
4. Blocked users cannot follow each other

### `canLike(viewer, post)`

Determines if a viewer can like a post.

**Checks performed:**
1. Must be logged in
2. Cannot like hidden posts
3. Blocked users cannot like each other's posts
4. Must be able to view the post (calls `canViewPost` internally)

## Batch Filtering

### `filterPostsForViewer(viewer, posts)`

Filters an array of posts to only those the viewer can see. Used for feed, search, and user profile post listings.

### `filterUsersForViewer(viewer, users)`

Returns users with `canView` flag indicating profile visibility status.

## Admin Override Rules

| Permission | Allows Override Of |
|------------|-------------------|
| `users.read` | Profile viewing (suspended/blocked/private accounts) |
| `posts.read` | Post viewing (hidden posts, visibility restrictions) |
| `users.support.contact` | Messaging (blocked users, message policies) |

Super admins (`SUPER_ADMIN` role or `isAdmin: true`) automatically have all permissions.

## Usage in Routes

```typescript
import { 
  getViewerContext, 
  canViewProfile, 
  canMessage,
  filterPostsForViewer 
} from "./policy";

app.get("/api/users/:id", requireAuth, async (req, res) => {
  const viewer = await getViewerContext(req.session.userId);
  const targetUser = await storage.getUser(req.params.id);
  
  const access = await canViewProfile(viewer, targetUser);
  
  if (!access.allowed) {
    if (access.restricted) {
      // Return limited profile info
      return res.json({ 
        username: targetUser.username,
        displayName: targetUser.displayName,
        avatarUrl: targetUser.avatarUrl,
        restricted: true 
      });
    }
    return res.status(403).json({ message: access.reason });
  }
  
  // Return full profile
  res.json(targetUser);
});
```

## Default Settings

When a user has no settings record, these defaults are used:

```typescript
const DEFAULT_SETTINGS = {
  privateAccount: false,
  commentPolicy: "EVERYONE",
  messagePolicy: "EVERYONE",
  mentionPolicy: "EVERYONE",
};
```

## Error Responses

All policy denials should return HTTP 403 with a JSON body:

```json
{
  "message": "Human-readable denial reason"
}
```

## Endpoints Using Policy Engine

- `GET /api/users/:id` - Profile viewing
- `GET /api/users/:id/posts` - User's posts listing
- `GET /api/users/search` - User search (filters suspended users)
- `POST /api/users/:id/follow` - Following users
- `GET /api/posts` - All posts listing
- `GET /api/posts/feed` - User's feed
- `GET /api/posts/search` - Post search
- `GET /api/posts/:id` - Individual post viewing
- `POST /api/posts/:id/like` - Liking posts
- `DELETE /api/posts/:id/like` - Unliking posts
- `GET /api/posts/:id/comments` - Viewing comments
- `POST /api/posts/:id/comments` - Creating comments
- `POST /api/conversations` - Starting conversations
- `POST /api/conversations/:id/messages` - Sending messages

## Privacy Settings Reference

### User Settings (`user_settings` table)

| Setting | Type | Values | Default |
|---------|------|--------|---------|
| `privateAccount` | boolean | true/false | false |
| `commentPolicy` | enum | EVERYONE, FOLLOWERS, NOBODY | EVERYONE |
| `messagePolicy` | enum | EVERYONE, FOLLOWERS, NOBODY | EVERYONE |
| `mentionPolicy` | enum | EVERYONE, FOLLOWERS, NOBODY | EVERYONE |

### Post Settings

| Setting | Type | Values | Default |
|---------|------|--------|---------|
| `visibility` | enum | PUBLIC, FOLLOWERS, PRIVATE | PUBLIC |
| `commentsEnabled` | boolean | true/false | true |
| `isHidden` | boolean | true/false | false |

## Related Documentation

- [Database Schema](/docs/DB_SCHEMA.md) - Full table definitions
- [Admin Features](/docs/ADMIN_SUMMARY.md) - Admin panel and moderation
- [RBAC System](/docs/RBAC.md) - Role and permission management
