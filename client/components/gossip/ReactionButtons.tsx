import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import Haptics from "@/lib/safeHaptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { REACTION_EMOJI, REACTION_COLORS, type ReactionType } from "./AnonGossipTypes";

interface ReactionButtonsProps {
  reactions: {
    fireCount: number;
    mindblownCount: number;
    laughCount: number;
    skullCount: number;
    eyesCount: number;
  };
  myReactions?: string[];
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ReactionButton({
  type,
  count,
  isActive,
  onPress,
  disabled,
  compact,
}: {
  type: ReactionType;
  count: number;
  isActive: boolean;
  onPress: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePress = () => {
    scale.value = withSpring(1.3, { damping: 8, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 8, stiffness: 400 });
    });
    if (Platform.OS !== "web") {
      runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))();
    }
    onPress();
  };
  
  return (
    <AnimatedPressable
      style={[
        styles.reactionButton,
        compact ? styles.reactionButtonCompact : null,
        isActive ? { backgroundColor: `${REACTION_COLORS[type]}20`, borderColor: REACTION_COLORS[type] } : { borderColor: theme.glassBorder },
        animatedStyle,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <ThemedText style={[styles.reactionEmoji, compact ? styles.reactionEmojiCompact : null]}>
        {REACTION_EMOJI[type]}
      </ThemedText>
      {count > 0 ? (
        <ThemedText style={[
          styles.reactionCount,
          compact ? styles.reactionCountCompact : null,
          { color: isActive ? REACTION_COLORS[type] : theme.textSecondary }
        ]}>
          {count}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

export function ReactionButtons({
  reactions,
  myReactions = [],
  onReact,
  disabled,
  compact,
}: ReactionButtonsProps) {
  const reactionTypes: ReactionType[] = ["FIRE", "MINDBLOWN", "LAUGH", "SKULL", "EYES"];
  const countMap: Record<ReactionType, number> = {
    FIRE: reactions.fireCount,
    MINDBLOWN: reactions.mindblownCount,
    LAUGH: reactions.laughCount,
    SKULL: reactions.skullCount,
    EYES: reactions.eyesCount,
  };
  
  return (
    <View style={[styles.container, compact ? styles.containerCompact : null]}>
      {reactionTypes.map((type) => (
        <ReactionButton
          key={type}
          type={type}
          count={countMap[type]}
          isActive={myReactions.includes(type)}
          onPress={() => onReact(type)}
          disabled={disabled}
          compact={compact}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  containerCompact: {
    gap: 6,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  reactionButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  reactionEmojiCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  reactionCountCompact: {
    fontSize: 11,
  },
});
