import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
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
import type { Post, User } from "@shared/schema";

type AdminPost = Post & {
  author: User;
};

type FilterStatus = "all" | "visible" | "hidden" | "featured" | "deleted";
type FilterType = "all" | "TEXT" | "PHOTO" | "VIDEO" | "VOICE";

export default function AdminPostsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [hideReason, setHideReason] = useState("");
  const [showHideInput, setShowHideInput] = useState(false);
  const [showSoftDeleteInput, setShowSoftDeleteInput] = useState(false);
  const [softDeleteReason, setSoftDeleteReason] = useState("");

  const {
    data: posts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<AdminPost[]>({
    queryKey: ["/api/admin/posts"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/posts", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const hidePostMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      await apiRequest("PATCH", `/api/admin/posts/${postId}`, { action: "hide", reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setShowHideInput(false);
      setHideReason("");
      setSelectedPost(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to hide post");
    },
  });

  const unhidePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("PATCH", `/api/admin/posts/${postId}`, { action: "unhide" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setSelectedPost(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to unhide post");
    },
  });

  const featurePostMutation = useMutation({
    mutationFn: async ({ postId, featured }: { postId: string; featured: boolean }) => {
      await apiRequest("PATCH", `/api/admin/posts/${postId}`, { action: featured ? "feature" : "unfeature" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setSelectedPost(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update post");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/admin/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setSelectedPost(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to delete post");
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason?: string }) => {
      await apiRequest("PATCH", `/api/admin/posts/${postId}`, { action: "soft_delete", reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setShowSoftDeleteInput(false);
      setSoftDeleteReason("");
      setSelectedPost(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to soft delete post");
    },
  });

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let result = posts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          (post.content || post.caption || "").toLowerCase().includes(query) ||
          (post.author?.username?.toLowerCase() || '').includes(query) ||
          (post.author?.displayName?.toLowerCase() || '').includes(query)
      );
    }

    if (filterType !== "all") {
      result = result.filter((post) => post.type === filterType);
    }

    switch (filterStatus) {
      case "visible":
        result = result.filter((post) => !post.isHidden && !post.deletedAt);
        break;
      case "hidden":
        result = result.filter((post) => post.isHidden);
        break;
      case "featured":
        result = result.filter((post) => post.isFeatured);
        break;
      case "deleted":
        result = result.filter((post) => !!post.deletedAt);
        break;
    }

    return result;
  }, [posts, searchQuery, filterStatus, filterType]);

  const formatDate = (date: string | Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePostPress = (post: AdminPost) => {
    setSelectedPost(post);
    setShowActionModal(true);
    setShowHideInput(false);
    setHideReason("");
    setShowSoftDeleteInput(false);
    setSoftDeleteReason("");
  };

  const handleSoftDelete = () => {
    if (!selectedPost) return;
    softDeleteMutation.mutate({ postId: selectedPost.id, reason: softDeleteReason.trim() || undefined });
  };

  const handleHidePost = () => {
    if (!selectedPost) return;
    if (!hideReason.trim()) {
      Alert.alert("Error", "Please provide a reason for hiding this post");
      return;
    }
    hidePostMutation.mutate({ postId: selectedPost.id, reason: hideReason.trim() });
  };

  const handleUnhidePost = () => {
    if (!selectedPost) return;
    unhidePostMutation.mutate(selectedPost.id);
  };

  const handleFeaturePost = (featured: boolean) => {
    if (!selectedPost) return;
    featurePostMutation.mutate({ postId: selectedPost.id, featured });
  };

  const handleDeletePost = () => {
    if (!selectedPost) return;
    Alert.alert(
      "Permanently Delete Post",
      "This action cannot be undone. Are you sure you want to permanently delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => deletePostMutation.mutate(selectedPost.id),
        },
      ]
    );
  };

  const FilterButton = ({ status, label }: { status: FilterStatus; label: string }) => (
    <Pressable
      onPress={() => setFilterStatus(status)}
      style={[
        styles.filterButton,
        {
          backgroundColor: filterStatus === status ? theme.primary : theme.backgroundDefault,
          borderColor: filterStatus === status ? theme.primary : theme.border,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.filterButtonText,
          { color: filterStatus === status ? "#FFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderPostItem = ({ item }: { item: AdminPost }) => (
    <Pressable onPress={() => item.author?.id ? handlePostPress(item) : null}>
      <Card elevation={1} style={styles.postCard}>
        <View style={styles.postHeader}>
          <Avatar uri={item.author?.avatarUrl} size={40} />
          <View style={styles.postMeta}>
            <View style={styles.authorRow}>
              <ThemedText type="body" style={styles.authorName}>
                {item.author?.displayName || 'Unknown'}
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: theme.glassBackground, borderWidth: 1, borderColor: theme.glassBorder }]}>
                <ThemedText style={[styles.badgeText, { color: theme.text }]}>{item.type}</ThemedText>
              </View>
              {item.isFeatured ? (
                <View style={[styles.badge, { backgroundColor: "#F59E0B" }]}>
                  <Feather name="star" size={10} color="#FFF" />
                  <ThemedText style={styles.badgeText}>Featured</ThemedText>
                </View>
              ) : null}
              {item.isHidden ? (
                <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                  <Feather name="eye-off" size={10} color="#FFF" />
                  <ThemedText style={styles.badgeText}>Hidden</ThemedText>
                </View>
              ) : null}
              {item.deletedAt ? (
                <View style={[styles.badge, { backgroundColor: "#6B7280" }]}>
                  <Feather name="archive" size={10} color="#FFF" />
                  <ThemedText style={styles.badgeText}>Deleted</ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText style={[styles.postDate, { color: theme.textSecondary }]}>
              @{item.author?.username || 'unknown'} • {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          <Feather name="more-horizontal" size={20} color={theme.textSecondary} />
        </View>
        <ThemedText style={styles.postContent} numberOfLines={3}>
          {item.content || item.caption || `[${item.type} post]`}
        </ThemedText>
        {item.hiddenReason ? (
          <View style={[styles.hiddenReasonBox, { backgroundColor: theme.glassBackground }]}>
            <ThemedText style={[styles.hiddenReasonLabel, { color: theme.textSecondary }]}>
              Hidden reason:
            </ThemedText>
            <ThemedText style={[styles.hiddenReasonText, { color: theme.text }]}>
              {item.hiddenReason}
            </ThemedText>
          </View>
        ) : null}
        {item.deleteReason ? (
          <View style={[styles.hiddenReasonBox, { backgroundColor: theme.glassBackground }]}>
            <ThemedText style={[styles.hiddenReasonLabel, { color: theme.textSecondary }]}>
              Delete reason:
            </ThemedText>
            <ThemedText style={[styles.hiddenReasonText, { color: theme.text }]}>
              {item.deleteReason}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Feather name="heart" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              {item.likesCount}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="message-circle" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
              {item.commentsCount}
            </ThemedText>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by content or username..."
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <FilterButton status="all" label="All" />
          <FilterButton status="visible" label="Visible" />
          <FilterButton status="hidden" label="Hidden" />
          <FilterButton status="featured" label="Featured" />
          <FilterButton status="deleted" label="Deleted" />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {(["all", "TEXT", "PHOTO", "VIDEO", "VOICE"] as FilterType[]).map((type) => (
            <Pressable
              key={type}
              onPress={() => setFilterType(type)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterType === type ? theme.primary : theme.glassBackground,
                  borderColor: filterType === type ? theme.primary : theme.glassBorder,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  { color: filterType === type ? "#FFF" : theme.text },
                ]}
              >
                {type === "all" ? "All Types" : type}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderPostItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText type="h4" style={styles.emptyTitle}>
              {searchQuery || filterStatus !== "all" ? "No matching posts" : "No posts found"}
            </ThemedText>
          </View>
        }
      />

      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Post Actions</ThemedText>
              <Pressable onPress={() => setShowActionModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedPost ? (
              <View style={styles.modalBody}>
                <View style={styles.postPreview}>
                  <Avatar uri={selectedPost.author?.avatarUrl} size={36} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: "600" }}>{selectedPost.author?.displayName || 'Unknown'}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                      @{selectedPost.author?.username || 'unknown'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.previewContent} numberOfLines={4}>
                  {selectedPost.content}
                </ThemedText>

                {showHideInput ? (
                  <View style={styles.hideInputContainer}>
                    <ThemedText style={{ marginBottom: Spacing.sm, fontWeight: "500" }}>
                      Reason for hiding:
                    </ThemedText>
                    <TextInput
                      style={[styles.hideInput, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      placeholder="Enter reason..."
                      placeholderTextColor={theme.textSecondary}
                      value={hideReason}
                      onChangeText={setHideReason}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.hideInputActions}>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: theme.glassBackground }]}
                        onPress={() => setShowHideInput(false)}
                      >
                        <ThemedText>Cancel</ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
                        onPress={handleHidePost}
                        disabled={hidePostMutation.isPending}
                      >
                        {hidePostMutation.isPending ? (
                          <LoadingIndicator size="small" />
                        ) : (
                          <ThemedText style={{ color: "#FFF" }}>Hide Post</ThemedText>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : showSoftDeleteInput ? (
                  <View style={styles.hideInputContainer}>
                    <ThemedText style={{ marginBottom: Spacing.sm, fontWeight: "500" }}>
                      Reason for soft delete (optional):
                    </ThemedText>
                    <TextInput
                      style={[styles.hideInput, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      placeholder="Enter reason..."
                      placeholderTextColor={theme.textSecondary}
                      value={softDeleteReason}
                      onChangeText={setSoftDeleteReason}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.hideInputActions}>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: theme.glassBackground }]}
                        onPress={() => setShowSoftDeleteInput(false)}
                      >
                        <ThemedText>Cancel</ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
                        onPress={handleSoftDelete}
                        disabled={softDeleteMutation.isPending}
                      >
                        {softDeleteMutation.isPending ? (
                          <LoadingIndicator size="small" />
                        ) : (
                          <ThemedText style={{ color: "#FFF" }}>Soft Delete</ThemedText>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionsGrid}>
                    {selectedPost.isHidden ? (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                        onPress={handleUnhidePost}
                        disabled={unhidePostMutation.isPending}
                      >
                        {unhidePostMutation.isPending ? (
                          <LoadingIndicator size="small" />
                        ) : (
                          <>
                            <Feather name="eye" size={18} color="#FFF" />
                            <ThemedText style={{ color: "#FFF", marginLeft: Spacing.sm }}>Unhide</ThemedText>
                          </>
                        )}
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
                        onPress={() => setShowHideInput(true)}
                      >
                        <Feather name="eye-off" size={18} color="#FFF" />
                        <ThemedText style={{ color: "#FFF", marginLeft: Spacing.sm }}>Hide</ThemedText>
                      </Pressable>
                    )}

                    {selectedPost.isFeatured ? (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: theme.glassBackground }]}
                        onPress={() => handleFeaturePost(false)}
                        disabled={featurePostMutation.isPending}
                      >
                        {featurePostMutation.isPending ? (
                          <LoadingIndicator size="small" />
                        ) : (
                          <>
                            <Feather name="star" size={18} color={theme.textSecondary} />
                            <ThemedText style={{ marginLeft: Spacing.sm }}>Unfeature</ThemedText>
                          </>
                        )}
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
                        onPress={() => handleFeaturePost(true)}
                        disabled={featurePostMutation.isPending}
                      >
                        {featurePostMutation.isPending ? (
                          <LoadingIndicator size="small" />
                        ) : (
                          <>
                            <Feather name="star" size={18} color="#FFF" />
                            <ThemedText style={{ color: "#FFF", marginLeft: Spacing.sm }}>Feature</ThemedText>
                          </>
                        )}
                      </Pressable>
                    )}

                    {!selectedPost.deletedAt ? (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
                        onPress={() => setShowSoftDeleteInput(true)}
                      >
                        <Feather name="archive" size={18} color="#FFF" />
                        <ThemedText style={{ color: "#FFF", marginLeft: Spacing.sm }}>Soft Delete</ThemedText>
                      </Pressable>
                    ) : null}

                    <Pressable
                      style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
                      onPress={handleDeletePost}
                    >
                      <Feather name="trash-2" size={18} color="#FFF" />
                      <ThemedText style={{ color: "#FFF", marginLeft: Spacing.sm }}>Delete Forever</ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : null}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  filterRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  postCard: {
    padding: Spacing.lg,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  postMeta: {
    flex: 1,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  authorName: {
    fontWeight: "600",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  hiddenReasonBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  hiddenReasonLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  hiddenReasonText: {
    fontSize: 14,
  },
  postStats: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  postPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  hideInputContainer: {
    marginTop: Spacing.md,
  },
  hideInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  hideInputActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
