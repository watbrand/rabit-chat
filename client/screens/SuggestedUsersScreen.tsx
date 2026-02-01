import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const { width } = Dimensions.get("window");

// Elite user from leaderboard - synced with Mall's top 5 wealthy users
interface EliteUser {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  netWorth: number;
  influenceScore: number;
  isVerified: boolean;
  category: "PERSONAL" | "CREATOR" | "BUSINESS";
  creatorCategory?: string | null;
  businessCategory?: string | null;
  country?: string | null;
  city?: string | null;
}

function formatNetWorth(value: number): string {
  if (value >= 1000000000) {
    return `R${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `R${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R${(value / 1000).toFixed(1)}K`;
  }
  return `R${value.toLocaleString()}`;
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "PERSONAL":
      return "Personal Elite";
    case "CREATOR":
      return "Creator";
    case "BUSINESS":
      return "Business";
    default:
      return "Elite";
  }
}

const RANK_COLORS = {
  1: "#FFD700", // Gold
  2: "#C0C0C0", // Silver
  3: "#CD7F32", // Bronze
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getInitials(displayName: string | null, username: string): string {
  const name = displayName || username;
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}


function UserCard({
  user,
  isFollowing,
  onFollow,
  index,
}: {
  user: EliteUser;
  isFollowing: boolean;
  onFollow: () => void;
  index: number;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const followingAnim = useSharedValue(isFollowing ? 1 : 0);

  useEffect(() => {
    followingAnim.value = withSpring(isFollowing ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isFollowing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolate(
      followingAnim.value,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP
    ) === 1
      ? theme.primary
      : "transparent",
    borderWidth: interpolate(followingAnim.value, [0, 1], [0, 1.5], Extrapolation.CLAMP),
    borderColor: theme.primary,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const rankColor = RANK_COLORS[user.rank as keyof typeof RANK_COLORS] || theme.primary;
  const isTop3 = user.rank <= 3;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 60).springify()}
      style={animatedStyle}
    >
      <View
        style={[
          styles.userCard,
          {
            backgroundColor: isDark
              ? "rgba(139, 92, 246, 0.08)"
              : "rgba(139, 92, 246, 0.05)",
            borderColor: isTop3 ? `${rankColor}40` : isDark
              ? "rgba(139, 92, 246, 0.20)"
              : "rgba(139, 92, 246, 0.15)",
          },
        ]}
        testID={`user-card-${user.username}`}
      >
        <View style={styles.userContent}>
          {/* Rank Badge */}
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor: isTop3 ? rankColor : theme.primary,
              },
            ]}
          >
            <ThemedText style={styles.rankText}>#{user.rank}</ThemedText>
          </View>

          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Avatar uri={user.avatarUrl} size={56} />
            ) : (
              <View
                style={[
                  styles.initialsAvatar,
                  { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText style={styles.initialsText}>
                  {getInitials(user.displayName, user.username)}
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <ThemedText
                style={[styles.displayName, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}
                numberOfLines={1}
              >
                {user.displayName || user.username}
              </ThemedText>
              {user.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <VerifiedBadge size={16} />
                </View>
              ) : null}
            </View>

            <ThemedText
              style={[styles.username, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              @{user.username}
            </ThemedText>

            {/* Net Worth - prominently displayed */}
            <View style={styles.netWorthRow}>
              <Feather name="trending-up" size={14} color="#F59E0B" />
              <ThemedText style={styles.netWorthText}>
                {formatNetWorth(user.netWorth)}
              </ThemedText>
            </View>

            {/* Category & Location */}
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: isDark
                      ? "rgba(139, 92, 246, 0.20)"
                      : "rgba(139, 92, 246, 0.12)",
                  },
                ]}
              >
                <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
                  {getCategoryLabel(user.category)}
                </ThemedText>
              </View>
              {user.city || user.country ? (
                <View style={styles.locationBadge}>
                  <Feather name="map-pin" size={10} color={theme.textTertiary} />
                  <ThemedText style={[styles.locationText, { color: theme.textTertiary }]}>
                    {user.city || user.country}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          <AnimatedPressable
            onPress={onFollow}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.followButton, buttonStyle]}
            testID={`follow-button-${user.username}`}
          >
            <ThemedText
              style={[
                styles.followButtonText,
                { color: isFollowing ? theme.primary : "#FFFFFF" },
              ]}
            >
              {isFollowing ? "Following" : "Follow"}
            </ThemedText>
          </AnimatedPressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function SuggestedUsersScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  // Fetch top 5 wealthy users - same data as Mall's Elite Leaderboard
  const { data: users = [], isLoading } = useQuery<EliteUser[]>({
    queryKey: ["/api/leaderboard/elite"],
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });

  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "follow" | "unfollow" }) => {
      if (action === "follow") {
        return apiRequest("POST", `/api/users/${userId}/follow`);
      } else {
        return apiRequest("DELETE", `/api/users/${userId}/follow`);
      }
    },
    onError: (error: any, variables) => {
      setFollowedIds((prev) => {
        const newSet = new Set(prev);
        if (variables.action === "follow") {
          newSet.delete(variables.userId);
        } else {
          newSet.add(variables.userId);
        }
        return newSet;
      });
      Alert.alert("Error", error.message || "Failed to update follow status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard/elite"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/onboarding/complete", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      navigation.navigate("WelcomeComplete");
    },
    onError: (error: any) => {
      // Always continue - onboarding state can be updated later
      navigation.navigate("WelcomeComplete");
    },
  });

  const handleFollow = useCallback((userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowedIds((prev) => {
      const newSet = new Set(prev);
      const isCurrentlyFollowing = newSet.has(userId);
      
      if (isCurrentlyFollowing) {
        newSet.delete(userId);
        followMutation.mutate({ userId, action: "unfollow" });
      } else {
        newSet.add(userId);
        followMutation.mutate({ userId, action: "follow" });
      }
      
      return newSet;
    });
  }, [followMutation]);

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeMutation.mutate();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeMutation.mutate();
  };

  const followedCount = followedIds.size;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient
          colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
          style={StyleSheet.absoluteFill}
        />
        <LoadingIndicator size="large" />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading Elite Network...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={FadeIn.duration(600)}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <ThemedText style={[styles.title, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
            The Elite Network
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: isDark ? "rgba(255,255,255,0.7)" : "#666" }]}>
            Top 5 wealthiest members in the community
          </ThemedText>
        </View>
        {followedCount > 0 ? (
          <View style={[styles.progressPill, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
            <ThemedText style={[styles.progressText, { color: theme.primary }]}>
              {followedCount} followed
            </ThemedText>
          </View>
        ) : null}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {users.map((user, index) => (
          <UserCard
            key={user.id}
            user={user}
            isFollowing={followedIds.has(user.id)}
            onFollow={() => handleFollow(user.id)}
            index={index}
          />
        ))}

        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather
              name="users"
              size={48}
              color={theme.textTertiary}
              style={{ marginBottom: 16 }}
            />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No suggestions available right now
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(500).springify()}
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <BlurView
          intensity={isDark ? 40 : 80}
          tint={isDark ? "dark" : "light"}
          style={styles.footerBlur}
        >
          <View style={styles.footerContent}>
            <Pressable
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={completeMutation.isPending}
              testID="skip-button"
            >
              <ThemedText style={[styles.skipText, { color: theme.textSecondary }]}>
                Skip for now
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.continueButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleContinue}
              disabled={completeMutation.isPending}
              testID="continue-button"
            >
              {completeMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <>
                  <ThemedText style={styles.continueText}>
                    Continue
                  </ThemedText>
                  <Feather
                    name="arrow-right"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>

      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={[styles.decorCircle2, { backgroundColor: theme.primary }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  userCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    marginRight: 14,
  },
  initialsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  netWorthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  netWorthText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F59E0B",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
  },
  matchTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerBlur: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  continueButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  decorCircle1: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    pointerEvents: "none",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
    pointerEvents: "none",
  },
});
