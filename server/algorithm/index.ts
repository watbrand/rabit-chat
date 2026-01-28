export { EliteFeedAlgorithm, feedAlgorithm } from './feed';
export { ScoringEngine } from './scoring';
export { VelocityTracker } from './velocity';
export { RelationshipCalculator } from './relationships';
export { getAlgorithmWeights, updateAlgorithmWeights, resetAlgorithmWeights, getAlgorithmDescription } from './config';
export * from './types';
export { 
  diversifyFeed, 
  applyDiversity, 
  applyDiversityWithScores, 
  interleaveByCreator,
  shuffleWithinTiers,
  DEFAULT_DIVERSITY_CONFIG 
} from './diversity';
