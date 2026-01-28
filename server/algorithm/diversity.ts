/**
 * Diversity Engine - Ensures feed variety by spacing out content from same creators
 * 
 * Key principles:
 * 1. Creator Spacing: After showing creator A, wait N items before showing A again
 * 2. Weighted Priority: Still prioritize verified/wealthy users, but enforce spacing
 * 3. Score Penalty: Apply decay for recently shown creators
 */

export interface DiversifiableItem {
  id: string;
  authorId: string;
  score?: number;
}

export interface DiversityConfig {
  // Minimum items between same creator
  minSpacing: number;
  // Maximum items from same creator in result set
  maxPerCreator: number;
  // Score penalty multiplier for recently seen creators (0-1)
  recentCreatorPenalty: number;
  // Whether to shuffle within score tiers for more variety
  shuffleWithinTiers: boolean;
}

export const DEFAULT_DIVERSITY_CONFIG: DiversityConfig = {
  minSpacing: 4,           // At least 4 posts between same creator
  maxPerCreator: 3,        // Max 3 posts from same creator in a batch
  recentCreatorPenalty: 0.3, // 70% penalty for recently seen
  shuffleWithinTiers: true,
};

/**
 * Apply diversity to a list of items while respecting scores
 * This intelligently spaces out content from the same creator
 */
export function applyDiversity<T extends DiversifiableItem>(
  items: T[],
  config: Partial<DiversityConfig> = {}
): T[] {
  const cfg = { ...DEFAULT_DIVERSITY_CONFIG, ...config };
  
  if (items.length === 0) return [];

  // Track how many times each creator appears
  const creatorCounts = new Map<string, number>();
  
  // Track last position of each creator in result
  const lastPosition = new Map<string, number>();
  
  // Result with proper spacing
  const result: T[] = [];
  
  // Items we couldn't place yet (need spacing)
  const deferred: T[] = [];
  
  // First pass: place items respecting spacing
  for (const item of items) {
    const count = creatorCounts.get(item.authorId) || 0;
    
    // Skip if creator already at max
    if (count >= cfg.maxPerCreator) {
      continue;
    }
    
    const lastPos = lastPosition.get(item.authorId);
    const currentPos = result.length;
    
    // Check if we need to defer this item
    if (lastPos !== undefined && (currentPos - lastPos) < cfg.minSpacing) {
      deferred.push(item);
      continue;
    }
    
    // Place item
    result.push(item);
    creatorCounts.set(item.authorId, count + 1);
    lastPosition.set(item.authorId, currentPos);
  }
  
  // Second pass: try to place deferred items where spacing allows
  for (const item of deferred) {
    const count = creatorCounts.get(item.authorId) || 0;
    if (count >= cfg.maxPerCreator) continue;
    
    // Find a valid position
    const lastPos = lastPosition.get(item.authorId) || -cfg.minSpacing;
    const validPos = lastPos + cfg.minSpacing;
    
    if (validPos < result.length) {
      // Insert at valid position
      result.splice(validPos, 0, item);
      creatorCounts.set(item.authorId, count + 1);
      lastPosition.set(item.authorId, validPos);
      
      // Update positions of creators after insertion
      for (const [creator, pos] of lastPosition) {
        if (pos >= validPos && creator !== item.authorId) {
          lastPosition.set(creator, pos + 1);
        }
      }
    } else if (result.length - (lastPos + 1) >= cfg.minSpacing) {
      // Append at end if spacing is satisfied
      result.push(item);
      creatorCounts.set(item.authorId, count + 1);
      lastPosition.set(item.authorId, result.length - 1);
    }
  }
  
  return result;
}

/**
 * Advanced diversity with score-based placement
 * Maintains rough score order while enforcing diversity
 */
export function applyDiversityWithScores<T extends DiversifiableItem>(
  items: T[],
  config: Partial<DiversityConfig> = {}
): T[] {
  const cfg = { ...DEFAULT_DIVERSITY_CONFIG, ...config };
  
  if (items.length === 0) return [];
  
  // Sort by score first (highest first)
  const sorted = [...items].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Apply diversity scoring penalty for repeated creators
  const creatorSeen = new Map<string, number>();
  const adjusted = sorted.map(item => {
    const seen = creatorSeen.get(item.authorId) || 0;
    const penalty = Math.pow(cfg.recentCreatorPenalty, seen);
    const adjustedScore = (item.score || 1) * (seen === 0 ? 1 : penalty);
    creatorSeen.set(item.authorId, seen + 1);
    return { ...item, adjustedScore };
  });
  
  // Re-sort by adjusted score
  adjusted.sort((a, b) => b.adjustedScore - a.adjustedScore);
  
  // Now apply spacing rules
  return applyDiversity(adjusted, cfg);
}

/**
 * Interleave items from different creators for maximum variety
 * Useful for discovery feeds where variety matters most
 */
export function interleaveByCreator<T extends DiversifiableItem>(
  items: T[],
  maxPerCreator: number = 2
): T[] {
  if (items.length === 0) return [];
  
  // Group by creator
  const byCreator = new Map<string, T[]>();
  for (const item of items) {
    const list = byCreator.get(item.authorId) || [];
    list.push(item);
    byCreator.set(item.authorId, list);
  }
  
  // Sort creators by their best item's score
  const creators = [...byCreator.entries()]
    .map(([id, items]) => ({
      id,
      items: items.slice(0, maxPerCreator),
      bestScore: Math.max(...items.map(i => i.score || 0))
    }))
    .sort((a, b) => b.bestScore - a.bestScore);
  
  // Interleave: take one from each creator in round-robin
  const result: T[] = [];
  let round = 0;
  let hasMore = true;
  
  while (hasMore) {
    hasMore = false;
    for (const creator of creators) {
      if (round < creator.items.length) {
        result.push(creator.items[round]);
        hasMore = true;
      }
    }
    round++;
  }
  
  return result;
}

/**
 * Smart shuffle within score tiers for more organic variety
 * Groups items by similar scores and shuffles within groups
 */
export function shuffleWithinTiers<T extends DiversifiableItem>(
  items: T[],
  tierSize: number = 5
): T[] {
  if (items.length === 0) return [];
  
  const sorted = [...items].sort((a, b) => (b.score || 0) - (a.score || 0));
  const result: T[] = [];
  
  for (let i = 0; i < sorted.length; i += tierSize) {
    const tier = sorted.slice(i, i + tierSize);
    // Fisher-Yates shuffle
    for (let j = tier.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [tier[j], tier[k]] = [tier[k], tier[j]];
    }
    result.push(...tier);
  }
  
  return result;
}

/**
 * Combined diversity application for feeds
 * This is the main function to use for all feed types
 */
export function diversifyFeed<T extends DiversifiableItem>(
  items: T[],
  options: {
    minSpacing?: number;
    maxPerCreator?: number;
    useScoreWeighting?: boolean;
    shuffleTiers?: boolean;
  } = {}
): T[] {
  const {
    minSpacing = 4,
    maxPerCreator = 3,
    useScoreWeighting = true,
    shuffleTiers = false,
  } = options;

  let result: T[];
  
  if (useScoreWeighting) {
    result = applyDiversityWithScores(items, { minSpacing, maxPerCreator });
  } else {
    result = interleaveByCreator(items, maxPerCreator);
  }
  
  if (shuffleTiers) {
    result = shuffleWithinTiers(result);
  }
  
  return result;
}
