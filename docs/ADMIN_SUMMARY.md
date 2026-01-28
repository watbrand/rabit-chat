# RabitChat Admin System Summary

## How to Access Admin Panel

### In the Mobile App
1. Log in with an admin account
2. Tap the **Profile** tab (bottom right - person icon)
3. Tap the **gear icon** (Settings) in the top right
4. Scroll down to see the **Admin** section

### Admin Section Contains
- **Overview** - Analytics dashboard
- **Users** - User management
- **Reports** - Content moderation
- **Roles** - RBAC management
- **Settings** - Feature flags
- **Audit Logs** - Activity tracking

---

## How Super Admin is Defined

A Super Admin is a user with:
1. `isAdmin = true` flag in the database
2. Assigned the `SUPER_ADMIN` role

### Creating a Super Admin

**Via Database (Production):**
```sql
UPDATE users SET is_admin = true WHERE username = 'your_username';
```

**Via API (if you have admin access):**
Use the admin users endpoint to modify user roles.

---

## List of Admin Modules

### 1. Overview (Analytics Dashboard)
**Endpoint:** `GET /api/admin/overview`

Displays:
- Total users count
- New users (last 7 days)
- Posts created (last 7 days)
- Open reports count
- Messages sent (last 7 days)

### 2. Users Management
**Endpoints:**
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id` - Edit user
- `POST /api/admin/users/:id/suspend` - Suspend user
- `POST /api/admin/users/:id/unsuspend` - Unsuspend user
- `POST /api/admin/users/:id/roles` - Assign/remove roles

Features:
- View all registered users
- Edit user profiles (display name, username, bio, avatar, net worth, influence score)
- Suspend users with reason and optional duration
- Unsuspend users
- Assign/remove roles

### 3. Content Management

**Posts:**
- `GET /api/admin/posts` - List all posts
- `PATCH /api/admin/posts/:id` - Hide/unhide, feature/unfeature
- `DELETE /api/admin/posts/:id` - Hard delete

**Comments:**
- `GET /api/admin/comments` - List all comments
- `PATCH /api/admin/comments/:id` - Hide/unhide
- `DELETE /api/admin/comments/:id` - Hard delete

### 4. Reports Moderation
**Endpoints:**
- `GET /api/admin/reports` - List reports with filters
- `GET /api/admin/reports/:id` - Get report details
- `PATCH /api/admin/reports/:id` - Update status
- `POST /api/admin/reports/:id/action` - Take action

**Report Statuses:**
- PENDING - New, awaiting review
- REVIEWED - Under investigation
- RESOLVED - Action taken
- DISMISSED - No action needed

**Report Actions:**
- `suspend_user` - Suspend the reported user
- `hide_post` - Hide the reported post
- `delete_post` - Permanently delete the reported post

### 5. Roles & Permissions (RBAC)
**Endpoints:**
- `GET /api/admin/roles` - List all roles
- `GET /api/admin/roles/:id` - Get role details
- `POST /api/admin/roles` - Create role
- `PATCH /api/admin/roles/:id` - Edit role
- `DELETE /api/admin/roles/:id` - Delete role
- `GET /api/admin/permissions` - List all permissions
- `POST /api/admin/roles/:id/permissions` - Set role permissions

### 6. App Settings (Feature Flags)
**Endpoints:**
- `GET /api/admin/settings` - Get all settings
- `PATCH /api/admin/settings` - Update settings

**Available Settings:**
| Key | Type | Description |
|-----|------|-------------|
| `maintenanceMode` | boolean | Blocks non-admin access |
| `signupEnabled` | boolean | Toggle user registration |
| `chatEnabled` | boolean | Toggle messaging feature |
| `maxPostLength` | number | Maximum post character limit |

### 7. Audit Logs
**Endpoint:** `GET /api/admin/audit`

**Query Parameters:**
- `limit` - Number of logs per page
- `offset` - Pagination offset
- `actorId` - Filter by actor
- `action` - Filter by action type
- `targetType` - Filter by target type
- `dateFrom` / `dateTo` - Date range filter

**Action Types (13):**
- CREATE, UPDATE, DELETE
- USER_SUSPENDED, USER_UNSUSPENDED
- POST_HIDDEN, POST_UNHIDDEN, POST_FEATURED, POST_UNFEATURED, POST_DELETED
- COMMENT_HIDDEN, COMMENT_UNHIDDEN, COMMENT_DELETED

**Target Types:**
- user, post, comment, role, setting, report

---

## Permission Model Overview

### Permission Structure
Permissions are organized into groups:
- **users** - users.view, users.edit, users.delete, users.suspend, users.roles
- **posts** - posts.view, posts.edit, posts.delete, posts.feature
- **comments** - comments.view, comments.edit, comments.delete
- **reports** - reports.view, reports.manage, reports.delete
- **roles** - roles.view, roles.create, roles.edit, roles.delete, roles.assign
- **settings** - settings.view, settings.edit
- **audit** - audit.view, audit.export
- **analytics** - analytics.view, analytics.export

### Role-Permission Assignment
- Roles have many permissions (many-to-many via `rolePermissions` table)
- Users can have multiple roles (many-to-many via `userRoles` table)
- Permissions are checked via role assignments

### Default Roles
| Role | Description | Access Level |
|------|-------------|--------------|
| SUPER_ADMIN | Full access | All permissions |
| ADMIN | Platform administration | Most permissions |
| MODERATOR | Content moderation | Posts, comments, reports |
| SUPPORT | User assistance | Users, reports (view only) |

---

## Safety Rules

### Cannot Delete Last Super Admin
The system prevents deleting the last user with the SUPER_ADMIN role to ensure at least one super admin always exists.

### Cannot Delete System Roles
Built-in system roles (SUPER_ADMIN, ADMIN, MODERATOR, SUPPORT) cannot be deleted through the admin interface.

### All Admin Actions Are Audit Logged
Every administrative action creates an audit log entry containing:
- Actor (who performed the action)
- Action type
- Target (what was affected)
- Details (action-specific data)
- IP address
- User agent
- Timestamp

### Maintenance Mode Protection
When `maintenanceMode` is enabled:
- Non-admin users cannot access the app
- Admin users retain full access
- Auth endpoints remain accessible

### Suspended User Handling
- Suspended users cannot log in or access protected routes
- Suspension includes reason and optional duration
- Automatic expiration for timed suspensions

---

## Quick Reference

### Make User Admin (Production)
```sql
UPDATE users SET is_admin = true WHERE username = 'USERNAME';
```

### Check User Admin Status
```sql
SELECT username, email, is_admin FROM users WHERE username = 'USERNAME';
```

### View All Admins
```sql
SELECT username, email, created_at FROM users WHERE is_admin = true;
```

---

**Document Version:** 1.0  
**Last Updated:** January 15, 2026
