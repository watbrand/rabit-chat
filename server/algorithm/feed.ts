import { db } from '../db';
import { posts, users, follows, blocks, mutedAccounts, hiddenPosts, notInterestedPosts, restrictedAccounts, userInterests, contentCategories } from '@shared/schema';
import { eq, and, or, not, desc, inArray, isNull, sql } from 'drizzle-orm';
import { ScoringEngine } from './scoring';
import { VelocityTracker } from './velocity';
import { RelationshipCalculator } from './relationships';
import { PostScore, DEFAULT_WEIGHTS, AlgorithmWeights } from './types';
import { getAlgorithmWeights } from './config';
import { diversifyFeed } from './diversity';
import type { Post, User } from '@shared/schema';

interface UserInterestData {
  interest: string;
  affinityScore: number | null;
}

export interface FeedOptions {
  limit?: number;
  offset?: number;
  includeFollowingOnly?: boolean;
  prioritizeNetWorth?: boolean;
  prioritizeVerified?: boolean;
  diversify?: boolean;
  maxPerAuthor?: number;
}

export interface FeedResult {
  posts: (Post & { author: User; score: number })[];
  hasMore: boolean;
  scoringBreakdown?: PostScore[];
}

export class EliteFeedAlgorithm {
  private velocityTracker: VelocityTracker;
  private relationshipCalculator: RelationshipCalculator;

  constructor() {
    this.velocityTracker = new VelocityTracker();
    this.relationshipCalculator = new RelationshipCalculator();
  }

  private getScoringEngine(): ScoringEngine {
    return new ScoringEngine(getAlgorithmWeights());
  }

  async generateFeed(
    viewerId: string,
    options: FeedOptions = {}
  ): Promise<FeedResult> {
    const {
      limit = 20,
      offset = 0,
      includeFollowingOnly = false,
      prioritizeNetWorth = true,
      prioritizeVerified = true,
      diversify = true,
      maxPerAuthor = 3,
    } = options;

    const scoringEngine = this.getScoringEngine();
    const candidatePosts = await this.getCandidatePosts(viewerId, includeFollowingOnly, limit * 5);
    
    if (candidatePosts.length === 0) {
      return { posts: [], hasMore: false };
    }

    const authorIds = [...new Set(candidatePosts.map(p => p.authorId))];
    const authorMap = await this.getAuthors(authorIds);

    const relationships = await this.relationshipCalculator.batchCalculateDepths(viewerId, authorIds);

    const postCreatedAts = new Map<string, Date>();
    candidatePosts.forEach(p => postCreatedAts.set(p.id, new Date(p.createdAt)));
    
    const velocities = await this.velocityTracker.batchCalculateVelocities(
      candidatePosts.map(p => p.id),
      postCreatedAts
    );

    // Fetch user interests for personalized scoring
    const viewerInterests = await this.getUserInterests(viewerId);
    const interestSlugs = new Set(viewerInterests.map(i => i.interest));
    
    // Get content categories for all candidate posts
    const postIds = candidatePosts.map(p => p.id);
    const postCategories = await this.getPostCategories(postIds);

    const scores: PostScore[] = [];
    for (const post of candidatePosts) {
      const author = authorMap.get(post.authorId);
      if (!author) continue;

      const velocity = velocities.get(post.id);
      const relationship = relationships.get(post.authorId);

      const score = scoringEngine.calculatePostScore(
        post,
        author,
        velocity,
        relationship
      );

      if (prioritizeNetWorth && author.netWorth > 1000000) {
        score.totalScore *= 1.5;
      }

      // Apply interest-based boosting
      const postCats = postCategories.get(post.id) || [];
      const interestBoost = this.calculateInterestBoost(postCats, viewerInterests, interestSlugs);
      if (interestBoost > 0) {
        score.totalScore *= (1 + interestBoost);
      }

      scores.push(score);
    }

    let rankedScores = scoringEngine.rankPosts(scores);

    if (diversify) {
      // Use the new diversity engine for better creator spacing
      const diversifiableScores = rankedScores.map(s => ({
        ...s,
        id: s.postId,
        score: s.totalScore,
      }));
      
      const diversified = diversifyFeed(diversifiableScores, {
        minSpacing: 4,          // At least 4 posts between same creator
        maxPerCreator: maxPerAuthor,
        useScoreWeighting: true,
        shuffleTiers: false,
      });
      
      rankedScores = diversified;
    }

    const paginatedScores = rankedScores.slice(offset, offset + limit);
    const scoreMap = new Map(paginatedScores.map(s => [s.postId, s.totalScore]));

    const result: (Post & { author: User; score: number })[] = [];
    for (const score of paginatedScores) {
      const post = candidatePosts.find(p => p.id === score.postId);
      const author = authorMap.get(score.authorId);
      if (post && author) {
        result.push({
          ...post,
          author,
          score: scoreMap.get(post.id) || 0,
        });
      }
    }

    return {
      posts: result,
      hasMore: rankedScores.length > offset + limit,
      scoringBreakdown: paginatedScores,
    };
  }

