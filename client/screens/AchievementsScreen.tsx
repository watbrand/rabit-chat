import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { LoadingIndicator } from "@/components/animations";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  coinReward: number;
  targetValue: number;
  currentProgress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  icon: string;
}

type Category = "all" | "shopping" | "gifting" | "wealth" | "content" | "social" | "special";

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "grid" },
  { id: "shopping", label: "Shopping", icon: "shopping-bag" },
  { id: "gifting", label: "Gifting", icon: "gift" },
  { id: "wealth", label: "Wealth", icon: "trending-up" },
  { id: "content", label: "Content", icon: "image" },
  { id: "social", label: "Social", icon: "users" },
  { id: "special", label: "Special", icon: "star" },
];

const getCategoryColor = (category: string): [string, string] => {
  switch (category.toLowerCase()) {
    case "shopping":
      return ["#8B5CF6", "#A78BFA"];
    case "gifting":
      return ["#EC4899", "#F472B6"];
    case "wealth":
      return ["#F59E0B", "#FBBF24"];
    case "content":
      return ["#14B8A6", "#2DD4BF"];
    case "social":
      return ["#3B82F6", "#60A5FA"];
    case "special":
      return ["#EF4444", "#F87171"];
    default:
      return ["#8B5CF6", "#EC4899"];
  }
};

function AchievementCard({
  achievement,
  onClaim,
  index,
}: {
  achievement: Achievement;
  onClaim: (id: string) => void;
  index: number;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const progress = Math.min((achievement.currentProgress / achievement.targetValue) * 100, 100);
  const categoryColors = getCategoryColor(achievement.category);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (achievement.isCompleted && !achievement.isClaimed) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onClaim(achievement.id);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      style={[styles.achievementCardWrapper, animatedStyle]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        disabled={!achievement.isCompleted || achievement.isClaimed}
        style={[
          styles.achievementCard,
          {
            backgroundColor: isDark ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.9)",
            borderColor: achievement.isCompleted
              ? achievement.isClaimed
                ? theme.success + "60"
                : theme.gold
              : theme.border,
            borderWidth: achievement.isCompleted && !achievement.isClaimed ? 2 : 1,
            opacity: achievement.isCompleted ? 1 : 0.7,
          },
        ]}
      >
        {achievement.isCompleted && achievement.isClaimed ? (
          <View style={[styles.claimedBadge, { backgroundColor: theme.success }]}>
            <Feather name="check" size={12} color="#FFFFFF" />
          </View>
        ) : null}

        <LinearGradient
          colors={categoryColors}
          style={styles.achievementIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={achievement.icon as any} size={24} color="#FFFFFF" />
        </LinearGradient>

        <ThemedText
          style={[styles.achievementName, { color: theme.text }]}
          numberOfLines={2}
        >
          {achievement.name}
        </ThemedText>

        <ThemedText
          style={[styles.achievementDescription, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {achievement.description}
        </ThemedText>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
            <LinearGradient
              colors={achievement.isCompleted ? Gradients.gold : categoryColors}
              style={[styles.progressFill, { width: `${progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
            {achievement.currentProgress}/{achievement.targetValue}
          </ThemedText>
        </View>

        <View style={styles.rewardContainer}>
          <Feather name="award" size={14} color={theme.gold} />
          <ThemedText style={[styles.rewardText, { color: theme.gold }]}>
            {achievement.coinReward} coins
          </ThemedText>
        </View>

        {achievement.isCompleted && !achievement.isClaimed ? (
          <LinearGradient
            colors={Gradients.gold}
            style={styles.claimButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <ThemedText style={styles.claimButtonText}>Claim</ThemedText>
          </LinearGradient>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function AchievementsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  const { data: achievements = [], isLoading, error, refetch, isRefetching } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const claimMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      return apiRequest("POST", `/api/achievements/${achievementId}/claim`);
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to claim achievement. Please try again.');
    },
  });

  const handleClaimAchievement = (achievementId: string) => {
    claimMutation.mutate(achievementId);
  };

  const filteredAchievements = achievements.filter((a) =>
    selectedCategory === "all" ? true : a.category.toLowerCase() === selectedCategory
  );

  const totalAchievements = achievements.length;
  const completedAchievements = achievements.filter((a) => a.isCompleted).length;
  const unclaimedRewards = achievements
    .filter((a) => a.isCompleted && !a.isClaimed)
    .reduce((sum, a) => sum + a.coinReward, 0);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          Failed to load achievements
        </ThemedText>
        <Pressable
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => refetch()}
        >
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.springify()}>
          <Card variant="glass" style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <ThemedText style={[styles.statValue, { color: theme.text }]}>
                  {completedAchievements}/{totalAchievements}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Completed
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <ThemedText style={[styles.statValue, { color: theme.gold }]}>
                  {unclaimedRewards}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Unclaimed Coins
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedCategory(category.id);
              }}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === category.id
                      ? theme.primary
                      : isDark
                      ? "rgba(26, 26, 36, 0.8)"
                      : "rgba(255, 255, 255, 0.9)",
                  borderColor: selectedCategory === category.id ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.categoryLabel,
                  { color: selectedCategory === category.id ? "#FFFFFF" : theme.text },
                ]}
              >
                {category.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onClaim={handleClaimAchievement}
              index={index}
            />
          ))}
        </View>

        {filteredAchievements.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="award" size={48} color={theme.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No achievements in this category yet
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  statsCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.lg,
  },
  categoriesScroll: {
    marginBottom: Spacing.lg,
  },
  categoriesContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  achievementCardWrapper: {
    width: CARD_WIDTH,
  },
  achievementCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    position: "relative",
  },
  claimedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.sm,
    height: 32,
  },
  progressContainer: {
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    textAlign: "right",
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: "600",
  },
  claimButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  claimButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
