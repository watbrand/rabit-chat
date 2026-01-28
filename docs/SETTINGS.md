# User Settings System

RabitChat provides a comprehensive user settings system with database persistence, privacy controls, notification preferences, and account management.

## Overview

User settings are stored in the `user_settings` table and automatically created for new users during registration. The settings system integrates with the centralized policy engine for privacy enforcement.

## Database Schema

### user_settings Table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| id | UUID | generated | Primary key |
| userId | UUID | - | Foreign key to users table |
| privateAccount | boolean | false | When true, only followers can see posts |
| commentPolicy | enum | EVERYONE | Who can comment on posts |
| messagePolicy | enum | EVERYONE | Who can send direct messages |
| mentionPolicy | enum | EVERYONE | Who can mention in posts |
| notifications | JSONB | {...} | Push notification preferences |
| mediaPrefs | JSONB | {...} | Media playback preferences |
| createdAt | timestamp | now() | Creation timestamp |
| updatedAt | timestamp | now() | Last update timestamp |

### Policy Enum Values

- `EVERYONE` - All users can interact
- `FOLLOWERS` - Only followers can interact
- `NOBODY` - No one can interact

### Notification Preferences Structure

```json
{
  "likes": true,
  "comments": true,
  "follows": true,
  "messages": true,
  "mentions": true
}
```

### Media Preferences Structure

```json
{
  "autoplay": true,
  "dataSaver": false,
  "uploadQuality": "high"
}
```

Upload quality options: `low`, `medium`, `high`

## API Endpoints

### Get User Settings

```http
GET /api/me/settings
```

Returns the current user's settings. Creates default settings if none exist.

### Update User Settings

```http
PATCH /api/me/settings
Content-Type: application/json

{
  "privateAccount": true,
  "commentPolicy": "FOLLOWERS",
  "notifications": { "likes": false }
}
```

Partial updates supported. Only include fields to change.

### Update Profile

```http
PATCH /api/me/profile
Content-Type: application/json

{
  "displayName": "New Name",
  "bio": "Updated bio"
}
```

### Change Password

```http
POST /api/me/change-password
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

Requirements:
- New password must be at least 8 characters
- Current password must be correct
- Creates audit log entry

### Get Active Sessions

```http
GET /api/me/sessions
```

Returns list of active sessions with:
- Session ID
- Expiry date
- Whether it's the current session

### Revoke Other Sessions

```http
POST /api/me/sessions/revoke-all
```

Signs out all sessions except the current one. Creates audit log entry.

### Get Blocked Users

```http
GET /api/me/blocked
```

Returns list of blocked users with basic profile info.

### Unblock User

```http
POST /api/me/unblock/:userId
```

### Export User Data

```http
POST /api/me/export
```

Returns summary of user data including:
- Profile information
- Post count
- Export timestamp

### Deactivate Account

```http
POST /api/me/deactivate
```

Soft deactivation:
- Sets `deactivatedAt` timestamp
- Account hidden from others
- Can reactivate by logging in
- Creates audit log entry

### Delete Account

```http
DELETE /api/me
Content-Type: application/json

{
  "password": "confirmpassword"
}
```

Permanent deletion:
- Requires password confirmation
- Deletes all user data
- Creates audit log before deletion
- Cannot be undone

## Policy Enforcement

Privacy settings are enforced through the centralized policy engine in `server/policy.ts`.

### canComment(viewer, post, authorSettings)

Checks if viewer can comment on a post based on:
- Post author's `commentPolicy` setting
- Whether comments are enabled on the post
- Block status between users
- Post visibility

### canMessage(viewer, targetUser, targetSettings)

Checks if viewer can message a user based on:
- Target user's `messagePolicy` setting
- Block status between users
- Whether target is suspended

### canMention(viewer, targetUser, targetSettings)

Checks if viewer can mention a user based on:
- Target user's `mentionPolicy` setting
- Block status between users

## UI Screens

### Settings Hub (`SettingsScreen.tsx`)

Main navigation hub with sections:
- **Account**: Edit Profile
- **Preferences**: Privacy, Notifications, Media, Blocked Accounts
- **Security**: Password & Sessions
- **Data & Account**: Export, Deactivate, Delete
- **Admin**: Admin Panel, Reports (admin only)
- **Support**: Help & Support

### Privacy Settings (`settings/PrivacySettingsScreen.tsx`)

- Private account toggle
- Comment policy selector
- Message policy selector
- Mention policy selector

### Notification Settings (`settings/NotificationSettingsScreen.tsx`)

Toggle notifications for:
- Likes
- Comments
- New followers
- Messages
- Mentions

### Media Settings (`settings/MediaSettingsScreen.tsx`)

- Autoplay videos toggle
- Data saver mode toggle
- Upload quality selection (Low/Medium/High)

### Blocked Accounts (`settings/BlockedAccountsScreen.tsx`)

- View blocked users
- Unblock with confirmation

### Security Settings (`settings/SecuritySettingsScreen.tsx`)

- Change password form
- View active sessions
- Revoke other sessions

### Data & Account (`settings/DataAccountScreen.tsx`)

- Export data
- Deactivate account (temporary)
- Delete account (permanent, requires password)

## Audit Logging

Critical settings changes are logged in the audit_logs table:

| Action | Description |
|--------|-------------|
| `password_changed` | User changed password |
| `privacy_toggle` | User toggled private account |
| `sessions_revoked` | User signed out other sessions |
| `account_deactivated` | User deactivated account |
| `account_deleted` | User deleted account |

## Default Settings

New users receive these defaults:
- `privateAccount`: false
- `commentPolicy`: EVERYONE
- `messagePolicy`: EVERYONE
- `mentionPolicy`: EVERYONE
- All notifications enabled
- Autoplay enabled
- Data saver disabled
- Upload quality: high

## Related Documentation

- [Database Schema](/docs/DB_SCHEMA.md)
- [Policy Engine](/docs/POLICY.md)
- [API Posts](/docs/API_POSTS.md)
- [Admin Reports](/docs/ADMIN_REPORTS.md)
