import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  RefreshControl,
  Modal,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ChatFolder {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  conversationCount: number;
  createdAt: string;
}

interface ScheduledMessage {
  id: string;
  conversationId: string;
  content: string;
  scheduledFor: string;
  status: string;
  createdAt: string;
}

interface PinnedMessage {
  id: string;
  conversationId: string;
  messageId: string;
  content: string;
  pinnedAt: string;
}

const FOLDER_ICONS = ["folder", "star", "heart", "briefcase", "users", "home", "zap", "coffee"];
const FOLDER_COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#6366F1", "#14B8A6"];

export function ChatFoldersScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"folders" | "scheduled" | "pinned">("folders");
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [selectedColor, setSelectedColor] = useState("#8B5CF6");

  const { data: folders, isLoading: loadingFolders } = useQuery<ChatFolder[]>({
    queryKey: ["/api/chat-folders"],
    enabled: !!user,
  });

  const { data: scheduledMessages, isLoading: loadingScheduled } = useQuery<ScheduledMessage[]>({
    queryKey: ["/api/scheduled-messages"],
    enabled: !!user,
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/chat-folders", {
        name: newFolderName,
        icon: selectedIcon,
        color: selectedColor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-folders"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreateModalVisible(false);
      setNewFolderName("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create folder");
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      return apiRequest("DELETE", `/api/chat-folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-folders"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const deleteScheduledMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("DELETE", `/api/scheduled-messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/chat-folders"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-messages"] }),
    ]);
    setRefreshing(false);
  };

  const confirmDeleteFolder = (folder: ChatFolder) => {
    Alert.alert("Delete Folder", `Delete "${folder.name}"? Conversations won't be deleted.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteFolderMutation.mutate(folder.id) },
    ]);
  };

  const formatScheduledTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const renderFoldersTab = () => (
    <View>
      <Pressable
        style={[styles.createButton, { backgroundColor: theme.primary }]}
        onPress={() => setCreateModalVisible(true)}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText style={styles.createButtonText}>Create Folder</ThemedText>
      </Pressable>

      {loadingFolders ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : folders && folders.length > 0 ? (
        folders.map((folder, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={folder.id}>
            <Card style={styles.folderCard}>
              <View style={[styles.folderIcon, { backgroundColor: folder.color + "20" }]}>
                <Feather name={folder.icon as any} size={24} color={folder.color} />
              </View>
              <View style={styles.folderInfo}>
                <ThemedText style={[styles.folderName, { color: theme.text }]}>{folder.name}</ThemedText>
                <ThemedText style={[styles.folderCount, { color: theme.textSecondary }]}>
                  {folder.conversationCount} conversations
                </ThemedText>
              </View>
              <Pressable onPress={() => confirmDeleteFolder(folder)} style={styles.deleteButton}>
                <Feather name="trash-2" size={18} color={theme.error} />
              </Pressable>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="folder" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Folders Yet</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Create folders to organize your conversations
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderScheduledTab = () => (
    <View>
      {loadingScheduled ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : scheduledMessages && scheduledMessages.length > 0 ? (
        scheduledMessages.map((msg, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={msg.id}>
            <Card style={styles.scheduledCard}>
              <View style={styles.scheduledHeader}>
                <Feather name="clock" size={16} color={theme.primary} />
                <ThemedText style={[styles.scheduledTime, { color: theme.primary }]}>
                  {formatScheduledTime(msg.scheduledFor)}
                </ThemedText>
                <Pressable onPress={() => deleteScheduledMutation.mutate(msg.id)}>
                  <Feather name="x" size={18} color={theme.error} />
                </Pressable>
              </View>
              <ThemedText style={[styles.scheduledContent, { color: theme.text }]} numberOfLines={2}>
                {msg.content}
              </ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: theme.success + "20" }]}>
                <ThemedText style={[styles.statusText, { color: theme.success }]}>{msg.status}</ThemedText>
              </View>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="clock" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Scheduled Messages</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Schedule messages to send later from any chat
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderPinnedTab = () => (
    <Card style={styles.emptyCard}>
      <Feather name="bookmark" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Pinned Messages</ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Long-press any message in a chat to pin it for quick access
      </ThemedText>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.tabsContainer}>
          {(["folders", "scheduled", "pinned"] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: theme.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <Feather
                name={tab === "folders" ? "folder" : tab === "scheduled" ? "clock" : "bookmark"}
                size={16}
                color={activeTab === tab ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                style={[styles.tabText, { color: activeTab === tab ? "#FFFFFF" : theme.textSecondary }]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {activeTab === "folders" && renderFoldersTab()}
        {activeTab === "scheduled" && renderScheduledTab()}
        {activeTab === "pinned" && renderPinnedTab()}
      </KeyboardAwareScrollViewCompat>

      <Modal visible={createModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <Card style={styles.modalContent}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Create Folder</ThemedText>

            <TextInput
              style={[styles.input, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, color: theme.text }]}
              placeholder="Folder name"
              placeholderTextColor={theme.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
            />

            <ThemedText style={[styles.label, { color: theme.text }]}>Icon</ThemedText>
            <View style={styles.optionsRow}>
              {FOLDER_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: selectedIcon === icon ? theme.primary + "20" : theme.glassBackground,
                      borderColor: selectedIcon === icon ? theme.primary : theme.glassBorder,
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Feather name={icon as any} size={20} color={selectedIcon === icon ? theme.primary : theme.text} />
                </Pressable>
              ))}
            </View>

            <ThemedText style={[styles.label, { color: theme.text }]}>Color</ThemedText>
            <View style={styles.optionsRow}>
              {FOLDER_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color, borderWidth: selectedColor === color ? 3 : 0, borderColor: "#FFFFFF" },
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.glassBackground }]}
                onPress={() => setCreateModalVisible(false)}
              >
                <ThemedText style={{ color: theme.text }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => createFolderMutation.mutate()}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
              >
                {createFolderMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={{ color: "#FFFFFF" }}>Create</ThemedText>
                )}
              </Pressable>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  tabsContainer: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.lg },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabText: {
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  loader: { paddingVertical: Spacing.xl },
  folderCard: { flexDirection: "row", alignItems: "center", padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  folderIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  folderInfo: { flex: 1 },
  folderName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  folderCount: { fontSize: 12, marginTop: 2 },
  deleteButton: { padding: Spacing.sm },
  emptyCard: { padding: Spacing.xl, alignItems: "center" },
  emptyTitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.md,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  emptyText: { fontSize: 13, marginTop: Spacing.xs, textAlign: "center" },
  scheduledCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  scheduledHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  scheduledTime: { flex: 1, fontSize: 13 },
  scheduledContent: { fontSize: Typography.body.fontSize, marginBottom: Spacing.sm },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: { fontSize: 11, textTransform: "uppercase" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: Spacing.lg },
  modalContent: { padding: Spacing.lg },
  modalTitle: {
    fontSize: Typography.h3.fontSize,
    marginBottom: Spacing.lg,
    textAlign: "center",
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.md },
  iconOption: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  modalButtons: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  modalButton: { flex: 1, alignItems: "center", paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
});
