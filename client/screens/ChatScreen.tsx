import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { MessageBubble, MessageType, MessageStatus } from "@/components/chat/MessageBubble";
import VoiceNoteRecorder from "@/components/chat/VoiceNoteRecorder";
import MessageAttachmentPicker from "@/components/chat/MessageAttachmentPicker";
import { MessageReactionPicker } from "@/components/chat/MessageReactionPicker";
import { ReplyMessagePreview } from "@/components/chat/ReplyMessagePreview";
import { MessageOptionsMenu } from "@/components/chat/MessageOptionsMenu";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { uploadFileWithProgress } from "@/lib/upload";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  readAt?: string | null;
  messageType?: MessageType;
  mediaUrl?: string | null;
  replyToId?: string | null;
  deletedAt?: string | null;
  reactions?: any[];
  replyTo?: any;
  status?: MessageStatus;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  linkDomain?: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

interface Conversation {
  id: string;
  status: "ACCEPTED" | "REQUEST";
  requestedByUserId: string | null;
}

interface OnlineStatus {
  isOnline: boolean;
  lastSeenAt: string | null;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { conversationId, otherUserId } = route.params;
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [attachmentPickerVisible, setAttachmentPickerVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reactionPickerPosition, setReactionPickerPosition] = useState({ x: 0, y: 0 });
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const { data: otherUser } = useQuery<any>({
    queryKey: [`/api/users/${otherUserId}`],
    enabled: !!otherUserId,
  });

  const { data: onlineStatus } = useQuery<OnlineStatus>({
    queryKey: [`/api/users/${otherUserId}/online-status`],
    enabled: !!otherUserId,
    refetchInterval: 30000,
  });

  const { data: conversation } = useQuery<Conversation>({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId,
  });

  const { data: canCallData } = useQuery<{ canCall: boolean; user?: any }>({
    queryKey: [`/api/users/${otherUserId}/can-call`],
    enabled: !!otherUserId,
  });

  const isPendingRequest = conversation?.status === "REQUEST" && conversation?.requestedByUserId !== user?.id;

  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleStartCall = useCallback(() => {
    if (!canCallData?.canCall || !otherUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("VoiceCall", {
      otherUserId,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarUrl: otherUser.avatarUrl,
      },
      isIncoming: false,
    });
  }, [canCallData, otherUser, otherUserId, navigation]);

