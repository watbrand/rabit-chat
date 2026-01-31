import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { LoadingIndicator } from "@/components/animations";

interface GroupMessage {
  id: string;
  senderId: string;
  content: string;
  messageType: string;
  mediaUrl?: string;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface GroupConversation {
  id: string;
  name?: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  creatorId: string;
  members?: any[];
}

export default function GroupChatScreen({ route, navigation }: any) {
  const { conversationId } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation, isLoading: conversationLoading } = useQuery<GroupConversation>({
    queryKey: ["/api/group-conversations", conversationId],
  });

  const { data: messages = [], isLoading: messagesLoading, refetch } = useQuery<GroupMessage[]>({
    queryKey: ["/api/group-conversations", conversationId, "messages"],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/group-conversations/${conversationId}/messages`, getApiUrl()).toString(),
        { credentials: "include" }
      );
      return res.json();
    },
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/group-conversations/${conversationId}/messages`, { content });
    },
    onSuccess: () => {
      setMessage("");
      refetch();
    },
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    if (conversation) {
      navigation.setOptions({
        title: conversation.name || "Group Chat",
      });
    }
  }, [conversation, navigation]);

  const renderMessage = ({ item, index }: { item: GroupMessage; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const prevMessage = messages[index - 1];
    const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== item.senderId);

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        {!isOwn && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <Avatar
                uri={item.sender?.avatarUrl}
                size={32}
              />
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isOwn
              ? { backgroundColor: theme.primary }
              : { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          {showAvatar && !isOwn ? (
            <Text style={[styles.senderName, { color: theme.primary }]}>
              {item.sender?.displayName || item.sender?.username}
            </Text>
          ) : null}
          <Text style={[styles.messageText, { color: isOwn ? "#fff" : theme.text }]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, { color: isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  if (conversationLoading || messagesLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.headerInfo}>
        <View style={styles.headerAvatar}>
          <Feather name="users" size={20} color={theme.primary} />
        </View>
        <View style={styles.headerDetails}>
          <Text style={[styles.headerName, { color: theme.text }]}>
            {conversation?.name || "Group Chat"}
          </Text>
          <Text style={[styles.headerMembers, { color: theme.textSecondary }]}>
            {conversation?.memberCount || 0} members
          </Text>
        </View>
        <Pressable style={styles.headerButton}>
          <Feather name="info" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No messages yet. Start the conversation!
            </Text>
          </View>
        }
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={styles.attachButton}>
          <Feather name="plus-circle" size={24} color={theme.primary} />
        </Pressable>
        <TextInput
          style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.textSecondary}
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
        />
        <Pressable
          style={[styles.sendButton, { backgroundColor: theme.primary }]}
          onPress={handleSend}
          disabled={!message.trim() || sendMessageMutation.isPending}
        >
          <Feather name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(138, 43, 226, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerMembers: {
    fontSize: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 8,
    maxWidth: "80%",
  },
  messageRowOwn: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: "100%",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
