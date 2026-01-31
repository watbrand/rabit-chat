import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Avatar } from "@/components/Avatar";
import { LoadingIndicator } from "@/components/animations";
import { EmptyState } from "@/components/EmptyState";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface LiveStream {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  status: string;
  viewerCount: number;
  peakViewerCount: number;
  startedAt?: string;
  host?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
}

interface StreamComment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface FloatingReaction {
  id: string;
  type: string;
  x: number;
}

const REACTION_EMOJIS = ["❤️", "🔥", "💎", "👑", "🎉", "😍", "👏", "💜"];

export default function LiveStreamScreen({ route, navigation }: any) {
  const { streamId, isHost } = route.params || {};
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const commentInputRef = useRef<TextInput>(null);

  const { data: stream, isLoading, error, refetch } = useQuery<LiveStream>({
    queryKey: ["/api/live-streams", streamId],
    enabled: !!streamId,
    refetchInterval: 5000,
  });

  const { data: comments = [], refetch: refetchComments } = useQuery<StreamComment[]>({
    queryKey: ["/api/live-streams", streamId, "comments"],
    queryFn: async () => {
      const res = await fetch(new URL(`/api/live-streams/${streamId}/comments`, getApiUrl()).toString(), {
        credentials: "include",
      });
      return res.json();
    },
    enabled: !!streamId,
    refetchInterval: 3000,
  });

  const sendCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/live-streams/${streamId}/comments`, { content });
    },
    onSuccess: () => {
      setComment("");
      refetchComments();
    },
  });

  const sendReactionMutation = useMutation({
    mutationFn: async (reactionType: string) => {
      return apiRequest("POST", `/api/live-streams/${streamId}/reactions`, { reactionType });
    },
  });

  const handleSendComment = () => {
    if (comment.trim()) {
      sendCommentMutation.mutate(comment.trim());
    }
  };

  const handleReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      type: emoji,
      x: Math.random() * 100,
    };
    setFloatingReactions((prev) => [...prev, newReaction]);
    sendReactionMutation.mutate(emoji);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
  };

  const renderComment = ({ item }: { item: StreamComment }) => (
    <View style={styles.commentItem}>
      <Avatar
        uri={item.user?.avatarUrl}
        size={28}
      />
      <View style={styles.commentContent}>
        <Text style={[styles.commentUsername, { color: theme.primary }]}>
          {item.user?.displayName || item.user?.username}
        </Text>
        <Text style={[styles.commentText, { color: theme.text }]}>
          {item.content}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: "#000" }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: "#000" }]}>
        <Feather name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load stream</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <View style={styles.videoPlaceholder}>
        <View style={[styles.liveIndicator, { top: insets.top + Spacing.xl }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.placeholderText}>
          {isHost ? "You are live!" : "Stream Video"}
        </Text>
      </View>

      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
          
          <View style={styles.hostInfo}>
            <Avatar
              uri={stream?.host?.avatarUrl}
              size={36}
            />
            <View style={styles.hostDetails}>
              <Text style={styles.hostName} numberOfLines={1}>
                {stream?.host?.displayName || stream?.host?.username}
              </Text>
              <Text style={styles.streamTitle} numberOfLines={1}>
                {stream?.title || "Live Stream"}
              </Text>
            </View>
          </View>

          <View style={styles.viewerCount}>
            <Feather name="eye" size={16} color="#fff" />
            <Text style={styles.viewerText}>{stream?.viewerCount || 0}</Text>
          </View>
        </View>

        <View style={[styles.floatingReactionsContainer, { bottom: insets.bottom + Spacing.xl * 4 }]}>
          {floatingReactions.map((reaction) => (
            <FloatingReactionBubble key={reaction.id} emoji={reaction.type} startX={reaction.x} />
          ))}
        </View>

        <View style={styles.bottomSection}>
          <FlatList
            data={comments.slice(-20)}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            inverted={false}
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: insets.bottom }}
            ListEmptyComponent={
              <View style={styles.emptyCommentsContainer}>
                <EmptyState
                  type="comments"
                  size="small"
                  showAnimation={false}
                />
              </View>
            }
          />

          <View style={styles.reactionsBar}>
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleReaction(emoji)}
                style={styles.reactionButton}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}
          >
            <TextInput
              ref={commentInputRef}
              style={[styles.commentInput, { color: "#fff" }]}
              placeholder="Say something..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={comment}
              onChangeText={setComment}
              onSubmitEditing={handleSendComment}
              returnKeyType="send"
            />
            <Pressable onPress={handleSendComment} style={styles.sendButton}>
              <Feather name="send" size={20} color={theme.primary} />
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </View>
    </View>
  );
}

function FloatingReactionBubble({ emoji, startX }: { emoji: string; startX: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    translateY.value = withTiming(-300, { duration: 3000 });
    opacity.value = withTiming(0, { duration: 3000 });
    scale.value = withSequence(
      withSpring(1.2),
      withTiming(1, { duration: 200 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingReaction,
        { left: `${startX}%` },
        animatedStyle,
      ]}
    >
      <Text style={styles.floatingEmoji}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a2e",
  },
  placeholderText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 18,
  },
  liveIndicator: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 6,
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  hostInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  hostDetails: {
    marginLeft: 8,
    flex: 1,
  },
  hostName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  streamTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  viewerCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewerText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
  },
  floatingReactionsContainer: {
    position: "absolute",
    right: 16,
    width: 100,
    height: 300,
  },
  floatingReaction: {
    position: "absolute",
    bottom: 0,
  },
  floatingEmoji: {
    fontSize: 32,
  },
  bottomSection: {
    paddingHorizontal: 16,
  },
  commentsList: {
    maxHeight: 200,
    marginBottom: 8,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    padding: 8,
  },
  commentContent: {
    marginLeft: 8,
    flex: 1,
  },
  commentUsername: {
    fontSize: 12,
    fontWeight: "600",
  },
  commentText: {
    fontSize: 14,
  },
  reactionsBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionEmoji: {
    fontSize: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCommentsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
});
