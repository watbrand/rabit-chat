import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { TeaMeter } from "./TeaMeter";
import { ReactionButtons } from "./ReactionButtons";
import { type AnonGossipPost, type ReactionType } from "./AnonGossipTypes";

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

  const {
    data: replies = [],
    isLoading,
    refetch,
  } = useQuery<Reply[]>({
    queryKey: ["/api/gossip/posts", post?.id, "replies"],
    enabled: !!post?.id && visible,
  });

  const createReplyMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/gossip/posts/${post?.id}/replies`, {
        content,
        type: "TEXT",
      });
    },
    onSuccess: () => {
      setReplyText("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/gossip/posts"] });
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
      return apiRequest("POST", `/api/gossip/replies/${replyId}/reactions`, {
        reactionType: type,
      });
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
    Alert.prompt(
      "Report Reply",
      "Why are you reporting this reply?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async (reason: string | undefined) => {
            if (!reason || reason.length < 5) {
              Alert.alert("Error", "Please provide a reason (min 5 characters)");
              return;
            }
            try {
              await apiRequest("POST", `/api/gossip/replies/${replyId}/report`, { reason });
              Alert.alert("Reported", "Thank you for helping keep the community safe.");
            } catch (error) {
              Alert.alert("Error", "Failed to report reply");
            }
          },
        },
      ],
      "plain-text"
    );
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              <ActivityIndicator size="large" color={theme.primary} />
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="send" size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
});
