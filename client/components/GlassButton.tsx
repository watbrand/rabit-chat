import React from "react";
import { StyleSheet, Pressable, Platform, View, ViewStyle, TextStyle } from "react-native";
import { InlineLoader } from "@/components/animations";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation, Gradients } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
type ButtonSize = "sm" | "md" | "lg";

interface GlassButtonProps {
  title?: string;
  icon?: string;
  iconPosition?: "left" | "right";
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  glowEffect?: boolean;
  onPress: () => void;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassButton({
  title,
  icon,
  iconPosition = "left",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  glowEffect = false,
  onPress,
  testID,
  style,
  textStyle,
}: GlassButtonProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, Animation.springBouncy);
    pressed.value = withSpring(1, Animation.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.springBouncy);
    pressed.value = withSpring(0, Animation.spring);
  };

  const handlePress = () => {
    if (haptic && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(pressed.value, [0, 1], [glowEffect ? 0.45 : 0.25, 0.15]);
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity,
    };
  });

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: number } => {
    switch (size) {
      case "sm":
        return {
          container: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 36 },
          text: { fontSize: 13 },
          iconSize: 16,
        };
      case "lg":
        return {
          container: { paddingVertical: 16, paddingHorizontal: 28, minHeight: 56 },
          text: { fontSize: 17 },
          iconSize: 22,
        };
      default:
        return {
          container: { paddingVertical: 14, paddingHorizontal: 22, minHeight: 48 },
          text: { fontSize: 15 },
          iconSize: 18,
        };
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; iconColor: string; useGradient?: boolean } => {
    switch (variant) {
      case "gradient":
        return {
          container: {},
          text: { color: "#FFFFFF" },
          iconColor: "#FFFFFF",
          useGradient: true,
        };
      case "secondary":
        return {
          container: {
            backgroundColor: isDark 
              ? "rgba(139, 92, 246, 0.18)" 
              : "rgba(139, 92, 246, 0.12)",
            borderWidth: 1,
            borderColor: isDark 
              ? "rgba(139, 92, 246, 0.35)" 
              : "rgba(139, 92, 246, 0.25)",
          },
          text: { color: theme.primary },
          iconColor: theme.primary,
        };
      case "outline":
        return {
          container: {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: isDark 
              ? "rgba(139, 92, 246, 0.40)" 
              : theme.primary,
          },
          text: { color: theme.primary },
          iconColor: theme.primary,
        };
      case "ghost":
        return {
          container: {
            backgroundColor: isDark 
              ? "rgba(255, 255, 255, 0.08)" 
              : "rgba(0, 0, 0, 0.05)",
          },
          text: { color: theme.text },
          iconColor: theme.text,
        };
      case "danger":
        return {
          container: {
            backgroundColor: theme.error,
            ...Platform.select({
              ios: {
                shadowColor: theme.error,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
              },
              android: { elevation: 4 },
            }),
          },
          text: { color: "#FFFFFF" },
          iconColor: "#FFFFFF",
        };
      default:
        return {
          container: {
            backgroundColor: theme.primary,
            ...Platform.select({
              ios: {
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: glowEffect ? 0.5 : 0.35,
                shadowRadius: glowEffect ? 16 : 10,
              },
              android: { elevation: 6 },
            }),
          },
          text: { color: "#FFFFFF" },
          iconColor: "#FFFFFF",
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const content = (
    <>
      {loading ? (
        <InlineLoader size={20} />
      ) : (
        <>
          {icon && iconPosition === "left" ? (
            <Feather
              name={icon as any}
              size={sizeStyles.iconSize}
              color={variantStyles.iconColor}
              style={title ? styles.iconLeft : undefined}
            />
          ) : null}
          {title ? (
            <ThemedText
              style={[
                styles.text,
                sizeStyles.text,
                variantStyles.text,
                textStyle,
              ]}
              weight="semiBold"
            >
              {title}
            </ThemedText>
          ) : null}
          {icon && iconPosition === "right" ? (
            <Feather
              name={icon as any}
              size={sizeStyles.iconSize}
              color={variantStyles.iconColor}
              style={title ? styles.iconRight : undefined}
            />
          ) : null}
        </>
      )}
    </>
  );

  if (variantStyles.useGradient) {
    return (
      <AnimatedPressable
        style={[
          styles.gradientWrapper,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          animatedStyle,
          {
            shadowColor: "#8B5CF6",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: glowEffect ? 0.5 : 0.4,
            shadowRadius: glowEffect ? 18 : 12,
            elevation: 6,
          },
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientContainer, sizeStyles.container]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const containerStyle = [
    styles.container,
    sizeStyles.container,
    variantStyles.container,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  return (
    <AnimatedPressable
      style={[containerStyle, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      testID={testID}
    >
      {content}
    </AnimatedPressable>
  );
}

export function GlassIconButton({
  icon,
  variant = "ghost",
  size = "md",
  onPress,
  disabled = false,
  glowEffect = false,
  testID,
  style,
}: {
  icon: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  disabled?: boolean;
  glowEffect?: boolean;
  testID?: string;
  style?: ViewStyle;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.88, Animation.springBouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.springBouncy);
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getSize = () => {
    switch (size) {
      case "sm":
        return { size: 36, iconSize: 18 };
      case "lg":
        return { size: 56, iconSize: 26 };
      default:
        return { size: 48, iconSize: 22 };
    }
  };

  const sizeProps = getSize();

  const getColor = () => {
    switch (variant) {
      case "primary":
      case "gradient":
        return "#FFFFFF";
      case "danger":
        return "#FFFFFF";
      default:
        return theme.text;
    }
  };

  const getBackground = () => {
    switch (variant) {
      case "primary":
        return theme.primary;
      case "danger":
        return theme.error;
      default:
        return isDark
          ? "rgba(255, 255, 255, 0.10)"
          : "rgba(0, 0, 0, 0.05)";
    }
  };

  const getShadow = () => {
    if (variant === "primary" || variant === "gradient" || glowEffect) {
      return {
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 4,
      };
    }
    return {};
  };

  if (variant === "gradient") {
    return (
      <AnimatedPressable
        style={[
          {
            width: sizeProps.size,
            height: sizeProps.size,
            borderRadius: sizeProps.size / 2,
            overflow: "hidden",
            ...getShadow(),
          },
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconButtonContainer, { width: sizeProps.size, height: sizeProps.size }]}
        >
          <Feather name={icon as any} size={sizeProps.iconSize} color="#FFFFFF" />
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={[
        styles.iconButtonContainer,
        {
          width: sizeProps.size,
          height: sizeProps.size,
          borderRadius: sizeProps.size / 2,
          backgroundColor: getBackground(),
          ...getShadow(),
        },
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
    >
      <Feather name={icon as any} size={sizeProps.iconSize} color={getColor()} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  gradientWrapper: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  gradientContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.full,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  iconButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
