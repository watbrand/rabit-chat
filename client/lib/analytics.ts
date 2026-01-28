import { getApiUrl } from "@/lib/query-client";

export type TrafficSource = "FEED" | "PROFILE" | "SEARCH" | "SHARE" | "DIRECT" | "OTHER";
export type ContentType = "REEL" | "VOICE" | "PHOTO" | "TEXT" | "STORY";
export type InteractionType = "VIEW" | "LIKE" | "SAVE" | "SHARE" | "COMMENT" | "SKIP" | "REWATCH";

let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  return sessionId;
}

export function resetSessionId(): void {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function mapSource(source: string): TrafficSource {
  const validSources: TrafficSource[] = ["FEED", "PROFILE", "SEARCH", "SHARE", "DIRECT", "OTHER"];
  if (validSources.includes(source as TrafficSource)) {
    return source as TrafficSource;
  }
  return "OTHER";
}

let debounceTimers: Record<string, NodeJS.Timeout> = {};
let pendingViewEvents: Map<string, { postId: string; source: TrafficSource }> = new Map();

export async function trackPostView(postId: string, source: TrafficSource = "FEED"): Promise<void> {
  const key = `view-${postId}`;
  
  if (debounceTimers[key]) {
    return;
  }
  
  debounceTimers[key] = setTimeout(() => {
    delete debounceTimers[key];
  }, 5000);

  try {
    await fetch(new URL(`/api/posts/${postId}/view`, getApiUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ source }),
    });
  } catch (error) {
    console.debug("[Analytics] Failed to track post view:", error);
  }
}

export async function trackProfileView(profileUserId: string, source: TrafficSource = "DIRECT"): Promise<void> {
  const key = `profile-${profileUserId}`;
  
  if (debounceTimers[key]) {
    return;
  }
  
  debounceTimers[key] = setTimeout(() => {
    delete debounceTimers[key];
  }, 10000);

  try {
    await fetch(new URL("/api/studio/profile-view", getApiUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ profileUserId, source }),
    });
  } catch (error) {
    console.debug("[Analytics] Failed to track profile view:", error);
  }
}

export async function trackWatchEvent(
  postId: string,
  watchTimeMs: number,
  completed: boolean,
  source: TrafficSource = "FEED"
): Promise<void> {
  if (watchTimeMs < 1000) {
    return;
  }

  try {
    await fetch(new URL("/api/studio/watch-event", getApiUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postId, watchTimeMs, completed, source }),
    });
  } catch (error) {
    console.debug("[Analytics] Failed to track watch event:", error);
  }
}

export function batchTrackPostViews(postIds: string[], source: TrafficSource = "FEED"): void {
  for (const postId of postIds) {
    if (!pendingViewEvents.has(postId)) {
      pendingViewEvents.set(postId, { postId, source });
    }
  }
  
  setTimeout(flushPendingViews, 500);
}

async function flushPendingViews(): Promise<void> {
  const events = Array.from(pendingViewEvents.values());
  pendingViewEvents.clear();
  
  for (const event of events) {
    await trackPostView(event.postId, event.source);
  }
}

export function trackPostImpression(postId: string, source: TrafficSource = "FEED"): void {
  batchTrackPostViews([postId], source);
}

// Debounce discovery interactions to prevent rate limiting
let discoveryDebounce: Record<string, NodeJS.Timeout> = {};

