import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface StudioOverview {
  profileViews: number;
  postViews: number;
  likesReceived: number;
  commentsReceived: number;
  sharesReceived: number;
  savesReceived: number;
  newFollowers: number;
  totalWatchTimeMs: number;
  avgWatchTimeMs: number;
  completionRate: number;
  trafficSources: {
    feed: number;
    profile: number;
    search: number;
    share: number;
  };
  trend: {
    profileViews: number;
    postViews: number;
    followers: number;
  };
}

type DateRange = "7d" | "30d" | "90d";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatWatchTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getDateRange(range: DateRange): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();
  switch (range) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
  }
  return { startDate, endDate };
}

export default function StudioOverviewScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  
  const { startDate, endDate } = getDateRange(dateRange);

  const { data: overview, isLoading, refetch, isRefetching } = useQuery<StudioOverview>({
    queryKey: ["/api/studio/overview", dateRange],
    queryFn: async () => {
      const url = new URL("/api/studio/overview", getApiUrl());
      url.searchParams.set("startDate", startDate.toISOString());
      url.searchParams.set("endDate", endDate.toISOString());
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch studio overview");
      return res.json();
    },
  });

  const MetricCard = ({
    icon,
    label,
    value,
    trend,
    color,
  }: {
    icon: string;
    label: string;
    value: string;
    trend?: number;
    color?: string;
  }) => (
    <Card style={styles.metricCard}>
      <View style={[styles.metricIconContainer, { backgroundColor: (color || theme.primary) + "20" }]}>
        <Feather name={icon as any} size={20} color={color || theme.primary} />
      </View>
      <ThemedText type="h2" style={styles.metricValue}>
        {value}
      </ThemedText>
      <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
      {trend !== undefined && trend !== 0 ? (
        <View style={styles.trendContainer}>
          <Feather
            name={trend > 0 ? "trending-up" : "trending-down"}
            size={14}
            color={trend > 0 ? theme.success : theme.error}
          />
          <ThemedText
            style={[
              styles.trendText,
              { color: trend > 0 ? theme.success : theme.error },
            ]}
          >
            {Math.abs(trend)}%
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );

  const DateRangeButton = ({ range, label }: { range: DateRange; label: string }) => (
    <Pressable
      style={[
        styles.dateRangeButton,
        dateRange === range && { backgroundColor: theme.primary },
        { borderColor: theme.glassBorder },
      ]}
      onPress={() => setDateRange(range)}
    >
      <ThemedText
        style={[
          styles.dateRangeText,
          { color: dateRange === range ? "#fff" : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const trafficTotal =
    (overview?.trafficSources.feed || 0) +
    (overview?.trafficSources.profile || 0) +
    (overview?.trafficSources.search || 0) +
    (overview?.trafficSources.share || 0);

  const TrafficBar = ({ source, count, color }: { source: string; count: number; color: string }) => {
    const percentage = trafficTotal > 0 ? Math.round((count / trafficTotal) * 100) : 0;
    return (
      <View style={styles.trafficRow}>
        <View style={[styles.trafficDot, { backgroundColor: color }]} />
        <ThemedText style={styles.trafficLabel}>{source}</ThemedText>
        <View style={styles.trafficBarContainer}>
          <View
            style={[styles.trafficBar, { width: `${percentage}%`, backgroundColor: color }]}
          />
        </View>
        <ThemedText style={[styles.trafficPercentage, { color: theme.textSecondary }]}>
          {percentage}%
        </ThemedText>
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View style={styles.dateRangeContainer}>
        <DateRangeButton range="7d" label="7 Days" />
        <DateRangeButton range="30d" label="30 Days" />
        <DateRangeButton range="90d" label="90 Days" />
      </View>

      <View style={styles.quickLinks}>
        <Pressable
          style={[styles.quickLink, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
          onPress={() => navigation.navigate("StudioContent")}
        >
          <Feather name="file-text" size={20} color={theme.primary} />
          <ThemedText style={styles.quickLinkText}>Content</ThemedText>
          <Feather name="chevron-right" size={16} color={theme.textSecondary} />
        </Pressable>
        <Pressable
          style={[styles.quickLink, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
          onPress={() => navigation.navigate("StudioAudience")}
        >
          <Feather name="users" size={20} color={theme.primary} />
          <ThemedText style={styles.quickLinkText}>Audience</ThemedText>
          <Feather name="chevron-right" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Performance Overview
      </ThemedText>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon="eye"
          label="Profile Views"
          value={formatNumber(overview?.profileViews || 0)}
          trend={overview?.trend.profileViews}
        />
        <MetricCard
          icon="play"
          label="Post Views"
          value={formatNumber(overview?.postViews || 0)}
          trend={overview?.trend.postViews}
        />
        <MetricCard
          icon="heart"
          label="Likes"
          value={formatNumber(overview?.likesReceived || 0)}
        />
        <MetricCard
          icon="message-circle"
          label="Comments"
          value={formatNumber(overview?.commentsReceived || 0)}
        />
        <MetricCard
          icon="user-plus"
          label="New Followers"
          value={formatNumber(overview?.newFollowers || 0)}
          trend={overview?.trend.followers}
          color={theme.success}
        />
        <MetricCard
          icon="share-2"
          label="Shares"
          value={formatNumber(overview?.sharesReceived || 0)}
        />
      </View>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Watch Time
      </ThemedText>

      <Card style={styles.watchTimeCard}>
        <View style={styles.watchTimeRow}>
          <View style={styles.watchTimeStat}>
            <Feather name="clock" size={24} color={theme.primary} />
            <View style={{ marginLeft: Spacing.md }}>
              <ThemedText type="h3">
                {formatWatchTime(overview?.totalWatchTimeMs || 0)}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>Total Watch Time</ThemedText>
            </View>
          </View>
          <View style={styles.watchTimeStatDivider} />
          <View style={styles.watchTimeStat}>
            <ThemedText type="h3">
              {formatWatchTime(overview?.avgWatchTimeMs || 0)}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>Avg per View</ThemedText>
          </View>
          <View style={styles.watchTimeStatDivider} />
          <View style={styles.watchTimeStat}>
            <ThemedText type="h3">{overview?.completionRate || 0}%</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>Completion</ThemedText>
          </View>
        </View>
      </Card>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Traffic Sources
      </ThemedText>

      <Card style={styles.trafficCard}>
        <TrafficBar source="Feed" count={overview?.trafficSources.feed || 0} color={theme.primary} />
        <TrafficBar source="Profile" count={overview?.trafficSources.profile || 0} color={theme.success} />
        <TrafficBar source="Search" count={overview?.trafficSources.search || 0} color={theme.gold} />
        <TrafficBar source="Share" count={overview?.trafficSources.share || 0} color={theme.silver} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dateRangeContainer: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  dateRangeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  quickLinks: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickLink: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  quickLinkText: {
    flex: 1,
    fontWeight: "600",
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metricCard: {
    width: "47%",
    padding: Spacing.md,
    alignItems: "flex-start",
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  metricLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  watchTimeCard: {
    padding: Spacing.lg,
  },
  watchTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  watchTimeStat: {
    flex: 1,
    alignItems: "center",
  },
  watchTimeStatDivider: {
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
