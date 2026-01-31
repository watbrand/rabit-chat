import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Platform, Modal, TextInput } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ScheduledPost {
  id: string;
  postType: string;
  content: string | null;
  mediaUrls: string[] | null;
  visibility: string;
  scheduledFor: string;
  status: "PENDING" | "PUBLISHED" | "FAILED" | "CANCELLED";
  createdAt: string;
}

export default function ScheduledPostsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: scheduledPosts, isLoading } = useQuery<ScheduledPost[]>({
    queryKey: ["/api/scheduled-posts"],
  });

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/scheduled-posts/${postId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to cancel scheduled post");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ postId, scheduledFor }: { postId: string; scheduledFor: string }) => {
      return apiRequest("PATCH", `/api/scheduled-posts/${postId}/reschedule`, { scheduledFor });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] });
      Alert.alert("Success", "Post rescheduled successfully");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to reschedule post");
    },
  });

  const publishNowMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("POST", `/api/scheduled-posts/${postId}/publish-now`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] });
      Alert.alert("Success", "Post published successfully!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to publish post");
    },
  });

  const handleReschedule = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPostId(postId);
    setRescheduleModalVisible(true);
  };

  const handleRescheduleOption = (hours: number) => {
    if (!selectedPostId) return;
    
    const newDate = new Date();
    newDate.setHours(newDate.getHours() + hours);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rescheduleMutation.mutate({ postId: selectedPostId, scheduledFor: newDate.toISOString() });
    setRescheduleModalVisible(false);
    setSelectedPostId(null);
  };

  const handlePublishNow = (post: ScheduledPost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Publish Now",
      "Are you sure you want to publish this post immediately?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            publishNowMutation.mutate(post.id);
          },
        },
      ]
    );
  };

  const handleCancel = (post: ScheduledPost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Cancel Scheduled Post",
      "Are you sure you want to cancel this scheduled post?",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Post",
          style: "destructive",
          onPress: () => deleteMutation.mutate(post.id),
        },
      ]
    );
  };

  const formatScheduledDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (diff < 0) {
      return "Past due";
    } else if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `In ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (hours < 24) {
      return `In ${hours} hour${hours !== 1 ? "s" : ""}`;
    } else if (days < 7) {
      return `In ${days} day${days !== 1 ? "s" : ""}`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return theme.gold;
      case "PUBLISHED":
        return theme.success;
      case "FAILED":
        return theme.error;
      case "CANCELLED":
        return theme.textSecondary;
      default:
        return theme.textSecondary;
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "PHOTO":
        return "image";
      case "VIDEO":
        return "video";
      case "VOICE":
        return "mic";
      default:
        return "file-text";
    }
  };

  const renderScheduledPost = ({ item }: { item: ScheduledPost }) => (
    <View
      style={[
        styles.postCard,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
    >
      <View style={styles.postHeader}>
        <View style={[styles.typeIcon, { backgroundColor: theme.primary + "20" }]}>
          <Feather name={getPostTypeIcon(item.postType) as any} size={16} color={theme.primary} />
        </View>
        <View style={styles.postMeta}>
          <View style={styles.scheduleRow}>
            <Feather name="clock" size={14} color={theme.primary} />
            <ThemedText style={[styles.scheduleTime, { color: theme.primary }]}>
              {formatScheduledDate(item.scheduledFor)}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </ThemedText>
          </View>
        </View>
        {item.status === "PENDING" ? (
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { borderColor: theme.primary }]}
              onPress={() => handlePublishNow(item)}
            >
              <Feather name="send" size={16} color={theme.primary} />
            </Pressable>
            <Pressable
              style={[styles.actionButton, { borderColor: theme.gold }]}
              onPress={() => handleReschedule(item.id)}
            >
              <Feather name="calendar" size={16} color={theme.gold} />
            </Pressable>
            <Pressable
              style={[styles.actionButton, { borderColor: theme.error }]}
              onPress={() => handleCancel(item)}
            >
              <Feather name="x" size={16} color={theme.error} />
            </Pressable>
          </View>
        ) : null}
      </View>
      {item.content ? (
        <ThemedText style={styles.postContent} numberOfLines={3}>
          {item.content}
        </ThemedText>
      ) : null}
      {item.mediaUrls && item.mediaUrls.length > 0 ? (
        <ThemedText style={[styles.mediaCount, { color: theme.textSecondary }]}>
          {item.mediaUrls.length} media file{item.mediaUrls.length > 1 ? "s" : ""}
        </ThemedText>
      ) : null}
      <View style={styles.postFooter}>
        <View style={[styles.visibilityBadge, { backgroundColor: theme.glassBackground }]}>
          <Feather
            name={item.visibility === "PRIVATE" ? "lock" : item.visibility === "FOLLOWERS" ? "users" : "globe"}
            size={12}
            color={theme.textSecondary}
          />
          <ThemedText style={[styles.visibilityText, { color: theme.textSecondary }]}>
            {item.visibility}
          </ThemedText>
        </View>
        <ThemedText style={[styles.createdDate, { color: theme.textSecondary }]}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </ThemedText>
      </View>
    </View>
  );

  const RescheduleModal = () => (
    <Modal
      visible={rescheduleModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setRescheduleModalVisible(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setRescheduleModalVisible(false)}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.backgroundElevated, borderColor: theme.glassBorder },
          ]}
        >
          <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
            Reschedule to when?
          </ThemedText>
          <Pressable
            style={[styles.optionButton, { backgroundColor: theme.glassBackground }]}
            onPress={() => handleRescheduleOption(1)}
          >
            <Feather name="clock" size={18} color={theme.primary} />
            <ThemedText style={[styles.optionText, { color: theme.text }]}>
              In 1 hour
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.optionButton, { backgroundColor: theme.glassBackground }]}
            onPress={() => handleRescheduleOption(6)}
          >
            <Feather name="clock" size={18} color={theme.primary} />
            <ThemedText style={[styles.optionText, { color: theme.text }]}>
              In 6 hours
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.optionButton, { backgroundColor: theme.glassBackground }]}
            onPress={() => handleRescheduleOption(24)}
          >
            <Feather name="sunrise" size={18} color={theme.gold} />
            <ThemedText style={[styles.optionText, { color: theme.text }]}>
              Tomorrow same time
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.optionButton, { backgroundColor: theme.glassBackground }]}
            onPress={() => handleRescheduleOption(48)}
          >
            <Feather name="calendar" size={18} color={theme.gold} />
            <ThemedText style={[styles.optionText, { color: theme.text }]}>
              In 2 days
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.cancelOptionButton, { borderColor: theme.textSecondary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRescheduleModalVisible(false);
            }}
          >
            <ThemedText style={[styles.cancelOptionText, { color: theme.textSecondary }]}>
              Cancel
            </ThemedText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  if (isLoading) {
    return (
      <LoadingIndicator fullScreen />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <RescheduleModal />
      <FlatList
        data={scheduledPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderScheduledPost}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="clock" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No Scheduled Posts
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Schedule posts to publish them automatically at a specific time
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  postMeta: {
    flex: 1,
    gap: 4,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  mediaCount: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  visibilityText: {
    fontSize: 11,
    textTransform: "capitalize",
  },
  createdDate: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl * 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  cancelOptionButton: {
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  cancelOptionText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
