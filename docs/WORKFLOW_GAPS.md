# RabitChat Workflow Gaps Analysis

**Analysis Date:** January 17, 2026

This document compares RabitChat workflows against Instagram, TikTok, Facebook, and Twitter/X to identify gaps and loopholes.

---

## A) Auth + Session Persistence

### Reference: Instagram/TikTok/Facebook
- Sessions persist across app restarts and reinstalls
- Token refresh happens silently in background
- Multi-device login with session management
- Force logout capability for security

### RabitChat Status: ✅ Mostly Working
- PostgreSQL-backed sessions with 30-day expiry
- Session management with device tracking
- Force logout implemented

### Gap Found
| Issue | Status | Fix |
|-------|--------|-----|
| `SameSite: "none"` may fail on iOS 12 | ⚠️ | Add fallback cookie strategy |

---

## B) Posting Workflows

### Reference: Instagram/TikTok
- Upload → validate → create → view → interact → persist
- Video plays everywhere with range request support
- Strict upload limits enforced client AND server side
- Thumbnails generated automatically

### RabitChat Status: ✅ Working
- All 4 types (TEXT, PHOTO, VIDEO, VOICE) implemented
- Cloudinary handles media with CORS/range requests
- Upload limits: 25MB images, 500MB video, 100MB audio
- Thumbnails generated for video

### Gaps Found
| Issue | Status | Fix |
|-------|--------|-----|
| Feed lacks cursor pagination | ⚠️ | Add cursor + nextCursor to /api/posts/feed |
| Post deletion doesn't cascade | ⚠️ | Add transaction to delete likes/comments/bookmarks |
| Counter updates cause UI flicker | ⚠️ | Add optimistic updates with setQueryData |

---

## C) Feed + Profile Browsing

### Reference: Instagram/Facebook
- Infinite scroll with smooth pagination
- Viewer flags (liked/saved/following) loaded inline
- Strict privacy: private accounts show "This account is private"
- Full-screen open from grid returns to correct scroll position

### RabitChat Status: ✅ Mostly Working
- Viewer flags loaded with posts
- Privacy enforcement via canViewPost/canViewProfile
- Grid navigation works

### Gap Found
| Issue | Status | Fix |
|-------|--------|-----|
| Feed pagination missing | ⚠️ | Implement cursor-based pagination |

---

## D) Full-Screen Viewers

### Reference: Instagram/Facebook (Images), TikTok (Videos)
- Image tap opens full-screen viewer with pinch-zoom
- Video opens reels-style vertical player
- Queue continues: current user's posts → recommendations
- Double-tap to like, swipe to dismiss

### RabitChat Status: ✅ Implemented
- ImageViewer with pinch-zoom
- ExploreReelsScreen for TikTok-style video viewing
- Swipe navigation between reels
- Video overlay actions (like, comment, share)

---

## E) Messaging System (Instagram-style)

### Reference: Instagram DMs
- **Tabs**: Primary (followed), General (others), Requests (pending)
- **Requests flow**:
  - Message from non-follower → Requests
  - Can preview message content
  - No read receipts until accepted
  - Input DISABLED until accepted
  - Accept → moves to Primary
- **Moving**: Can move between Primary/General
- **Profile access**: Can view sender profile before accepting

### RabitChat Status: ❌ CRITICAL GAPS

| Required State | Expected | Current | Gap |
|---------------|----------|---------|-----|
| Conversation status | REQUEST for non-followers | Always ACCEPTED | ❌ Bypasses request system entirely |
| Input state | Disabled for REQUEST | Always enabled | ❌ Can reply without accepting |
| Read receipts | None until accepted | Always fired | ❌ Privacy violation |
| Send permission | Blocked for recipient | Always allowed | ❌ Backend doesn't enforce |
| Decline method | DELETE request | POST (wrong) | ❌ 404 error |

### Required Fixes
1. `storage.ts:getOrCreateConversation` - Check follow status, set REQUEST if not following
2. `ChatScreen.tsx` - Fetch conversation status, disable input if REQUEST
3. `routes.ts:2076` - Only mark read if status=ACCEPTED
4. `routes.ts` - Block send if REQUEST and user is recipient
5. `MessagesScreen.tsx` - Change decline to DELETE method

---

## F) Notifications System (Instagram/Facebook style)

### Reference: Instagram/Facebook
- Every interaction creates notification (like, comment, follow, message, mention, story reply)
- Notification click deep-links to EXACT target
- Unread badge on tab icon
- Types: like, comment, follow, message, mention, story_reply, verification_update

### RabitChat Status: ⚠️ Partial

| Notification Type | Backend | Frontend Deep-link | Status |
|------------------|---------|-------------------|--------|
| LIKE | ✅ | ✅ PostDetail | Working |
| COMMENT | ✅ | ✅ PostDetail | Working |
| FOLLOW | ✅ | ✅ UserProfile | Working |
| MESSAGE | ✅ | ✅ Chat | Working |
| STORY_REPLY | ❌ Broken call | ❌ Not handled | Broken |
| MENTION | ❌ Missing | ❌ Missing | Missing |
| VERIFICATION | ✅ Backend | ❌ Not handled | Partial |

