import React, { useEffect, useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type Season = "winter" | "spring" | "summer" | "fall" | "valentine" | "halloween" | "christmas" | "none";

interface SeasonalDecorationsProps {
  season: Season;
  intensity?: "light" | "medium" | "heavy";
  enabled?: boolean;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

const SEASON_CONFIG = {
  winter: { icon: "snow", colors: ["#FFFFFF", "#E3F2FD", "#BBDEFB"], count: 30 },
  spring: { icon: "flower", colors: ["#F8BBD9", "#F48FB1", "#E91E63"], count: 20 },
  summer: { icon: "sunny", colors: ["#FFF59D", "#FFEE58", "#FFD54F"], count: 15 },
  fall: { icon: "leaf", colors: ["#FF8A65", "#FF7043", "#F4511E"], count: 25 },
  valentine: { icon: "heart", colors: ["#FF4081", "#F50057", "#C51162"], count: 20 },
  halloween: { icon: "skull", colors: ["#FF6F00", "#E65100", "#9C27B0"], count: 15 },
  christmas: { icon: "gift", colors: ["#F44336", "#4CAF50", "#FFD700"], count: 25 },
  none: { icon: "", colors: [], count: 0 },
};

const INTENSITY_MULTIPLIER = {
  light: 0.5,
  medium: 1,
  heavy: 1.5,
};

function SeasonalParticle({ particle, season }: { particle: Particle; season: Season }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  const config = SEASON_CONFIG[season];

  useEffect(() => {
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + 50, {
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
        withTiming(Math.random() > 0.5 ? 30 : -30, {
          duration: particle.duration / 3,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(360, {
          duration: particle.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      particle.delay,
      withTiming(1, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: interpolate(
      translateY.value,
      [-50, 0, SCREEN_HEIGHT, SCREEN_HEIGHT + 50],
      [0, opacity.value, opacity.value, 0]
    ),
  }));

  const color = config.colors[Math.floor(Math.random() * config.colors.length)];

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: -50,
        },
        animatedStyle,
      ]}
    >
      <Ionicons
        name={config.icon as any}
        size={particle.size}
        color={color}
      />
    </Animated.View>
  );
}

export default function SeasonalDecorations({
  season,
  intensity = "medium",
  enabled = true,
}: SeasonalDecorationsProps) {
  const config = SEASON_CONFIG[season];
  const multiplier = INTENSITY_MULTIPLIER[intensity];

  const particles = useMemo(() => {
    if (!enabled || season === "none") return [];
    
    const count = Math.round(config.count * multiplier);
    const result: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      result.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        delay: Math.random() * 5000,
        duration: 6000 + Math.random() * 6000,
        size: 12 + Math.random() * 12,
        rotation: Math.random() * 360,
      });
    }
    
    return result;
  }, [season, intensity, enabled]);

  if (!enabled || season === "none" || particles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <SeasonalParticle key={particle.id} particle={particle} season={season} />
      ))}
    </View>
  );
}

export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  const day = new Date().getDate();

  if (month === 1 && day >= 10 && day <= 14) return "valentine";
  if (month === 9 && day >= 20 && day <= 31) return "halloween";
  if (month === 11 && day >= 15) return "christmas";
  if (month === 0 && day <= 5) return "christmas";
  
  if (month >= 11 || month <= 1) return "winter";
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  return "fall";
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: 9998,
  },
  particle: {
    position: "absolute",
  },
});
