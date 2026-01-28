import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { messages, messageReactions, conversations, users } from "@shared/schema";
import { storage } from "./storage";
import { messageLimiter } from "./rate-limit";
import { sendMessageNotification } from "./notifications";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function getMessageReactions(messageId: string) {
  const reactions = await db
    .select({
      id: messageReactions.id,
      messageId: messageReactions.messageId,
      userId: messageReactions.userId,
      reaction: messageReactions.reaction,
      createdAt: messageReactions.createdAt,
    })
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId));
  
  const groupedReactions: Record<string, { emoji: string; count: number; userIds: string[] }> = {};
  
  for (const r of reactions) {
    if (!groupedReactions[r.reaction]) {
      groupedReactions[r.reaction] = { emoji: r.reaction, count: 0, userIds: [] };
    }
    groupedReactions[r.reaction].count++;
    groupedReactions[r.reaction].userIds.push(r.userId);
  }
  
  return Object.values(groupedReactions);
}

async function isMessageParticipant(userId: string, messageId: string): Promise<boolean> {
  const [message] = await db
    .select({ senderId: messages.senderId, receiverId: messages.receiverId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  
  if (!message) return false;
  return message.senderId === userId || message.receiverId === userId;
}

async function isConversationParticipant(userId: string, conversationId: string): Promise<boolean> {
  const [conversation] = await db
    .select({ participant1Id: conversations.participant1Id, participant2Id: conversations.participant2Id })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  
  if (!conversation) return false;
  return conversation.participant1Id === userId || conversation.participant2Id === userId;
}

export function registerMessageRoutes(app: Express) {
  app.post("/api/messages/:messageId/react", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.session.userId!;

      if (!emoji || typeof emoji !== "string" || emoji.length > 10) {
        return res.status(400).json({ message: "Invalid emoji" });
      }

      const isParticipant = await isMessageParticipant(userId, messageId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to react to this message" });
      }

      const [existingReaction] = await db
        .select()
        .from(messageReactions)
        .where(and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId)
        ))
        .limit(1);

      if (existingReaction) {
        if (existingReaction.reaction === emoji) {
          await db
            .delete(messageReactions)
            .where(eq(messageReactions.id, existingReaction.id));
        } else {
          await db
            .update(messageReactions)
            .set({ reaction: emoji, createdAt: new Date() })
            .where(eq(messageReactions.id, existingReaction.id));
        }
      } else {
        await db.insert(messageReactions).values({
          messageId,
          userId,
          reaction: emoji,
        });
      }

      const updatedReactions = await getMessageReactions(messageId);
      res.json({ reactions: updatedReactions });
    } catch (error) {
      console.error("[Messages] Add reaction error:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  app.delete("/api/messages/:messageId/react", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.session.userId!;

      const isParticipant = await isMessageParticipant(userId, messageId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to remove reaction from this message" });
      }

      if (emoji) {
        await db
          .delete(messageReactions)
          .where(and(
            eq(messageReactions.messageId, messageId),
            eq(messageReactions.userId, userId),
            eq(messageReactions.reaction, emoji)
          ));
      } else {
        await db
          .delete(messageReactions)
          .where(and(
            eq(messageReactions.messageId, messageId),
            eq(messageReactions.userId, userId)
          ));
      }

      const updatedReactions = await getMessageReactions(messageId);
      res.json({ reactions: updatedReactions });
    } catch (error) {
      console.error("[Messages] Remove reaction error:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  app.post("/api/messages/:messageId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const userId = req.session.userId!;

      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (message.receiverId !== userId) {
        return res.status(403).json({ message: "Not authorized to mark this message as read" });
      }

      if (message.read) {
        return res.json({ message: "Message already read", readAt: message.readAt });
      }

      const now = new Date();
      await db
        .update(messages)
        .set({ 
          read: true, 
          readAt: now,
          status: "READ"
        })
        .where(eq(messages.id, messageId));

      res.json({ message: "Message marked as read", readAt: now });
    } catch (error) {
      console.error("[Messages] Mark read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.delete("/api/messages/:messageId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const deleteForEveryone = req.query.deleteForEveryone === "true";
      const userId = req.session.userId!;

      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      const isSender = message.senderId === userId;
      const isReceiver = message.receiverId === userId;

      if (!isSender && !isReceiver) {
        return res.status(403).json({ message: "Not authorized to delete this message" });
      }

      if (deleteForEveryone) {
        if (!isSender) {
          return res.status(403).json({ message: "Only the sender can delete for everyone" });
        }

        const messageAge = Date.now() - new Date(message.createdAt).getTime();
        const oneHourMs = 60 * 60 * 1000;
        if (messageAge > oneHourMs) {
          return res.status(400).json({ message: "Messages can only be deleted for everyone within 1 hour of sending" });
        }

        await db
          .update(messages)
          .set({ 
            deletedAt: new Date(),
            content: "[Message deleted]",
            mediaUrl: null,
            mediaThumbnail: null,
            fileName: null,
            encryptedContent: null,
            encryptedKey: null,
            iv: null
          })
          .where(eq(messages.id, messageId));

        res.json({ message: "Message deleted for everyone" });
      } else {
        if (isSender) {
          await db
            .update(messages)
            .set({ deletedForSender: true })
            .where(eq(messages.id, messageId));
        } else {
          await db
            .update(messages)
            .set({ deletedForReceiver: true })
            .where(eq(messages.id, messageId));
        }

        res.json({ message: "Message deleted" });
      }
    } catch (error) {
      console.error("[Messages] Delete message error:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.post("/api/messages/:messageId/forward", requireAuth, messageLimiter, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const { conversationId } = req.body;
      const userId = req.session.userId!;

      if (!conversationId) {
        return res.status(400).json({ message: "conversationId is required" });
      }

      const isOriginalParticipant = await isMessageParticipant(userId, messageId);
      if (!isOriginalParticipant) {
        return res.status(403).json({ message: "Not authorized to forward this message" });
      }

      const isTargetParticipant = await isConversationParticipant(userId, conversationId);
      if (!isTargetParticipant) {
        return res.status(403).json({ message: "Not authorized to send to this conversation" });
      }

      const [originalMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (!originalMessage) {
        return res.status(404).json({ message: "Original message not found" });
      }

      if (originalMessage.deletedAt) {
        return res.status(400).json({ message: "Cannot forward a deleted message" });
      }

      const [targetConversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!targetConversation) {
        return res.status(404).json({ message: "Target conversation not found" });
      }

      const receiverId = targetConversation.participant1Id === userId 
        ? targetConversation.participant2Id 
        : targetConversation.participant1Id;

      const forwardedContent = originalMessage.content 
        ? `↪ Forwarded:\n${originalMessage.content}` 
        : "↪ Forwarded message";

      const [forwardedMessage] = await db.insert(messages).values({
        conversationId,
        senderId: userId,
        receiverId,
        content: forwardedContent,
        messageType: originalMessage.messageType,
        mediaUrl: originalMessage.mediaUrl,
        mediaThumbnail: originalMessage.mediaThumbnail,
        mediaDuration: originalMessage.mediaDuration,
        fileName: originalMessage.fileName,
        fileSize: originalMessage.fileSize,
        fileMimeType: originalMessage.fileMimeType,
        voiceWaveform: originalMessage.voiceWaveform,
        linkUrl: originalMessage.linkUrl,
        linkTitle: originalMessage.linkTitle,
        linkDescription: originalMessage.linkDescription,
        linkImage: originalMessage.linkImage,
        linkDomain: originalMessage.linkDomain,
        replyToId: messageId,
        status: "SENT",
      }).returning();

      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));

      res.json(forwardedMessage);
    } catch (error) {
      console.error("[Messages] Forward message error:", error);
      res.status(500).json({ message: "Failed to forward message" });
    }
  });

  app.get("/api/conversations/:conversationId/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { q, limit: limitStr } = req.query;
      const userId = req.session.userId!;
      const limit = Math.min(parseInt(limitStr as string) || 50, 100);

      if (!q || typeof q !== "string" || q.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to search this conversation" });
      }

      const searchQuery = q.trim();

      const results = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          content: messages.content,
          messageType: messages.messageType,
          mediaUrl: messages.mediaUrl,
          fileName: messages.fileName,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(and(
          eq(messages.conversationId, conversationId),
          ilike(messages.content, `%${searchQuery}%`),
          or(
            and(eq(messages.senderId, userId), eq(messages.deletedForSender, false)),
            and(eq(messages.receiverId, userId), eq(messages.deletedForReceiver, false))
          )
        ))
        .orderBy(desc(messages.createdAt))
        .limit(limit);

      res.json({ messages: results, query: searchQuery, count: results.length });
    } catch (error) {
      console.error("[Messages] Search messages error:", error);
      res.status(500).json({ message: "Failed to search messages" });
    }
  });

  app.post("/api/conversations/:conversationId/messages", requireAuth, messageLimiter, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;
      const {
        content,
        messageType = "TEXT",
        mediaUrl,
        mediaThumbnail,
        mediaDuration,
        fileName,
        fileSize,
        fileMimeType,
        voiceWaveform,
        linkUrl,
        linkTitle,
        linkDescription,
        linkImage,
        linkDomain,
        replyToMessageId,
        encryptedContent,
        encryptedKey,
        iv,
      } = req.body;

      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const { participant1Id, participant2Id } = conversation;
      if (participant1Id !== userId && participant2Id !== userId) {
        return res.status(403).json({ message: "Not authorized to send messages in this conversation" });
      }

      const receiverId = participant1Id === userId ? participant2Id : participant1Id;

      const validMessageTypes = ["TEXT", "PHOTO", "VIDEO", "FILE", "VOICE", "GIF", "STICKER", "LINK"];
      if (!validMessageTypes.includes(messageType)) {
        return res.status(400).json({ message: "Invalid message type" });
      }

      if (messageType === "TEXT" && !content && !encryptedContent) {
        return res.status(400).json({ message: "Content is required for text messages" });
      }

      if (["PHOTO", "VIDEO", "FILE", "VOICE", "GIF", "STICKER"].includes(messageType) && !mediaUrl) {
        return res.status(400).json({ message: "Media URL is required for media messages" });
      }

      if (messageType === "LINK" && !linkUrl) {
        return res.status(400).json({ message: "Link URL is required for link messages" });
      }

      if (replyToMessageId) {
        const [replyMessage] = await db
          .select({ id: messages.id, conversationId: messages.conversationId })
          .from(messages)
          .where(eq(messages.id, replyToMessageId))
          .limit(1);

        if (!replyMessage || replyMessage.conversationId !== conversationId) {
          return res.status(400).json({ message: "Invalid reply message" });
        }
      }

      const [newMessage] = await db.insert(messages).values({
        conversationId,
        senderId: userId,
        receiverId,
        content: content || "",
        messageType,
        mediaUrl: mediaUrl || null,
        mediaThumbnail: mediaThumbnail || null,
        mediaDuration: mediaDuration || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        fileMimeType: fileMimeType || null,
        voiceWaveform: voiceWaveform || null,
        linkUrl: linkUrl || null,
        linkTitle: linkTitle || null,
        linkDescription: linkDescription || null,
        linkImage: linkImage || null,
        linkDomain: linkDomain || null,
        replyToId: replyToMessageId || null,
        encryptedContent: encryptedContent || null,
        encryptedKey: encryptedKey || null,
        iv: iv || null,
        status: "SENT",
      }).returning();

      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));

      const [sender] = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (sender && userId !== receiverId) {
        sendMessageNotification(
          receiverId,
          userId,
          sender.displayName || sender.username,
          messageType,
          content || undefined,
          conversationId,
          newMessage.id,
          fileName || undefined
        ).catch((err) => console.error("[Push] Message notification error:", err));
      }

      let replyToMessage = null;
      if (replyToMessageId) {
        const [reply] = await db
          .select({
            id: messages.id,
            content: messages.content,
            senderId: messages.senderId,
            messageType: messages.messageType,
          })
          .from(messages)
          .where(eq(messages.id, replyToMessageId))
          .limit(1);
        replyToMessage = reply || null;
      }

      res.status(201).json({
        ...newMessage,
        sender,
        replyToMessage,
      });
    } catch (error) {
      console.error("[Messages] Create message error:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/messages/:messageId/reactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { messageId } = req.params;
      const userId = req.session.userId!;

      const isParticipant = await isMessageParticipant(userId, messageId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to view reactions for this message" });
      }

      const reactions = await getMessageReactions(messageId);
      res.json({ reactions });
    } catch (error) {
      console.error("[Messages] Get reactions error:", error);
      res.status(500).json({ message: "Failed to get reactions" });
    }
  });
}
