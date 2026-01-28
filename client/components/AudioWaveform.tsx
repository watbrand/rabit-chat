import React, { useEffect, useMemo } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
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
import { LinearGradient } from "expo-linear-gradient";
import { Gradients } from "@/constants/theme";

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  width?: number;
  height?: number;
  colors?: string[];
}

interface WaveBarProps {
  index: number;
  isPlaying: boolean;
  height: number;
  delay: number;
  colors: string[];
}

function WaveBar({ index, isPlaying, height, delay, colors }: WaveBarProps) {
  const scaleY = useSharedValue(0.3);
  const minHeight = 0.2;
  const maxHeight = 1;

  useEffect(() => {
    if (isPlaying) {
      scaleY.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(minHeight + Math.random() * (maxHeight - minHeight), {
              duration: 200 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(minHeight + Math.random() * (maxHeight - minHeight), {
              duration: 200 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(maxHeight * (0.3 + Math.random() * 0.7), {
              duration: 150 + Math.random() * 150,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        )
      );
    } else {
      scaleY.value = withTiming(0.3, { duration: 300 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View style={[styles.barWrapper, { height }, animatedStyle]}>
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.bar}
      />
    </Animated.View>
  );
}

export default function AudioWaveform({
  isPlaying,
  barCount = 32,
  width = Dimensions.get("window").width - 100,
  height = 40,
  colors = [...Gradients.primary],
}: AudioWaveformProps) {
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => ({
      index: i,
      delay: i * 30,
    }));
  }, [barCount]);

  const barWidth = (width - (barCount - 1) * 2) / barCount;

  return (
    <View style={[styles.container, { width, height }]}>
      {bars.map((bar) => (
        <WaveBar
          key={bar.index}
          index={bar.index}
          isPlaying={isPlaying}
          height={height}
          delay={bar.delay}
          colors={colors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    transformOrigin: "bottom",
  },
  bar: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
  },
});
