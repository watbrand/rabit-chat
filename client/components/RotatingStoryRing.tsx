import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Circle } from "react-native-svg";
import { Gradients } from "@/constants/theme";

interface RotatingStoryRingProps {
  size: number;
  hasStory?: boolean;
  viewed?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function RotatingStoryRing({
  size,
  hasStory = false,
  viewed = false,
  children,
  style,
}: RotatingStoryRingProps) {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (hasStory && !viewed) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      pulseScale.value = 1;
    }
  }, [hasStory, viewed]);

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: pulseScale.value },
    ],
  }));

  const ringSize = size + 8;
  const strokeWidth = 3;

  if (!hasStory) {
    return (
      <View style={[styles.container, { width: ringSize, height: ringSize }, style]}>
        <View style={[styles.grayRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}>
          <View style={[styles.innerContainer, { width: size, height: size, borderRadius: size / 2 }]}>
            {children}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: ringSize, height: ringSize }, style]}>
      <AnimatedView style={[styles.ringWrapper, { width: ringSize, height: ringSize }, ringAnimatedStyle]}>
        <LinearGradient
          colors={viewed ? ["#666666", "#888888", "#666666"] : [...Gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientRing, { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }]}
        />
      </AnimatedView>
      <View style={[styles.innerContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ringWrapper: {
    position: "absolute",
  },
  gradientRing: {
    padding: 3,
  },
  grayRing: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  innerContainer: {
    backgroundColor: "#0A0A0F",
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
