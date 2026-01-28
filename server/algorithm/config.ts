import { AlgorithmWeights, DEFAULT_WEIGHTS } from './types';

let currentWeights: AlgorithmWeights = { ...DEFAULT_WEIGHTS };

export function getAlgorithmWeights(): AlgorithmWeights {
  return { ...currentWeights };
}

export function updateAlgorithmWeights(updates: Partial<AlgorithmWeights>): AlgorithmWeights {
  currentWeights = {
    ...currentWeights,
    ...updates,
  };
  return { ...currentWeights };
}

export function resetAlgorithmWeights(): AlgorithmWeights {
  currentWeights = { ...DEFAULT_WEIGHTS };
  return { ...currentWeights };
}

export interface AlgorithmStats {
  weights: AlgorithmWeights;
  description: {
    authorNetWorth: string;
    authorInfluence: string;
    authorVerified: string;
    engagementVelocity: string;
    engagementQuality: string;
    contentRecency: string;
    relationshipDepth: string;
    contentQuality: string;
    mediaRichness: string;
    completionRate: string;
    saves: string;
    shares: string;
    comments: string;
    likes: string;
    dwellTime: string;
  };
}

export function getAlgorithmDescription(): AlgorithmStats {
  return {
    weights: getAlgorithmWeights(),
    description: {
      authorNetWorth: "Priority boost for high net worth authors (Ultra High: 3x, High: 2x, Affluent: 1.5x)",
      authorInfluence: "Priority boost based on influence score (Elite: 2.5x, Influencer: 2x, Creator: 1.5x)",
      authorVerified: "Verified badge bonus multiplier (5x boost for verified users)",
      engagementVelocity: "First-hour engagement velocity boost (TikTok-style golden hour)",
      engagementQuality: "Quality of engagement (saves/shares weighted higher than likes)",
      contentRecency: "Time decay factor for post age",
      relationshipDepth: "Connection strength between viewer and author (DMs, mutual follows, interactions)",
      contentQuality: "Content quality signals (caption length, media presence)",
      mediaRichness: "Media type bonus (Video > Photo > Voice > Text)",
      completionRate: "Video/audio completion rate factor",
      saves: "Weight for saves (Instagram: high-value signal)",
      shares: "Weight for shares (X/Twitter: 75x more valuable than likes)",
      comments: "Weight for comments (Facebook: meaningful interactions)",
      likes: "Weight for likes (lower value passive engagement)",
      dwellTime: "Time spent viewing content (YouTube: primary signal)",
    },
  };
}
