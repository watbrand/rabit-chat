import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface UserInterest {
  id: string;
  interest: string;
}

interface InterestsTagsProps {
  interests: UserInterest[];
  isOwner?: boolean;
  onEditInterests?: () => void;
}

export function InterestsTags({ interests, isOwner, onEditInterests }: InterestsTagsProps) {
  const { theme } = useTheme();

  if (interests.length === 0) {
    if (isOwner) {
      return (
        <Pressable 
          style={[styles.addButton, { borderColor: theme.glassBorder }]}
          onPress={onEditInterests}
          testID="button-add-interests"
        >
          <Feather name="hash" size={14} color={theme.textSecondary} />
          <ThemedText style={{ color: theme.textSecondary, marginLeft: Spacing.xs, fontSize: 13 }}>
            Add interests
          </ThemedText>
        </Pressable>
      );
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Interests
        </ThemedText>
        {isOwner ? (
          <Pressable onPress={onEditInterests} testID="button-edit-interests">
            <Feather name="edit-2" size={14} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
      >
        {interests.map((item) => (
          <View 
            key={item.id}
            style={[styles.tag, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}
          >
            <ThemedText style={[styles.tagText, { color: theme.primary }]}>
              #{item.interest}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingRight: Spacing.lg,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderTopWidth: 1,
  },
});