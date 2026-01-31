import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Image,
  RefreshControl,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { LoadingIndicator, EmptyState } from "@/components/animations";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "@/components/Avatar";
import { GlassButton } from "@/components/GlassButton";
import { GlassInput } from "@/components/GlassInput";

const GROUP_NAME_MIN_LENGTH = 3;
const GROUP_NAME_MAX_LENGTH = 50;
const GROUP_DESCRIPTION_MAX_LENGTH = 500;
const REFRESH_THROTTLE_MS = 2000;

interface Group {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  privacy: "PUBLIC" | "PRIVATE" | "SECRET";
  memberCount: number;
  creatorId: string;
  createdAt: string;
  members?: any[];
}

export default function GroupsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedGroupForLeave, setSelectedGroupForLeave] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [refreshing, setRefreshing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; description?: string }>({});
  const lastRefreshTime = useRef<number>(0);

  const { data: groups = [], isLoading, isError, error, refetch } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const showError = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  };

  const validateGroupForm = (): boolean => {
    const errors: { name?: string; description?: string } = {};

    if (newGroupName.trim().length < GROUP_NAME_MIN_LENGTH) {
      errors.name = `Name must be at least ${GROUP_NAME_MIN_LENGTH} characters`;
    } else if (newGroupName.trim().length > GROUP_NAME_MAX_LENGTH) {
      errors.name = `Name must be less than ${GROUP_NAME_MAX_LENGTH} characters`;
    }

    if (newGroupDescription.length > GROUP_DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be less than ${GROUP_DESCRIPTION_MAX_LENGTH} characters`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/groups", {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        privacy: newGroupPrivacy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setValidationErrors({});
    },
    onError: (error: any) => {
      showError("Failed to Create Circle", error?.message || "Unable to create the circle. Please try again.");
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest("POST", `/api/groups/${groupId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error: any) => {
      showError("Failed to Join Circle", error?.message || "Unable to join the circle. Please try again.");
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest("POST", `/api/groups/${groupId}/leave`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setShowLeaveModal(false);
      setSelectedGroupForLeave(null);
    },
    onError: (error: any) => {
      showError("Failed to Leave Circle", error?.message || "Unable to leave the circle. Please try again.");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest("DELETE", `/api/groups/${groupId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
    onError: (error: any) => {
      showError("Failed to Delete Circle", error?.message || "Unable to delete the circle. Please try again.");
    },
  });

  const handleLeaveGroup = (group: Group) => {
    setSelectedGroupForLeave(group);
    setShowLeaveModal(true);
  };

  const confirmLeaveGroup = () => {
    if (selectedGroupForLeave) {
      leaveGroupMutation.mutate(selectedGroupForLeave.id);
    }
  };

  const handleCreateGroup = () => {
    if (validateGroupForm()) {
      createGroupMutation.mutate();
    }
  };

  const onRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime.current < REFRESH_THROTTLE_MS) {
      return;
    }
    lastRefreshTime.current = now;
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderGroup = ({ item }: { item: Group }) => (
    <Pressable
      style={[styles.groupCard, { backgroundColor: theme.backgroundSecondary }]}
      onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
    >
      {item.coverImageUrl ? (
        <Image source={{ uri: item.coverImageUrl }} style={styles.groupCover} />
      ) : (
        <View style={[styles.groupCoverPlaceholder, { backgroundColor: theme.primary + "30" }]}>
          <Feather name="users" size={32} color={theme.primary} />
        </View>
      )}
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.privacyBadge, { backgroundColor: theme.primary + "20" }]}>
            <Feather
              name={item.privacy === "PUBLIC" ? "globe" : "lock"}
              size={12}
              color={theme.primary}
            />
            <Text style={[styles.privacyText, { color: theme.primary }]}>
              {item.privacy}
            </Text>
          </View>
        </View>
        {item.description ? (
          <Text style={[styles.groupDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.groupFooter}>
          <View style={styles.memberInfo}>
            <Feather name="users" size={14} color={theme.textSecondary} />
            <Text style={[styles.memberCount, { color: theme.textSecondary }]}>
              {item.memberCount} members
            </Text>
          </View>
          <Pressable
            style={[styles.joinButton, { backgroundColor: theme.primary }]}
            onPress={() => joinGroupMutation.mutate(item.id)}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  if (isError) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.header, { paddingTop: Platform.OS === "android" ? Spacing.md : headerHeight + Spacing.sm }]}>
          <Text style={[styles.title, { color: theme.text }]}>Elite Circles</Text>
          <Pressable
            style={[styles.createButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <EmptyState
            icon="alert-circle"
            title="Something went wrong"
            message={(error as Error)?.message || "Failed to load circles. Please try again."}
            actionLabel="Try Again"
            onAction={refetch}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === "android" ? Spacing.md : headerHeight + Spacing.sm }]}>
        <Text style={[styles.title, { color: theme.text }]}>Elite Circles</Text>
        <Pressable
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No groups yet. Create or join one!
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Create Elite Circle
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.inputWrapper}>
              <GlassInput
                placeholder="Circle Name"
                value={newGroupName}
                onChangeText={(text) => {
                  setNewGroupName(text);
                  if (validationErrors.name) {
                    setValidationErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                maxLength={GROUP_NAME_MAX_LENGTH}
                containerStyle={styles.input}
              />
              {validationErrors.name ? (
                <Text style={[styles.errorText, { color: theme.error || "#EF4444" }]}>
                  {validationErrors.name}
                </Text>
              ) : null}
              <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                {newGroupName.length}/{GROUP_NAME_MAX_LENGTH}
              </Text>
            </View>

            <View style={styles.inputWrapper}>
              <GlassInput
                placeholder="Description (optional)"
                value={newGroupDescription}
                onChangeText={(text) => {
                  setNewGroupDescription(text);
                  if (validationErrors.description) {
                    setValidationErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
                multiline
                numberOfLines={3}
                containerStyle={StyleSheet.flatten([styles.input, styles.textArea])}
              />
              {validationErrors.description ? (
                <Text style={[styles.errorText, { color: theme.error || "#EF4444" }]}>
                  {validationErrors.description}
                </Text>
              ) : null}
              <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                {newGroupDescription.length}/{GROUP_DESCRIPTION_MAX_LENGTH}
              </Text>
            </View>

            <View style={styles.privacyOptions}>
              <Pressable
                style={[
                  styles.privacyOption,
                  { borderColor: theme.border },
                  newGroupPrivacy === "PUBLIC" && { backgroundColor: theme.primary + "20", borderColor: theme.primary },
                ]}
                onPress={() => setNewGroupPrivacy("PUBLIC")}
              >
                <Feather name="globe" size={20} color={newGroupPrivacy === "PUBLIC" ? theme.primary : theme.textSecondary} />
                <Text style={[styles.privacyOptionText, { color: newGroupPrivacy === "PUBLIC" ? theme.primary : theme.textSecondary }]}>
                  Public
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.privacyOption,
                  { borderColor: theme.border },
                  newGroupPrivacy === "PRIVATE" && { backgroundColor: theme.primary + "20", borderColor: theme.primary },
                ]}
                onPress={() => setNewGroupPrivacy("PRIVATE")}
              >
                <Feather name="lock" size={20} color={newGroupPrivacy === "PRIVATE" ? theme.primary : theme.textSecondary} />
                <Text style={[styles.privacyOptionText, { color: newGroupPrivacy === "PRIVATE" ? theme.primary : theme.textSecondary }]}>
                  Private
                </Text>
              </Pressable>
            </View>

            <GlassButton
              title={createGroupMutation.isPending ? "Creating..." : "Create Circle"}
              onPress={handleCreateGroup}
              disabled={newGroupName.trim().length < GROUP_NAME_MIN_LENGTH || createGroupMutation.isPending}
              style={styles.createModalButton}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showLeaveModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmContent, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.confirmIconContainer}>
              <Feather name="log-out" size={32} color={theme.error || "#EF4444"} />
            </View>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>
              Leave Circle?
            </Text>
            <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}>
              Are you sure you want to leave "{selectedGroupForLeave?.name}"? You'll need to request to join again if it's a private circle.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => {
                  setShowLeaveModal(false);
                  setSelectedGroupForLeave(null);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.leaveButton, { backgroundColor: theme.error || "#EF4444" }]}
                onPress={confirmLeaveGroup}
                disabled={leaveGroupMutation.isPending}
              >
                <Text style={styles.leaveButtonText}>
                  {leaveGroupMutation.isPending ? "Leaving..." : "Leave"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  groupCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  groupCover: {
    width: "100%",
    height: 120,
  },
  groupCoverPlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: {
    padding: 16,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  privacyText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  groupFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberCount: {
    fontSize: 14,
  },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 0,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  privacyOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  privacyOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  privacyOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  createModalButton: {
    marginTop: 8,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginRight: 4,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  confirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  leaveButton: {},
  leaveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
