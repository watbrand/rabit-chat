import { db } from '../db';
import { follows, likes, comments, messages, conversations, posts } from '@shared/schema';
import { eq, and, or, count, desc, gte } from 'drizzle-orm';
import { RelationshipDepth } from './types';

export class RelationshipCalculator {
  async calculateDepth(userId: string, targetUserId: string): Promise<RelationshipDepth> {
    const [mutualCheck] = await db
      .select({ count: count() })
      .from(follows)
      .where(
        or(
          and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId)),
          and(eq(follows.followerId, targetUserId), eq(follows.followingId, userId))
        )
      );

    const mutualFollows = (mutualCheck?.count || 0) >= 2;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [likeInteractions] = await db
      .select({ count: count() })
      .from(likes)
      .innerJoin(posts, eq(likes.postId, posts.id))
      .where(
        and(
          eq(likes.userId, userId),
          eq(posts.authorId, targetUserId),
          gte(likes.createdAt, sevenDaysAgo)
        )
      );

    const [commentInteractions] = await db
      .select({ count: count() })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(
        and(
          eq(comments.authorId, userId),
          eq(posts.authorId, targetUserId),
          gte(comments.createdAt, sevenDaysAgo)
        )
      );

    const [dmHistory] = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        or(
          and(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, targetUserId)),
          and(eq(conversations.participant1Id, targetUserId), eq(conversations.participant2Id, userId))
        )
      );

    const hasDmHistory = (dmHistory?.count || 0) > 0;

    const recentInteractions = (likeInteractions?.count || 0) + (commentInteractions?.count || 0) * 2;
    const interactionCount = recentInteractions;

    let score = 0.1;

    if (mutualFollows) score += 0.3;
    if (hasDmHistory) score += 0.2;

    score += Math.min(recentInteractions / 50, 0.4);

    return {
      userId,
      targetUserId,
      interactionCount,
      recentInteractions,
      mutualFollows,
      dmHistory: hasDmHistory,
      score: Math.min(score, 1.0),
    };
  }

  async batchCalculateDepths(
    userId: string, 
    targetUserIds: string[]
  ): Promise<Map<string, RelationshipDepth>> {
    const results = new Map<string, RelationshipDepth>();

    await Promise.all(
      targetUserIds.map(async (targetId) => {
        const depth = await this.calculateDepth(userId, targetId);
        results.set(targetId, depth);
      })
    );

    return results;
  }

  async getClosestConnections(userId: string, limit: number = 50): Promise<string[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentConvos = await db
      .select({
        partnerId: conversations.participant2Id,
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.participant1Id, userId),
          gte(conversations.lastMessageAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit);

    const recentConvos2 = await db
      .select({
        partnerId: conversations.participant1Id,
      })
      .from(conversations)
      .where(
        and(
          eq(conversations.participant2Id, userId),
          gte(conversations.lastMessageAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit);

    const partnerIds = new Set<string>();
    recentConvos.forEach(c => partnerIds.add(c.partnerId));
    recentConvos2.forEach(c => partnerIds.add(c.partnerId));

    return Array.from(partnerIds).slice(0, limit);
  }
}
