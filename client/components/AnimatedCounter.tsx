import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Haptics from "@/lib/safeHaptics";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: any;
  textStyle?: any;
  formatNumber?: (num: number) => string;
  hapticOnChange?: boolean;
}

function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  if (num >= 1000000000) {
    return "R" + (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (num >= 1000000) {
    return "R" + (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return "R" + (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return "R" + num.toLocaleString();
}

export default function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 1000,
  style,
  textStyle,
  formatNumber = formatLargeNumber,
  hapticOnChange = true,
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);
  const displayValue = useSharedValue(0);
  const scale = useSharedValue(1);
  const previousValue = useRef(value);
  const [displayText, setDisplayText] = React.useState(formatNumber(0));

  const updateDisplayText = (val: number) => {
    setDisplayText(formatNumber(Math.round(val)));
  };

  useEffect(() => {
    const isIncreasing = value > previousValue.current;
    previousValue.current = value;

    if (hapticOnChange && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    scale.value = withSpring(1.1, { damping: 8 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 12 });
    }, 150);

    const startValue = animatedValue.value;
    const diff = value - startValue;
    const steps = Math.min(Math.abs(diff), 30);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * easedProgress;
      
      runOnJS(updateDisplayText)(currentValue);
      
      if (step >= steps) {
        clearInterval(interval);
        animatedValue.value = value;
        runOnJS(updateDisplayText)(value);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, style, animatedStyle]}>
      <Text style={[styles.text, textStyle]}>
        {prefix}{displayText}{suffix}
      </Text>
    </Animated.View>
  );
}

export function NetWorthCounter({ value, style }: { value: number; style?: any }) {
  return (
    <AnimatedCounter
      value={value}
      formatNumber={formatCurrency}
      style={style}
      textStyle={styles.netWorthText}
      hapticOnChange={true}
    />
  );
}

export function FollowerCounter({ value, style }: { value: number; style?: any }) {
  return (
    <AnimatedCounter
      value={value}
      formatNumber={formatLargeNumber}
      style={style}
      textStyle={styles.followerText}
      hapticOnChange={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  netWorthText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFD700",
    textShadowColor: "rgba(255, 215, 0, 0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  followerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
