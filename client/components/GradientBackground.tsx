import React, { useEffect, useMemo } from "react";
import { StyleSheet, View, Dimensions, ViewStyle, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Gradients } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GradientOrbProps {
  color: string;
  size: number;
  initialX: number;
  initialY: number;
  animationDuration?: number;
  delay?: number;
}

function GradientOrb({ 
  color, 
  size, 
  initialX, 
  initialY, 
  animationDuration = 8000,
  delay = 0,
}: GradientOrbProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const timeout = setTimeout(() => {
      progress.value = withRepeat(
        withTiming(1, { duration: animationDuration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: animationDuration / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: animationDuration / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 0.5, 1], [0, 30, 0]);
    const translateY = interpolate(progress.value, [0, 0.5, 1], [0, -25, 0]);
    
    return {
      transform: [
        { translateX },
        { translateY },
        { scale: scale.value },
      ],
      opacity: interpolate(scale.value, [0.9, 1, 1.1], [0.6, 0.8, 0.7]),
    };
  });

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          left: initialX,
          top: initialY,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

interface GradientBackgroundProps {
  variant?: "mesh" | "orbs" | "subtle" | "intense";
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function GradientBackground({ 
  variant = "orbs", 
  children,
  style,
}: GradientBackgroundProps) {
  const { theme, isDark } = useTheme();

  if (!isDark) {
    return (
      <View style={[styles.container, style]}>
        <LinearGradient
          colors={Gradients.lightBackgroundSoft}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <GradientOrb
          color="rgba(139, 92, 246, 0.25)"
          size={300}
          initialX={-80}
          initialY={-50}
          animationDuration={12000}
        />
        <GradientOrb
          color="rgba(236, 72, 153, 0.18)"
          size={250}
          initialX={SCREEN_WIDTH - 80}
          initialY={SCREEN_HEIGHT * 0.2}
          animationDuration={14000}
          delay={500}
        />
        <GradientOrb
          color="rgba(147, 197, 253, 0.22)"
          size={200}
          initialX={SCREEN_WIDTH * 0.4}
          initialY={SCREEN_HEIGHT * 0.6}
          animationDuration={11000}
          delay={1000}
        />
        {children}
      </View>
    );
  }

  if (variant === "subtle") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }, style]}>
        <View style={[styles.subtleGlow, { backgroundColor: theme.ambientPurple }]} />
        {children}
      </View>
    );
  }

  if (variant === "mesh") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }, style]}>
        <LinearGradient
          colors={["transparent", "rgba(139, 92, 246, 0.08)", "transparent"]}
          style={styles.meshGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <GradientOrb
          color="rgba(139, 92, 246, 0.25)"
          size={280}
          initialX={-80}
          initialY={SCREEN_HEIGHT * 0.1}
          animationDuration={10000}
        />
        <GradientOrb
          color="rgba(236, 72, 153, 0.20)"
          size={220}
          initialX={SCREEN_WIDTH - 120}
          initialY={SCREEN_HEIGHT * 0.35}
          animationDuration={12000}
          delay={500}
        />
        <GradientOrb
          color="rgba(20, 184, 166, 0.18)"
          size={180}
          initialX={SCREEN_WIDTH * 0.3}
          initialY={SCREEN_HEIGHT * 0.65}
          animationDuration={9000}
          delay={1000}
        />
        {children}
      </View>
    );
  }

  if (variant === "intense") {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }, style]}>
        <LinearGradient
          colors={["rgba(139, 92, 246, 0.12)", "transparent", "rgba(236, 72, 153, 0.08)"]}
          style={styles.meshGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <GradientOrb
          color="rgba(139, 92, 246, 0.35)"
          size={320}
          initialX={-100}
          initialY={SCREEN_HEIGHT * 0.05}
          animationDuration={8000}
        />
        <GradientOrb
          color="rgba(236, 72, 153, 0.28)"
          size={260}
          initialX={SCREEN_WIDTH - 100}
          initialY={SCREEN_HEIGHT * 0.25}
          animationDuration={10000}
          delay={300}
        />
        <GradientOrb
          color="rgba(20, 184, 166, 0.25)"
          size={220}
          initialX={SCREEN_WIDTH * 0.2}
          initialY={SCREEN_HEIGHT * 0.55}
          animationDuration={11000}
          delay={600}
        />
        <GradientOrb
          color="rgba(245, 158, 11, 0.18)"
          size={180}
          initialX={SCREEN_WIDTH * 0.6}
          initialY={SCREEN_HEIGHT * 0.75}
          animationDuration={9000}
          delay={900}
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }, style]}>
      <GradientOrb
        color="rgba(139, 92, 246, 0.30)"
        size={250}
        initialX={-60}
        initialY={SCREEN_HEIGHT * 0.15}
        animationDuration={9000}
      />
      <GradientOrb
        color="rgba(236, 72, 153, 0.22)"
        size={200}
        initialX={SCREEN_WIDTH - 100}
        initialY={SCREEN_HEIGHT * 0.4}
        animationDuration={11000}
        delay={400}
      />
      <GradientOrb
        color="rgba(20, 184, 166, 0.20)"
        size={160}
        initialX={SCREEN_WIDTH * 0.35}
        initialY={SCREEN_HEIGHT * 0.7}
        animationDuration={10000}
        delay={800}
      />
      {children}
    </View>
  );
}

export function GradientMeshOverlay({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <View style={styles.meshOverlay} pointerEvents="none">
      <LinearGradient
        colors={[
          `rgba(139, 92, 246, ${opacity})`,
          "transparent",
          `rgba(236, 72, 153, ${opacity * 0.7})`,
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.7,
  },
  subtleGlow: {
    position: "absolute",
    top: -100,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  meshGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  meshOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});
