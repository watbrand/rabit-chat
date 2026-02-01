import React, { useCallback } from "react";
import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";
import { Platform } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

interface DoubleTapHeartProps {
  children: React.ReactNode;
  onDoubleTap?: () => void;
  isLiked?: boolean;
  disabled?: boolean;
}

export default function DoubleTapHeart({
  children,
  onDoubleTap,
  isLiked = false,
  disabled = false,
}: DoubleTapHeartProps) {
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleDoubleTap = useCallback(() => {
    if (disabled) return;

    triggerHaptic();

    heartScale.value = 0;
    heartOpacity.value = 1;

    heartScale.value = withSequence(
      withSpring(1.2, { damping: 6, stiffness: 200 }),
      withSpring(1, { damping: 8 }),
      withDelay(400, withSpring(0, { damping: 15 }))
    );

    heartOpacity.value = withDelay(500, withSpring(0, { damping: 15 }));

    if (onDoubleTap && !isLiked) {
      onDoubleTap();
    }
  }, [disabled, isLiked, onDoubleTap, triggerHaptic]);

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  return (
    <GestureDetector gesture={doubleTapGesture}>
      <View style={styles.container}>
        {children}
        <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
          <Ionicons name="heart" size={80} color="#FF3B5C" />
          <View style={styles.heartGlow} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  heartContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  heartGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 59, 92, 0.3)",
    ...Platform.select({
      ios: {
        shadowColor: "#FF3B5C",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 30,
      },
    }),
  },
});
