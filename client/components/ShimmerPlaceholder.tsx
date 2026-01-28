import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BorderRadius, Spacing, Colors } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ShimmerPlaceholderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  baseColor?: string;
  highlightColor?: string;
}

export function ShimmerPlaceholder({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
  baseColor = Colors.dark.backgroundSecondary,
  highlightColor = Colors.dark.backgroundTertiary,
}: ShimmerPlaceholderProps) {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerTranslate.value, [-1, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]) },
    ],
  }));

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius, backgroundColor: baseColor },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, shimmerStyle]}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

export function MessageListSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={skeletonStyles.messageItem}>
          <ShimmerPlaceholder
            width={50}
            height={50}
            borderRadius={25}
            style={skeletonStyles.avatar}
          />
          <View style={skeletonStyles.messageContent}>
            <ShimmerPlaceholder
              width={120}
              height={16}
              style={skeletonStyles.name}
            />
            <ShimmerPlaceholder
              width="80%"
              height={14}
              style={skeletonStyles.preview}
            />
          </View>
          <ShimmerPlaceholder
            width={40}
            height={12}
            style={skeletonStyles.time}
          />
        </View>
      ))}
    </View>
  );
}

export function MallGridSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.mallHeader}>
        <ShimmerPlaceholder width={150} height={24} />
        <ShimmerPlaceholder width={80} height={16} />
      </View>
      <View style={skeletonStyles.mallGrid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={skeletonStyles.mallItem}>
            <ShimmerPlaceholder
              width="100%"
              height={150}
              borderRadius={BorderRadius.lg}
              style={skeletonStyles.mallImage}
            />
            <ShimmerPlaceholder
              width="70%"
              height={14}
              style={skeletonStyles.mallTitle}
            />
            <ShimmerPlaceholder
              width="40%"
              height={18}
              style={skeletonStyles.mallPrice}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function DiscoverGridSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.discoverHeader}>
        <ShimmerPlaceholder width="100%" height={44} borderRadius={BorderRadius.full} />
      </View>
      <View style={skeletonStyles.discoverTabs}>
        {[1, 2, 3, 4].map((i) => (
          <ShimmerPlaceholder
            key={i}
            width={80}
            height={32}
            borderRadius={BorderRadius.full}
          />
        ))}
      </View>
      <View style={skeletonStyles.discoverGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <View key={i} style={skeletonStyles.discoverItem}>
            <ShimmerPlaceholder
              width="100%"
              height={150}
              borderRadius={BorderRadius.md}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function FeedPostSkeleton() {
  return (
    <View style={skeletonStyles.postContainer}>
      <View style={skeletonStyles.postHeader}>
        <ShimmerPlaceholder
          width={44}
          height={44}
          borderRadius={22}
        />
        <View style={skeletonStyles.postHeaderText}>
          <ShimmerPlaceholder width={120} height={14} />
          <ShimmerPlaceholder width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <ShimmerPlaceholder
        width="100%"
        height={300}
        borderRadius={BorderRadius.lg}
        style={skeletonStyles.postImage}
      />
      <View style={skeletonStyles.postActions}>
        <View style={skeletonStyles.postActionsLeft}>
          <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
          <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
          <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
        </View>
        <ShimmerPlaceholder width={32} height={32} borderRadius={16} />
      </View>
      <ShimmerPlaceholder width="40%" height={14} style={skeletonStyles.postLikes} />
      <ShimmerPlaceholder width="90%" height={14} style={skeletonStyles.postCaption} />
      <ShimmerPlaceholder width="60%" height={14} style={skeletonStyles.postCaption} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.profileContainer}>
      <ShimmerPlaceholder
        width="100%"
        height={200}
        borderRadius={0}
      />
      <View style={skeletonStyles.profileContent}>
        <ShimmerPlaceholder
          width={100}
          height={100}
          borderRadius={50}
          style={skeletonStyles.profileAvatar}
        />
        <ShimmerPlaceholder width={150} height={20} style={skeletonStyles.profileName} />
        <ShimmerPlaceholder width={100} height={14} style={skeletonStyles.profileUsername} />
        <ShimmerPlaceholder width="80%" height={14} style={skeletonStyles.profileBio} />
        <View style={skeletonStyles.profileStats}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={skeletonStyles.profileStat}>
              <ShimmerPlaceholder width={40} height={18} />
              <ShimmerPlaceholder width={60} height={12} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    width: SCREEN_WIDTH * 2,
  },
});

const skeletonStyles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  avatar: {
    marginRight: Spacing.md,
  },
  messageContent: {
    flex: 1,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  preview: {},
  time: {},
  mallHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  mallGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  mallItem: {
    width: "48%",
  },
  mallImage: {
    marginBottom: Spacing.sm,
  },
  mallTitle: {
    marginBottom: Spacing.xs,
  },
  mallPrice: {},
  discoverHeader: {
    marginBottom: Spacing.md,
  },
  discoverTabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  discoverGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  discoverItem: {
    width: "32%",
  },
  postContainer: {
    marginBottom: Spacing.lg,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  postHeaderText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  postImage: {
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  postActionsLeft: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  postLikes: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  postCaption: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  profileContainer: {},
  profileContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  profileAvatar: {
    marginTop: -50,
    marginBottom: Spacing.md,
  },
  profileName: {
    marginBottom: Spacing.xs,
  },
  profileUsername: {
    marginBottom: Spacing.sm,
  },
  profileBio: {
    marginBottom: Spacing.lg,
  },
  profileStats: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  profileStat: {
    alignItems: "center",
  },
});

export default ShimmerPlaceholder;
