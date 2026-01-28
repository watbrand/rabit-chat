import React from "react";
import { StyleSheet, View, Text, Platform, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Gradients, Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CollapsibleHeaderProps {
  scrollY: SharedValue<number>;
  title: string;
  subtitle?: string;
  expandedHeight?: number;
  collapsedHeight?: number;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  backgroundImage?: string;
}

export default function CollapsibleHeader({
  scrollY,
  title,
  subtitle,
  expandedHeight = 200,
  collapsedHeight = 60,
  leftComponent,
  rightComponent,
  backgroundImage,
}: CollapsibleHeaderProps) {
  const insets = useSafeAreaInsets();
  const totalExpandedHeight = expandedHeight + insets.top;
  const totalCollapsedHeight = collapsedHeight + insets.top;

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, expandedHeight - collapsedHeight],
      [totalExpandedHeight, totalCollapsedHeight],
      Extrapolation.CLAMP
    );

    return { height };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      scrollY.value,
      [0, expandedHeight - collapsedHeight],
      [28, 18],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, expandedHeight - collapsedHeight],
      [0, -10],
      Extrapolation.CLAMP
    );

    const translateX = interpolate(
      scrollY.value,
      [0, expandedHeight - collapsedHeight],
      [0, leftComponent ? 40 : 0],
      Extrapolation.CLAMP
    );

    return {
      fontSize,
      transform: [{ translateY }, { translateX }],
    };
  });

  const subtitleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, (expandedHeight - collapsedHeight) * 0.5],
      [1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, expandedHeight - collapsedHeight],
      [0, -20],
      Extrapolation.CLAMP
    );

    return { opacity, transform: [{ translateY }] };
  });

  const blurAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, (expandedHeight - collapsedHeight) * 0.7],
      [0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <Animated.View style={[styles.container, headerAnimatedStyle]}>
      <LinearGradient
        colors={["rgba(10, 10, 15, 0.9)", "rgba(10, 10, 15, 0.7)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.blurContainer, blurAnimatedStyle]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
      </Animated.View>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <View style={styles.topRow}>
          <View style={styles.leftContainer}>{leftComponent}</View>
          <View style={styles.rightContainer}>{rightComponent}</View>
        </View>
        <View style={styles.titleContainer}>
          <Animated.Text style={[styles.title, titleAnimatedStyle]}>
            {title}
          </Animated.Text>
          {subtitle ? (
            <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
              {subtitle}
            </Animated.Text>
          ) : null}
        </View>
      </View>
      <View style={styles.bottomBorder} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBlur: {
    backgroundColor: "rgba(10, 10, 15, 0.95)",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
  },
  leftContainer: {
    minWidth: 40,
  },
  rightContainer: {
    minWidth: 40,
    alignItems: "flex-end",
  },
  titleContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: Spacing.md,
  },
  title: {
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4,
  },
  bottomBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
});