  useEffect(() => {
    if (otherUser?.displayName) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <View style={styles.avatarWithStatus}>
              <Avatar uri={otherUser.avatarUrl} size={32} />
              {onlineStatus?.isOnline ? (
                <View style={[styles.onlineIndicator, { backgroundColor: "#22C55E" }]} />
              ) : null}
            </View>
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerName} numberOfLines={1}>
                {otherUser.displayName}
              </ThemedText>
              {onlineStatus?.isOnline ? (
                <ThemedText style={[styles.headerStatus, { color: "#22C55E" }]}>
                  Online
                </ThemedText>
              ) : onlineStatus?.lastSeenAt ? (
                <ThemedText style={[styles.headerStatus, { color: theme.textSecondary }]}>
                  {formatLastSeen(onlineStatus.lastSeenAt)}
                </ThemedText>
              ) : null}
            </View>
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            {canCallData?.canCall ? (
              <HeaderButton onPress={handleStartCall}>
                <Feather name="phone" size={22} color={theme.primary} />
              </HeaderButton>
            ) : null}
            <HeaderButton
              onPress={() => {
                navigation.navigate("ConversationSettings", {
                  conversationId,
                  otherUserId,
                  otherUserName: otherUser.displayName,
                  otherUserAvatar: otherUser.avatarUrl,
                });
              }}
            >
              <Feather name="settings" size={22} color={theme.primary} />
            </HeaderButton>
          </View>
        ),
      });
    }
  }, [otherUser, navigation, onlineStatus, theme.textSecondary, theme.primary, canCallData, handleStartCall, conversationId, otherUserId]);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/conversations/${conversationId}/messages`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (messages && messages.length > 0) {
      const hasUnread = messages.some(m => m.senderId !== user?.id && !m.readAt);
      if (hasUnread) {
        apiRequest("POST", `/api/conversations/${conversationId}/read`, {}).catch(console.error);
      }
    }
  }, [messages, conversationId, user?.id]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connect = () => {
      if (isUnmounted) return;
      
      const wsUrl = getApiUrl().replace("https://", "wss://").replace("http://", "ws://");
      ws = new WebSocket(`${wsUrl}ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "auth_success") {
            ws?.send(JSON.stringify({ type: "join_conversation", conversationId }));
          }
          
          if (data.type === "auth_error") {
            console.error("WebSocket auth failed:", data.message);
            ws?.close();
            return;
          }
          
          if (data.type === "new_message" && data.data.conversationId === conversationId) {
            queryClient.invalidateQueries({
              queryKey: [`/api/conversations/${conversationId}/messages`],
            });
          }

          if (data.type === "message_deleted" && data.data.conversationId === conversationId) {
            queryClient.invalidateQueries({
              queryKey: [`/api/conversations/${conversationId}/messages`],
            });
          }

          if (data.type === "message_reaction" && data.data.conversationId === conversationId) {
            queryClient.invalidateQueries({
              queryKey: [`/api/conversations/${conversationId}/messages`],
            });
          }

          if (data.type === "reaction_update" && data.data.conversationId === conversationId) {
            queryClient.invalidateQueries({
              queryKey: [`/api/conversations/${conversationId}/messages`],
            });
          }

          if (data.type === "status_update" && data.data.conversationId === conversationId) {
            queryClient.setQueryData<Message[]>(
              [`/api/conversations/${conversationId}/messages`],
              (oldMessages) => {
                if (!oldMessages) return oldMessages;
                return oldMessages.map(msg => 
                  msg.id === data.data.messageId 
                    ? { ...msg, status: data.data.status }
                    : msg
                );
              }
            );
          }

          if (data.type === "typing_indicator" && data.data.conversationId === conversationId) {
            setOtherUserTyping(data.data.isTyping);
          }

          if (data.type === "messages_read" && data.data.conversationId === conversationId) {
            queryClient.invalidateQueries({
              queryKey: [`/api/conversations/${conversationId}/messages`],
            });
          }
        } catch (error) {
          console.error("WebSocket message parse error:", error);
        }
      };
      
      ws.onclose = () => {
        if (!isUnmounted && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          reconnectTimeout = setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: [`/api/conversations/${conversationId}/messages`],
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
  }, [user?.id, conversationId, queryClient]);

  const sendTypingIndicatorViaWS = useCallback((typing: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: typing ? "typing_start" : "typing_stop",
        conversationId,
      }));
    }
  }, [conversationId]);

  const sendTypingIndicator = useCallback((typing: boolean) => {
    if (isTyping !== typing) {
      setIsTyping(typing);
      sendTypingIndicatorViaWS(typing);
    }
  }, [isTyping, sendTypingIndicatorViaWS]);

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    if (text.length > 0) {
      sendTypingIndicator(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }
  };

  const sendMutation = useMutation({
    mutationFn: async ({ content, messageType, mediaUrl, replyToId, fileName, fileSize, fileMimeType, voiceDuration, voiceWaveform }: { 
      content: string; 
      messageType?: MessageType;
      mediaUrl?: string;
      replyToId?: string;
      fileName?: string;
      fileSize?: number;
      fileMimeType?: string;
      voiceDuration?: number;
      voiceWaveform?: number[];
    }) => {
      const endpoint = messageType && messageType !== "TEXT" 
        ? `/api/conversations/${conversationId}/messages/media`
        : `/api/conversations/${conversationId}/messages`;
      
      const res = await apiRequest("POST", endpoint, {
        content,
        receiverId: otherUserId,
        messageType: messageType || "TEXT",
        mediaUrl,
        replyToId,
        fileName,
        fileSize,
        fileMimeType,
        voiceDuration,
        voiceWaveform,
      });
      return res.json();
    },
    onSuccess: (newMessage) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.setQueryData<Message[]>(
        [`/api/conversations/${conversationId}/messages`],
        (oldMessages) => {
          if (!oldMessages) return [newMessage];
          return [newMessage, ...oldMessages];
        }
      );
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setReplyTo(null);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await apiRequest("DELETE", `/api/messages/${messageId}`, {});
      return res.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({
        queryKey: [`/api/conversations/${conversationId}/messages`],
      });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const res = await apiRequest("POST", `/api/messages/${messageId}/react`, { emoji });
      return res.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({
        queryKey: [`/api/conversations/${conversationId}/messages`],
      });
    },
  });

  const handleSend = useCallback(() => {
    if (!message.trim() || sendMutation.isPending) return;
    const content = message.trim();
    setMessage("");
    sendTypingIndicator(false);
    sendMutation.mutate({ 
      content, 
      replyToId: replyTo?.id 
    });
  }, [message, sendMutation, replyTo, sendTypingIndicator]);

  const handleReply = useCallback((msg: Message) => {
    setReplyTo(msg);
    setShowOptionsMenu(false);
    setShowReactionPicker(false);
  }, []);

  const handleDelete = useCallback((messageId: string) => {
    Alert.alert(
      "Unsend Message",
      "This will remove the message for everyone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unsend", 
          style: "destructive",
          onPress: () => deleteMutation.mutate(messageId)
        },
      ]
    );
  }, [deleteMutation]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    reactMutation.mutate({ messageId, emoji });
  }, [reactMutation]);

  const handleMessageLongPress = useCallback((msg: Message) => {
    setSelectedMessage(msg);
    setReactionPickerPosition({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 3 });
    setShowReactionPicker(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleReactionSelected = useCallback((emoji: string) => {
    if (selectedMessage) {
      handleReact(selectedMessage.id, emoji);
    }
    setShowReactionPicker(false);
  }, [selectedMessage, handleReact]);

  const handleShowOptionsMenu = useCallback(() => {
    setShowReactionPicker(false);
    setShowOptionsMenu(true);
  }, []);

  const handleVoiceRecordComplete = useCallback(async (uri: string, duration: number, waveform: number[]) => {
    setShowVoiceRecorder(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uploadResult = await uploadFileWithProgress(uri, "posts", "audio/m4a", duration);
      
      if (uploadResult.url) {
        sendMutation.mutate({
          content: "Voice message",
          messageType: "VOICE",
          mediaUrl: uploadResult.url,
          voiceDuration: duration,
          voiceWaveform: waveform,
        });
      }
    } catch (uploadError: any) {
      console.error("Failed to upload voice message:", uploadError);
      Alert.alert("Upload Failed", uploadError.message || "Could not upload voice message. Please try again.");
    }
  }, [sendMutation]);

  const handleSelectMedia = useCallback(async (uri: string, type: 'photo' | 'video', thumbnail?: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const mimeType = type === 'photo' ? "image/jpeg" : "video/mp4";
      const uploadResult = await uploadFileWithProgress(uri, "posts", mimeType);
      
      if (uploadResult.url) {
        sendMutation.mutate({
          content: type === 'photo' ? "Photo" : "Video",
          messageType: type === 'photo' ? "PHOTO" : "VIDEO",
          mediaUrl: uploadResult.url,
        });
      }
    } catch (uploadError: any) {
      console.error(`Failed to upload ${type}:`, uploadError);
      Alert.alert("Upload Failed", uploadError.message || `Could not upload ${type}. Please try again.`);
    }
  }, [sendMutation]);

  const handleSelectDocument = useCallback(async (uri: string, name: string, size: number, mimeType: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uploadResult = await uploadFileWithProgress(uri, "posts", mimeType);
      
      if (uploadResult.url) {
        sendMutation.mutate({
          content: name,
          messageType: "FILE",
          mediaUrl: uploadResult.url,
          fileName: name,
          fileSize: size,
          fileMimeType: mimeType,
        });
      }
    } catch (uploadError: any) {
      console.error("Failed to upload document:", uploadError);
      Alert.alert("Upload Failed", uploadError.message || "Could not upload document. Please try again.");
    }
  }, [sendMutation]);

  const handleOpenCamera = useCallback(async () => {
    const ImagePicker = await import("expo-image-picker");
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please enable camera access to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      handleSelectMedia(asset.uri, 'photo');
    }
  }, [handleSelectMedia]);

  const handleCopyMessage = useCallback(() => {
    setShowOptionsMenu(false);
  }, []);

  const handleForwardMessage = useCallback(() => {
    setShowOptionsMenu(false);
    Alert.alert("Forward", "Forward functionality coming soon!");
  }, []);

  const handleDeleteForMe = useCallback(() => {
    setShowOptionsMenu(false);
  }, []);

  const handleDeleteForEveryone = useCallback(() => {
    if (selectedMessage) {
      handleDelete(selectedMessage.id);
    }
    setShowOptionsMenu(false);
  }, [selectedMessage, handleDelete]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {otherUser ? (
        <View style={styles.emptyContent}>
          <Avatar uri={otherUser.avatarUrl} size={80} />
          <ThemedText style={[styles.emptyName, { color: theme.text }]}>
            {otherUser.displayName}
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Start the conversation!
          </ThemedText>
        </View>
      ) : (
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Start the conversation!
        </ThemedText>
      )}
    </View>
  );

  const sortedMessages = React.useMemo(() => {
    if (!messages) return [];
    return [...messages].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [messages]);

  const convertMessageForBubble = (msg: Message) => {
    return {
      id: msg.id,
      type: msg.messageType || "TEXT" as MessageType,
      content: msg.content,
      mediaUrl: msg.mediaUrl || undefined,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      fileMimeType: msg.fileMimeType,
      voiceDuration: msg.voiceDuration,
      voiceWaveform: msg.voiceWaveform,
      linkUrl: msg.linkUrl,
      linkTitle: msg.linkTitle,
      linkDescription: msg.linkDescription,
      linkImage: msg.linkImage,
      linkDomain: msg.linkDomain,
      status: msg.status || (msg.read ? "READ" : "DELIVERED") as MessageStatus,
      senderId: msg.senderId,
      createdAt: msg.createdAt,
      replyToMessage: msg.replyTo ? {
        id: msg.replyTo.id,
        content: msg.replyTo.content,
        senderName: msg.replyTo.sender?.displayName || "Unknown",
      } : undefined,
    };
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
        </View>
      ) : (
        <FlatList
          inverted={sortedMessages.length > 0}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: Spacing.lg,
            paddingBottom: headerHeight + Spacing.lg,
            paddingHorizontal: Spacing.sm,
            flexGrow: 1,
          }}
          data={sortedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSent = item.senderId === user?.id;
            
            return (
              <MessageBubble
                message={convertMessageForBubble(item)}
                isSent={isSent}
                senderName={item.sender?.displayName}
                senderAvatar={item.sender?.avatarUrl || undefined}
                onLongPress={() => handleMessageLongPress(item)}
              />
            );
          }}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
          ListHeaderComponent={
            <TypingIndicator
              isVisible={otherUserTyping}
              userName={otherUser?.displayName}
              userAvatar={otherUser?.avatarUrl}
            />
          }
        />
      )}

      {isPendingRequest ? (
        <View
          style={[
            styles.requestBanner,
            {
              paddingBottom: insets.bottom + Spacing.sm,
              backgroundColor: theme.backgroundSecondary,
              borderTopColor: theme.border,
            },
          ]}
        >
          <ThemedText style={[styles.requestText, { color: theme.textSecondary }]}>
            Accept this message request to reply
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot }]}>
          {replyTo ? (
            <ReplyMessagePreview
              message={{
                id: replyTo.id,
                content: replyTo.content,
                senderName: replyTo.sender?.displayName || "Unknown",
                type: replyTo.messageType || "TEXT",
              }}
              onClose={() => setReplyTo(null)}
              isOwn={replyTo.senderId === user?.id}
            />
          ) : null}

          {showVoiceRecorder ? (
            <View
              style={[
                styles.voiceRecorderContainer,
                {
                  paddingBottom: insets.bottom + Spacing.sm,
                  backgroundColor: theme.backgroundRoot,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <VoiceNoteRecorder
                onRecordComplete={handleVoiceRecordComplete}
                onCancel={() => setShowVoiceRecorder(false)}
              />
            </View>
          ) : (
            <View
              style={[
                styles.inputContainer,
                {
                  paddingBottom: insets.bottom + Spacing.sm,
                  backgroundColor: theme.backgroundRoot,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <Pressable 
                onPress={() => setAttachmentPickerVisible(true)} 
                style={styles.mediaButton}
              >
                <Feather name="plus" size={22} color={theme.primary} />
              </Pressable>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Type a message..."
                placeholderTextColor={theme.textSecondary}
                value={message}
                onChangeText={handleTextChange}
                multiline
                maxLength={1000}
                testID="input-message"
              />
              {message.trim() ? (
                <Pressable
                  style={[
                    styles.sendButton,
                    { backgroundColor: theme.primary },
                    sendMutation.isPending && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={sendMutation.isPending}
                  testID="button-send-message"
                >
                  {sendMutation.isPending ? (
                    <LoadingIndicator size="small" />
                  ) : (
                    <Feather name="send" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.micButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowVoiceRecorder(true)}
                >
                  <Feather name="mic" size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}

      <MessageAttachmentPicker
        visible={attachmentPickerVisible}
        onClose={() => setAttachmentPickerVisible(false)}
        onSelectMedia={handleSelectMedia}
        onSelectDocument={handleSelectDocument}
        onOpenCamera={handleOpenCamera}
      />

      <MessageReactionPicker
        visible={showReactionPicker}
        position={reactionPickerPosition}
        existingReactions={selectedMessage?.reactions?.map(r => r.emoji) || []}
        onSelectReaction={handleReactionSelected}
        onClose={() => setShowReactionPicker(false)}
      />

      {selectedMessage ? (
        <MessageOptionsMenu
          visible={showOptionsMenu}
          message={{
            id: selectedMessage.id,
            content: selectedMessage.content,
            senderId: selectedMessage.senderId,
            type: selectedMessage.messageType || "TEXT",
            createdAt: selectedMessage.createdAt,
          }}
          currentUserId={user?.id || ""}
          onClose={() => setShowOptionsMenu(false)}
          onReply={() => handleReply(selectedMessage)}
          onCopy={handleCopyMessage}
          onForward={handleForwardMessage}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForEveryone={handleDeleteForEveryone}
          onReact={handleShowOptionsMenu}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatarWithStatus: {
    position: "relative",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerInfo: {
    flexDirection: "column",
  },
  headerName: {
    fontSize: Typography.body.fontSize,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.semiBold || "System",
      },
      android: {
        fontFamily: Fonts?.semiBold,
        fontWeight: "600" as const,
      },
      default: {
        fontWeight: "600" as const,
      },
    }),
  },
  headerStatus: {
    fontSize: 11,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContent: {
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyName: {
    fontSize: Typography.h4.fontSize,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.semiBold || "System",
      },
      android: {
        fontFamily: Fonts?.semiBold,
        fontWeight: "600" as const,
      },
      default: {
        fontWeight: "600" as const,
      },
    }),
  },
  emptyText: {
    textAlign: "center",
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  voiceRecorderContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  mediaButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.regular || "System",
      },
      android: {
        fontFamily: Fonts?.regular,
      },
      default: {},
    }),
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  requestBanner: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    alignItems: "center",
  },
  requestText: {
    fontSize: Typography.body.fontSize,
    textAlign: "center",
  },
});
