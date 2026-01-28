# Auth & User Management Audit Report

## Executive Summary

This audit covers authentication, session management, user profile CRUD, follow/unfollow, block/unblock, and user search functionality in RabitChat.

**Critical Issues Found:**
1. ❌ Duplicate account deletion route without password verification (`DELETE /api/users/me`)
2. ⚠️ Email validation missing on signup (accepts any string)
3. ⚠️ Rate limiting on login may be too permissive for mobile

---

## Detailed Audit Table

| Screen | Action | Expected Behavior | Current Status | Missing Logic | Fix Plan |
|--------|--------|-------------------|----------------|---------------|----------|
| **AuthScreen** | Signup | Validate all fields, check username/email uniqueness, hash password, create session | ✅ Complete | Email format validation not enforced in backend | Add email regex validation to `signupSchema` |
| **AuthScreen** | Login | Accept email OR username, verify password, create session | ✅ Complete | None | - |
| **AuthScreen** | Logout | Destroy server session, clear client state | ✅ Complete | None | - |
| **AuthScreen** | Username Check | Real-time availability check with suggestions | ✅ Complete | None | - |
| **AuthScreen** | Loading States | Show spinner during auth operations | ✅ Complete | None | - |
| **AuthScreen** | Error States | Show Alert on failure with message | ✅ Complete | None | - |
| **Session** | Cookie Config | httpOnly, Secure, SameSite for mobile | ⚠️ Partial | `sameSite: "none"` in production may fail on older iOS WebViews | Add fallback detection for mobile clients |
| **Session** | Persistence | Sessions stored in PostgreSQL, 30-day expiry | ✅ Complete | None | - |
| **Session** | Cross-device | Support multiple sessions per user | ✅ Complete | None | - |
| **ProfileScreen** | View Own Profile | Fetch user data, posts, stats | ✅ Complete | None | - |
| **UserProfileScreen** | View Other Profile | Policy check (privacy, blocks), show restricted view | ✅ Complete | None | - |
| **EditProfileScreen** | Update Profile | PUT /api/users/me with validation | ✅ Complete | None | - |
| **EditProfileScreen** | Upload Avatar | Cloudinary upload, update user | ✅ Complete | None | - |
| **EditProfileScreen** | Loading States | Show spinner during save | ✅ Complete | None | - |
| **DataAccountScreen** | Delete Account | Require password, delete all data | ⚠️ Security Issue | Duplicate route `DELETE /api/users/me` has NO password validation | Remove unprotected route or add password validation |
| **DataAccountScreen** | Deactivate Account | Soft delete, allow reactivation | ✅ Complete | None | - |
| **DataAccountScreen** | Export Data | Generate data export | ✅ Complete | None | - |
| **UserProfileScreen** | Follow User | Policy check (blocks), create follow, notify | ✅ Complete | None | - |
| **UserProfileScreen** | Unfollow User | Remove follow relationship | ✅ Complete | None | - |
| **FollowersScreen** | View Followers | List followers, hide blocked users | ✅ Complete | None | - |
| **FollowersScreen** | View Following | List following, hide blocked users | ✅ Complete | None | - |
| **UserProfileScreen** | Block User | Prevent all interaction, hide content | ✅ Complete | None | - |
| **UserProfileScreen** | Unblock User | Restore normal access | ✅ Complete | None | - |
| **BlockedAccountsScreen** | View Blocked | List all blocked users | ✅ Complete | None | - |
| **BlockedAccountsScreen** | Unblock from List | Remove block from settings | ✅ Complete | None | - |
| **DiscoverScreen** | Search Users | Filter by username/displayName | ✅ Complete | None | - |
| **DiscoverScreen** | Search Results | Hide blocked/suspended users | ✅ Complete | None | - |
| **SecuritySettingsScreen** | Change Password | Validate current password, hash new | ✅ Complete | None | - |
| **SecuritySettingsScreen** | View Sessions | List active sessions | ✅ Complete | None | - |
| **SecuritySettingsScreen** | Revoke Sessions | Sign out other devices | ✅ Complete | None | - |

---

## Detailed Findings

### 1. Authentication Routes

#### POST /api/auth/signup
- **Location**: `server/routes.ts:379`
- **Validation**: ✅ Uses `signupLimiter` rate limiter
- **Database**: ✅ Checks username/email uniqueness, creates user and settings
- **Policy**: ✅ Respects `signupEnabled` app setting
- **UX**: ✅ Returns user object on success, error message on failure
- **Issue**: Email format not validated (accepts any string)

```typescript
// Current validation in server/validation.ts
signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(50).optional(),
  // Missing: email validation
});
```

#### POST /api/auth/login
- **Location**: `server/routes.ts:424`
- **Validation**: ✅ Uses `authLimiter` rate limiter
- **Database**: ✅ Looks up by email OR username
- **Policy**: ✅ bcrypt password comparison
- **UX**: ✅ Returns user on success, "Invalid credentials" on failure

#### POST /api/auth/logout
- **Location**: `server/routes.ts:455`
- **Validation**: ✅ None needed
- **Database**: ✅ Session destroyed
- **UX**: ✅ Returns success message

### 2. Session Configuration

