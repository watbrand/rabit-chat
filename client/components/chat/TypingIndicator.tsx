import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

export interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
  userAvatar?: string;
}

const DOT_SIZE = 8;
const DOT_SPACING = Spacing.sm;
const BOUNCE_HEIGHT = 12;
const ANIMATION_DURATION = 600;

interface BouncingDotProps {
  index: number;
  isAnimating: boolean;
}

function BouncingDot({ index, isAnimating }: BouncingDotProps) {
  const { theme } = useTheme();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isAnimating) {
      translateY.value = withDelay(
        index * 100,
        withRepeat(
          withSequence(
            withTiming(-BOUNCE_HEIGHT, {
              duration: ANIMATION_DURATION / 2,
              easing: Easing.out(Easing.ease),
            }),
            withTiming(0, {
              duration: ANIMATION_DURATION / 2,
              easing: Easing.in(Easing.ease),
            })
          ),
          -1,
          true
        )
      );
    } else {
      translateY.value = withTiming(0, { duration: 200 });
    }
  }, [isAnimating, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: DOT_SIZE,
          height: DOT_SIZE,
          borderRadius: DOT_SIZE / 2,
          backgroundColor: theme.primary,
        },
        animatedStyle,
      ]}
    />
  );
}

export function TypingIndicator({
  isVisible,
  userName,
  userAvatar,
}: TypingIndicatorProps) {
  const { theme, isDark } = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible]);

  const containerOpacity = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, containerOpacity]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {userAvatar ? (
        <View style={styles.avatarContainer}>
          <Avatar uri={userAvatar} size={32} />
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          styles.bubbleReceived,
          {
            backgroundColor: isDark
              ? theme.glassBackground
              : theme.backgroundDefault,
            borderColor: theme.glassBorder,
          },
        ]}
      >
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <BouncingDot
              key={index}
              index={index}
              isAnimating={isVisible}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderBottomLeftRadius: BorderRadius.xs,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  bubbleReceived: {
    // Styling for received message bubble
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: DOT_SPACING,
    height: DOT_SIZE + BOUNCE_HEIGHT,
    justifyContent: "center",
  },
});
