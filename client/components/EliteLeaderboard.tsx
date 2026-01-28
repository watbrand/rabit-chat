import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  FadeInDown,
  WithSpringConfig,
  interpolate,
} from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ThemedText } from "@/components/ThemedText";
import { ShimmerSkeleton } from "@/components/ShimmerSkeleton";
import { useTheme } from "@/hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Typography,
  Gradients,
  GlassStyles,
  Shadows,
} from "@/constants/theme";

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

interface EliteLeaderboardProps {
  variant?: "horizontal" | "vertical";
  showTitle?: boolean;
  onUserPress?: (userId: string) => void;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 1,
  stiffness: 120,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  return `R${value}`;
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "PERSONAL":
      return "Personal";
    case "CREATOR":
      return "Creator";
    case "BUSINESS":
      return "Business";
    default:
      return "Personal";
  }
}

function getCategoryIcon(category: string): keyof typeof Feather.glyphMap {
  switch (category) {
    case "CREATOR":
      return "star";
    case "BUSINESS":
      return "briefcase";
    default:
      return "user";
  }
}

const RANK_COLORS = {
  1: {
    primary: "#FFD700",
    secondary: "#FFA500",
    glow: "rgba(255, 215, 0, 0.4)",
    gradient: ["#FFD700", "#FFA500"] as const,
  },
  2: {
    primary: "#C0C0C0",
    secondary: "#A0A0A0",
    glow: "rgba(192, 192, 192, 0.4)",
    gradient: ["#E8E8E8", "#C0C0C0"] as const,
  },
  3: {
    primary: "#CD7F32",
    secondary: "#B87333",
    glow: "rgba(205, 127, 50, 0.4)",
    gradient: ["#CD7F32", "#B87333"] as const,
  },
};

function RankBadge({ rank }: { rank: number }) {
  const { theme, isDark } = useTheme();
  const isTop3 = rank <= 3;
  const rankColor = RANK_COLORS[rank as keyof typeof RANK_COLORS];

  if (isTop3 && rankColor) {
    return (
      <View
        style={[
          styles.rankBadge,
          {
            shadowColor: rankColor.glow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.8,
            shadowRadius: 6,
          },
        ]}
      >
        <LinearGradient
          colors={rankColor.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rankBadgeGradient}
        >
          <ThemedText style={styles.rankNumber} weight="bold">
            {rank}
          </ThemedText>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.rankBadge,
        styles.rankBadgeDefault,
        {
          backgroundColor: isDark
            ? "rgba(139, 92, 246, 0.25)"
            : "rgba(139, 92, 246, 0.15)",
          borderColor: theme.primary,
        },
      ]}
    >
      <ThemedText
        style={[styles.rankNumber, { color: theme.primary }]}
        weight="bold"
      >
        {rank}
      </ThemedText>
    </View>
  );
}

function EliteUserCard({
  user,
  index,
  onPress,
  variant,
}: {
  user: EliteUser;
  index: number;
  onPress: () => void;
  variant: "horizontal" | "vertical";
}) {
  const { theme, isDark } = useTheme();
  const pressed = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;
    scale.value = withDelay(delay, withSpring(1, springConfig));
    opacity.value = withDelay(delay, withSpring(1, springConfig));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * interpolate(pressed.value, [0, 1], [1, 0.97]) }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    pressed.value = withSpring(1, springConfig);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, springConfig);
  };

  const cardContent = (
    <>
      <RankBadge rank={user.rank} />

      <View style={variant === "horizontal" ? styles.avatarContainerH : styles.avatarContainerV}>
        <Avatar uri={user.avatarUrl} size={variant === "horizontal" ? 56 : 48} />
      </View>

      <View style={variant === "horizontal" ? styles.userInfoH : styles.userInfoV}>
        <View style={styles.nameRow}>
          <ThemedText
            style={[
              styles.displayName,
              variant === "horizontal" && styles.displayNameH,
            ]}
            numberOfLines={1}
            weight="semiBold"
          >
            {user.displayName}
          </ThemedText>
          {user.isVerified ? (
            <VerifiedBadge size={14} />
          ) : null}
        </View>

        <ThemedText
          style={[styles.username, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          @{user.username}
        </ThemedText>

        <View style={styles.netWorthRow}>
          <ThemedText
            style={[styles.netWorth, { color: theme.gold }]}
            weight="bold"
          >
            {formatNetWorth(user.netWorth)}
          </ThemedText>
        </View>

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
            <Feather
              name={getCategoryIcon(user.category)}
              size={10}
              color={theme.primary}
            />
            <ThemedText
              style={[styles.categoryText, { color: theme.primary }]}
            >
              {getCategoryLabel(user.category)}
            </ThemedText>
          </View>

          {user.city || user.country ? (
            <View style={styles.locationRow}>
              <Feather
                name="map-pin"
                size={10}
                color={theme.textTertiary}
              />
              <ThemedText
                style={[styles.locationText, { color: theme.textTertiary }]}
                numberOfLines={1}
              >
                {user.city || user.country}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </>
  );

  const glassConfig = isDark ? GlassStyles.dark.elevated : GlassStyles.light.elevated;

  if (Platform.OS === "ios") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          variant === "horizontal" ? styles.cardWrapperH : styles.cardWrapperV,
          animatedStyle,
          Shadows.md,
        ]}
        testID={`elite-user-card-${user.id}`}
      >
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? "dark" : "light"}
          style={[
            variant === "horizontal" ? styles.cardH : styles.cardV,
            glassConfig,
          ]}
        >
          {cardContent}
        </BlurView>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        variant === "horizontal" ? styles.cardH : styles.cardV,
        glassConfig,
        animatedStyle,
        Shadows.md,
      ]}
      testID={`elite-user-card-${user.id}`}
    >
      {cardContent}
    </AnimatedPressable>
  );
}

