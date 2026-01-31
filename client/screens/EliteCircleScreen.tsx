import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type RootStackParamList = {
  EliteCircle: undefined;
  SuggestedUsers: undefined;
};

interface EliteUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  netWorth: number | null;
  netWorthTier: string | null;
  influenceScore: number | null;
  isVerified: boolean | null;
  bio: string | null;
  industry: string | null;
  rank: number;
  formattedNetWorth: string;
  tierBadge: {
    name: string;
    color: string;
    icon: string;
  };
}

interface EliteCircleResponse {
  eliteCircle: EliteUser[];
  lastUpdated: string;
  totalEliteMembers: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RANK_COLORS = [
  { primary: "#FFD700", secondary: "#FFA500", glow: "rgba(255, 215, 0, 0.3)" }, // Gold
  { primary: "#C0C0C0", secondary: "#A8A8A8", glow: "rgba(192, 192, 192, 0.3)" }, // Silver
  { primary: "#CD7F32", secondary: "#8B4513", glow: "rgba(205, 127, 50, 0.3)" }, // Bronze
  { primary: "#8B5CF6", secondary: "#7C3AED", glow: "rgba(139, 92, 246, 0.3)" }, // Purple
  { primary: "#06B6D4", secondary: "#0891B2", glow: "rgba(6, 182, 212, 0.3)" }, // Cyan
];

interface EliteUserCardProps {
  user: EliteUser;
  index: number;
}

function EliteUserCard({ user, index }: EliteUserCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);
  const rankColors = RANK_COLORS[index] || RANK_COLORS[4];

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.98, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 100);
  };

  const isTopThree = index < 3;

  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 100).springify()}
      style={cardStyle}
    >
      <AnimatedPressable
        style={[
          styles.userCard,
          {
            backgroundColor: isDark
              ? "rgba(38, 38, 48, 0.85)"
              : "rgba(255, 255, 255, 0.85)",
            borderColor: isTopThree ? rankColors.primary : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"),
            borderWidth: isTopThree ? 2 : 1,
          },
        ]}
        onPress={handlePress}
        testID={`elite-user-${user.id}`}
      >
        {isTopThree ? (
          <Animated.View style={[styles.glowBackground, glowStyle, { backgroundColor: rankColors.glow }]} />
        ) : null}
        
        <View style={styles.userCardContent}>
          <View style={[styles.rankBadge, { backgroundColor: rankColors.primary }]}>
            <ThemedText style={styles.rankText}>#{user.rank}</ThemedText>
          </View>

          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[rankColors.primary, rankColors.secondary]}
                style={styles.avatarPlaceholder}
              >
                <ThemedText style={styles.avatarInitial}>
                  {(user.displayName || user.username || "?")[0].toUpperCase()}
                </ThemedText>
              </LinearGradient>
            )}
            {user.isVerified ? (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                <Feather name="check" size={10} color="white" />
              </View>
            ) : null}
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <ThemedText 
                style={[styles.displayName, { color: theme.text }]}
                numberOfLines={1}
              >
                {user.displayName || user.username}
              </ThemedText>
            </View>
            <ThemedText 
              style={[styles.username, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              @{user.username}
            </ThemedText>
            {user.industry ? (
              <View style={styles.industryBadge}>
                <Feather name="briefcase" size={10} color={theme.textSecondary} />
                <ThemedText style={[styles.industryText, { color: theme.textSecondary }]}>
                  {user.industry.replace(/_/g, " ")}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.wealthInfo}>
            <LinearGradient
              colors={[rankColors.primary, rankColors.secondary]}
              style={styles.netWorthBadge}
            >
              <Feather name="dollar-sign" size={14} color="white" />
              <ThemedText style={styles.netWorthText}>
                {user.formattedNetWorth}
              </ThemedText>
            </LinearGradient>
            <View style={[styles.tierBadge, { backgroundColor: `${user.tierBadge.color}20` }]}>
              <ThemedText style={[styles.tierText, { color: user.tierBadge.color }]}>
                {user.tierBadge.name}
              </ThemedText>
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState() {
  const { theme, isDark } = useTheme();

  return (
    <Animated.View entering={FadeIn.delay(300)} style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
        <Feather name="users" size={40} color={theme.primary} />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
        Elite Circle Coming Soon
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Be among the first to join the elite. Build your wealth through the Mall to appear here.
      </ThemedText>
    </Animated.View>
  );
}

export function EliteCircleScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const crownRotation = useSharedValue(0);
  const crownScale = useSharedValue(1);

  useEffect(() => {
    crownRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1000 }),
        withTiming(5, { duration: 2000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
    crownScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const crownStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${crownRotation.value}deg` },
      { scale: crownScale.value },
    ],
  }));

  const { data, isLoading, error, refetch } = useQuery<EliteCircleResponse>({
    queryKey: ["/api/onboarding/elite-circle"],
    refetchInterval: 30000,
  });

  const handleContinue = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.replace("SuggestedUsers");
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.replace("SuggestedUsers");
  };

  return (
    <View style={styles.container}>
      <GradientBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <View style={styles.header}>
            <Animated.View style={[styles.iconContainer, crownStyle]}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.crownGradient}
              >
                <Feather name="award" size={36} color="white" />
              </LinearGradient>
            </Animated.View>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              The Elite Circle
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Meet the top 5 wealthiest members on RabitChat
            </ThemedText>
          </View>
        </Animated.View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator size="large" />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading elite members...
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.loadingContainer}>
            <Feather name="alert-circle" size={40} color={theme.error} />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              Unable to load elite circle
            </ThemedText>
            <Pressable
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => refetch()}
            >
              <Feather name="refresh-cw" size={16} color="white" />
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </Pressable>
          </View>
        ) : data?.eliteCircle && data.eliteCircle.length > 0 ? (
          <>
            <View style={styles.usersList}>
              {data.eliteCircle.map((user, index) => (
                <EliteUserCard key={user.id} user={user} index={index} />
              ))}
            </View>

            <Animated.View entering={FadeInUp.delay(800).springify()}>
              <BlurView
                intensity={isDark ? 40 : 80}
                tint={isDark ? "dark" : "light"}
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(38, 38, 48, 0.7)"
                      : "rgba(255, 255, 255, 0.7)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
              >
                <View style={styles.infoRow}>
                  <Feather name="trending-up" size={16} color={theme.primary} />
                  <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                    Rankings update in real-time as members make purchases in the Mall
                  </ThemedText>
                </View>
              </BlurView>
            </Animated.View>
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(500).springify()}
        style={[
          styles.bottomContainer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: isDark
              ? "rgba(26, 26, 36, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          },
        ]}
      >
        <Pressable
          style={[styles.continueButton, { backgroundColor: theme.primary }]}
          onPress={handleContinue}
          testID="continue-button"
        >
          <ThemedText style={styles.continueButtonText}>
            Continue
          </ThemedText>
          <Feather name="arrow-right" size={20} color="white" />
        </Pressable>

        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={[styles.skipButtonText, { color: theme.textSecondary }]}>
            Skip for now
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.md,
  },
  crownGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  retryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  usersList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  userCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rankText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  industryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  industryText: {
    fontSize: 11,
    textTransform: "capitalize",
  },
  wealthInfo: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  netWorthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  netWorthText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  tierBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "600",
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  continueButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  continueButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    fontSize: 14,
  },
});

export default EliteCircleScreen;
