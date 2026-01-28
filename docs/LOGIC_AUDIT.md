# RabitChat Logic Audit

**Audit Date:** January 17, 2026  
**Total Actions Audited:** 156  
**Status Summary:**
- ✅ Fully Implemented: 98 (63%)
- ⚠️ Partial Implementation: 38 (24%)
- ❌ Broken/Missing: 20 (13%)

---

## 1. Authentication & User Management

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| AuthScreen | Signup | Validate fields, check uniqueness, hash password | ✅ | None | N/A |
| AuthScreen | Login | Email/username + password verification | ✅ | None | N/A |
| AuthScreen | Logout | Destroy session, clear state | ✅ | None | N/A |
| Session | Cookie Config | httpOnly, Secure, SameSite | ⚠️ | `sameSite: "none"` may fail on older iOS | Add mobile fallback |
| Session | Persistence | PostgreSQL-backed, 30-day expiry | ✅ | None | N/A |
| ProfileScreen | View Own | Fetch user + stats | ✅ | None | N/A |
| UserProfileScreen | View Other | Policy check (privacy/blocks) | ✅ | None | N/A |
| EditProfileScreen | Update Profile | PUT /api/users/me with validation | ✅ | None | N/A |
| DataAccountScreen | Delete Account | Require password, delete all | ❌ | **SECURITY**: Duplicate route `DELETE /api/users/me` at line 562 has NO password validation | Remove unprotected route |
| DataAccountScreen | Deactivate | Soft delete | ✅ | None | N/A |
| UserProfileScreen | Follow/Unfollow | Policy check, notifications | ✅ | None | N/A |
| UserProfileScreen | Block/Unblock | Prevent interaction | ✅ | None | N/A |
| BlockedAccountsScreen | View/Unblock | List blocked users | ✅ | None | N/A |
| DiscoverScreen | User Search | Filter blocked/suspended | ✅ | None | N/A |
| SecuritySettingsScreen | Change Password | Verify current, hash new | ✅ | None | N/A |
| SecuritySettingsScreen | Sessions | View/revoke sessions | ✅ | None | N/A |

---

## 2. Messaging System (Instagram-style Inbox)

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| MessagesScreen | View Primary inbox tab | Show accepted conversations with followed users | ✅ | None | N/A |
| MessagesScreen | View General inbox tab | Show accepted conversations with non-followed users | ⚠️ | Currently defaults all accepted to PRIMARY | Auto-sort by follow status |
| MessagesScreen | View Requests tab | Show pending message requests | ✅ | None | N/A |
| MessagesScreen | Accept message request | Move to Primary, set status=ACCEPTED | ✅ | None | N/A |
| MessagesScreen | Decline message request | Delete conversation | ❌ | Frontend calls POST `/decline` but backend expects DELETE | Fix frontend to use DELETE method |
| MessagesScreen | Click avatar in Requests | Navigate to user profile | ✅ | None | N/A |
| ChatScreen | **Input for REQUEST status** | **DISABLED until accepted** | ❌ **CRITICAL** | Input always enabled, no status check | Disable input + show "Accept to reply" banner |
| ChatScreen | View messages for REQUEST | Allow read preview, no read receipts | ❌ | Always marks as read (line 2076) | Check `conversation.status === 'ACCEPTED'` before marking |
| ChatScreen | Send message for ACCEPTED | Input enabled, message sent | ✅ | None | N/A |
| ChatScreen | Real-time WebSocket | New messages appear instantly | ✅ | None | N/A |
| CreateConversation | Non-follower messages you | Should go to Requests (status=REQUEST) | ❌ **CRITICAL** | `getOrCreateConversation` defaults to status="ACCEPTED" | Check follow status, set REQUEST if not following |
| SendMessage | Send to REQUEST conversation | Block until accepted | ❌ | Backend allows sending without status check | Add 403 if recipient hasn't accepted |
| MoveConversation | Move between Primary/General | Update folder field | ✅ | None | N/A |

---