  private async getCandidatePosts(
    viewerId: string,
    followingOnly: boolean,
    limit: number
  ): Promise<Post[]> {
    const blockedUsers = await db
      .select({ blockedId: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, viewerId));
    
    const blockedByUsers = await db
      .select({ blockerId: blocks.blockerId })
      .from(blocks)
      .where(eq(blocks.blockedId, viewerId));

    const muted = await db
      .select({ mutedUserId: mutedAccounts.mutedUserId })
      .from(mutedAccounts)
      .where(eq(mutedAccounts.userId, viewerId));

    const hidden = await db
      .select({ postId: hiddenPosts.postId })
      .from(hiddenPosts)
      .where(eq(hiddenPosts.userId, viewerId));

    const notInterested = await db
      .select({ postId: notInterestedPosts.postId })
      .from(notInterestedPosts)
      .where(eq(notInterestedPosts.userId, viewerId));

    const restricted = await db
      .select({ restrictedUserId: restrictedAccounts.restrictedUserId })
      .from(restrictedAccounts)
      .where(eq(restrictedAccounts.userId, viewerId));

    const excludedUserIds = new Set([
      ...blockedUsers.map(b => b.blockedId),
      ...blockedByUsers.map(b => b.blockerId),
      ...muted.map(m => m.mutedUserId),
      ...restricted.map(r => r.restrictedUserId),
    ]);

    const excludedPostIds = new Set([
      ...hidden.map(h => h.postId),
      ...notInterested.map(n => n.postId),
    ]);

    let followingIds: string[] = [];
    if (followingOnly) {
      const following = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, viewerId));
      followingIds = following.map(f => f.followingId);
    }

    const conditions = [
      eq(posts.isHidden, false),
      isNull(posts.deletedAt),
      or(
        eq(posts.visibility, 'PUBLIC'),
        eq(posts.authorId, viewerId)
      ),
    ];

    if (excludedUserIds.size > 0) {
      conditions.push(not(inArray(posts.authorId, Array.from(excludedUserIds))));
    }

    if (excludedPostIds.size > 0) {
      conditions.push(not(inArray(posts.id, Array.from(excludedPostIds))));
    }

    if (followingOnly) {
      if (followingIds.length > 0) {
        conditions.push(
          or(
            inArray(posts.authorId, followingIds),
            eq(posts.authorId, viewerId)
          )!
        );
      } else {
        conditions.push(eq(posts.authorId, viewerId));
      }
    }

    const candidatePosts = await db
      .select()
      .from(posts)
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return candidatePosts.filter(p => !p.isArchived || p.authorId === viewerId);
  }

  private async getAuthors(authorIds: string[]): Promise<Map<string, User>> {
    if (authorIds.length === 0) return new Map();

    const authors = await db
      .select()
      .from(users)
      .where(inArray(users.id, authorIds));

    return new Map(authors.map(a => [a.id, a]));
  }

  async getDiscoverFeed(viewerId: string, options: FeedOptions = {}): Promise<FeedResult> {
    return this.generateFeed(viewerId, {
      ...options,
      includeFollowingOnly: false,
      prioritizeNetWorth: true,
      prioritizeVerified: true,
    });
  }

  async getFollowingFeed(viewerId: string, options: FeedOptions = {}): Promise<FeedResult> {
    return this.generateFeed(viewerId, {
      ...options,
      includeFollowingOnly: true,
    });
  }

  async getEliteFeed(viewerId: string, options: FeedOptions = {}): Promise<FeedResult> {
    return this.generateFeed(viewerId, {
      ...options,
      prioritizeNetWorth: true,
      prioritizeVerified: true,
    });
  }

  private async getUserInterests(userId: string): Promise<UserInterestData[]> {
    const interests = await db
      .select({
        interest: userInterests.interest,
        affinityScore: userInterests.affinityScore,
      })
      .from(userInterests)
      .where(eq(userInterests.userId, userId));
    
    return interests;
  }

  private async getPostCategories(postIds: string[]): Promise<Map<string, string[]>> {
    if (postIds.length === 0) return new Map();

    const categories = await db
      .select({
        postId: contentCategories.postId,
        categorySlug: contentCategories.categorySlug,
      })
      .from(contentCategories)
      .where(inArray(contentCategories.postId, postIds));

    const map = new Map<string, string[]>();
    for (const cat of categories) {
      if (!cat.categorySlug) continue;
      const existing = map.get(cat.postId) || [];
      existing.push(cat.categorySlug);
      map.set(cat.postId, existing);
    }
    return map;
  }

  private calculateInterestBoost(
    postCategories: string[],
    viewerInterests: UserInterestData[],
    interestSlugs: Set<string>
  ): number {
    if (postCategories.length === 0 || viewerInterests.length === 0) {
      return 0;
    }

    let totalBoost = 0;
    let matchCount = 0;

    for (const category of postCategories) {
      if (interestSlugs.has(category)) {
        const interest = viewerInterests.find(i => i.interest === category);
        const affinity = interest?.affinityScore || 1;
        // Scale boost by affinity (1-10) -> 0.1 to 1.0 boost
        totalBoost += affinity * 0.1;
        matchCount++;
      }
    }

    // Cap boost at 2x (100% increase)
    return Math.min(totalBoost, 1.0);
  }
}

export const feedAlgorithm = new EliteFeedAlgorithm();
