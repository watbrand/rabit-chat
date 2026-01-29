import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Gradients } from "@/constants/theme";

interface BrandShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  delay?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function BrandShimmer({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
  delay = 0,
}: BrandShimmerProps) {
  const { theme, isDark } = useTheme();
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    shimmerPosition.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmerPosition.value, [-1, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]) }],
  }));

  const baseColor = isDark ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.08)";
  const highlightColor = isDark ? "rgba(139, 92, 246, 0.25)" : "rgba(139, 92, 246, 0.15)";

  return (
    <View
      style={[
        styles.container,
        {
          width: typeof width === "number" ? width : undefined,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        typeof width === "string" && styles.fullWidth,
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={["transparent", highlightColor, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
  variant?: "post" | "user" | "message" | "comment";
}

export function SkeletonCard({ style, variant = "post" }: SkeletonCardProps) {
  const { theme, isDark } = useTheme();
  
  if (variant === "user") {
    return (
      <View style={[styles.skeletonCard, { backgroundColor: theme.glassBackground }, style]}>
        <View style={styles.userRow}>
          <BrandShimmer width={48} height={48} borderRadius={24} />
          <View style={styles.userInfo}>
            <BrandShimmer width={120} height={16} delay={100} />
            <BrandShimmer width={80} height={12} delay={200} style={styles.mt8} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === "message") {
    return (
      <View style={[styles.skeletonCard, { backgroundColor: theme.glassBackground }, style]}>
        <View style={styles.userRow}>
          <BrandShimmer width={44} height={44} borderRadius={22} />
          <View style={styles.messageInfo}>
            <BrandShimmer width={140} height={14} delay={100} />
            <BrandShimmer width="80%" height={12} delay={200} style={styles.mt8} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === "comment") {
    return (
      <View style={[styles.commentCard, style]}>
        <BrandShimmer width={32} height={32} borderRadius={16} />
        <View style={styles.commentContent}>
          <BrandShimmer width={100} height={12} delay={50} />
          <BrandShimmer width="90%" height={14} delay={150} style={styles.mt8} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.skeletonCard, { backgroundColor: theme.glassBackground, borderColor: theme.border }, style]}>
      <View style={styles.userRow}>
        <BrandShimmer width={44} height={44} borderRadius={22} />
        <View style={styles.userInfo}>
          <BrandShimmer width={120} height={14} delay={100} />
          <BrandShimmer width={80} height={10} delay={200} style={styles.mt6} />
        </View>
      </View>
      <BrandShimmer width="100%" height={200} delay={300} style={styles.mt12} borderRadius={BorderRadius.md} />
      <View style={styles.actionsRow}>
        <BrandShimmer width={60} height={24} delay={400} borderRadius={12} />
        <BrandShimmer width={60} height={24} delay={450} borderRadius={12} />
        <BrandShimmer width={60} height={24} delay={500} borderRadius={12} />
      </View>
    </View>
  );
}

interface SkeletonListProps {
  count?: number;
  variant?: "post" | "user" | "message" | "comment";
  style?: ViewStyle;
}

export function SkeletonList({ count = 3, variant = "post", style }: SkeletonListProps) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} variant={variant} style={index > 0 ? styles.mt12 : undefined} />
      ))}
    </View>
  );
}

interface SkeletonTextProps {
  lines?: number;
  width?: (number | string)[];
  style?: ViewStyle;
}

export function SkeletonText({ lines = 3, width, style }: SkeletonTextProps) {
  const defaultWidths = ["100%", "90%", "75%", "85%", "60%"];
  
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => {
        const lineWidth = width?.[index] || defaultWidths[index % defaultWidths.length];
        return (
          <BrandShimmer
            key={index}
            width={lineWidth as number | string}
            height={14}
            delay={index * 100}
            style={index > 0 ? styles.mt8 : undefined}
          />
        );
      })}
    </View>
  );
}

interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
}

export function SkeletonAvatar({ size = 48, style }: SkeletonAvatarProps) {
  return <BrandShimmer width={size} height={size} borderRadius={size / 2} style={style} />;
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "100%",
  },
  gradient: {
    flex: 1,
    width: SCREEN_WIDTH * 2,
  },
  skeletonCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  commentCard: {
    flexDirection: "row",
    padding: Spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  messageInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  commentContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  list: {
    padding: Spacing.md,
  },
  textContainer: {},
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
});

export default BrandShimmer;
