export type AnonGossipPost = {
  id: string;
  deviceHash: string;
  countryCode: string | null;
  zaLocationId: string | null;
  locationDisplay: string | null;
  type: "TEXT" | "VOICE";
  content: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationMs: number | null;
  isWhisper: boolean;
  whisperExpiresAt: string | null;
  teaMeter: number;
  fireCount: number;
  mindblownCount: number;
  laughCount: number;
  skullCount: number;
  eyesCount: number;
  replyCount: number;
  viewCount: number;
  reportCount: number;
  isHidden: boolean;
  isRemovedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  myReactions?: string[];
};

export type AnonGossipReply = {
  id: string;
  postId: string;
  parentReplyId: string | null;
  content: string;
  depth: number;
  fireCount: number;
  mindblownCount: number;
  laughCount: number;
  skullCount: number;
  eyesCount: number;
  createdAt: string;
  myReactions?: string[];
};

export type Country = {
  id: string;
  code: string;
  name: string;
  isSouthAfrica: boolean;
  isActive: boolean;
  sortOrder: number;
};

export function getCountryFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export type ZaLocation = {
  id: string;
  province: string;
  city: string | null;
  kasi: string | null;
  level: number;
  population: number | null;
  isActive: boolean;
};

export type LocationStats = {
  id: string;
  locationType: string;
  locationId: string;
  locationDisplay: string;
  totalPosts: number;
  postsToday: number;
  postsThisWeek: number;
  streakDays: number;
  milestoneReached: number;
  trendingScore: number;
};

export type ReactionType = "FIRE" | "MINDBLOWN" | "LAUGH" | "SKULL" | "EYES";

export const REACTION_EMOJI: Record<ReactionType, string> = {
  FIRE: "🔥",
  MINDBLOWN: "🤯",
  LAUGH: "😂",
  SKULL: "💀",
  EYES: "👀",
};

export const REACTION_COLORS: Record<ReactionType, string> = {
  FIRE: "#FF6B35",
  MINDBLOWN: "#8B5CF6",
  LAUGH: "#FFD700",
  SKULL: "#FFFFFF",
  EYES: "#1DA1F2",
};
