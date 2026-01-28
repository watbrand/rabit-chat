import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "@/components/Avatar";
import { GlassButton } from "@/components/GlassButton";
import { GlassInput } from "@/components/GlassInput";

interface BroadcastChannel {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  subscriberCount: number;
  messageCount: number;
  isActive: boolean;
  owner?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  isSubscribed?: boolean;
}

export default function BroadcastChannelsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: channels = [], isLoading, refetch } = useQuery<BroadcastChannel[]>({
    queryKey: ["/api/broadcast-channels"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return apiRequest("POST", `/api/broadcast-channels/${channelId}/subscribe`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-channels"] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (channelId: string) => {
      return apiRequest("POST", `/api/broadcast-channels/${channelId}/unsubscribe`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-channels"] });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/broadcast-channels", {
        name: newChannelName,
        description: newChannelDescription,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcast-channels"] });
      setShowCreateModal(false);
      setNewChannelName("");
      setNewChannelDescription("");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderChannel = ({ item }: { item: BroadcastChannel }) => (
    <Pressable
      style={[styles.channelCard, { backgroundColor: theme.backgroundSecondary }]}
      onPress={() => navigation.navigate("BroadcastChannelDetail", { channelId: item.id })}
    >
      <View style={styles.channelHeader}>
        <Avatar
          uri={item.avatarUrl || item.owner?.avatarUrl}
          size={50}
        />
        <View style={styles.channelInfo}>
          <View style={styles.channelNameRow}>
            <Text style={[styles.channelName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.owner?.isVerified ? (
              <Feather name="check-circle" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
            ) : null}
          </View>
          <Text style={[styles.channelOwner, { color: theme.textSecondary }]} numberOfLines={1}>
            by @{item.owner?.username}
          </Text>
        </View>
        <Pressable
          style={[
            styles.subscribeButton,
            item.isSubscribed
              ? { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.primary }
              : { backgroundColor: theme.primary },
          ]}
          onPress={() =>
            item.isSubscribed
              ? unsubscribeMutation.mutate(item.id)
              : subscribeMutation.mutate(item.id)
          }
        >
          <Text
            style={[
              styles.subscribeButtonText,
              { color: item.isSubscribed ? theme.primary : "#fff" },
            ]}
          >
            {item.isSubscribed ? "Joined" : "Join"}
          </Text>
        </Pressable>
      </View>

      {item.description ? (
        <Text style={[styles.channelDescription, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.channelStats}>
        <View style={styles.stat}>
          <Feather name="users" size={14} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.subscriberCount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stat}>
          <Feather name="message-circle" size={14} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.messageCount.toLocaleString()} messages
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: theme.text }]}>Channels</Text>
        <Pressable
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={channels}
          renderItem={renderChannel}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="radio" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No channels yet. Create one!
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Create Channel
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <GlassInput
              placeholder="Channel Name"
              value={newChannelName}
              onChangeText={setNewChannelName}
              containerStyle={styles.input}
            />

            <GlassInput
              placeholder="Description (optional)"
              value={newChannelDescription}
              onChangeText={setNewChannelDescription}
              multiline
              numberOfLines={3}
              containerStyle={styles.input}
            />

            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Broadcast channels let you send one-way messages to all your subscribers.
            </Text>

            <GlassButton
              title={createChannelMutation.isPending ? "Creating..." : "Create Channel"}
              onPress={() => createChannelMutation.mutate()}
              disabled={!newChannelName.trim() || createChannelMutation.isPending}
              style={styles.createModalButton}
            />
            </View>
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
    gap: 12,
  },
  channelCard: {
    borderRadius: 16,
    padding: 16,
  },
  channelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  channelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  channelNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  channelName: {
    fontSize: 16,
    fontWeight: "600",
  },
  channelOwner: {
    fontSize: 13,
    marginTop: 2,
  },
  subscribeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  channelDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  channelStats: {
    flexDirection: "row",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,
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
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  createModalButton: {
    marginTop: 8,
  },
});
