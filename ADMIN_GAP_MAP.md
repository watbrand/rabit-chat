# RabitChat Admin Gap Map

## Admin Panel Location
- **URL**: `/admin`
- **Main File**: `server/admin/index.html`
- **Route Handler**: `server/routes.ts` (line ~337: serves /admin)
- **Auth Guard**: `requireAdmin` middleware in `server/routes.ts`

## Admin Entry Point Files
| File | Purpose |
|------|---------|
| `server/admin/index.html` | Main admin panel UI (single-page app) |
| `server/routes.ts` | Admin API endpoints (`/api/admin/*`) |
| `server/routes-advanced.ts` | Additional admin endpoints (feature flags, explore categories) |
| `server/gossip-routes.ts` | Gossip admin endpoints |

## Feature → Admin Control Map

### ✅ Features WITH Admin Controls

| Feature | Implementation Files | Admin API | Admin UI | Notes |
|---------|---------------------|-----------|----------|-------|
| **Users** | `server/routes.ts` | `/api/admin/users`, `/api/admin/users/:id/*` | ✅ `loadUsers()` | Ban, suspend, verify, delete users |
| **Posts** | `server/routes.ts` | `/api/admin/posts`, DELETE `/api/posts/:id` | ✅ `loadPosts()` | View, delete posts |
| **Comments** | `server/routes.ts` | Via posts/reports | ✅ `loadComments()` | View, delete comments |
| **Stories** | `server/routes.ts` | `/api/admin/stories`, `/api/admin/story-reports` | ✅ `loadStories()` | View, delete, manage reports |
| **Story Templates** | `server/routes.ts` | `/api/admin/story-templates` | Partial | API exists, UI integration partial |
| **Story Music** | `server/routes.ts` | `/api/admin/story-music` | Partial | API exists, UI integration partial |
| **Mall (Products)** | `server/routes.ts` | `/api/admin/mall/items` | ✅ `loadMall()` | CRUD products |
| **Mall (Categories)** | `server/routes.ts` | `/api/admin/mall/categories` | ✅ Tab in Mall | CRUD categories |
| **Mall (Purchases)** | `server/routes.ts` | `/api/admin/mall/purchases` | ✅ Tab in Mall | View purchases, adjust net worth |
| **Gossip System** | `server/gossip-routes.ts` | `/api/admin/gossip/*`, `/api/gossip/admin/*` | ✅ `loadGossip()` | Stats, posts, blocked words |
| **Reports** | `server/routes.ts` | `/api/admin/reports` | ✅ `loadReports()` | Review, action on reports |
| **Verification Requests** | `server/routes.ts` | `/api/admin/verification` | ✅ `loadVerification()` | Approve/deny verification |
| **Roles & Permissions** | `server/routes.ts` | `/api/admin/roles`, `/api/admin/permissions` | ✅ `loadRoles()` | Manage RBAC |
| **Settings** | `server/routes.ts` | `/api/admin/settings` | ✅ `loadSettings()` | Platform settings |
| **Audit Logs** | `server/routes.ts` | `/api/admin/audit-logs` | ✅ `loadAudit()` | View admin actions |
| **Overview/Analytics** | `server/routes.ts` | `/api/admin/overview`, `/api/admin/analytics` | ✅ `loadOverview()` | Dashboard stats |
| **Feature Flags** | `server/routes-advanced.ts` | `/api/admin/feature-flags` | ❌ No UI | API only |

### ❌ Features WITHOUT Admin Controls (GAPS)

