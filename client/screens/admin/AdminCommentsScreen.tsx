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
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { Comment, User } from "@shared/schema";

type AdminComment = Comment & {
  author: User;
};

type FilterStatus = "all" | "visible" | "hidden";

export default function AdminCommentsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedComment, setSelectedComment] = useState<AdminComment | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [hideReason, setHideReason] = useState("");
  const [showHideInput, setShowHideInput] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [modalContentExpanded, setModalContentExpanded] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const {
    data: comments,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<AdminComment[]>({
    queryKey: ["/api/admin/comments"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/comments", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  const hideCommentMutation = useMutation({
    mutationFn: async ({ commentId, reason }: { commentId: string; reason: string }) => {
      await apiRequest("PATCH", `/api/admin/comments/${commentId}`, { action: "hide", reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setShowHideInput(false);
      setHideReason("");
      setSelectedComment(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to hide comment");
    },
  });

  const unhideCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("PATCH", `/api/admin/comments/${commentId}`, { action: "unhide" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setSelectedComment(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to unhide comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await apiRequest("DELETE", `/api/admin/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowActionModal(false);
      setSelectedComment(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to delete comment");
    },
  });

  const filteredComments = useMemo(() => {
    if (!comments) return [];
    let result = comments;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (comment) =>
          comment.content.toLowerCase().includes(query) ||
          (comment.author?.username?.toLowerCase() || '').includes(query) ||
          (comment.author?.displayName?.toLowerCase() || '').includes(query)
      );
    }

    switch (filterStatus) {
      case "visible":
        result = result.filter((comment) => !comment.isHidden);
        break;
      case "hidden":
        result = result.filter((comment) => comment.isHidden);
        break;
    }

    return result;
  }, [comments, searchQuery, filterStatus]);

  const formatDate = (date: string | Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCommentPress = (comment: AdminComment) => {
    setSelectedComment(comment);
    setShowActionModal(true);
    setShowHideInput(false);
    setHideReason("");
    setModalContentExpanded(false);
  };

  const handleHideComment = () => {
    if (!selectedComment) return;
    if (!hideReason.trim()) {
      Alert.alert("Error", "Please provide a reason for hiding this comment");
      return;
    }
    hideCommentMutation.mutate({ commentId: selectedComment.id, reason: hideReason.trim() });
  };

  const handleUnhideComment = () => {
    if (!selectedComment) return;
    unhideCommentMutation.mutate(selectedComment.id);
  };

  const handleDeleteComment = () => {
    if (!selectedComment) return;
    Alert.alert(
      "Permanently Delete Comment",
      "This action cannot be undone. Are you sure you want to permanently delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => deleteCommentMutation.mutate(selectedComment.id),
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

  const renderCommentItem = ({ item }: { item: AdminComment }) => {
    const isExpanded = expandedItems.has(item.id);
    return (
    <Pressable onPress={() => item.author?.id ? handleCommentPress(item) : null}>
      <Card elevation={1} style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <Avatar uri={item.author?.avatarUrl} size={36} />
          <View style={styles.commentMeta}>
            <View style={styles.authorRow}>
              <ThemedText type="body" style={styles.authorName}>
                {item.author?.displayName || 'Unknown'}
              </ThemedText>
              {item.isHidden ? (
                <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                  <Feather name="eye-off" size={10} color="#FFF" />
                  <ThemedText style={styles.badgeText}>Hidden</ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText style={[styles.commentDate, { color: theme.textSecondary }]}>
              @{item.author?.username || 'unknown'} • {formatDate(item.createdAt)}
            </ThemedText>
          </View>
          <Feather name="more-horizontal" size={20} color={theme.textSecondary} />
        </View>
        <Pressable onPress={(e) => { e.stopPropagation(); toggleExpand(item.id); }}>
          <ThemedText style={styles.commentContent} numberOfLines={isExpanded ? undefined : 2}>
            {item.content}
          </ThemedText>
          <ThemedText style={[styles.expandButton, { color: theme.primary }]}>
            {isExpanded ? 'See less' : 'See more'}
          </ThemedText>
        </Pressable>
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
        <View style={styles.postLink}>
          <Feather name="corner-down-right" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.postLinkText, { color: theme.primary }]}>
            Post ID: {item.postId.substring(0, 8)}...
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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
        </ScrollView>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        data={filteredComments}
        keyExtractor={(item) => item.id}
        renderItem={renderCommentItem}
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
            <Feather name="message-circle" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText type="h4" style={styles.emptyTitle}>
              {searchQuery || filterStatus !== "all" ? "No matching comments" : "No comments found"}
            </ThemedText>
          </View>
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
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
              <ThemedText type="h4">Comment Actions</ThemedText>
              <Pressable onPress={() => setShowActionModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedComment ? (
              <View style={styles.modalBody}>
                <View style={styles.commentPreview}>
                  <Avatar uri={selectedComment.author?.avatarUrl} size={36} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: "600" }}>{selectedComment.author?.displayName || 'Unknown'}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                      @{selectedComment.author?.username || 'unknown'}
                    </ThemedText>
                  </View>
                </View>
                <Pressable onPress={() => setModalContentExpanded(!modalContentExpanded)}>
                  <ThemedText style={styles.previewContent} numberOfLines={modalContentExpanded ? undefined : 4}>
                    {selectedComment.content}
                  </ThemedText>
                  <ThemedText style={[styles.expandButton, { color: theme.primary }]}>
                    {modalContentExpanded ? 'See less' : 'See more'}
                  </ThemedText>
                </Pressable>

                {showHideInput ? (
                  <View style={styles.hideInputContainer}>
                    <ThemedText style={{ marginBottom: Spacing.sm, fontWeight: "500" }}>
                      Reason for hiding:
                    </ThemedText>
                    <TextInput
                      style={[styles.hideInput, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.border }]}
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
                        onPress={handleHideComment}
                        disabled={hideCommentMutation.isPending}
                      >
                        {hideCommentMutation.isPending ? (
                          <LoadingIndicator size="small" />
                        ) : (
                          <ThemedText style={{ color: "#FFF" }}>Hide Comment</ThemedText>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionsGrid}>
                    {selectedComment.isHidden ? (
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                        onPress={handleUnhideComment}
                        disabled={unhideCommentMutation.isPending}
                      >
                        {unhideCommentMutation.isPending ? (
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

                    <Pressable
                      style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
                      onPress={handleDeleteComment}
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
    </KeyboardAvoidingView>
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
  commentCard: {
    padding: Spacing.lg,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  commentMeta: {
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
    fontSize: 14,
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
  commentDate: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  expandButton: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  hiddenReasonBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  hiddenReasonLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  hiddenReasonText: {
    fontSize: 14,
  },
  postLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  postLinkText: {
    fontSize: 12,
    fontWeight: "500",
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
  commentPreview: {
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
