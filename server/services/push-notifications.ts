import { db } from "../db";
import { pushTokens, users, userSettings } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  categoryId?: string;
}

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  categoryId?: string;
}

export interface ExpoPushTicket {
  id?: string;
  status: "ok" | "error";
  message?: string;
  details?: {
    error?: string;
    expoPushToken?: string;
  };
}

async function sendToExpo(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];

  const chunks: ExpoPushMessage[][] = [];
  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize));
  }

  const tickets: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    try {
      const response = await fetch(EXPO_PUSH_API, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      if (result.data) {
        tickets.push(...result.data);
      }
    } catch (error) {
      console.error("[Push] Failed to send to Expo:", error);
    }
  }

  return tickets;
}

async function handlePushReceipts(tickets: ExpoPushTicket[], tokens: string[]) {
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const token = tokens[i];

    if (ticket.status === "error") {
      console.error(`[Push] Error for token ${token}:`, ticket.message);

      if (ticket.details?.error === "DeviceNotRegistered" || 
          ticket.details?.error === "InvalidCredentials") {
        await db.update(pushTokens)
          .set({ isActive: false })
          .where(eq(pushTokens.token, token));
        console.log(`[Push] Deactivated invalid token: ${token}`);
      }
    }
  }
}

async function getUserPushTokens(userId: string): Promise<string[]> {
  const tokens = await db.select({ token: pushTokens.token })
    .from(pushTokens)
    .where(and(
      eq(pushTokens.userId, userId),
      eq(pushTokens.isActive, true)
    ));
  return tokens.map(t => t.token);
}

interface PushNotificationPrefs {
  likes?: boolean;
  comments?: boolean;
  follows?: boolean;
  messages?: boolean;
  mentions?: boolean;
  storyViews?: boolean;
  profileViews?: boolean;
  newFollowers?: boolean;
  liveVideos?: boolean;
  promotions?: boolean;
}

async function checkUserNotificationSettings(userId: string, type: string): Promise<boolean> {
  const settings = await db.select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) return true;

  const pushPrefs = settings[0].pushNotifications as PushNotificationPrefs | null;
  if (!pushPrefs) return true;

  switch (type) {
    case "FOLLOW": return pushPrefs.follows !== false && pushPrefs.newFollowers !== false;
    case "LIKE": return pushPrefs.likes !== false;
    case "COMMENT": return pushPrefs.comments !== false;
    case "MESSAGE": return pushPrefs.messages !== false;
    case "MENTION": return pushPrefs.mentions !== false;
    case "STORY_LIKE": return pushPrefs.storyViews !== false;
    case "STORY_REPLY": return pushPrefs.storyViews !== false;
    default: return true;
  }
}

