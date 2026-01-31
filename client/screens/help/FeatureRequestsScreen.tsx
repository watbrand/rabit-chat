import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  FlatList,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
  Layout,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

type FeatureStatus = "PENDING" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DECLINED";
type SortOption = "votes" | "newest" | "status";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: string | null;
  status: FeatureStatus;
  vote_count: number;
  user_vote: number;
  comment_count: number;
  created_at: string;
  author?: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "votes", label: "Most Voted" },
  { value: "newest", label: "Newest" },
  { value: "status", label: "Status" },
];

function FeatureCard({
  feature,
  onVote,
  isVoting,
}: {
  feature: FeatureRequest;
  onVote: (id: string, direction: 1 | -1) => void;
  isVoting: boolean;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const getStatusColor = (status: FeatureStatus) => {
    switch (status) {
      case "PLANNED":
        return theme.info;
      case "IN_PROGRESS":
        return theme.warning;
      case "COMPLETED":
        return theme.success;
      case "DECLINED":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: FeatureStatus) => {
    switch (status) {
      case "PENDING":
        return "Pending Review";
      case "PLANNED":
        return "Planned";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "DECLINED":
        return "Declined";
      default:
        return status;
    }
  };

  const handleUpvote = useCallback(() => {
    if (isVoting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(1.1, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    });
    onVote(feature.id, feature.user_vote === 1 ? -1 : 1);
  }, [feature.id, feature.user_vote, onVote, isVoting, scale]);

  const handleDownvote = useCallback(() => {
    if (isVoting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onVote(feature.id, feature.user_vote === -1 ? 1 : -1);
  }, [feature.id, feature.user_vote, onVote, isVoting]);

  const voteStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusColor = getStatusColor(feature.status);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      layout={Layout.springify()}
      style={[
        styles.featureCard,
        {
          backgroundColor: theme.glassBackground,
          borderColor: theme.glassBorder,
        },
      ]}
    >
      <AnimatedPressable
        testID={`vote-button-${feature.id}`}
        style={[styles.voteSection, voteStyle]}
        onPress={handleUpvote}
      >
        <Feather
          name="chevron-up"
          size={24}
          color={feature.user_vote === 1 ? theme.primary : theme.textSecondary}
        />
        <ThemedText
          style={[
            styles.voteCount,
            { color: feature.user_vote !== 0 ? theme.primary : theme.text },
          ]}
        >
          {feature.vote_count}
        </ThemedText>
        <Pressable testID={`downvote-button-${feature.id}`} onPress={handleDownvote}>
          <Feather
            name="chevron-down"
            size={24}
            color={feature.user_vote === -1 ? theme.error : theme.textSecondary}
          />
        </Pressable>
      </AnimatedPressable>

      <View style={styles.featureContent}>
        <View style={styles.featureHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(feature.status)}
            </ThemedText>
          </View>
          {feature.category ? (
            <ThemedText style={[styles.categoryText, { color: theme.textTertiary }]}>
              {feature.category}
            </ThemedText>
          ) : null}
        </View>

        <ThemedText type="headline" style={styles.featureTitle}>
          {feature.title}
        </ThemedText>

        <ThemedText
          style={[styles.featureDescription, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {feature.description}
        </ThemedText>

        <View style={styles.featureFooter}>
          {feature.author ? (
            <ThemedText style={[styles.authorText, { color: theme.textTertiary }]}>
              by @{feature.author.username}
            </ThemedText>
          ) : null}
          <View style={styles.commentCount}>
            <Feather name="message-circle" size={14} color={theme.textTertiary} />
            <ThemedText style={[styles.commentText, { color: theme.textTertiary }]}>
              {feature.comment_count}
            </ThemedText>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function FeatureRequestsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortOption>("votes");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set());

  const { data: features, isLoading, refetch } = useQuery<FeatureRequest[]>({
    queryKey: ["/api/help/feature-requests", { sort: sortBy }],
  });

  const sortedFeatures = useMemo(() => {
    if (!features) return [];
    const sorted = [...features];
    switch (sortBy) {
      case "votes":
        return sorted.sort((a, b) => b.vote_count - a.vote_count);
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "status":
        const statusOrder = { IN_PROGRESS: 0, PLANNED: 1, PENDING: 2, COMPLETED: 3, DECLINED: 4 };
        return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      default:
        return sorted;
    }
  }, [features, sortBy]);

  const voteMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 1 | -1 }) => {
      const res = await apiRequest("POST", `/api/help/feature-requests/${id}/vote`, { direction });
      return res.json();
    },
    onMutate: ({ id }) => {
      setVotingIds((prev) => new Set(prev).add(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/help/feature-requests"] });
    },
    onSettled: (_, __, { id }) => {
      setVotingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Operation failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await apiRequest("POST", "/api/help/feature-requests", data);
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowNewModal(false);
      setNewTitle("");
      setNewDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/help/feature-requests"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to submit request");
    },
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleVote = useCallback((id: string, direction: 1 | -1) => {
    voteMutation.mutate({ id, direction });
  }, [voteMutation]);

  const handleSortChange = useCallback((option: SortOption) => {
    Haptics.selectionAsync();
    setSortBy(option);
  }, []);

  const handleSubmitNew = useCallback(() => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert("Missing Fields", "Please provide both a title and description.");
      return;
    }
    createMutation.mutate({
      title: newTitle.trim(),
      description: newDescription.trim(),
    });
  }, [newTitle, newDescription, createMutation]);

  const handleOpenNewModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowNewModal(true);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: FeatureRequest; index: number }) => (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        <FeatureCard
          feature={item}
          onVote={handleVote}
          isVoting={votingIds.has(item.id)}
        />
      </Animated.View>
    ),
    [handleVote, votingIds]
  );

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.sortRow}>
        <ThemedText style={[styles.sortLabel, { color: theme.textSecondary }]}>
          Sort by:
        </ThemedText>
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            testID={`sort-${option.value}`}
            style={[
              styles.sortPill,
              {
                backgroundColor: sortBy === option.value ? theme.primary : theme.glassBackground,
                borderColor: sortBy === option.value ? theme.primary : theme.glassBorder,
              },
            ]}
            onPress={() => handleSortChange(option.value)}
          >
            <ThemedText
              style={[
                styles.sortPillText,
                { color: sortBy === option.value ? "#FFFFFF" : theme.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="star" size={48} color={theme.textTertiary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        No feature requests yet
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: theme.textTertiary }]}>
        Be the first to suggest a new feature!
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <FlatList
        testID="feature-requests-list"
        data={sortedFeatures}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />

      <Pressable
        testID="button-new-request"
        style={[styles.fab, { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.xl }]}
        onPress={handleOpenNewModal}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={showNewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Pressable testID="button-cancel-modal" onPress={() => setShowNewModal(false)}>
              <ThemedText style={[styles.modalCancel, { color: theme.textSecondary }]}>
                Cancel
              </ThemedText>
            </Pressable>
            <ThemedText type="headline">New Feature Request</ThemedText>
            <Pressable
              testID="button-submit-request"
              onPress={handleSubmitNew}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <ThemedText style={[styles.modalSubmit, { color: theme.primary }]}>
                  Submit
                </ThemedText>
              )}
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.modalField}>
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>
                Title
              </ThemedText>
              <TextInput
                testID="input-request-title"
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Brief title for your feature idea"
                placeholderTextColor={theme.textTertiary}
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={200}
              />
            </View>

            <View style={styles.modalField}>
              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>
                Description
              </ThemedText>
              <TextInput
                testID="input-request-description"
                style={[
                  styles.modalTextArea,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Describe the feature you'd like to see..."
                placeholderTextColor={theme.textTertiary}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </KeyboardAvoidingView>
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
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  sortLabel: {
    fontSize: 13,
    marginRight: Spacing.xs,
  },
  sortPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
  },
  featureCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  voteSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 2,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: "700",
  },
  featureContent: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: 0,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  categoryText: {
    fontSize: 11,
  },
  featureTitle: {
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  featureFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authorText: {
    fontSize: 11,
  },
  commentCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentText: {
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 15,
  },
  modalSubmit: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  modalField: {
    gap: Spacing.sm,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalInput: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
  },
  modalTextArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 140,
  },
});
