import React, { useCallback } from "react";
import { StyleSheet, View, Text, Dimensions, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Haptics from "@/lib/safeHaptics";
import { Animation, Gradients } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;

interface SwipeablePostProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: string;
  rightIcon?: string;
  leftColor?: string;
  rightColor?: string;
  enabled?: boolean;
}

export default function SwipeablePost({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "Save",
  rightLabel = "Like",
  leftIcon = "bookmark",
  rightIcon = "heart",
  leftColor = "#00D4AA",
  rightColor = "#FF3B5C",
  enabled = true,
}: SwipeablePostProps) {
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleSwipeComplete = useCallback((direction: "left" | "right") => {
    if (direction === "left" && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === "right" && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      translateX.value = event.translationX;

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      } else if (Math.abs(event.translationX) < SWIPE_THRESHOLD) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD && onSwipeRight) {
        runOnJS(handleSwipeComplete)("right");
      } else if (event.translationX < -SWIPE_THRESHOLD && onSwipeLeft) {
        runOnJS(handleSwipeComplete)("left");
      }
      translateX.value = withSpring(0, Animation.springBouncy);
      hasTriggeredHaptic.value = false;
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.3 }],
  }));

  const leftActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 1.5],
      [0.5, 1, 1.2],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.5],
      [0.5, 1, 1.2],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.actionsContainer}>
        <Animated.View style={[styles.actionLeft, leftActionStyle]}>
          <View style={[styles.actionIcon, { backgroundColor: leftColor }]}>
            <Ionicons name={leftIcon as any} size={24} color="#FFFFFF" />
          </View>
          <Text style={[styles.actionLabel, { color: leftColor }]}>{leftLabel}</Text>
        </Animated.View>
        <Animated.View style={[styles.actionRight, rightActionStyle]}>
          <View style={[styles.actionIcon, { backgroundColor: rightColor }]}>
            <Ionicons name={rightIcon as any} size={24} color="#FFFFFF" />
          </View>
          <Text style={[styles.actionLabel, { color: rightColor }]}>{rightLabel}</Text>
        </Animated.View>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={contentStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  actionLeft: {
    alignItems: "center",
    gap: 4,
  },
  actionRight: {
    alignItems: "center",
    gap: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});
