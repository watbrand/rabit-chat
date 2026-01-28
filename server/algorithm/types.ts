export interface AlgorithmWeights {
  authorNetWorth: number;
  authorInfluence: number;
  authorVerified: number;
  engagementVelocity: number;
  engagementQuality: number;
  contentRecency: number;
  relationshipDepth: number;
  contentQuality: number;
  mediaRichness: number;
  completionRate: number;
  saves: number;
  shares: number;
  comments: number;
  likes: number;
  dwellTime: number;
}

export interface PostScore {
  postId: string;
  authorId: string;
  totalScore: number;
  breakdown: {
    authorityScore: number;
    engagementScore: number;
    recencyScore: number;
    relationshipScore: number;
    qualityScore: number;
    mediaScore: number;
  };
}

export interface UserAuthority {
  userId: string;
  netWorthScore: number;
  influenceScore: number;
  verifiedBonus: number;
  engagementRate: number;
  totalAuthority: number;
}

export interface RelationshipDepth {
  userId: string;
  targetUserId: string;
  interactionCount: number;
  recentInteractions: number;
  mutualFollows: boolean;
  dmHistory: boolean;
  score: number;
}

export interface EngagementVelocity {
  postId: string;
  firstHourEngagement: number;
  velocityScore: number;
  peakTime: Date | null;
}

export interface ContentQualitySignals {
  postId: string;
  hasMedia: boolean;
  mediaType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'VOICE';
  contentLength: number;
  hasCaption: boolean;
  estimatedQuality: number;
}

export const DEFAULT_WEIGHTS: AlgorithmWeights = {
  authorNetWorth: 2.5,
  authorInfluence: 2.0,
  authorVerified: 5.0,
  engagementVelocity: 3.0,
  engagementQuality: 2.5,
  contentRecency: 1.5,
  relationshipDepth: 2.0,
  contentQuality: 1.0,
  mediaRichness: 1.2,
  completionRate: 2.0,
  saves: 3.0,
  shares: 4.0,
  comments: 2.0,
  likes: 0.5,
  dwellTime: 2.5,
};

export const NET_WORTH_TIERS = {
  ULTRA_HIGH: { min: 10000000, multiplier: 10.0 },
  HIGH: { min: 1000000, multiplier: 7.0 },
  AFFLUENT: { min: 100000, multiplier: 4.0 },
  EMERGING: { min: 10000, multiplier: 2.0 },
  STANDARD: { min: 0, multiplier: 1.0 },
};

export const INFLUENCE_TIERS = {
  ELITE: { min: 100000, multiplier: 2.5 },
  INFLUENCER: { min: 10000, multiplier: 2.0 },
  CREATOR: { min: 1000, multiplier: 1.5 },
  ACTIVE: { min: 100, multiplier: 1.2 },
  STANDARD: { min: 0, multiplier: 1.0 },
};
