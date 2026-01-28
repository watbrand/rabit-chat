import ExpoModule from "expo-server-sdk";
import type { ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { db } from "./db";
import { pushTokens, conversationSettings, messages, users } from "@shared/schema";
import { eq, and, isNull, or, gt } from "drizzle-orm";

// Handle both ESM and CommonJS module exports
const Expo = (ExpoModule as any).default || ExpoModule;
const expo = new Expo();

type MessageType = "TEXT" | "PHOTO" | "VIDEO" | "VOICE" | "FILE" | "GIF" | "STICKER" | "LINK";

function getNotificationBody(
  messageType: MessageType,
  senderName: string,
  messageContent?: string,
  fileName?: string
): string {
  switch (messageType) {
    case "PHOTO":
      return `New photo from ${senderName}`;
    case "VIDEO":
      return `New video from ${senderName}`;
    case "VOICE":
      return `Voice message from ${senderName}`;
    case "FILE":
      return fileName 
        ? `New file from ${senderName}: ${fileName}`
        : `New file from ${senderName}`;
    case "GIF":
      return `${senderName} sent a GIF`;
    case "STICKER":
      return `${senderName} sent a sticker`;
    case "LINK":
      return messageContent
        ? `New message from ${senderName}: ${truncatePreview(messageContent)}`
        : `${senderName} shared a link`;
    case "TEXT":
    default:
      return messageContent
        ? `New message from ${senderName}: ${truncatePreview(messageContent)}`
        : `New message from ${senderName}`;
  }
}

function truncatePreview(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength - 3) + "...";
}

async function getRecipientPushTokens(recipientId: string): Promise<string[]> {
  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(
      and(
        eq(pushTokens.userId, recipientId),
        eq(pushTokens.isActive, true)
      )
    );
  
  return tokens.map((t) => t.token).filter((token) => Expo.isExpoPushToken(token));
}

async function isConversationMuted(conversationId: string, userId: string): Promise<boolean> {
  const [settings] = await db
    .select({
      isMuted: conversationSettings.isMuted,
      mutedUntil: conversationSettings.mutedUntil,
    })
    .from(conversationSettings)
    .where(
      and(
        eq(conversationSettings.conversationId, conversationId),
        eq(conversationSettings.userId, userId)
      )
    )
    .limit(1);

  if (!settings) return false;
  if (!settings.isMuted) return false;
  
  if (settings.mutedUntil) {
    const now = new Date();
    if (now > settings.mutedUntil) {
      await db
        .update(conversationSettings)
        .set({ isMuted: false, mutedUntil: null })
        .where(
          and(
            eq(conversationSettings.conversationId, conversationId),
            eq(conversationSettings.userId, userId)
          )
        );
      return false;
    }
  }
  
  return true;
}

async function getUnreadMessageCount(userId: string): Promise<number> {
  const result = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(
        eq(messages.receiverId, userId),
        eq(messages.read, false),
        isNull(messages.deletedAt),
        eq(messages.deletedForReceiver, false)
      )
    );
  
  return result.length;
}

async function handlePushReceipts(tickets: ExpoPushTicket[], tokens: string[]): Promise<void> {
  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    const token = tokens[i];

    if (ticket.status === "error") {
      console.error(`[Push] Error for token ${token}:`, ticket.message);

      if (
        ticket.details?.error === "DeviceNotRegistered" ||
        ticket.details?.error === "InvalidCredentials"
      ) {
        await db
          .update(pushTokens)
          .set({ isActive: false })
          .where(eq(pushTokens.token, token));
        console.log(`[Push] Deactivated invalid token: ${token}`);
      }
    }
  }
}

export async function sendMessageNotification(
  recipientId: string,
  senderId: string,
  senderName: string,
  messageType: string,
  messageContent: string | undefined,
  conversationId: string,
  messageId: string,
  fileName?: string
): Promise<void> {
  try {
    if (recipientId === senderId) {
      return;
    }

    const isMuted = await isConversationMuted(conversationId, recipientId);
    if (isMuted) {
      console.log(`[Push] Conversation ${conversationId} is muted for user ${recipientId}`);
      return;
    }

    const tokens = await getRecipientPushTokens(recipientId);
    if (tokens.length === 0) {
      console.log(`[Push] No valid push tokens for user ${recipientId}`);
      return;
    }

    const badgeCount = await getUnreadMessageCount(recipientId);

    const body = getNotificationBody(
      messageType as MessageType,
      senderName,
      messageContent,
      fileName
    );

    const pushMessages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: senderName,
      body,
      sound: "default",
      priority: "high",
      badge: badgeCount + 1,
      data: {
        type: "MESSAGE",
        conversationId,
        messageId,
        senderId,
        messageType,
        screen: "Chat",
        params: { conversationId },
      },
      channelId: "messages",
      categoryId: "message",
    }));

    const chunks = expo.chunkPushNotifications(pushMessages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("[Push] Error sending chunk:", error);
      }
    }

    await handlePushReceipts(tickets, tokens);

    console.log(
      `[Push] Sent message notification to user ${recipientId} for message ${messageId}`
    );
  } catch (error) {
    console.error("[Push] Error sending message notification:", error);
  }
}

export async function sendBulkMessageNotifications(
  notifications: Array<{
    recipientId: string;
    senderId: string;
    senderName: string;
    messageType: string;
    messageContent?: string;
    conversationId: string;
    messageId: string;
    fileName?: string;
  }>
): Promise<void> {
  for (const notification of notifications) {
    await sendMessageNotification(
      notification.recipientId,
      notification.senderId,
      notification.senderName,
      notification.messageType,
      notification.messageContent,
      notification.conversationId,
      notification.messageId,
      notification.fileName
    );
  }
}

export default {
  sendMessageNotification,
  sendBulkMessageNotifications,
};
