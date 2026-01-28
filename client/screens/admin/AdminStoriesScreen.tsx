import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { Story, User } from "@shared/schema";

type AdminStory = Story & {
  user: User;
};

type FilterStatus = "all" | "active" | "expired";
type FilterType = "all" | "PHOTO" | "VIDEO";

export default function AdminStoriesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedStory, setSelectedStory] = useState<AdminStory | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const {
    data: stories,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<AdminStory[]>({
    queryKey: ["/api/admin/stories"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/stories?limit=100", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stories");
      return res.json();
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      await apiRequest("DELETE", `/api/admin/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setSelectedStory(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to delete story");
    },
  });

  const filteredStories = useMemo(() => {
    if (!stories) return [];
    const now = new Date();
    return stories.filter((story) => {
      const isExpired = new Date(story.expiresAt) < now;
      if (filterStatus === "active" && isExpired) return false;
      if (filterStatus === "expired" && !isExpired) return false;
      if (filterType !== "all" && story.type !== filterType) return false;
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const username = story.user?.username?.toLowerCase() || "";
        const displayName = story.user?.displayName?.toLowerCase() || "";
        const caption = story.caption?.toLowerCase() || "";
        if (!username.includes(search) && !displayName.includes(search) && !caption.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }, [stories, filterStatus, filterType, searchQuery]);

  const handleDeleteStory = (story: AdminStory) => {
    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
        deleteStoryMutation.mutate(story.id);
      }
    } else {
      Alert.alert(
        "Delete Story",
        "Are you sure you want to delete this story? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteStoryMutation.mutate(story.id),
          },
        ]
      );
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isExpired = (expiresAt: Date | string) => {
    return new Date(expiresAt) < new Date();
  };

  const renderStory = ({ item }: { item: AdminStory }) => {
    const expired = isExpired(item.expiresAt);
    return (
      <Pressable
        onPress={() => {
          setSelectedStory(item);
          setShowActionModal(true);
        }}
      >
        <Card elevation={1} style={styles.storyCard}>
          <View style={styles.storyHeader}>
            <Avatar uri={item.user?.avatarUrl} size={40} />
            <View style={styles.storyInfo}>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {item.user?.displayName || item.user?.username || "Unknown User"}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                @{item.user?.username || "unknown"}
              </ThemedText>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: item.type === "VIDEO" ? "#3B82F615" : "#10B98115" }]}>
              <Feather
                name={item.type === "VIDEO" ? "video" : "image"}
                size={14}
                color={item.type === "VIDEO" ? "#3B82F6" : "#10B981"}
              />
              <ThemedText style={{ fontSize: 11, color: item.type === "VIDEO" ? "#3B82F6" : "#10B981" }}>
                {item.type}
              </ThemedText>
            </View>
          </View>

          {item.thumbnailUrl ? (
            <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : item.mediaUrl ? (
            <Image source={{ uri: item.mediaUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : null}

          {item.caption ? (
            <ThemedText style={styles.caption} numberOfLines={2}>
              {item.caption}
            </ThemedText>
          ) : null}

          <View style={styles.storyMeta}>
            <View style={styles.metaItem}>
              <Feather name="eye" size={14} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                {item.viewsCount || 0} views
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                {formatDate(item.createdAt)}
              </ThemedText>
            </View>
            {expired ? (
              <View style={[styles.statusBadge, { backgroundColor: "#EF444415" }]}>
                <ThemedText style={{ color: "#EF4444", fontSize: 11, fontWeight: "600" }}>Expired</ThemedText>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: "#10B98115" }]}>
                <ThemedText style={{ color: "#10B981", fontSize: 11, fontWeight: "600" }}>Active</ThemedText>
              </View>
            )}
          </View>
        </Card>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <View style={[styles.searchContainer, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search stories..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterGroup}>
          {(["all", "active", "expired"] as FilterStatus[]).map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilterStatus(status)}
              style={[
                styles.filterChip,
                { backgroundColor: filterStatus === status ? theme.primary : theme.backgroundDefault },
              ]}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  color: filterStatus === status ? "#FFFFFF" : theme.text,
                  fontWeight: filterStatus === status ? "600" : "400",
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <View style={styles.filterGroup}>
          {(["all", "PHOTO", "VIDEO"] as FilterType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setFilterType(type)}
              style={[
                styles.filterChip,
                { backgroundColor: filterType === type ? theme.primary : theme.backgroundDefault },
              ]}
            >
              <ThemedText
                style={{
                  fontSize: 12,
                  color: filterType === type ? "#FFFFFF" : theme.text,
                  fontWeight: filterType === type ? "600" : "400",
                }}
              >
                {type === "all" ? "All Types" : type}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredStories}
        keyExtractor={(item) => item.id}
        renderItem={renderStory}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingTop: Spacing.md,
        }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="film" size={48} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No stories found
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
        }
      />

      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowActionModal(false);
          setSelectedStory(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowActionModal(false);
            setSelectedStory(null);
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card elevation={3} style={{ ...styles.modalContent, backgroundColor: theme.backgroundDefault }}>
              <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>
                Story Actions
              </ThemedText>
              {selectedStory ? (
                <>
                  <View style={styles.modalInfo}>
                    <Avatar uri={selectedStory.user?.avatarUrl} size={48} />
                    <View style={{ flex: 1, marginLeft: Spacing.md }}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {selectedStory.user?.displayName || "Unknown"}
                      </ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                        {selectedStory.type} - {selectedStory.viewsCount || 0} views
                      </ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                        Created: {formatDate(selectedStory.createdAt)}
                      </ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                        Expires: {formatDate(selectedStory.expiresAt)}
                      </ThemedText>
                    </View>
                  </View>

                  {selectedStory.caption ? (
                    <View style={[styles.captionBox, { backgroundColor: theme.backgroundRoot }]}>
                      <ThemedText style={{ fontSize: 13 }}>{selectedStory.caption}</ThemedText>
                    </View>
                  ) : null}

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: "#EF444415" }]}
                    onPress={() => {
                      setShowActionModal(false);
                      handleDeleteStory(selectedStory);
                    }}
                    disabled={deleteStoryMutation.isPending}
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                    <ThemedText style={{ color: "#EF4444", fontWeight: "600" }}>Delete Story</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.backgroundRoot }]}
                    onPress={() => {
                      setShowActionModal(false);
                      setSelectedStory(null);
                    }}
                  >
                    <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                  </Pressable>
                </>
              ) : null}
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterGroup: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  storyCard: {
    padding: Spacing.md,
  },
  storyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  storyInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  thumbnail: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  caption: {
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  storyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: "auto",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    padding: Spacing.xl,
  },
  modalInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  captionBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
});
