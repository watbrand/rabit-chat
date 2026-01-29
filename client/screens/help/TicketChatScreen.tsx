import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  Dimensions,
  RefreshControl,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import MessageAttachmentPicker from "@/components/chat/MessageAttachmentPicker";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Gradients, Fonts, Shadows } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { uploadFileWithProgress } from "@/lib/upload";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type TicketChatScreenRouteProp = RouteProp<RootStackParamList, "TicketChat">;

type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Ticket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "USER" | "STAFF" | "SYSTEM";
  content: string;
  created_at: string;
  read_at: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_type: string | null;
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isAdmin?: boolean;
  };
}

const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.8;

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileIcon(mimeType?: string | null): keyof typeof Feather.glyphMap {
  if (!mimeType) return "file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "music";
  if (mimeType.includes("pdf")) return "file-text";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive";
  if (mimeType.includes("word") || mimeType.includes("document")) return "file-text";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "grid";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "monitor";
  return "file";
}

function isImageType(mimeType?: string | null): boolean {
  return mimeType?.startsWith("image/") || false;
}

interface MessageBubbleProps {
  message: TicketMessage;
  isSent: boolean;
  showSenderName: boolean;
}

function SupportMessageBubble({ message, isSent, showSenderName }: MessageBubbleProps) {
  const { theme, isDark } = useTheme();

  const handleDownloadAttachment = useCallback(() => {
    if (message.attachment_url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert("Download", `Download ${message.attachment_name || "file"}?`);
    }
  }, [message.attachment_url, message.attachment_name]);

  const renderAttachment = () => {
    if (!message.attachment_url) return null;

    const isImage = isImageType(message.attachment_type);
    const iconName = getFileIcon(message.attachment_type);

    if (isImage) {
      return (
        <Pressable onPress={handleDownloadAttachment} testID={`attachment-${message.id}`}>
          <Animated.Image
            entering={FadeIn.duration(300)}
            source={{ uri: message.attachment_url }}
            style={styles.attachmentImage}
            resizeMode="cover"
          />
        </Pressable>
      );
    }

    const iconBg = isSent ? "rgba(255,255,255,0.2)" : theme.primary + "15";
    const iconColor = isSent ? "#FFFFFF" : theme.primary;
    const textColor = isSent ? "#FFFFFF" : theme.text;
    const secondaryColor = isSent ? "rgba(255,255,255,0.7)" : theme.textSecondary;

    return (
      <Pressable
        style={styles.fileContainer}
        onPress={handleDownloadAttachment}
        testID={`attachment-${message.id}`}
      >
        <View style={[styles.fileIconContainer, { backgroundColor: iconBg }]}>
          <Feather name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.fileInfoContainer}>
          <ThemedText
            style={[styles.fileName, { color: textColor }]}
            numberOfLines={1}
          >
            {message.attachment_name || "File"}
          </ThemedText>
          <ThemedText style={[styles.fileSize, { color: secondaryColor }]}>
            {formatFileSize(message.attachment_size)}
          </ThemedText>
        </View>
        <View style={[styles.downloadButton, { backgroundColor: iconBg }]}>
          <Feather name="download" size={18} color={iconColor} />
        </View>
      </Pressable>
    );
  };

  const renderContent = () => (
    <>
      {showSenderName && !isSent && message.sender ? (
        <ThemedText style={[styles.senderName, { color: theme.primary }]}>
          {message.sender.displayName || message.sender.username}
          {message.sender.isAdmin ? " (Support)" : ""}
        </ThemedText>
      ) : null}
      {renderAttachment()}
      {message.content ? (
        <ThemedText
          style={[
            styles.messageText,
            { color: isSent ? "#FFFFFF" : theme.text },
          ]}
        >
          {message.content}
        </ThemedText>
      ) : null}
      <View style={styles.metaRow}>
        <ThemedText
          style={[
            styles.timestamp,
            { color: isSent ? "rgba(255,255,255,0.7)" : theme.textSecondary },
          ]}
        >
          {formatTime(message.created_at)}
        </ThemedText>
        {isSent ? (
          <View style={styles.readReceipt}>
            {message.read_at ? (
              <View style={styles.doubleCheckContainer}>
                <Feather name="check" size={12} color="#34D399" style={styles.checkOverlap} />
                <Feather name="check" size={12} color="#34D399" />
              </View>
            ) : (
              <Feather name="check" size={12} color="rgba(255,255,255,0.7)" />
            )}
          </View>
        ) : null}
      </View>
    </>
  );

  if (isSent) {
    return (
      <View style={[styles.bubbleContainer, styles.bubbleContainerSent]}>
        <LinearGradient
          colors={Gradients.primary as unknown as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleSent]}
        >
          {renderContent()}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleContainer, styles.bubbleContainerReceived]}>
      {message.sender?.avatarUrl || message.sender_type === "STAFF" ? (
        <Avatar
          uri={message.sender?.avatarUrl}
          size={28}
        />
      ) : null}
      <View
        style={[
          styles.bubble,
          styles.bubbleReceived,
          {
            backgroundColor: isDark ? theme.glassBackground : theme.backgroundDefault,
            borderColor: theme.glassBorder,
          },
        ]}
      >
        {renderContent()}
      </View>
    </View>
  );
}

