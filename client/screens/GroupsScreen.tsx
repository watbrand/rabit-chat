import React, { useState } from "react";
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
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
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
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [refreshing, setRefreshing] = useState(false);

  const { data: groups = [], isLoading, refetch } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/groups", {
        name: newGroupName,
        description: newGroupDescription,
        privacy: newGroupPrivacy,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest("POST", `/api/groups/${groupId}/join`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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

            <GlassInput
              placeholder="Circle Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              containerStyle={styles.input}
            />

            <GlassInput
              placeholder="Description (optional)"
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              multiline
              numberOfLines={3}
              containerStyle={StyleSheet.flatten([styles.input, styles.textArea])}
            />

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
              onPress={() => createGroupMutation.mutate()}
              disabled={!newGroupName.trim() || createGroupMutation.isPending}
              style={styles.createModalButton}
            />
          </View>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    paddingTop: 100,
    gap: 16,
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
    marginBottom: 16,
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
});
