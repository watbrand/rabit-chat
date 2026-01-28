import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface UserNoteDisplayProps {
  note: {
    id: string;
    content: string;
    expiresAt: string;
    createdAt: string;
  };
  avatarUrl?: string | null;
  onPress?: () => void;
}

export function UserNoteDisplay({ note, avatarUrl, onPress }: UserNoteDisplayProps) {
  const { theme } = useTheme();

  const timeRemaining = () => {
    const expiresAt = new Date(note.expiresAt);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
    if (hoursLeft > 1) return `${hoursLeft}h left`;
    const minsLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)));
    return `${minsLeft}m left`;
  };

  return (
    <Pressable 
      style={[styles.container, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
      onPress={onPress}
      testID="user-note-display"
    >
      <View style={styles.avatarContainer}>
        <Avatar uri={avatarUrl} size={44} />
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.noteBubble}
        >
          <ThemedText style={styles.noteText} numberOfLines={2}>
            {note.content}
          </ThemedText>
        </LinearGradient>
      </View>
      <View style={styles.timeContainer}>
        <Feather name="clock" size={10} color={theme.textSecondary} />
        <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
          {timeRemaining()}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  noteBubble: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    maxWidth: "75%",
  },
  noteText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
  },
});