**Location**: `server/routes.ts:159-176`

```typescript
cookie: {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
}
```

**Analysis**:
- ✅ `httpOnly: true` - Prevents XSS access
- ✅ `secure: true` in production - Requires HTTPS
- ⚠️ `sameSite: "none"` - Required for cross-origin but may fail on:
  - iOS 12 and below (treats as "strict")
  - Older Android WebViews
- ✅ Session stored in PostgreSQL with `connect-pg-simple`

### 3. Account Deletion - SECURITY ISSUE

**Critical**: Two routes exist for account deletion with different security levels:

| Route | Location | Password Required | Used By |
|-------|----------|-------------------|---------|
| `DELETE /api/users/me` | Line 562 | ❌ NO | Legacy/unused |
| `DELETE /api/me` | Line 3924 | ✅ YES | DataAccountScreen.tsx |

The unprotected route `DELETE /api/users/me` can delete an account without password verification if called directly:

```typescript
// INSECURE - Line 562
app.delete("/api/users/me", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  await storage.deleteUser(userId);  // No password check!
  // ...
});

// SECURE - Line 3924
app.delete("/api/me", requireAuth, validateBody(deleteAccountSchema), async (req, res) => {
  const { password } = req.body;
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Password is incorrect" });
  }
  // ...
});
```

**Frontend uses correct route**: `DataAccountScreen.tsx` calls `DELETE /api/me` with password, so the UI is secure.

### 4. Follow/Unfollow Flow

- **Follow**: `POST /api/users/:id/follow` (Line 578)
  - ✅ Uses `canFollow` policy check
  - ✅ Creates notification with WebSocket broadcast
  - ✅ Returns clear error messages
  
- **Unfollow**: `DELETE /api/users/:id/follow` (Line 615)
  - ✅ Simple removal, no policy check needed

### 5. Block/Unblock Flow

Multiple endpoints exist (all functional):
- `POST/DELETE /api/users/:id/block` (Lines 2181, 2203)
- `POST /api/me/block/:userId` and `POST /api/me/unblock/:userId` (Lines 3773, 3796)
- `GET /api/me/blocked` (Line 3810)

All routes:
- ✅ Require authentication
- ✅ Prevent self-blocking
- ✅ Verify target user exists
- ✅ Return clear success/error messages

### 6. User Search

**Location**: `GET /api/users/search` (Line 478)

```typescript
app.get("/api/users/search", requireAuth, async (req, res) => {
  const viewer = await getViewerContext(req.session.userId);
  const hiddenUserIds = await storage.getHiddenUserIds(req.session.userId!);
  const query = (req.query.q as string) || "";
  const users = await storage.searchUsers(query);
  const filteredUsers = users.filter(u => 
    !hiddenUserIds.includes(u.id) && !u.suspendedAt
  );
  // ...
});
```

- ✅ Filters blocked users
- ✅ Filters suspended users
- ✅ Password excluded from response

---

## Recommended Fixes

### Priority 1: Security (Critical)

**Remove or secure unprotected delete route:**

```typescript
// REMOVE this route entirely from server/routes.ts line 562-576
// OR add password validation:
app.delete("/api/users/me", requireAuth, validateBody(deleteAccountSchema), async (req, res) => {
  // ... same logic as DELETE /api/me
});
```

### Priority 2: Validation

**Add email validation to signup:**

```typescript
// In server/validation.ts, update signupSchema:
export const signupSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string()
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password too long"),
  displayName: z.string()
    .min(1, "Display name is required")
    .max(50, "Display name too long")
    .optional(),
});
```

### Priority 3: Mobile Compatibility

**Add SameSite cookie fallback for older mobile browsers:**

```typescript
// In server/routes.ts, around line 170
const isSecureContext = process.env.NODE_ENV === "production";
const sameSiteValue = isSecureContext ? "none" : "lax";

cookie: {
  secure: isSecureContext,
  httpOnly: true,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  sameSite: sameSiteValue,
  // For iOS 12 compatibility, consider cookie fallback:
  // Set duplicate cookie without SameSite for legacy browsers
}
```

---

## UX States Verification

| Screen | Loading | Success | Error | Empty |
|--------|---------|---------|-------|-------|
| AuthScreen | ✅ ActivityIndicator + disabled button | ✅ Haptic + auto-navigate | ✅ Alert with message | ✅ Form visible |
| EditProfileScreen | ✅ Spinner on save button | ✅ Haptic + navigate back | ✅ Alert | N/A |
| DataAccountScreen | ✅ Spinner on each action | ✅ Alert + logout | ✅ Alert | N/A |
| BlockedAccountsScreen | ✅ Center spinner | N/A | ✅ Alert on unblock fail | ✅ Empty state with icon |
| FollowersScreen | ✅ Center spinner | N/A | N/A | ✅ Tab switches work |
| SecuritySettingsScreen | ✅ Spinners per section | ✅ Alert | ✅ Alert | ✅ Empty states for each section |

---

## Conclusion

The auth and user management system is **mostly complete** with proper policy enforcement, rate limiting, and UX states. The **critical security issue** is the duplicate unprotected delete route which should be removed immediately. The email validation enhancement is recommended but not critical.
