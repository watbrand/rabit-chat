# RBAC System Documentation

**Version:** 1.1.0  
**Last Updated:** January 15, 2026

## Overview

RabitChat implements a full Role-Based Access Control (RBAC) system with:
- Hierarchical roles with numeric levels
- Fine-grained permission catalog
- Backward compatibility with legacy `is_admin` flag
- Audit logging for all administrative actions

## Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| SUPER_ADMIN | 100 | Full system access, all permissions, cannot be deleted |
| ADMIN | 50 | User management, content moderation, settings |
| MODERATOR | 25 | Content moderation and report handling |
| SUPPORT | 10 | Read-only access for customer support |

Higher level = more authority. Roles can only manage users/roles with lower levels than their own.

## Permission Catalog

Permissions are grouped by domain and follow the pattern `{domain}.{action}`:

### Users (`users.*`)
| Permission | Description |
|------------|-------------|
| `users.view` | View user profiles and lists |
| `users.edit` | Edit user profiles |
| `users.delete` | Delete user accounts |
| `users.suspend` | Suspend user accounts |
| `users.roles` | Manage user role assignments |

### Posts (`posts.*`)
| Permission | Description |
|------------|-------------|
| `posts.view` | View all posts including hidden |
| `posts.edit` | Edit any post content |
| `posts.delete` | Delete any post |
| `posts.feature` | Feature posts on homepage |

### Comments (`comments.*`)
| Permission | Description |
|------------|-------------|
| `comments.view` | View all comments |
| `comments.edit` | Edit any comment |
| `comments.delete` | Delete any comment |

### Reports (`reports.*`)
| Permission | Description |
|------------|-------------|
| `reports.view` | View content reports |
| `reports.manage` | Update report status |
| `reports.delete` | Delete reports |

### Roles (`roles.*`)
| Permission | Description |
|------------|-------------|
| `roles.view` | View roles and permissions |
| `roles.create` | Create custom roles |
| `roles.edit` | Edit role permissions |
| `roles.delete` | Delete custom roles |
| `roles.assign` | Assign roles to users |

### Settings (`settings.*`)
| Permission | Description |
|------------|-------------|
| `settings.view` | View application settings |
| `settings.edit` | Modify application settings |

### Analytics (`analytics.*`)
| Permission | Description |
|------------|-------------|
| `analytics.view` | View platform analytics |
| `analytics.export` | Export analytics data |

### Audit (`audit.*`)
| Permission | Description |
|------------|-------------|
| `audit.view` | View audit logs |
| `audit.export` | Export audit log data |

## Role-Permission Mapping

### SUPER_ADMIN
All 26 permissions (full access)

### ADMIN
- users.view, users.edit, users.suspend, users.roles
- posts.view, posts.edit, posts.delete, posts.feature
- comments.view, comments.edit, comments.delete
- reports.view, reports.manage, reports.delete
- roles.view, roles.assign
- settings.view, settings.edit
- analytics.view, analytics.export
- audit.view

### MODERATOR
- users.view
- posts.view, posts.delete
- comments.view, comments.delete
- reports.view, reports.manage

### SUPPORT
- users.view
- posts.view
- comments.view
- reports.view

## Backward Compatibility

### Legacy `is_admin` Flag

The system maintains full backward compatibility with the existing `is_admin` boolean flag:

1. **If `is_admin = true` and no roles assigned:**
   - User is treated as having ADMIN-level access
   - All permission checks return `true`
   - `isAdmin()` returns `true`

2. **If `is_admin = true` with roles assigned:**
   - Roles take precedence for granular permissions
   - `isAdmin()` still returns `true`

3. **Auto-migration on first login:**
   - Call `migrateLegacyAdmin(userId)` during login
   - Automatically assigns ADMIN role to legacy admins without roles

### Migration Path

```typescript
import { migrateLegacyAdmin } from "./rbac";

// In your login handler:
await migrateLegacyAdmin(user.id);
```

## Helper Functions

### `isAdmin(user)`
Returns `true` if user is SUPER_ADMIN, ADMIN, or has legacy `is_admin = true`.

```typescript
import { isAdmin } from "./rbac";

if (await isAdmin(user)) {
  // Grant admin access
}
```

### `isSuperAdmin(user)`
Returns `true` only if user has SUPER_ADMIN role.

```typescript
import { isSuperAdmin } from "./rbac";

if (await isSuperAdmin(user)) {
  // Grant super admin access
}
```

