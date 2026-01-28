import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { conversationSettings, conversations } from "@shared/schema";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
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

function calculateMutedUntil(duration: string): Date | null {
  const now = new Date();
  switch (duration) {
    case '1hour':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '8hours':
      return new Date(now.getTime() + 8 * 60 * 60 * 1000);
    case '1day':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '1week':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'forever':
    default:
      return null;
  }
}

export function registerConversationSettingsRoutes(app: Express) {
  app.get("/api/conversations/:conversationId/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const [settings] = await db
        .select({
          isMuted: conversationSettings.isMuted,
          mutedUntil: conversationSettings.mutedUntil,
          isPinned: conversationSettings.isPinned,
          isArchived: conversationSettings.isArchived,
          notificationSound: conversationSettings.notificationSound,
          customName: conversationSettings.customName,
        })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      if (!settings) {
        return res.json({
          isMuted: false,
          mutedUntil: null,
          isPinned: false,
          isArchived: false,
          notificationSound: "default",
          customName: null,
        });
      }

      res.json(settings);
    } catch (error) {
      console.error("[ConversationSettings] Get settings error:", error);
      res.status(500).json({ message: "Failed to get conversation settings" });
    }
  });

  app.patch("/api/conversations/:conversationId/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;
      const { isMuted, mutedUntil, isPinned, isArchived, notificationSound, customName } = req.body;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (isMuted !== undefined) updateData.isMuted = isMuted;
      if (mutedUntil !== undefined) updateData.mutedUntil = mutedUntil ? new Date(mutedUntil) : null;
      if (isPinned !== undefined) updateData.isPinned = isPinned;
      if (isArchived !== undefined) updateData.isArchived = isArchived;
      if (notificationSound !== undefined) updateData.notificationSound = notificationSound;
      if (customName !== undefined) updateData.customName = customName;

      const [existing] = await db
        .select({ id: conversationSettings.id })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      let result;
      if (existing) {
        [result] = await db
          .update(conversationSettings)
          .set(updateData)
          .where(eq(conversationSettings.id, existing.id))
          .returning({
            isMuted: conversationSettings.isMuted,
            mutedUntil: conversationSettings.mutedUntil,
            isPinned: conversationSettings.isPinned,
            isArchived: conversationSettings.isArchived,
            notificationSound: conversationSettings.notificationSound,
            customName: conversationSettings.customName,
          });
      } else {
        [result] = await db
          .insert(conversationSettings)
          .values({
            conversationId,
            userId,
            ...updateData,
          })
          .returning({
            isMuted: conversationSettings.isMuted,
            mutedUntil: conversationSettings.mutedUntil,
            isPinned: conversationSettings.isPinned,
            isArchived: conversationSettings.isArchived,
            notificationSound: conversationSettings.notificationSound,
            customName: conversationSettings.customName,
          });
      }

      res.json(result);
    } catch (error) {
      console.error("[ConversationSettings] Update settings error:", error);
      res.status(500).json({ message: "Failed to update conversation settings" });
    }
  });

  app.post("/api/conversations/:conversationId/mute", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;
      const { duration = 'forever' } = req.body;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const validDurations = ['forever', '1hour', '8hours', '1day', '1week'];
      if (!validDurations.includes(duration)) {
        return res.status(400).json({ message: "Invalid duration. Use: forever, 1hour, 8hours, 1day, 1week" });
      }

      const mutedUntil = calculateMutedUntil(duration);
      const updateData = {
        isMuted: true,
        mutedUntil,
        updatedAt: new Date(),
      };

      const [existing] = await db
        .select({ id: conversationSettings.id })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      let result;
      if (existing) {
        [result] = await db
          .update(conversationSettings)
          .set(updateData)
          .where(eq(conversationSettings.id, existing.id))
          .returning({
            isMuted: conversationSettings.isMuted,
            mutedUntil: conversationSettings.mutedUntil,
          });
      } else {
        [result] = await db
          .insert(conversationSettings)
          .values({
            conversationId,
            userId,
            isMuted: true,
            mutedUntil,
          })
          .returning({
            isMuted: conversationSettings.isMuted,
            mutedUntil: conversationSettings.mutedUntil,
          });
      }

      res.json({ message: "Conversation muted", ...result });
    } catch (error) {
      console.error("[ConversationSettings] Mute error:", error);
      res.status(500).json({ message: "Failed to mute conversation" });
    }
  });

  app.post("/api/conversations/:conversationId/unmute", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const [existing] = await db
        .select({ id: conversationSettings.id })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(conversationSettings)
          .set({ isMuted: false, mutedUntil: null, updatedAt: new Date() })
          .where(eq(conversationSettings.id, existing.id));
      }

      res.json({ message: "Conversation unmuted", isMuted: false, mutedUntil: null });
    } catch (error) {
      console.error("[ConversationSettings] Unmute error:", error);
      res.status(500).json({ message: "Failed to unmute conversation" });
    }
  });

  app.post("/api/conversations/:conversationId/pin", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const [existing] = await db
        .select({ id: conversationSettings.id })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(conversationSettings)
          .set({ isPinned: true, updatedAt: new Date() })
          .where(eq(conversationSettings.id, existing.id));
      } else {
        await db.insert(conversationSettings).values({
          conversationId,
          userId,
          isPinned: true,
        });
      }

      res.json({ message: "Conversation pinned", isPinned: true });
    } catch (error) {
      console.error("[ConversationSettings] Pin error:", error);
      res.status(500).json({ message: "Failed to pin conversation" });
    }
  });

  app.post("/api/conversations/:conversationId/unpin", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const [existing] = await db
        .select({ id: conversationSettings.id })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(conversationSettings)
          .set({ isPinned: false, updatedAt: new Date() })
          .where(eq(conversationSettings.id, existing.id));
      }

      res.json({ message: "Conversation unpinned", isPinned: false });
    } catch (error) {
      console.error("[ConversationSettings] Unpin error:", error);
      res.status(500).json({ message: "Failed to unpin conversation" });
    }
  });

  app.post("/api/conversations/:conversationId/archive", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const [existing] = await db
        .select({ id: conversationSettings.id })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(conversationSettings)
          .set({ isArchived: true, updatedAt: new Date() })
          .where(eq(conversationSettings.id, existing.id));
      } else {
        await db.insert(conversationSettings).values({
          conversationId,
          userId,
          isArchived: true,
        });
      }

      res.json({ message: "Conversation archived", isArchived: true });
    } catch (error) {
      console.error("[ConversationSettings] Archive error:", error);
      res.status(500).json({ message: "Failed to archive conversation" });
    }
  });

  app.post("/api/conversations/:conversationId/unarchive", requireAuth, async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session.userId!;

      const isParticipant = await isConversationParticipant(userId, conversationId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to access this conversation" });
      }

      const [existing] = await db
        .select({ id: conversationSettings.id })
        .from(conversationSettings)
        .where(and(
          eq(conversationSettings.conversationId, conversationId),
          eq(conversationSettings.userId, userId)
        ))
        .limit(1);

      if (existing) {
        await db
          .update(conversationSettings)
          .set({ isArchived: false, updatedAt: new Date() })
          .where(eq(conversationSettings.id, existing.id));
      }

      res.json({ message: "Conversation unarchived", isArchived: false });
    } catch (error) {
      console.error("[ConversationSettings] Unarchive error:", error);
      res.status(500).json({ message: "Failed to unarchive conversation" });
    }
  });
}
