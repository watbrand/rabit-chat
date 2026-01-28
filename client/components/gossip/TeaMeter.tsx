import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface TeaMeterProps {
  score: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

export function TeaMeter({ score, size = "medium", showLabel = false }: TeaMeterProps) {
  const { theme } = useTheme();
  
  const getTeaLevel = (score: number): { level: string; color: string; emoji: string } => {
    if (score >= 100) return { level: "LEGENDARY", color: "#FFD700", emoji: "🔥" };
    if (score >= 50) return { level: "HOT", color: "#FF6B35", emoji: "☕" };
    if (score >= 25) return { level: "WARM", color: "#F59E0B", emoji: "🫖" };
    if (score >= 10) return { level: "LUKEWARM", color: "#10B981", emoji: "🍵" };
    return { level: "COLD", color: "#6B7280", emoji: "🧊" };
  };
  
  const { level, color, emoji } = getTeaLevel(score);
  
  const iconSize = size === "small" ? 14 : size === "large" ? 24 : 18;
  const fontSize = size === "small" ? 12 : size === "large" ? 18 : 14;
  
  return (
    <View style={styles.container}>
      <View style={[styles.meterContainer, { borderColor: color }]}>
        <ThemedText style={[styles.emoji, { fontSize: iconSize }]}>{emoji}</ThemedText>
        <ThemedText style={[styles.score, { color, fontSize }]}>{score}</ThemedText>
      </View>
      {showLabel ? (
        <ThemedText style={[styles.label, { color }]}>{level}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  meterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  emoji: {
    lineHeight: 20,
  },
  score: {
    fontWeight: "700",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
