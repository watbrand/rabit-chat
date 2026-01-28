import React, { useCallback } from "react";
import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { Animation } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PinchToZoomProps {
  imageUrl: string;
  width?: number;
  height?: number;
  minScale?: number;
  maxScale?: number;
  onZoomStart?: () => void;
  onZoomEnd?: () => void;
}

export default function PinchToZoom({
  imageUrl,
  width = SCREEN_WIDTH,
  height = SCREEN_WIDTH,
  minScale = 1,
  maxScale = 4,
  onZoomStart,
  onZoomEnd,
}: PinchToZoomProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const handleZoomStart = useCallback(() => {
    onZoomStart?.();
  }, [onZoomStart]);

  const handleZoomEnd = useCallback(() => {
    onZoomEnd?.();
  }, [onZoomEnd]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(handleZoomStart)();
    })
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, minScale), maxScale);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withSpring(1, Animation.springBouncy);
        savedScale.value = 1;
        translateX.value = withSpring(0, Animation.spring);
        translateY.value = withSpring(0, Animation.spring);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      runOnJS(handleZoomEnd)();
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1) {
        const maxTranslateX = ((scale.value - 1) * width) / 2;
        const maxTranslateY = ((scale.value - 1) * height) / 2;

        translateX.value = Math.min(
          Math.max(savedTranslateX.value + event.translationX, -maxTranslateX),
          maxTranslateX
        );
        translateY.value = Math.min(
          Math.max(savedTranslateY.value + event.translationY, -maxTranslateY),
          maxTranslateY
        );
      }
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        translateX.value = withSpring(0, Animation.spring);
        translateY.value = withSpring(0, Animation.spring);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        scale.value = withSpring(1, Animation.springBouncy);
        savedScale.value = 1;
        translateX.value = withSpring(0, Animation.spring);
        translateY.value = withSpring(0, Animation.spring);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const targetScale = 2.5;
        const offsetX = (width / 2 - event.x) * (targetScale - 1);
        const offsetY = (height / 2 - event.y) * (targetScale - 1);
        
        scale.value = withSpring(targetScale, Animation.springBouncy);
        savedScale.value = targetScale;
        translateX.value = withSpring(offsetX, Animation.spring);
        translateY.value = withSpring(offsetY, Animation.spring);
        savedTranslateX.value = offsetX;
        savedTranslateY.value = offsetY;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, { width, height }, animatedStyle]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
