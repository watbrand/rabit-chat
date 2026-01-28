import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface PinnedPost {
  id: string;
  type: string;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  durationMs: number | null;
  caption: string | null;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
}

interface Playlist {
  id: string;
  title: string;
  type: string;
  itemCount: number;
  isPublic: boolean;
}

interface FeaturedIntro {
  id: string;
  title: string;
  body: string;
  ctaText: string | null;
  ctaUrl: string | null;
}

interface FeaturedZoneProps {
  pinnedPosts: PinnedPost[];
  playlists: Playlist[];
  featuredIntro: FeaturedIntro | null;
  onPostPress?: (postId: string) => void;
  onPlaylistPress?: (playlistId: string) => void;
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
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getTypeIcon(type: string): keyof typeof Feather.glyphMap {
  switch (type) {
    case "VIDEO": return "video";
    case "VOICE": return "mic";
    case "PHOTO": return "image";
    default: return "file-text";
  }
}

export function FeaturedZone({
  pinnedPosts,
  playlists,
  featuredIntro,
  onPostPress,
  onPlaylistPress,
}: FeaturedZoneProps) {
  const { theme } = useTheme();

  const hasContent = pinnedPosts.length > 0 || playlists.length > 0 || featuredIntro;
  if (!hasContent) return null;

  const handleCtaPress = async (url: string | null) => {
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    try {
      await Linking.openURL(fullUrl);
    } catch {
      Alert.alert("Cannot open link");
    }
  };

  return (
    <View style={styles.container}>
      {featuredIntro && (
        <Card elevation={2} style={styles.introCard}>
          <ThemedText type="h4" style={styles.introTitle}>
            {featuredIntro.title}
          </ThemedText>
          <ThemedText style={[styles.introBody, { color: theme.textSecondary }]}>
            {featuredIntro.body}
          </ThemedText>
          {featuredIntro.ctaText && featuredIntro.ctaUrl ? (
            <Pressable
              style={[styles.ctaButton, { backgroundColor: theme.primary }]}
              onPress={() => handleCtaPress(featuredIntro.ctaUrl)}
            >
              <ThemedText style={styles.ctaText}>{featuredIntro.ctaText}</ThemedText>
              <Feather name="external-link" size={14} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </Card>
      )}

      {pinnedPosts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="bookmark" size={16} color={theme.text} />
            <ThemedText style={styles.sectionTitle}>Pinned</ThemedText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pinnedScroll}
          >
            {pinnedPosts.map((post) => (
              <Pressable
                key={post.id}
                style={[styles.pinnedCard, { backgroundColor: theme.glassBackground }]}
                onPress={() => onPostPress?.(post.id)}
                testID={`pinned-post-${post.id}`}
              >
                {post.thumbnailUrl || post.mediaUrl ? (
                  <Image
                    source={{ uri: post.thumbnailUrl || post.mediaUrl || "" }}
                    style={styles.pinnedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.pinnedPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                    <Feather name={getTypeIcon(post.type)} size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.pinnedOverlay}>
                  <View style={styles.pinnedTypeIcon}>
                    <Feather name={getTypeIcon(post.type)} size={12} color="#FFFFFF" />
                  </View>
                  {post.durationMs ? (
                    <ThemedText style={styles.pinnedDuration}>
                      {formatDuration(post.durationMs)}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.pinnedStats}>
                  <View style={styles.pinnedStat}>
                    <Feather name="heart" size={10} color={theme.textSecondary} />
                    <ThemedText style={[styles.pinnedStatText, { color: theme.textSecondary }]}>
                      {formatCount(post.likesCount)}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {playlists.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="list" size={16} color={theme.text} />
            <ThemedText style={styles.sectionTitle}>Playlists</ThemedText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.playlistScroll}
          >
            {playlists.map((playlist) => (
              <Pressable
                key={playlist.id}
                style={[styles.playlistCard, { backgroundColor: theme.glassBackground }]}
                onPress={() => onPlaylistPress?.(playlist.id)}
                testID={`playlist-${playlist.id}`}
              >
                <View
                  style={[
                    styles.playlistIcon,
                    { backgroundColor: playlist.type === "VIDEO" ? theme.primary : theme.gold },
                  ]}
                >
                  <Feather
                    name={playlist.type === "VIDEO" ? "video" : "mic"}
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <ThemedText style={styles.playlistTitle} numberOfLines={1}>
                  {playlist.title}
                </ThemedText>
                <ThemedText style={[styles.playlistCount, { color: theme.textSecondary }]}>
                  {playlist.itemCount} {playlist.type === "VIDEO" ? "videos" : "voice notes"}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  introCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  introTitle: {
    marginBottom: Spacing.sm,
  },
  introBody: {
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  pinnedScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  pinnedCard: {
    width: 120,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  pinnedImage: {
    width: "100%",
    height: 160,
  },
  pinnedPlaceholder: {
    width: "100%",
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedOverlay: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pinnedTypeIcon: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 4,
  },
  pinnedDuration: {
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "#FFFFFF",
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinnedStats: {
    padding: Spacing.sm,
  },
  pinnedStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinnedStatText: {
    fontSize: 11,
  },
  playlistScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  playlistCard: {
    width: 140,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  playlistIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  playlistTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  playlistCount: {
    fontSize: 12,
    marginTop: 4,
  },
});
