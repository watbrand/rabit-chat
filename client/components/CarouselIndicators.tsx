import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Gradients } from "@/constants/theme";

interface CarouselIndicatorsProps {
  count: number;
  activeIndex: number;
  scrollX?: SharedValue<number>;
  itemWidth?: number;
  style?: any;
}

function AnimatedDot({
  index,
  activeIndex,
  scrollX,
  itemWidth,
}: {
  index: number;
  activeIndex: number;
  scrollX?: SharedValue<number>;
  itemWidth?: number;
}) {
  const dotStyle = useAnimatedStyle(() => {
    if (scrollX && itemWidth) {
      const inputRange = [
        (index - 1) * itemWidth,
        index * itemWidth,
        (index + 1) * itemWidth,
      ];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [0.8, 1.2, 0.8],
        Extrapolation.CLAMP
      );

      const width = interpolate(
        scrollX.value,
        inputRange,
        [8, 24, 8],
        Extrapolation.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.4, 1, 0.4],
        Extrapolation.CLAMP
      );

      return {
        transform: [{ scale }],
        width,
        opacity,
      };
    }

    const isActive = index === activeIndex;
    return {
      transform: [{ scale: isActive ? 1.2 : 0.8 }],
      width: isActive ? 24 : 8,
      opacity: isActive ? 1 : 0.4,
    };
  });

  const isActive = index === activeIndex;

  return (
    <Animated.View style={[styles.dot, dotStyle]}>
      {isActive ? (
        <LinearGradient
          colors={[...Gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={styles.inactiveDot} />
      )}
    </Animated.View>
  );
}

export default function CarouselIndicators({
  count,
  activeIndex,
  scrollX,
  itemWidth,
  style,
}: CarouselIndicatorsProps) {
  if (count <= 1) return null;

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <AnimatedDot
          key={index}
          index={index}
          activeIndex={activeIndex}
          scrollX={scrollX}
          itemWidth={itemWidth}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  inactiveDot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});
