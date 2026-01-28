import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

export type MessageType = "TEXT" | "PHOTO" | "VIDEO" | "FILE" | "VOICE" | "LINK";

export interface ReplyMessagePreviewProps {
  message: {
    id: string;
    content: string;
    senderName: string;
    type: MessageType;
  };
  onClose: () => void;
  isOwn?: boolean;
}

function getTypeIndicator(type: MessageType): string {
  switch (type) {
    case "PHOTO":
      return "Photo";
    case "VIDEO":
      return "Video";
    case "FILE":
      return "File";
    case "VOICE":
      return "Voice message";
    case "LINK":
      return "Link";
    case "TEXT":
    default:
      return "";
  }
}

export function ReplyMessagePreview({
  message,
  onClose,
  isOwn = false,
}: ReplyMessagePreviewProps) {
  const { theme, isDark } = useTheme();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [message.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const typeIndicator = getTypeIndicator(message.type);
  
  // Truncate content to 50 characters
  const truncatedContent = message.content.length > 50
    ? message.content.substring(0, 50) + "…"
    : message.content;

  const displayText = typeIndicator
    ? `${typeIndicator}: ${truncatedContent}`
    : truncatedContent;

  const borderColor = isOwn ? theme.primary : theme.textTertiary;
  const backgroundColor = isDark
    ? theme.backgroundSecondary
    : theme.backgroundSecondary;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          backgroundColor,
          borderLeftColor: borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText type="callout" weight="semiBold" numberOfLines={1}>
          {message.senderName}
        </ThemedText>
        <ThemedText
          type="footnote"
          weight="regular"
          numberOfLines={2}
          style={{ marginTop: Spacing.xs }}
        >
          {displayText}
        </ThemedText>
      </View>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && styles.closeButtonPressed,
        ]}
        hitSlop={8}
        testID="button-close-reply-preview"
      >
        <Feather
          name="x"
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderLeftWidth: 4,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        ...Shadows.sm,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  content: {
    flex: 1,
    marginRight: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  closeButtonPressed: {
    opacity: 0.6,
  },
});
