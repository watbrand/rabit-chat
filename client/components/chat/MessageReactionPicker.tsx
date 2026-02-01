import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PICKER_WIDTH = 280;
const PICKER_HEIGHT = 56;
const BUTTON_SIZE = 44;
const MARGIN = Spacing.md;

interface ReactionItem {
  id: string;
  icon: string;
  label: string;
}

const QUICK_REACTIONS: ReactionItem[] = [
  { id: "like", icon: "thumbs-up", label: "Like" },
  { id: "love", icon: "heart", label: "Love" },
  { id: "laugh", icon: "smile", label: "Laugh" },
  { id: "wow", icon: "star", label: "Wow" },
  { id: "sad", icon: "frown", label: "Sad" },
  { id: "angry", icon: "zap", label: "Angry" },
];

export interface MessageReactionPickerProps {
  visible: boolean;
  position: { x: number; y: number };
  existingReactions?: string[];
  onSelectReaction: (emoji: string) => void;
  onClose: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedView = Animated.createAnimatedComponent(View);

export function MessageReactionPicker({
  visible,
  position,
  existingReactions = [],
  onSelectReaction,
  onClose,
}: MessageReactionPickerProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Calculate position based on available space
  const calculatePosition = () => {
    const bottomSpace = SCREEN_HEIGHT - position.y;
    const topSpace = position.y;
    
    let top = position.y;
    let showAbove = false;

    if (bottomSpace < PICKER_HEIGHT + MARGIN * 2) {
      // Show above
      showAbove = true;
      top = Math.max(MARGIN, position.y - PICKER_HEIGHT - MARGIN);
    } else {
      // Show below
      top = position.y + MARGIN;
    }

    // Center horizontally, accounting for screen edges
    let left = position.x - PICKER_WIDTH / 2;
    if (left < MARGIN) {
      left = MARGIN;
    } else if (left + PICKER_WIDTH > SCREEN_WIDTH - MARGIN) {
      left = SCREEN_WIDTH - PICKER_WIDTH - MARGIN;
    }

    return { top, left, showAbove };
  };

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, Animation.springBouncy);
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    } else {
      scale.value = withSpring(0, Animation.spring);
      opacity.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible]);

  const handleReactionPress = (reactionId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectReaction(reactionId);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const { top, left } = calculatePosition();
  const isSelected = (reactionId: string) =>
    existingReactions.includes(reactionId);

  if (!visible) {
    return null;
  }

  return (
    <AnimatedView
      style={[
        styles.container,
        {
          top,
          left,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.pickerBackground,
          {
            backgroundColor: isDark
              ? "rgba(26, 26, 36, 0.92)"
              : "rgba(255, 255, 255, 0.92)",
            borderColor: isDark
              ? "rgba(139, 92, 246, 0.25)"
              : "rgba(139, 92, 246, 0.15)",
          },
        ]}
      >
        <View style={styles.reactionsRow}>
          {QUICK_REACTIONS.map((reaction) => {
            const selected = isSelected(reaction.id);
            return (
              <ReactionButton
                key={reaction.id}
                reaction={reaction}
                selected={selected}
                onPress={() => handleReactionPress(reaction.id)}
                theme={theme}
                isDark={isDark}
              />
            );
          })}

          <Pressable
            style={[
              styles.expandButton,
              {
                backgroundColor: isDark
                  ? "rgba(139, 92, 246, 0.12)"
                  : "rgba(139, 92, 246, 0.08)",
                borderColor: isDark
                  ? "rgba(139, 92, 246, 0.25)"
                  : "rgba(139, 92, 246, 0.15)",
              },
            ]}
            onPress={onClose}
          >
            <Feather
              name="more-horizontal"
              size={20}
              color={theme.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* Arrow pointer */}
      <View
        style={[
          styles.arrow,
          {
            backgroundColor: isDark
              ? "rgba(26, 26, 36, 0.92)"
              : "rgba(255, 255, 255, 0.92)",
            borderColor: isDark
              ? "rgba(139, 92, 246, 0.25)"
              : "rgba(139, 92, 246, 0.15)",
          },
        ]}
      />
    </AnimatedView>
  );
}

interface ReactionButtonProps {
  reaction: ReactionItem;
  selected: boolean;
  onPress: () => void;
  theme: typeof import("@/constants/theme").Colors.light;
  isDark: boolean;
}

function ReactionButton({
  reaction,
  selected,
  onPress,
  theme,
  isDark,
}: ReactionButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.85, Animation.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.springBouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.reactionButton,
        {
          backgroundColor: selected
            ? isDark
              ? "rgba(139, 92, 246, 0.25)"
              : "rgba(139, 92, 246, 0.15)"
            : "transparent",
          borderColor: selected
            ? theme.primary
            : isDark
            ? "rgba(139, 92, 246, 0.15)"
            : "transparent",
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={`reaction-button-${reaction.id}`}
    >
      <Feather
        name={reaction.icon as any}
        size={24}
        color={selected ? theme.primary : theme.textSecondary}
      />
      {selected && (
        <View style={styles.checkmarkContainer}>
          <Feather name="check" size={12} color={theme.primary} />
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
  },
  pickerBackground: {
    width: PICKER_WIDTH,
    height: PICKER_HEIGHT,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
    overflow: "hidden",
  },
  reactionsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xs,
  },
  reactionButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },
  checkmarkContainer: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  expandButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  arrow: {
    width: 12,
    height: 12,
    borderRadius: 2,
    position: "absolute",
    left: PICKER_WIDTH / 2 - 6,
    top: PICKER_HEIGHT + 2,
    transform: [{ rotate: "45deg" }],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
});
