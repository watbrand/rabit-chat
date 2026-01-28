import React from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
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

  const handleCancel = (post: ScheduledPost) => {
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
          <Pressable
            style={[styles.cancelButton, { borderColor: theme.error }]}
            onPress={() => handleCancel(item)}
          >
            <Feather name="x" size={16} color={theme.error} />
          </Pressable>
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
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
  cancelButton: {
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
});
