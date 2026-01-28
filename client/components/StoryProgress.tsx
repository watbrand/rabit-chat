import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  cancelAnimation,
  SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Gradients, BorderRadius } from "@/constants/theme";

interface StoryProgressProps {
  totalSegments: number;
  currentSegment: number;
  duration: number;
  isPaused: boolean;
  onSegmentComplete?: () => void;
}

function ProgressSegment({
  index,
  currentIndex,
  progress,
  isPaused,
}: {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
  isPaused: boolean;
}) {
  const segmentProgress = useSharedValue(0);

  useEffect(() => {
    if (index < currentIndex) {
      segmentProgress.value = 1;
    } else if (index > currentIndex) {
      segmentProgress.value = 0;
    } else {
      segmentProgress.value = progress.value;
    }
  }, [currentIndex, index]);

  const animatedStyle = useAnimatedStyle(() => {
    let width: number;
    if (index < currentIndex) {
      width = 100;
    } else if (index > currentIndex) {
      width = 0;
    } else {
      width = progress.value * 100;
    }
    return {
      width: `${width}%`,
    };
  });

  return (
    <View style={styles.segmentContainer}>
      <View style={styles.segmentBackground} />
      <Animated.View style={[styles.segmentFill, animatedStyle]}>
        <LinearGradient
          colors={[...Gradients.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export default function StoryProgress({
  totalSegments,
  currentSegment,
  duration,
  isPaused,
  onSegmentComplete,
}: StoryProgressProps) {
  const progress = useSharedValue(0);
  const pausedProgress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    
    if (!isPaused) {
      progress.value = withTiming(1, {
        duration,
        easing: Easing.linear,
      }, (finished) => {
        if (finished && onSegmentComplete) {
          onSegmentComplete();
        }
      });
    }

    return () => {
      cancelAnimation(progress);
    };
  }, [currentSegment, duration]);

  useEffect(() => {
    if (isPaused) {
      pausedProgress.value = progress.value;
      cancelAnimation(progress);
    } else {
      const remainingDuration = duration * (1 - pausedProgress.value);
      progress.value = withTiming(1, {
        duration: remainingDuration,
        easing: Easing.linear,
      });
    }
  }, [isPaused]);

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSegments }).map((_, index) => (
        <ProgressSegment
          key={index}
          index={index}
          currentIndex={currentSegment}
          progress={progress}
          isPaused={isPaused}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
  },
  segmentContainer: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: "hidden",
  },
  segmentBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 1.5,
  },
  segmentFill: {
    height: "100%",
    borderRadius: 1.5,
    overflow: "hidden",
  },
});
