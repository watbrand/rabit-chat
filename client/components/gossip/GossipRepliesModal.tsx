import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { TeaMeter } from "./TeaMeter";
import { ReactionButtons } from "./ReactionButtons";
import { type AnonGossipPost, type ReactionType } from "./AnonGossipTypes";
import { LoadingIndicator, InlineLoader } from "@/components/animations";

interface Reply {
  id: string;
  postId: string;
  parentReplyId: string | null;
  content: string;
  depth: number;
  fireCount: number;
  mindblownCount: number;
  laughCount: number;
  skullCount: number;
  eyesCount: number;
  isHidden: boolean;
  createdAt: string;
}

interface GossipRepliesModalProps {
  visible: boolean;
  onClose: () => void;
  post: AnonGossipPost | null;
}

function ReplyCard({
  reply,
  myReactions,
  onReact,
  onReport,
}: {
  reply: Reply;
  myReactions: string[];
  onReact: (replyId: string, type: ReactionType) => void;
  onReport: (replyId: string) => void;
}) {
  const { theme } = useTheme();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <View
      style={[
        styles.replyCard,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
    >
      <View style={styles.replyHeader}>
        <View style={styles.replyMeta}>
          <Feather name="corner-down-right" size={12} color={theme.textTertiary} />
          <ThemedText style={[styles.replyAnonLabel, { color: theme.textSecondary }]}>
            Anonymous
          </ThemedText>
          <ThemedText style={[styles.replyTime, { color: theme.textTertiary }]}>
            {formatTimeAgo(reply.createdAt)}
          </ThemedText>
        </View>
      </View>

      {reply.content ? (
        <ThemedText style={styles.replyContent}>{reply.content}</ThemedText>
      ) : null}

      <View style={styles.replyReactions}>
        <ReactionButtons
          reactions={{
            fireCount: reply.fireCount,
            mindblownCount: reply.mindblownCount,
            laughCount: reply.laughCount,
            skullCount: reply.skullCount,
            eyesCount: reply.eyesCount,
          }}
          myReactions={myReactions}
          onReact={(type) => onReact(reply.id, type)}
          compact
        />
      </View>

      <Pressable style={styles.replyReportBtn} onPress={() => onReport(reply.id)}>
        <Feather name="flag" size={12} color={theme.textTertiary} />
      </Pressable>
    </View>
  );
}

export function GossipRepliesModal({ visible, onClose, post }: GossipRepliesModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [replyText, setReplyText] = useState("");
  const [myReactions, setMyReactions] = useState<Record<string, string[]>>({});
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReplyId, setReportReplyId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      let id = await AsyncStorage.getItem("@gossip_device_id");
      if (!id) {
        // Create device ID if not exists (fallback for edge cases)
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        await AsyncStorage.setItem("@gossip_device_id", id);
      }
      setDeviceId(id);
    };
    loadOrCreateDeviceId();
  }, [visible]);

  const {
    data: replies = [],
    isLoading,
    refetch,
  } = useQuery<Reply[]>({
    queryKey: ["/api/gossip/v2/posts", post?.id, "comments", deviceId],
    queryFn: async () => {
      if (!deviceId || !post?.id) return [];
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/posts/${post.id}/comments`,
        { headers: { "x-device-id": deviceId } }
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.comments || [];
    },
    enabled: !!post?.id && visible && !!deviceId,
  });

  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!deviceId || !post?.id) throw new Error("Missing required data");
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ content, deviceHash: deviceId }),
        }
      );
      if (!response.ok) throw new Error("Failed to post reply");
      return response.json();
    },
    onSuccess: () => {
      setReplyText("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/gossip/v2/posts"], exact: false });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to post reply");
    },
  });

  const reactionMutation = useMutation({
    mutationFn: async ({ replyId, type }: { replyId: string; type: ReactionType }) => {
      if (!deviceId) throw new Error("No device ID");
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/comments/${replyId}/react`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ type, deviceHash: deviceId }),
        }
      );
      if (!response.ok) throw new Error("Failed to react");
      return response.json();
    },
    onMutate: async ({ replyId, type }) => {
      const currentReactions = myReactions[replyId] || [];
      const hasReaction = currentReactions.includes(type);
      setMyReactions({
        ...myReactions,
        [replyId]: hasReaction
          ? currentReactions.filter((r) => r !== type)
          : [...currentReactions, type],
      });
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleReact = (replyId: string, type: ReactionType) => {
    reactionMutation.mutate({ replyId, type });
  };

  const handleReport = (replyId: string) => {
    setReportReplyId(replyId);
    setReportReason("");
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason || reportReason.length < 5) {
      Alert.alert("Error", "Please provide a reason (min 5 characters)");
      return;
    }
    if (!deviceId || !reportReplyId) {
      Alert.alert("Error", "Device not ready");
      return;
    }
    try {
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/comments/${reportReplyId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceId,
          },
          body: JSON.stringify({ reason: reportReason, deviceHash: deviceId }),
        }
      );
      if (response.ok) {
        setShowReportModal(false);
        setReportReplyId(null);
        setReportReason("");
        Alert.alert("Reported", "Thank you for helping keep the community safe.");
      } else {
        Alert.alert("Error", "Failed to report reply");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to report reply");
    }
  };

  const handleSubmitReply = () => {
    if (replyText.trim().length < 2) {
      Alert.alert("Error", "Reply must be at least 2 characters");
      return;
    }
    createReplyMutation.mutate(replyText.trim());
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  if (!post) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View
          style={[
            styles.content,
            {
              backgroundColor: theme.backgroundRoot,
              paddingBottom: insets.bottom + Spacing.sm,
            },
          ]}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="headline">Replies</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <View
            style={[
              styles.originalPost,
              { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
            ]}
          >
            <View style={styles.originalHeader}>
              <ThemedText style={[styles.originalLabel, { color: theme.textSecondary }]}>
                Original Post
              </ThemedText>
              <TeaMeter score={post.teaMeter} size="small" />
            </View>
            {post.content ? (
              <ThemedText style={styles.originalContent} numberOfLines={3}>
                {post.content}
              </ThemedText>
            ) : null}
            <ThemedText style={[styles.originalTime, { color: theme.textTertiary }]}>
              {formatTimeAgo(post.createdAt)} from {post.locationDisplay || post.countryCode}
            </ThemedText>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" />
            </View>
          ) : (
            <FlatList
              data={replies}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ReplyCard
                  reply={item}
                  myReactions={myReactions[item.id] || []}
                  onReact={handleReact}
                  onReport={handleReport}
                />
              )}
              contentContainerStyle={styles.repliesList}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ bottom: insets.bottom }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="message-circle" size={32} color={theme.textTertiary} />
                  <ThemedText
                    style={[styles.emptyText, { color: theme.textSecondary }]}
                  >
                    No replies yet. Be the first!
                  </ThemedText>
                </View>
              }
            />
          )}

          <View
            style={[styles.inputContainer, { borderColor: theme.glassBorder }]}
          >
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                { color: theme.text, backgroundColor: theme.glassBackground },
              ]}
              placeholder="Add a reply..."
              placeholderTextColor={theme.textTertiary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              maxLength={500}
            />
            <Pressable
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    replyText.trim().length >= 2 ? theme.primary : theme.glassBorder,
                },
              ]}
              onPress={handleSubmitReply}
              disabled={replyText.trim().length < 2 || createReplyMutation.isPending}
            >
              {createReplyMutation.isPending ? (
                <InlineLoader size={18} />
              ) : (
                <Feather name="send" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <Pressable style={styles.reportModalOverlay} onPress={() => setShowReportModal(false)}>
          <Pressable style={[styles.reportModalContent, { backgroundColor: theme.backgroundRoot }]} onPress={(e) => e.stopPropagation()}>
            <ThemedText style={styles.reportModalTitle}>Report Reply</ThemedText>
            <ThemedText style={[styles.reportModalSubtitle, { color: theme.textSecondary }]}>
              Why are you reporting this reply?
            </ThemedText>
            <TextInput
              style={[styles.reportModalInput, { borderColor: theme.glassBorder, color: theme.text, backgroundColor: theme.backgroundSecondary }]}
              placeholder="Enter reason (min 5 characters)..."
              placeholderTextColor={theme.textTertiary}
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              maxLength={200}
            />
            <View style={styles.reportModalButtons}>
              <Pressable 
                style={[styles.reportModalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowReportModal(false)}
              >
                <ThemedText style={{ color: theme.text }}>Cancel</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.reportModalButton, { backgroundColor: theme.error }, reportReason.length < 5 && styles.reportButtonDisabled]}
                onPress={handleSubmitReport}
                disabled={reportReason.length < 5}
              >
                <ThemedText style={{ color: "#FFF", fontWeight: "600" }}>Report</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dismiss: {
    flex: 1,
  },
  content: {
    maxHeight: "85%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  closeBtn: {
    padding: 4,
  },
  originalPost: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  originalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  originalLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  originalContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  originalTime: {
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  repliesList: {
    paddingVertical: Spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  replyCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  replyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  replyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replyAnonLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  replyTime: {
    fontSize: 11,
  },
  replyContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  replyReactions: {
    marginBottom: Spacing.xs,
  },
  replyReportBtn: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    padding: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  reportModalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  reportModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  reportModalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  reportModalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  reportModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  reportModalButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  reportButtonDisabled: {
    opacity: 0.5,
  },
});
