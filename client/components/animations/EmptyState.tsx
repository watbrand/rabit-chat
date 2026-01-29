import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { RabitLogo } from "./RabitLogo";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type EmptyStateType = 
  | "posts"
  | "messages"
  | "notifications"
  | "search"
  | "followers"
  | "following"
  | "photos"
  | "videos"
  | "comments"
  | "likes"
  | "saved"
  | "stories"
  | "gossip"
  | "reels"
  | "wallet"
  | "transactions"
  | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
  size?: "small" | "medium" | "large";
  showAnimation?: boolean;
}

const EMPTY_STATE_CONFIG: Record<EmptyStateType, { title: string; message: string; icon: keyof typeof Feather.glyphMap }> = {
  posts: {
    title: "No Posts Yet",
    message: "Start sharing your luxury moments with the world.",
    icon: "edit-3",
  },
  messages: {
    title: "No Messages",
    message: "Start a conversation with someone in your network.",
    icon: "message-circle",
  },
  notifications: {
    title: "All Caught Up",
    message: "You're all caught up! Check back later for new updates.",
    icon: "bell",
  },
  search: {
    title: "No Results",
    message: "We couldn't find what you're looking for. Try a different search.",
    icon: "search",
  },
  followers: {
    title: "No Followers Yet",
    message: "Share great content to grow your audience.",
    icon: "users",
  },
  following: {
    title: "Not Following Anyone",
    message: "Discover and follow interesting people.",
    icon: "user-plus",
  },
  photos: {
    title: "No Photos",
    message: "Capture and share your best moments.",
    icon: "image",
  },
  videos: {
    title: "No Videos",
    message: "Create and share stunning video content.",
    icon: "video",
  },
  comments: {
    title: "No Comments Yet",
    message: "Be the first to share your thoughts.",
    icon: "message-square",
  },
  likes: {
    title: "No Likes Yet",
    message: "Like content that inspires you.",
    icon: "heart",
  },
  saved: {
    title: "Nothing Saved",
    message: "Save posts to revisit them later.",
    icon: "bookmark",
  },
  stories: {
    title: "No Stories",
    message: "Share a story to connect with your audience.",
    icon: "plus-circle",
  },
  gossip: {
    title: "No Gossip Here",
    message: "The tea hasn't been spilled yet. Check back soon!",
    icon: "coffee",
  },
  reels: {
    title: "No Reels",
    message: "Create your first reel and go viral.",
    icon: "film",
  },
  wallet: {
    title: "Empty Wallet",
    message: "Top up your wallet to start gifting and shopping.",
    icon: "credit-card",
  },
  transactions: {
    title: "No Transactions",
    message: "Your transaction history will appear here.",
    icon: "list",
  },
  generic: {
    title: "Nothing Here",
    message: "There's nothing to show at the moment.",
    icon: "inbox",
  },
};

const SIZE_MAP = {
  small: 56,
  medium: 80,
  large: 110,
};

export function EmptyState({
  type = "generic",
  title,
  message,
  actionLabel,
  onAction,
  icon,
  style,
  size = "medium",
  showAnimation = true,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const config = EMPTY_STATE_CONFIG[type];
  const logoSize = SIZE_MAP[size];
  
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;
  const displayIcon = icon || config.icon;
  
  const floatY = useSharedValue(0);
  const floatRotation = useSharedValue(0);
  const iconOpacity = useSharedValue(0);

  useEffect(() => {
    if (!showAnimation) return;

    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    floatRotation.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    iconOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, [showAnimation]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${floatRotation.value}deg` },
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: interpolate(iconOpacity.value, [0, 1], [0.5, 1]) }],
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.logoContainer}>
        <Animated.View style={showAnimation ? animatedLogoStyle : undefined}>
          <RabitLogo size={logoSize} variant="simple" showGlow={false} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.iconBadge, 
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
            showAnimation ? animatedIconStyle : undefined,
          ]}
        >
          <Feather name={displayIcon} size={logoSize * 0.22} color={theme.textSecondary} />
        </Animated.View>
      </View>
      
      <ThemedText style={[styles.title, size === "small" && styles.titleSmall]}>
        {displayTitle}
      </ThemedText>
      
      <ThemedText style={[styles.message, { color: theme.textSecondary }, size === "small" && styles.messageSmall]}>
        {displayMessage}
      </ThemedText>
      
      {onAction && actionLabel ? (
        <GlassButton
          onPress={onAction}
          style={styles.actionButton}
          variant="primary"
          title={actionLabel}
        />
      ) : null}
    </View>
  );
}

export function EmptyFeed({ onCreatePost }: { onCreatePost?: () => void }) {
  return (
    <EmptyState
      type="posts"
      actionLabel={onCreatePost ? "Create Post" : undefined}
      onAction={onCreatePost}
    />
  );
}

export function EmptyMessages({ onStartChat }: { onStartChat?: () => void }) {
  return (
    <EmptyState
      type="messages"
      actionLabel={onStartChat ? "Start Chatting" : undefined}
      onAction={onStartChat}
    />
  );
}

export function EmptySearch() {
  return <EmptyState type="search" size="small" />;
}

export function EmptyNotifications() {
  return <EmptyState type="notifications" />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    paddingVertical: Spacing["4xl"],
  },
  logoContainer: {
    position: "relative",
    marginBottom: Spacing.xl,
  },
  iconBadge: {
    position: "absolute",
    bottom: -8,
    right: -12,
    borderRadius: BorderRadius.full,
    padding: 8,
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  titleSmall: {
    fontSize: 16,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    maxWidth: 280,
  },
  messageSmall: {
    fontSize: 13,
    maxWidth: 240,
  },
  actionButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default EmptyState;
