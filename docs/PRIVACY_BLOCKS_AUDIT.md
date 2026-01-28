# RabitChat Privacy + Blocks + Profile Audit

## Audit Date: January 17, 2026

---

## Summary

This audit covers the PRIVACY, BLOCKS, and PROFILE workflows in RabitChat. Each action is verified for:
1. Backend API route existence and proper validation
2. Policy enforcement strictness (blocks override everything)
3. Private account content restriction for non-followers
4. Net worth visibility for private accounts

---

## Audit Results Table

| Screen | Action | Expected Behavior | Current Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|----------------|---------------|----------|
| **BLOCKING** | | | | | |
| Profile/Settings | Block user (POST /api/users/:id/block) | Auth required, can't block self, validates target exists | ✅ | None | N/A |
| Profile/Settings | Unblock user (DELETE /api/users/:id/block) | Auth required, removes block | ✅ | None | N/A |
| Settings | Block user (POST /api/me/block/:userId) | Alternative endpoint, same logic | ✅ | None | N/A |
| Settings | Unblock user (POST /api/me/unblock/:userId) | Alternative endpoint, removes block | ✅ | None | N/A |
| Settings | Get blocked users (GET /api/me/blocked) | Returns list of blocked users | ✅ | None | N/A |
| Profile | Check block status (GET /api/users/:id/blocked) | Returns isBlocked and isBlockedBy | ✅ | None | N/A |
| **MUTED ACCOUNTS** | | | | | |
| Settings | Get muted accounts (GET /api/privacy/muted) | Auth required, returns muted list | ✅ | None | N/A |
| Settings | Mute user (POST /api/privacy/muted/:userId) | Auth required, supports mutePosts/Stories/Messages flags | ✅ | None | N/A |
| Settings | Unmute user (DELETE /api/privacy/muted/:userId) | Auth required, removes mute | ✅ | None | N/A |
| **RESTRICTED ACCOUNTS** | | | | | |
| Settings | Get restricted (GET /api/privacy/restricted) | Auth required, returns restricted list | ✅ | None | N/A |
| Settings | Restrict user (POST /api/privacy/restricted/:userId) | Auth required, supports reason | ✅ | None | N/A |
| Settings | Unrestrict user (DELETE /api/privacy/restricted/:userId) | Auth required, removes restriction | ✅ | None | N/A |
| **KEYWORD FILTERS** | | | | | |
| Settings | Get filters (GET /api/privacy/keyword-filters) | Auth required, returns filter list | ✅ | None | N/A |
| Settings | Add filter (POST /api/privacy/keyword-filters) | Auth required, validates keyword required | ✅ | None | N/A |
| Settings | Update filter (PATCH /api/privacy/keyword-filters/:filterId) | Auth required, updates filter | ✅ | None | N/A |
| Settings | Delete filter (DELETE /api/privacy/keyword-filters/:filterId) | Auth required, removes filter | ✅ | None | N/A |
| **CLOSE FRIENDS** | | | | | |
| Settings | Get close friends (GET /api/privacy/close-friends) | Auth required, returns friend list | ✅ | None | N/A |
| Settings | Add close friend (POST /api/privacy/close-friends/:userId) | Auth required, adds friend | ✅ | None | N/A |
| Settings | Remove close friend (DELETE /api/privacy/close-friends/:userId) | Auth required, removes friend | ✅ | None | N/A |
| **STORY RESTRICTIONS** | | | | | |
| Settings | Get restrictions (GET /api/privacy/story-restrictions) | Auth required, returns restricted viewers | ✅ | None | N/A |
| Settings | Add restriction (POST /api/privacy/story-restrictions/:userId) | Auth required, adds viewer restriction | ✅ | None | N/A |
| Settings | Remove restriction (DELETE /api/privacy/story-restrictions/:userId) | Auth required, removes restriction | ✅ | None | N/A |
| **POLICY ENFORCEMENT - BLOCKS** | | | | | |
| Feed | Blocked users' posts hidden | Posts from blocked users filtered out | ✅ | None - filterPostsForViewer calls canViewPost which checks isBlockedEither | N/A |
| Discover/Search | Blocked users hidden in search | Blocked users filtered from search results | ✅ | None - getHiddenUserIds filters blocked users | N/A |
| Profile | Blocked users can't view profile | Returns 403 when blocked | ✅ | None - canViewProfile checks isBlockedEither | N/A |
| Messages | Blocked users can't message | Returns 403 on conversation create/send | ✅ | None - canMessage checks isBlockedEither | N/A |
| Follow | Blocked prevents following | Returns 403 on follow attempt | ✅ | None - canFollow checks isBlockedEither | N/A |
| Like | Blocked prevents liking | Returns 403 on like attempt | ✅ | None - canLike checks isBlockedEither via canViewPost | N/A |
| Comment | Blocked prevents commenting | Returns 403 on comment attempt | ✅ | None - canComment checks isBlockedEither | N/A |
| Mention | Blocked prevents mentioning | Returns 403 on mention | ✅ | None - canMention checks isBlockedEither | N/A |
| **POLICY ENFORCEMENT - PRIVATE ACCOUNTS** | | | | | |
| Profile | Private profile restricted for non-followers | Returns restricted: true, reason: "This account is private" | ✅ | None - canViewProfile checks privateAccount and isFollowing | N/A |
| Posts | Private account posts restricted | Only followers can see posts | ✅ | None - canViewPost respects post visibility, filterPostsForViewer applies | N/A |
| Featured Content | Private account featured restricted | Returns 403 for non-followers | ✅ | None - /api/users/:username/featured checks canViewProfile | N/A |
| **NET WORTH VISIBILITY** | | | | | |
| Profile | Net worth hidden for private users (unless follower) | Non-followers should see null/hidden netWorth | ⚠️ | Net worth is returned unconditionally at line 1168 in /api/users/:username/profile | Hide netWorth when viewer cannot see content (contentRestricted: true) |
| User Fetch | Net worth hidden for private users | /api/users/:id should hide netWorth for private | ⚠️ | Net worth returned unconditionally | Hide netWorth when profile is restricted |
| **STORY ENFORCEMENT** | | | | | |
| Stories Feed | Blocked/restricted users' stories hidden | Stories from blocked users filtered | ✅ | None - getFeedStories checks storyViewerRestrictions and blocks | N/A |
| User Stories | Story viewer restricted users can't see stories | /api/users/:id/stories should check restrictions | ⚠️ | No check for isStoryViewerRestricted or isBlockedEither | Add block and story restriction check before returning stories |
| Story View | Blocked/restricted viewers can't view stories | /api/stories/:id/view should check restrictions | ⚠️ | No check for isStoryViewerRestricted or isBlockedEither | Add block and story restriction check before recording view |
| Story Reply | Blocked users can't reply to stories | /api/stories/:id/reply should check blocks | ⚠️ | No check for isBlockedEither | Add block check via canMessage before allowing reply |
| **MUTE ENFORCEMENT** | | | | | |
| Feed | Muted users' posts filtered | Posts from muted accounts filtered | ✅ | None - filterPostsForViewer checks mutedAccounts.mutePosts | N/A |
| Feed | Muted users' stories hidden | Stories from muted accounts filtered | ✅ | None - getFeedStories checks mutedAccounts.muteStories | N/A |
| **KEYWORD FILTER ENFORCEMENT** | | | | | |
| Feed | Posts with filtered keywords hidden | Posts containing keywords filtered | ✅ | None - filterPostsForViewer checks keywordFilters.filterPosts | N/A |
| Comments | Comments with filtered keywords hidden | Comments should be filtered | ⚠️ | No keyword filter check on comment retrieval | Add keyword filter check in getPostComments or before returning |
| Messages | Messages with filtered keywords hidden | Messages should be filtered | ⚠️ | No keyword filter check on message retrieval | Add keyword filter check in getConversationMessages or before returning |

