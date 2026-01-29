import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AnimatedLogo, AnimationPreset } from "./AnimatedLogo";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface LoadingIndicatorProps {
  size?: "small" | "medium" | "large" | "xlarge";
  message?: string;
  showMessage?: boolean;
  style?: ViewStyle;
  preset?: AnimationPreset;
  fullScreen?: boolean;
  variant?: "full" | "simple" | "minimal";
}

const SIZE_MAP = {
  small: 32,
  medium: 56,
  large: 80,
  xlarge: 120,
};

export function LoadingIndicator({
  size = "medium",
  message = "Loading...",
  showMessage = false,
  style,
  preset = "pulse",
  fullScreen = false,
  variant = "simple",
}: LoadingIndicatorProps) {
  const { theme } = useTheme();
  const logoSize = SIZE_MAP[size];

  const content = (
    <View style={[styles.container, style]}>
      <AnimatedLogo 
        size={logoSize} 
        preset={preset}
        variant={variant}
        showGlow={size !== "small"}
        speed={size === "small" ? "fast" : "normal"}
      />
      {showMessage && message ? (
        <ThemedText 
          style={[
            styles.message, 
            { color: theme.textSecondary },
            size === "small" && styles.messageSmall,
          ]}
        >
          {message}
        </ThemedText>
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

export function LoadingScreen({ message }: { message?: string }) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loadingScreen, { backgroundColor: theme.backgroundDefault }]}>
      <AnimatedLogo 
        size={100} 
        preset="breathe"
        variant="full"
        showGlow
      />
      {message ? (
        <ThemedText style={[styles.loadingMessage, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function InlineLoader({ size = 24 }: { size?: number }) {
  return (
    <AnimatedLogo 
      size={size} 
      preset="pulse"
      variant="minimal"
      showGlow={false}
      speed="fast"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 14,
    fontWeight: "500",
  },
  messageSmall: {
    fontSize: 12,
    marginTop: Spacing.sm,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMessage: {
    marginTop: Spacing.xl,
    fontSize: 16,
    fontWeight: "500",
  },
});

export default LoadingIndicator;
