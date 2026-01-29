import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { RabitLogo } from "./RabitLogo";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface SuccessStateProps {
  title?: string;
  message?: string;
  onContinue?: () => void;
  continueLabel?: string;
  style?: ViewStyle;
  size?: "small" | "medium" | "large";
  showConfetti?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  onAutoHide?: () => void;
}

const SIZE_MAP = {
  small: 48,
  medium: 80,
  large: 120,
};

export function SuccessState({
  title = "Success!",
  message = "Everything went smoothly.",
  onContinue,
  continueLabel = "Continue",
  style,
  size = "medium",
  showConfetti = true,
  autoHide = false,
  autoHideDelay = 2000,
  onAutoHide,
}: SuccessStateProps) {
  const { theme } = useTheme();
  const logoSize = SIZE_MAP[size];
  
  const logoScale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0);
  const confettiProgress = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withSpring(1.15, { damping: 8, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 200 })
    );

    checkScale.value = withDelay(
      250,
      withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.3, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 180 })
      )
    );

    checkOpacity.value = withDelay(250, withTiming(1, { duration: 200 }));

    glowScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1.5, { duration: 400, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 300 })
    );

    if (showConfetti) {
      confettiProgress.value = withDelay(
        200,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) })
      );
    }

    if (autoHide && onAutoHide) {
      containerOpacity.value = withDelay(
        autoHideDelay,
        withTiming(0, { duration: 300 }, () => {
          onAutoHide();
        })
      );
    }
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: interpolate(glowScale.value, [0, 1, 1.5], [0, 0.6, 0.3]),
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const renderConfetti = () => {
    if (!showConfetti) return null;
    
    const particles = Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const distance = logoSize * 0.8;
      
      return (
        <ConfettiParticle
          key={i}
          index={i}
          angle={angle}
          distance={distance}
          progress={confettiProgress}
          color={i % 3 === 0 ? theme.primary : i % 3 === 1 ? theme.pink : theme.gold}
        />
      );
    });

    return <View style={styles.confettiContainer}>{particles}</View>;
  };

  return (
    <Animated.View style={[styles.container, style, animatedContainerStyle]}>
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.glow, animatedGlowStyle, { backgroundColor: theme.success }]} />
        {renderConfetti()}
        <Animated.View style={animatedLogoStyle}>
          <RabitLogo size={logoSize} variant="simple" showGlow />
        </Animated.View>
        <Animated.View style={[styles.checkBadge, animatedCheckStyle, { backgroundColor: theme.success }]}>
          <Feather name="check" size={logoSize * 0.22} color="white" strokeWidth={3} />
        </Animated.View>
      </View>
      
      <ThemedText style={[styles.title, size === "small" && styles.titleSmall]}>
        {title}
      </ThemedText>
      
      <ThemedText style={[styles.message, { color: theme.textSecondary }, size === "small" && styles.messageSmall]}>
        {message}
      </ThemedText>
      
      {onContinue ? (
        <GlassButton
          onPress={onContinue}
          style={styles.continueButton}
          variant="primary"
          title={continueLabel}
        />
      ) : null}
    </Animated.View>
  );
}

function ConfettiParticle({ 
  index, 
  angle, 
  distance, 
  progress, 
  color 
}: { 
  index: number; 
  angle: number; 
  distance: number; 
  progress: { value: number };
  color: string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const x = Math.cos(angle) * distance * progress.value;
    const y = Math.sin(angle) * distance * progress.value - (progress.value * 30);
    const scale = interpolate(progress.value, [0, 0.5, 1], [0, 1.2, 0.6]);
    const opacity = interpolate(progress.value, [0, 0.3, 1], [0, 1, 0]);
    const rotation = progress.value * 360 * (index % 2 === 0 ? 1 : -1);

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        { rotate: `${rotation}deg` },
      ],
      opacity,
    };
  });

  const shapes = ["circle", "square", "triangle"];
  const shape = shapes[index % 3];

  return (
    <Animated.View 
      style={[
        styles.confettiParticle,
        animatedStyle,
        { backgroundColor: shape !== "triangle" ? color : "transparent" },
        shape === "circle" && styles.confettiCircle,
        shape === "square" && styles.confettiSquare,
      ]}
    >
      {shape === "triangle" ? (
        <View style={[styles.confettiTriangle, { borderBottomColor: color }]} />
      ) : null}
    </Animated.View>
  );
}

export function QuickSuccess({ message = "Done!" }: { message?: string }) {
  return (
    <SuccessState
      title={message}
      message=""
      size="small"
      showConfetti={false}
      autoHide
      autoHideDelay={1500}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  logoContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  confettiContainer: {
    position: "absolute",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  confettiParticle: {
    position: "absolute",
    width: 10,
    height: 10,
  },
  confettiCircle: {
    borderRadius: 5,
  },
  confettiSquare: {
    borderRadius: 2,
  },
  confettiTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  checkBadge: {
    position: "absolute",
    bottom: -6,
    right: -10,
    borderRadius: BorderRadius.full,
    padding: 6,
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
  continueButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  continueText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default SuccessState;
