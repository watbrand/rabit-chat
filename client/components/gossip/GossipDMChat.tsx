import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { LoadingIndicator, EmptyState } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";

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
}

export function GossipDMChat({ conversationId, theirAlias }: GossipDMChatProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(DEVICE_ID_KEY).then(setDeviceId);
  }, []);

  const { data: messagesData, isLoading } = useQuery({
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

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!deviceId) throw new Error("No device ID");
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
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({
        queryKey: ["/api/gossip/v2/dm/conversations", conversationId, "messages"],
      });
      setMessageText("");
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = messageText.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }, [messageText, sendMutation]);

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={styles.anonymousHeader}>
        <Feather name="shield" size={14} color={theme.primary} />
        <ThemedText style={[styles.anonymousText, { color: theme.textSecondary }]}>
          End-to-end anonymous chat
        </ThemedText>
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
        showsVerticalScrollIndicator={false}
      />

      <View
        style={[
          styles.inputContainer,
          { borderTopColor: theme.glassBorder, paddingBottom: insets.bottom || Spacing.md },
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
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
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
  anonymousHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
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
