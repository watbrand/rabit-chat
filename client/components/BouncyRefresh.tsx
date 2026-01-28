import React, { useCallback } from "react";
import { StyleSheet, Platform, RefreshControl, RefreshControlProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Gradients } from "@/constants/theme";

interface BouncyRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  colors?: string[];
}

export function useBouncyRefresh(onRefresh: () => void) {
  const isRefreshing = useSharedValue(false);
  const pullProgress = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    triggerHaptic();
    isRefreshing.value = true;
    onRefresh();
  }, [onRefresh, triggerHaptic]);

  const setRefreshing = useCallback((value: boolean) => {
    isRefreshing.value = value;
    if (!value) {
      pullProgress.value = 0;
    }
  }, []);

  return {
    isRefreshing,
    pullProgress,
    handleRefresh,
    setRefreshing,
  };
}

export default function BouncyRefresh({
  refreshing,
  onRefresh,
  colors = [...Gradients.primary],
}: BouncyRefreshProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const bounceY = useSharedValue(0);

  React.useEffect(() => {
    if (refreshing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 8 }),
          withSpring(0.9, { damping: 8 })
        ),
        -1,
        true
      );
      bounceY.value = withRepeat(
        withSequence(
          withSpring(-5, { damping: 6 }),
          withSpring(5, { damping: 6 })
        ),
        -1,
        true
      );
    } else {
      rotation.value = 0;
      scale.value = withSpring(1, { damping: 15 });
      bounceY.value = withSpring(0, { damping: 15 });
    }
  }, [refreshing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
      { translateY: bounceY.value },
    ],
  }));

  const handleRefresh = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onRefresh();
  }, [onRefresh]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={colors[0]}
      colors={colors}
      progressBackgroundColor="rgba(10, 10, 15, 0.9)"
      title="Pull to refresh"
      titleColor={colors[0]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
