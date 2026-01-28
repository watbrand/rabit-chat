import { db } from "./db";
import { users, roles, permissions, userRoles, rolePermissions, auditLogs } from "@shared/schema";
import { eq, inArray, and } from "drizzle-orm";
import type { User, Role, Permission, AuditAction } from "@shared/schema";

export const ROLE_NAMES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  SUPPORT: "SUPPORT",
} as const;

export const ROLE_LEVELS = {
  SUPER_ADMIN: 100,
  ADMIN: 50,
  MODERATOR: 25,
  SUPPORT: 10,
} as const;

export interface UserWithRolesAndPermissions {
  user: User;
  roles: Role[];
  permissions: string[]; // Permission keys
}

export async function getUserRoles(userId: string): Promise<Role[]> {
  const userRoleRecords = await db
    .select({ role: roles })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return userRoleRecords.map(r => r.role);
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoleList = await getUserRoles(userId);
  
  if (userRoleList.length === 0) {
    return [];
  }

  const roleIds = userRoleList.map(r => r.id);
  
  const permissionRecords = await db
    .select({ permission: permissions })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds));

  const uniquePermissions = [...new Set(permissionRecords.map(p => p.permission.key))];
  return uniquePermissions;
}

export async function isAdmin(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;

  // Legacy backward compatibility: if is_admin is true, treat as admin
  if (user.isAdmin) {
    return true;
  }

  // Check if user has any admin role (SUPER_ADMIN or ADMIN)
  const userRoleList = await getUserRoles(user.id);
  
  return userRoleList.some(role => 
    role.name === ROLE_NAMES.SUPER_ADMIN || 
    role.name === ROLE_NAMES.ADMIN
  );
}

export async function isSuperAdmin(user: User | null | undefined): Promise<boolean> {
  if (!user) return false;

  const userRoleList = await getUserRoles(user.id);
  return userRoleList.some(role => role.name === ROLE_NAMES.SUPER_ADMIN);
}

export async function hasRole(user: User | null | undefined, roleName: string): Promise<boolean> {
  if (!user) return false;

  const userRoleList = await getUserRoles(user.id);
  return userRoleList.some(role => role.name === roleName);
}

export async function hasAnyRole(user: User | null | undefined, roleNames: string[]): Promise<boolean> {
  if (!user) return false;

  const userRoleList = await getUserRoles(user.id);
  return userRoleList.some(role => roleNames.includes(role.name));
}

export async function hasPermission(user: User | null | undefined, permKey: string): Promise<boolean> {
  if (!user) return false;

  // Legacy backward compatibility: if is_admin is true, grant all permissions
  if (user.isAdmin) {
    return true;
  }

  // Check if user is SUPER_ADMIN (has all permissions)
  const userRoleList = await getUserRoles(user.id);
  
  if (userRoleList.some(role => role.name === ROLE_NAMES.SUPER_ADMIN)) {
    return true;
  }

  // Check specific permission
  const userPermissions = await getUserPermissions(user.id);
  return userPermissions.includes(permKey);
}

export async function hasAnyPermission(user: User | null | undefined, permKeys: string[]): Promise<boolean> {
  if (!user) return false;

  // Legacy backward compatibility
  if (user.isAdmin) {
    return true;
  }

  // SUPER_ADMIN has all permissions
  if (await isSuperAdmin(user)) {
    return true;
  }

  const userPermissions = await getUserPermissions(user.id);
  return permKeys.some(key => userPermissions.includes(key));
}

export async function hasAllPermissions(user: User | null | undefined, permKeys: string[]): Promise<boolean> {
  if (!user) return false;

  // Legacy backward compatibility
  if (user.isAdmin) {
    return true;
  }

  // SUPER_ADMIN has all permissions
  if (await isSuperAdmin(user)) {
    return true;
  }

  const userPermissions = await getUserPermissions(user.id);
  return permKeys.every(key => userPermissions.includes(key));
}

export async function getUserHighestRole(user: User | null | undefined): Promise<Role | null> {
  if (!user) return null;

  const userRoleList = await getUserRoles(user.id);
  
  if (userRoleList.length === 0) {
    // Check legacy isAdmin flag
    if (user.isAdmin) {
      // Return a virtual ADMIN role for backward compatibility
      return {
        id: "legacy",
        name: "ADMIN",
        displayName: "Administrator (Legacy)",
        description: "Legacy admin flag",
        level: ROLE_LEVELS.ADMIN,
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    return null;
  }

  // Return the role with the highest level
  return userRoleList.reduce((highest, current) => 
    current.level > highest.level ? current : highest
  );
}

export async function canManageRole(manager: User, targetRoleName: string): Promise<boolean> {
  const managerRole = await getUserHighestRole(manager);
  if (!managerRole) return false;

  // Get target role level
  const targetRoleLevel = ROLE_LEVELS[targetRoleName as keyof typeof ROLE_LEVELS] || 0;

  // Can only manage roles with lower level than your highest role
  return managerRole.level > targetRoleLevel;
}

export async function assignRoleToUser(
  userId: string, 
  roleName: string, 
  assignedById?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the role
    const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    
    if (!role) {
      return { success: false, error: `Role "${roleName}" not found` };
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "User already has this role" };
    }

    // Assign the role
    await db.insert(userRoles).values({
      userId,
      roleId: role.id,
      assignedBy: assignedById || null,
    });

    return { success: true };
  } catch (error) {
    console.error("Error assigning role:", error);
    return { success: false, error: "Failed to assign role" };
  }
}

export async function removeRoleFromUser(
  userId: string, 
  roleName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find the role
    const [role] = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);
    
    if (!role) {
      return { success: false, error: `Role "${roleName}" not found` };
    }

    // Remove the role
    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)));

    return { success: true };
  } catch (error) {
    console.error("Error removing role:", error);
    return { success: false, error: "Failed to remove role" };
  }
}

export async function migrateLegacyAdmin(userId: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user || !user.isAdmin) {
    return;
  }

  // Check if user already has any roles
  const existingRoles = await getUserRoles(userId);
  
  if (existingRoles.length > 0) {
    return; // Already has roles, no migration needed
  }

  // Auto-assign ADMIN role to legacy admins
  console.log(`Migrating legacy admin ${userId} to ADMIN role`);
  await assignRoleToUser(userId, ROLE_NAMES.ADMIN);
}

export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId || null,
      action: entry.action,
      targetType: entry.targetType || null,
      targetId: entry.targetId || null,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function getClientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(",")[0].trim();
  }
  return req.ip || "unknown";
}

export function getUserAgent(req: { headers?: Record<string, string | string[] | undefined> }): string {
  const ua = req.headers?.["user-agent"];
  if (typeof ua === "string") {
    return ua.substring(0, 500);
  }
  if (Array.isArray(ua) && ua.length > 0) {
    return ua[0].substring(0, 500);
  }
  return "unknown";
}