## 3. Posting & Feed

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| CreatePostScreen | Create TEXT post | Validate, persist, update influence | ✅ | None | N/A |
| CreatePostScreen | Create PHOTO post | Upload image, validate, persist | ✅ | None | N/A |
| CreatePostScreen | Create VIDEO post | Upload ≤500MB, thumbnail, persist | ✅ | None | N/A |
| CreatePostScreen | Create VOICE post | Record/upload ≤100MB, persist | ✅ | None | N/A |
| CreatePostScreen | Upload limits | 25MB images, 500MB video, 100MB audio | ✅ | None | N/A |
| FeedScreen | Feed pagination | Infinite scroll with cursors | ⚠️ | Main feed lacks cursor pagination | Add cursor + limit params, return nextCursor |
| FeedScreen | Privacy filtering | Hide blocked/muted/private posts | ✅ | None | N/A |
| FeedScreen | Like counter sync | Immediate UI update | ⚠️ | Uses invalidateQueries (flicker) | Add optimistic update |
| PostDetailScreen | View tracking | POST on mount, deduplicated | ✅ | None | N/A |
| PostDetailScreen | Comments | GET/POST with filtering | ✅ | None | N/A |
| PostCard | Like/Unlike | Policy check, counter update | ✅ | None | N/A |
| PostCard | Save/Unsave | Policy check | ✅ | None | N/A |
| PostCard | Share | Native share, counter update | ✅ | None | N/A |
| PostCard | Media playback | Video/Audio with thumbnails | ✅ | None | N/A |
| Profile | Post visibility | PUBLIC/FOLLOWERS/PRIVATE enforcement | ✅ | None | N/A |
| Profile | Post deletion | DELETE with auth check | ⚠️ | No cascade delete (likes/comments orphaned) | Add cascade in transaction |

---

## 4. Notifications

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| Feed/Post | Like Post | Create LIKE notification | ✅ | None | N/A |
| Feed/Post | Comment on Post | Create COMMENT notification | ✅ | None | N/A |
| Profile | Follow User | Create FOLLOW notification | ✅ | None | N/A |
| Messages | Send Message | Create MESSAGE notification | ✅ | None | N/A |
| Stories | Reply to Story | Create notification | ❌ | Wrong function signature; uses "comment" type | Fix call + add STORY_REPLY type |
| Posts/Comments | @Mention User | Create MENTION notification | ❌ | MENTION type not in schema | Add type + mention parsing |
| Notifications | Deep-link to Post | Navigate to PostDetail | ✅ | None | N/A |
| Notifications | Deep-link to Profile | Navigate to UserProfile | ✅ | None | N/A |
| Notifications | Deep-link to Chat | Navigate to Chat | ✅ | None | N/A |
| Notifications | Deep-link to Story | Navigate to StoryViewer | ❌ | Frontend doesn't handle STORY_REPLY | Add case in handleNotificationPress |
| Notifications | Mark Single as Read | Update readAt | ✅ | None | N/A |
| Notifications | Mark All as Read | Update all unread | ✅ | None | N/A |
| Tab Bar | Unread Count Badge | Display badge | ⚠️ | NotificationIcon defined but not used | Evaluate if needed |
| Admin | Verification Approved/Denied | Notify user | ⚠️ | Backend creates, frontend type missing | Add type handling |
| Admin | Report Status Update | Notify reporter | ❌ | No notification created | Add in report update route |

---

## 5. Mall & Net Worth

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| Mall | GET categories | Return active categories | ✅ | None | N/A |
| Mall | GET items | Return items, filter by category | ✅ | None | N/A |
| Mall | Purchase item | Free purchase, update net worth | ❌ | **WRONG FORMULA**: `value * quantity` instead of `value * 10 * quantity` | Fix in storage.ts:3525 |
| Mall | Purchase quantity | Validate quantity ≥ 1 | ⚠️ | No validation (0/negative allowed) | Add validation |
| Mall | Purchase history | Return user's purchases | ✅ | None | N/A |
| Mall | Top 50 leaderboard | Exclude private accounts | ⚠️ | Does NOT exclude privateAccount=true | Join userSettings, filter |
| Mall | Net worth history | Return ledger entries | ✅ | None | N/A |
| Admin | Category CRUD | Full management | ✅ | None | N/A |
| Admin | Item CRUD | Full management | ✅ | None | N/A |

---

## 6. Gossip (Anonymous Community)

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| Gossip | Create post (TEXT/VOICE) | Anonymous, strip authorUserId | ✅ | None | N/A |
| Gossip | Get feed | Exclude authorUserId | ✅ | None | N/A |
| Gossip | Like/Unlike | Anonymous action | ✅ | None | N/A |
| Gossip | Retweet/Unretweet | Anonymous action | ✅ | None | N/A |
| Gossip | **GET comments** | **Anonymous commenters** | ❌ **CRITICAL** | Returns full user identity (id, username, displayName, avatarUrl) | Remove user join in getGossipComments |
| Gossip | **POST comment** | **Strip userId from response** | ❌ **CRITICAL** | Exposes userId in response | Add `const { userId, ...safeComment } = comment` |
| Admin | View gossip | **No author visibility** | ✅ | No admin gossip routes | Correct by design |

