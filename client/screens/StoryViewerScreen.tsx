import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  StatusBar,
  Animated as RNAnimated,
  TextInput,
  Platform,
  Keyboard,
  Alert,
  ScrollView,
  Text,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus, Audio } from "expo-av";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { StickerRenderer } from "@/components/story/stickers";
import MusicOverlay from "@/components/story/MusicOverlay";
import SongDetailsModal from "@/components/story/SongDetailsModal";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PHOTO_DURATION = 5000;
const PROGRESS_BAR_HEIGHT = 3;

interface StorySticker {
  id: string;
  type: string;
  position: { x: number; y: number };
  rotation?: number;
  scale?: number;
  data: any;
}

interface Story {
  id: string;
  type: string;
  mediaUrl: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  durationMs?: number;
  viewsCount?: number;
  createdAt: string;
  stickers?: StorySticker[];
  textContent?: string;
  backgroundColor?: string;
  fontFamily?: string;
  animation?: string;
  musicUrl?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartTime?: number;
  musicDuration?: number;
  user?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface UserWithStories {
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  stories: Story[];
}

interface StoryViewer {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  viewedAt: string;
}

type StoryViewerRouteProp = RouteProp<RootStackParamList, "StoryViewer">;

export default function StoryViewerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<StoryViewerRouteProp>();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { user } = useAuth();

