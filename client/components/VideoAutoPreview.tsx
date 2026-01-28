import React, { useRef, useCallback, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  ViewStyle,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { useVideoPlayer, VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Gradients, Animation, BorderRadius, Spacing, Colors } from "@/constants/theme";
import { ThemedText } from "./ThemedText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface VideoAutoPreviewProps {
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  viewCount?: number;
  isVisible?: boolean;
  muted?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  aspectRatio?: number;
}

export default function VideoAutoPreview({
  videoUrl,
  thumbnailUrl,
  duration = 0,
  viewCount = 0,
  isVisible = false,
  muted = true,
  onPress,
  style,
  aspectRatio = 4 / 5,
}: VideoAutoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const playProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    if (isVisible && player) {
      const timer = setTimeout(() => {
        player.play();
        setIsPlaying(true);
        setShowControls(false);
        
        playProgress.value = withRepeat(
          withTiming(1, { duration: 3000, easing: Easing.linear }),
          -1,
          false
        );
      }, 500);
      return () => clearTimeout(timer);
    } else if (!isVisible && player) {
      try {
        player.pause();
      } catch (error) {
        // Player native module may not be ready, ignore
      }
      setIsPlaying(false);
      setShowControls(true);
      playProgress.value = 0;
    }
  }, [isVisible, player]);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${playProgress.value * 100}%`,
  }));

  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.2], [0.6, 1]),
  }));

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      try {
        if (isPlaying) {
          player.pause();
          setIsPlaying(false);
          setShowControls(true);
        } else {
          player.play();
          setIsPlaying(true);
          setShowControls(false);
        }
      } catch (error) {
        // Player native module may not be ready, ignore
      }
    }
  };

  return (
    <Pressable onPress={handlePress} style={[styles.container, style]}>
      <View style={[styles.videoContainer, { aspectRatio }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />

        {showControls && (
          <View style={styles.overlay}>
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.playButton, playButtonAnimatedStyle]}>
              <BlurView intensity={30} style={styles.playButtonBlur}>
                <LinearGradient
                  colors={[...Gradients.primary]}
                  style={styles.playButtonGradient}
                >
                  <Ionicons name="play" size={28} color="#FFFFFF" />
                </LinearGradient>
              </BlurView>
            </Animated.View>
          </View>
        )}

        <View style={styles.bottomBar}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]}>
              <LinearGradient
                colors={[...Gradients.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <ThemedText style={styles.durationText}>
                {formatDuration(duration)}
              </ThemedText>
            </View>

            {viewCount > 0 && (
              <View style={styles.viewsBadge}>
                <Ionicons name="eye-outline" size={12} color="#FFFFFF" />
                <ThemedText style={styles.viewsText}>
                  {formatViewCount(viewCount)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {muted && isPlaying && (
          <View style={styles.mutedBadge}>
            <Ionicons name="volume-mute" size={14} color="#FFFFFF" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  videoContainer: {
    width: "100%",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  playButtonBlur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressBar: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 1.5,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.sm,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  viewsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  viewsText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  mutedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
});
