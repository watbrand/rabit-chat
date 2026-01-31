import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  Platform,
  ViewToken,
  Share,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, Gradients } from "@/constants/theme";
import { trackPostView, createWatchTracker, TrafficSource } from "@/lib/analytics";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type MediaPost = {
  id: string;
  authorId: string;
  type: "VIDEO" | "VOICE";
  content: string | null;
  mediaUrl: string;
  thumbnailUrl: string | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  hasLiked?: boolean;
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
  post: MediaPost;
  isActive: boolean;
  onLike: () => void;
  onUserPress: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

function ReelItem({ post, isActive, onLike, onUserPress, onComment, onShare }: ReelItemProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPaused, setIsPaused] = useState(false);
  const [localLiked, setLocalLiked] = useState(post.hasLiked || false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount);
  const heartScale = useSharedValue(0);
  const lastTapTime = useRef(0);
  const pulseScale = useSharedValue(1);

  // Audio player for VOICE posts
  const [audioSound, setAudioSound] = useState<Audio.Sound | null>(null);
  
  // Video player for VIDEO posts
  const videoPlayer = useVideoPlayer(post.type === "VIDEO" ? post.mediaUrl : "", (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Load and manage audio for VOICE posts
  useEffect(() => {
    let isMounted = true;
    let sound: Audio.Sound | null = null;
    
    if (post.type === "VOICE" && post.mediaUrl) {
      Audio.Sound.createAsync(
        { uri: post.mediaUrl },
        { shouldPlay: false, isLooping: true }
      ).then(({ sound: loadedSound }) => {
        if (isMounted) {
          sound = loadedSound;
          setAudioSound(loadedSound);
        }
      }).catch(() => {
        // Audio loading failed
      });
    }
    
    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [post.mediaUrl, post.type]);

  // Play/pause based on active state
  useEffect(() => {
    try {
      if (post.type === "VIDEO") {
        if (isActive && !isPaused) {
          videoPlayer.play();
        } else {
          videoPlayer.pause();
        }
      } else if (post.type === "VOICE" && audioSound) {
        if (isActive && !isPaused) {
          audioSound.playAsync();
        } else {
          audioSound.pauseAsync();
        }
      }
    } catch (error) {
      // Player native module may not be ready yet, ignore
    }
  }, [isActive, isPaused, post.type, videoPlayer, audioSound]);

  // Animated pulse for audio visualization
  useEffect(() => {
    if (post.type === "VOICE" && isActive && !isPaused) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isActive, isPaused, post.type, pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

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
      if (!localLiked) {
        setLocalLiked(true);
        setLocalLikesCount(prev => prev + 1);
      }
      onLike();
    }
    lastTapTime.current = now;
  };

  const handleLikePress = () => {
    setLocalLiked(prev => !prev);
    setLocalLikesCount(prev => localLiked ? prev - 1 : prev + 1);
    onLike();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSingleTap = () => {
    setIsPaused((prev) => !prev);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ${post.type === "VOICE" ? "voice note" : "video"} on RabitChat!`,
        url: post.mediaUrl,
      });
    } catch (error) {
      // Sharing cancelled or failed
    }
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

  const renderMedia = () => {
    if (post.type === "VIDEO") {
      return (
        <VideoView
          player={videoPlayer}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
      );
    }
    
    // VOICE post - show audio visualization with gradient background
    return (
      <LinearGradient
        colors={isDark ? ['#1a1a2e', '#16213e', '#0f0f23'] : Gradients.primary}
        style={styles.voiceBackground}
      >
        {post.thumbnailUrl ? (
          <Image
            source={{ uri: post.thumbnailUrl }}
            style={styles.voiceThumbnail}
            contentFit="cover"
            blurRadius={20}
          />
        ) : null}
        <View style={styles.voiceOverlay}>
          <Animated.View style={[styles.voiceVisualization, pulseAnimatedStyle]}>
            <View style={[styles.voiceCircle, styles.voiceCircleOuter, { borderColor: 'rgba(255,255,255,0.2)' }]}>
              <View style={[styles.voiceCircle, styles.voiceCircleMiddle, { borderColor: 'rgba(255,255,255,0.4)' }]}>
                <View style={[styles.voiceCircle, styles.voiceCircleInner, { backgroundColor: theme.primary }]}>
                  <Avatar uri={post.user?.avatarUrl} size={80} />
                </View>
              </View>
            </View>
          </Animated.View>
          <View style={styles.voiceIndicator}>
            <Feather name="mic" size={24} color="#FFFFFF" />
            <ThemedText style={styles.voiceLabel}>Voice Note</ThemedText>
          </View>
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={styles.reelContainer}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.videoContainer}>
          {renderMedia()}

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

      <View style={[styles.reelInfo, { bottom: insets.bottom + Spacing.xl }]}>
        <Pressable onPress={onUserPress} style={styles.reelUserRow}>
          <Avatar uri={post.user?.avatarUrl} size={40} />
          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <ThemedText style={styles.reelUsername}>@{post.user?.username}</ThemedText>
              {post.user?.isVerified ? (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={10} color="#FFF" />
                </View>
              ) : null}
            </View>
            <ThemedText style={styles.displayName}>{post.user?.displayName}</ThemedText>
          </View>
        </Pressable>
        {post.content ? (
          <ThemedText style={styles.reelCaption} numberOfLines={2}>
            {post.content}
          </ThemedText>
        ) : null}
      </View>

      <View style={[styles.reelActions, { bottom: insets.bottom + Spacing.xl + Spacing.lg }]}>
        <Pressable style={styles.reelActionButton} onPress={handleLikePress} testID={`like-btn-${post.id}`}>
          <Feather name="heart" size={28} color={localLiked ? "#EF4444" : "#FFFFFF"} />
          <ThemedText style={styles.reelActionCount}>
            {formatCount(localLikesCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.reelActionButton} onPress={onComment} testID={`comment-btn-${post.id}`}>
          <Feather name="message-circle" size={28} color="#FFFFFF" />
          <ThemedText style={styles.reelActionCount}>
            {formatCount(post.commentsCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.reelActionButton} onPress={handleShare} testID={`share-btn-${post.id}`}>
          <Feather name="share" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

type ExploreReelsRouteProp = RouteProp<RootStackParamList, "ExploreReels">;

export default function ExploreReelsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ExploreReelsRouteProp>();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(route.params?.initialIndex || 0);
  const flatListRef = useRef<FlatList>(null);
  const watchTrackerRef = useRef<ReturnType<typeof createWatchTracker> | null>(null);

  const posts = route.params?.posts || [];

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
      
      // Create and start new tracker
      watchTrackerRef.current = createWatchTracker(currentPost.id, "FEED");
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
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/explore"] });
      queryClient.invalidateQueries({ queryKey: ["/api/discover/reels"] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to like reel. Please try again.');
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
    itemVisiblePercentThreshold: 50,
  });

  const handleUserPress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderReel = ({ item, index }: { item: MediaPost; index: number }) => (
    <ReelItem
      post={item}
      isActive={index === activeIndex}
      onLike={() => likeMutation.mutate(item.id)}
      onUserPress={() => handleUserPress(item.user?.id)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <StatusBar style="light" />
      
      <View style={[styles.header, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Pressable 
          onPress={handleGoBack} 
          style={styles.backButton} 
          testID="back-button"
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
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
    position: "relative",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
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
  },
  reelUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  userInfo: {
    marginLeft: Spacing.sm,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  reelUsername: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  displayName: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
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
  voiceBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  voiceThumbnail: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  voiceOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceVisualization: {
    alignItems: "center",
    justifyContent: "center",
  },
  voiceCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  voiceCircleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  voiceCircleMiddle: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  voiceCircleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 0,
    overflow: "hidden",
  },
  voiceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xl,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.sm,
  },
  voiceLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