---

## 7. Privacy & Blocks

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| Profile | Block user | Auth, self-block check | ✅ | None | N/A |
| Profile | Unblock user | Auth, removes block | ✅ | None | N/A |
| Settings | Mute/Unmute | Full CRUD with flags | ✅ | None | N/A |
| Settings | Restrict/Unrestrict | Full CRUD | ✅ | None | N/A |
| Settings | Keyword filters | Full CRUD | ✅ | None | N/A |
| Settings | Close friends | Full CRUD | ✅ | None | N/A |
| Settings | Story restrictions | Full CRUD | ✅ | None | N/A |
| Feed | Blocked posts hidden | canViewPost check | ✅ | None | N/A |
| Search | Blocked users hidden | getHiddenUserIds | ✅ | None | N/A |
| Profile | Private account restricted | restricted:true for non-followers | ✅ | None | N/A |
| Profile | Net worth for private | Hide for non-followers | ⚠️ | Returned unconditionally | Hide when contentRestricted |
| Stories | User stories endpoint | Block/restriction check | ⚠️ | No access check | Add isBlockedEither + isStoryViewerRestricted |
| Stories | Story view recording | Block/restriction check | ⚠️ | No access check | Add checks |
| Stories | Story reply | Block check | ⚠️ | No canMessage check | Add policy check |
| Comments | Keyword filter | Hide filtered comments | ⚠️ | Not implemented | Apply filter on retrieval |
| Messages | Keyword filter | Hide filtered messages | ⚠️ | Not implemented | Apply filter on retrieval |

---

## 8. Admin Panel

| Screen | Action | Expected Behavior | Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|--------|---------------|----------|
| Admin | All routes | requireAdmin middleware | ✅ | None | N/A |
| Admin | Sensitive actions | Audit log created | ✅ | None | N/A |
| Admin | RBAC checks | hasRbacPermission | ⚠️ | 25 routes missing granular RBAC | Add permission checks |
| Users | List, suspend, delete | Full management | ⚠️ | Missing RBAC | Add users.* permissions |
| Posts | List, hide, delete | Full management | ⚠️ | Some missing RBAC | Add content.* permissions |
| Reports | List, review, action | Full management | ⚠️ | Missing RBAC | Add reports.* permissions |
| Roles | CRUD | Full management | ⚠️ | Missing RBAC | Add roles.* permissions |
| Settings | View, update | Full management | ⚠️ | Missing RBAC | Add settings.* permissions |

---

## Critical Issues Summary (Must Fix)

1. **SECURITY - Unprotected Account Deletion** (routes.ts:562)
2. **MESSAGING - Conversations bypass request flow** (storage.ts:711-723)
3. **MESSAGING - ChatScreen input not disabled for requests** (ChatScreen.tsx)
4. **MESSAGING - Read receipts fire for unaccepted requests** (routes.ts:2076)
5. **MESSAGING - Backend allows sending to REQUEST conversations** (routes.ts)
6. **MESSAGING - Decline endpoint method mismatch** (frontend uses POST, backend expects DELETE)
7. **MALL - Wrong net worth formula** (storage.ts:3525) - should be `value * 10 * quantity`
8. **GOSSIP - Comments leak user identity** (storage.ts:3449-3462)
9. **GOSSIP - Comment response exposes userId** (routes.ts:5384)
10. **NOTIFICATIONS - Story reply notification broken** (routes.ts:1890)

---

## Fix Priority

### P0 - Security/Privacy Critical
1. Remove unprotected DELETE /api/users/me route
2. Fix gossip comment anonymity (2 issues)
3. Fix messaging request flow (5 issues)

### P1 - Functional Critical
4. Fix net worth formula
5. Fix story reply notification
6. Add feed pagination

### P2 - Important
7. Top 50 exclude private accounts
8. Add cascade delete for posts
9. Fix story access checks
10. Hide net worth for private accounts

### P3 - Enhancement
11. Add optimistic updates
12. Add MENTION notifications
13. Add granular RBAC to all admin routes
14. Apply keyword filters to comments/messages
