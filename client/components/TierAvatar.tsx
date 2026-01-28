import React, { useEffect } from "react";
import { StyleSheet, View, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Gradients } from "@/constants/theme";

type Tier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

interface TierAvatarProps {
  imageUrl?: string | null;
  size?: number;
  tier?: Tier;
  showAnimation?: boolean;
  netWorth?: number;
}

const TIER_GRADIENTS: Record<Tier, string[]> = {
  bronze: ["#CD7F32", "#A0522D", "#CD7F32"],
  silver: ["#C0C0C0", "#808080", "#C0C0C0"],
  gold: ["#FFD700", "#FFA500", "#FFD700"],
  platinum: ["#E5E4E2", "#A0A0A0", "#E5E4E2"],
  diamond: ["#00D4FF", "#A855F7", "#FF6B6B", "#00D4FF"],
};

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 100000,
  gold: 1000000,
  platinum: 10000000,
  diamond: 100000000,
};

function getTierFromNetWorth(netWorth: number): Tier {
  if (netWorth >= TIER_THRESHOLDS.diamond) return "diamond";
  if (netWorth >= TIER_THRESHOLDS.platinum) return "platinum";
  if (netWorth >= TIER_THRESHOLDS.gold) return "gold";
  if (netWorth >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export default function TierAvatar({
  imageUrl,
  size = 48,
  tier,
  showAnimation = true,
  netWorth,
}: TierAvatarProps) {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  const actualTier = tier || (netWorth !== undefined ? getTierFromNetWorth(netWorth) : "bronze");
  const isHighTier = actualTier === "gold" || actualTier === "platinum" || actualTier === "diamond";

  useEffect(() => {
    if (showAnimation && isHighTier) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [showAnimation, isHighTier]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const borderSize = size + 8;
  const colors = TIER_GRADIENTS[actualTier] as [string, string, ...string[]];

  return (
    <View style={[styles.container, { width: borderSize, height: borderSize }]}>
      {isHighTier ? (
        <Animated.View style={[styles.glow, { 
          width: borderSize + 10,
          height: borderSize + 10,
          borderRadius: (borderSize + 10) / 2,
          backgroundColor: colors[0],
          shadowColor: colors[0],
        }, glowStyle]} />
      ) : null}
      <Animated.View style={[styles.ringWrapper, { width: borderSize, height: borderSize }, ringAnimatedStyle]}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientRing, { width: borderSize, height: borderSize, borderRadius: borderSize / 2 }]}
        />
      </Animated.View>
      <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.avatar, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={["#2a2a3e", "#1a1a2e"]}
            style={[styles.avatar, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
      },
    }),
  },
  ringWrapper: {
    position: "absolute",
  },
  gradientRing: {
    padding: 3,
  },
  avatarContainer: {
    backgroundColor: "#0A0A0F",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    overflow: "hidden",
  },
});