---

## Issues Found

### Critical Issues

1. **Net Worth Visibility (⚠️)**
   - **Location**: `server/routes.ts` lines 1168 and 531
   - **Issue**: Net worth is returned unconditionally for private accounts
   - **Expected**: Net worth should be hidden (null or 0) for private accounts when viewer cannot see content
   - **Fix**: Check `contentRestricted` before including netWorth in response

2. **Story Viewer Restrictions Not Enforced on Direct Access (⚠️)**
   - **Location**: `server/routes.ts` lines 1795-1806 (`/api/users/:id/stories`)
   - **Issue**: No check for `isStoryViewerRestricted` or block status
   - **Expected**: Should return empty array or 403 for restricted viewers
   - **Fix**: Add checks for `isBlockedEither` and `isStoryViewerRestricted` before returning stories

3. **Story View Recording Without Access Check (⚠️)**
   - **Location**: `server/routes.ts` lines 1809-1820 (`/api/stories/:id/view`)
   - **Issue**: No check for block status or story viewer restrictions
   - **Expected**: Should reject view recording for blocked/restricted viewers
   - **Fix**: Add access checks before recording view

4. **Story Reply Without Block Check (⚠️)**
   - **Location**: `server/routes.ts` lines 1858-1906 (`/api/stories/:id/reply`)
   - **Issue**: No check for block status before allowing reply
   - **Expected**: Should use `canMessage` policy check
   - **Fix**: Add `canMessage` check using recipient's ID

5. **Keyword Filters Not Applied to Comments/Messages (⚠️)**
   - **Location**: Comment and message retrieval endpoints
   - **Issue**: Keyword filters are only applied to posts, not comments or messages
   - **Expected**: Comments and messages containing filtered keywords should be hidden
   - **Fix**: Apply keyword filters to comment and message retrieval

---

## Recommendations

### Priority 1 (Security)
1. Add block and story restriction checks to `/api/users/:id/stories`
2. Add access checks to `/api/stories/:id/view`
3. Add `canMessage` check to `/api/stories/:id/reply`

### Priority 2 (Privacy)
1. Hide netWorth for private accounts when viewer cannot see content
2. Apply keyword filters to comment retrieval
3. Apply keyword filters to message retrieval

### Priority 3 (Consistency)
1. Ensure all profile-related endpoints consistently hide sensitive data for restricted profiles
2. Add audit logging for block/unblock actions

---

## Working Features

- ✅ Block/Unblock CRUD operations
- ✅ Mute/Unmute CRUD operations  
- ✅ Restricted accounts CRUD operations
- ✅ Keyword filters CRUD operations
- ✅ Close friends CRUD operations
- ✅ Story restrictions CRUD operations
- ✅ Block enforcement in feed, search, profile views, messages, follows, likes, comments
- ✅ Private account content restriction for non-followers
- ✅ Muted posts/stories filtering in feed
- ✅ Keyword filter enforcement in feed posts
- ✅ Story viewer restrictions in feed stories (getFeedStories)
