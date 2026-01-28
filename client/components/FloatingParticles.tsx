import React, { useEffect, useMemo } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
  color: string;
}

interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
}

function ParticleComponent({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(-SCREEN_HEIGHT - 50, {
          duration: particle.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    translateX.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(Math.random() > 0.5 ? 50 : -50, {
          duration: particle.duration / 2,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(particle.opacity, { duration: 1000 }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: interpolate(
      translateY.value,
      [-SCREEN_HEIGHT, -SCREEN_HEIGHT * 0.8, -100, 0],
      [0, opacity.value, opacity.value, 0]
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function FloatingParticles({
  count = 20,
  colors = ["rgba(139, 92, 246, 0.4)", "rgba(168, 85, 247, 0.3)", "rgba(192, 132, 252, 0.2)"],
  minSize = 2,
  maxSize = 6,
}: FloatingParticlesProps) {
  const particles = useMemo(() => {
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: SCREEN_HEIGHT + Math.random() * 100,
        size: minSize + Math.random() * (maxSize - minSize),
        delay: Math.random() * 5000,
        duration: 8000 + Math.random() * 8000,
        opacity: 0.2 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return result;
  }, [count, colors, minSize, maxSize]);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <ParticleComponent key={particle.id} particle={particle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 0,
  },
  particle: {
    position: "absolute",
  },
});
