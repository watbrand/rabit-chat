import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
  Platform,
  ViewToken,
  Share,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LoadingIndicator, EmptyState } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { DiscoverGridSkeleton } from "@/components/ShimmerPlaceholder";
import { useVideoPlayer, VideoView } from "expo-video";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { Audio, AVPlaybackStatus } from "expo-av";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { GlassButton } from "@/components/GlassButton";
import { UserBadge } from "@/components/UserBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { useAudioManager } from "@/contexts/AudioManagerContext";
import { GradientBackground } from "@/components/GradientBackground";
import { uploadFileWithDuration } from "@/lib/upload";
import { AudioPlayer } from "@/components/AudioPlayer";
import { 
  trackPostView, 
  batchTrackPostViews, 
  trackWatchEvent,
  getSessionId,
  resetSessionId,
  createWatchTracker,
  trackDiscoveryInteraction,
  markProfileNotInterested,
} from "@/lib/analytics";
import { AnonymousGossipTab } from "@/components/gossip";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const Tab = createMaterialTopTabNavigator();

type DiscoverUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  netWorth: number;
  influenceScore: number;
  isFollowing?: boolean;
};

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

type TrendingTopic = {
  id: string;
  topic: string;
  score: number;
  postCount: number;
  windowStart: string;
  createdAt: string;
};

type TrendingPost = {
  id: string;
  type: "TEXT" | "PHOTO" | "VIDEO" | "VOICE";
  content: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: string;
  engagement: number;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
    netWorth: number;
    influenceScore: number;
  };
};

type VoicePost = {
  id: string;
  type: "VOICE";
  content: string | null;
  mediaUrl: string;
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
    netWorth: number;
    influenceScore: number;
  };
};

type GossipPost = {
  id: string;
  type: "TEXT" | "VOICE";
  text: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationMs: number | null;
  likeCount: number;
  commentCount: number;
  retweetCount: number;
  isDeleted: boolean;
  createdAt: string;
  hasLiked: boolean;
  hasRetweeted: boolean;
};

type ExplorePost = {
  id: string;
  authorId: string;
  type: "PHOTO" | "VIDEO";
  content: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
};

const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;
const LARGE_ITEM_SIZE = ITEM_SIZE * 2 + GRID_GAP;

