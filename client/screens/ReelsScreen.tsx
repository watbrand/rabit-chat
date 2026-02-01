import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  Platform,
  ViewToken,
  Alert,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Haptics from "@/lib/safeHaptics";

import { VideoOverlayActions, VideoOverlayInfo } from "@/components/VideoOverlayActions";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing } from "@/constants/theme";
import { trackPostView, createWatchTracker, TrafficSource } from "@/lib/analytics";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type VideoPost = {
  id: string;
  userId: string;
  type: "VIDEO";
  content: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  visibility: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  hasLiked: boolean;
  hasBookmarked: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
};

interface ReelItemProps {
  post: VideoPost;
  isActive: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserPress: () => void;
}

function ReelItem({
  post,
  isActive,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onUserPress,
}: ReelItemProps) {
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const heartScale = useSharedValue(0);
  const lastTapTime = useRef(0);
  const playerRef = useRef<any>(null);

  const player = useVideoPlayer(post.mediaUrl, (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Store player reference
  React.useEffect(() => {
    playerRef.current = player;
  }, [player]);

  React.useEffect(() => {
    try {
      if (isActive && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      // Player native module may not be ready yet, ignore
    }
  }, [isActive, isPaused, player]);

  // Cleanup and ensure audio stops when component unmounts or becomes inactive
  React.useEffect(() => {
    return () => {
      try {
        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.seekTo(0);
        }
      } catch (error) {
        // Player native module may not be ready, ignore
      }
    };
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      heartScale.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 15, stiffness: 150 })
      );
      runOnJS(triggerHaptic)();
      if (!post.hasLiked) {
        onLike();
      }
    }
    lastTapTime.current = now;
  };

  const handleSingleTap = () => {
    setIsPaused((prev) => !prev);
  };

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(handleSingleTap)();
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  const composedGesture = Gesture.Exclusive(doubleTapGesture, tapGesture);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
  }));

  return (
    <View style={styles.reelContainer}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
          />

          {isPaused ? (
            <View style={styles.pauseOverlay}>
              <View style={styles.pauseIcon}>
                <Feather name="play" size={48} color="#FFFFFF" />
              </View>
            </View>
          ) : null}

          <Animated.View style={[styles.heartAnimation, heartAnimatedStyle]}>
            <Feather name="heart" size={80} color="#EF4444" />
          </Animated.View>
        </View>
      </GestureDetector>

      <VideoOverlayInfo
        user={post.user}
        caption={post.content}
        onUserPress={onUserPress}
      />

      <VideoOverlayActions
        user={post.user}
        likesCount={post.likesCount}
        commentsCount={post.commentsCount}
        sharesCount={post.sharesCount}
        hasLiked={post.hasLiked}
        hasBookmarked={post.hasBookmarked}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        onUserPress={onUserPress}
      />
    </View>
  );
}

export default function ReelsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const watchTrackerRef = useRef<ReturnType<typeof createWatchTracker> | null>(null);

  const { data: posts, isLoading } = useQuery<VideoPost[]>({
    queryKey: ["/api/posts/videos"],
  });

  useEffect(() => {
    // Stop previous tracker
    if (watchTrackerRef.current) {
      watchTrackerRef.current.stop();
    }
    
    // Get current post
    const currentPost = posts?.[activeIndex];
    if (currentPost) {
      // Track view
      trackPostView(currentPost.id, "FEED");
      
      // Create and start new tracker with discovery algorithm options
      watchTrackerRef.current = createWatchTracker(currentPost.id, "FEED", {
        contentType: "REEL",
        creatorId: currentPost.user.id,
        duration: currentPost.duration ? currentPost.duration * 1000 : 0,
      });
      watchTrackerRef.current.start();
    }
    
    return () => {
      if (watchTrackerRef.current) {
        watchTrackerRef.current.stop();
        watchTrackerRef.current = null;
      }
    };
  }, [activeIndex, posts]);

  useEffect(() => {
    return () => {
      if (watchTrackerRef.current) {
        watchTrackerRef.current.stop();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveIndex(-1);
      };
    }, [])
  );

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
    },
    onMutate: async ({ postId, hasLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/posts/videos"] });
      const previousPosts = queryClient.getQueryData(["/api/posts/videos"]);
      
      queryClient.setQueryData(["/api/posts/videos"], (old: VideoPost[] | undefined) => {
        if (!old) return old;
        return old.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasLiked: !hasLiked,
                likesCount: hasLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1,
              }
            : post
        );
      });
      
      return { previousPosts };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts/videos"], context.previousPosts);
      }
      Alert.alert('Error', error.message || 'Failed to update like');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ postId, hasBookmarked }: { postId: string; hasBookmarked: boolean }) => {
      if (hasBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${postId}`);
      } else {
        await apiRequest("POST", `/api/bookmarks/${postId}`);
      }
    },
    onMutate: async ({ postId, hasBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/posts/videos"] });
      const previousPosts = queryClient.getQueryData(["/api/posts/videos"]);
      
      queryClient.setQueryData(["/api/posts/videos"], (old: VideoPost[] | undefined) => {
        if (!old) return old;
        return old.map((post) =>
          post.id === postId
            ? { ...post, hasBookmarked: !hasBookmarked }
            : post
        );
      });
      
      return { previousPosts };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["/api/posts/videos"], context.previousPosts);
      }
      Alert.alert('Error', error.message || 'Failed to update bookmark');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0]?.index !== null) {
        setActiveIndex(viewableItems[0]?.index);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const handleComment = (postId: string) => {
    navigation.navigate("PostDetail", { postId });
  };

  const handleShare = async (postId: string) => {
    try {
      await apiRequest("POST", `/api/posts/${postId}/share`, { platform: "other" });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/videos"] });
    } catch (error) {
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: VideoPost; index: number }) => (
      <ReelItem
        post={item}
        isActive={index === activeIndex}
        onLike={() => likeMutation.mutate({ postId: item.id, hasLiked: item.hasLiked })}
        onBookmark={() => bookmarkMutation.mutate({ postId: item.id, hasBookmarked: item.hasBookmarked })}
        onComment={() => handleComment(item.id)}
        onShare={() => handleShare(item.id)}
        onUserPress={() => item.user?.id && handleUserPress(item.user.id)}
      />
    ),
    [activeIndex, likeMutation, bookmarkMutation]
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: "#000" }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: "#000" }]}>
        <Feather name="video-off" size={48} color={theme.textSecondary} />
        <ThemedText style={styles.emptyText}>No videos yet</ThemedText>
        <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          Videos from people you follow will appear here
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <StatusBar style="light" />

      <Pressable
        style={[styles.backButton, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="arrow-left" size={24} color="#FFFFFF" />
      </Pressable>

      <ThemedText style={[styles.headerTitle, { top: insets.top + Spacing.sm }]}>
        Reels
      </ThemedText>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: "#000", justifyContent: "center" }]}>
            <EmptyState
              type="reels"
              size="large"
              showAnimation={true}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  backButton: {
    position: "absolute",
    left: Spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    zIndex: 10,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    flex: 1,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  pauseIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartAnimation: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -40,
  },
});
