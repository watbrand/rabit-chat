import React, { useState, useCallback } from "react";
import { StyleSheet, View, Text, Pressable, Platform, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Animation, BorderRadius, Spacing } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface QuickAction {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  color?: string;
}

interface QuickActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: QuickAction[];
  anchorPosition?: { x: number; y: number };
  title?: string;
}

export default function QuickActionsMenu({
  visible,
  onClose,
  actions,
  anchorPosition,
  title,
}: QuickActionsMenuProps) {
  const backdropOpacity = useSharedValue(0);
  const menuScale = useSharedValue(0.8);
  const menuOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      backdropOpacity.value = withSpring(1, Animation.spring);
      menuScale.value = withSpring(1, Animation.springBouncy);
      menuOpacity.value = withSpring(1, Animation.spring);
    } else {
      backdropOpacity.value = withSpring(0, Animation.spring);
      menuScale.value = withSpring(0.8, Animation.spring);
      menuOpacity.value = withSpring(0, Animation.spring);
    }
  }, [visible]);

  const handleActionPress = useCallback((action: QuickAction) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onClose();
    setTimeout(() => action.onPress(), 200);
  }, [onClose]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: visible ? "auto" : "none",
  }));

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: menuScale.value }],
    opacity: menuOpacity.value,
  }));

  if (!visible) return null;

  const menuPosition = anchorPosition
    ? {
        top: Math.min(anchorPosition.y, SCREEN_HEIGHT - 300),
        left: Math.min(Math.max(anchorPosition.x - 100, 16), SCREEN_WIDTH - 216),
      }
    : { top: "40%", alignSelf: "center" };

  return (
    <View style={styles.container} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.menu, menuStyle, menuPosition as any]}>
        {Platform.OS === "ios" ? (
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.blurOverlay} />
          </BlurView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
        )}
        {title ? (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
        ) : null}
        {actions.map((action, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.actionItem,
              pressed && styles.actionItemPressed,
              index < actions.length - 1 && styles.actionItemBorder,
            ]}
            onPress={() => handleActionPress(action)}
          >
            <Ionicons
              name={action.icon as any}
              size={20}
              color={action.destructive ? "#EF4444" : action.color || "#FFFFFF"}
            />
            <Text
              style={[
                styles.actionLabel,
                action.destructive && styles.destructiveLabel,
                action.color && { color: action.color },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

export function useLongPress(onLongPress: (position: { x: number; y: number }) => void) {
  const handleLongPress = useCallback((event: any) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    const { pageX, pageY } = event.nativeEvent;
    onLongPress({ x: pageX, y: pageY });
  }, [onLongPress]);

  return { onLongPress: handleLongPress, delayLongPress: 500 };
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  menu: {
    position: "absolute",
    width: 200,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 30, 45, 0.85)",
  },
  androidBackground: {
    backgroundColor: "rgba(30, 30, 45, 0.98)",
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  actionItemPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  actionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  actionLabel: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  destructiveLabel: {
    color: "#EF4444",
  },
});