### Required Fixes
1. Fix story reply notification (wrong function signature at routes.ts:1890)
2. Add MENTION notification type + parsing logic
3. Add frontend handling for STORY_REPLY and VERIFICATION types

---

## G) Privacy + Blocks

### Reference: Instagram/Facebook
- Blocks override EVERYTHING
- Private accounts: "This account is private"
- Hidden net worth for private users (unless follower)
- Muted users don't appear in feed

### RabitChat Status: ✅ Mostly Working

| Policy | Enforcement | Status |
|--------|-------------|--------|
| Blocks in feed | canViewPost check | ✅ |
| Blocks in search | getHiddenUserIds | ✅ |
| Blocks in profile | canViewProfile | ✅ |
| Blocks in messages | canMessage | ✅ |
| Private content | restricted flag | ✅ |
| Private net worth | Should hide | ⚠️ Exposed |
| Story access | Should check blocks | ⚠️ Not checked |

### Required Fixes
1. Hide netWorth when contentRestricted=true
2. Add block check to story endpoints
3. Apply keyword filters to comments/messages

---

## H) Admin Panel (Facebook-style)

### Reference: Facebook Operational Control
- Role-based access control (RBAC)
- Granular permissions per action
- Audit logs for all sensitive actions
- Works on mobile AND web

### RabitChat Status: ⚠️ Partial RBAC

| Admin Feature | Auth | RBAC | Audit | Status |
|--------------|------|------|-------|--------|
| User management | ✅ | ⚠️ | ✅ | Missing granular RBAC |
| Content moderation | ✅ | ✅ | ✅ | Working |
| Report handling | ✅ | ⚠️ | ✅ | Missing granular RBAC |
| Role management | ✅ | ⚠️ | ✅ | Missing granular RBAC |
| Settings | ✅ | ⚠️ | ✅ | Missing granular RBAC |

### Required Fixes
Add hasRbacPermission() calls to 25 admin routes with new permissions:
- users.list, users.view, users.edit, users.suspend, users.deactivate
- roles.view, roles.manage
- reports.view, reports.manage, reports.action
- settings.view, settings.manage
- audit.view

---

## I) Mall + Net Worth (Game-like Economy)

### Reference: Custom Gamification
- Items are FREE (no real money)
- Unlimited buying
- Net worth = sum of item.value * 10 per purchase
- Top 50 leaderboard excludes private accounts
- Admin manages items/categories

### RabitChat Status: ❌ CRITICAL BUG

| Mechanic | Expected | Actual | Status |
|----------|----------|--------|--------|
| Net worth formula | value * 10 * quantity | value * quantity | ❌ WRONG |
| Quantity validation | ≥ 1 | Any number | ⚠️ Missing |
| Top 50 privacy | Exclude private | Includes all | ⚠️ Wrong |
| Purchase history | Full history | ✅ | Working |
| Admin CRUD | Full control | ✅ | Working |

### Required Fixes
1. storage.ts:3525 - Change to `item.value * 10 * quantity`
2. routes.ts:5469 - Add `quantity >= 1` validation
3. storage.ts:3554-3566 - Join userSettings, exclude privateAccount=true

---

## J) Gossip (Anonymous Community)

### Reference: Anonymous Board
- Ghost identities (no names shown)
- Like/comment/retweet inside gossip only
- Isolated from rest of app (no profile links)
- CRITICAL: No identity leaks anywhere (including admin)

### RabitChat Status: ❌ ANONYMITY BREACH

| Gossip Feature | Anonymity | Status |
|----------------|-----------|--------|
| Create post | ✅ Strips authorUserId | Working |
| Get feed | ✅ Excludes authorUserId | Working |
| Like/unlike | ✅ Returns {success} only | Working |
| Retweet | ✅ Returns {success} only | Working |
| GET comments | ❌ Returns full user identity | **BROKEN** |
| POST comment | ❌ Exposes userId in response | **BROKEN** |
| Admin visibility | ✅ No admin gossip routes | Correct |

### CRITICAL ANONYMITY FIXES
1. storage.ts:getGossipComments() - Remove user join, return only {id, body, createdAt}
2. routes.ts:5384 - Strip userId: `const { userId, ...safeComment } = comment`

---

## Common Loopholes Checklist

### API Security
- [ ] All routes have requireAuth or are intentionally public
- [ ] Rate limiting on auth and creation endpoints
- [x] Zod validation on all inputs
- [ ] No SQL injection (using Drizzle ORM)
- [x] Passwords hashed with bcrypt

### Policy Enforcement
- [x] Blocks checked before all interactions
- [ ] Privacy settings respected in all queries (netWorth gap)
- [x] RBAC permissions enforced (partial - 25 routes missing)
- [x] Audit logs for sensitive actions

### Data Integrity
- [x] Counters updated in transactions
- [ ] Cascade deletes for orphan prevention (missing)
- [x] Unique constraints where needed
- [x] Foreign key relationships maintained

### UX Consistency
- [x] Loading states on all async operations
- [x] Error feedback (haptics + alerts)
- [x] Empty states with helpful messages
- [x] Pull-to-refresh on lists

### Mobile Parity
- [x] Safe area handling
- [x] Keyboard avoidance
- [ ] Cookie fallback for older iOS (missing)
- [x] Touch-friendly button sizes
