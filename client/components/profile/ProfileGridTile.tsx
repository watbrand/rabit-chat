import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface ProfileGridTileProps {
  id: string;
  type: string;
  thumbnailUrl: string | null;
  durationMs: number | null;
  likesCount: number;
  viewsCount: number;
  isPinned?: boolean;
  onPress?: () => void;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "";
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

function getTypeIcon(type: string): keyof typeof Feather.glyphMap {
  switch (type) {
    case "VIDEO": return "play";
    case "VOICE": return "mic";
    case "PHOTO": return "image";
    default: return "align-left";
  }
}

export function ProfileGridTile({
  id,
  type,
  thumbnailUrl,
  durationMs,
  likesCount,
  viewsCount,
  isPinned,
  onPress,
}: ProfileGridTileProps) {
  const { theme } = useTheme();

  const showViews = type === "VIDEO" || type === "VOICE";

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.glassBackground }]}
      onPress={onPress}
      testID={`grid-tile-${id}`}
    >
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name={getTypeIcon(type)} size={28} color={theme.textSecondary} />
        </View>
      )}

      <View style={styles.overlay}>
        {isPinned && (
          <View style={[styles.pinnedBadge, { backgroundColor: theme.primary }]}>
            <Feather name="bookmark" size={10} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.typeIcon}>
          <Feather name={getTypeIcon(type)} size={12} color="#FFFFFF" />
        </View>

        {durationMs ? (
          <View style={styles.duration}>
            <ThemedText style={styles.durationText}>{formatDuration(durationMs)}</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.stats}>
        {showViews ? (
          <View style={styles.statItem}>
            <Feather name="eye" size={10} color="#FFFFFF" />
            <ThemedText style={styles.statText}>{formatCount(viewsCount)}</ThemedText>
          </View>
        ) : (
          <View style={styles.statItem}>
            <Feather name="heart" size={10} color="#FFFFFF" />
            <ThemedText style={styles.statText}>{formatCount(likesCount)}</ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    margin: 1,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.xs,
  },
  pinnedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIcon: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 4,
  },
  duration: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  stats: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    padding: Spacing.xs,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
});
