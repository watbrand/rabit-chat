import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safeStorage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CoachingMarkProps {
  id: string;
  title: string;
  description: string;
  position: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  arrowDirection: "up" | "down" | "left" | "right";
  onDismiss?: () => void;
  order?: number;
  totalSteps?: number;
}

const COACHING_MARKS_SEEN_KEY = "@coaching_marks_seen";

export function useCoachingMarks(markIds: string[]) {
  const [seenMarks, setSeenMarks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSeenMarks();
  }, []);

  const loadSeenMarks = async () => {
    try {
      const stored = await safeGetItem(COACHING_MARKS_SEEN_KEY);
      if (stored) {
        setSeenMarks(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Failed to load coaching marks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsSeen = async (markId: string) => {
    const newSeenMarks = new Set([...seenMarks, markId]);
    setSeenMarks(newSeenMarks);
    try {
      await safeSetItem(
        COACHING_MARKS_SEEN_KEY,
        JSON.stringify([...newSeenMarks])
      );
    } catch (error) {
      console.error("Failed to save coaching mark:", error);
    }
  };

  const resetAllMarks = async () => {
    setSeenMarks(new Set());
    try {
      await safeRemoveItem(COACHING_MARKS_SEEN_KEY);
    } catch (error) {
      console.error("Failed to reset coaching marks:", error);
    }
  };

  const shouldShowMark = (markId: string) => !seenMarks.has(markId) && !isLoading;

  return {
    seenMarks,
    isLoading,
    markAsSeen,
    resetAllMarks,
    shouldShowMark,
  };
}

export default function CoachingMark({
  id,
  title,
  description,
  position,
  arrowDirection,
  onDismiss,
  order = 1,
  totalSteps = 1,
}: CoachingMarkProps) {
  const { theme, isDark } = useTheme();
  const pulseScale = useSharedValue(1);
  const arrowY = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    arrowY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => {
    if (arrowDirection === "up" || arrowDirection === "down") {
      return { transform: [{ translateY: arrowY.value }] };
    }
    return { transform: [{ translateX: arrowY.value }] };
  });

  const getArrowPosition = () => {
    switch (arrowDirection) {
      case "up":
        return { top: -12, left: "50%", marginLeft: -10 };
      case "down":
        return { bottom: -12, left: "50%", marginLeft: -10 };
      case "left":
        return { left: -12, top: "50%", marginTop: -10 };
      case "right":
        return { right: -12, top: "50%", marginTop: -10 };
    }
  };

  const getArrowRotation = () => {
    switch (arrowDirection) {
      case "up":
        return "0deg";
      case "down":
        return "180deg";
      case "left":
        return "-90deg";
      case "right":
        return "90deg";
    }
  };

  return (
    <Modal transparent visible animationType="fade">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.tooltipContainer,
            position,
          ]}
        >
          <Animated.View style={[styles.arrowContainer, getArrowPosition() as any, arrowStyle]}>
            <View
              style={[
                styles.arrow,
                {
                  transform: [{ rotate: getArrowRotation() }],
                  borderBottomColor: isDark ? "rgba(139, 92, 246, 0.9)" : "rgba(139, 92, 246, 0.95)",
                },
              ]}
            />
          </Animated.View>

          {Platform.OS === "ios" ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={styles.tooltipBlur}
            >
              <View style={[styles.tooltipContent, { borderColor: theme.primary + "50" }]}>
                <View style={styles.headerRow}>
                  <Animated.View style={pulseStyle}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.primary + "30" }]}>
                      <Feather name="info" size={18} color={theme.primary} />
                    </View>
                  </Animated.View>
                  {totalSteps > 1 ? (
                    <ThemedText style={[styles.stepIndicator, { color: theme.textSecondary }]}>
                      {order}/{totalSteps}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText style={styles.tooltipTitle}>{title}</ThemedText>
                <ThemedText style={[styles.tooltipDescription, { color: theme.textSecondary }]}>
                  {description}
                </ThemedText>
                <Pressable
                  style={[styles.gotItButton, { backgroundColor: theme.primary }]}
                  onPress={onDismiss}
                >
                  <ThemedText style={styles.gotItText}>Got it</ThemedText>
                </Pressable>
              </View>
            </BlurView>
          ) : (
            <View
              style={[
                styles.tooltipContent,
                {
                  backgroundColor: isDark ? "rgba(30, 30, 40, 0.95)" : "rgba(255, 255, 255, 0.98)",
                  borderColor: theme.primary + "50",
                },
              ]}
            >
              <View style={styles.headerRow}>
                <Animated.View style={pulseStyle}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.primary + "30" }]}>
                    <Feather name="info" size={18} color={theme.primary} />
                  </View>
                </Animated.View>
                {totalSteps > 1 ? (
                  <ThemedText style={[styles.stepIndicator, { color: theme.textSecondary }]}>
                    {order}/{totalSteps}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText style={styles.tooltipTitle}>{title}</ThemedText>
              <ThemedText style={[styles.tooltipDescription, { color: theme.textSecondary }]}>
                {description}
              </ThemedText>
              <Pressable
                style={[styles.gotItButton, { backgroundColor: theme.primary }]}
                onPress={onDismiss}
              >
                <ThemedText style={styles.gotItText}>Got it</ThemedText>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function CoachingMarkSequence({
  marks,
  onComplete,
}: {
  marks: Omit<CoachingMarkProps, "order" | "totalSteps" | "onDismiss">[];
  onComplete?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { seenMarks, markAsSeen, shouldShowMark, isLoading } = useCoachingMarks(
    marks.map((m) => m.id)
  );

  const visibleMarks = marks.filter((m) => shouldShowMark(m.id));

  if (isLoading || visibleMarks.length === 0) {
    return null;
  }

  const currentMark = visibleMarks[currentIndex];
  if (!currentMark) {
    onComplete?.();
    return null;
  }

  const handleDismiss = async () => {
    await markAsSeen(currentMark.id);
    if (currentIndex < visibleMarks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete?.();
    }
  };

  return (
    <CoachingMark
      {...currentMark}
      order={currentIndex + 1}
      totalSteps={visibleMarks.length}
      onDismiss={handleDismiss}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  tooltipContainer: {
    position: "absolute",
    maxWidth: 300,
    minWidth: 250,
  },
  tooltipBlur: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  tooltipContent: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: "600",
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  tooltipDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  gotItButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  gotItText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  arrowContainer: {
    position: "absolute",
    width: 20,
    height: 20,
    zIndex: 1,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
