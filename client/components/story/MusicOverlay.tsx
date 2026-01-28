import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface MusicOverlayProps {
  title: string;
  artist: string;
  onPress?: () => void;
  isPlaying?: boolean;
}

const AnimatedBar = ({ delay, isPlaying }: { delay: number; isPlaying: boolean }) => {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isPlaying) {
      height.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(16, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(4, { duration: 300, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(4, { duration: 200 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.equalizerBar, animatedStyle]} />;
};

export default function MusicOverlay({
  title,
  artist,
  onPress,
  isPlaying = false,
}: MusicOverlayProps) {
  const { theme } = useTheme();
  const pulseScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      iconRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      iconRotation.value = withTiming(iconRotation.value, { duration: 0 });
    }
  }, [isPlaying]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotation.value}deg` }],
  }));

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const displayTitle = title.length > 22 ? title.substring(0, 20) + "..." : title;
  const displayArtist = artist.length > 18 ? artist.substring(0, 16) + "..." : artist;

  return (
    <Animated.View style={[styles.wrapper, containerAnimatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.containerPressed,
        ]}
        testID="music-overlay-button"
      >
        {Platform.OS === "ios" ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.blurOverlay} />
          </BlurView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
        )}
        
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <View style={styles.iconCircle}>
              <Feather name="music" size={14} color="#FFFFFF" />
            </View>
          </Animated.View>
          
          <View style={styles.textContainer}>
            <ThemedText style={styles.title} numberOfLines={1}>
              {displayTitle}
            </ThemedText>
            <ThemedText style={styles.artist} numberOfLines={1}>
              {displayArtist}
            </ThemedText>
          </View>
          
          <View style={styles.equalizerContainer}>
            <AnimatedBar delay={0} isPlaying={isPlaying} />
            <AnimatedBar delay={100} isPlaying={isPlaying} />
            <AnimatedBar delay={200} isPlaying={isPlaying} />
            <AnimatedBar delay={50} isPlaying={isPlaying} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  containerPressed: {
    opacity: 0.8,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  androidBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(139, 92, 246, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.8)",
  },
  textContainer: {
    flex: 1,
    maxWidth: 140,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
  artist: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    lineHeight: 14,
  },
  equalizerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 20,
    gap: 2,
    paddingLeft: Spacing.xs,
  },
  equalizerBar: {
    width: 3,
    backgroundColor: "#8B5CF6",
    borderRadius: 1.5,
  },
});
