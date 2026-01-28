import { storage } from "./storage";
import type { User, Post, UserSettings, Role, Permission } from "@shared/schema";

export interface ViewerContext {
  user: User | null;
  userId: string | null;
  roles: Role[];
  permissions: string[];
  settings: UserSettings | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
  restricted?: boolean;
}

const DEFAULT_SETTINGS: Partial<UserSettings> = {
  privateAccount: false,
  commentPolicy: "EVERYONE",
  messagePolicy: "EVERYONE",
  mentionPolicy: "EVERYONE",
};

export async function getViewerContext(userId: string | null | undefined): Promise<ViewerContext> {
  if (!userId) {
    return {
      user: null,
      userId: null,
      roles: [],
      permissions: [],
      settings: null,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }

  const [user, roles, settingsResult] = await Promise.all([
    storage.getUser(userId),
    storage.getUserRoles(userId),
    storage.getUserSettings(userId),
  ]);
  const settings = settingsResult ?? null;

  if (!user) {
    return {
      user: null,
      userId: null,
      roles: [],
      permissions: [],
      settings: null,
      isAdmin: false,
      isSuperAdmin: false,
    };
  }

  const permissions: string[] = [];
  for (const role of roles) {
    const rolePerms = await storage.getRolePermissions(role.id);
    permissions.push(...rolePerms.map(p => p.key));
  }

  const isSuperAdmin = roles.some(r => r.name === "SUPER_ADMIN") || user.isAdmin === true;
  const isAdmin = isSuperAdmin || roles.some(r => ["ADMIN", "MODERATOR", "SUPPORT"].includes(r.name));

  return {
    user,
    userId: user.id,
    roles,
    permissions: [...new Set(permissions)],
    settings,
    isAdmin,
    isSuperAdmin,
  };
}

export function hasPermission(viewer: ViewerContext, permission: string): boolean {
  if (viewer.isSuperAdmin) return true;
  return viewer.permissions.includes(permission);
}

export async function canViewProfile(
  viewer: ViewerContext,
  targetUser: User
): Promise<PolicyResult> {
  if (!targetUser) {
    return { allowed: false, reason: "User not found" };
  }

  if (viewer.userId === targetUser.id) {
    return { allowed: true };
  }

  if (targetUser.suspendedAt) {
    if (viewer.isAdmin && hasPermission(viewer, "users.read")) {
      return { allowed: true };
    }
    return { allowed: false, reason: "This account has been suspended" };
  }

  if (viewer.userId) {
    const isBlocked = await storage.isBlockedEither(viewer.userId, targetUser.id);
    if (isBlocked) {
      if (viewer.isAdmin && hasPermission(viewer, "users.read")) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Unable to view this profile" };
    }
  }

  const targetSettings = await storage.getUserSettings(targetUser.id);
  const isPrivate = targetSettings?.privateAccount ?? DEFAULT_SETTINGS.privateAccount;

  if (isPrivate) {
    if (viewer.isAdmin && hasPermission(viewer, "users.read")) {
      return { allowed: true };
    }

    if (!viewer.userId) {
      return { allowed: false, reason: "This account is private", restricted: true };
    }

    const isFollowing = await storage.isFollowing(viewer.userId, targetUser.id);
    if (isFollowing) {
      return { allowed: true };
    }

    return { allowed: false, reason: "This account is private", restricted: true };
  }

  return { allowed: true };
}

export async function canViewPost(
  viewer: ViewerContext,
  post: Post,
  postAuthor?: User
): Promise<PolicyResult> {
  if (!post) {
    return { allowed: false, reason: "Post not found" };
  }

  const authorId = post.authorId;
  const author = postAuthor || await storage.getUser(authorId);

  if (!author) {
    return { allowed: false, reason: "Post author not found" };
  }

  if (viewer.userId === authorId) {
    return { allowed: true };
  }

  if (post.isHidden) {
    if (viewer.isAdmin && hasPermission(viewer, "posts.read")) {
      return { allowed: true };
    }
    return { allowed: false, reason: "This post is not available" };
  }

  if (viewer.userId) {
    const isBlocked = await storage.isBlockedEither(viewer.userId, authorId);
    if (isBlocked) {
      if (viewer.isAdmin && hasPermission(viewer, "posts.read")) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Unable to view this post" };
    }
  }

  const visibility = post.visibility || "PUBLIC";

  switch (visibility) {
    case "PUBLIC":
      return { allowed: true };

    case "FOLLOWERS":
      if (viewer.isAdmin && hasPermission(viewer, "posts.read")) {
        return { allowed: true };
      }
      if (!viewer.userId) {
        return { allowed: false, reason: "This post is only visible to followers" };
      }
      const isFollowing = await storage.isFollowing(viewer.userId, authorId);
      if (isFollowing) {
        return { allowed: true };
      }
      return { allowed: false, reason: "This post is only visible to followers" };

    case "PRIVATE":
      if (viewer.isAdmin && hasPermission(viewer, "posts.read")) {
        return { allowed: true };
      }
      return { allowed: false, reason: "This post is private" };

    default:
      return { allowed: true };
  }
}

export async function canComment(
  viewer: ViewerContext,
  post: Post,
  authorSettings?: UserSettings
): Promise<PolicyResult> {
  if (!viewer.userId) {
    return { allowed: false, reason: "You must be logged in to comment" };
  }

  if (!post) {
    return { allowed: false, reason: "Post not found" };
  }

  if (viewer.userId === post.authorId) {
    return { allowed: true };
  }

  if (post.isHidden) {
    return { allowed: false, reason: "Cannot comment on hidden posts" };
  }

  if (post.commentsEnabled === false) {
    return { allowed: false, reason: "Comments are disabled on this post" };
  }

  if (viewer.userId) {
    const isBlocked = await storage.isBlockedEither(viewer.userId, post.authorId);
    if (isBlocked) {
      return { allowed: false, reason: "Unable to comment on this post" };
    }
  }

  const settings = authorSettings || await storage.getUserSettings(post.authorId);
  const commentPolicy = settings?.commentPolicy ?? DEFAULT_SETTINGS.commentPolicy;

  switch (commentPolicy) {
    case "EVERYONE":
      return { allowed: true };

    case "FOLLOWERS":
      const isFollowing = await storage.isFollowing(viewer.userId, post.authorId);
      if (isFollowing) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Only followers can comment on this post" };

    case "NOBODY":
      return { allowed: false, reason: "The author has disabled comments" };

    default:
      return { allowed: true };
  }
}

export async function canMessage(
  viewer: ViewerContext,
  targetUser: User,
  targetSettings?: UserSettings
): Promise<PolicyResult> {
  if (!viewer.userId) {
    return { allowed: false, reason: "You must be logged in to send messages" };
  }

  if (!targetUser) {
    return { allowed: false, reason: "User not found" };
  }

  if (viewer.userId === targetUser.id) {
    return { allowed: true };
  }

  if (targetUser.suspendedAt) {
    return { allowed: false, reason: "Cannot message suspended users" };
  }

  const isBlocked = await storage.isBlockedEither(viewer.userId, targetUser.id);
  if (isBlocked) {
    if (viewer.isAdmin && hasPermission(viewer, "users.support.contact")) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Unable to send message to this user" };
  }

  const settings = targetSettings || await storage.getUserSettings(targetUser.id);
  const messagePolicy = settings?.messagePolicy ?? DEFAULT_SETTINGS.messagePolicy;

  switch (messagePolicy) {
    case "EVERYONE":
      return { allowed: true };

    case "FOLLOWERS":
      const isFollowing = await storage.isFollowing(targetUser.id, viewer.userId);
      if (isFollowing) {
        return { allowed: true };
      }
      if (viewer.isAdmin && hasPermission(viewer, "users.support.contact")) {
        return { allowed: true };
      }
      return { allowed: false, reason: "This user only accepts messages from people they follow" };

    case "NOBODY":
      if (viewer.isAdmin && hasPermission(viewer, "users.support.contact")) {
        return { allowed: true };
      }
      return { allowed: false, reason: "This user has disabled messages" };

    default:
      return { allowed: true };
  }
}

export async function canMention(
  viewer: ViewerContext,
  targetUser: User,
  targetSettings?: UserSettings
): Promise<PolicyResult> {
  if (!viewer.userId) {
    return { allowed: false, reason: "You must be logged in to mention users" };
  }

  if (!targetUser) {
    return { allowed: false, reason: "User not found" };
  }

  if (viewer.userId === targetUser.id) {
    return { allowed: true };
  }

  const isBlocked = await storage.isBlockedEither(viewer.userId, targetUser.id);
  if (isBlocked) {
    return { allowed: false, reason: "Unable to mention this user" };
  }

  const settings = targetSettings || await storage.getUserSettings(targetUser.id);
  const mentionPolicy = settings?.mentionPolicy ?? DEFAULT_SETTINGS.mentionPolicy;

  switch (mentionPolicy) {
    case "EVERYONE":
      return { allowed: true };

    case "FOLLOWERS":
      const isFollowing = await storage.isFollowing(targetUser.id, viewer.userId);
      if (isFollowing) {
        return { allowed: true };
      }
      return { allowed: false, reason: "This user only allows mentions from people they follow" };

    case "NOBODY":
      return { allowed: false, reason: "This user has disabled mentions" };

    default:
      return { allowed: true };
  }
}

export async function canFollow(
  viewer: ViewerContext,
  targetUser: User
): Promise<PolicyResult> {
  if (!viewer.userId) {
    return { allowed: false, reason: "You must be logged in to follow users" };
  }

  if (viewer.userId === targetUser.id) {
    return { allowed: false, reason: "You cannot follow yourself" };
  }

  if (targetUser.suspendedAt) {
    return { allowed: false, reason: "Cannot follow suspended users" };
  }

  const isBlocked = await storage.isBlockedEither(viewer.userId, targetUser.id);
  if (isBlocked) {
    return { allowed: false, reason: "Unable to follow this user" };
  }

  return { allowed: true };
}

export async function canLike(
  viewer: ViewerContext,
  post: Post
): Promise<PolicyResult> {
  if (!viewer.userId) {
    return { allowed: false, reason: "You must be logged in to like posts" };
  }

  if (post.isHidden) {
    return { allowed: false, reason: "Cannot like hidden posts" };
  }

  if (viewer.userId) {
    const isBlocked = await storage.isBlockedEither(viewer.userId, post.authorId);
    if (isBlocked) {
      return { allowed: false, reason: "Unable to like this post" };
    }
  }

  const viewResult = await canViewPost(viewer, post);
  if (!viewResult.allowed) {
    return { allowed: false, reason: "Cannot like posts you cannot view" };
  }

  return { allowed: true };
}

export async function filterPostsForViewer(
  viewer: ViewerContext,
  posts: (Post & { author: User })[],
  options: { forFeed?: boolean } = {}
): Promise<(Post & { author: User })[]> {
  const results: (Post & { author: User })[] = [];
  
  // Get muted accounts, hidden posts, not interested posts, and keyword filters for feed
  let mutedAccountIds: Set<string> = new Set();
  let hiddenPostIds: Set<string> = new Set();
  let notInterestedPostIds: Set<string> = new Set();
  let keywordFilters: { keyword: string; filterPosts: boolean }[] = [];
  
  if (options.forFeed && viewer.userId) {
    const [mutedAccounts, hiddenPosts, notInterested, filters] = await Promise.all([
      storage.getMutedAccounts(viewer.userId),
      storage.getHiddenPostIds(viewer.userId),
      storage.getNotInterestedPostIds(viewer.userId),
      storage.getKeywordFilters(viewer.userId),
    ]);
    
    mutedAccountIds = new Set(mutedAccounts.filter(m => m.mutePosts !== false).map(m => m.mutedUserId));
    hiddenPostIds = new Set(hiddenPosts);
    notInterestedPostIds = new Set(notInterested);
    keywordFilters = filters.filter(f => f.filterPosts !== false).map(f => ({ 
      keyword: f.keyword.toLowerCase(), 
      filterPosts: f.filterPosts !== false 
    }));
  }

  for (const post of posts) {
    const canView = await canViewPost(viewer, post, post.author);
    if (!canView.allowed) {
      continue;
    }
    
    // Skip posts from muted accounts in feed
    if (options.forFeed && mutedAccountIds.has(post.authorId)) {
      continue;
    }
    
    // Skip hidden posts in feed
    if (options.forFeed && hiddenPostIds.has(post.id)) {
      continue;
    }
    
    // Skip not interested posts in feed
    if (options.forFeed && notInterestedPostIds.has(post.id)) {
      continue;
    }
    
    // Skip archived posts (unless it's the owner viewing their own profile)
    if (post.isArchived && post.authorId !== viewer.userId) {
      continue;
    }
    
    // Skip posts containing filtered keywords
    if (options.forFeed && keywordFilters.length > 0) {
      const postContent = (post.content || '').toLowerCase() + ' ' + (post.caption || '').toLowerCase();
      const hasBlockedKeyword = keywordFilters.some(f => postContent.includes(f.keyword));
      if (hasBlockedKeyword) {
        continue;
      }
    }
    
    results.push(post);
  }

  return results;
}

export async function filterUsersForViewer(
  viewer: ViewerContext,
  usersList: User[]
): Promise<{ user: User; canView: boolean }[]> {
  const results: { user: User; canView: boolean }[] = [];

  for (const user of usersList) {
    const canView = await canViewProfile(viewer, user);
    results.push({ user, canView: canView.allowed });
  }

  return results;
}

export function createPolicyError(result: PolicyResult, statusCode: number = 403) {
  return {
    statusCode,
    body: {
      message: result.reason || "Access denied",
      restricted: result.restricted || false,
    },
  };
}
