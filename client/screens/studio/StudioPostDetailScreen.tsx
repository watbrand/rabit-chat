import React, { useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { PostWithAuthor, DailyPostAnalytics } from "@shared/schema";

interface StudioPostDetail {
  post: PostWithAuthor;
  totalViews: number;
  uniqueViews: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalWatchTimeMs: number;
  avgWatchTimeMs: number;
  completionRate: number;
  dailyMetrics: DailyPostAnalytics[];
  trafficSources: {
    feed: number;
    profile: number;
    search: number;
    share: number;
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatWatchTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const POST_TYPE_ICONS: Record<string, string> = {
  TEXT: "file-text",
  PHOTO: "image",
  VIDEO: "video",
  VOICE: "mic",
};

export default function StudioPostDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<any>();
  const postId = route.params?.postId;

  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = new Date();

  const { data: detail, isLoading, refetch, isRefetching } = useQuery<StudioPostDetail>({
    queryKey: ["/api/studio/posts", postId],
    queryFn: async () => {
      const url = new URL(`/api/studio/posts/${postId}`, getApiUrl());
      url.searchParams.set("startDate", startDate.toISOString());
      url.searchParams.set("endDate", endDate.toISOString());
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch post detail");
      return res.json();
    },
    enabled: !!postId,
  });

  const StatRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.statRow}>
      <View style={styles.statRowLeft}>
        <Feather name={icon as any} size={18} color={theme.textSecondary} />
        <ThemedText style={[styles.statRowLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      </View>
      <ThemedText style={styles.statRowValue}>{value}</ThemedText>
    </View>
  );

  const trafficTotal =
    (detail?.trafficSources.feed || 0) +
    (detail?.trafficSources.profile || 0) +
    (detail?.trafficSources.search || 0) +
    (detail?.trafficSources.share || 0);

  const TrafficBar = ({ source, count, color }: { source: string; count: number; color: string }) => {
    const percentage = trafficTotal > 0 ? Math.round((count / trafficTotal) * 100) : 0;
    return (
      <View style={styles.trafficRow}>
        <View style={[styles.trafficDot, { backgroundColor: color }]} />
        <ThemedText style={styles.trafficLabel}>{source}</ThemedText>
        <View style={styles.trafficBarContainer}>
          <View style={[styles.trafficBar, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
        <ThemedText style={[styles.trafficPercentage, { color: theme.textSecondary }]}>
          {percentage}%
        </ThemedText>
      </View>
    );
  };

  const isMediaPost = detail?.post.type === "VIDEO" || detail?.post.type === "VOICE" || detail?.post.type === "PHOTO";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Card style={styles.postPreview}>
        <View style={styles.postPreviewRow}>
          {isMediaPost && detail?.post.thumbnailUrl ? (
            <Image
              source={{ uri: detail.post.thumbnailUrl }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.glassBackground }]}>
              <Feather
                name={POST_TYPE_ICONS[detail?.post.type || "TEXT"] as any}
                size={32}
                color={theme.textSecondary}
              />
            </View>
          )}
          <View style={styles.postInfo}>
            <ThemedText numberOfLines={2} style={styles.postTitle}>
              {detail?.post.caption || detail?.post.content || "Untitled"}
            </ThemedText>
            <View style={styles.postMeta}>
              <Feather name={POST_TYPE_ICONS[detail?.post.type || "TEXT"] as any} size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.postMetaText, { color: theme.textSecondary }]}>
                {detail?.post.type}
              </ThemedText>
              <ThemedText style={[styles.postMetaText, { color: theme.textSecondary }]}>
                {detail?.post.createdAt ? new Date(detail.post.createdAt).toLocaleDateString() : ""}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Engagement
      </ThemedText>

      <Card style={styles.statsCard}>
        <StatRow icon="eye" label="Total Views" value={formatNumber(detail?.totalViews || 0)} />
        <StatRow icon="users" label="Unique Views" value={formatNumber(detail?.uniqueViews || 0)} />
        <StatRow icon="heart" label="Likes" value={formatNumber(detail?.likes || 0)} />
        <StatRow icon="message-circle" label="Comments" value={formatNumber(detail?.comments || 0)} />
        <StatRow icon="share-2" label="Shares" value={formatNumber(detail?.shares || 0)} />
        <StatRow icon="bookmark" label="Saves" value={formatNumber(detail?.saves || 0)} />
      </Card>

      {(detail?.post.type === "VIDEO" || detail?.post.type === "VOICE") ? (
        <>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Watch Time
          </ThemedText>

          <Card style={styles.watchTimeCard}>
            <View style={styles.watchTimeRow}>
              <View style={styles.watchTimeStat}>
                <ThemedText type="h3">
                  {formatWatchTime(detail?.totalWatchTimeMs || 0)}
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Total</ThemedText>
              </View>
              <View style={styles.watchTimeDivider} />
              <View style={styles.watchTimeStat}>
                <ThemedText type="h3">
                  {formatWatchTime(detail?.avgWatchTimeMs || 0)}
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Avg per View</ThemedText>
              </View>
              <View style={styles.watchTimeDivider} />
              <View style={styles.watchTimeStat}>
                <ThemedText type="h3">{detail?.completionRate || 0}%</ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>Completion</ThemedText>
              </View>
            </View>
          </Card>
        </>
      ) : null}

      <ThemedText type="h3" style={styles.sectionTitle}>
        Traffic Sources
      </ThemedText>

      <Card style={styles.trafficCard}>
        <TrafficBar source="Feed" count={detail?.trafficSources.feed || 0} color={theme.primary} />
        <TrafficBar source="Profile" count={detail?.trafficSources.profile || 0} color={theme.success} />
        <TrafficBar source="Search" count={detail?.trafficSources.search || 0} color={theme.gold} />
        <TrafficBar source="Share" count={detail?.trafficSources.share || 0} color={theme.silver} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  postPreview: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  postPreviewRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  postInfo: {
    flex: 1,
    justifyContent: "center",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  postMetaText: {
    fontSize: 12,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  statsCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statRowLabel: {
    fontSize: 14,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  watchTimeCard: {
    padding: Spacing.lg,
  },
  watchTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  watchTimeStat: {
    flex: 1,
    alignItems: "center",
  },
  watchTimeDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  trafficCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  trafficRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  trafficDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trafficLabel: {
    width: 60,
    fontSize: 14,
  },
  trafficBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  trafficBar: {
    height: "100%",
    borderRadius: 4,
  },
  trafficPercentage: {
    width: 40,
    fontSize: 13,
    textAlign: "right",
  },
});
