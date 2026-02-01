import React, { useCallback } from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Haptics from "@/lib/safeHaptics";
import { Animation, BorderRadius } from "@/constants/theme";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  size?: "small" | "medium" | "large";
}

const SIZES = {
  small: { width: 48, height: 28, iconSize: 14, knobSize: 22 },
  medium: { width: 60, height: 32, iconSize: 16, knobSize: 26 },
  large: { width: 72, height: 40, iconSize: 20, knobSize: 34 },
};

export default function ThemeToggle({
  isDark,
  onToggle,
  size = "medium",
}: ThemeToggleProps) {
  const progress = useSharedValue(isDark ? 1 : 0);
  const scale = useSharedValue(1);
  const dimensions = SIZES[size];

  React.useEffect(() => {
    progress.value = withSpring(isDark ? 1 : 0, Animation.springBouncy);
  }, [isDark]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handlePress = useCallback(() => {
    triggerHaptic();
    onToggle();
  }, [onToggle, triggerHaptic]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, Animation.springBouncy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Animation.springBouncy);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#FDB813", "#1a1a2e"]
    );
    return { backgroundColor };
  });

  const knobStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [2, dimensions.width - dimensions.knobSize - 2]
    );

    const rotate = interpolate(progress.value, [0, 1], [0, 360]);

    return {
      transform: [{ translateX }, { rotate: `${rotate}deg` }],
    };
  });

  const sunOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0]),
  }));

  const moonOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.5, 1], [0, 1]),
  }));

  const starsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.3, 1], [0, 1]),
  }));

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View
          style={[
            styles.track,
            {
              width: dimensions.width,
              height: dimensions.height,
              borderRadius: dimensions.height / 2,
            },
            trackStyle,
          ]}
        >
          <Animated.View style={[styles.stars, starsStyle]}>
            <View style={[styles.star, { top: 6, left: 8 }]} />
            <View style={[styles.star, { top: 12, left: 16 }]} />
            <View style={[styles.star, { top: 4, left: 24 }]} />
          </Animated.View>
          <Animated.View
            style={[
              styles.knob,
              {
                width: dimensions.knobSize,
                height: dimensions.knobSize,
                borderRadius: dimensions.knobSize / 2,
              },
              knobStyle,
            ]}
          >
            <Animated.View style={[styles.iconContainer, sunOpacity]}>
              <Ionicons name="sunny" size={dimensions.iconSize} color="#FDB813" />
            </Animated.View>
            <Animated.View style={[styles.iconContainer, styles.moonIcon, moonOpacity]}>
              <Ionicons name="moon" size={dimensions.iconSize} color="#8B5CF6" />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  track: {
    justifyContent: "center",
    overflow: "hidden",
  },
  stars: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: "absolute",
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
  knob: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainer: {
    position: "absolute",
  },
  moonIcon: {
    position: "absolute",
  },
});
