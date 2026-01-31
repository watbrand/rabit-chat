import React, { useState } from "react";
import { View, StyleSheet, Pressable, FlatList, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { PostWithAuthor, PostType } from "@shared/schema";

interface StudioContentItem {
  post: PostWithAuthor;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalWatchTimeMs: number;
  avgWatchTimeMs: number;
  completionRate: number;
}

type SortOption = "views" | "likes" | "comments" | "shares" | "watchTime";
type TypeFilter = PostType | "ALL";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatWatchTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const POST_TYPE_ICONS: Record<PostType, string> = {
  TEXT: "file-text",
  PHOTO: "image",
  VIDEO: "video",
  VOICE: "mic",
};

export default function StudioContentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [sortBy, setSortBy] = useState<SortOption>("views");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");

  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = new Date();

  const { data: content, isLoading, isError, error, refetch, isRefetching } = useQuery<StudioContentItem[]>({
    queryKey: ["/api/studio/content", sortBy, typeFilter],
    queryFn: async () => {
      const url = new URL("/api/studio/content", getApiUrl());
      url.searchParams.set("startDate", startDate.toISOString());
      url.searchParams.set("endDate", endDate.toISOString());
      url.searchParams.set("sortBy", sortBy);
      if (typeFilter !== "ALL") {
        url.searchParams.set("type", typeFilter);
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
  });

  const TypeButton = ({ type, label }: { type: TypeFilter; label: string }) => (
    <Pressable
      style={[
        styles.filterButton,
        typeFilter === type && { backgroundColor: theme.primary },
        { borderColor: theme.glassBorder },
      ]}
      onPress={() => setTypeFilter(type)}
    >
      <ThemedText
        style={[styles.filterText, { color: typeFilter === type ? "#fff" : theme.textSecondary }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const SortButton = ({ sort, label, icon }: { sort: SortOption; label: string; icon: string }) => (
    <Pressable
      style={[
        styles.sortButton,
        sortBy === sort && { backgroundColor: theme.primary + "20" },
      ]}
      onPress={() => setSortBy(sort)}
    >
      <Feather
        name={icon as any}
        size={14}
        color={sortBy === sort ? theme.primary : theme.textSecondary}
      />
      <ThemedText
        style={[styles.sortText, { color: sortBy === sort ? theme.primary : theme.textSecondary }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  if (isError) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState
          icon="alert-circle"
          title="Something went wrong"
          message={(error as Error)?.message || "Failed to load content. Please try again."}
          actionLabel="Try Again"
          onAction={refetch}
        />
      </ThemedView>
    );
  }

  const renderContentItem = ({ item }: { item: StudioContentItem }) => {
    const isMediaPost = item.post.type === "VIDEO" || item.post.type === "VOICE" || item.post.type === "PHOTO";

    return (
      <Pressable
        onPress={() => navigation.navigate("StudioPostDetail", { postId: item.post.id })}
      >
        <Card style={styles.contentCard}>
          <View style={styles.contentRow}>
            {isMediaPost && item.post.thumbnailUrl ? (
              <Image
                source={{ uri: item.post.thumbnailUrl }}
                style={styles.thumbnail}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.glassBackground }]}>
                <Feather
                  name={POST_TYPE_ICONS[item.post.type] as any}
                  size={24}
                  color={theme.textSecondary}
                />
              </View>
            )}
            <View style={styles.contentInfo}>
              <ThemedText numberOfLines={2} style={styles.contentTitle}>
                {item.post.caption || item.post.content || "Untitled"}
              </ThemedText>
              <View style={styles.contentMeta}>
                <Feather name={POST_TYPE_ICONS[item.post.type] as any} size={12} color={theme.textSecondary} />
                <ThemedText style={[styles.contentMetaText, { color: theme.textSecondary }]}>
                  {item.post.type}
                </ThemedText>
                <ThemedText style={[styles.contentMetaText, { color: theme.textSecondary }]}>
                  {new Date(item.post.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>

          <View style={[styles.statsRow, { borderTopColor: theme.glassBorder }]}>
            <View style={styles.statItem}>
              <Feather name="eye" size={14} color={theme.textSecondary} />
              <ThemedText style={styles.statValue}>{formatNumber(item.views)}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="heart" size={14} color={theme.textSecondary} />
              <ThemedText style={styles.statValue}>{formatNumber(item.likes)}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="message-circle" size={14} color={theme.textSecondary} />
              <ThemedText style={styles.statValue}>{formatNumber(item.comments)}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <Feather name="share-2" size={14} color={theme.textSecondary} />
              <ThemedText style={styles.statValue}>{formatNumber(item.shares)}</ThemedText>
            </View>
            {(item.post.type === "VIDEO" || item.post.type === "VOICE") ? (
              <View style={styles.statItem}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText style={styles.statValue}>{formatWatchTime(item.totalWatchTimeMs)}</ThemedText>
              </View>
            ) : null}
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <View style={[styles.filtersContainer, { paddingTop: Platform.OS === "android" ? Spacing.md : headerHeight + Spacing.md }]}>
        <View style={styles.typeFilters}>
          <TypeButton type="ALL" label="All" />
          <TypeButton type="TEXT" label="Text" />
          <TypeButton type="PHOTO" label="Photo" />
          <TypeButton type="VIDEO" label="Video" />
          <TypeButton type="VOICE" label="Voice" />
        </View>
        <View style={styles.sortRow}>
          <ThemedText style={{ color: theme.textSecondary, marginRight: Spacing.sm }}>Sort:</ThemedText>
          <SortButton sort="views" label="Views" icon="eye" />
          <SortButton sort="likes" label="Likes" icon="heart" />
          <SortButton sort="comments" label="Comments" icon="message-circle" />
          <SortButton sort="watchTime" label="Time" icon="clock" />
        </View>
      </View>

      <FlatList
        data={content || []}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.post.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="file-text" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No content yet. Create your first post!
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  typeFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    fontWeight: "500",
  },
  contentCard: {
    padding: 0,
    overflow: "hidden",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  contentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  contentMetaText: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    justifyContent: "space-around",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
});
