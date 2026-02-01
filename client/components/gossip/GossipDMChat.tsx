import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { LoadingIndicator, EmptyState } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";

const MAX_MESSAGE_LENGTH = 2000;

const DEVICE_ID_KEY = "@gossip_device_id";

interface GossipMessage {
  id: string;
  conversationId: string;
  content: string;
  senderHash: string;
  senderAlias: string;
  isRead: boolean;
  createdAt: string;
  isFromMe: boolean;
}

function MessageBubble({ message }: { message: GossipMessage }) {
  const { theme } = useTheme();
  const isFromMe = message.isFromMe;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[
        styles.messageBubble,
        isFromMe ? styles.myMessage : styles.theirMessage,
        {
          backgroundColor: isFromMe ? theme.primary : theme.backgroundSecondary,
        },
      ]}
    >
      {!isFromMe ? (
        <ThemedText style={[styles.senderAlias, { color: theme.primary }]}>
          {message.senderAlias}
        </ThemedText>
      ) : null}
      <ThemedText
        style={[
          styles.messageText,
          { color: isFromMe ? "#FFFFFF" : theme.text },
        ]}
      >
        {message.content}
      </ThemedText>
      <View style={styles.messageFooter}>
        <ThemedText
          style={[
            styles.messageTime,
            { color: isFromMe ? "rgba(255,255,255,0.7)" : theme.textTertiary },
          ]}
        >
          {formatTime(message.createdAt)}
        </ThemedText>
        {isFromMe ? (
          <Feather
            name={message.isRead ? "check-circle" : "check"}
            size={12}
            color="rgba(255,255,255,0.7)"
            style={styles.checkIcon}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}

interface GossipDMChatProps {
  conversationId: string;
  theirAlias?: string;
  onConnectionChange?: (isConnected: boolean) => void;
}

export function GossipDMChat({ conversationId, theirAlias, onConnectionChange }: GossipDMChatProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      let id = await safeGetItem(DEVICE_ID_KEY);
      if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        await safeSetItem(DEVICE_ID_KEY, id);
      }
      setDeviceId(id);
    };
    loadOrCreateDeviceId();
  }, []);

  const { data: messagesData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/gossip/v2/dm/conversations", conversationId, "messages", deviceId],
    queryFn: async () => {
      if (!deviceId) return { messages: [] };
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/dm/conversations/${conversationId}/messages`,
        { headers: { "x-device-id": deviceId } }
      );
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
    enabled: !!deviceId && !!conversationId,
    refetchInterval: 5000,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) return;
      await fetch(
        `${getApiUrl()}/api/gossip/v2/dm/conversations/${conversationId}/read`,
        {
          method: "POST",
          headers: { "x-device-id": deviceId },
        }
      );
    },
  });

  useEffect(() => {
    if (messagesData?.messages?.length > 0) {
      markReadMutation.mutate();
    }
  }, [messagesData?.messages?.length]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      if (isUnmounted || !deviceId) return;

      const wsUrl = getApiUrl().replace("https://", "wss://").replace("http://", "ws://");
      ws = new WebSocket(`${wsUrl}ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
        setIsConnected(true);
        onConnectionChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "gossip_dm_message" && data.data.conversationId === conversationId) {
            queryClient.invalidateQueries({
              queryKey: ["/api/gossip/v2/dm/conversations", conversationId, "messages"],
            });
          }
        } catch (error) {
          console.error("WebSocket message parse error:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        onConnectionChange?.(false);
        if (!isUnmounted && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectTimeout = setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ["/api/gossip/v2/dm/conversations", conversationId, "messages"],
            });
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      ws?.close();
    };
  }, [deviceId, conversationId, queryClient, onConnectionChange]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!deviceId) throw new Error("No device ID");
      if (isBlocked) throw new Error("You have blocked this user");
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/dm/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ content }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({
        queryKey: ["/api/gossip/v2/dm/conversations", conversationId, "messages"],
      });
      setMessageText("");
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to send message. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!deviceId) throw new Error("No device ID");
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/dm/messages/${messageId}`,
        {
          method: "DELETE",
          headers: { "x-device-id": deviceId },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete message");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({
        queryKey: ["/api/gossip/v2/dm/conversations", conversationId, "messages"],
      });
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to delete message. Please try again.");
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) throw new Error("No device ID");
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/dm/conversations/${conversationId}/block`,
        {
          method: "POST",
          headers: { "x-device-id": deviceId },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to block user");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsBlocked(true);
      Alert.alert("Blocked", "You have blocked this anonymous user.");
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to block user. Please try again.");
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!deviceId) throw new Error("No device ID");
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/dm/conversations/${conversationId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ reason }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to report user");
      }
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Reported", "Thank you for your report. We will review it shortly.");
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to report. Please try again.");
    },
  });

  const handleBlock = useCallback(() => {
    if (isBlocked) {
      Alert.alert("Already Blocked", "You have already blocked this user.");
      return;
    }
    Alert.alert(
      "Block User",
      "Are you sure you want to block this anonymous user? You won't receive messages from them.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => blockMutation.mutate() },
      ]
    );
  }, [isBlocked, blockMutation]);

  const handleReport = useCallback(() => {
    Alert.alert(
      "Report User",
      "Why are you reporting this user?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Harassment", onPress: () => reportMutation.mutate("harassment") },
        { text: "Spam", onPress: () => reportMutation.mutate("spam") },
        { text: "Inappropriate", onPress: () => reportMutation.mutate("inappropriate") },
      ]
    );
  }, [reportMutation]);

  const handleSend = useCallback(() => {
    const trimmed = messageText.trim();
    if (!trimmed || sendMutation.isPending) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      Alert.alert("Message too long", `Messages must be under ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    if (isBlocked) {
      Alert.alert("Blocked", "You have blocked this user and cannot send messages.");
      return;
    }
    sendMutation.mutate(trimmed);
  }, [messageText, sendMutation, isBlocked]);

  const messages = (messagesData?.messages || []).reverse();

  const renderMessage = useCallback(
    ({ item }: { item: GossipMessage }) => <MessageBubble message={item} />,
    []
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <EmptyState type="messages" message="Start the conversation" />
        <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
          Your identity stays hidden. Be respectful.
        </ThemedText>
      </View>
    ),
    [theme]
  );

  if (isLoading && !messagesData) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (error && !messagesData) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={Colors.light.error} />
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          Failed to load messages
        </ThemedText>
        <Pressable
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => refetch()}
        >
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.anonymousHeader}>
        <View style={styles.headerLeft}>
          <Feather name="shield" size={14} color={theme.primary} />
          <ThemedText style={[styles.anonymousText, { color: theme.textSecondary }]}>
            End-to-end anonymous chat
          </ThemedText>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? "#22C55E" : theme.textTertiary }]} />
          <Pressable onPress={handleReport} hitSlop={8}>
            <Feather name="flag" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable onPress={handleBlock} hitSlop={8}>
            <Feather name="slash" size={16} color={isBlocked ? Colors.light.error : theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted={messages.length > 0}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          messages.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={true}
        scrollIndicatorInsets={{ top: insets.bottom }}
      />

      <View
        style={[
          styles.inputContainer,
          { borderTopColor: theme.glassBorder, paddingBottom: insets.bottom + Spacing.sm },
        ]}
      >
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            editable={!isBlocked}
          />
        </View>

        <Pressable
          style={[
            styles.sendButton,
            {
              backgroundColor: messageText.trim()
                ? theme.primary
                : theme.backgroundSecondary,
            },
          ]}
          onPress={handleSend}
          disabled={!messageText.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? (
            <LoadingIndicator size="small" />
          ) : (
            <Feather
              name="send"
              size={20}
              color={messageText.trim() ? "#FFFFFF" : theme.textTertiary}
            />
          )}
        </Pressable>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  anonymousHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  anonymousText: {
    fontSize: 12,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
  },
  emptyHint: {
    fontSize: 13,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  senderAlias: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  checkIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? Spacing.sm : 4,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
