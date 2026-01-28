import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Modal, Platform, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export type PostReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY" | "FIRE" | "DIAMOND" | "CROWN";

interface ReactionConfig {
  type: PostReactionType;
  emoji: string;
  label: string;
  color: string;
}

const REACTIONS: ReactionConfig[] = [
  { type: "LIKE", emoji: "👍", label: "Like", color: "#3B82F6" },
  { type: "LOVE", emoji: "❤️", label: "Love", color: "#F43F5E" },
  { type: "HAHA", emoji: "😂", label: "Haha", color: "#FBBF24" },
  { type: "WOW", emoji: "😮", label: "Wow", color: "#FBBF24" },
  { type: "SAD", emoji: "😢", label: "Sad", color: "#FBBF24" },
  { type: "ANGRY", emoji: "😠", label: "Angry", color: "#EF4444" },
  { type: "FIRE", emoji: "🔥", label: "Fire", color: "#F97316" },
  { type: "DIAMOND", emoji: "💎", label: "Diamond", color: "#8B5CF6" },
  { type: "CROWN", emoji: "👑", label: "Crown", color: "#FBBF24" },
];

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: PostReactionType) => void;
  currentReaction?: PostReactionType | null;
}

function AnimatedReactionButton({
  reaction,
  index,
  isSelected,
  onPress,
}: {
  reaction: ReactionConfig;
  index: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      index * 30,
      withSpring(1, { damping: 12, stiffness: 180 })
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.reactionButton,
          isSelected && { backgroundColor: reaction.color + "30" },
        ]}
        onPress={handlePress}
      >
        <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
        {isSelected ? (
          <View style={[styles.selectedDot, { backgroundColor: reaction.color }]} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function ReactionPicker({ visible, onClose, onSelect, currentReaction }: ReactionPickerProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={[
            styles.pickerContainer,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.reactionsRow}>
            {REACTIONS.map((reaction, index) => (
              <AnimatedReactionButton
                key={reaction.type}
                reaction={reaction}
                index={index}
                isSelected={currentReaction === reaction.type}
                onPress={() => {
                  onSelect(reaction.type);
                  onClose();
                }}
              />
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function getReactionEmoji(type: PostReactionType): string {
  const reaction = REACTIONS.find((r) => r.type === type);
  return reaction?.emoji || "👍";
}

export function getReactionColor(type: PostReactionType): string {
  const reaction = REACTIONS.find((r) => r.type === type);
  return reaction?.color || "#3B82F6";
}

export function ReactionDisplay({
  type,
  size = 20,
}: {
  type: PostReactionType;
  size?: number;
}) {
  return (
    <ThemedText style={{ fontSize: size }}>{getReactionEmoji(type)}</ThemedText>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    minHeight: 120,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    maxWidth: 300,
    paddingBottom: Spacing.xs,
  },
  reactionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  reactionEmoji: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: "center",
  },
  selectedDot: {
    position: "absolute",
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