function ExploreVideoCard({
  post,
  size,
  isVisible,
  onPress,
  testID,
}: {
  post: ExplorePost;
  size: number;
  isVisible: boolean;
  onPress: () => void;
  testID: string;
}) {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  const player = useVideoPlayer(post.mediaUrl, (player) => {
    player.loop = true;
    player.muted = true;
    player.play(); // Always try to play immediately on init
  });

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Listen for player status changes
  useEffect(() => {
    if (!player) return;
    
    const statusSubscription = player.addListener('statusChange', (event: any) => {
      if (event.status === 'idle' || event.status === 'readyToPlay') {
        setIsReady(true);
      }
    });

    const playingSubscription = player.addListener('playingChange', (event: any) => {
      if (event.isPlaying) {
        setIsReady(true);
      }
    });

    // Try to play immediately
    try {
      player.play();
    } catch (e) {
      // Video autoplay may fail silently (e.g., player not ready) - this is expected and non-critical
    }

    return () => {
      statusSubscription?.remove();
      playingSubscription?.remove();
    };
  }, [player]);

  // Control playback based on visibility - ALWAYS play when visible
  useEffect(() => {
    if (!player) return;
    
    const playVideo = () => {
      try {
        if (isVisible) {
          player.play();
        } else {
          player.pause();
        }
      } catch (e) {
        // Playback control may fail if player is not ready - non-critical, will retry
      }
    };

    playVideo();
    
    // Retry playing after a short delay to ensure video is loaded
    const timeout = setTimeout(playVideo, 100);
    const timeout2 = setTimeout(playVideo, 500);
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, [isVisible, player, isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (playerRef.current) {
          playerRef.current.pause();
        }
      } catch (e) {
        // Cleanup errors are non-critical - player may already be disposed
      }
    };
  }, []);

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Pressable
      style={[
        styles.exploreItem,
        { width: size, height: size },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <VideoView
        player={player}
        style={styles.exploreImage}
        contentFit="cover"
        nativeControls={false}
      />
      {!isReady ? (
        <View style={styles.videoLoadingOverlay}>
          <LoadingIndicator size="small" />
        </View>
      ) : null}
      <View style={styles.exploreOverlay}>
        <View style={styles.exploreStats}>
          <View style={styles.exploreStat}>
            <Feather name="play" size={14} color="#FFFFFF" />
            <ThemedText style={styles.exploreStatText}>{formatCount(post.viewsCount)}</ThemedText>
          </View>
          <View style={styles.exploreStat}>
            <Feather name="heart" size={14} color="#FFFFFF" />
            <ThemedText style={styles.exploreStatText}>{formatCount(post.likesCount)}</ThemedText>
          </View>
          <View style={styles.exploreStat}>
            <Feather name="message-circle" size={14} color="#FFFFFF" />
            <ThemedText style={styles.exploreStatText}>{formatCount(post.commentsCount)}</ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

type MixedFeedItem = (ExplorePost | VoicePost) & { _feedType: 'explore' | 'voice' };

function NewPeopleTab() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const audioManager = useAudioManager();
  const viewedPostsRef = useRef<Set<string>>(new Set());
  const scrollViewRef = useRef<FlatList>(null);
  const [sessionKey, setSessionKey] = useState(() => getSessionId());
  const [visibleVideoIds, setVisibleVideoIds] = useState<string[]>([]);

  const { data: posts, isLoading: postsLoading, isError: postsError, error: postsErrorData, refetch: refetchPosts, isRefetching: postsRefetching } = useQuery<ExplorePost[]>({
    queryKey: ["/api/discover/explore", sessionKey],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/discover/explore?sessionId=${sessionKey}`, getApiUrl()), 
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch explore content");
      return res.json();
    },
  });

  const { data: voicePosts, isLoading: voiceLoading, isError: voiceError, error: voiceErrorData, refetch: refetchVoice, isRefetching: voiceRefetching } = useQuery<VoicePost[]>({
    queryKey: ["/api/discover/voices", sessionKey],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/discover/voices?sessionId=${sessionKey}`, getApiUrl()), 
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch voice posts");
      return res.json();
    },
  });

  const mixedFeed = useMemo(() => {
    const explorePosts: MixedFeedItem[] = (posts || []).map(p => ({ ...p, _feedType: 'explore' as const }));
    const voiceItems: MixedFeedItem[] = (voicePosts || []).map(p => ({ ...p, _feedType: 'voice' as const }));
    
    if (voiceItems.length === 0) return explorePosts;
    if (explorePosts.length === 0) return voiceItems;
    
    const mixed: MixedFeedItem[] = [];
    let exploreIndex = 0;
    let voiceIndex = 0;
    let insertCounter = 0;
    
    while (exploreIndex < explorePosts.length || voiceIndex < voiceItems.length) {
      if (insertCounter > 0 && insertCounter % 6 === 0 && voiceIndex < voiceItems.length) {
        mixed.push(voiceItems[voiceIndex++]);
      } else if (exploreIndex < explorePosts.length) {
        mixed.push(explorePosts[exploreIndex++]);
      } else if (voiceIndex < voiceItems.length) {
        mixed.push(voiceItems[voiceIndex++]);
      }
      insertCounter++;
    }
    
    return mixed;
  }, [posts, voicePosts]);

  const isLoading = postsLoading || voiceLoading;
  const isRefetching = postsRefetching || voiceRefetching;
  const isError = postsError || voiceError;
  const errorMessage = (postsErrorData as Error)?.message || (voiceErrorData as Error)?.message || "Failed to load content";

  const handleRefresh = useCallback(() => {
    resetSessionId();
    setSessionKey(getSessionId());
    refetchPosts();
    refetchVoice();
  }, [refetchPosts, refetchVoice]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        viewedPostsRef.current.clear();
        audioManager.stopAll();
      };
    }, [audioManager])
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 20, // Lower threshold for small grid items
    minimumViewTime: 50, // Faster trigger for video playback
  }).current;

  // Store setState in ref so the callback can access it
  const setVisibleVideoIdsRef = useRef(setVisibleVideoIds);
  setVisibleVideoIdsRef.current = setVisibleVideoIds;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Track new post views for analytics
    const newPostIds = viewableItems
      .map(v => v.item?.id)
      .filter(id => id && !viewedPostsRef.current.has(id));

    if (newPostIds.length > 0) {
      newPostIds.forEach(id => viewedPostsRef.current.add(id));
      batchTrackPostViews(newPostIds as string[], "SEARCH");
    }

    // Track visible video IDs for autoplay - use array for better React state detection
    const visibleVideos: string[] = [];
    viewableItems.forEach(v => {
      const item = v.item as MixedFeedItem;
      if (item && item.type === "VIDEO" && item._feedType === "explore") {
        visibleVideos.push(item.id);
      }
    });
    setVisibleVideoIdsRef.current(visibleVideos);
  }).current;

  const handlePostPress = (post: MixedFeedItem, index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (post._feedType === "voice" || post.type === "VOICE") {
      if (!viewedPostsRef.current.has(post.id)) {
        viewedPostsRef.current.add(post.id);
        trackPostView(post.id, "SEARCH");
        trackDiscoveryInteraction({
          contentId: post.id,
          contentType: "VOICE",
          interactionType: "VIEW",
          creatorId: (post as VoicePost).user?.id,
        });
      }
      const voiceIndex = Math.max(0, voicePosts?.findIndex(p => p.id === post.id) ?? -1);
      navigation.navigate("VoiceReels", { initialIndex: voiceIndex });
    } else if (post.type === "VIDEO") {
      const videoPosts = posts?.filter(p => p.type === "VIDEO") || [];
      const videoIndex = Math.max(0, videoPosts.findIndex(p => p.id === post.id));
      navigation.navigate("ExploreReels", { posts: videoPosts, initialIndex: videoIndex });
    } else if (post.type === "PHOTO") {
      const photoPosts = posts?.filter(p => p.type === "PHOTO") || [];
      const photoIndex = Math.max(0, photoPosts.findIndex(p => p.id === post.id));
      navigation.navigate("ExplorePictures", { posts: photoPosts, initialIndex: photoIndex });
    } else {
      navigation.navigate("PostDetail", { postId: post.id });
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderMixedItem = (item: MixedFeedItem) => {
    if (item._feedType === "voice" || item.type === "VOICE") {
      return (
        <ExploreVoiceCard
          post={item as VoicePost}
          size={ITEM_SIZE}
          onPress={() => handlePostPress(item, 0)}
          testID={`explore-voice-${item.id}`}
        />
      );
    }

    const post = item as ExplorePost;
    if (post.type === "VIDEO") {
      return (
        <ExploreVideoCard
          post={post}
          size={ITEM_SIZE}
          isVisible={visibleVideoIds.includes(post.id)}
          onPress={() => handlePostPress(item, 0)}
          testID={`explore-item-${post.id}`}
        />
      );
    }

    return (
      <Pressable
        style={[
          styles.exploreItem,
          { width: ITEM_SIZE, height: ITEM_SIZE },
        ]}
        onPress={() => handlePostPress(item, 0)}
        testID={`explore-item-${post.id}`}
      >
        <Image
          source={{ uri: post.mediaUrl || undefined }}
          style={styles.exploreImage}
          resizeMode="cover"
        />
        <View style={styles.exploreOverlay}>
          <View style={styles.exploreStats}>
            <View style={styles.exploreStat}>
              <Feather name="play" size={14} color="#FFFFFF" />
              <ThemedText style={styles.exploreStatText}>{formatCount(post.viewsCount)}</ThemedText>
            </View>
            <View style={styles.exploreStat}>
              <Feather name="heart" size={14} color="#FFFFFF" />
              <ThemedText style={styles.exploreStatText}>{formatCount(post.likesCount)}</ThemedText>
            </View>
            <View style={styles.exploreStat}>
              <Feather name="message-circle" size={14} color="#FFFFFF" />
              <ThemedText style={styles.exploreStatText}>{formatCount(post.commentsCount)}</ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot, paddingTop: Spacing.lg }]}>
        <DiscoverGridSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <EmptyState
          icon="alert-circle"
          title="Something went wrong"
          message={errorMessage}
          actionLabel="Try Again"
          onAction={handleRefresh}
        />
      </View>
    );
  }

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        ref={scrollViewRef}
        data={mixedFeed}
        keyExtractor={(item) => `${item._feedType}-${item.id}`}
        renderItem={({ item }) => renderMixedItem(item)}
        numColumns={3}
        columnWrapperStyle={styles.exploreRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        windowSize={5}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="compass" size={64} color={theme.textSecondary} />
            <ThemedText type="h4" style={[styles.emptyTitle, { marginTop: Spacing.lg }]}>
              Nothing to Explore Yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Check back later for new content
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

function ReelVideoItem({
  post,
  isActive,
  shouldPreload,
  onLike,
  onComment,
  onSave,
  onShare,
  onUserPress,
}: {
  post: VideoPost;
  isActive: boolean;
  shouldPreload: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
  onUserPress: () => void;
}) {
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const heartScale = useSharedValue(0);
  const lastTapTime = useRef(0);
  const playerRef = useRef<any>(null);

  const player = useVideoPlayer(shouldPreload ? post.mediaUrl : null, (player) => {
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

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <View style={styles.reelContainer}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.videoContainer}>
          {shouldPreload && player ? (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <View style={[styles.video, { backgroundColor: '#1a1a2e' }]}>
              {post.thumbnailUrl ? (
                <Image source={{ uri: post.thumbnailUrl }} style={styles.video} />
              ) : null}
            </View>
          )}

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

      <View style={styles.reelInfo}>
        <Pressable onPress={onUserPress} style={styles.reelUserRow}>
          <Avatar uri={post.user?.avatarUrl} size={36} />
          <ThemedText style={styles.reelUsername}>@{post.user?.username || 'unknown'}</ThemedText>
          {post.user?.isVerified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={10} color="#FFF" />
            </View>
          ) : null}
        </Pressable>
        {post.content ? (
          <ThemedText style={styles.reelCaption} numberOfLines={2}>
            {post.content}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.reelActions}>
        <Pressable style={styles.reelActionButton} testID={`reel-views-${post.id}`}>
          <Feather name="play" size={28} color="#FFFFFF" />
          <ThemedText style={styles.reelActionCount}>
            {formatCount(post.viewsCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.reelActionButton} onPress={onLike} testID={`reel-like-${post.id}`}>
          <Feather
            name="heart"
            size={28}
            color={post.hasLiked ? "#EF4444" : "#FFFFFF"}
          />
          <ThemedText style={styles.reelActionCount}>
            {formatCount(post.likesCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.reelActionButton} onPress={onComment} testID={`reel-comment-${post.id}`}>
          <Feather name="message-circle" size={28} color="#FFFFFF" />
          <ThemedText style={styles.reelActionCount}>
            {formatCount(post.commentsCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.reelActionButton} onPress={onSave} testID={`reel-save-${post.id}`}>
          <Feather 
            name="bookmark" 
            size={28} 
            color={post.hasBookmarked ? theme.primary : "#FFFFFF"} 
          />
          <ThemedText style={styles.reelActionCount}>Save</ThemedText>
        </Pressable>
        <Pressable style={styles.reelActionButton} onPress={onShare} testID={`reel-share-${post.id}`}>
          <Feather name="send" size={28} color="#FFFFFF" />
          <ThemedText style={styles.reelActionCount}>Share</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function ReelsTab() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const audioManager = useAudioManager();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const { data: posts, isLoading, refetch, isRefetching } = useQuery<VideoPost[]>({
    queryKey: ["/api/discover/reels"],
    staleTime: 30000,
  });

  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveIndex(-1);
        audioManager.stopAll();
      };
    }, [audioManager])
  );

  useEffect(() => {
    if (activeIndex >= 0 && posts && posts[activeIndex]) {
      trackPostView(posts[activeIndex].id, "SEARCH");
    }
  }, [activeIndex, posts]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/reels"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ postId, hasBookmarked }: { postId: string; hasBookmarked: boolean }) => {
      if (hasBookmarked) {
        await apiRequest("DELETE", `/api/posts/${postId}/save`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/reels"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
  });

  const handleShare = async (postId: string, content: string | null) => {
    try {
      await Share.share({
        message: content || "Check out this reel on RabitChat!",
        url: `https://rabitchat.app/posts/${postId}`,
      });
    } catch (error) {
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
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

  const reelHeight = SCREEN_HEIGHT;

  const renderItem = useCallback(
    ({ item, index }: { item: VideoPost; index: number }) => {
      const shouldPreload = Math.abs(index - activeIndex) <= 2;
      return (
        <View style={{ height: reelHeight }}>
          <ReelVideoItem
            post={item}
            isActive={index === activeIndex}
            shouldPreload={shouldPreload}
            onLike={() => likeMutation.mutate({ postId: item.id, hasLiked: item.hasLiked })}
            onComment={() => handleComment(item.id)}
            onSave={() => saveMutation.mutate({ postId: item.id, hasBookmarked: item.hasBookmarked })}
            onShare={() => handleShare(item.id, item.content)}
            onUserPress={() => item.user?.id && handleUserPress(item.user.id)}
          />
        </View>
      );
    },
    [activeIndex, likeMutation, saveMutation, reelHeight]
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
      <View style={[styles.emptyContainer, { backgroundColor: "#000", flex: 1 }]}>
        <Feather name="video-off" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { color: "#FFFFFF" }]}>No Reels</ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Video reels will appear here
        </ThemedText>
      </View>
    );
  }

  const handleBackPress = () => {
    navigation.navigate('NewPeople');
  };

  return (
    <View style={[styles.reelsFullScreen, { backgroundColor: "#000" }]}>
      <StatusBar style="light" />
      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={reelHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: reelHeight,
          offset: reelHeight * index,
          index,
        })}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#FFFFFF"
            progressBackgroundColor="#333"
          />
        }
      />
      <Pressable 
        style={[styles.reelsBackButton, { top: insets.top + 10 }]}
        onPress={handleBackPress}
      >
        <View style={styles.reelsBackButtonBg}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </View>
      </Pressable>
      <ThemedText style={[styles.reelsTitle, { top: insets.top + 16 }]}>Reels</ThemedText>
    </View>
  );
}

