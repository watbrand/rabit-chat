import React from "react";
import { StyleSheet, Pressable, ViewStyle, Platform, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
  interpolate,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation, GlassStyles, Shadows, Gradients } from "@/constants/theme";

interface CardProps {
  elevation?: number;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "solid" | "glass" | "glassIntense" | "premium";
  glowEffect?: boolean;
  gradientBorder?: boolean;
  disabled?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: Animation.spring.damping,
  mass: Animation.spring.mass,
  stiffness: Animation.spring.stiffness,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  elevation = 1,
  title,
  description,
  children,
  onPress,
  style,
  variant = "glass",
  glowEffect = false,
  gradientBorder = false,
  disabled = false,
}: CardProps) {
  const { theme, isDark } = useTheme();
  const pressed = useSharedValue(0);

  const getCardStyle = () => {
    if (variant === "solid") {
      return {
        backgroundColor: theme.backgroundElevated,
        borderWidth: 1,
        borderColor: theme.border,
      };
    }
    
    if (variant === "premium") {
      return {
        backgroundColor: isDark ? "rgba(26, 26, 36, 0.85)" : "rgba(255, 255, 255, 0.90)",
        borderWidth: 1,
        borderColor: theme.glassBorder,
      };
    }
    
    const darkGlass = GlassStyles.dark;
    const lightGlass = GlassStyles.light;
    
    if (variant === "glassIntense") {
      return isDark ? darkGlass.intense : lightGlass.elevated;
    }
    
    const glassConfig = isDark ? darkGlass : lightGlass;
    return elevation >= 2 ? glassConfig.elevated : glassConfig.card;
  };

  const cardStyle = getCardStyle();

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(pressed.value, [0, 1], [1, 0.97]);
    const shadowOpacity = interpolate(pressed.value, [0, 1], [glowEffect ? 0.4 : 0.15, 0.1]);
    return {
      transform: [{ scale: scaleValue }],
      shadowOpacity,
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      pressed.value = withSpring(1, springConfig);
    }
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, springConfig);
  };

  const getShadowStyle = () => {
    if (glowEffect) {
      return {
        ...Shadows.glow,
        shadowRadius: 20,
        shadowOpacity: 0.35,
      };
    }
    if (variant === "premium") {
      return {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
      };
    }
    return Shadows.md;
  };

  const shadowStyle = getShadowStyle();

  const content = (
    <>
      {title ? (
        <ThemedText type="headline" style={styles.cardTitle}>
          {title}
        </ThemedText>
      ) : null}
      {description ? (
        <ThemedText type="subhead" style={[styles.cardDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      ) : null}
      {children}
    </>
  );

  const cardInnerStyle = [
    styles.card,
    cardStyle,
    shadowStyle,
    style,
  ];

  if (gradientBorder) {
    return (
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.gradientBorderWrapper, animatedStyle, shadowStyle]}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <View style={[styles.gradientBorderInner, { backgroundColor: isDark ? "#121218" : "#FFFFFF" }]}>
            {content}
          </View>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  if ((variant === "glass" || variant === "glassIntense" || variant === "premium") && Platform.OS === "ios") {
    return (
      <AnimatedPressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.cardWrapper, animatedStyle, shadowStyle, style]}
      >
        <BlurView
          intensity={isDark ? (variant === "premium" ? 60 : 45) : (variant === "premium" ? 80 : 60)}
          tint={isDark ? "dark" : "light"}
          style={[styles.card, styles.blurCard, cardStyle]}
        >
          {content}
        </BlurView>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[cardInnerStyle, animatedStyle]}
    >
      {content}
    </AnimatedPressable>
  );
}

export function GlassCard({
  children,
  style,
  intensity = 50,
  glowEffect = false,
  variant = "default",
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  glowEffect?: boolean;
  variant?: "default" | "elevated" | "floating";
}) {
  const { theme, isDark } = useTheme();
  
  const getGlassConfig = () => {
    if (variant === "floating") {
      return {
        backgroundColor: isDark ? "rgba(15, 15, 20, 0.90)" : "rgba(255, 255, 255, 0.95)",
        borderWidth: 1,
        borderColor: theme.glassBorder,
      };
    }
    if (variant === "elevated") {
      return isDark ? GlassStyles.dark.elevated : GlassStyles.light.elevated;
    }
    return isDark ? GlassStyles.dark.card : GlassStyles.light.card;
  };
  
  const glassConfig = getGlassConfig();
  
  const shadowStyle = glowEffect 
    ? { ...Shadows.glow, shadowRadius: 16, shadowOpacity: 0.35 }
    : variant === "floating" 
      ? { ...Shadows.lg, shadowColor: "#8B5CF6", shadowOpacity: 0.2 }
      : Shadows.sm;

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={isDark ? intensity : intensity + 20}
        tint={isDark ? "dark" : "light"}
        style={[styles.glassCard, glassConfig, shadowStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <Animated.View style={[styles.glassCard, glassConfig, shadowStyle, style]}>
      {children}
    </Animated.View>
  );
}

export function PremiumCard({
  children,
  style,
  onPress,
  glowColor = "#8B5CF6",
}: {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  glowColor?: string;
}) {
  const { theme, isDark } = useTheme();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(pressed.value, [0, 1], [1, 0.97]);
    return {
      transform: [{ scale: scaleValue }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, springConfig);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, springConfig);
  };

  const premiumShadow = {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  };

  if (Platform.OS === "ios") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.cardWrapper, animatedStyle, premiumShadow, style]}
      >
        <BlurView
          intensity={60}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.premiumCard,
            {
              backgroundColor: isDark ? "rgba(26, 26, 36, 0.85)" : "rgba(255, 255, 255, 0.92)",
              borderWidth: 1,
              borderColor: `${glowColor}40`,
            },
          ]}
        >
          {children}
        </BlurView>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.premiumCard,
        {
          backgroundColor: isDark ? "rgba(26, 26, 36, 0.90)" : "rgba(255, 255, 255, 0.95)",
          borderWidth: 1,
          borderColor: `${glowColor}40`,
        },
        animatedStyle,
        premiumShadow,
        style,
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    overflow: "hidden",
    borderRadius: BorderRadius.xl,
  },
  card: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  blurCard: {
    overflow: "hidden",
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    marginBottom: Spacing.sm,
  },
  glassCard: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  premiumCard: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  gradientBorderWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  gradientBorder: {
    padding: 1.5,
    borderRadius: BorderRadius.xl,
  },
  gradientBorderInner: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.xl - 1.5,
    overflow: "hidden",
  },
});
