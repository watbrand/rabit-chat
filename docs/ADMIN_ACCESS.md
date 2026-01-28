# Admin Access Guide

This document explains how to access the Admin Panel in RabitChat.

## Access Requirements

To access the Admin Panel, you must:

1. **Be logged in** - You must have an authenticated session
2. **Have admin privileges** - Your account must have `isAdmin: true` or be assigned an admin role through the RBAC system

## How to Access

### From the Mobile App

1. Navigate to **Profile** tab (bottom right icon)
2. Tap the **Settings** gear icon (top right)
3. If you have admin access, you'll see an **Admin** section with:
   - **Admin Panel** - Opens the full admin dashboard
   - **View Reports** - Quick access to content reports

### Admin Panel Sections

The Admin Panel includes these screens:

| Screen | Description | Permission |
|--------|-------------|------------|
| **Overview** | Dashboard with stats and quick links | `isAdmin` |
| **Users** | View and manage all users | `users.view` |
| **Posts** | View and moderate posts | `posts.view` |
| **Comments** | View and moderate comments | `comments.view` |
| **Reports** | Review and resolve content reports | `reports.view` |
| **Roles** | View role hierarchy and permissions | `roles.view` |
| **Settings** | Configure app-wide settings | `settings.view` |
| **Audit** | View administrative action logs | `audit.view` |

## Making a User an Admin

### Via Database (Development)

```sql
UPDATE users SET is_admin = true WHERE email = 'user@example.com';
```

### Via Seed Script

Run the RBAC seed script to set up roles:

```bash
npx tsx server/seed-rbac.ts
```

Then assign a role to a user:

```sql
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'user@example.com' AND r.name = 'ADMIN';
```

## Role Hierarchy

The RBAC system defines these roles (from highest to lowest authority):

| Role | Level | Description |
|------|-------|-------------|
| **SUPER_ADMIN** | 100 | Full system access, can manage other admins |
| **ADMIN** | 50 | Can manage users, content, and reports |
| **MODERATOR** | 25 | Can review and moderate content |
| **SUPPORT** | 10 | Can view reports and assist users |

## Backward Compatibility

The system maintains backward compatibility with the legacy `is_admin` flag:

- Users with `is_admin: true` have full admin access
- The RBAC system extends this with more granular permissions
- Legacy admins work alongside RBAC-assigned roles

## Security Notes

1. **Access Control**: All admin endpoints require authentication and admin verification
2. **Audit Logging**: Administrative actions are logged for security and compliance
3. **Permission Checks**: Each screen verifies the user has appropriate permissions
4. **403 Handling**: Non-admins attempting to access admin routes see an "Access Denied" screen

## API Endpoints

All admin endpoints are prefixed with `/api/admin/`:

### Dashboard & General
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/posts` | GET | List all posts |
| `/api/admin/comments` | GET | List all comments |
| `/api/admin/reports` | GET | List all reports |
| `/api/admin/reports/:id` | PATCH | Update report status |
| `/api/admin/roles` | GET | List all roles |
| `/api/admin/settings` | GET | List app settings |
| `/api/admin/audit` | GET | List audit logs |

### User Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/:id` | GET | Get single user with roles |
| `/api/admin/users/:id` | PATCH | Update user fields |
| `/api/admin/users/:id/suspend` | POST | Suspend user |
| `/api/admin/users/:id/unsuspend` | POST | Remove suspension |
| `/api/admin/users/:id/roles` | POST | Assign/remove roles |

### User Update Fields (PATCH /api/admin/users/:id)
```json
{
  "displayName": "New Name",
  "username": "new_username",
  "bio": "Updated bio",
  "avatarUrl": "https://...",
  "netWorth": 1000000,
  "influenceScore": 500
}
```

### Suspend User (POST /api/admin/users/:id/suspend)
```json
{
  "reason": "Violation of community guidelines",
  "durationDays": 30  // Optional - omit for permanent
}
```

### Manage Roles (POST /api/admin/users/:id/roles)
```json
{
  "roleId": "role-uuid",
  "action": "assign"  // or "remove"
}
```

## Troubleshooting

### "Admin access required" error

1. Verify your account has `is_admin: true` in the database
2. Check if you're logged in (session may have expired)
3. Try logging out and back in

### Admin section not appearing in Settings

1. The app queries `/api/users/me/admin` to check admin status
2. Verify the API is returning `{ isAdmin: true }`
3. Check browser network tab for API response

### Cannot access specific admin feature

1. Check if your role has the required permission
2. Higher-level roles inherit lower-level permissions
3. SUPER_ADMIN has access to everything

## Related Documentation

- `/docs/ADMIN_RBAC.md` - Full RBAC system documentation
- `/docs/MODERATION.md` - Content moderation features
- `/docs/SECURITY.md` - Security hardening documentation