function TrendsTab() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [sessionKey, setSessionKey] = useState(() => getSessionId());

  const { data: trendingPosts, isLoading, refetch, isRefetching } = useQuery<TrendingPost[]>({
    queryKey: ["/api/discover/trends"],
  });

  // Fetch suggested people for the stories-style section
  const { data: suggestedPeople, isLoading: peopleLoading, refetch: refetchPeople } = useQuery<SuggestedPerson[]>({
    queryKey: ["/api/discover/people", sessionKey],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/discover/people?sessionId=${sessionKey}&limit=15`, getApiUrl()), 
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch suggested people");
      return res.json();
    },
  });

  const followMutation = useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      const endpoint = isFollowing ? "unfollow" : "follow";
      const res = await fetch(new URL(`/api/users/${userId}/${endpoint}`, getApiUrl()), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to ${endpoint}`);
      return res.json();
    },
    onMutate: async ({ userId, isFollowing }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/discover/people", sessionKey] });
      const previousData = queryClient.getQueryData(["/api/discover/people", sessionKey]);
      
      queryClient.setQueryData(["/api/discover/people", sessionKey], (old: SuggestedPerson[] | undefined) => {
        if (!old) return old;
        return old.map((person) =>
          person.id === userId
            ? { ...person, isFollowing: !isFollowing }
            : person
        );
      });
      
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/discover/people", sessionKey], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/people"] });
    },
  });

  const handleFollowPerson = (person: SuggestedPerson) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    followMutation.mutate({ userId: person.id, isFollowing: !!person.isFollowing });
  };

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/trends"] });
    },
  });

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handlePostPress = (post: TrendingPost) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("PostDetail", { postId: post.id });
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const renderTrendItem = ({ item, index }: { item: TrendingPost; index: number }) => (
    <Pressable
      style={[
        styles.trendCard,
        {
          backgroundColor: theme.glassBackground,
          borderColor: theme.glassBorder,
        },
      ]}
      onPress={() => handlePostPress(item)}
      testID={`trending-post-${item.id}`}
    >
      <View style={styles.trendHeader}>
        <View style={styles.trendRank}>
          <ThemedText style={[styles.trendRankNumber, { color: theme.primary }]}>
            #{index + 1}
          </ThemedText>
        </View>
        <Feather name="trending-up" size={14} color={theme.success} />
        <ThemedText style={[styles.trendEngagement, { color: theme.textSecondary }]}>
          {formatCount(item.engagement)} engagement
        </ThemedText>
      </View>
      
      <Pressable 
        style={styles.trendAuthorRow}
        onPress={() => item.author?.id && handleUserPress(item.author.id)}
      >
        <Avatar uri={item.author?.avatarUrl} size={40} />
        <View style={styles.trendAuthorInfo}>
          <View style={styles.trendAuthorNameRow}>
            <ThemedText style={styles.trendDisplayName} numberOfLines={1}>
              {item.author?.displayName || 'Unknown'}
            </ThemedText>
            {item.author?.isVerified ? (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                <Feather name="check" size={10} color="#FFF" />
              </View>
            ) : null}
          </View>
          <ThemedText style={[styles.trendUsername, { color: theme.textSecondary }]}>
            @{item.author?.username || 'unknown'} · {formatTimeAgo(item.createdAt)}
          </ThemedText>
        </View>
      </Pressable>
      
      {item.content ? (
        <ThemedText style={styles.trendContent} numberOfLines={3}>
          {item.content}
        </ThemedText>
      ) : null}
      
      {item.mediaUrl && (item.type === "PHOTO" || item.type === "VIDEO") ? (
        <View style={styles.trendMediaContainer}>
          <Image
            source={{ uri: item.thumbnailUrl || item.mediaUrl }}
            style={styles.trendMedia}
            resizeMode="cover"
          />
          {item.type === "VIDEO" ? (
            <View style={styles.trendPlayOverlay}>
              <Feather name="play" size={24} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
      ) : null}
      
      <View style={styles.trendActions}>
        <Pressable style={styles.trendAction}>
          <Feather name="heart" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.trendActionCount, { color: theme.textSecondary }]}>
            {formatCount(item.likesCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.trendAction}>
          <Feather name="message-circle" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.trendActionCount, { color: theme.textSecondary }]}>
            {formatCount(item.commentsCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.trendAction}>
          <Feather name="repeat" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.trendActionCount, { color: theme.textSecondary }]}>
            {formatCount(item.sharesCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.trendAction}>
          <Feather name="eye" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.trendActionCount, { color: theme.textSecondary }]}>
            {formatCount(item.viewsCount)}
          </ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );

  const handleSuggestedUserPress = (userId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("UserProfile", { userId });
  };

  const handleRefreshAll = useCallback(() => {
    refetch();
    resetSessionId();
    setSessionKey(getSessionId());
  }, [refetch]);

  // Stories-style suggested people header component
  const renderSuggestedPeopleHeader = () => {
    if (!suggestedPeople || suggestedPeople.length === 0) return null;
    
    return (
      <View style={styles.suggestedPeopleSection}>
        <View style={styles.suggestedPeopleHeader}>
          <ThemedText style={[styles.suggestedPeopleTitle, { color: theme.text }]}>
            People to Follow
          </ThemedText>
        </View>
        <FlatList
          horizontal
          data={suggestedPeople.slice(0, 15)}
          keyExtractor={(item) => `suggested-${item.id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestedPeopleList}
          renderItem={({ item }) => (
            <Pressable
              style={styles.suggestedPersonItem}
              onPress={() => handleSuggestedUserPress(item.id)}
              testID={`suggested-person-${item.id}`}
            >
              <View style={styles.suggestedAvatarContainer}>
                <View style={[
                  styles.suggestedAvatarRing,
                  { borderColor: item.isFollowing ? theme.textSecondary : theme.primary }
                ]}>
                  <Avatar uri={item.avatarUrl} size={56} />
                </View>
                {item.isVerified ? (
                  <View style={[styles.suggestedVerifiedBadge, { backgroundColor: theme.primary }]}>
                    <Feather name="check" size={8} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <ThemedText style={styles.suggestedPersonName} numberOfLines={1}>
                {item.displayName.split(' ')[0]}
              </ThemedText>
              <Pressable
                style={[
                  styles.suggestedFollowBtn,
                  {
                    backgroundColor: item.isFollowing ? 'transparent' : theme.primary,
                    borderColor: theme.primary,
                    borderWidth: item.isFollowing ? 1 : 0,
                  }
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleFollowPerson(item);
                }}
                testID={`follow-suggested-${item.id}`}
              >
                <ThemedText style={[
                  styles.suggestedFollowBtnText,
                  { color: item.isFollowing ? theme.primary : '#FFFFFF' }
                ]}>
                  {item.isFollowing ? 'Following' : 'Follow'}
                </ThemedText>
              </Pressable>
            </Pressable>
          )}
        />
      </View>
    );
  };

  if (isLoading && peopleLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={trendingPosts || []}
        keyExtractor={(item) => item.id}
        renderItem={renderTrendItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ListHeaderComponent={renderSuggestedPeopleHeader}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefreshAll}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="trending-up" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={styles.emptyTitle}>
              No Trending Posts
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Posts with high engagement will appear here
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

type MutualFollower = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type SuggestedPerson = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  mutualFollowersCount: number;
  mutualFollowers: MutualFollower[];
  followsYou: boolean;
  isVerified: boolean;
  netWorth: number;
  influenceScore: number;
  isFollowing?: boolean;
  score?: number;
};

function DiscoverPeopleTab() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();
  const [sessionKey, setSessionKey] = useState(() => getSessionId());

  const { data: suggestedPeople, isLoading, refetch, isRefetching } = useQuery<SuggestedPerson[]>({
    queryKey: ["/api/discover/people", sessionKey],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/discover/people?sessionId=${sessionKey}`, getApiUrl()), 
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch suggested people");
      return res.json();
    },
  });

  const handleRefresh = useCallback(() => {
    resetSessionId();
    setSessionKey(getSessionId());
  }, []);

  const notInterestedMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const res = await fetch(new URL(`/api/discover/not-interested/profile/${profileId}`, getApiUrl()), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "dismissed" }),
      });
      if (!res.ok) throw new Error("Failed to mark as not interested");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/people", sessionKey] });
    },
  });

  const handleDismissPerson = (personId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    notInterestedMutation.mutate(personId);
  };

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(new URL(`/api/users/${userId}/follow`, getApiUrl()), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to follow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/people"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(new URL(`/api/users/${userId}/unfollow`, getApiUrl()), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unfollow");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/people"] });
    },
  });

  const handleFollow = (person: SuggestedPerson) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (person.isFollowing) {
      unfollowMutation.mutate(person.id);
    } else {
      followMutation.mutate(person.id);
    }
  };

  const handleUserPress = (userId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("UserProfile", { userId });
  };

  const formatFollowers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getSuggestionReason = (person: SuggestedPerson): string => {
    // Check score breakdown for specific reasons
    const breakdown = (person as any).scoreBreakdown || {};
    
    // Priority 1: Engagement reciprocity (they engaged with your content)
    if (breakdown.engagedWithYou) {
      return "Liked your posts";
    }
    
    // Priority 2: Follows you
    if (person.followsYou) {
      return "Follows you";
    }
    
    // Priority 3: New user who posted (actively building their presence)
    if (breakdown.newUserBoost && breakdown.hasFirstPost) {
      return "New creator to follow";
    }
    
    // Priority 4: New user (help them grow)
    if (breakdown.newUserBoost) {
      return "New to RabitChat";
    }
    
    // Priority 5: Mutual connections
    if (person.mutualFollowersCount > 0 && person.mutualFollowers?.length > 0) {
      const firstMutual = person.mutualFollowers[0];
      if (person.mutualFollowersCount === 1) {
        return `Followed by ${firstMutual.displayName || firstMutual.username}`;
      }
      return `Followed by ${firstMutual.displayName || firstMutual.username} + ${person.mutualFollowersCount - 1} more`;
    }
    
    // Priority 6: Verified
    if (person.isVerified) {
      return "Verified account";
    }
    
    // Priority 7: High net worth
    if (person.netWorth >= 1000000) {
      return "High-net-worth individual";
    }
    
    // Priority 8: Popular
    if (person.influenceScore >= 50) {
      return "Popular in your network";
    }
    
    return "Suggested for you";
  };

  const renderPersonItem = ({ item }: { item: SuggestedPerson }) => (
    <Pressable
      style={[
        styles.personCard,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
      onPress={() => handleUserPress(item.id)}
      testID={`person-${item.id}`}
    >
      <Pressable 
        style={styles.dismissButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDismissPerson(item.id);
        }}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        testID={`dismiss-${item.id}`}
      >
        <Feather name="x" size={16} color={theme.textTertiary} />
      </Pressable>
      <View style={styles.personAvatarContainer}>
        <Avatar uri={item.avatarUrl} size={50} />
        {item.followsYou ? (
          <View style={[styles.followsYouBadge, { backgroundColor: theme.primary }]}>
            <Feather name="user-check" size={10} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      <View style={styles.personInfo}>
        <View style={styles.personNameRow}>
          <ThemedText style={styles.personName} numberOfLines={1}>
            {item.displayName}
          </ThemedText>
          {item.isVerified ? (
            <Feather name="check-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
          ) : null}
        </View>
        <ThemedText style={[styles.personUsername, { color: theme.textSecondary }]} numberOfLines={1}>
          @{item.username}
        </ThemedText>
        <ThemedText style={[styles.suggestionReason, { color: theme.textTertiary }]} numberOfLines={1}>
          {getSuggestionReason(item)}
        </ThemedText>
      </View>
      <View style={styles.personActions}>
        <Pressable
          style={[
            styles.followButton,
            {
              backgroundColor: item.isFollowing ? theme.glassBackground : theme.primary,
              borderColor: item.isFollowing ? theme.primary : theme.primary,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            handleFollow(item);
          }}
          testID={`follow-${item.id}`}
        >
          <ThemedText
            style={[
              styles.followButtonText,
              { color: item.isFollowing ? theme.primary : "#FFFFFF" },
            ]}
          >
            {item.isFollowing ? "Following" : "Follow"}
          </ThemedText>
        </Pressable>
        <ThemedText style={[styles.followersCount, { color: theme.textSecondary }]}>
          {formatFollowers(item.followersCount)} followers
        </ThemedText>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={suggestedPeople}
        keyExtractor={(item) => item.id}
        renderItem={renderPersonItem}
        contentContainerStyle={{
          paddingHorizontal: Spacing.md,
          paddingTop: Spacing.md,
          paddingBottom: tabBarHeight + Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No suggestions yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Follow more people to get personalized recommendations
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

function GossipTab() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const audioManager = useAudioManager();
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [gossipText, setGossipText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Voice recording state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playerId = useMemo(() => `gossip-preview-${Date.now()}`, []);

  const { data: gossipPosts, isLoading, refetch, isRefetching } = useQuery<GossipPost[]>({
    queryKey: ["/api/gossip"],
  });
  
  // Register audio player for preview
  const stopPreviewPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlayingPreview(false);
    } catch (err) {
    }
  }, []);

  useEffect(() => {
    audioManager.registerPlayer(playerId, stopPreviewPlayback);
    return () => {
      audioManager.unregisterPlayer(playerId);
    };
  }, [playerId, audioManager, stopPreviewPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        // Cleanup - ignore errors: recording may already be stopped
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      if (soundRef.current) {
        // Cleanup - ignore errors: sound may already be unloaded
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    if (isRecording || recordingRef.current) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Required", "Please enable microphone access to record voice notes.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      if (!recording) throw new Error("Failed to initialize recording");

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedAudioUri(null);
      setUploadedAudioUrl(null);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error: any) {
      recordingRef.current = null;
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      Alert.alert("Recording Error", "Could not start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        Alert.alert("Error", "Recording failed - could not save audio file");
        return;
      }

      setRecordedAudioUri(uri);
      setIsUploadingAudio(true);
      setUploadProgress(0);

      // Upload the recorded audio
      const result = await uploadFileWithDuration(
        uri,
        "posts",
        "audio/m4a",
        recordingDuration * 1000,
        (progress) => setUploadProgress(progress)
      );

      setUploadedAudioUrl(result.url);
      setIsUploadingAudio(false);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      setIsRecording(false);
      setIsUploadingAudio(false);
      recordingRef.current = null;
      Alert.alert("Upload Error", "Could not upload recording. Please try again.");
    }
  };

  const cancelRecording = async () => {
    try {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsRecording(false);
      setRecordingDuration(0);
      setRecordedAudioUri(null);
      setUploadedAudioUrl(null);
      setIsUploadingAudio(false);
      setUploadProgress(0);
      setIsPlayingPreview(false);
    } catch (error) {
    }
  };

  const handlePlayPreview = async () => {
    if (!recordedAudioUri) return;
    
    try {
      if (isPlayingPreview && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlayingPreview(false);
        return;
      }
      
      audioManager.requestPlayback(playerId);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedAudioUri },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setIsPlayingPreview(true);
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingPreview(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      setIsPlayingPreview(false);
    }
  };

  const resetComposeModal = () => {
    setGossipText("");
    setIsVoiceMode(false);
    setIsRecording(false);
    setRecordingDuration(0);
    setRecordedAudioUri(null);
    setUploadedAudioUrl(null);
    setIsUploadingAudio(false);
    setUploadProgress(0);
    setIsPlayingPreview(false);
    if (soundRef.current) {
      // Cleanup - ignore errors: sound may already be unloaded
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const deduplicatedGossipPosts = React.useMemo(() => {
    if (!gossipPosts || gossipPosts.length === 0) return gossipPosts || [];
    
    const seenIds = new Set<string>();
    const deduplicated: GossipPost[] = [];
    
    for (const post of gossipPosts) {
      if (!seenIds.has(post.id)) {
        seenIds.add(post.id);
        deduplicated.push(post);
      }
    }
    
    return deduplicated;
  }, [gossipPosts]);

  const createGossipMutation = useMutation({
    mutationFn: async (payload: { type: "TEXT" | "VOICE"; text?: string; mediaUrl?: string; durationMs?: number }) => {
      await apiRequest("POST", "/api/gossip", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gossip"] });
      resetComposeModal();
      setShowComposeModal(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/gossip/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/gossip/${postId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gossip"] });
    },
  });

  const retweetMutation = useMutation({
    mutationFn: async ({ postId, hasRetweeted }: { postId: string; hasRetweeted: boolean }) => {
      if (hasRetweeted) {
        await apiRequest("DELETE", `/api/gossip/${postId}/retweet`);
      } else {
        await apiRequest("POST", `/api/gossip/${postId}/retweet`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gossip"] });
    },
  });

  const handleSubmitGossip = () => {
    if (isVoiceMode) {
      if (!uploadedAudioUrl) return;
      setIsSubmitting(true);
      createGossipMutation.mutate({
        type: "VOICE",
        mediaUrl: uploadedAudioUrl,
        durationMs: recordingDuration * 1000,
      });
      setIsSubmitting(false);
    } else {
      if (!gossipText.trim()) return;
      setIsSubmitting(true);
      createGossipMutation.mutate({ type: "TEXT", text: gossipText.trim() });
      setIsSubmitting(false);
    }
  };

  const canSubmitGossip = () => {
    if (isVoiceMode) {
      return uploadedAudioUrl !== null && !isUploadingAudio && !isRecording;
    }
    return gossipText.trim().length > 0;
  };

  const handleLike = (postId: string, hasLiked: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    likeMutation.mutate({ postId, hasLiked });
  };

  const handleRetweet = (postId: string, hasRetweeted: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    retweetMutation.mutate({ postId, hasRetweeted });
  };

  const handleComment = (postId: string) => {
    Alert.alert(
      "Gossip Comments",
      "Anonymous commenting on gossip posts will be available soon. Stay tuned for this exciting feature!",
      [{ text: "Got it", style: "default" }]
    );
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const renderGossipPost = ({ item }: { item: GossipPost }) => (
    <View
      style={[
        styles.gossipCard,
        {
          backgroundColor: theme.glassBackground,
          borderColor: theme.glassBorder,
        },
      ]}
    >
      <View style={styles.gossipHeader}>
        <View style={[styles.anonymousAvatar, { backgroundColor: theme.backgroundTertiary }]}>
          <Feather name="user" size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.gossipMeta}>
          <ThemedText style={[styles.anonymousLabel, { color: theme.textSecondary }]}>
            Anonymous
          </ThemedText>
          <ThemedText style={[styles.gossipTime, { color: theme.textTertiary }]}>
            {formatTimeAgo(item.createdAt)}
          </ThemedText>
        </View>
        {item.type === "VOICE" ? (
          <View style={[styles.voiceBadge, { backgroundColor: theme.primaryLight }]}>
            <Feather name="mic" size={12} color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      {item.text ? (
        <ThemedText style={styles.gossipText}>{item.text}</ThemedText>
      ) : null}

      {item.type === "VOICE" && item.mediaUrl ? (
        <View style={styles.gossipAudioPlayer}>
          <AudioPlayer
            uri={item.mediaUrl}
            durationMs={item.durationMs}
            compact
            postId={`gossip-${item.id}`}
            source="OTHER"
          />
        </View>
      ) : null}

      <View style={styles.gossipActions}>
        <Pressable
          style={styles.gossipAction}
          onPress={() => handleLike(item.id, item.hasLiked)}
        >
          <Feather
            name="heart"
            size={18}
            color={item.hasLiked ? theme.error : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.gossipActionCount,
              { color: item.hasLiked ? theme.error : theme.textSecondary },
            ]}
          >
            {item.likeCount}
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.gossipAction}
          onPress={() => handleComment(item.id)}
        >
          <Feather name="message-circle" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.gossipActionCount, { color: theme.textSecondary }]}>
            {item.commentCount}
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.gossipAction}
          onPress={() => handleRetweet(item.id, item.hasRetweeted)}
        >
          <Feather
            name="repeat"
            size={18}
            color={item.hasRetweeted ? theme.success : theme.textSecondary}
          />
          <ThemedText
            style={[
              styles.gossipActionCount,
              { color: item.hasRetweeted ? theme.success : theme.textSecondary },
            ]}
          >
            {item.retweetCount}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={deduplicatedGossipPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderGossipPost}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl + 80 },
        ]}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-square" size={48} color={theme.textSecondary} />
            <ThemedText type="h4" style={styles.emptyTitle}>
              No Gossip Yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Be the first to share something anonymously
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={[
          styles.gossipFab,
          { backgroundColor: theme.primary, bottom: tabBarHeight + Spacing.xl },
        ]}
        onPress={() => setShowComposeModal(true)}
        testID="gossip-compose-button"
      >
        <Feather name="edit-2" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showComposeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowComposeModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable 
            style={styles.modalDismiss} 
            onPress={() => setShowComposeModal(false)} 
          />
          <View 
            style={[
              styles.gossipModalContent, 
              { 
                backgroundColor: theme.backgroundRoot,
                paddingBottom: insets.bottom + Spacing.lg,
              }
            ]}
          >
            <View style={styles.gossipModalHeader}>
              <Pressable onPress={() => {
                resetComposeModal();
                setShowComposeModal(false);
              }}>
                <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
              </Pressable>
              <ThemedText type="headline">Anonymous Gossip</ThemedText>
              <Pressable
                onPress={handleSubmitGossip}
                disabled={!canSubmitGossip() || isSubmitting}
              >
                <ThemedText 
                  style={{ 
                    color: canSubmitGossip() ? theme.primary : theme.textTertiary,
                    fontWeight: "600",
                  }}
                >
                  Post
                </ThemedText>
              </Pressable>
            </View>

            {/* Mode Toggle */}
            <View style={styles.gossipModeToggle}>
              <Pressable
                style={[
                  styles.modeToggleButton,
                  !isVoiceMode && { backgroundColor: theme.primary },
                  { borderColor: theme.glassBorder },
                ]}
                onPress={() => {
                  if (isRecording) return;
                  setIsVoiceMode(false);
                  cancelRecording();
                }}
              >
                <Feather 
                  name="type" 
                  size={18} 
                  color={!isVoiceMode ? "#FFFFFF" : theme.textSecondary} 
                />
                <ThemedText 
                  style={[
                    styles.modeToggleText,
                    { color: !isVoiceMode ? "#FFFFFF" : theme.textSecondary }
                  ]}
                >
                  Text
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.modeToggleButton,
                  isVoiceMode && { backgroundColor: theme.primary },
                  { borderColor: theme.glassBorder },
                ]}
                onPress={() => {
                  setIsVoiceMode(true);
                  setGossipText("");
                }}
              >
                <Feather 
                  name="mic" 
                  size={18} 
                  color={isVoiceMode ? "#FFFFFF" : theme.textSecondary} 
                />
                <ThemedText 
                  style={[
                    styles.modeToggleText,
                    { color: isVoiceMode ? "#FFFFFF" : theme.textSecondary }
                  ]}
                >
                  Voice
                </ThemedText>
              </Pressable>
            </View>

            {isVoiceMode ? (
              <View style={styles.voiceRecordingContainer}>
                <View style={[styles.anonymousAvatar, { backgroundColor: theme.backgroundTertiary }]}>
                  <Feather name="user" size={20} color={theme.textSecondary} />
                </View>
                
                <View style={styles.voiceRecordingContent}>
                  {!recordedAudioUri && !isRecording ? (
                    /* Initial state - show record button */
                    <View style={styles.recordButtonContainer}>
                      <Pressable
                        style={[styles.recordButton, { backgroundColor: theme.error }]}
                        onPress={startRecording}
                        testID="gossip-record-button"
                      >
                        <Feather name="mic" size={32} color="#FFFFFF" />
                      </Pressable>
                      <ThemedText style={[styles.recordHint, { color: theme.textSecondary }]}>
                        Tap to start recording
                      </ThemedText>
                    </View>
                  ) : isRecording ? (
                    /* Recording in progress */
                    <View style={styles.recordingActiveContainer}>
                      <View style={[styles.recordingIndicator, { backgroundColor: theme.error }]}>
                        <View style={styles.recordingDot} />
                        <ThemedText style={styles.recordingLabel}>Recording</ThemedText>
                      </View>
                      <ThemedText style={[styles.recordingTimer, { color: theme.text }]}>
                        {formatDuration(recordingDuration)}
                      </ThemedText>
                      <View style={styles.recordingActions}>
                        <Pressable
                          style={[styles.recordingActionButton, { backgroundColor: theme.backgroundTertiary }]}
                          onPress={cancelRecording}
                        >
                          <Feather name="x" size={20} color={theme.error} />
                        </Pressable>
                        <Pressable
                          style={[styles.recordingStopButton, { backgroundColor: theme.primary }]}
                          onPress={stopRecording}
                        >
                          <Feather name="square" size={20} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    </View>
                  ) : recordedAudioUri ? (
                    /* Recording complete - show preview */
                    <View style={styles.recordingPreviewContainer}>
                      {isUploadingAudio ? (
                        <View style={styles.uploadingContainer}>
                          <LoadingIndicator size="small" />
                          <ThemedText style={[styles.uploadingText, { color: theme.textSecondary }]}>
                            Uploading... {Math.round(uploadProgress * 100)}%
                          </ThemedText>
                        </View>
                      ) : (
                        <>
                          <View style={styles.previewPlayerRow}>
                            <Pressable
                              style={[styles.previewPlayButton, { backgroundColor: theme.primary }]}
                              onPress={handlePlayPreview}
                            >
                              <Feather 
                                name={isPlayingPreview ? "pause" : "play"} 
                                size={20} 
                                color="#FFFFFF" 
                              />
                            </Pressable>
                            <View style={styles.previewInfo}>
                              <ThemedText style={[styles.previewDuration, { color: theme.text }]}>
                                {formatDuration(recordingDuration)}
                              </ThemedText>
                              <ThemedText style={[styles.previewReady, { color: theme.success }]}>
                                Ready to post
                              </ThemedText>
                            </View>
                            <Pressable
                              style={[styles.previewDeleteButton, { backgroundColor: theme.backgroundTertiary }]}
                              onPress={cancelRecording}
                            >
                              <Feather name="trash-2" size={18} color={theme.error} />
                            </Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={styles.gossipComposeBody}>
                <View style={[styles.anonymousAvatar, { backgroundColor: theme.backgroundTertiary }]}>
                  <Feather name="user" size={20} color={theme.textSecondary} />
                </View>
                <TextInput
                  style={[
                    styles.gossipInput,
                    { 
                      color: theme.text,
                      backgroundColor: theme.backgroundSecondary,
                    },
                  ]}
                  placeholder="Share something anonymously..."
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  maxLength={500}
                  value={gossipText}
                  onChangeText={setGossipText}
                  autoFocus
                  testID="gossip-input"
                />
              </View>
            )}

            <View style={styles.gossipComposeFooter}>
              {!isVoiceMode ? (
                <ThemedText style={[styles.characterCount, { color: theme.textTertiary }]}>
                  {gossipText.length}/500
                </ThemedText>
              ) : (
                <ThemedText style={[styles.characterCount, { color: theme.textTertiary }]}>
                  Max 60 seconds
                </ThemedText>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function ExploreVoiceCard({
  post,
  size,
  onPress,
  testID,
}: {
  post: VoicePost;
  size: number;
  onPress: () => void;
  testID: string;
}) {
  const { theme } = useTheme();
  const waveformBars = useMemo(() => 
    Array.from({ length: 12 }).map(() => 0.3 + Math.random() * 0.7),
    []
  );

  const formatDuration = (seconds: number | null): string => {
    if (seconds === null || seconds === undefined) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Pressable
      style={[
        styles.exploreItem,
        styles.voiceGridCard,
        { 
          width: size, 
          height: size,
          backgroundColor: theme.glassBackground,
        },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <View style={styles.voiceGridWaveContainer}>
        <View style={[styles.voiceGridIconCircle, { backgroundColor: theme.primary }]}>
          <Feather name="mic" size={size > ITEM_SIZE ? 32 : 24} color="#FFFFFF" />
        </View>
        <View style={styles.voiceGridWaveform}>
          {waveformBars.map((height, i) => (
            <View
              key={i}
              style={[
                styles.voiceGridWaveBar,
                {
                  height: `${height * 60}%`,
                  backgroundColor: theme.primary,
                  opacity: 0.6 + (i % 3) * 0.15,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.voiceGridOverlay}>
        <View style={styles.voiceGridUserRow}>
          <Avatar uri={post.user?.avatarUrl} size={24} />
          <ThemedText style={styles.voiceGridUsername} numberOfLines={1}>
            @{post.user?.username || 'unknown'}
          </ThemedText>
          {post.user?.isVerified ? (
            <Feather name="check-circle" size={12} color={theme.primary} />
          ) : null}
        </View>
        <View style={styles.voiceGridStats}>
          <View style={styles.voiceGridStat}>
            <Feather name="clock" size={12} color="#FFFFFF" />
            <ThemedText style={styles.voiceGridStatText}>
              {formatDuration(post.duration)}
            </ThemedText>
          </View>
          <View style={styles.voiceGridStat}>
            <Feather name="headphones" size={12} color="#FFFFFF" />
            <ThemedText style={styles.voiceGridStatText}>
              {formatCount(post.viewsCount)}
            </ThemedText>
          </View>
          <View style={styles.voiceGridStat}>
            <Feather name="heart" size={12} color="#FFFFFF" />
            <ThemedText style={styles.voiceGridStatText}>
              {formatCount(post.likesCount)}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function VoiceTab() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const audioManager = useAudioManager();
  const viewedPostsRef = useRef<Set<string>>(new Set());
  const scrollViewRef = useRef<FlatList>(null);
  const [sessionKey, setSessionKey] = useState(() => getSessionId());

  const { data: voicePosts, isLoading, refetch, isRefetching } = useQuery<VoicePost[]>({
    queryKey: ["/api/discover/voices", sessionKey],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/discover/voices?sessionId=${sessionKey}`, getApiUrl()), 
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch voice posts");
      return res.json();
    },
  });

  const handleRefresh = useCallback(() => {
    resetSessionId();
    setSessionKey(getSessionId());
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        viewedPostsRef.current.clear();
        audioManager.stopAll();
      };
    }, [audioManager])
  );

  const handleVoicePostPress = (post: VoicePost) => {
    // Track view when voice post is opened
    if (!viewedPostsRef.current.has(post.id)) {
      viewedPostsRef.current.add(post.id);
      trackPostView(post.id, "SEARCH");
      trackDiscoveryInteraction({
        contentId: post.id,
        contentType: "VOICE",
        interactionType: "VIEW",
        creatorId: post.user.id,
      });
    }
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const voiceIndex = Math.max(0, voicePosts?.findIndex(p => p.id === post.id) ?? -1);
    navigation.navigate("VoiceReels", { initialIndex: voiceIndex });
  };


  const renderVoiceGridItem = (post: VoicePost, index: number, isLarge: boolean) => {
    const size = isLarge ? LARGE_ITEM_SIZE : ITEM_SIZE;
    
    return (
      <ExploreVoiceCard
        key={post.id}
        post={post}
        size={size}
        onPress={() => handleVoicePostPress(post)}
        testID={`voice-grid-item-${post.id}`}
      />
    );
  };

  const renderVoiceGrid = () => {
    if (!voicePosts || voicePosts.length === 0) return null;
    
    const rows: React.ReactNode[] = [];
    let currentIndex = 0;
    let rowIndex = 0;
    
    while (currentIndex < voicePosts.length) {
      const patternIndex = rowIndex % 4;
      
      if (patternIndex === 0 || patternIndex === 2) {
        const rowItems = voicePosts.slice(currentIndex, currentIndex + 3);
        rows.push(
          <View key={`row-${rowIndex}`} style={styles.exploreRow}>
            {rowItems.map((post, i) => renderVoiceGridItem(post, currentIndex + i, false))}
          </View>
        );
        currentIndex += 3;
      } else if (patternIndex === 1) {
        const largePost = voicePosts[currentIndex];
        const smallPosts = voicePosts.slice(currentIndex + 1, currentIndex + 3);
        rows.push(
          <View key={`row-${rowIndex}`} style={styles.exploreRow}>
            {largePost ? renderVoiceGridItem(largePost, currentIndex, true) : null}
            <View style={styles.exploreColumn}>
              {smallPosts.map((post, i) => renderVoiceGridItem(post, currentIndex + 1 + i, false))}
            </View>
          </View>
        );
        currentIndex += 3;
      } else {
        const smallPosts = voicePosts.slice(currentIndex, currentIndex + 2);
        const largePost = voicePosts[currentIndex + 2];
        rows.push(
          <View key={`row-${rowIndex}`} style={styles.exploreRow}>
            <View style={styles.exploreColumn}>
              {smallPosts.map((post, i) => renderVoiceGridItem(post, currentIndex + i, false))}
            </View>
            {largePost ? renderVoiceGridItem(largePost, currentIndex + 2, true) : null}
          </View>
        );
        currentIndex += 3;
      }
      rowIndex++;
    }
    
    return rows;
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot, paddingTop: Spacing.lg }]}>
        <DiscoverGridSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        ref={scrollViewRef}
        data={[1]}
        keyExtractor={() => "voice-grid"}
        renderItem={() => <View style={styles.exploreGrid}>{renderVoiceGrid()}</View>}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="mic" size={64} color={theme.textSecondary} />
            <ThemedText type="h4" style={[styles.emptyTitle, { marginTop: Spacing.lg }]}>
              No Voice Notes Yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Be the first to share your voice
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

type LiveStream = {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  status: string;
  viewerCount: number;
  peakViewerCount: number;
  startedAt?: string;
  host?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
};

function LiveTab() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: liveStreams, isLoading, refetch, isRefetching } = useQuery<LiveStream[]>({
    queryKey: ["/api/live-streams"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/live-streams?status=live", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch live streams");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const handleStreamPress = (stream: LiveStream) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("LiveStream", { streamId: stream.id, isHost: false });
  };

  const handleGoLive = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate("GoLive");
  };

  const formatViewers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderStreamItem = ({ item }: { item: LiveStream }) => (
    <Pressable
      style={[styles.liveStreamCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
      onPress={() => handleStreamPress(item)}
      testID={`live-stream-${item.id}`}
    >
      <View style={styles.liveStreamThumbnail}>
        <View style={[styles.liveStreamPlaceholder, { backgroundColor: "#1a1a2e" }]}>
          <Feather name="video" size={40} color="rgba(255,255,255,0.3)" />
        </View>
        <View style={styles.liveStreamBadge}>
          <View style={styles.liveDotSmall} />
          <ThemedText style={styles.liveTextSmall}>LIVE</ThemedText>
        </View>
        <View style={styles.viewerBadge}>
          <Feather name="eye" size={12} color="#FFF" />
          <ThemedText style={styles.viewerText}>{formatViewers(item.viewerCount)}</ThemedText>
        </View>
      </View>
      <View style={styles.liveStreamInfo}>
        <View style={styles.liveStreamHostRow}>
          <Avatar uri={item.host?.avatarUrl} size={36} />
          <View style={styles.liveStreamHostInfo}>
            <View style={styles.hostNameRow}>
              <ThemedText style={[styles.liveStreamHostName, { color: theme.text }]} numberOfLines={1}>
                {item.host?.displayName || item.host?.username}
              </ThemedText>
              {item.host?.isVerified ? (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={8} color="#FFF" />
                </View>
              ) : null}
            </View>
            <ThemedText style={[styles.liveStreamTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.title}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.backgroundRoot }]}>
      <Pressable
        style={[styles.goLiveCard, { backgroundColor: theme.error }]}
        onPress={handleGoLive}
        testID="button-go-live-discover"
      >
        <View style={styles.goLiveIconContainer}>
          <Feather name="radio" size={28} color="#FFF" />
        </View>
        <View style={styles.goLiveCardContent}>
          <ThemedText style={styles.goLiveCardTitle}>Go Live Now</ThemedText>
          <ThemedText style={styles.goLiveCardSubtitle}>Start broadcasting to your followers</ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
      </Pressable>

      <FlatList
        data={liveStreams || []}
        keyExtractor={(item) => item.id}
        renderItem={renderStreamItem}
        numColumns={2}
        columnWrapperStyle={styles.liveStreamsRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="video" size={64} color={theme.textSecondary} />
            <ThemedText type="h4" style={[styles.emptyTitle, { marginTop: Spacing.lg }]}>
              No Live Streams
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Be the first to go live and connect with your audience
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          liveStreams && liveStreams.length > 0 ? (
            <ThemedText style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.md }]}>
              Currently Live
            </ThemedText>
          ) : null
        }
      />
    </View>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [isReelsActive, setIsReelsActive] = useState(false);

  useEffect(() => {
    if (isReelsActive) {
      navigation.setOptions({ headerShown: false });
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    } else {
      navigation.setOptions({ headerShown: true });
      navigation.getParent()?.setOptions({ 
        tabBarStyle: { 
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        } 
      });
    }
  }, [isReelsActive, navigation]);

  const handleTabChange = useCallback((state: any) => {
    const currentRoute = state.routes[state.index];
    setIsReelsActive(currentRoute.name === 'Reels');
  }, []);

  if (isReelsActive) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <Tab.Navigator
          screenListeners={{
            state: (e) => {
              if (e.data?.state) {
                handleTabChange(e.data.state);
              }
            },
          }}
          screenOptions={{
            tabBarStyle: { display: 'none' },
            tabBarIndicatorStyle: {
              backgroundColor: theme.primary,
              height: 3,
              borderRadius: 2,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
              textTransform: "none",
            },
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: theme.textSecondary,
            tabBarPressColor: theme.backgroundSecondary,
            swipeEnabled: false,
            lazy: true,
          }}
        >
          <Tab.Screen
            name="NewPeople"
            component={NewPeopleTab}
            options={{ tabBarLabel: "New People" }}
          />
          <Tab.Screen
            name="Reels"
            component={ReelsTab}
            options={{ tabBarLabel: "Reels" }}
          />
          <Tab.Screen
            name="Trends"
            component={TrendsTab}
            options={{ tabBarLabel: "Trends" }}
          />
          <Tab.Screen
            name="Gossip"
            component={AnonymousGossipTab}
            options={{ tabBarLabel: "Gossip" }}
          />
          <Tab.Screen
            name="Live"
            component={LiveTab}
            options={{ tabBarLabel: "Live" }}
          />
        </Tab.Navigator>
      </View>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <Tab.Navigator
        screenListeners={{
          state: (e) => {
            if (e.data?.state) {
              handleTabChange(e.data.state);
            }
          },
        }}
        screenOptions={{
          tabBarStyle: isReelsActive ? { display: 'none' } : {
            backgroundColor: theme.glassBackground,
            borderBottomWidth: 1,
            borderBottomColor: theme.glassBorder,
            marginTop: Platform.OS === "android" ? 0 : headerHeight,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: theme.primary,
            height: 3,
            borderRadius: 2,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            textTransform: "none",
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarPressColor: theme.backgroundSecondary,
          swipeEnabled: !isReelsActive,
          lazy: true,
        }}
      >
        <Tab.Screen
          name="NewPeople"
          component={NewPeopleTab}
          options={{ tabBarLabel: "New People" }}
        />
        <Tab.Screen
          name="Reels"
          component={ReelsTab}
          options={{ tabBarLabel: "Reels" }}
        />
        <Tab.Screen
          name="Trends"
          component={TrendsTab}
          options={{ tabBarLabel: "Trends" }}
        />
        <Tab.Screen
          name="Gossip"
          component={AnonymousGossipTab}
          options={{ tabBarLabel: "Gossip" }}
        />
        <Tab.Screen
          name="Live"
          component={LiveTab}
          options={{ tabBarLabel: "Live" }}
        />
      </Tab.Navigator>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flex: 1,
  },
  reelsFullScreen: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  reelsBackButton: {
    position: "absolute",
    left: 16,
    zIndex: 100,
  },
  reelsBackButtonBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  reelsTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    zIndex: 99,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["4xl"],
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  userGrid: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  userCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 3) / 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
  },
  userDisplayName: {
    fontWeight: "600",
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  userUsername: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.xs,
  },
  userBadges: {
    marginVertical: Spacing.sm,
  },
  reelContainer: {
    flex: 1,
    backgroundColor: "#000",
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
  reelInfo: {
    position: "absolute",
    left: Spacing.md,
    right: 80,
    bottom: 60,
  },
  reelUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  reelUsername: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  reelCaption: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  reelActions: {
    position: "absolute",
    right: Spacing.md,
    bottom: 60,
    alignItems: "center",
    gap: Spacing.xl,
  },
  reelActionButton: {
    alignItems: "center",
  },
  reelActionCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  trendCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  trendHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  trendRank: {
    alignItems: "center",
    justifyContent: "center",
  },
  trendRankNumber: {
    fontSize: 14,
    fontWeight: "700",
  },
  trendEngagement: {
    fontSize: 12,
    marginLeft: "auto",
  },
  trendAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  trendAuthorInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  trendAuthorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  trendDisplayName: {
    fontWeight: "600",
    fontSize: 15,
  },
  trendUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  trendContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  trendMediaContainer: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  trendMedia: {
    width: "100%",
    height: "100%",
  },
  trendPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  trendActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  trendAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  trendActionCount: {
    fontSize: 13,
  },
  gossipCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  gossipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  gossipMeta: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  anonymousLabel: {
    fontWeight: "600",
  },
  gossipTime: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
  voiceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  gossipText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  gossipActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: Spacing.md,
    gap: Spacing["2xl"],
  },
  gossipAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  gossipActionCount: {
    fontSize: 14,
  },
  exploreGrid: {
    width: SCREEN_WIDTH,
  },
  exploreRow: {
    flexDirection: "row",
    marginBottom: GRID_GAP,
    gap: GRID_GAP,
  },
  exploreColumn: {
    gap: GRID_GAP,
  },
  exploreItem: {
    position: "relative",
    backgroundColor: "#1A1A2E",
    overflow: "hidden",
  },
  exploreImage: {
    width: "100%",
    height: "100%",
  },
  videoIndicator: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  exploreOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  exploreStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  exploreStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  exploreStatText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  gossipFab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  gossipModalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  gossipModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  gossipComposeBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  gossipInput: {
    flex: 1,
    minHeight: 120,
    maxHeight: 200,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    textAlignVertical: "top",
  },
  gossipComposeFooter: {
    alignItems: "flex-end",
    marginTop: Spacing.md,
  },
  characterCount: {
    fontSize: 12,
  },
  gossipAudioPlayer: {
    marginBottom: Spacing.md,
  },
  gossipModeToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modeToggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  voiceRecordingContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  voiceRecordingContent: {
    flex: 1,
    minHeight: 120,
    justifyContent: "center",
  },
  recordButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  recordHint: {
    fontSize: 14,
  },
  recordingActiveContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  recordingLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  recordingTimer: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  recordingActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingStopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingPreviewContainer: {
    paddingVertical: Spacing.md,
  },
  uploadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  uploadingText: {
    fontSize: 14,
  },
  previewPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  previewPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
  },
  previewDuration: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewReady: {
    fontSize: 13,
    marginTop: 2,
  },
  previewDeleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  voiceAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  voiceAuthorInfo: {
    flex: 1,
  },
  voiceAuthorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  voiceDisplayName: {
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  voiceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  voiceUsername: {
    fontSize: 13,
  },
  voiceNetWorth: {
    fontSize: 12,
  },
  voiceTime: {
    fontSize: 12,
  },
  voiceCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  voicePlayer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  voicePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceWaveformContainer: {
    flex: 1,
    height: 32,
    justifyContent: "center",
  },
  voiceProgressBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
  },
  voiceProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  voiceWaveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  voiceWaveBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 13,
    fontWeight: "500",
  },
  voiceActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  voiceAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  voiceActionCount: {
    fontSize: 13,
  },
  voiceActionSpacer: {
    flex: 1,
  },
  voiceListContent: {
    padding: Spacing.md,
  },
  wealthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.xs,
  },
  wealthBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#000",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  voiceGridCard: {
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  voiceGridWaveContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.lg,
  },
  voiceGridIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  voiceGridWaveform: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 32,
    gap: 3,
    paddingHorizontal: Spacing.md,
  },
  voiceGridWaveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 8,
  },
  voiceGridOverlay: {
    padding: Spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  voiceGridUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  voiceGridUsername: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  voiceGridStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  voiceGridStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voiceGridStatText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  personCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    position: "relative",
  },
  dismissButton: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  personAvatarContainer: {
    position: "relative",
  },
  followsYouBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  personInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  personNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  personName: {
    fontSize: 16,
    fontWeight: "600",
  },
  personUsername: {
    fontSize: 13,
    marginTop: 1,
  },
  suggestionReason: {
    fontSize: 12,
    marginTop: 2,
  },
  personFollowers: {
    fontSize: 13,
    marginTop: 2,
  },
  personActions: {
    alignItems: "flex-end",
    gap: 4,
  },
  followersCount: {
    fontSize: 11,
    marginTop: 4,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  liveStreamCard: {
    flex: 1,
    margin: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  liveStreamThumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    position: "relative",
  },
  liveStreamPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  liveStreamBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
  },
  liveTextSmall: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  viewerBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  viewerText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  liveStreamInfo: {
    padding: Spacing.sm,
  },
  liveStreamHostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  liveStreamHostInfo: {
    flex: 1,
  },
  hostNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveStreamHostName: {
    fontSize: 13,
    fontWeight: "600",
  },
  liveStreamTitle: {
    fontSize: 11,
    marginTop: 2,
  },
  liveStreamsRow: {
    justifyContent: "space-between",
  },
  goLiveCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  goLiveIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  goLiveCardContent: {
    flex: 1,
  },
  goLiveCardTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  goLiveCardSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  // Stories-style suggested people section
  suggestedPeopleSection: {
    marginBottom: Spacing.lg,
  },
  suggestedPeopleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  suggestedPeopleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  suggestedPeopleList: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  suggestedPersonItem: {
    alignItems: "center",
    width: 80,
    marginRight: Spacing.sm,
  },
  suggestedAvatarContainer: {
    position: "relative",
    marginBottom: Spacing.xs,
  },
  suggestedAvatarRing: {
    borderWidth: 2,
    borderRadius: 32,
    padding: 2,
  },
  suggestedVerifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  suggestedPersonName: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: Spacing.xs,
    maxWidth: 75,
  },
  suggestedFollowBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    minWidth: 70,
    alignItems: "center",
  },
  suggestedFollowBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
