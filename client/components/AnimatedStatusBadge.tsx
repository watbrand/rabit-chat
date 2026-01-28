import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Gradients, Animation, BorderRadius, Spacing, Colors } from "@/constants/theme";
import { ThemedText } from "./ThemedText";

type StatusType = "online" | "away" | "busy" | "offline" | "typing" | "recording" | "live";

interface AnimatedStatusBadgeProps {
  status: StatusType;
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
}

const STATUS_CONFIG = {
  online: {
    colors: ["#10B981", "#059669"],
    icon: null,
    label: "Online",
    pulse: true,
  },
  away: {
    colors: ["#F59E0B", "#D97706"],
    icon: "moon" as const,
    label: "Away",
    pulse: false,
  },
  busy: {
    colors: ["#EF4444", "#DC2626"],
    icon: "remove-circle" as const,
    label: "Busy",
    pulse: false,
  },
  offline: {
    colors: ["#6B7280", "#4B5563"],
    icon: null,
    label: "Offline",
    pulse: false,
  },
  typing: {
    colors: [...Gradients.primary],
    icon: null,
    label: "Typing...",
    pulse: true,
  },
  recording: {
    colors: ["#EF4444", "#DC2626"],
    icon: "mic" as const,
    label: "Recording",
    pulse: true,
  },
  live: {
    colors: ["#EF4444", "#DC2626"],
    icon: "radio" as const,
    label: "LIVE",
    pulse: true,
  },
};

const SIZE_CONFIG = {
  small: { badge: 8, icon: 6, fontSize: 10 },
  medium: { badge: 12, icon: 8, fontSize: 12 },
  large: { badge: 16, icon: 12, fontSize: 14 },
};

export default function AnimatedStatusBadge({
  status,
  showLabel = false,
  size = "medium",
  style,
}: AnimatedStatusBadgeProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);
  const typingDot1 = useSharedValue(0);
  const typingDot2 = useSharedValue(0);
  const typingDot3 = useSharedValue(0);

  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  useEffect(() => {
    if (config.pulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: Animation.duration.normal, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: Animation.duration.normal, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: Animation.duration.normal }),
          withTiming(0.8, { duration: Animation.duration.fast })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
    }
  }, [status, config.pulse]);

  useEffect(() => {
    if (status === "typing") {
      const dotAnimation = (delay: number) =>
        withRepeat(
          withDelay(
            delay,
            withSequence(
              withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 200, easing: Easing.inOut(Easing.ease) })
            )
          ),
          -1,
          false
        );

      typingDot1.value = dotAnimation(0);
      typingDot2.value = dotAnimation(150);
      typingDot3.value = dotAnimation(300);
    }
  }, [status]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(typingDot1.value, [0, 1], [0, -3]) }],
    opacity: interpolate(typingDot1.value, [0, 1], [0.5, 1]),
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(typingDot2.value, [0, 1], [0, -3]) }],
    opacity: interpolate(typingDot2.value, [0, 1], [0.5, 1]),
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(typingDot3.value, [0, 1], [0, -3]) }],
    opacity: interpolate(typingDot3.value, [0, 1], [0.5, 1]),
  }));

  const renderTypingIndicator = () => (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, dot1Style]} />
      <Animated.View style={[styles.typingDot, dot2Style]} />
      <Animated.View style={[styles.typingDot, dot3Style]} />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.badgeContainer, { width: sizeConfig.badge, height: sizeConfig.badge }]}>
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: sizeConfig.badge * 2,
              height: sizeConfig.badge * 2,
              borderRadius: sizeConfig.badge,
            },
            pulseAnimatedStyle,
          ]}
        >
          <LinearGradient
            colors={config.colors as [string, string, ...string[]]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        
        <LinearGradient
          colors={config.colors as [string, string, ...string[]]}
          style={[
            styles.badge,
            {
              width: sizeConfig.badge,
              height: sizeConfig.badge,
              borderRadius: sizeConfig.badge / 2,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {status === "typing" ? (
            renderTypingIndicator()
          ) : config.icon ? (
            <Ionicons name={config.icon} size={sizeConfig.icon} color="#FFFFFF" />
          ) : null}
        </LinearGradient>
      </View>
      
      {showLabel && (
        <ThemedText style={[styles.label, { fontSize: sizeConfig.fontSize }]}>
          {config.label}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  badgeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.dark.backgroundDefault,
  },
  pulseRing: {
    position: "absolute",
    overflow: "hidden",
  },
  label: {
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  typingDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },
});
