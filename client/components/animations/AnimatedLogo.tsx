import React, { useEffect } from "react";
import { View, StyleSheet, AccessibilityInfo } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { RabitLogo } from "./RabitLogo";
import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export type AnimationPreset = 
  | "pulse" 
  | "spin" 
  | "bounce" 
  | "shake" 
  | "float" 
  | "breathe"
  | "none";

interface AnimatedLogoProps {
  size?: number;
  preset?: AnimationPreset;
  variant?: "full" | "simple" | "minimal";
  showGlow?: boolean;
  speed?: "slow" | "normal" | "fast";
  color?: string;
}

const SPEED_MULTIPLIERS = {
  slow: 1.5,
  normal: 1,
  fast: 0.6,
};

export function AnimatedLogo({
  size = 80,
  preset = "pulse",
  variant = "simple",
  showGlow = true,
  speed = "normal",
  color,
}: AnimatedLogoProps) {
  const { theme } = useTheme();
  const speedMultiplier = SPEED_MULTIPLIERS[speed];
  
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const [reducedMotion, setReducedMotion] = React.useState(false);

  useEffect(() => {
    const checkReducedMotion = async () => {
      const isReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
      setReducedMotion(isReducedMotion);
    };
    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (isEnabled) => setReducedMotion(isEnabled)
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || preset === "none") {
      cancelAnimation(scale);
      cancelAnimation(rotation);
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      scale.value = 1;
      rotation.value = 0;
      translateY.value = 0;
      translateX.value = 0;
      return;
    }

    const baseDuration = 1000 * speedMultiplier;

    switch (preset) {
      case "pulse":
        scale.value = withRepeat(
          withSequence(
            withTiming(1.15, { duration: baseDuration, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: baseDuration, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.85, { duration: baseDuration }),
            withTiming(1, { duration: baseDuration })
          ),
          -1,
          false
        );
        break;

      case "spin":
        rotation.value = withRepeat(
          withTiming(360, { duration: baseDuration * 1.5, easing: Easing.linear }),
          -1,
          false
        );
        break;

      case "bounce":
        translateY.value = withRepeat(
          withSequence(
            withSpring(-15, { damping: 8, stiffness: 200 }),
            withSpring(0, { damping: 8, stiffness: 200 })
          ),
          -1,
          false
        );
        break;

      case "shake":
        translateX.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 80 }),
            withTiming(8, { duration: 80 }),
            withTiming(-6, { duration: 80 }),
            withTiming(6, { duration: 80 }),
            withTiming(-4, { duration: 80 }),
            withTiming(4, { duration: 80 }),
            withTiming(0, { duration: 80 }),
            withDelay(800, withTiming(0, { duration: 0 }))
          ),
          -1,
          false
        );
        break;

      case "float":
        translateY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: baseDuration * 1.5, easing: Easing.inOut(Easing.sin) }),
            withTiming(10, { duration: baseDuration * 1.5, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        );
        rotation.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: baseDuration * 2, easing: Easing.inOut(Easing.ease) }),
            withTiming(3, { duration: baseDuration * 2, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        break;

      case "breathe":
        scale.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: baseDuration * 1.5, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.95, { duration: baseDuration * 1.5, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        );
        break;
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(rotation);
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
    };
  }, [preset, speedMultiplier, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
        { translateY: translateY.value },
        { translateX: translateX.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <RabitLogo 
          size={size} 
          variant={variant} 
          showGlow={showGlow}
          color={color}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AnimatedLogo;
