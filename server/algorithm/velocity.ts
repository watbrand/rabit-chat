import { db } from '../db';
import { likes, comments, shares, bookmarks } from '@shared/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';
import { EngagementVelocity } from './types';

export class VelocityTracker {
  async calculateVelocity(postId: string, createdAt: Date): Promise<EngagementVelocity> {
    const now = new Date();
    const oneHourAfterPost = new Date(createdAt.getTime() + 60 * 60 * 1000);
    const isWithinFirstHour = now <= oneHourAfterPost;

    const cutoffTime = isWithinFirstHour ? now : oneHourAfterPost;

    const [likeCount] = await db
      .select({ count: count() })
      .from(likes)
      .where(
        and(
          eq(likes.postId, postId),
          gte(likes.createdAt, createdAt),
          lte(likes.createdAt, cutoffTime)
        )
      );

    const [commentCount] = await db
      .select({ count: count() })
      .from(comments)
      .where(
        and(
          eq(comments.postId, postId),
          gte(comments.createdAt, createdAt),
          lte(comments.createdAt, cutoffTime)
        )
      );

    const [saveCount] = await db
      .select({ count: count() })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.postId, postId),
          gte(bookmarks.createdAt, createdAt),
          lte(bookmarks.createdAt, cutoffTime)
        )
      );

    const [shareCount] = await db
      .select({ count: count() })
      .from(shares)
      .where(
        and(
          eq(shares.postId, postId),
          gte(shares.createdAt, createdAt),
          lte(shares.createdAt, cutoffTime)
        )
      );

    const totalEngagement = 
      (likeCount?.count || 0) * 0.5 +
      (commentCount?.count || 0) * 2.0 +
      (saveCount?.count || 0) * 3.0 +
      (shareCount?.count || 0) * 4.0;

    const minutesElapsed = Math.max(1, (cutoffTime.getTime() - createdAt.getTime()) / (1000 * 60));
    const velocityPerMinute = totalEngagement / minutesElapsed;

    const velocityScore = Math.min(velocityPerMinute * 10, 10);

    return {
      postId,
      firstHourEngagement: totalEngagement,
      velocityScore,
      peakTime: null,
    };
  }

  async batchCalculateVelocities(postIds: string[], createdAts: Map<string, Date>): Promise<Map<string, EngagementVelocity>> {
    const results = new Map<string, EngagementVelocity>();
    
    await Promise.all(
      postIds.map(async (postId) => {
        const createdAt = createdAts.get(postId);
        if (createdAt) {
          const velocity = await this.calculateVelocity(postId, createdAt);
          results.set(postId, velocity);
        }
      })
    );

    return results;
  }

  isInGoldenHour(createdAt: Date): boolean {
    const now = new Date();
    const hoursSincePost = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSincePost <= 1;
  }

  isInBoostWindow(createdAt: Date): boolean {
    const now = new Date();
    const hoursSincePost = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSincePost <= 6;
  }
}
