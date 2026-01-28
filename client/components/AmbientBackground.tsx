import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AmbientBackgroundProps {
  children?: React.ReactNode;
  variant?: "default" | "intense" | "subtle";
  showGoldOrb?: boolean;
}

export function AmbientBackground({
  children,
  variant = "default",
  showGoldOrb = false,
}: AmbientBackgroundProps) {
  const { theme, isDark } = useTheme();

  const opacity = (() => {
    switch (variant) {
      case "intense":
        return isDark ? 0.25 : 0.15;
      case "subtle":
        return isDark ? 0.1 : 0.08;
      default:
        return isDark ? 0.18 : 0.12;
    }
  })();

  const purpleOrbColors = isDark
    ? ["rgba(139, 92, 246, 0)", `rgba(139, 92, 246, ${opacity})`]
    : ["rgba(139, 92, 246, 0)", `rgba(139, 92, 246, ${opacity * 0.6})`];

  const goldOrbColors = isDark
    ? ["rgba(212, 175, 55, 0)", `rgba(212, 175, 55, ${opacity * 0.6})`]
    : ["rgba(212, 175, 55, 0)", `rgba(212, 175, 55, ${opacity * 0.4})`];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.orbsContainer}>
        <LinearGradient
          colors={purpleOrbColors as [string, string]}
          style={[styles.orb, styles.orbTopRight]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0, y: 0 }}
        />
        <LinearGradient
          colors={purpleOrbColors as [string, string]}
          style={[styles.orb, styles.orbBottomLeft]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
        {showGoldOrb ? (
          <LinearGradient
            colors={goldOrbColors as [string, string]}
            style={[styles.orb, styles.orbCenter]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0, y: 1 }}
          />
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

interface AnimatedAmbientBackgroundProps extends AmbientBackgroundProps {
  animationEnabled?: boolean;
}

export function AnimatedAmbientBackground({
  children,
  variant = "default",
  showGoldOrb = false,
  animationEnabled = true,
}: AnimatedAmbientBackgroundProps) {
  const { theme, isDark } = useTheme();
  const translateX1 = useSharedValue(0);
  const translateY1 = useSharedValue(0);
  const translateX2 = useSharedValue(0);
  const translateY2 = useSharedValue(0);

  React.useEffect(() => {
    if (animationEnabled) {
      translateX1.value = withRepeat(
        withSequence(
          withTiming(30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      translateY1.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 10000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      translateX2.value = withRepeat(
        withSequence(
          withTiming(-25, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
          withTiming(25, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 9000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      translateY2.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-15, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 11000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [animationEnabled]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX1.value },
      { translateY: translateY1.value },
    ],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX2.value },
      { translateY: translateY2.value },
    ],
  }));

  const opacity = (() => {
    switch (variant) {
      case "intense":
        return isDark ? 0.25 : 0.15;
      case "subtle":
        return isDark ? 0.1 : 0.08;
      default:
        return isDark ? 0.18 : 0.12;
    }
  })();

  const purpleOrbColors = isDark
    ? ["rgba(139, 92, 246, 0)", `rgba(139, 92, 246, ${opacity})`]
    : ["rgba(139, 92, 246, 0)", `rgba(139, 92, 246, ${opacity * 0.6})`];

  const goldOrbColors = isDark
    ? ["rgba(212, 175, 55, 0)", `rgba(212, 175, 55, ${opacity * 0.6})`]
    : ["rgba(212, 175, 55, 0)", `rgba(212, 175, 55, ${opacity * 0.4})`];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.orbsContainer}>
        <Animated.View style={[styles.orb, styles.orbTopRight, animatedStyle1]}>
          <LinearGradient
            colors={purpleOrbColors as [string, string]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0, y: 0 }}
          />
        </Animated.View>
        <Animated.View style={[styles.orb, styles.orbBottomLeft, animatedStyle2]}>
          <LinearGradient
            colors={purpleOrbColors as [string, string]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        {showGoldOrb ? (
          <Animated.View style={[styles.orb, styles.orbCenter, animatedStyle1]}>
            <LinearGradient
              colors={goldOrbColors as [string, string]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0, y: 1 }}
            />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orbsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
  },
  orbTopRight: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    top: -SCREEN_WIDTH * 0.3,
    right: -SCREEN_WIDTH * 0.3,
  },
  orbBottomLeft: {
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    bottom: -SCREEN_WIDTH * 0.2,
    left: -SCREEN_WIDTH * 0.3,
  },
  orbCenter: {
    width: SCREEN_WIDTH * 0.5,
    height: SCREEN_WIDTH * 0.5,
    top: SCREEN_HEIGHT * 0.35,
    right: -SCREEN_WIDTH * 0.1,
  },
  content: {
    flex: 1,
  },
});
