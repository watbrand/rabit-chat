import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { RabitLogo } from "./RabitLogo";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
  fullScreen?: boolean;
}

const SIZE_MAP = {
  small: 48,
  medium: 80,
  large: 120,
};

export function ErrorState({
  title = "Oops!",
  message = "Something went wrong. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  style,
  size = "medium",
  showIcon = true,
  fullScreen = false,
}: ErrorStateProps) {
  const { theme, isDark } = useTheme();
  const logoSize = SIZE_MAP[size];
  
  const shakeX = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 60 }),
      withTiming(12, { duration: 60 }),
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 60 }),
      withTiming(-3, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );

    iconScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(2)) }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    iconRotation.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(-15, { duration: 150 }),
      withTiming(15, { duration: 150 }),
      withTiming(0, { duration: 150 })
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const content = (
    <View style={[styles.container, style]}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.glow, animatedGlowStyle, { backgroundColor: theme.error }]} />
        <Animated.View style={animatedLogoStyle}>
          <RabitLogo size={logoSize} variant="simple" showGlow={false} />
        </Animated.View>
        {showIcon ? (
          <Animated.View style={[styles.iconBadge, animatedIconStyle, { backgroundColor: theme.error }]}>
            <Feather name="alert-circle" size={logoSize * 0.25} color="white" />
          </Animated.View>
        ) : null}
      </View>
      
      <ThemedText style={[styles.title, size === "small" && styles.titleSmall]}>
        {title}
      </ThemedText>
      
      <ThemedText style={[styles.message, { color: theme.textSecondary }, size === "small" && styles.messageSmall]}>
        {message}
      </ThemedText>
      
      {onRetry ? (
        <GlassButton
          onPress={onRetry}
          style={styles.retryButton}
          variant="primary"
          title={retryLabel}
          icon="refresh-cw"
        />
      ) : null}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: theme.backgroundDefault }]}>
        {content}
      </View>
    );
  }

  return content;
}

export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="No Connection"
      message="Please check your internet connection and try again."
      onRetry={onRetry}
      retryLabel="Retry"
      showIcon
    />
  );
}

export function ServerErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Server Error"
      message="Our servers are having a moment. Please try again in a few seconds."
      onRetry={onRetry}
      retryLabel="Retry"
      showIcon
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  glow: {
    position: "absolute",
    width: "150%",
    height: "150%",
    borderRadius: 100,
    left: "-25%",
    top: "-25%",
  },
  iconBadge: {
    position: "absolute",
    bottom: -4,
    right: -8,
    borderRadius: BorderRadius.full,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  titleSmall: {
    fontSize: 18,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  messageSmall: {
    fontSize: 13,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  retryIcon: {
    marginRight: Spacing.sm,
  },
  retryText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ErrorState;
