import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, Dimensions, DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ShimmerProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ 
  width = "100%", 
  height = 16, 
  borderRadius = BorderRadius.sm,
  style,
}: ShimmerProps) {
  const { theme, isDark } = useTheme();
  const translateX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const baseColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";
  const highlightColor = isDark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.08)";

  return (
    <View
      style={[
        styles.shimmerContainer,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
        <LinearGradient
          colors={["transparent", highlightColor, "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function PostCardSkeleton() {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.postCardSkeleton, { 
      backgroundColor: isDark ? "rgba(26, 26, 36, 0.6)" : "rgba(255, 255, 255, 0.8)",
      borderColor: theme.glassBorder,
    }]}>
      <View style={styles.postHeader}>
        <Shimmer width={44} height={44} borderRadius={22} />
        <View style={styles.postHeaderText}>
          <Shimmer width={120} height={14} />
          <Shimmer width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Shimmer width="100%" height={14} style={{ marginTop: Spacing.md }} />
      <Shimmer width="80%" height={14} style={{ marginTop: 8 }} />
      <Shimmer width="100%" height={180} borderRadius={BorderRadius.lg} style={{ marginTop: Spacing.md }} />
      <View style={styles.postActions}>
        <Shimmer width={60} height={24} borderRadius={12} />
        <Shimmer width={60} height={24} borderRadius={12} />
        <Shimmer width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function ProfileHeaderSkeleton() {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.profileSkeleton}>
      <Shimmer width="100%" height={180} borderRadius={0} />
      <View style={styles.profileAvatarSection}>
        <Shimmer width={100} height={100} borderRadius={50} />
      </View>
      <View style={styles.profileInfo}>
        <Shimmer width={150} height={20} />
        <Shimmer width={100} height={14} style={{ marginTop: 8 }} />
        <Shimmer width="80%" height={14} style={{ marginTop: 16 }} />
        <Shimmer width="60%" height={14} style={{ marginTop: 6 }} />
        <View style={styles.profileStats}>
          <Shimmer width={60} height={40} borderRadius={BorderRadius.md} />
          <Shimmer width={60} height={40} borderRadius={BorderRadius.md} />
          <Shimmer width={60} height={40} borderRadius={BorderRadius.md} />
          <Shimmer width={60} height={40} borderRadius={BorderRadius.md} />
        </View>
      </View>
    </View>
  );
}

export function StoryAvatarsSkeleton() {
  return (
    <View style={styles.storiesSkeleton}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.storyItemSkeleton}>
          <Shimmer width={64} height={64} borderRadius={32} />
          <Shimmer width={48} height={10} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItemSkeleton}>
      <Shimmer width={48} height={48} borderRadius={24} />
      <View style={styles.listItemText}>
        <Shimmer width={140} height={14} />
        <Shimmer width={100} height={12} style={{ marginTop: 6 }} />
      </View>
      <Shimmer width={24} height={24} borderRadius={12} />
    </View>
  );
}

export function GridItemSkeleton({ size = 110 }: { size?: number }) {
  return <Shimmer width={size} height={size} borderRadius={BorderRadius.sm} />;
}

const styles = StyleSheet.create({
  shimmerContainer: {
    overflow: "hidden",
  },
  postCardSkeleton: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  postHeaderText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  postActions: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
  },
  profileSkeleton: {
    overflow: "hidden",
  },
  profileAvatarSection: {
    alignItems: "center",
    marginTop: -50,
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  profileStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
  storiesSkeleton: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  storyItemSkeleton: {
    alignItems: "center",
  },
  listItemSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  listItemText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
