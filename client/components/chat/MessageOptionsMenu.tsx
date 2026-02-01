import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Haptics from "@/lib/safeHaptics";
import * as Clipboard from "expo-clipboard";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, Animation, Fonts } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type MessageType = "TEXT" | "PHOTO" | "VIDEO" | "FILE" | "VOICE" | "LINK";

interface Message {
  id: string;
  content?: string;
  senderId: string;
  type: MessageType;
  createdAt: string;
}

export interface MessageOptionsMenuProps {
  visible: boolean;
  message: Message;
  currentUserId: string;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  onReact: () => void;
}

interface MenuOption {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  visible: boolean;
  destructive?: boolean;
  group: "primary" | "secondary" | "destructive";
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export function MessageOptionsMenu({
  visible,
  message,
  currentUserId,
  onClose,
  onReply,
  onCopy,
  onForward,
  onDeleteForMe,
  onDeleteForEveryone,
  onReact,
}: MessageOptionsMenuProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const isOwnMessage = message.senderId === currentUserId;
  const isTextMessage = message.type === "TEXT";
  const isWithinOneHour = () => {
    const messageTime = new Date(message.createdAt).getTime();
    const now = Date.now();
    return now - messageTime < ONE_HOUR_MS;
  };

  const canDeleteForEveryone = isOwnMessage && isWithinOneHour();

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      translateY.value = withSpring(0, Animation.springBouncy);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, Animation.spring);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const handleOptionPress = (callback: () => void) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    setTimeout(() => {
      callback();
    }, 100);
  };

  const handleCopy = async () => {
    if (message.content) {
      await Clipboard.setStringAsync(message.content);
    }
    onCopy();
  };

  const options: MenuOption[] = [
    {
      id: "reply",
      icon: "corner-up-left",
      label: "Reply",
      onPress: () => handleOptionPress(onReply),
      visible: true,
      group: "primary",
    },
    {
      id: "react",
      icon: "smile",
      label: "React",
      onPress: () => handleOptionPress(onReact),
      visible: true,
      group: "primary",
    },
    {
      id: "copy",
      icon: "copy",
      label: "Copy",
      onPress: () => handleOptionPress(handleCopy),
      visible: isTextMessage && !!message.content,
      group: "primary",
    },
    {
      id: "forward",
      icon: "share",
      label: "Forward",
      onPress: () => handleOptionPress(onForward),
      visible: true,
      group: "secondary",
    },
    {
      id: "deleteForMe",
      icon: "trash-2",
      label: "Delete for Me",
      onPress: () => handleOptionPress(onDeleteForMe),
      visible: true,
      destructive: true,
      group: "destructive",
    },
    {
      id: "deleteForEveryone",
      icon: "trash",
      label: "Delete for Everyone",
      onPress: () => handleOptionPress(onDeleteForEveryone),
      visible: canDeleteForEveryone,
      destructive: true,
      group: "destructive",
    },
  ];

  const visibleOptions = options.filter((opt) => opt.visible);
  const primaryOptions = visibleOptions.filter((opt) => opt.group === "primary");
  const secondaryOptions = visibleOptions.filter((opt) => opt.group === "secondary");
  const destructiveOptions = visibleOptions.filter((opt) => opt.group === "destructive");

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      backdropOpacity.value,
      [0, 1],
      [0, 0.6],
      Extrapolation.CLAMP
    ),
  }));

  const renderOption = (option: MenuOption, isLast: boolean) => {
    const iconColor = option.destructive ? theme.error : theme.text;
    const textColor = option.destructive ? theme.error : theme.text;

    return (
      <Pressable
        key={option.id}
        style={({ pressed }) => [
          styles.optionRow,
          {
            backgroundColor: pressed
              ? isDark
                ? "rgba(139, 92, 246, 0.12)"
                : "rgba(139, 92, 246, 0.08)"
              : "transparent",
          },
          !isLast && {
            borderBottomWidth: 1,
            borderBottomColor: isDark
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(0, 0, 0, 0.06)",
          },
        ]}
        onPress={option.onPress}
        testID={`message-option-${option.id}`}
      >
        <View
          style={[
            styles.optionIconContainer,
            {
              backgroundColor: option.destructive
                ? theme.errorLight
                : isDark
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(139, 92, 246, 0.10)",
            },
          ]}
        >
          <Feather name={option.icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.optionLabel, { color: textColor }]}>
          {option.label}
        </Text>
        <Feather
          name="chevron-right"
          size={18}
          color={theme.textTertiary}
          style={styles.chevron}
        />
      </Pressable>
    );
  };

  const renderGroup = (groupOptions: MenuOption[], showDivider: boolean) => {
    if (groupOptions.length === 0) return null;

    return (
      <>
        <View
          style={[
            styles.optionGroup,
            {
              backgroundColor: isDark
                ? "rgba(26, 26, 36, 0.60)"
                : "rgba(255, 255, 255, 0.85)",
              borderColor: isDark
                ? "rgba(139, 92, 246, 0.25)"
                : "rgba(139, 92, 246, 0.15)",
            },
          ]}
        >
          {groupOptions.map((option, index) =>
            renderOption(option, index === groupOptions.length - 1)
          )}
        </View>
        {showDivider && <View style={styles.groupSpacer} />}
      </>
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            { paddingBottom: insets.bottom + Spacing.lg },
            sheetStyle,
          ]}
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <View
                style={[
                  styles.blurOverlay,
                  {
                    backgroundColor: isDark
                      ? "rgba(20, 20, 30, 0.80)"
                      : "rgba(245, 245, 250, 0.85)",
                  },
                ]}
              />
            </BlurView>
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(20, 20, 30, 0.98)"
                    : "rgba(245, 245, 250, 0.98)",
                },
              ]}
            />
          )}

          <View style={styles.handle} />

          <View style={styles.content}>
            {renderGroup(primaryOptions, secondaryOptions.length > 0 || destructiveOptions.length > 0)}
            {renderGroup(secondaryOptions, destructiveOptions.length > 0)}
            {renderGroup(destructiveOptions, false)}

            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  backgroundColor: pressed
                    ? isDark
                      ? "rgba(139, 92, 246, 0.20)"
                      : "rgba(139, 92, 246, 0.12)"
                    : isDark
                    ? "rgba(26, 26, 36, 0.60)"
                    : "rgba(255, 255, 255, 0.85)",
                  borderColor: isDark
                    ? "rgba(139, 92, 246, 0.25)"
                    : "rgba(139, 92, 246, 0.15)",
                },
              ]}
              onPress={onClose}
              testID="message-option-cancel"
            >
              <Text style={[styles.cancelText, { color: theme.primary }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  sheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  optionGroup: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  groupSpacer: {
    height: Spacing.md,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Fonts?.medium,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
  cancelButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: Fonts?.semiBold,
  },
});