  const { users, initialUserIndex, initialStoryIndex } = route.params;
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyFocused, setIsReplyFocused] = useState(false);
  const [showViewersPanel, setShowViewersPanel] = useState(false);
  const [showSongDetails, setShowSongDetails] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const videoRef = useRef<Video>(null);
  const musicSoundRef = useRef<Audio.Sound | null>(null);
  const musicDurationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnim = useRef(new RNAnimated.Value(0)).current;
  const progressAnimation = useRef<RNAnimated.CompositeAnimation | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const userOpacity = useSharedValue(1);
  const viewersPanelHeight = useSharedValue(0);
  const storyScale = useSharedValue(1);
  const storyOpacity = useSharedValue(1);
  const VIEWERS_PANEL_MAX_HEIGHT = 300;

  const currentUser: UserWithStories = users[currentUserIndex];
  const currentStory: Story = currentUser?.stories[currentStoryIndex];
  const isVideo = currentStory?.type === "VIDEO";
  const isVoice = currentStory?.type === "VOICE";
  const isOwner = currentUser?.userId === user?.id;
  const storyOwnerId = currentUser?.userId;

  const viewStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      return apiRequest("POST", `/api/stories/${storyId}/view`);
    },
  });

  const { data: viewers, isLoading: viewersLoading, refetch: refetchViewers } = useQuery<StoryViewer[]>({
    queryKey: ["/api/stories", currentStory?.id, "viewers"],
    enabled: showViewersPanel && isOwner && !!currentStory?.id,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ recipientId, message, storyId }: { recipientId: string; message: string; storyId: string }) => {
      const res = await apiRequest("POST", `/api/stories/${storyId}/reply`, { 
        recipientId, 
        message 
      });
      return res.json();
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setReplyText("");
      Keyboard.dismiss();
      setIsReplyFocused(false);
      resumeProgress();
      Alert.alert("Sent!", "Your reply was sent as a message.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to send reply");
      resumeProgress();
    },
  });

  const handleReplyFocus = () => {
    setIsReplyFocused(true);
    pauseProgress();
    if (isVideo && videoRef.current) {
      videoRef.current.pauseAsync();
    }
    pauseMusicPlayback();
  };

  const handleReplyBlur = () => {
    setIsReplyFocused(false);
    if (!replyMutation.isPending) {
      resumeProgress();
      if (isVideo && videoRef.current) {
        videoRef.current.playAsync();
      }
      resumeMusicPlayback();
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || replyMutation.isPending) return;
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    replyMutation.mutate({
      recipientId: storyOwnerId,
      message: replyText.trim(),
      storyId: currentStory.id,
    });
  };

  const formatViewedTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  useEffect(() => {
    if (currentStory && !isOwner) {
      viewStoryMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  const stopMusicPlayback = useCallback(async () => {
    if (musicDurationTimer.current) {
      clearTimeout(musicDurationTimer.current);
      musicDurationTimer.current = null;
    }
    if (musicSoundRef.current) {
      try {
        await musicSoundRef.current.stopAsync();
        await musicSoundRef.current.unloadAsync();
      } catch (err) {
        // Music playback cleanup error - non-critical
      }
      musicSoundRef.current = null;
    }
    setIsMusicPlaying(false);
  }, []);

  const pauseMusicPlayback = useCallback(async () => {
    if (musicSoundRef.current) {
      try {
        await musicSoundRef.current.pauseAsync();
        setIsMusicPlaying(false);
      } catch (err) {
        // Music pause error - non-critical
      }
    }
  }, []);

  const resumeMusicPlayback = useCallback(async () => {
    if (musicSoundRef.current) {
      try {
        await musicSoundRef.current.playAsync();
        setIsMusicPlaying(true);
      } catch (err) {
        // Music resume error - non-critical
      }
    }
  }, []);

  useEffect(() => {
    const loadAndPlayMusic = async () => {
      await stopMusicPlayback();

      if (!currentStory?.musicUrl || isVoice) {
        return;
      }

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: currentStory.musicUrl },
          { shouldPlay: false }
        );
        musicSoundRef.current = sound;

        if (currentStory.musicStartTime && currentStory.musicStartTime > 0) {
          await sound.setPositionAsync(currentStory.musicStartTime * 1000);
        }

        await sound.playAsync();
        setIsMusicPlaying(true);

        if (currentStory.musicDuration && currentStory.musicDuration > 0) {
          musicDurationTimer.current = setTimeout(async () => {
            await stopMusicPlayback();
          }, currentStory.musicDuration * 1000);
        }
      } catch (err) {
        // Music loading error - non-critical
        setIsMusicPlaying(false);
      }
    };

    loadAndPlayMusic();

    return () => {
      stopMusicPlayback();
    };
  }, [currentStory?.id, currentStory?.musicUrl, isVoice, stopMusicPlayback]);

  const animateStoryTransition = useCallback((direction: 'next' | 'prev', callback: () => void) => {
    'worklet';
    const targetX = direction === 'next' ? -SCREEN_WIDTH * 0.3 : SCREEN_WIDTH * 0.3;
    
    storyScale.value = withTiming(0.9, { duration: 150 });
    storyOpacity.value = withTiming(0.5, { duration: 150 });
    translateX.value = withTiming(targetX, { duration: 150 }, () => {
      runOnJS(callback)();
      translateX.value = direction === 'next' ? SCREEN_WIDTH * 0.3 : -SCREEN_WIDTH * 0.3;
      storyScale.value = 1;
      storyOpacity.value = 1;
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });
  }, [storyScale, storyOpacity, translateX]);

  const goToNextStory = useCallback(() => {
    const currentUserStories = currentUser?.stories || [];
    
    if (currentStoryIndex < currentUserStories.length - 1) {
      // Move to next story in current user with animation
      animateStoryTransition('next', () => {
        progressAnim.setValue(0);
        setCurrentStoryIndex(currentStoryIndex + 1);
        setVideoDuration(null);
      });
    } else if (currentUserIndex < users.length - 1) {
      // Move to first story of next user with animation
      animateStoryTransition('next', () => {
        progressAnim.setValue(0);
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
        setVideoDuration(null);
      });
    } else {
      // All users' stories done, go back
      navigation.goBack();
    }
  }, [currentUserIndex, currentStoryIndex, currentUser?.stories, users.length, navigation, progressAnim, animateStoryTransition]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      // Move to previous story in current user with animation
      animateStoryTransition('prev', () => {
        progressAnim.setValue(0);
        setCurrentStoryIndex(currentStoryIndex - 1);
        setVideoDuration(null);
      });
    } else if (currentUserIndex > 0) {
      // Move to last story of previous user with animation
      animateStoryTransition('prev', () => {
        progressAnim.setValue(0);
        const previousUser = users[currentUserIndex - 1];
        setCurrentUserIndex(currentUserIndex - 1);
        setCurrentStoryIndex(previousUser.stories.length - 1);
        setVideoDuration(null);
      });
    }
  }, [currentUserIndex, currentStoryIndex, users, progressAnim, animateStoryTransition]);

  const goToNextUser = useCallback(() => {
    if (currentUserIndex < users.length - 1) {
      animateStoryTransition('next', () => {
        progressAnim.setValue(0);
        userOpacity.value = withTiming(1);
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
        setVideoDuration(null);
      });
    }
  }, [currentUserIndex, users.length, progressAnim, userOpacity, animateStoryTransition]);

  const goToPrevUser = useCallback(() => {
    if (currentUserIndex > 0) {
      animateStoryTransition('prev', () => {
        progressAnim.setValue(0);
        userOpacity.value = withTiming(1);
        setCurrentUserIndex(currentUserIndex - 1);
        setCurrentStoryIndex(0);
        setVideoDuration(null);
      });
    }
  }, [currentUserIndex, progressAnim, userOpacity, animateStoryTransition]);

  const startProgress = useCallback(
    (duration: number) => {
      progressAnim.setValue(0);
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
      progressAnimation.current = RNAnimated.timing(progressAnim, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      });
      progressAnimation.current.start(({ finished }) => {
        if (finished) {
          goToNextStory();
        }
      });
    },
    [progressAnim, goToNextStory]
  );

  const pauseProgress = useCallback(() => {
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }
  }, []);

  const resumeProgress = useCallback(() => {
    // Use music duration if available, otherwise video duration or default
    const musicDurationMs = currentStory?.musicDuration ? currentStory.musicDuration * 1000 : null;
    const duration = isVideo
      ? videoDuration || currentStory?.durationMs || PHOTO_DURATION
      : musicDurationMs || PHOTO_DURATION;

    progressAnim.stopAnimation((value) => {
      const remainingDuration = duration * (1 - value);
      progressAnimation.current = RNAnimated.timing(progressAnim, {
        toValue: 1,
        duration: remainingDuration,
        useNativeDriver: false,
      });
      progressAnimation.current.start(({ finished }) => {
        if (finished) {
          goToNextStory();
        }
      });
    });
  }, [progressAnim, isVideo, videoDuration, currentStory, goToNextStory]);

  const handleToggleViewersPanel = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (showViewersPanel) {
      viewersPanelHeight.value = withSpring(0, { damping: 15, stiffness: 150 });
      setShowViewersPanel(false);
      resumeProgress();
      if (isVideo && videoRef.current) {
        videoRef.current.playAsync();
      }
      resumeMusicPlayback();
    } else {
      setShowViewersPanel(true);
      viewersPanelHeight.value = withSpring(VIEWERS_PANEL_MAX_HEIGHT, { damping: 15, stiffness: 150 });
      pauseProgress();
      if (isVideo && videoRef.current) {
        videoRef.current.pauseAsync();
      }
      pauseMusicPlayback();
    }
  }, [showViewersPanel, pauseProgress, resumeProgress, isVideo, viewersPanelHeight, VIEWERS_PANEL_MAX_HEIGHT, pauseMusicPlayback, resumeMusicPlayback]);

  const handleCloseViewersPanel = useCallback(() => {
    viewersPanelHeight.value = withSpring(0, { damping: 15, stiffness: 150 });
    setShowViewersPanel(false);
    resumeProgress();
    if (isVideo && videoRef.current) {
      videoRef.current.playAsync();
    }
    resumeMusicPlayback();
  }, [resumeProgress, isVideo, viewersPanelHeight, resumeMusicPlayback]);

  const handleViewerPress = useCallback((viewerId: string) => {
    handleCloseViewersPanel();
    navigation.navigate("UserProfile", { userId: viewerId });
  }, [handleCloseViewersPanel, navigation]);

  const viewersPanelAnimatedStyle = useAnimatedStyle(() => ({
    height: viewersPanelHeight.value,
    opacity: viewersPanelHeight.value > 0 ? 1 : 0,
  }));

  useEffect(() => {
    if (!isVideo) {
      // Use music duration if available, otherwise default photo duration
      const musicDurationMs = currentStory?.musicDuration ? currentStory.musicDuration * 1000 : null;
      startProgress(musicDurationMs || PHOTO_DURATION);
    }
    return () => {
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    };
  }, [currentUserIndex, currentStoryIndex, isVideo, startProgress, currentStory?.musicDuration]);

  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.durationMillis && !videoDuration) {
        setVideoDuration(status.durationMillis);
        startProgress(status.durationMillis);
      }
    }
  };

  const handleTap = (x: number) => {
    if (x < SCREEN_WIDTH / 3) {
      goToPrevStory();
    } else if (x > (SCREEN_WIDTH * 2) / 3) {
      goToNextStory();
    }
  };

  const handlePressIn = () => {
    setIsPaused(true);
    pauseProgress();
    if (isVideo && videoRef.current) {
      videoRef.current.pauseAsync();
    }
    pauseMusicPlayback();
  };

  const handlePressOut = () => {
    setIsPaused(false);
    resumeProgress();
    if (isVideo && videoRef.current) {
      videoRef.current.playAsync();
    }
    resumeMusicPlayback();
  };

  const closeViewer = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const verticalPanGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = 1 - event.translationY / (SCREEN_HEIGHT / 2);
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(closeViewer)();
      } else {
        translateY.value = withSpring(0);
        opacity.value = withTiming(1);
      }
    });

  const horizontalPanGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
        translateX.value = event.translationX;
        // Add subtle scale effect during swipe
        const progress = Math.abs(event.translationX) / SCREEN_WIDTH;
        storyScale.value = 1 - (progress * 0.1);
        storyOpacity.value = 1 - (progress * 0.3);
        userOpacity.value = 1 - Math.abs(event.translationX) / (SCREEN_WIDTH / 2);
      }
    })
    .onEnd((event) => {
      if (event.translationX > 50 && currentUserIndex > 0) {
        // Reset values before animated transition
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        storyScale.value = withTiming(1, { duration: 150 });
        storyOpacity.value = withTiming(1, { duration: 150 });
        userOpacity.value = withTiming(1);
        runOnJS(goToPrevUser)();
      } else if (event.translationX < -50 && currentUserIndex < users.length - 1) {
        // Reset values before animated transition
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        storyScale.value = withTiming(1, { duration: 150 });
        storyOpacity.value = withTiming(1, { duration: 150 });
        userOpacity.value = withTiming(1);
        runOnJS(goToNextUser)();
      } else {
        // Spring back to original position
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        storyScale.value = withSpring(1);
        storyOpacity.value = withTiming(1, { duration: 150 });
        userOpacity.value = withTiming(1);
      }
    });

  const combinedGesture = Gesture.Simultaneous(verticalPanGesture, horizontalPanGesture);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: storyScale.value },
    ],
    opacity: opacity.value * storyOpacity.value,
  }));

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  };

  const getFontFamily = (font: string): string => {
    switch (font) {
      case 'POPPINS': return 'Poppins_400Regular';
      case 'PLAYFAIR': return 'PlayfairDisplay_400Regular';
      case 'SPACE_MONO': return 'SpaceMono_400Regular';
      case 'DANCING_SCRIPT': return 'DancingScript_400Regular';
      case 'BEBAS_NEUE': return 'BebasNeue_400Regular';
      default: return 'Poppins_400Regular';
    }
  };

  const handleStickerInteraction = (stickerId: string, action: string, payload?: any) => {
    switch (action) {
      case 'vote':
      case 'answer':
      case 'slide':
      case 'respond':
        apiRequest('POST', `/api/stories/${currentStory.id}/stickers/${stickerId}/interact`, {
          action,
          payload,
        }).catch((err) => {
          console.error('Sticker interaction failed:', err);
        });
        break;
      case 'tip':
        Alert.alert('Tip', `You're about to tip R${payload?.amount}`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Confirm', onPress: () => {
            apiRequest('POST', `/api/stories/${currentStory.id}/stickers/${stickerId}/interact`, {
              action,
              payload,
            });
          }},
        ]);
        break;
      case 'view_profile':
        if (payload?.userId) {
          navigation.navigate('UserProfile', { userId: payload.userId });
        }
        break;
      case 'view_hashtag':
        navigation.navigate('Search', { query: `#${payload?.hashtag}` });
        break;
      case 'open_link':
        if (payload?.url) {
          import('expo-linking').then((Linking) => {
            Linking.openURL(payload.url);
          });
        }
        break;
      default:
        break;
    }
  };

  if (!currentStory) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <GestureDetector gesture={combinedGesture}>
        <Animated.View style={[styles.container, animatedContainerStyle]}>
          <Pressable
            style={[
              styles.mediaContainer,
              currentStory.type === 'TEXT' && currentStory.backgroundColor ? {
                backgroundColor: currentStory.backgroundColor,
              } : null,
            ]}
            onPress={(e) => handleTap(e.nativeEvent.locationX)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            testID="story-media-container"
          >
            {isVideo ? (
              <Video
                ref={videoRef}
                source={{ uri: currentStory.mediaUrl }}
                style={styles.media}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={!isPaused}
                isLooping={false}
                onPlaybackStatusUpdate={handleVideoStatusUpdate}
              />
            ) : isVoice ? (
              <View style={styles.voiceStoryContainer}>
                {(currentStory.audioUrl || currentStory.mediaUrl) ? (
                  <Video
                    ref={videoRef}
                    source={{ uri: currentStory.audioUrl || currentStory.mediaUrl }}
                    style={{ width: 0, height: 0 }}
                    shouldPlay={!isPaused}
                    isLooping={false}
                    onPlaybackStatusUpdate={handleVideoStatusUpdate}
                  />
                ) : null}
                <View style={styles.voiceWaveformContainer}>
                  <Feather name="mic" size={80} color="#8B5CF6" />
                  <Text style={styles.voicePlayingText}>
                    {isPaused ? 'Paused' : 'Playing...'}
                  </Text>
                </View>
              </View>
            ) : currentStory.type === 'TEXT' ? null : (
              <Image
                source={{ uri: currentStory.mediaUrl }}
                style={styles.media}
                contentFit="contain"
              />
            )}
            
            {currentStory.stickers && currentStory.stickers.length > 0 ? (
              <View style={styles.stickersOverlay}>
                {currentStory.stickers.map((sticker) => (
                  <StickerRenderer
                    key={sticker.id}
                    sticker={{
                      ...sticker,
                      type: sticker.type as any,
                    }}
                    isOwner={isOwner}
                    onInteract={(stickerId, action, payload) => {
                      handleStickerInteraction(stickerId, action, payload);
                    }}
                  />
                ))}
              </View>
            ) : null}
          
            {currentStory.type === 'TEXT' && currentStory.textContent ? (
              <View 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  backgroundColor: 'transparent',
                }}
                pointerEvents="none"
              >
                <Text 
                  style={{
                    fontSize: 28,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontFamily: currentStory.fontFamily ? getFontFamily(currentStory.fontFamily) : undefined,
                    textShadowColor: 'rgba(0,0,0,0.5)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                    lineHeight: 40,
                  }}
                >
                  {currentStory.textContent}
                </Text>
              </View>
            ) : null}
          </Pressable>

          <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={styles.progressBarsContainer}>
              {currentUser?.stories.map((_, storyIdx) => (
                <View
                  key={storyIdx}
                  style={[
                    styles.progressBarBackground,
                    { flex: 1, marginHorizontal: 2 },
                  ]}
                >
                  <RNAnimated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width:
                          storyIdx < currentStoryIndex
                            ? "100%"
                            : storyIdx === currentStoryIndex
                            ? progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", "100%"],
                              })
                            : "0%",
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            <View style={styles.userInfo}>
              <Pressable
                onPress={() => navigation.navigate("UserProfile", { userId: storyOwnerId })}
                android_ripple={{ color: "rgba(255,255,255,0.1)" }}
                testID="button-view-user-profile"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Avatar uri={currentUser?.avatarUrl} size={36} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.userTextContainer,
                  {
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
                onPress={() => navigation.navigate("UserProfile", { userId: storyOwnerId })}
                android_ripple={{ color: "rgba(255,255,255,0.1)" }}
                testID="button-view-user-profile-text"
              >
                <ThemedText style={styles.username}>
                  {currentUser?.displayName || currentUser?.username}
                </ThemedText>
                <ThemedText style={styles.timestamp}>
                  {formatTimeAgo(currentStory.createdAt)}
                </ThemedText>
              </Pressable>
              <Pressable
                style={styles.closeButton}
                onPress={closeViewer}
                testID="close-viewer-button"
              >
                <Feather name="x" size={28} color="#FFF" />
              </Pressable>
            </View>
          </View>

          {currentStory.caption ? (
            <View
              style={[styles.captionContainer, { paddingBottom: insets.bottom + Spacing.xl }]}
            >
              <ThemedText style={styles.caption}>{currentStory.caption}</ThemedText>
            </View>
          ) : null}

          {currentStory.musicUrl && currentStory.musicTitle && currentStory.musicArtist ? (
            <View 
              style={[
                styles.musicOverlayContainer, 
                { 
                  bottom: insets.bottom + Spacing.xl + (isOwner ? 0 : 70) + (currentStory.caption ? 60 : 0),
                  left: Spacing.lg,
                }
              ]}
            >
              <MusicOverlay
                title={currentStory.musicTitle}
                artist={currentStory.musicArtist}
                isPlaying={isMusicPlaying}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  pauseProgress();
                  pauseMusicPlayback();
                  setShowSongDetails(true);
                }}
              />
            </View>
          ) : null}

          {isOwner && currentStory.viewsCount !== undefined ? (
            <View 
              style={[
                styles.viewersButtonContainer, 
                { bottom: insets.bottom + Spacing.xl + 70 + (currentStory.caption ? 60 : 0) }
              ]}
            >
              <Animated.View style={[styles.viewersExpandablePanel, viewersPanelAnimatedStyle]}>
                {Platform.OS === "ios" ? (
                  <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
                    <View style={styles.panelBlurOverlay} />
                  </BlurView>
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.panelAndroidBackground]} />
                )}
                <View style={styles.panelHandle} />
                <View style={styles.panelHeader}>
                  <ThemedText style={styles.panelTitle}>Viewers</ThemedText>
                </View>
                <View style={styles.panelContent}>
                  {viewersLoading ? (
                    <View style={styles.panelLoading}>
                      <LoadingIndicator size="small" />
                    </View>
                  ) : viewers && viewers.length > 0 ? (
                    <ScrollView 
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.panelViewersList}
                      scrollIndicatorInsets={{ bottom: insets.bottom }}
                    >
                      {viewers.map((item) => (
                        <Pressable
                          key={item.id}
                          style={({ pressed }) => [
                            styles.panelViewerItem,
                            pressed && styles.panelViewerItemPressed,
                          ]}
                          onPress={() => handleViewerPress(item.id)}
                          testID={`button-viewer-${item.id}`}
                        >
                          <Avatar uri={item.avatarUrl} size={32} />
                          <View style={styles.panelViewerInfo}>
                            <ThemedText style={styles.panelViewerName} numberOfLines={1}>
                              {item.displayName || item.username}
                            </ThemedText>
                            <ThemedText style={styles.panelViewerTime}>
                              {formatViewedTimeAgo(item.viewedAt)}
                            </ThemedText>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : (
                    <View style={styles.panelEmpty}>
                      <Feather name="eye-off" size={24} color="rgba(255,255,255,0.3)" />
                      <ThemedText style={styles.panelEmptyText}>No viewers yet</ThemedText>
                    </View>
                  )}
                </View>
              </Animated.View>
              
              <Pressable
                style={({ pressed }) => [
                  styles.viewsContainer,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleToggleViewersPanel}
                testID="button-view-story-viewers"
              >
                <Feather name="eye" size={16} color="#FFF" />
                <ThemedText style={styles.viewsText}>
                  {currentStory.viewsCount} {currentStory.viewsCount === 1 ? "view" : "views"}
                </ThemedText>
                <Feather 
                  name={showViewersPanel ? "chevron-down" : "chevron-up"} 
                  size={14} 
                  color="rgba(255,255,255,0.6)" 
                  style={{ marginLeft: 4 }} 
                />
              </Pressable>
            </View>
          ) : null}

          {!isOwner ? (
            <KeyboardAvoidingView
              style={[styles.replyContainer, { paddingBottom: insets.bottom + Spacing.sm }]}
              behavior="padding"
              keyboardVerticalOffset={0}
            >
              <View style={styles.replyInputWrapper}>
                <TextInput
                  ref={inputRef}
                  style={styles.replyInput}
                  placeholder={`Reply to ${currentStory.user?.displayName || currentStory.user?.username || "this story"}...`}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={replyText}
                  onChangeText={setReplyText}
                  onFocus={handleReplyFocus}
                  onBlur={handleReplyBlur}
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSendReply}
                  testID="input-story-reply"
                />
                <Pressable
                  style={[
                    styles.sendButton,
                    (!replyText.trim() || replyMutation.isPending) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  testID="button-send-story-reply"
                >
                  {replyMutation.isPending ? (
                    <LoadingIndicator size="small" />
                  ) : (
                    <Feather name="send" size={18} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          ) : null}

        </Animated.View>
      </GestureDetector>
      
      <SongDetailsModal
        visible={showSongDetails}
        onClose={() => {
          setShowSongDetails(false);
          resumeProgress();
          resumeMusicPlayback();
        }}
        title={currentStory?.musicTitle || ""}
        artist={currentStory?.musicArtist || ""}
        duration={currentStory?.musicDuration}
        isPlaying={false}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  textStoryOverlay: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  textStoryContent: {
    fontSize: 28,
    color: "#FFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  stickersOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  voiceStoryContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  voiceWaveformContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    borderRadius: 100,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  voicePlayingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  progressBarsContainer: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  progressBarBackground: {
    height: PROGRESS_BAR_HEIGHT,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  username: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  timestamp: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  captionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  caption: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 22,
  },
  musicOverlayContainer: {
    position: "absolute",
    zIndex: 15,
  },
  viewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  viewsText: {
    color: "#FFF",
    fontSize: 14,
  },
  replyContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  replyInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 22,
    paddingHorizontal: Spacing.lg,
    color: "#FFFFFF",
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  viewersButtonContainer: {
    position: "absolute",
    left: Spacing.lg,
  },
  viewersExpandablePanel: {
    position: "absolute",
    bottom: 48,
    left: 0,
    width: 260,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.25)",
  },
  panelBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 20, 30, 0.90)",
  },
  panelAndroidBackground: {
    backgroundColor: "rgba(20, 20, 30, 0.98)",
  },
  panelHandle: {
    width: 32,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
  },
  panelHeader: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.15)",
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  panelContent: {
    flex: 1,
  },
  panelLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  panelViewersList: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  panelViewerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  panelViewerItemPressed: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  panelViewerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  panelViewerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  panelViewerTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 1,
  },
  panelEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  panelEmptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
});
