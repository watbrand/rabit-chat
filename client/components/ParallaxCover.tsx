import React from "react";
import { StyleSheet, Dimensions, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COVER_HEIGHT = 280;
const PARALLAX_FACTOR = 0.5;

interface ParallaxCoverProps {
  imageUrl?: string | null;
  scrollY: SharedValue<number>;
  height?: number;
}

export default function ParallaxCover({
  imageUrl,
  scrollY,
  height = COVER_HEIGHT,
}: ParallaxCoverProps) {
  const animatedImageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-height, 0, height],
      [-height * PARALLAX_FACTOR, 0, height * PARALLAX_FACTOR],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-height, 0],
      [1.5, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const gradientAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, height * 0.5],
      [0.6, 0.9],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <Animated.View style={[styles.container, { height }]}>
      <Animated.View style={[styles.imageWrapper, animatedImageStyle]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f3460"]}
            style={styles.image}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
      </Animated.View>
      <Animated.View style={[styles.gradient, gradientAnimatedStyle]}>
        <LinearGradient
          colors={["transparent", "rgba(10, 10, 15, 0.3)", "rgba(10, 10, 15, 0.95)", "#0A0A0F"]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.3, 0.7, 1]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    overflow: "hidden",
    position: "relative",
  },
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: "100%",
    height: "150%",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
