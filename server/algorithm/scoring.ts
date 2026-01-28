import { 
  AlgorithmWeights, 
  PostScore, 
  UserAuthority, 
  RelationshipDepth,
  EngagementVelocity,
  ContentQualitySignals,
  DEFAULT_WEIGHTS,
  NET_WORTH_TIERS,
  INFLUENCE_TIERS,
} from './types';
import type { Post, User } from '@shared/schema';

export class ScoringEngine {
  private weights: AlgorithmWeights;

  constructor(weights: AlgorithmWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  calculateUserAuthority(user: User): UserAuthority {
    const netWorthScore = this.calculateNetWorthScore(user.netWorth || 0);
    const influenceScore = this.calculateInfluenceScore(user.influenceScore || 0);
    const verifiedBonus = user.isVerified ? 5.0 : 1.0;
    const engagementRate = this.estimateEngagementRate(user);
    
    const totalAuthority = (
      (netWorthScore * this.weights.authorNetWorth) +
      (influenceScore * this.weights.authorInfluence) +
      (verifiedBonus * this.weights.authorVerified) +
      engagementRate
    );

    return {
      userId: user.id,
      netWorthScore,
      influenceScore,
      verifiedBonus,
      engagementRate,
      totalAuthority,
    };
  }

  private calculateNetWorthScore(netWorth: number): number {
    const baselineScore = 0.1;
    
    for (const [tier, config] of Object.entries(NET_WORTH_TIERS).sort((a, b) => b[1].min - a[1].min)) {
      if (netWorth >= config.min) {
        const normalized = Math.min(Math.log10(Math.max(netWorth, 1) + 1) / 10, 1);
        return Math.max(normalized * config.multiplier, baselineScore);
      }
    }
    return baselineScore;
  }

  private calculateInfluenceScore(influence: number): number {
    const baselineScore = 0.1;
    
    for (const [tier, config] of Object.entries(INFLUENCE_TIERS).sort((a, b) => b[1].min - a[1].min)) {
      if (influence >= config.min) {
        const normalized = Math.min(Math.log10(Math.max(influence, 1) + 1) / 6, 1);
        return Math.max(normalized * config.multiplier, baselineScore);
      }
    }
    return baselineScore;
  }

  private estimateEngagementRate(user: User): number {
    const totalLikes = user.totalLikesReceived || 0;
    const totalViews = user.totalViewsReceived || 1;
    const rate = totalLikes / totalViews;
    return Math.min(rate * 10, 1);
  }

  calculateEngagementScore(post: Post, velocity?: EngagementVelocity): number {
    const likes = post.likesCount || 0;
    const comments = post.commentsCount || 0;
    const saves = post.savesCount || 0;
    const shares = post.sharesCount || 0;
    const views = post.viewsCount || 1;

    const likeScore = (likes / views) * 100 * this.weights.likes;
    const commentScore = (comments / views) * 100 * this.weights.comments;
    const saveScore = (saves / views) * 100 * this.weights.saves;
    const shareScore = (shares / views) * 100 * this.weights.shares;

    let velocityBonus = 1.0;
    if (velocity) {
      velocityBonus = 1 + (velocity.velocityScore * this.weights.engagementVelocity / 10);
    }

    return (likeScore + commentScore + saveScore + shareScore) * velocityBonus;
  }

  calculateRecencyScore(post: Post): number {
    const now = Date.now();
    const postTime = new Date(post.createdAt).getTime();
    const hoursAgo = (now - postTime) / (1000 * 60 * 60);

    if (hoursAgo < 1) return 1.0;
    if (hoursAgo < 6) return 0.9;
    if (hoursAgo < 24) return 0.7;
    if (hoursAgo < 48) return 0.5;
    if (hoursAgo < 168) return 0.3;
    return 0.1;
  }

  calculateRelationshipScore(depth?: RelationshipDepth): number {
    if (!depth) return 0.1;
    return Math.min(depth.score * this.weights.relationshipDepth, 1);
  }

  calculateContentQualityScore(post: Post, quality?: ContentQualitySignals): number {
    let score = 0.5;

    if (post.type === 'VIDEO') score += 0.2;
    else if (post.type === 'PHOTO') score += 0.15;
    else if (post.type === 'VOICE') score += 0.1;

    if (post.caption && post.caption.length > 50) score += 0.1;
    if (post.thumbnailUrl) score += 0.05;

    if (quality) {
      score = quality.estimatedQuality;
    }

    return Math.min(score * this.weights.contentQuality, 1);
  }

  calculateMediaRichnessScore(post: Post): number {
    if (post.type === 'VIDEO' && post.durationMs && post.durationMs > 30000) {
      return 1.0 * this.weights.mediaRichness;
    }
    if (post.type === 'VIDEO') return 0.8 * this.weights.mediaRichness;
    if (post.type === 'PHOTO') return 0.6 * this.weights.mediaRichness;
    if (post.type === 'VOICE') return 0.5 * this.weights.mediaRichness;
    return 0.3 * this.weights.mediaRichness;
  }

  private getNetWorthMultiplier(netWorth: number): number {
    if (netWorth >= 10000000) return 10.0;
    if (netWorth >= 1000000) return 7.0;
    if (netWorth >= 100000) return 4.0;
    if (netWorth >= 10000) return 2.0;
    return 1.0;
  }

  calculatePostScore(
    post: Post,
    author: User,
    velocity?: EngagementVelocity,
    relationship?: RelationshipDepth,
    quality?: ContentQualitySignals
  ): PostScore {
    const authority = this.calculateUserAuthority(author);
    const engagement = this.calculateEngagementScore(post, velocity);
    const recency = this.calculateRecencyScore(post);
    const relationshipScore = this.calculateRelationshipScore(relationship);
    const qualityScore = this.calculateContentQualityScore(post, quality);
    const mediaScore = this.calculateMediaRichnessScore(post);

    const pinnedBonus = post.isPinned ? 1.5 : 1.0;
    const featuredBonus = post.isFeatured ? 1.3 : 1.0;
    const verifiedBonus = author.isVerified ? 2.0 : 1.0;
    const netWorthBonus = this.getNetWorthMultiplier(author.netWorth || 0);

    const totalScore = (
      (authority.totalAuthority * 2.5) +
      (engagement * 2.0) +
      (recency * this.weights.contentRecency) +
      (relationshipScore * 2.0) +
      (qualityScore * 1.5) +
      (mediaScore * 1.2)
    ) * pinnedBonus * featuredBonus * verifiedBonus * netWorthBonus;

    return {
      postId: post.id,
      authorId: author.id,
      totalScore,
      breakdown: {
        authorityScore: authority.totalAuthority,
        engagementScore: engagement,
        recencyScore: recency,
        relationshipScore: relationshipScore,
        qualityScore: qualityScore,
        mediaScore: mediaScore,
      },
    };
  }

  rankPosts(posts: PostScore[]): PostScore[] {
    return [...posts].sort((a, b) => b.totalScore - a.totalScore);
  }

  applyDiversification(posts: PostScore[], maxPerAuthor: number = 3): PostScore[] {
    const authorCounts = new Map<string, number>();
    const diversified: PostScore[] = [];

    for (const post of posts) {
      const count = authorCounts.get(post.authorId) || 0;
      if (count < maxPerAuthor) {
        diversified.push(post);
        authorCounts.set(post.authorId, count + 1);
      }
    }

    return diversified;
  }
}
