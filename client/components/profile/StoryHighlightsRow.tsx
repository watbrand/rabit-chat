import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface StoryHighlight {
  id: string;
  name: string;
  coverUrl?: string | null;
  itemCount?: number;
}

interface StoryHighlightsRowProps {
  highlights: StoryHighlight[];
  isOwner?: boolean;
  onAddHighlight?: () => void;
  onHighlightPress?: (highlightId: string) => void;
  onEditHighlights?: () => void;
}

export function StoryHighlightsRow({ 
  highlights, 
  isOwner, 
  onAddHighlight, 
  onHighlightPress,
  onEditHighlights 
}: StoryHighlightsRowProps) {
  const { theme } = useTheme();

  if (highlights.length === 0 && !isOwner) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Highlights
        </ThemedText>
        {isOwner && highlights.length > 0 ? (
          <Pressable onPress={onEditHighlights} testID="button-edit-highlights">
            <Feather name="edit-2" size={14} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isOwner ? (
          <Pressable 
            style={styles.highlightItem}
            onPress={onAddHighlight}
            testID="button-add-highlight"
          >
            <View style={[styles.addCircle, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}>
              <Feather name="plus" size={24} color={theme.primary} />
            </View>
            <ThemedText style={[styles.highlightName, { color: theme.textSecondary }]} numberOfLines={1}>
              New
            </ThemedText>
          </Pressable>
        ) : null}
        
        {highlights.map((highlight) => (
          <Pressable 
            key={highlight.id}
            style={styles.highlightItem}
            onPress={() => onHighlightPress?.(highlight.id)}
            testID={`highlight-${highlight.id}`}
          >
            {highlight.coverUrl ? (
              <View style={[styles.highlightCircle, { borderColor: theme.primary }]}>
                <Image
                  source={{ uri: highlight.coverUrl }}
                  style={styles.highlightImage}
                  contentFit="cover"
                />
              </View>
            ) : (
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={[styles.highlightCircle, { borderWidth: 0 }]}
              >
                <Feather name="folder" size={24} color="#FFF" />
              </LinearGradient>
            )}
            <ThemedText style={[styles.highlightName, { color: theme.text }]} numberOfLines={1}>
              {highlight.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  highlightItem: {
    alignItems: "center",
    width: 70,
  },
  addCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  highlightImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  highlightName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});