function DateSeparator({ date }: { date: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.dateSeparator}>
      <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
      <ThemedText style={[styles.dateText, { color: theme.textTertiary }]}>
        {formatDate(date)}
      </ThemedText>
      <View style={[styles.dateLine, { backgroundColor: theme.border }]} />
    </View>
  );
}

function EmptyTicketState({ ticketSubject }: { ticketSubject?: string }) {
  const { theme } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContent}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.primary + "15" }]}>
          <Feather name="message-circle" size={48} color={theme.primary} />
        </View>
        <ThemedText type="title3" style={styles.emptyTitle}>
          Start the Conversation
        </ThemedText>
        {ticketSubject ? (
          <ThemedText style={[styles.emptySubject, { color: theme.textSecondary }]}>
            "{ticketSubject}"
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
          Our support team will respond as soon as possible. You can also add attachments to help explain your issue.
        </ThemedText>
      </Animated.View>
    </View>
  );
}

export default function TicketChatScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const route = useRoute<TicketChatScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const { ticketId } = route.params;
  const [message, setMessage] = useState("");
  const [attachmentPickerVisible, setAttachmentPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [supportTyping, setSupportTyping] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: ticketData, isLoading: ticketLoading } = useQuery<{ ticket: Ticket; messages: TicketMessage[] }>({
    queryKey: [`/api/support/tickets/${ticketId}`],
    enabled: !!ticketId,
  });
  
  const ticket = ticketData?.ticket;
  const ticketMessages = ticketData?.messages || [];

  const { data: messagesResponse, isLoading: messagesLoading, refetch: refetchMessages } = useQuery<{ messages: TicketMessage[] }>({
    queryKey: [`/api/support/tickets/${ticketId}/messages`],
    enabled: !!ticketId,
    refetchInterval: 5000,
  });
  
  const messages = messagesResponse?.messages || ticketMessages;

  useEffect(() => {
    if (messages && messages.length > 0) {
      const hasUnread = messages.some(m => m.sender_type !== "USER" && !m.read_at);
      if (hasUnread) {
        apiRequest("POST", `/api/support/tickets/${ticketId}/read`, {}).catch(console.error);
      }
    }
  }, [messages, ticketId]);

  const getStatusColor = (status?: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return theme.primary;
      case "PENDING":
        return theme.warning;
      case "RESOLVED":
        return theme.success;
      case "CLOSED":
        return theme.textTertiary;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status?: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return "Open";
      case "PENDING":
        return "Pending";
      case "RESOLVED":
        return "Resolved";
      case "CLOSED":
        return "Closed";
      default:
        return status || "";
    }
  };

  useEffect(() => {
    if (ticket) {
      const statusColor = getStatusColor(ticket.status);
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <ThemedText style={styles.headerSubject} numberOfLines={1}>
              {ticket.subject}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
              <ThemedText style={[styles.statusText, { color: statusColor }]}>
                {getStatusLabel(ticket.status)}
              </ThemedText>
            </View>
          </View>
        ),
        headerRight: () => (
          <HeaderButton
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                "Ticket Options",
                undefined,
                [
                  {
                    text: "View Details",
                    onPress: () => {
                      Alert.alert("Ticket Details", `Category: ${ticket.category}\nPriority: ${ticket.priority}\nCreated: ${formatDate(ticket.created_at)}`);
                    },
                  },
                  ticket.status !== "CLOSED"
                    ? {
                        text: "Close Ticket",
                        style: "destructive",
                        onPress: () => handleCloseTicket(),
                      }
                    : null,
                  { text: "Cancel", style: "cancel" },
                ].filter(Boolean) as any
              );
            }}
            testID="button-ticket-options"
          >
            <Feather name="more-vertical" size={22} color={theme.primary} />
          </HeaderButton>
        ),
      });
    }
  }, [ticket, navigation, theme]);

  const handleCloseTicket = useCallback(() => {
    Alert.alert(
      "Close Ticket",
      "Are you sure you want to close this ticket? You can reopen it later if needed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest("PATCH", `/api/support/tickets/${ticketId}`, { status: "CLOSED" });
              queryClient.invalidateQueries({ queryKey: [`/api/support/tickets/${ticketId}`] });
              queryClient.invalidateQueries({ queryKey: ["/api/support/inbox"] });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error("Failed to close ticket:", error);
              Alert.alert("Error", "Failed to close ticket. Please try again.");
            }
          },
        },
      ]
    );
  }, [ticketId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async ({ content, attachmentUrl, attachmentName, attachmentSize, attachmentType }: {
      content: string;
      attachmentUrl?: string;
      attachmentName?: string;
      attachmentSize?: number;
      attachmentType?: string;
    }) => {
      const res = await apiRequest("POST", `/api/support/tickets/${ticketId}/messages`, {
        content,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentType,
      });
      return res.json();
    },
    onSuccess: (newMessage) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.setQueryData<TicketMessage[]>(
        [`/api/support/tickets/${ticketId}/messages`],
        (oldMessages) => {
          if (!oldMessages) return [newMessage];
          return [newMessage, ...oldMessages];
        }
      );
      queryClient.invalidateQueries({ queryKey: ["/api/support/inbox"] });
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    },
  });

  const handleSend = useCallback(() => {
    if (!message.trim() || sendMutation.isPending) return;
    const content = message.trim();
    setMessage("");
    sendMutation.mutate({ content });
  }, [message, sendMutation]);

  const handleSelectMedia = useCallback(async (uri: string, type: 'photo' | 'video') => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const mimeType = type === 'photo' ? "image/jpeg" : "video/mp4";
      const uploadResult = await uploadFileWithProgress(uri, "general", mimeType, undefined, (progress) => {
        setUploadProgress(progress);
      });

      if (uploadResult.url) {
        sendMutation.mutate({
          content: "",
          attachmentUrl: uploadResult.url,
          attachmentName: type === 'photo' ? "Photo" : "Video",
          attachmentType: mimeType,
        });
      }
    } catch (error: any) {
      console.error(`Failed to upload ${type}:`, error);
      Alert.alert("Upload Failed", error.message || `Could not upload ${type}. Please try again.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [sendMutation]);

  const handleSelectDocument = useCallback(async (uri: string, name: string, size: number, mimeType: string) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const uploadResult = await uploadFileWithProgress(uri, "general", mimeType, undefined, (progress) => {
        setUploadProgress(progress);
      });

      if (uploadResult.url) {
        sendMutation.mutate({
          content: "",
          attachmentUrl: uploadResult.url,
          attachmentName: name,
          attachmentSize: size,
          attachmentType: mimeType,
        });
      }
    } catch (error: any) {
      console.error("Failed to upload document:", error);
      Alert.alert("Upload Failed", error.message || "Could not upload document. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
      handleSelectMedia(result.assets[0].uri, 'photo');
    }
  }, [handleSelectMedia]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchMessages();
    setIsRefreshing(false);
  }, [refetchMessages]);

  const sortedMessages = React.useMemo(() => {
    if (!messages) return [];
    return [...messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [messages]);

  const shouldShowDateSeparator = (index: number): string | null => {
    if (index === sortedMessages.length - 1) {
      return sortedMessages[index].created_at;
    }

    const currentDate = new Date(sortedMessages[index].created_at).toDateString();
    const nextDate = new Date(sortedMessages[index + 1].created_at).toDateString();

    if (currentDate !== nextDate) {
      return sortedMessages[index].created_at;
    }
    return null;
  };

  const isTicketClosed = ticket?.status === "CLOSED" || ticket?.status === "RESOLVED";

  const isLoading = ticketLoading || messagesLoading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          testID="ticket-messages-list"
          data={sortedMessages}
          keyExtractor={(item) => item.id}
          inverted={sortedMessages.length > 0}
          renderItem={({ item, index }) => {
            const isSent = item.sender_type === "USER";
            const showSenderName = item.sender_type === "STAFF";
            const dateSeparator = shouldShowDateSeparator(index);

            return (
              <Animated.View entering={FadeInDown.delay(index * 30).duration(200)}>
                <SupportMessageBubble
                  message={item}
                  isSent={isSent}
                  showSenderName={showSenderName}
                />
                {dateSeparator ? <DateSeparator date={dateSeparator} /> : null}
              </Animated.View>
            );
          }}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingTop: headerHeight,
              paddingBottom: Spacing.md,
            },
          ]}
          ListEmptyComponent={<EmptyTicketState ticketSubject={ticket?.subject} />}
          ListHeaderComponent={
            supportTyping ? (
              <TypingIndicator
                isVisible={supportTyping}
                userName="Support"
              />
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {isTicketClosed ? (
        <View
          style={[
            styles.closedBanner,
            {
              paddingBottom: insets.bottom + Spacing.sm,
              backgroundColor: theme.backgroundSecondary,
              borderTopColor: theme.border,
            },
          ]}
        >
          <Feather name="check-circle" size={18} color={theme.success} />
          <ThemedText style={[styles.closedText, { color: theme.textSecondary }]}>
            This ticket is {ticket?.status === "RESOLVED" ? "resolved" : "closed"}
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.inputWrapper, { backgroundColor: theme.backgroundRoot }]}>
          {isUploading ? (
            <View
              style={[
                styles.uploadingContainer,
                {
                  paddingBottom: insets.bottom + Spacing.sm,
                  backgroundColor: theme.backgroundRoot,
                  borderTopColor: theme.border,
                },
              ]}
            >
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText style={[styles.uploadingText, { color: theme.textSecondary }]}>
                Uploading... {Math.round(uploadProgress * 100)}%
              </ThemedText>
              <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: theme.primary, width: `${uploadProgress * 100}%` },
                  ]}
                />
              </View>
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
                style={styles.attachButton}
                testID="button-attach"
              >
                <Feather name="paperclip" size={22} color={theme.primary} />
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
                onChangeText={setMessage}
                multiline
                maxLength={2000}
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
                  testID="button-send"
                >
                  {sendMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Feather name="send" size={20} color="#FFFFFF" />
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.sendButton, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1 }]}
                  onPress={() => setAttachmentPickerVisible(true)}
                  testID="button-attach-alt"
                >
                  <Feather name="image" size={20} color={theme.primary} />
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: "column",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerSubject: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    maxWidth: 200,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  bubbleContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  bubbleContainerSent: {
    flexDirection: "row-reverse",
  },
  bubbleContainerReceived: {
    flexDirection: "row",
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Platform.select({
      ios: {
        ...Shadows.md,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  bubbleSent: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  bubbleReceived: {
    borderWidth: 1,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts?.regular,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: Fonts?.regular,
  },
  readReceipt: {
    flexDirection: "row",
    alignItems: "center",
  },
  doubleCheckContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkOverlap: {
    marginRight: -6,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfoContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.lg,
    gap: Spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    minHeight: 400,
  },
  emptyContent: {
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptySubject: {
    fontSize: 15,
    fontStyle: "italic",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  attachButton: {
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
  closedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  closedText: {
    fontSize: Typography.body.fontSize,
  },
  uploadingContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  uploadingText: {
    fontSize: 14,
  },
  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});
