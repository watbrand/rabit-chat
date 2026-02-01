import React, { useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View, Dimensions, Platform, Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Haptics from "@/lib/safeHaptics";
import { Animation, BorderRadius, Spacing } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface BottomSheetRef {
  open: () => void;
  close: () => void;
  snapTo: (height: number) => void;
}

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
  onClose?: () => void;
  enableBackdrop?: boolean;
  title?: string;
}

const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(({
  children,
  snapPoints = [0.25, 0.5, 0.9],
  initialSnap = 0,
  onClose,
  enableBackdrop = true,
  title,
}, ref) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const context = useSharedValue({ y: 0 });
  const isOpen = useSharedValue(false);

  const maxHeight = SCREEN_HEIGHT * snapPoints[snapPoints.length - 1];
  const minHeight = SCREEN_HEIGHT * snapPoints[0];

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const open = useCallback(() => {
    triggerHaptic();
    isOpen.value = true;
    translateY.value = withSpring(
      SCREEN_HEIGHT - SCREEN_HEIGHT * snapPoints[initialSnap],
      Animation.springBouncy
    );
  }, [initialSnap, snapPoints, triggerHaptic]);

  const close = useCallback(() => {
    triggerHaptic();
    isOpen.value = false;
    translateY.value = withSpring(SCREEN_HEIGHT, Animation.spring);
    onClose?.();
  }, [onClose, triggerHaptic]);

  const snapTo = useCallback((height: number) => {
    triggerHaptic();
    translateY.value = withSpring(SCREEN_HEIGHT - height, Animation.springBouncy);
  }, [triggerHaptic]);

  useImperativeHandle(ref, () => ({
    open,
    close,
    snapTo,
  }));

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = Math.max(
        context.value.y + event.translationY,
        SCREEN_HEIGHT - maxHeight
      );
    })
    .onEnd((event) => {
      const velocity = event.velocityY;
      const currentHeight = SCREEN_HEIGHT - translateY.value;
      
      if (velocity > 500 || currentHeight < minHeight / 2) {
        runOnJS(close)();
        return;
      }

      let closestSnap = snapPoints[0];
      let minDiff = Math.abs(currentHeight - SCREEN_HEIGHT * snapPoints[0]);

      for (const snap of snapPoints) {
        const diff = Math.abs(currentHeight - SCREEN_HEIGHT * snap);
        if (diff < minDiff) {
          minDiff = diff;
          closestSnap = snap;
        }
      }

      translateY.value = withSpring(
        SCREEN_HEIGHT - SCREEN_HEIGHT * closestSnap,
        Animation.springBouncy
      );
      runOnJS(triggerHaptic)();
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [SCREEN_HEIGHT, SCREEN_HEIGHT - maxHeight],
      [0, 0.6],
      Extrapolation.CLAMP
    );
    return {
      opacity,
      pointerEvents: isOpen.value ? "auto" : "none",
    };
  });

  return (
    <>
      {enableBackdrop ? (
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>
      ) : null}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, { height: maxHeight + insets.bottom }, sheetStyle]}>
          {Platform.OS === "ios" ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.blurOverlay} />
            </BlurView>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
          )}
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          ) : null}
          <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.md }]}>
            {children}
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
});

export default BottomSheet;

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 999,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
    zIndex: 1000,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 20, 30, 0.8)",
  },
  androidBackground: {
    backgroundColor: "rgba(20, 20, 30, 0.98)",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