| Feature | Implementation Files | Admin API | Admin UI | Required Actions |
|---------|---------------------|-----------|----------|------------------|
| **Messages/Conversations** | `server/routes.ts` L4813-5212 | ❌ None | ❌ None | Add `/api/admin/messages`, add UI section |
| **Groups** | `server/routes-advanced.ts` L256-333 | ❌ None | ❌ None | Add `/api/admin/groups`, add UI section |
| **Events** | `server/routes-advanced.ts` L347-395 | ❌ None | ❌ None | Add `/api/admin/events`, add UI section |
| **Live Streams** | `server/routes-advanced.ts` L121-241 | ❌ None | ❌ None | Add `/api/admin/live-streams`, add UI section |
| **Subscriptions** | `server/routes-advanced.ts` L399-456 | ❌ None | ❌ None | Add `/api/admin/subscriptions`, add UI section |
| **Broadcast Channels** | `server/routes-advanced.ts` L460-522 | ❌ None | ❌ None | Add `/api/admin/broadcast-channels`, add UI section |
| **Wallet/Coins** | `server/routes-advanced.ts` L18-60 | ❌ None | ❌ None | Add `/api/admin/wallets`, add UI to manage balances |
| **Gifts** | `server/routes-advanced.ts` L62-117 | ❌ None | ❌ None | Add `/api/admin/gifts`, manage gift types |
| **Notifications** | `server/routes.ts` L1884-2030 | ❌ None | ❌ None | Add `/api/admin/notifications`, send system notifications |
| **Push Tokens** | `server/routes.ts` L1970-2030 | ❌ None | ❌ None | Admin view of registered devices |
| **Blocked/Muted Users** | `server/routes.ts` | ❌ None | ❌ None | View blocked relationships |
| **Locations/Venues** | `server/routes.ts`, `routes-advanced.ts` | ❌ None | ❌ None | Manage locations/venues |
| **Check-ins** | `server/routes-advanced.ts` L638-667 | ❌ None | ❌ None | View/manage check-ins |
| **Video Calls** | `server/routes-advanced.ts` L729-782 | ❌ None | ❌ None | View call history |
| **Hashtags** | `server/routes-advanced.ts` L836-862 | ❌ None | ❌ None | Manage trending hashtags |
| **Pokes** | `server/routes-advanced.ts` L910-953 | ❌ None | ❌ None | View poke activity |
| **Explore Categories** | `server/routes-advanced.ts` L957-983 | ✅ Partial | ❌ None | API exists, needs UI |
| **Group Conversations** | `server/routes-advanced.ts` L672-727 | ❌ None | ❌ None | Add admin controls |
| **Scheduled Messages** | `server/routes-advanced.ts` L1010-1049 | ❌ None | ❌ None | View scheduled messages |
| **Chat Folders** | `server/routes-advanced.ts` L1087-1151 | ❌ None | ❌ None | Admin visibility |
| **2FA/Security** | `server/routes-advanced.ts` L1155-1241 | ❌ None | ❌ None | View security status |
| **Linked Accounts** | `server/routes-advanced.ts` L1244-1280 | ❌ None | ❌ None | View linked accounts |

## Priority Matrix

### High Priority (Security/Revenue Impact)
1. **Wallet/Coins** - Direct revenue/fraud risk
2. **Subscriptions** - Revenue management
3. **Notifications** - System-wide communication
4. **Live Streams** - Content moderation risk
5. **Groups** - Community moderation risk

### Medium Priority (Operational)
6. **Messages/Conversations** - Support/moderation
7. **Events** - Platform activity
8. **Broadcast Channels** - Content distribution
9. **Gifts** - Virtual economy

### Lower Priority (Utility)
10. **Locations/Venues** - Data management
11. **Hashtags** - Trend management
12. **Check-ins** - Activity tracking
13. **Pokes** - Engagement metrics
14. **Video Calls** - Support tool

## Current Admin UI Sections
1. Overview (Dashboard)
2. Users
3. Posts
4. Comments
5. Stories
6. Mall (Products, Categories, Purchases)
7. Gossip
8. Reports
9. Verification
10. Roles
11. Settings
12. Audit Logs

## Authentication & Authorization
- **Login**: Session-based auth with bcrypt password hashing
- **Guard**: `requireAdmin` middleware checks `isAdmin` flag on user
- **RBAC**: Role-based access control with granular permissions
- **Audit**: All admin actions logged to `adminAuditLogs` table

## Gaps to Fix

### Immediate (This Session)
1. Add Messages/Conversations admin section
2. Add Groups admin section
3. Add Live Streams admin section
4. Add Wallet management
5. Add Feature Flags UI
6. Add Notifications admin (system broadcasts)

### Future Work
- Events management
- Subscriptions management
- Broadcast channels
- Location/venue management
- Complete Story Templates/Music UI integration
