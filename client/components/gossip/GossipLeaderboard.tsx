import React from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

interface LeaderboardEntry {
  rank: number;
  locationDisplay: string;
  countryCode: string;
  zaLocationId: string | null;
  totalPosts: number;
  totalReactions: number;
  avgTeaMeter: number;
  streakDays: number;
}

interface StreakEntry {
  locationDisplay: string;
  countryCode: string;
  streakDays: number;
  lastActiveDate: string;
}

interface GossipLeaderboardProps {
  onClose?: () => void;
}

function LeaderboardCard({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const { theme } = useTheme();

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return theme.textTertiary;
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) return "award";
    return "hash";
  };

  return (
    <View
      style={[
        styles.leaderboardCard,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
        index < 3 ? { borderColor: getMedalColor(entry.rank) } : null,
      ]}
    >
      <View style={[styles.rankBadge, { backgroundColor: getMedalColor(entry.rank) + "20" }]}>
        <Feather name={getMedalIcon(entry.rank)} size={16} color={getMedalColor(entry.rank)} />
        <ThemedText style={[styles.rankText, { color: getMedalColor(entry.rank) }]}>
          {entry.rank}
        </ThemedText>
      </View>

      <View style={styles.locationInfo}>
        <ThemedText style={styles.locationName} numberOfLines={1}>
          {entry.locationDisplay}
        </ThemedText>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Feather name="message-square" size={10} color={theme.textTertiary} />
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              {entry.totalPosts}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              Avg: {Math.round(entry.avgTeaMeter)}
            </ThemedText>
          </View>
          {entry.streakDays > 0 ? (
            <View style={styles.streakBadge}>
              <ThemedText style={styles.streakText}>{entry.streakDays}d</ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.reactionScore}>
        <ThemedText style={[styles.reactionCount, { color: theme.primary }]}>
          {entry.totalReactions}
        </ThemedText>
        <ThemedText style={[styles.reactionLabel, { color: theme.textTertiary }]}>
          reactions
        </ThemedText>
      </View>
    </View>
  );
}

function StreakCard({ entry }: { entry: StreakEntry }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.streakCard,
        { backgroundColor: theme.glassBackground, borderColor: "#FF6B35" },
      ]}
    >
      <View style={styles.streakFireIcon}>
        <ThemedText style={{ fontSize: 20 }}>{"🔥"}</ThemedText>
      </View>
      <View style={styles.streakInfo}>
        <ThemedText style={styles.streakLocation} numberOfLines={1}>
          {entry.locationDisplay}
        </ThemedText>
        <ThemedText style={[styles.streakDays, { color: "#FF6B35" }]}>
          {entry.streakDays} day streak
        </ThemedText>
      </View>
    </View>
  );
}

export function GossipLeaderboard({ onClose }: GossipLeaderboardProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/gossip/leaderboard"],
    staleTime: 1000 * 60 * 5,
  });

  const { data: streaks = [], isLoading: loadingStreaks } = useQuery<StreakEntry[]>({
    queryKey: ["/api/gossip/streaks"],
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = loadingLeaderboard || loadingStreaks;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {onClose ? (
        <View style={styles.header}>
          <ThemedText type="h3">Leaderboard</ThemedText>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
      ) : null}

      {streaks.length > 0 ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Active Streaks
          </ThemedText>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={streaks.slice(0, 5)}
            keyExtractor={(item) => item.locationDisplay}
            contentContainerStyle={styles.streaksList}
            renderItem={({ item }) => <StreakCard entry={item} />}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Top Locations
        </ThemedText>
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => `${item.countryCode}-${item.zaLocationId || "all"}`}
          renderItem={({ item, index }) => <LeaderboardCard entry={item} index={index} />}
          contentContainerStyle={[styles.leaderboardList, { paddingBottom: insets.bottom + Spacing.lg }]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="bar-chart-2" size={48} color={theme.textTertiary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No activity yet. Be the first to spill the tea!
              </ThemedText>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    padding: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
  },
  streaksList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
    minWidth: 150,
  },
  streakFireIcon: {
    marginRight: Spacing.sm,
  },
  streakInfo: {
    flex: 1,
  },
  streakLocation: {
    fontSize: 12,
    fontWeight: "600",
  },
  streakDays: {
    fontSize: 11,
    fontWeight: "500",
  },
  leaderboardList: {
    paddingHorizontal: Spacing.md,
  },
  leaderboardCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
    minWidth: 50,
    justifyContent: "center",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
  streakBadge: {
    backgroundColor: "#FF6B3520",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  streakText: {
    fontSize: 10,
    color: "#FF6B35",
    fontWeight: "600",
  },
  reactionScore: {
    alignItems: "center",
  },
  reactionCount: {
    fontSize: 18,
    fontWeight: "700",
  },
  reactionLabel: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