export const pushNotificationService = {
  async registerToken(
    userId: string,
    token: string,
    platform?: string,
    deviceId?: string,
    deviceName?: string
  ) {
    const existing = await db.select()
      .from(pushTokens)
      .where(eq(pushTokens.token, token))
      .limit(1);

    if (existing.length > 0) {
      await db.update(pushTokens)
        .set({
          userId,
          isActive: true,
          lastUsedAt: new Date(),
          platform: platform || existing[0].platform,
          deviceId: deviceId || existing[0].deviceId,
          deviceName: deviceName || existing[0].deviceName,
        })
        .where(eq(pushTokens.token, token));
      return existing[0];
    }

    const [newToken] = await db.insert(pushTokens)
      .values({
        userId,
        token,
        platform,
        deviceId,
        deviceName,
      })
      .returning();

    console.log(`[Push] Registered new token for user ${userId}`);
    return newToken;
  },

  async unregisterToken(token: string) {
    await db.update(pushTokens)
      .set({ isActive: false })
      .where(eq(pushTokens.token, token));
    console.log(`[Push] Unregistered token: ${token}`);
  },

  async unregisterAllUserTokens(userId: string) {
    await db.update(pushTokens)
      .set({ isActive: false })
      .where(eq(pushTokens.userId, userId));
  },

  async sendToUser(userId: string, payload: PushNotificationPayload, notificationType?: string) {
    if (notificationType) {
      const enabled = await checkUserNotificationSettings(userId, notificationType);
      if (!enabled) {
        console.log(`[Push] Notification type ${notificationType} disabled for user ${userId}`);
        return;
      }
    }

    const tokens = await getUserPushTokens(userId);
    if (tokens.length === 0) {
      return;
    }

    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: payload.sound || "default",
      priority: payload.priority || "high",
      channelId: payload.channelId,
      categoryId: payload.categoryId,
    }));

    const tickets = await sendToExpo(messages);
    await handlePushReceipts(tickets, tokens);
  },

  async sendToMultipleUsers(userIds: string[], payload: PushNotificationPayload, notificationType?: string) {
    if (userIds.length === 0) return;

    const tokens = await db.select({ token: pushTokens.token, userId: pushTokens.userId })
      .from(pushTokens)
      .where(and(
        inArray(pushTokens.userId, userIds),
        eq(pushTokens.isActive, true)
      ));

    if (tokens.length === 0) return;

    const enabledUserIds = new Set<string>();
    for (const userId of new Set(tokens.map(t => t.userId))) {
      if (notificationType) {
        const enabled = await checkUserNotificationSettings(userId, notificationType);
        if (enabled) enabledUserIds.add(userId);
      } else {
        enabledUserIds.add(userId);
      }
    }

    const filteredTokens = tokens.filter(t => enabledUserIds.has(t.userId));
    if (filteredTokens.length === 0) return;

    const messages: ExpoPushMessage[] = filteredTokens.map(t => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: payload.sound || "default",
      priority: payload.priority || "high",
    }));

    const tickets = await sendToExpo(messages);
    await handlePushReceipts(tickets, filteredTokens.map(t => t.token));
  },

  async notifyNewFollower(followedUserId: string, followerUsername: string, followerDisplayName: string, followerAvatarUrl?: string) {
    await this.sendToUser(followedUserId, {
      title: "New Follower",
      body: `${followerDisplayName} (@${followerUsername}) started following you`,
      data: {
        type: "FOLLOW",
        screen: "Profile",
        params: { username: followerUsername },
      },
    }, "FOLLOW");
  },

  async notifyLike(postAuthorId: string, likerUsername: string, likerDisplayName: string, postId: string) {
    await this.sendToUser(postAuthorId, {
      title: "New Like",
      body: `${likerDisplayName} liked your post`,
      data: {
        type: "LIKE",
        screen: "Post",
        params: { postId },
      },
    }, "LIKE");
  },

  async notifyComment(postAuthorId: string, commenterUsername: string, commenterDisplayName: string, postId: string, commentPreview: string) {
    const preview = commentPreview.length > 50 ? commentPreview.slice(0, 47) + "..." : commentPreview;
    await this.sendToUser(postAuthorId, {
      title: `${commenterDisplayName} commented`,
      body: preview,
      data: {
        type: "COMMENT",
        screen: "Post",
        params: { postId },
      },
    }, "COMMENT");
  },

  async notifyMessage(recipientId: string, senderUsername: string, senderDisplayName: string, conversationId: string, messagePreview: string) {
    const preview = messagePreview.length > 50 ? messagePreview.slice(0, 47) + "..." : messagePreview;
    await this.sendToUser(recipientId, {
      title: senderDisplayName,
      body: preview,
      data: {
        type: "MESSAGE",
        screen: "Chat",
        params: { conversationId },
      },
    }, "MESSAGE");
  },

  async notifyMention(mentionedUserId: string, mentionerUsername: string, mentionerDisplayName: string, postId: string) {
    await this.sendToUser(mentionedUserId, {
      title: "You were mentioned",
      body: `${mentionerDisplayName} mentioned you in a post`,
      data: {
        type: "MENTION",
        screen: "Post",
        params: { postId },
      },
    }, "MENTION");
  },

  async notifyStoryLike(storyAuthorId: string, likerDisplayName: string, storyId: string) {
    await this.sendToUser(storyAuthorId, {
      title: "Story Reaction",
      body: `${likerDisplayName} liked your story`,
      data: {
        type: "STORY_LIKE",
        screen: "Story",
        params: { storyId },
      },
    }, "STORY_LIKE");
  },

  async notifyStoryReply(storyAuthorId: string, replierDisplayName: string, storyId: string, replyPreview: string) {
    const preview = replyPreview.length > 50 ? replyPreview.slice(0, 47) + "..." : replyPreview;
    await this.sendToUser(storyAuthorId, {
      title: `${replierDisplayName} replied to your story`,
      body: preview,
      data: {
        type: "STORY_REPLY",
        screen: "Story",
        params: { storyId },
      },
    }, "STORY_REPLY");
  },

  async getUserTokens(userId: string) {
    return db.select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
  },
};

export default pushNotificationService;