function EliteUserSkeleton({ variant }: { variant: "horizontal" | "vertical" }) {
  const { theme } = useTheme();

  if (variant === "horizontal") {
    return (
      <View
        style={[
          styles.cardH,
          styles.skeletonCard,
          {
            backgroundColor: theme.glassBackground,
            borderColor: theme.glassBorder,
          },
        ]}
        testID="elite-user-skeleton"
      >
        <ShimmerSkeleton width={28} height={28} borderRadius={14} />
        <ShimmerSkeleton width={56} height={56} borderRadius={28} style={{ marginTop: Spacing.sm }} />
        <ShimmerSkeleton width={80} height={14} style={{ marginTop: Spacing.sm }} />
        <ShimmerSkeleton width={60} height={12} style={{ marginTop: Spacing.xs }} />
        <ShimmerSkeleton width={50} height={16} style={{ marginTop: Spacing.sm }} />
        <ShimmerSkeleton width={60} height={18} borderRadius={9} style={{ marginTop: Spacing.sm }} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cardV,
        styles.skeletonCard,
        {
          backgroundColor: theme.glassBackground,
          borderColor: theme.glassBorder,
        },
      ]}
      testID="elite-user-skeleton"
    >
      <ShimmerSkeleton width={28} height={28} borderRadius={14} />
      <ShimmerSkeleton width={48} height={48} borderRadius={24} />
      <View style={styles.skeletonInfoV}>
        <ShimmerSkeleton width={100} height={14} />
        <ShimmerSkeleton width={70} height={12} style={{ marginTop: Spacing.xs }} />
        <ShimmerSkeleton width={60} height={14} style={{ marginTop: Spacing.xs }} />
      </View>
      <ShimmerSkeleton width={60} height={18} borderRadius={9} />
    </View>
  );
}

function EmptyState() {
  const { theme } = useTheme();

  return (
    <View style={styles.emptyState} testID="elite-leaderboard-empty">
      <MaterialCommunityIcons
        name="crown-outline"
        size={48}
        color={theme.textTertiary}
      />
      <ThemedText
        style={[styles.emptyTitle, { color: theme.textSecondary }]}
        weight="semiBold"
      >
        No Elite Users Yet
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textTertiary }]}>
        Top net worth users will appear here
      </ThemedText>
    </View>
  );
}

export function EliteLeaderboard({
  variant = "horizontal",
  showTitle = true,
  onUserPress,
}: EliteLeaderboardProps) {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();

  const { data: users, isLoading, error } = useQuery<EliteUser[]>({
    queryKey: ["/api/leaderboard/elite"],
    staleTime: 1000 * 60 * 2,
  });

  const handleUserPress = (userId: string) => {
    if (onUserPress) {
      onUserPress(userId);
    } else {
      navigation.navigate("UserProfile", { userId });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <ScrollView
          horizontal={variant === "horizontal"}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            variant === "horizontal"
              ? styles.scrollContentH
              : styles.scrollContentV
          }
          testID="elite-leaderboard-loading"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <EliteUserSkeleton key={index} variant={variant} />
          ))}
        </ScrollView>
      );
    }

    if (error || !users || users.length === 0) {
      return <EmptyState />;
    }

    return (
      <ScrollView
        horizontal={variant === "horizontal"}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          variant === "horizontal"
            ? styles.scrollContentH
            : styles.scrollContentV
        }
        testID="elite-leaderboard-list"
      >
        {users.map((user, index) => (
          <EliteUserCard
            key={user.id}
            user={user}
            index={index}
            variant={variant}
            onPress={() => handleUserPress(user.id)}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container} testID="elite-leaderboard">
      {showTitle ? (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name="crown"
              size={24}
              color={theme.gold}
              style={styles.crownIcon}
            />
            <ThemedText style={styles.title} weight="bold">
              Elite Leaderboard
            </ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Top 5 by Net Worth
          </ThemedText>
        </View>
      ) : null}

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  crownIcon: {
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.title3.fontSize,
    letterSpacing: Typography.title3.letterSpacing,
  },
  subtitle: {
    fontSize: Typography.footnote.fontSize,
    marginTop: Spacing.xs,
  },
  scrollContentH: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.md,
  },
  scrollContentV: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  cardWrapperH: {
    borderRadius: BorderRadius.lg,
  },
  cardWrapperV: {
    borderRadius: BorderRadius.md,
  },
  cardH: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  cardV: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  skeletonCard: {
    borderWidth: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeGradient: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeDefault: {
    borderWidth: 1.5,
  },
  rankNumber: {
    fontSize: 13,
    color: "#000",
  },
  avatarContainerH: {
    marginTop: Spacing.sm,
  },
  avatarContainerV: {},
  userInfoH: {
    alignItems: "center",
    marginTop: Spacing.sm,
    flex: 1,
  },
  userInfoV: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  displayName: {
    fontSize: Typography.subhead.fontSize,
  },
  displayNameH: {
    textAlign: "center",
  },
  username: {
    fontSize: Typography.footnote.fontSize,
    marginTop: 2,
  },
  netWorthRow: {
    marginTop: Spacing.xs,
  },
  netWorth: {
    fontSize: Typography.subhead.fontSize,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: "wrap",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 10,
  },
  skeletonInfoV: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.screenPadding,
  },
  emptyTitle: {
    fontSize: Typography.headline.fontSize,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.footnote.fontSize,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});

export default EliteLeaderboard;
