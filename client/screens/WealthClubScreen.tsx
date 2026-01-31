import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
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
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

interface WealthTier {
  id: string;
  name: string;
  minNetWorth: number;
  discountPercent: number;
  bonusCoinsPercent: number;
  prioritySupport: boolean;
  exclusiveContent: boolean;
  icon: string;
  color: string;
  gradientColors: [string, string];
}

const WEALTH_TIERS: WealthTier[] = [
  {
    id: "BRONZE",
    name: "Bronze",
    minNetWorth: 0,
    discountPercent: 0,
    bonusCoinsPercent: 0,
    prioritySupport: false,
    exclusiveContent: false,
    icon: "circle",
    color: "#CD7F32",
    gradientColors: ["#CD7F32", "#A0522D"],
  },
  {
    id: "SILVER",
    name: "Silver",
    minNetWorth: 10000,
    discountPercent: 5,
    bonusCoinsPercent: 2,
    prioritySupport: false,
    exclusiveContent: false,
    icon: "award",
    color: "#C0C0C0",
    gradientColors: ["#C0C0C0", "#A8A8A8"],
  },
  {
    id: "GOLD",
    name: "Gold",
    minNetWorth: 50000,
    discountPercent: 10,
    bonusCoinsPercent: 5,
    prioritySupport: true,
    exclusiveContent: false,
    icon: "star",
    color: "#FFD700",
    gradientColors: ["#FFD700", "#FFA500"],
  },
  {
    id: "PLATINUM",
    name: "Platinum",
    minNetWorth: 200000,
    discountPercent: 15,
    bonusCoinsPercent: 10,
    prioritySupport: true,
    exclusiveContent: true,
    icon: "zap",
    color: "#E5E4E2",
    gradientColors: ["#E5E4E2", "#A5A5A5"],
  },
  {
    id: "DIAMOND",
    name: "Diamond",
    minNetWorth: 1000000,
    discountPercent: 25,
    bonusCoinsPercent: 20,
    prioritySupport: true,
    exclusiveContent: true,
    icon: "hexagon",
    color: "#B9F2FF",
    gradientColors: ["#B9F2FF", "#87CEEB"],
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TierCardProps {
  tier: WealthTier;
  isCurrentTier: boolean;
  isUnlocked: boolean;
  index: number;
}

function TierCard({ tier, isCurrentTier, isUnlocked, index }: TierCardProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={[styles.tierCardWrapper, animatedStyle]}
    >
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.tierCard,
          {
            backgroundColor: isDark ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.9)",
            borderColor: isCurrentTier ? "#FFD700" : tier.color + "40",
            borderWidth: isCurrentTier ? 3 : 1,
            opacity: isUnlocked ? 1 : 0.6,
          },
        ]}
      >
        {isCurrentTier ? (
          <View style={styles.currentBadge}>
            <LinearGradient
              colors={Gradients.gold}
              style={styles.currentBadgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <ThemedText style={styles.currentBadgeText}>Current</ThemedText>
            </LinearGradient>
          </View>
        ) : null}

        <View style={styles.tierHeader}>
          <LinearGradient
            colors={tier.gradientColors}
            style={styles.tierIconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={tier.icon as any} size={28} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.tierInfo}>
            <ThemedText style={[styles.tierName, { color: tier.color }]}>
              {tier.name}
            </ThemedText>
            <ThemedText style={[styles.tierRequirement, { color: theme.textSecondary }]}>
              {tier.minNetWorth > 0 ? `${tier.minNetWorth.toLocaleString()} coins` : "Starting tier"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.perksContainer}>
          <View style={styles.perkRow}>
            <Feather name="percent" size={16} color={theme.primary} />
            <ThemedText style={[styles.perkText, { color: theme.text }]}>
              {tier.discountPercent}% Mall Discount
            </ThemedText>
          </View>
          <View style={styles.perkRow}>
            <Feather name="gift" size={16} color={theme.primary} />
            <ThemedText style={[styles.perkText, { color: theme.text }]}>
              {tier.bonusCoinsPercent}% Bonus Coins
            </ThemedText>
          </View>
          <View style={styles.perkRow}>
            <Feather
              name="headphones"
              size={16}
              color={tier.prioritySupport ? theme.success : theme.textTertiary}
            />
            <ThemedText
              style={[
                styles.perkText,
                { color: tier.prioritySupport ? theme.text : theme.textTertiary },
              ]}
            >
              Priority Support {tier.prioritySupport ? "" : "(Locked)"}
            </ThemedText>
          </View>
          <View style={styles.perkRow}>
            <Feather
              name="lock"
              size={16}
              color={tier.exclusiveContent ? theme.success : theme.textTertiary}
            />
            <ThemedText
              style={[
                styles.perkText,
                { color: tier.exclusiveContent ? theme.text : theme.textTertiary },
              ]}
            >
              Exclusive Content {tier.exclusiveContent ? "" : "(Locked)"}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function WealthClubScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { user } = useAuth();

  const { data: wallet, isLoading, refetch, isRefetching } = useQuery<{ coinBalance: number }>({
    queryKey: ["/api/wallet"],
  });

  const netWorth = wallet?.coinBalance || 0;

  const getCurrentTierIndex = () => {
    for (let i = WEALTH_TIERS.length - 1; i >= 0; i--) {
      if (netWorth >= WEALTH_TIERS[i].minNetWorth) {
        return i;
      }
    }
    return 0;
  };

  const currentTierIndex = getCurrentTierIndex();
  const currentTier = WEALTH_TIERS[currentTierIndex];
  const nextTier = WEALTH_TIERS[currentTierIndex + 1];

  const getProgressToNextTier = () => {
    if (!nextTier) return 100;
    const progress = ((netWorth - currentTier.minNetWorth) / (nextTier.minNetWorth - currentTier.minNetWorth)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const coinsToNextTier = nextTier ? nextTier.minNetWorth - netWorth : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
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
            paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.springify()} style={styles.heroSection}>
          <LinearGradient
            colors={currentTier.gradientColors}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={currentTier.icon as any} size={48} color="#FFFFFF" />
            <ThemedText style={styles.heroTitle}>{currentTier.name} Member</ThemedText>
            <ThemedText style={styles.heroNetWorth}>
              {netWorth.toLocaleString()} coins
            </ThemedText>
          </LinearGradient>
        </Animated.View>

        {nextTier ? (
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Card variant="glass" style={styles.progressCard}>
              <ThemedText style={[styles.progressTitle, { color: theme.text }]}>
                Progress to {nextTier.name}
              </ThemedText>
              <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
                <LinearGradient
                  colors={Gradients.gold}
                  style={[styles.progressFill, { width: `${getProgressToNextTier()}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <ThemedText style={[styles.progressText, { color: theme.textSecondary }]}>
                {coinsToNextTier.toLocaleString()} coins to go
              </ThemedText>
            </Card>
          </Animated.View>
        ) : null}

        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          All Tiers
        </ThemedText>

        {WEALTH_TIERS.map((tier, index) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isCurrentTier={index === currentTierIndex}
            isUnlocked={index <= currentTierIndex}
            index={index + 2}
          />
        ))}
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
  heroSection: {
    marginBottom: Spacing.xl,
  },
  heroGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: Spacing.md,
  },
  heroNetWorth: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: Spacing.xs,
  },
  progressCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  tierCardWrapper: {
    marginBottom: Spacing.md,
  },
  tierCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    position: "relative",
  },
  currentBadge: {
    position: "absolute",
    top: -8,
    right: Spacing.lg,
  },
  currentBadgeGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  currentBadgeText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "700",
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  tierIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  tierRequirement: {
    fontSize: 14,
  },
  perksContainer: {
    gap: Spacing.sm,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  perkText: {
    fontSize: 14,
  },
});
