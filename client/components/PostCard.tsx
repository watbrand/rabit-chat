import React, { useState, memo, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Image, Alert, Share, Platform, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  interpolate,
} from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { UserBadge } from "@/components/UserBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ThemedText } from "@/components/ThemedText";
import { MentionText } from "@/components/MentionText";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FullscreenMediaViewer } from "@/components/FullscreenMediaViewer";
import { PostOptionsMenu } from "@/components/PostOptionsMenu";
import { ReactionPicker, PostReactionType, getReactionEmoji, getReactionColor } from "@/components/ReactionPicker";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, Typography, Animation, Gradients } from "@/constants/theme";
import { trackPostImpression, TrafficSource } from "@/lib/analytics";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    type?: string;
    mediaUrl?: string | null;
    thumbnailUrl?: string | null;
    durationMs?: number | null;
    likesCount: number;
    commentsCount: number;
    sharesCount?: number;
    hasLiked?: boolean;
    hasSaved?: boolean;
    isArchived?: boolean;
    isPinned?: boolean;
    commentsEnabled?: boolean;
    authorId?: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      netWorth: number;
      influenceScore: number;
      hasActiveStory?: boolean;
      isVerified?: boolean;
    };
  };
  onLike: () => void;
  showFullContent?: boolean;
  onReport?: () => void;
  onEdit?: () => void;
  onMediaPress?: () => void;
  source?: TrafficSource;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnimatedActionButton({
  icon,
  activeIcon,
  count,
  isActive = false,
  activeColor,
  onPress,
  testID,
  theme,
}: {
  icon: string;
  activeIcon?: string;
  count?: number;
  isActive?: boolean;
  activeColor?: string;
  onPress: () => void;
  testID?: string;
  theme: any;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(1.35, Animation.springBouncy),
      withSpring(1, Animation.spring)
    );
    if (isActive === false) {
      rotation.value = withSequence(
        withSpring(-15, { damping: 8 }),
        withSpring(15, { damping: 8 }),
        withSpring(0, { damping: 10 })
      );
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const color = isActive && activeColor ? activeColor : theme.textSecondary;

  return (
    <AnimatedPressable
      style={[styles.action, animatedStyle]}
      onPress={handlePress}
      testID={testID}
    >
      <Feather 
        name={(isActive && activeIcon ? activeIcon : icon) as any} 
        size={22} 
        color={color} 
      />
      {count !== undefined && count > 0 ? (
        <ThemedText style={[styles.actionText, { color }]}>
          {count}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

export const PostCard = memo(function PostCard({ post, onLike, showFullContent = false, onReport, onEdit, onMediaPress, source = "FEED" }: PostCardProps) {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [showFullscreenMedia, setShowFullscreenMedia] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<PostReactionType | null>(
    (post as any).reactionType || (post.hasLiked ? "LIKE" : null)
  );
  const hasTrackedRef = useRef(false);
  
  useEffect(() => {
    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true;
      trackPostImpression(post.id, source);
    }
  }, [post.id, source]);
  const cardScale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePrefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: [`/api/posts/${post.id}`],
      staleTime: 30000,
    });
  }, [queryClient, post.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (post.hasSaved) {
        await apiRequest("DELETE", `/api/posts/${post.id}/save`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async (platform: string) => {
      await apiRequest("POST", `/api/posts/${post.id}/share`, { platform });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
    },
  });

  const handleUserPress = () => {
    if (post.author?.id) {
      navigation.navigate("UserProfile", { userId: post.author.id });
    }
  };

  const handlePostPress = () => {
    if (!showFullContent) {
      navigation.navigate("PostDetail", { postId: post.id });
    }
  };

  const reactionMutation = useMutation({
    mutationFn: async (reactionType: PostReactionType) => {
      await apiRequest("POST", `/api/posts/${post.id}/reactions`, { reactionType });
    },
    onMutate: (reactionType) => {
      setCurrentReaction(reactionType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
  });

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentReaction) {
      setCurrentReaction(null);
    } else {
      reactionMutation.mutate("LIKE");
    }
    onLike();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowReactionPicker(true);
  };

  const handleReactionSelect = (type: PostReactionType) => {
    reactionMutation.mutate(type);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveMutation.mutate();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await Share.share({
        message: post.content || `Check out this post on RabitChat!`,
        url: post.mediaUrl || undefined,
      });
      if (result.action === Share.sharedAction) {
        const platform = result.activityType || "copy_link";
        shareMutation.mutate(platform);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share post");
    }
  };

  const handleMenuPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowOptionsMenu(true);
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.98]);
    return {
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, Animation.spring);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, Animation.spring);
  };

  const renderMedia = () => {
    if (post.type === "VOICE" && post.mediaUrl) {
      return (
        <View style={styles.audioContainer}>
          <AudioPlayer
            uri={post.mediaUrl}
            durationMs={post.durationMs}
            thumbnailUrl={post.thumbnailUrl}
            postId={post.id}
            source={source}
          />
        </View>
      );
    }

    if (post.type === "VIDEO" && post.mediaUrl) {
      const handleVideoFullscreen = () => {
        const videoPost = {
          id: post.id,
          authorId: post.author?.id || post.authorId,
          type: "VIDEO" as const,
          content: post.content,
          mediaUrl: post.mediaUrl!,
          thumbnailUrl: post.thumbnailUrl || null,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          viewsCount: 0,
          createdAt: post.createdAt,
          user: {
            id: post.author?.id || post.authorId || '',
            username: post.author?.username || 'unknown',
            displayName: post.author?.displayName || 'Unknown',
            avatarUrl: post.author?.avatarUrl || null,
            isVerified: post.author?.isVerified || false,
          },
        };
        navigation.navigate("ExploreReels", { posts: [videoPost], initialIndex: 0 });
      };

      if (showFullContent) {
        const imageSource = post.thumbnailUrl || post.mediaUrl;
        return (
          <Pressable style={styles.videoContainer} onPress={handleVideoFullscreen}>
            <Image
              source={{ uri: imageSource }}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={styles.videoPlayOverlay}>
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playIconContainer}
              >
                <Feather name="play" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </Pressable>
        );
      }
      const imageSource = post.thumbnailUrl || post.mediaUrl;
      if (imageSource) {
        return (
          <Pressable style={styles.videoContainer} onPress={handlePostPress}>
            <Image
              source={{ uri: imageSource }}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={styles.videoPlayOverlay}>
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playIconContainer}
              >
                <Feather name="play" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </Pressable>
        );
      }
    }

    if (post.mediaUrl) {
      const handleMediaTap = () => {
        if (onMediaPress) {
          onMediaPress();
        } else {
          setShowFullscreenMedia(true);
        }
      };
      return (
        <Pressable onPress={handleMediaTap} style={styles.mediaContainer}>
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
        </Pressable>
      );
    }

    return null;
  };

  const cardBackgroundStyle = isDark
    ? { backgroundColor: "rgba(26, 26, 36, 0.85)" }
    : { backgroundColor: "rgba(255, 255, 255, 0.88)" };

  const CardWrapper = Platform.OS === "ios" ? BlurView : View;
  const cardWrapperProps = Platform.OS === "ios"
    ? { intensity: isDark ? 50 : 70, tint: isDark ? "dark" as const : "light" as const }
    : {};

  return (
    <AnimatedPressable
      style={[styles.cardOuter, animatedCardStyle]}
      onPress={handlePostPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={`post-card-${post.id}`}
    >
      <View
        style={[
          styles.container,
          cardBackgroundStyle,
          {
            borderColor: theme.glassBorder,
          },
        ]}
        {...cardWrapperProps}
      >
        <View style={styles.header}>
          <Pressable style={styles.authorInfo} onPress={handleUserPress}>
            <Avatar 
              uri={post.author?.avatarUrl} 
              size={46} 
              showStoryRing={post.author?.hasActiveStory}
            />
            <View style={styles.authorText}>
              <View style={styles.displayNameRow}>
                <ThemedText style={styles.displayName} weight="semiBold">
                  {post.author?.displayName || 'Unknown'}
                </ThemedText>
                {post.author?.isVerified ? <VerifiedBadge size={14} /> : null}
                <UserBadge type="networth" value={post.author?.netWorth} compact />
              </View>
              <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
                @{post.author?.username || 'unknown'} · {formatTimeAgo(post.createdAt)}
              </ThemedText>
            </View>
          </Pressable>
          <Pressable
            onPress={handleMenuPress}
            style={styles.menuButton}
            testID={`button-options-menu-${post.id}`}
          >
            <Feather
              name="more-horizontal"
              size={22}
              color={theme.textSecondary}
            />
          </Pressable>
        </View>

        {post.content ? (
          <View>
            <MentionText 
              text={post.content} 
              style={styles.content} 
              numberOfLines={(showFullContent || isContentExpanded) ? undefined : 3}
            />
            {!showFullContent && post.content.length > 150 ? (
              <Pressable 
                onPress={() => setIsContentExpanded(!isContentExpanded)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ThemedText style={[styles.seeMoreText, { color: theme.primary }]}>
                  {isContentExpanded ? "See less" : "See more"}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {renderMedia()}

        <View style={styles.actionsContainer}>
          <View style={styles.actionsLeft}>
            <Pressable
              style={styles.reactionButtonContainer}
              onPress={handleLike}
              onLongPress={handleLongPress}
              delayLongPress={300}
              testID={`button-like-${post.id}`}
            >
              {currentReaction ? (
                <Text style={styles.reactionEmojiSmall}>
                  {getReactionEmoji(currentReaction)}
                </Text>
              ) : (
                <Feather
                  name={post.hasLiked ? "heart" : "heart"}
                  size={22}
                  color={post.hasLiked ? "#F43F5E" : theme.textSecondary}
                  style={post.hasLiked ? { opacity: 1 } : undefined}
                />
              )}
              {post.likesCount > 0 ? (
                <ThemedText
                  style={[
                    styles.actionCount,
                    { color: currentReaction ? getReactionColor(currentReaction) : theme.textSecondary },
                  ]}
                >
                  {post.likesCount}
                </ThemedText>
              ) : null}
            </Pressable>

            <AnimatedActionButton
              icon="message-circle"
              count={post.commentsCount}
              onPress={handlePostPress}
              testID={`button-comment-${post.id}`}
              theme={theme}
            />

            <AnimatedActionButton
              icon="send"
              count={post.sharesCount || 0}
              onPress={handleShare}
              testID={`button-share-${post.id}`}
              theme={theme}
            />
          </View>

          <AnimatedActionButton
            icon="bookmark"
            isActive={post.hasSaved}
            activeColor={theme.primary}
            onPress={handleSave}
            testID={`button-save-${post.id}`}
            theme={theme}
          />
        </View>
      </View>

      {showFullContent && post.mediaUrl ? (
        <FullscreenMediaViewer
          visible={showFullscreenMedia}
          onClose={() => setShowFullscreenMedia(false)}
          mediaType={post.type === "VIDEO" ? "VIDEO" : "PHOTO"}
          mediaUrl={post.mediaUrl}
          thumbnailUrl={post.thumbnailUrl}
          post={post}
        />
      ) : null}

      <PostOptionsMenu
        post={{
          id: post.id,
          content: post.content,
          type: post.type,
          mediaUrl: post.mediaUrl,
          authorId: post.authorId || post.author?.id || '',
          isArchived: post.isArchived,
          isPinned: post.isPinned,
          commentsEnabled: post.commentsEnabled,
          hasSaved: post.hasSaved,
          author: post.author,
        }}
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        onReport={onReport}
        onEdit={onEdit}
      />

      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onSelect={handleReactionSelect}
        currentReaction={currentReaction}
      />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: BorderRadius.xl,
  },
  container: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.12)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  displayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  displayName: {
    fontSize: 15,
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  menuButton: {
    padding: Spacing.sm,
    marginRight: -Spacing.sm,
  },
  content: {
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  mediaContainer: {
    marginHorizontal: -Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  media: {
    width: "100%",
    aspectRatio: 4/5,
    backgroundColor: "#1a1a24",
    borderRadius: BorderRadius.lg,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a24",
  },
  audioContainer: {
    marginBottom: Spacing.md,
  },
  videoContainer: {
    position: "relative",
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginHorizontal: -Spacing.md,
    marginTop: Spacing.sm,
    aspectRatio: 4/5,
  },
  videoPlayOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  playIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    marginTop: Spacing.xs,
    minHeight: 40,
  },
  actionsLeft: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.xs,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  reactionButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  reactionEmojiSmall: {
    fontSize: 22,
    lineHeight: 30,
    textAlign: "center",
  },
  actionCount: {
    fontSize: 13,
    fontWeight: "500",
  },
});