export async function trackDiscoveryInteraction(data: {
  contentId: string;
  contentType: ContentType;
  interactionType: InteractionType;
  watchTimeMs?: number;
  completionRate?: number;
  rewatchCount?: number;
  skippedAtMs?: number;
  creatorId?: string;
}): Promise<void> {
  // Debounce same content + interaction type for 2 seconds
  const key = `${data.contentId}-${data.interactionType}`;
  if (discoveryDebounce[key]) {
    return;
  }
  
  discoveryDebounce[key] = setTimeout(() => {
    delete discoveryDebounce[key];
  }, 2000);

  try {
    await fetch(new URL("/api/discover/interaction", getApiUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...data,
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    console.debug("[Discovery] Failed to track interaction:", error);
  }
}

export async function trackContentSkip(
  contentId: string,
  contentType: ContentType,
  skippedAtMs: number,
  creatorId?: string
): Promise<void> {
  if (skippedAtMs < 500) return;
  
  await trackDiscoveryInteraction({
    contentId,
    contentType,
    interactionType: "SKIP",
    skippedAtMs,
    watchTimeMs: skippedAtMs,
    completionRate: 0,
    creatorId,
  });
}

export async function trackContentComplete(
  contentId: string,
  contentType: ContentType,
  watchTimeMs: number,
  creatorId?: string
): Promise<void> {
  await trackDiscoveryInteraction({
    contentId,
    contentType,
    interactionType: "VIEW",
    watchTimeMs,
    completionRate: 1.0,
    creatorId,
  });
}

export async function markProfileNotInterested(profileId: string, reason?: string): Promise<void> {
  try {
    await fetch(new URL(`/api/discover/not-interested/profile/${profileId}`, getApiUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });
  } catch (error) {
    console.debug("[Discovery] Failed to mark profile as not interested:", error);
  }
}

export async function markContentNotInterested(contentId: string, reason?: string): Promise<void> {
  try {
    await fetch(new URL(`/api/discover/not-interested/content/${contentId}`, getApiUrl()), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });
  } catch (error) {
    console.debug("[Discovery] Failed to mark content as not interested:", error);
  }
}

export function createWatchTracker(
  postId: string, 
  source: TrafficSource = "FEED",
  options?: {
    contentType?: ContentType;
    creatorId?: string;
    duration?: number;
  }
) {
  let startTime: number | null = null;
  let totalWatchTime = 0;
  let isTracking = false;
  let hasReportedSkip = false;
  const contentType = options?.contentType || "REEL";
  const creatorId = options?.creatorId;
  const duration = options?.duration || 0;

  const calculateRewatchCount = (): number => {
    if (duration <= 0) return 0;
    return Math.max(0, Math.floor(totalWatchTime / duration) - 1);
  };

  return {
    start() {
      if (!isTracking) {
        startTime = Date.now();
        isTracking = true;
      }
    },
    
    pause() {
      if (isTracking && startTime) {
        totalWatchTime += Date.now() - startTime;
        startTime = null;
        isTracking = false;
      }
    },
    
    complete() {
      this.pause();
      if (totalWatchTime > 0) {
        trackWatchEvent(postId, totalWatchTime, true, source);
        const completionRate = duration > 0 ? Math.min(1, totalWatchTime / duration) : 1;
        const rewatchCount = calculateRewatchCount();
        
        if (rewatchCount > 0) {
          trackDiscoveryInteraction({
            contentId: postId,
            contentType,
            interactionType: "REWATCH",
            watchTimeMs: totalWatchTime,
            completionRate: 1.0,
            rewatchCount,
            creatorId,
          });
        } else {
          trackDiscoveryInteraction({
            contentId: postId,
            contentType,
            interactionType: "VIEW",
            watchTimeMs: totalWatchTime,
            completionRate,
            creatorId,
          });
        }
      }
    },
    
    stop() {
      this.pause();
      if (totalWatchTime > 0) {
        trackWatchEvent(postId, totalWatchTime, false, source);
        const completionRate = duration > 0 ? Math.min(1, totalWatchTime / duration) : 0;
        const rewatchCount = calculateRewatchCount();
        
        if (totalWatchTime < 3000 && !hasReportedSkip) {
          hasReportedSkip = true;
          trackDiscoveryInteraction({
            contentId: postId,
            contentType,
            interactionType: "SKIP",
            watchTimeMs: totalWatchTime,
            skippedAtMs: totalWatchTime,
            completionRate,
            creatorId,
          });
        } else if (rewatchCount > 0) {
          trackDiscoveryInteraction({
            contentId: postId,
            contentType,
            interactionType: "REWATCH",
            watchTimeMs: totalWatchTime,
            completionRate: Math.min(1, (totalWatchTime % duration) / duration),
            rewatchCount,
            creatorId,
          });
        } else {
          trackDiscoveryInteraction({
            contentId: postId,
            contentType,
            interactionType: "VIEW",
            watchTimeMs: totalWatchTime,
            completionRate,
            creatorId,
          });
        }
      }
    },
    
    getWatchTime() {
      if (isTracking && startTime) {
        return totalWatchTime + (Date.now() - startTime);
      }
      return totalWatchTime;
    },
    
    getRewatchCount() {
      return calculateRewatchCount();
    },
  };
}
