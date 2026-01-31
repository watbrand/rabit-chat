import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { FadeInUp, FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Elite user from /api/leaderboard/elite - same as Mall
interface EliteUser {
  rank: number;
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  netWorth: number;
  influenceScore: number;
  isVerified: boolean;
  category: string | null;
  creatorCategory: string | null;
  businessCategory: string | null;
  country: string | null;
  city: string | null;
}

export default function ContentPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  // Fetch from same endpoint as Mall leaderboard - TOP 5 WEALTHY USERS
  const { data: eliteUsers, isLoading, error, refetch } = useQuery<EliteUser[]>({
    queryKey: ["/api/leaderboard/elite"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/leaderboard/elite", getApiUrl()));
      if (!res.ok) throw new Error("Failed to fetch elite users");
      return res.json();
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
  });

  const handleJoinPress = () => {
    navigation.navigate("AccountType");
  };

  const formatNetWorth = (amount: number): string => {
    if (amount >= 1000000000) return `R${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `R${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `R${(amount / 1000).toFixed(1)}K`;
    return `R${amount.toLocaleString()}`;
  };

  const getRankBadgeColor = (rank: number): string => {
    switch (rank) {
      case 1: return "#FFD700"; // Gold
      case 2: return "#C0C0C0"; // Silver
      case 3: return "#CD7F32"; // Bronze
      default: return "#8B5CF6"; // Purple for 4-5
    }
  };

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return "👑";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return `#${rank}`;
    }
  };

  const getUserCategory = (user: EliteUser): string | null => {
    return user.category || user.creatorCategory || user.businessCategory;
  };

  const getInitials = (name: string | null): string => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderEliteUser = useCallback(({ item, index }: { item: EliteUser; index: number }) => {
    const rankColor = getRankBadgeColor(item.rank);
    const category = getUserCategory(item);

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100).duration(500)}
        style={[
          styles.userCard,
          {
            backgroundColor: theme.glassBackground,
            borderColor: item.rank <= 3 ? rankColor + "40" : theme.glassBorder,
            borderWidth: item.rank <= 3 ? 2 : 1,
          },
        ]}
      >
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankColor, top: insets.top + Spacing.sm }]}>
          <ThemedText style={styles.rankText}>
            {item.rank <= 3 ? getRankEmoji(item.rank) : `#${item.rank}`}
          </ThemedText>
        </View>

        <View style={styles.userContent}>
          {/* Avatar */}
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              style={styles.avatar}
            >
              <ThemedText style={styles.avatarText}>
                {getInitials(item.displayName)}
              </ThemedText>
            </LinearGradient>
          )}

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.displayName} numberOfLines={1}>
                {item.displayName || item.username}
              </ThemedText>
              {item.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={10} color="#FFFFFF" />
                </View>
              ) : null}
            </View>
            
            <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
              @{item.username}
            </ThemedText>

            {/* Net Worth - Prominent Display */}
            <View style={styles.netWorthRow}>
              <Feather name="dollar-sign" size={14} color="#F59E0B" />
              <ThemedText style={styles.netWorthText}>
                {formatNetWorth(item.netWorth)}
              </ThemedText>
            </View>

            {/* Category & Location */}
            <View style={styles.metaRow}>
              {category ? (
                <View style={[styles.categoryBadge, { backgroundColor: theme.primary + "20" }]}>
                  <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
                    {category}
                  </ThemedText>
                </View>
              ) : null}
              {item.country ? (
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={10} color={theme.textSecondary} />
                  <ThemedText style={[styles.locationText, { color: theme.textSecondary }]}>
                    {item.city ? `${item.city}, ` : ""}{item.country}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { borderTopColor: theme.glassBorder }]}>
          <View style={styles.statItem}>
            <Feather name="heart" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              {Math.floor(item.influenceScore / 100)}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="message-circle" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              {Math.floor(item.influenceScore / 200)}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    );
  }, [theme, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={isDark 
          ? ["#1A1A24", "#0D0D14"] 
          : ["#F8F7FF", "#EDE9FE", "#DDD6FE"]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View 
        entering={FadeInDown.duration(600)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ThemedText style={styles.logoIcon}>R</ThemedText>
          </LinearGradient>
          <View>
            <ThemedText style={styles.logoText}>RabitChat</ThemedText>
            <ThemedText style={[styles.logoTagline, { color: theme.textSecondary }]}>
              The Elite Network
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View 
        entering={FadeIn.delay(300).duration(600)}
        style={styles.previewSection}
      >
        <ThemedText style={[styles.previewTitle, { color: theme.textSecondary }]}>
          TOP 5 WEALTHIEST MEMBERS
        </ThemedText>
        <ThemedText style={[styles.previewSubtitle, { color: theme.textSecondary }]}>
          Updated in real-time from the Mall
        </ThemedText>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading elite members...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
            Failed to load elite members
          </ThemedText>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => refetch()}
          >
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={eliteUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEliteUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="users" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Be among the first to join the elite
              </ThemedText>
            </View>
          }
        />
      )}

      <Animated.View
        entering={FadeInUp.delay(600).duration(500)}
        style={[styles.joinOverlay, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={styles.blurContainer}>
            <View style={styles.joinContent}>
              <View>
                <ThemedText style={styles.joinTitle}>Join the Elite</ThemedText>
                <ThemedText style={[styles.joinSubtitle, { color: theme.textSecondary }]}>
                  Connect with high-net-worth individuals
                </ThemedText>
              </View>
              <Pressable
                onPress={handleJoinPress}
                style={({ pressed }) => [
                  styles.joinButton,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                testID="button-join"
              >
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  style={styles.joinButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <ThemedText style={styles.joinButtonText}>Get Started</ThemedText>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>
        ) : (
          <View style={[styles.joinContainer, { backgroundColor: theme.backgroundRoot + "F5" }]}>
            <View style={styles.joinContent}>
              <View>
                <ThemedText style={styles.joinTitle}>Join the Elite</ThemedText>
                <ThemedText style={[styles.joinSubtitle, { color: theme.textSecondary }]}>
                  Connect with high-net-worth individuals
                </ThemedText>
              </View>
              <Pressable
                onPress={handleJoinPress}
                style={({ pressed }) => [
                  styles.joinButton,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                testID="button-join"
              >
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  style={styles.joinButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <ThemedText style={styles.joinButtonText}>Get Started</ThemedText>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoGradient: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  logoIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
  },
  logoTagline: {
    fontSize: 12,
    marginTop: 2,
  },
  previewSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  previewSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
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
    borderRadius: BorderRadius.lg,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["6xl"] + Spacing["6xl"] + Spacing["3xl"],
  },
  userCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  rankBadge: {
    position: "absolute",
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  userContent: {
    flexDirection: "row",
    padding: Spacing.md,
    paddingRight: 56, // Space for rank badge
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  displayName: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  netWorthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  netWorthText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F59E0B",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.lg,
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  joinOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
    overflow: "hidden",
  },
  joinContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.2)",
  },
  joinContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  joinSubtitle: {
    fontSize: 13,
  },
  joinButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: Spacing.sm,
  },
});
