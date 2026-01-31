import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface StudioAudience {
  totalFollowers: number;
  newFollowers: number;
  unfollows: number;
  netGrowth: number;
  dailyFollowerGrowth: { date: string; followers: number; unfollows: number }[];
}

type DateRange = "7d" | "30d" | "90d";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
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

export default function StudioAudienceScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const { startDate, endDate } = getDateRange(dateRange);

  const { data: audience, isLoading, isError, error, refetch, isRefetching } = useQuery<StudioAudience>({
    queryKey: ["/api/studio/audience", dateRange],
    queryFn: async () => {
      const url = new URL("/api/studio/audience", getApiUrl());
      url.searchParams.set("startDate", startDate.toISOString());
      url.searchParams.set("endDate", endDate.toISOString());
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audience data");
      return res.json();
    },
  });

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
        style={[styles.dateRangeText, { color: dateRange === range ? "#fff" : theme.textSecondary }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const StatCard = ({
    icon,
    label,
    value,
    color,
    subtitle,
  }: {
    icon: string;
    label: string;
    value: string;
    color?: string;
    subtitle?: string;
  }) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: (color || theme.primary) + "20" }]}>
        <Feather name={icon as any} size={20} color={color || theme.primary} />
      </View>
      <ThemedText type="h2" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      {subtitle ? (
        <ThemedText style={[styles.statSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </ThemedText>
      ) : null}
    </Card>
  );

  const maxGrowth = Math.max(
    ...((audience?.dailyFollowerGrowth || []).map((d) => Math.max(d.followers, d.unfollows))),
    1
  );

  if (isError) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="alert-circle"
          title="Something went wrong"
          message={(error as Error)?.message || "Failed to load audience data. Please try again."}
          actionLabel="Try Again"
          onAction={refetch}
        />
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.dateRangeContainer}>
        <DateRangeButton range="7d" label="7 Days" />
        <DateRangeButton range="30d" label="30 Days" />
        <DateRangeButton range="90d" label="90 Days" />
      </View>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Follower Summary
      </ThemedText>

      <View style={styles.statsGrid}>
        <StatCard
          icon="users"
          label="Total Followers"
          value={formatNumber(audience?.totalFollowers || 0)}
        />
        <StatCard
          icon="user-plus"
          label="New Followers"
          value={`+${formatNumber(audience?.newFollowers || 0)}`}
          color={theme.success}
        />
        <StatCard
          icon="user-minus"
          label="Unfollows"
          value={formatNumber(audience?.unfollows || 0)}
          color={theme.error}
        />
        <StatCard
          icon="trending-up"
          label="Net Growth"
          value={(audience?.netGrowth || 0) >= 0 ? `+${audience?.netGrowth || 0}` : `${audience?.netGrowth || 0}`}
          color={(audience?.netGrowth || 0) >= 0 ? theme.success : theme.error}
        />
      </View>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Daily Growth
      </ThemedText>

      <Card style={styles.chartCard}>
        {(audience?.dailyFollowerGrowth || []).length > 0 ? (
          <View style={styles.chartContainer}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
                  New Followers
                </ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.error }]} />
                <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
                  Unfollows
                </ThemedText>
              </View>
            </View>

            <View style={styles.barsContainer}>
              {audience?.dailyFollowerGrowth.map((day, index) => {
                const followersHeight = (day.followers / maxGrowth) * 100;
                const unfollowsHeight = (day.unfollows / maxGrowth) * 100;
                const date = new Date(day.date);
                const label = date.toLocaleDateString(undefined, { weekday: "short" });

                return (
                  <View key={index} style={styles.dayColumn}>
                    <View style={styles.barGroup}>
                      <View
                        style={[
                          styles.bar,
                          { height: `${followersHeight}%`, backgroundColor: theme.success },
                        ]}
                      />
                      <View
                        style={[
                          styles.bar,
                          { height: `${unfollowsHeight}%`, backgroundColor: theme.error },
                        ]}
                      />
                    </View>
                    <ThemedText style={[styles.dayLabel, { color: theme.textSecondary }]}>
                      {label}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Feather name="bar-chart-2" size={40} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyChartText, { color: theme.textSecondary }]}>
              No growth data available yet
            </ThemedText>
          </View>
        )}
      </Card>

      <ThemedText type="h3" style={styles.sectionTitle}>
        Insights
      </ThemedText>

      <Card style={styles.insightsCard}>
        <View style={styles.insightRow}>
          <Feather name="info" size={18} color={theme.primary} />
          <View style={styles.insightContent}>
            <ThemedText style={styles.insightTitle}>Follower Growth</ThemedText>
            <ThemedText style={[styles.insightText, { color: theme.textSecondary }]}>
              {(audience?.netGrowth || 0) > 0
                ? `Your audience grew by ${audience?.netGrowth} followers in this period. Keep creating great content!`
                : (audience?.netGrowth || 0) < 0
                ? `You lost ${Math.abs(audience?.netGrowth || 0)} followers in this period. Consider engaging more with your audience.`
                : "Your follower count remained stable in this period."}
            </ThemedText>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
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
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    padding: Spacing.md,
    alignItems: "flex-start",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  statSubtitle: {
    fontSize: 11,
    marginTop: Spacing.xs,
  },
  chartCard: {
    padding: Spacing.lg,
    minHeight: 200,
  },
  chartContainer: {
    flex: 1,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    height: 120,
    alignItems: "flex-end",
  },
  dayColumn: {
    alignItems: "center",
    flex: 1,
  },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 100,
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 2,
  },
  dayLabel: {
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  emptyChart: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  emptyChartText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  insightsCard: {
    padding: Spacing.lg,
  },
  insightRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