### `hasPermission(user, permKey)`
Checks if user has a specific permission. SUPER_ADMIN always returns `true`.

```typescript
import { hasPermission } from "./rbac";

if (await hasPermission(user, "posts.delete")) {
  // Can delete posts
}
```

### `hasAnyPermission(user, permKeys[])`
Returns `true` if user has any of the specified permissions.

```typescript
if (await hasAnyPermission(user, ["posts.edit", "posts.delete"])) {
  // Can edit or delete posts
}
```

### `hasAllPermissions(user, permKeys[])`
Returns `true` only if user has all specified permissions.

```typescript
if (await hasAllPermissions(user, ["users.edit", "users.delete"])) {
  // Can both edit and delete users
}
```

### `hasRole(user, roleName)`
Checks if user has a specific role by name.

```typescript
if (await hasRole(user, "MODERATOR")) {
  // Has moderator role
}
```

### `getUserRoles(userId)`
Returns all roles assigned to a user.

```typescript
const roles = await getUserRoles(userId);
// [{ name: "ADMIN", level: 50, ... }]
```

### `getUserPermissions(userId)`
Returns all permission keys for a user.

```typescript
const permissions = await getUserPermissions(userId);
// ["users.view", "posts.delete", ...]
```

### `getUserHighestRole(user)`
Returns the role with the highest level.

```typescript
const highestRole = await getUserHighestRole(user);
// { name: "ADMIN", level: 50, ... }
```

## Role Management

### Assigning Roles

```typescript
import { assignRoleToUser } from "./rbac";

const result = await assignRoleToUser(userId, "MODERATOR", assignedById);

if (result.success) {
  // Role assigned
} else {
  console.error(result.error);
}
```

### Removing Roles

```typescript
import { removeRoleFromUser } from "./rbac";

const result = await removeRoleFromUser(userId, "MODERATOR");
```

### Checking Management Authority

```typescript
import { canManageRole } from "./rbac";

// Can this admin assign the MODERATOR role?
if (await canManageRole(adminUser, "MODERATOR")) {
  // Yes, admin (level 50) > moderator (level 25)
}
```

## Audit Logging

All administrative actions should be logged:

```typescript
import { createAuditLog, getClientIp, getUserAgent } from "./rbac";

await createAuditLog({
  userId: adminUser.id,
  action: "ROLE_ASSIGNED",
  targetType: "user",
  targetId: targetUserId,
  details: { roleName: "MODERATOR" },
  ipAddress: getClientIp(req),
  userAgent: getUserAgent(req),
});
```

### Audit Action Types
- `CREATE`, `UPDATE`, `DELETE`
- `LOGIN`, `LOGOUT`
- `ROLE_ASSIGNED`, `ROLE_REMOVED`
- `PERMISSION_GRANTED`, `PERMISSION_REVOKED`
- `USER_SUSPENDED`, `USER_ACTIVATED`
- `REPORT_RESOLVED`
- `SETTING_CHANGED`

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `roles` | Role definitions with levels |
| `permissions` | Permission catalog |
| `role_permissions` | Role-permission assignments |
| `user_roles` | User-role assignments |
| `audit_logs` | Administrative action history |
| `app_settings` | Application configuration |

### Granting Roles via SQL

For initial setup or emergency access:

```sql
-- Find the role ID
SELECT id FROM roles WHERE name = 'SUPER_ADMIN';

-- Assign to user
INSERT INTO user_roles (user_id, role_id) 
VALUES ('user-uuid-here', 'role-uuid-here');
```

## Scripts

### Seed RBAC Data
```bash
npx tsx server/seed-rbac.ts
```

This creates:
- 4 system roles (SUPER_ADMIN, ADMIN, MODERATOR, SUPPORT)
- 26 permissions across 8 groups
- Role-permission assignments

### Re-run Safe
The seed script is idempotent - running it multiple times will not create duplicates.

## Security Considerations

1. **SUPER_ADMIN** should be limited to 1-2 trusted individuals
2. **System roles** (`isSystem = true`) cannot be deleted
3. **Role levels** prevent lower-level admins from escalating privileges
4. **Audit logs** track all administrative actions with IP and user agent
5. **Legacy flag** should be phased out once all admins have proper roles

## Future Enhancements

1. Admin UI for role management
2. Custom role creation
3. Permission groups for easier assignment
4. Temporary role grants with expiration
5. Two-factor authentication requirement for SUPER_ADMIN
