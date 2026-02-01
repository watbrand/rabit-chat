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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  hasLiked: boolean;
  hasBookmarked: boolean;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  user?: {
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
    }
  }, [isActive, isPaused, player]);

  React.useEffect(() => {
    return () => {
      try {
        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.seekTo(0);
        }
      } catch (error) {
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
        user={post.author || post.user || { username: 'unknown', displayName: 'Unknown', isVerified: false }}
        caption={post.content}
        onUserPress={onUserPress}
      />

      <VideoOverlayActions
        user={post.author || post.user || { id: '', username: 'unknown', displayName: 'Unknown', avatarUrl: null, isVerified: false }}
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

type ProfileReelsRouteProp = RouteProp<RootStackParamList, "ProfileReels">;

export default function ProfileReelsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ProfileReelsRouteProp>();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(route.params?.initialIndex || 0);
  const flatListRef = useRef<FlatList>(null);
  const watchTrackerRef = useRef<ReturnType<typeof createWatchTracker> | null>(null);

  const { userId, posts } = route.params || { userId: "", posts: [] };

  useEffect(() => {
    // Stop previous tracker
    if (watchTrackerRef.current) {
      watchTrackerRef.current.stop();
    }
    
    // Get current post
    const currentPost = posts?.[activeIndex];
    if (currentPost) {
      // Track view
      trackPostView(currentPost.id, "PROFILE");
      
      // Create and start new tracker
      watchTrackerRef.current = createWatchTracker(currentPost.id, "PROFILE");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update like');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update bookmark');
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

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  });

  const handleUserPress = () => {
    navigation.navigate("UserProfile", { userId });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleComment = (postId: string) => {
    navigation.navigate("PostDetail", { postId });
  };

  const handleShare = async (postId: string) => {
    try {
      await apiRequest("POST", `/api/posts/${postId}/share`, { platform: "other" });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
    } catch (error) {
    }
  };

  const renderReel = useCallback(
    ({ item, index }: { item: VideoPost; index: number }) => (
      <ReelItem
        post={item}
        isActive={index === activeIndex}
        onLike={() => likeMutation.mutate({ postId: item.id, hasLiked: item.hasLiked })}
        onBookmark={() => bookmarkMutation.mutate({ postId: item.id, hasBookmarked: item.hasBookmarked })}
        onComment={() => handleComment(item.id)}
        onShare={() => handleShare(item.id)}
        onUserPress={handleUserPress}
      />
    ),
    [activeIndex, likeMutation, bookmarkMutation, userId]
  );

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={handleGoBack} style={styles.backButton} testID="button-close">
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Reels</ThemedText>
        <View style={styles.headerPlaceholder} />
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderReel}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        initialScrollIndex={route.params?.initialIndex || 0}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: "#000", justifyContent: "center" }]}>
            <EmptyState
              type="videos"
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerPlaceholder: {
    width: 40,
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
