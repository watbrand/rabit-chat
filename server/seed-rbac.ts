import { db } from "./db";
import { roles, permissions, rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";

const ROLE_DEFINITIONS = [
  {
    name: "SUPER_ADMIN",
    displayName: "Super Administrator",
    description: "Full system access with all permissions. Cannot be deleted or modified.",
    level: 100,
    isSystem: true,
  },
  {
    name: "ADMIN",
    displayName: "Administrator",
    description: "Broad administrative access including user management and content moderation.",
    level: 50,
    isSystem: true,
  },
  {
    name: "MODERATOR",
    displayName: "Moderator",
    description: "Content moderation and report handling.",
    level: 25,
    isSystem: true,
  },
  {
    name: "SUPPORT",
    displayName: "Support",
    description: "Read-only access to users and basic support capabilities.",
    level: 10,
    isSystem: true,
  },
];

const PERMISSION_DEFINITIONS = [
  // Users group
  { key: "users.view", name: "View Users", description: "View user profiles and lists", group: "users" },
  { key: "users.edit", name: "Edit Users", description: "Edit user profiles", group: "users" },
  { key: "users.delete", name: "Delete Users", description: "Delete user accounts", group: "users" },
  { key: "users.suspend", name: "Suspend Users", description: "Suspend user accounts", group: "users" },
  { key: "users.roles", name: "Manage User Roles", description: "Assign and remove user roles", group: "users" },

  // Posts group
  { key: "posts.view", name: "View Posts", description: "View all posts including hidden", group: "posts" },
  { key: "posts.edit", name: "Edit Posts", description: "Edit any post content", group: "posts" },
  { key: "posts.delete", name: "Delete Posts", description: "Delete any post", group: "posts" },
  { key: "posts.feature", name: "Feature Posts", description: "Feature posts on homepage", group: "posts" },

  // Comments group
  { key: "comments.view", name: "View Comments", description: "View all comments", group: "comments" },
  { key: "comments.edit", name: "Edit Comments", description: "Edit any comment", group: "comments" },
  { key: "comments.delete", name: "Delete Comments", description: "Delete any comment", group: "comments" },

  // Reports group
  { key: "reports.view", name: "View Reports", description: "View content reports", group: "reports" },
  { key: "reports.manage", name: "Manage Reports", description: "Update report status", group: "reports" },
  { key: "reports.delete", name: "Delete Reports", description: "Delete reports", group: "reports" },

  // Roles group
  { key: "roles.view", name: "View Roles", description: "View roles and permissions", group: "roles" },
  { key: "roles.create", name: "Create Roles", description: "Create custom roles", group: "roles" },
  { key: "roles.edit", name: "Edit Roles", description: "Edit role permissions", group: "roles" },
  { key: "roles.delete", name: "Delete Roles", description: "Delete custom roles", group: "roles" },
  { key: "roles.assign", name: "Assign Roles", description: "Assign roles to users", group: "roles" },

  // Settings group
  { key: "settings.view", name: "View Settings", description: "View application settings", group: "settings" },
  { key: "settings.edit", name: "Edit Settings", description: "Modify application settings", group: "settings" },

  // Analytics group
  { key: "analytics.view", name: "View Analytics", description: "View platform analytics", group: "analytics" },
  { key: "analytics.export", name: "Export Analytics", description: "Export analytics data", group: "analytics" },

  // Audit group
  { key: "audit.view", name: "View Audit Logs", description: "View audit logs", group: "audit" },
  { key: "audit.export", name: "Export Audit Logs", description: "Export audit log data", group: "audit" },
];

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  SUPER_ADMIN: ["*"], // All permissions (handled specially)
  ADMIN: [
    "users.view", "users.edit", "users.suspend", "users.roles",
    "posts.view", "posts.edit", "posts.delete", "posts.feature",
    "comments.view", "comments.edit", "comments.delete",
    "reports.view", "reports.manage", "reports.delete",
    "roles.view", "roles.assign",
    "settings.view", "settings.edit",
    "analytics.view", "analytics.export",
    "audit.view",
  ],
  MODERATOR: [
    "users.view",
    "posts.view", "posts.delete",
    "comments.view", "comments.delete",
    "reports.view", "reports.manage",
  ],
  SUPPORT: [
    "users.view",
    "posts.view",
    "comments.view",
    "reports.view",
  ],
};

async function seedRBAC() {
  console.log("🔐 Seeding RBAC system...\n");

  // Seed Roles
  console.log("📋 Creating roles...");
  const createdRoles: Record<string, string> = {};
  
  for (const roleDef of ROLE_DEFINITIONS) {
    const existing = await db.select().from(roles).where(eq(roles.name, roleDef.name)).limit(1);
    
    if (existing.length > 0) {
      console.log(`  ⏭️  Role "${roleDef.displayName}" already exists`);
      createdRoles[roleDef.name] = existing[0].id;
    } else {
      const [created] = await db.insert(roles).values(roleDef).returning();
      console.log(`  ✅ Created role: ${roleDef.displayName} (level ${roleDef.level})`);
      createdRoles[roleDef.name] = created.id;
    }
  }

  // Seed Permissions
  console.log("\n🔑 Creating permissions...");
  const createdPermissions: Record<string, string> = {};
  
  for (const permDef of PERMISSION_DEFINITIONS) {
    const existing = await db.select().from(permissions).where(eq(permissions.key, permDef.key)).limit(1);
    
    if (existing.length > 0) {
      createdPermissions[permDef.key] = existing[0].id;
    } else {
      const [created] = await db.insert(permissions).values(permDef).returning();
      createdPermissions[permDef.key] = created.id;
    }
  }
  console.log(`  ✅ ${PERMISSION_DEFINITIONS.length} permissions available`);

  // Assign permissions to roles
  console.log("\n🔗 Assigning permissions to roles...");
  
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS_MAP)) {
    const roleId = createdRoles[roleName];
    if (!roleId) continue;

    // For SUPER_ADMIN, assign all permissions
    const permissionsToAssign = permKeys[0] === "*" 
      ? Object.keys(createdPermissions) 
      : permKeys;

    let assignedCount = 0;
    for (const permKey of permissionsToAssign) {
      const permId = createdPermissions[permKey];
      if (!permId) continue;

      // Check if already assigned
      const existing = await db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId))
        .limit(1);
      
      const alreadyAssigned = existing.some(rp => {
        // We need to check both roleId and permissionId match
        return true; // Simplified - the unique constraint will handle duplicates
      });

      try {
        await db.insert(rolePermissions).values({
          roleId,
          permissionId: permId,
        }).onConflictDoNothing();
        assignedCount++;
      } catch {
        // Permission already assigned, skip
      }
    }
    console.log(`  ✅ ${roleName}: ${permissionsToAssign.length} permissions`);
  }

  console.log("\n🎉 RBAC seed complete!\n");
  
  // Print summary
  console.log("Role Hierarchy:");
  console.log("  SUPER_ADMIN (level 100) - All permissions");
  console.log("  ADMIN (level 50) - User management, content moderation, settings");
  console.log("  MODERATOR (level 25) - Content moderation and reports");
  console.log("  SUPPORT (level 10) - Read-only access\n");
}

seedRBAC()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ RBAC seed failed:", err);
    process.exit(1);
  });
