import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  SlideInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SongDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  isPlaying?: boolean;
}

const AnimatedBar = ({ delay, isPlaying }: { delay: number; isPlaying: boolean }) => {
  const height = useSharedValue(6);

  React.useEffect(() => {
    if (isPlaying) {
      height.value = withRepeat(
        withTiming(24, { duration: 400 + delay * 100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      height.value = withTiming(6, { duration: 200 });
    }
  }, [isPlaying, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
};

export default function SongDetailsModal({
  visible,
  onClose,
  title,
  artist,
  album,
  duration,
  isPlaying = false,
}: SongDetailsModalProps) {
  const { theme, isDark } = useTheme();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearchSong = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const query = encodeURIComponent(`${title} ${artist}`);
    const spotifyUrl = `https://open.spotify.com/search/${query}`;
    const appleMusicUrl = `https://music.apple.com/search?term=${query}`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${query}`;
    
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL(appleMusicUrl);
      } else {
        await Linking.openURL(youtubeUrl);
      }
    } catch {
      await Linking.openURL(spotifyUrl);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(15)}
          style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        >
          <View style={styles.handle} />
          
          <View style={styles.albumArtContainer}>
            {Platform.OS === "ios" ? (
              <BlurView intensity={40} style={styles.albumArt}>
                <View style={styles.albumArtInner}>
                  <View style={styles.equalizerBars}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <AnimatedBar key={i} delay={i} isPlaying={isPlaying} />
                    ))}
                  </View>
                  <Feather name="music" size={40} color={theme.primary} />
                </View>
              </BlurView>
            ) : (
              <View style={[styles.albumArt, { backgroundColor: theme.glassBackground }]}>
                <View style={styles.albumArtInner}>
                  <View style={styles.equalizerBars}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <AnimatedBar key={i} delay={i} isPlaying={isPlaying} />
                    ))}
                  </View>
                  <Feather name="music" size={40} color={theme.primary} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.songInfo}>
            <ThemedText style={styles.title} numberOfLines={2}>
              {title}
            </ThemedText>
            <ThemedText style={[styles.artist, { color: theme.textSecondary }]}>
              {artist}
            </ThemedText>
            {album ? (
              <ThemedText style={[styles.album, { color: theme.textSecondary }]}>
                {album}
              </ThemedText>
            ) : null}
            {duration ? (
              <ThemedText style={[styles.duration, { color: theme.textSecondary }]}>
                {formatDuration(duration)}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleSearchSong}
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="external-link" size={20} color="#fff" />
              <ThemedText style={styles.actionButtonText}>
                Find Full Song
              </ThemedText>
            </Pressable>
          </View>

          <Pressable onPress={handleClose} style={styles.closeButton}>
            <ThemedText style={[styles.closeText, { color: theme.textSecondary }]}>
              Close
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  albumArtContainer: {
    marginBottom: Spacing.lg,
  },
  albumArt: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  albumArtInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  equalizerBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: Spacing.sm,
    height: 30,
  },
  bar: {
    width: 4,
    backgroundColor: "#8B5CF6",
    borderRadius: 2,
  },
  songInfo: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  artist: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  album: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  duration: {
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    paddingVertical: Spacing.sm,
  },
  closeText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
