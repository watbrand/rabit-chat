import React, { useEffect } from "react";
import { View, StyleSheet, Image, Platform, Pressable, GestureResponderEvent } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

interface UserBadgeProps {
  type: "networth" | "influence";
  value: number;
  compact?: boolean;
  animated?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}

function formatValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

const GOLD_COLORS_DARK = {
  primary: "#FFD700",
  secondary: "#FFA500",
  glow: "rgba(255, 215, 0, 0.4)",
  shimmer: ["#FFD700", "#FFF8DC", "#FFD700"],
  background: "rgba(255, 215, 0, 0.15)",
  border: "rgba(255, 215, 0, 0.35)",
};

const GOLD_COLORS_LIGHT = {
  primary: "#B8860B",
  secondary: "#DAA520",
  glow: "rgba(184, 134, 11, 0.5)",
  shimmer: ["#B8860B", "#DAA520", "#B8860B"],
  background: "rgba(184, 134, 11, 0.12)",
  border: "rgba(184, 134, 11, 0.4)",
};

const SILVER_COLORS_DARK = {
  primary: "#C0C0C0",
  secondary: "#A0A0A0",
  glow: "rgba(192, 192, 192, 0.4)",
  shimmer: ["#C0C0C0", "#E8E8E8", "#C0C0C0"],
  background: "rgba(192, 192, 192, 0.15)",
  border: "rgba(192, 192, 192, 0.35)",
};

const SILVER_COLORS_LIGHT = {
  primary: "#5C6370",
  secondary: "#6B7280",
  glow: "rgba(92, 99, 112, 0.4)",
  shimmer: ["#5C6370", "#9CA3AF", "#5C6370"],
  background: "rgba(92, 99, 112, 0.1)",
  border: "rgba(92, 99, 112, 0.35)",
};

export function UserBadge({
  type,
  value,
  compact = false,
  animated = true,
  onPress,
}: UserBadgeProps) {
  const { theme, isDark } = useTheme();
  const shimmerPosition = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const isNetWorth = type === "networth";
  const goldColors = isDark ? GOLD_COLORS_DARK : GOLD_COLORS_LIGHT;
  const silverColors = isDark ? SILVER_COLORS_DARK : SILVER_COLORS_LIGHT;
  const colors = isNetWorth ? goldColors : silverColors;
  const label = isNetWorth ? "Net Worth" : "Influence";
  const prefix = isNetWorth ? "R" : "";

  useEffect(() => {
    if (animated) {
      shimmerPosition.value = withRepeat(
        withTiming(1, {
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        false
      );

      pulseScale.value = withRepeat(
        withTiming(1.05, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    }
  }, [animated]);

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(shimmerPosition.value, [0, 1], [-100, 100]),
      },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.05], [0.6, 0.9]),
  }));

  const renderGlowLayer = () => (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        styles.glowLayer,
        {
          shadowColor: colors.primary,
          borderRadius: compact ? BorderRadius.sm : BorderRadius.md,
        },
        glowAnimatedStyle,
      ]}
    />
  );

  const renderShimmer = () => (
    <Animated.View
      style={[
        styles.shimmerOverlay,
        shimmerAnimatedStyle,
      ]}
    >
      <LinearGradient
        colors={["transparent", "rgba(255, 255, 255, 0.3)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.shimmerGradient}
      />
    </Animated.View>
  );

  const badgeContent = (
    <>
      <Image
        source={
          isNetWorth
            ? require("../../assets/images/badges/badge-networth.png")
            : require("../../assets/images/badges/badge-influence.png")
        }
        style={[styles.badgeIcon, compact && styles.badgeIconCompact]}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        {!compact ? (
          <ThemedText
            style={[
              styles.label,
              { color: colors.primary },
            ]}
          >
            {label}
          </ThemedText>
        ) : null}
        <ThemedText
          style={[
            styles.value,
            compact && styles.valueCompact,
            { color: colors.primary },
          ]}
          weight="bold"
        >
          {prefix}{formatValue(value)}
        </ThemedText>
      </View>
    </>
  );

  const Wrapper = onPress ? Pressable : View;
  const wrapperProps = onPress ? { onPress } : {};

  if (Platform.OS === "ios" && isDark) {
    return (
      <Wrapper {...wrapperProps} style={[styles.wrapper, compact && styles.wrapperCompact]}>
        {animated ? renderGlowLayer() : null}
        <BlurView
          intensity={40}
          tint="dark"
          style={[
            styles.container,
            compact && styles.containerCompact,
            {
              borderColor: colors.border,
              overflow: "hidden",
            },
          ]}
        >
          <View style={styles.innerContent}>
            {badgeContent}
          </View>
          {animated ? renderShimmer() : null}
        </BlurView>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps} style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {animated ? renderGlowLayer() : null}
      <View
        style={[
          styles.container,
          compact && styles.containerCompact,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.innerContent}>
          {badgeContent}
        </View>
        {animated ? renderShimmer() : null}
      </View>
    </Wrapper>
  );
}

export function UserBadgeRow({
  netWorth,
  influenceScore,
  compact = false,
}: {
  netWorth: number;
  influenceScore: number;
  compact?: boolean;
}) {
  return (
    <View style={styles.badgeRow}>
      <UserBadge type="networth" value={netWorth} compact={compact} />
      <UserBadge type="influence" value={influenceScore} compact={compact} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  wrapperCompact: {
    marginVertical: 2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  containerCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  innerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    zIndex: 1,
  },
  textContainer: {
    justifyContent: "center",
  },
  badgeIcon: {
    width: 24,
    height: 24,
  },
  badgeIconCompact: {
    width: 16,
    height: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: "700",
  },
  valueCompact: {
    fontSize: 11,
  },
  glowLayer: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 0 12px currentColor",
      },
    }),
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  shimmerGradient: {
    width: 60,
    height: "100%",
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
});
