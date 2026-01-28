# RabitChat UI Map

This document maps all user-facing actions to their corresponding API endpoints.

## Authentication

| Screen | Action | API Endpoint | Method |
|--------|--------|--------------|--------|
| SignUpScreen | Create account | `/api/auth/signup` | POST |
| LoginScreen | Sign in | `/api/auth/login` | POST |
| SettingsScreen | Sign out | `/api/auth/logout` | POST |
| - | Get current user | `/api/auth/me` | GET |

## Feed & Posts

| Screen | Action | API Endpoint | Method |
|--------|--------|--------------|--------|
| FeedScreen | View feed posts | `/api/posts/feed` | GET |
| FeedScreen | Like/unlike post | `/api/posts/:id/like` | POST/DELETE |
| DiscoverScreen | Browse all posts | `/api/posts` | GET |
| DiscoverScreen | Search posts | `/api/posts/search?q=` | GET |
| DiscoverScreen | Like/unlike post | `/api/posts/:id/like` | POST/DELETE |
| CreatePostScreen | Create new post | `/api/posts` | POST |
| PostDetailScreen | View post details | `/api/posts/:id` | GET |
| PostDetailScreen | Like/unlike post | `/api/posts/:id/like` | POST/DELETE |
| PostDetailScreen | View comments | `/api/posts/:id/comments` | GET |
| PostDetailScreen | Add comment | `/api/posts/:id/comments` | POST |
| - | Delete own post | `/api/posts/:id` | DELETE |

## Users & Profiles

| Screen | Action | API Endpoint | Method |
|--------|--------|--------------|--------|
| ProfileScreen | View own profile | `/api/users/:id` | GET |
| ProfileScreen | View own posts | `/api/users/:id/posts` | GET |
| ProfileScreen | Like own posts | `/api/posts/:id/like` | POST/DELETE |
| EditProfileScreen | Update profile | `/api/users/me` | PUT |
| UserProfileScreen | View other user | `/api/users/:id` | GET |
| UserProfileScreen | View user's posts | `/api/users/:id/posts` | GET |
| UserProfileScreen | Like user's posts | `/api/posts/:id/like` | POST/DELETE |
| UserProfileScreen | Follow/unfollow | `/api/users/:id/follow` | POST/DELETE |
| UserProfileScreen | Start conversation | `/api/conversations` | POST |
| DiscoverScreen | Search users | `/api/users/search?q=` | GET |
| - | View followers | `/api/users/:id/followers` | GET |
| - | View following | `/api/users/:id/following` | GET |

## Messaging

| Screen | Action | API Endpoint | Method |
|--------|--------|--------------|--------|
| MessagesScreen | View conversations | `/api/conversations` | GET |
| ChatScreen | Get messages | `/api/conversations/:id/messages` | GET |
| ChatScreen | Send message | `/api/conversations/:id/messages` | POST |
| - | Create conversation | `/api/conversations` | POST |

## Account Management

| Screen | Action | API Endpoint | Method |
|--------|--------|--------------|--------|
| SettingsScreen | Delete account | `/api/users/me` | DELETE |

## Real-time (WebSocket)

| Feature | WebSocket Path | Message Type |
|---------|----------------|--------------|
| Chat | `/ws` | `new_message` |
| Connection | `/ws` | `auth_success`, `auth_error` |
| Keep-alive | `/ws` | `ping`/`pong` |

## Notes

- All authenticated endpoints require session cookies
- WebSocket authentication uses session cookies only (no URL parameters)
- Like endpoints are idempotent (liking twice returns same result)
- Follow endpoints prevent self-following
- Delete account cascades to all related data (posts, comments, likes, follows, messages, conversations)
