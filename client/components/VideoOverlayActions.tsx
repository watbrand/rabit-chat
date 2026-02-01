import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

interface VideoOverlayActionsProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  hasLiked: boolean;
  hasBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onUserPress: () => void;
  onFollow?: () => void;
  isFollowing?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ActionButton({
  icon,
  count,
  isActive = false,
  activeColor,
  onPress,
  testID,
}: {
  icon: string;
  count?: number;
  isActive?: boolean;
  activeColor?: string;
  onPress: () => void;
  testID?: string;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.3, Animation.springBouncy),
      withSpring(1, Animation.spring)
    );
    runOnJS(triggerHaptic)();
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonColor = isActive && activeColor ? activeColor : "#FFFFFF";

  const renderButton = () => (
    <View style={styles.actionButtonInner}>
      <AnimatedPressable
        onPress={handlePress}
        style={[styles.actionIconWrapper, animatedStyle]}
        testID={testID}
      >
        <Feather
          name={icon as any}
          size={28}
          color={buttonColor}
        />
      </AnimatedPressable>
      {count !== undefined ? (
        <ThemedText style={styles.actionCount}>
          {formatCount(count)}
        </ThemedText>
      ) : null}
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <BlurView intensity={30} tint="dark" style={styles.actionButton}>
        {renderButton()}
      </BlurView>
    );
  }

  return (
    <View style={[styles.actionButton, styles.actionButtonAndroid]}>
      {renderButton()}
    </View>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function VideoOverlayActions({
  user,
  likesCount,
  commentsCount,
  sharesCount,
  hasLiked,
  hasBookmarked,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onUserPress,
  onFollow,
  isFollowing,
}: VideoOverlayActionsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.userSection}>
        <Pressable onPress={onUserPress} style={styles.avatarWrapper}>
          <Avatar uri={user.avatarUrl} size={48} />
          {onFollow && !isFollowing ? (
            <Pressable
              style={[styles.followBadge, { backgroundColor: theme.primary }]}
              onPress={onFollow}
            >
              <Feather name="plus" size={12} color="#FFF" />
            </Pressable>
          ) : null}
        </Pressable>
      </View>

      <ActionButton
        icon={hasLiked ? "heart" : "heart"}
        count={likesCount}
        isActive={hasLiked}
        activeColor="#EF4444"
        onPress={onLike}
        testID="reels-like-button"
      />

      <ActionButton
        icon="message-circle"
        count={commentsCount}
        onPress={onComment}
        testID="reels-comment-button"
      />

      <ActionButton
        icon="send"
        count={sharesCount}
        onPress={onShare}
        testID="reels-share-button"
      />

      <ActionButton
        icon={hasBookmarked ? "bookmark" : "bookmark"}
        isActive={hasBookmarked}
        activeColor={theme.primary}
        onPress={onBookmark}
        testID="reels-bookmark-button"
      />
    </View>
  );
}

interface VideoOverlayInfoProps {
  user: {
    username: string;
    displayName: string;
    isVerified?: boolean;
  };
  caption: string | null;
  musicInfo?: string | null;
  onUserPress: () => void;
}

export function VideoOverlayInfo({
  user,
  caption,
  musicInfo,
  onUserPress,
}: VideoOverlayInfoProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.infoContainer}>
      <Pressable onPress={onUserPress}>
        <View style={styles.usernameRow}>
          <ThemedText style={styles.username} weight="semiBold">
            @{user?.username || 'unknown'}
          </ThemedText>
          {user?.isVerified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={10} color="#FFF" />
            </View>
          ) : null}
        </View>
      </Pressable>

      {caption ? (
        <ThemedText style={styles.caption} numberOfLines={2}>
          {caption}
        </ThemedText>
      ) : null}

      {musicInfo ? (
        <View style={styles.musicRow}>
          <Feather name="music" size={12} color="#FFFFFF" />
          <ThemedText style={styles.musicText} numberOfLines={1}>
            {musicInfo}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: Spacing.md,
    bottom: 100,
    alignItems: "center",
    gap: Spacing.lg,
  },
  userSection: {
    marginBottom: Spacing.sm,
  },
  avatarWrapper: {
    position: "relative",
  },
  followBadge: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
  actionButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  actionButtonAndroid: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  actionButtonInner: {
    alignItems: "center",
    padding: Spacing.sm,
    minWidth: 48,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  infoContainer: {
    position: "absolute",
    left: Spacing.md,
    right: 80,
    bottom: 100,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  username: {
    color: "#FFFFFF",
    fontSize: 16,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: Spacing.sm,
  },
  musicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  musicText: {
    color: "#FFFFFF",
    fontSize: 13,
    flex: 1,
  },
});
