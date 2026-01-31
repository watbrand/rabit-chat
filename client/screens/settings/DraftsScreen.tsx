import React from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Platform } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Draft {
  id: string;
  postType: string;
  content: string | null;
  mediaUrls: string[] | null;
  visibility: string;
  updatedAt: string;
  createdAt: string;
}

export default function DraftsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  const { data: drafts, isLoading } = useQuery<Draft[]>({
    queryKey: ["/api/drafts"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (draftId: string) => {
      return apiRequest("DELETE", `/api/drafts/${draftId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/drafts"] });
    },
    onError: (error: any) => {
      console.error("Failed to delete draft:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to delete draft. Please try again.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (draftId: string) => {
      return apiRequest("POST", `/api/drafts/${draftId}/publish`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your draft has been published!");
      queryClient.invalidateQueries({ queryKey: ["/api/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      console.error("Failed to publish draft:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to publish draft. Please try again.");
    },
  });

  const handleDelete = (draft: Draft) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Draft",
      "Are you sure you want to delete this draft?\n\nThis cannot be undone and all content will be permanently lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteMutation.mutate(draft.id);
          },
        },
      ]
    );
  };

  const handleEdit = (draft: Draft) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CreatePost", {
      draftId: draft.id,
      mode: "edit",
      postType: draft.postType,
      content: draft.content,
      mediaUrls: draft.mediaUrls,
      visibility: draft.visibility,
    });
  };

  const handlePublish = (draft: Draft) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Publish Draft",
      "Are you sure you want to publish this draft now?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: () => publishMutation.mutate(draft.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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

  const renderDraft = ({ item }: { item: Draft }) => (
    <View
      style={[
        styles.draftCard,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
    >
      <View style={styles.draftHeader}>
        <View style={[styles.typeIcon, { backgroundColor: theme.primary + "20" }]}>
          <Feather name={getPostTypeIcon(item.postType) as any} size={16} color={theme.primary} />
        </View>
        <View style={styles.draftMeta}>
          <ThemedText style={styles.draftType}>{item.postType}</ThemedText>
          <ThemedText style={[styles.draftDate, { color: theme.textSecondary }]}>
            {formatDate(item.updatedAt)}
          </ThemedText>
        </View>
        <View style={styles.draftActions}>
          <Pressable
            style={[styles.actionButton, { borderColor: theme.primary }]}
            onPress={() => handleEdit(item)}
          >
            <Feather name="edit-2" size={16} color={theme.primary} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { borderColor: theme.success }]}
            onPress={() => handlePublish(item)}
          >
            <Feather name="send" size={16} color={theme.success} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { borderColor: theme.error }]}
            onPress={() => handleDelete(item)}
          >
            <Feather name="trash-2" size={16} color={theme.error} />
          </Pressable>
        </View>
      </View>
      {item.content ? (
        <ThemedText style={styles.draftContent} numberOfLines={3}>
          {item.content}
        </ThemedText>
      ) : null}
      {item.mediaUrls && item.mediaUrls.length > 0 ? (
        <ThemedText style={[styles.mediaCount, { color: theme.textSecondary }]}>
          {item.mediaUrls.length} media file{item.mediaUrls.length > 1 ? "s" : ""}
        </ThemedText>
      ) : null}
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
    </View>
  );

  if (isLoading) {
    return (
      <LoadingIndicator fullScreen />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        renderItem={renderDraft}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No Drafts
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              When you save a post as a draft, it will appear here
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
  draftCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  draftHeader: {
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
  draftMeta: {
    flex: 1,
  },
  draftType: {
    fontSize: 14,
    fontWeight: "600",
  },
  draftDate: {
    fontSize: 12,
  },
  draftActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  draftContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  mediaCount: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  visibilityText: {
    fontSize: 11,
    textTransform: "capitalize",
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
