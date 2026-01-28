import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { VideoOverlayActions, VideoOverlayInfo } from "@/components/VideoOverlayActions";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, Gradients } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useAudioManager } from "@/contexts/AudioManagerContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type VoicePost = {
  id: string;
  userId: string;
  type: "VOICE";
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
    netWorth?: number;
  };
};

interface VoiceReelItemProps {
  post: VoicePost;
  isActive: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserPress: () => void;
}

function VoiceReelItem({
  post,
  isActive,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onUserPress,
}: VoiceReelItemProps) {
  const { theme } = useTheme();
  const audioManager = useAudioManager();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(post.duration || 0);
  const heartScale = useSharedValue(0);
  const lastTapTime = useRef(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playerId = useMemo(() => `voice-reel-${post.id}`, [post.id]);
  
  const pulseScale = useSharedValue(1);
  const waveAnim = useSharedValue(0);

  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
      setIsPaused(true);
    } catch (err) {
      console.error("Error stopping voice reel:", err);
    }
  }, []);

  useEffect(() => {
    audioManager.registerPlayer(playerId, stopPlayback);
    return () => {
      audioManager.unregisterPlayer(playerId);
    };
  }, [playerId, audioManager, stopPlayback]);

  useEffect(() => {
    if (isActive && isPlaying) {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      waveAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1);
      waveAnim.value = 0;
    }
  }, [isActive, isPlaying]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    let mounted = true;

    const loadAndPlayAudio = async () => {
      if (!isActive || isPaused) {
        if (soundRef.current) {
          try {
            await soundRef.current.pauseAsync();
          } catch (error) {
            // Audio pause failed - already stopped or disposed
          }
        }
        setIsPlaying(false);
        return;
      }

      try {
        audioManager.requestPlayback(playerId);
        
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        if (!soundRef.current) {
          const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: post.mediaUrl },
            { shouldPlay: true },
            (status) => {
              if (status.isLoaded) {
                if (status.durationMillis) {
                  setDuration(status.durationMillis);
                }
                setProgress(status.positionMillis / (status.durationMillis || 1));
                setIsPlaying(status.isPlaying);
                
                if (status.didJustFinish) {
                  newSound.setPositionAsync(0);
                  newSound.playAsync();
                }
              }
            }
          );

          if (mounted) {
            setSound(newSound);
            soundRef.current = newSound;
            setIsPlaying(true);
          }
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Audio playback error:", error);
      }
    };

    loadAndPlayAudio();

    return () => {
      mounted = false;
    };
  }, [isActive, isPaused, post.mediaUrl, audioManager, playerId]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (soundRef.current) {
          soundRef.current.pauseAsync();
          setIsPlaying(false);
        }
      };
    }, [])
  );

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

  const handleSingleTap = async () => {
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

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(waveAnim.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
    transform: [{ scale: interpolate(waveAnim.value, [0, 1], [1, 1.5]) }],
  }));

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.reelContainer}>
      <GestureDetector gesture={composedGesture}>
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f0f23"]}
          style={styles.voiceContainer}
        >
          <View style={styles.visualizerContainer}>
            <Animated.View style={[styles.waveRing, styles.waveRing1, waveAnimatedStyle]} />
            <Animated.View style={[styles.waveRing, styles.waveRing2, waveAnimatedStyle]} />
            <Animated.View style={[styles.waveRing, styles.waveRing3, waveAnimatedStyle]} />
            
            <Animated.View style={[styles.avatarWrapper, avatarAnimatedStyle]}>
              <LinearGradient
                colors={Gradients.primary}
                style={styles.avatarGradient}
              >
                <Avatar uri={post.user?.avatarUrl} size={120} />
              </LinearGradient>
            </Animated.View>

            <View style={styles.waveformContainer}>
              {[...Array(20)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: isPlaying 
                        ? 20 + Math.random() * 40 
                        : 10 + (i % 5) * 8,
                      backgroundColor: theme.primary,
                      opacity: isPlaying ? 0.8 : 0.4,
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${progress * 100}%`,
                      backgroundColor: theme.primary,
                    }
                  ]} 
                />
              </View>
              <View style={styles.durationRow}>
                <ThemedText style={styles.durationText}>
                  {formatDuration(progress * duration)}
                </ThemedText>
                <ThemedText style={styles.durationText}>
                  {formatDuration(duration)}
                </ThemedText>
              </View>
            </View>
          </View>

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
        </LinearGradient>
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

type VoiceReelsRouteProp = RouteProp<RootStackParamList, "VoiceReels">;

export default function VoiceReelsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<VoiceReelsRouteProp>();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(route.params?.initialIndex || 0);
  const flatListRef = useRef<FlatList>(null);

  const { data: posts, isLoading } = useQuery<VoicePost[]>({
    queryKey: ["/api/discover/voices"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/discover/voices", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch voices");
      return res.json();
    },
  });

  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveIndex(-1);
      };
    }, [])
  );

  useEffect(() => {
    const initialIndex = route.params?.initialIndex ?? 0;
    if (posts && posts.length > 0 && initialIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 100);
    }
  }, [posts, route.params?.initialIndex]);

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/voices"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/discover/voices"] });
    },
  });

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

  const handleShare = async (postId: string) => {
    try {
      await apiRequest("POST", `/api/posts/${postId}/share`, { platform: "other" });
      queryClient.invalidateQueries({ queryKey: ["/api/discover/voices"] });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: VoicePost; index: number }) => (
      <VoiceReelItem
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
      <View style={[styles.loadingContainer, { backgroundColor: "#0f0f23" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: "#0f0f23" }]}>
        <Feather name="mic-off" size={48} color={theme.textSecondary} />
        <ThemedText style={styles.emptyText}>No voice notes yet</ThemedText>
        <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          Voice notes from the community will appear here
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#0f0f23" }]}>
      <StatusBar style="light" />

      <Pressable
        style={[styles.backButton, { top: insets.top + Spacing.sm }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="arrow-left" size={24} color="#FFFFFF" />
      </Pressable>

      <ThemedText style={[styles.headerTitle, { top: insets.top + Spacing.sm }]}>
        Voice Notes
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
        initialScrollIndex={route.params?.initialIndex || 0}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          }, 100);
        }}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
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
  voiceContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  visualizerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    marginBottom: Spacing.xl,
  },
  avatarGradient: {
    padding: 4,
    borderRadius: 64,
  },
  waveRing: {
    position: "absolute",
    borderRadius: 200,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  waveRing1: {
    width: 180,
    height: 180,
  },
  waveRing2: {
    width: 240,
    height: 240,
  },
  waveRing3: {
    width: 300,
    height: 300,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    gap: 3,
    marginTop: Spacing.xl,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  progressContainer: {
    width: SCREEN_WIDTH - Spacing.xl * 4,
    marginTop: Spacing.xl,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  durationText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
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
