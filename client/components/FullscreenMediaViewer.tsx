import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  StatusBar,
  TextInput,
  FlatList,
  Alert,
  Platform,
  Keyboard,
  Share,
} from "react-native";
import { LoadingIndicator, InlineLoader } from "@/components/animations";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FullscreenMediaViewerProps {
  visible: boolean;
  onClose: () => void;
  mediaType: "VIDEO" | "PHOTO";
  mediaUrl: string;
  thumbnailUrl?: string | null;
  post: {
    id: string;
    content: string;
    likesCount: number;
    commentsCount: number;
    sharesCount?: number;
    hasLiked?: boolean;
    hasSaved?: boolean;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
    };
  };
}

export function FullscreenMediaViewer({
  visible,
  onClose,
  mediaType,
  mediaUrl,
  thumbnailUrl,
  post,
}: FullscreenMediaViewerProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [localLiked, setLocalLiked] = useState(post.hasLiked || false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount);
  const justOpenedRef = useRef(false);
  const playerRef = useRef<any>(null);

  const openComments = useCallback(() => {
    justOpenedRef.current = true;
    setShowComments(true);
    // Reset the flag after a short delay
    setTimeout(() => {
      justOpenedRef.current = false;
    }, 300);
  }, []);

  const closeComments = useCallback(() => {
    // Don't close if we just opened
    if (justOpenedRef.current) return;
    Keyboard.dismiss();
    setShowComments(false);
  }, []);

  useEffect(() => {
    setLocalLiked(post.hasLiked || false);
    setLocalLikesCount(post.likesCount);
  }, [post.hasLiked, post.likesCount]);

  const player = useVideoPlayer(mediaType === "VIDEO" ? mediaUrl : "", (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Store player reference
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    try {
      if (visible && mediaType === "VIDEO") {
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      // Player native module may not be ready yet, ignore
    }
  }, [visible, mediaType, player]);

  // Cleanup and ensure audio stops when modal closes or component unmounts
  useEffect(() => {
    return () => {
      try {
        if (playerRef.current) {
          playerRef.current.pause();
          playerRef.current.seekTo(0);
        }
      } catch (error) {
        // Player native module may not be ready, ignore
      }
    };
  }, []);

  const { data: comments, isLoading: commentsLoading } = useQuery<any[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/posts/${post.id}/comments`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: visible,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
      return res.json();
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      const previousComments = queryClient.getQueryData<any[]>([`/api/posts/${post.id}/comments`]);
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        author: {
          id: 'current-user',
          username: 'You',
          displayName: 'You',
          avatarUrl: null,
        },
      };
      queryClient.setQueryData<any[]>([`/api/posts/${post.id}/comments`], (old) => 
        old ? [optimisticComment, ...old] : [optimisticComment]
      );
      setComment("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { previousComments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error: any, _, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData([`/api/posts/${post.id}/comments`], context.previousComments);
      }
      Alert.alert("Error", error.message || "Failed to post comment");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (localLiked) {
        await apiRequest("DELETE", `/api/posts/${post.id}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/like`);
      }
    },
    onMutate: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalLiked(!localLiked);
      setLocalLikesCount(localLiked ? localLikesCount - 1 : localLikesCount + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: () => {
      setLocalLiked(post.hasLiked || false);
      setLocalLikesCount(post.likesCount);
    },
  });

  const handleSubmitComment = () => {
    console.log("[FSViewer Comment] handleSubmitComment called, comment:", comment);
    if (!comment.trim() || commentMutation.isPending) {
      console.log("[FSViewer Comment] Blocked - empty or pending");
      return;
    }
    console.log("[FSViewer Comment] Calling mutate with:", comment.trim());
    commentMutation.mutate(comment.trim());
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: post.content || `Check out this post by @${post.author?.username || 'unknown'}`,
        url: mediaUrl,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentItem}>
      <Avatar uri={item.author?.avatarUrl} size={40} />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <ThemedText style={styles.commentAuthor}>
            {item.author?.displayName || item.author?.username || "User"}
          </ThemedText>
          <ThemedText style={styles.commentTime}>
            {formatTimeAgo(item.createdAt)}
          </ThemedText>
        </View>
        <ThemedText style={styles.commentText}>{item.content}</ThemedText>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="#000000" barStyle="light-content" />
      <View style={styles.container}>
        {mediaType === "VIDEO" ? (
          <Pressable 
            style={styles.mediaContainer}
            onPress={() => {
              try {
                player.playing ? player.pause() : player.play();
              } catch (error) {
                // Player native module may not be ready, ignore
              }
            }}
          >
            <VideoView
              style={styles.fullscreenMedia}
              player={player}
              contentFit="contain"
              nativeControls={false}
            />
          </Pressable>
        ) : (
          <Image
            source={{ uri: mediaUrl }}
            style={styles.fullscreenMedia}
            contentFit="contain"
          />
        )}

        <Pressable
          style={[styles.backButton, { top: insets.top + Spacing.md }]}
          onPress={onClose}
        >
          <View style={styles.iconButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </View>
        </Pressable>

        <View style={[styles.rightOverlay, { bottom: insets.bottom + 120 }]}>
          <Pressable style={styles.actionButton} onPress={() => likeMutation.mutate()}>
            <View style={styles.iconButton}>
              <Feather
                name={localLiked ? "heart" : "heart"}
                size={28}
                color={localLiked ? "#FF6B6B" : "#FFFFFF"}
              />
            </View>
            <ThemedText style={styles.actionCount}>{formatCount(localLikesCount)}</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={openComments}>
            <View style={styles.iconButton}>
              <Feather name="message-circle" size={28} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.actionCount}>
              {formatCount(comments?.length || post.commentsCount)}
            </ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleShare}>
            <View style={styles.iconButton}>
              <Feather name="share" size={28} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.actionCount}>
              {formatCount(post.sharesCount || 0)}
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.bottomOverlay, { bottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.authorRow}>
            <Avatar uri={post.author?.avatarUrl} size={40} />
            <ThemedText style={styles.authorName}>@{post.author?.username || 'unknown'}</ThemedText>
          </View>
          {post.content ? (
            <ThemedText style={styles.caption} numberOfLines={2}>
              {post.content}
            </ThemedText>
          ) : null}
        </View>

        {showComments ? (
          <KeyboardAvoidingView
            style={styles.commentsPanel}
            behavior="padding"
            keyboardVerticalOffset={0}
          >
            <Pressable style={styles.commentsOverlay} onPress={closeComments} />
            <View style={styles.commentsContainer}>
              <View style={styles.grabberContainer}>
                <View style={styles.grabber} />
              </View>
              <View style={styles.commentsHeader}>
                <ThemedText style={styles.commentsTitle}>
                  {comments?.length || 0} comments
                </ThemedText>
                <Pressable style={styles.closeButton} onPress={() => { Keyboard.dismiss(); setShowComments(false); }}>
                  <Feather name="x" size={22} color="#FFFFFF" />
                </Pressable>
              </View>

              <FlatList
                data={comments || []}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                style={styles.commentsList}
                contentContainerStyle={styles.commentsListContent}
                ListEmptyComponent={
                  commentsLoading ? (
                    <LoadingIndicator size="small" style={{ marginTop: Spacing.xl }} />
                  ) : (
                    <ThemedText style={styles.noComments}>No comments yet</ThemedText>
                  )
                }
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              />

              <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmitComment}
                  testID="input-fullscreen-comment"
                />
                <Pressable
                  style={[
                    styles.sendButton,
                    (!comment.trim() || commentMutation.isPending) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSubmitComment}
                  disabled={!comment.trim() || commentMutation.isPending}
                  testID="button-fullscreen-send-comment"
                >
                  {commentMutation.isPending ? (
                    <InlineLoader size={18} />
                  ) : (
                    <Feather name="send" size={18} color="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mediaContainer: {
    flex: 1,
  },
  fullscreenMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  backButton: {
    position: "absolute",
    left: Spacing.md,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightOverlay: {
    position: "absolute",
    right: Spacing.md,
    alignItems: "center",
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
  },
  actionCount: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomOverlay: {
    position: "absolute",
    left: Spacing.md,
    right: 80,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  authorName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: Spacing.sm,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  commentsPanel: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  commentsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  commentsContainer: {
    backgroundColor: "rgba(22,22,22,0.98)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT * 0.75,
  },
  grabberContainer: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  grabber: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  commentsTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    right: Spacing.lg,
    padding: Spacing.xs,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  commentItem: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  commentAuthor: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
  },
  commentTime: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  commentText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 20,
  },
  noComments: {
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: Spacing["3xl"],
    fontSize: 15,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(22,22,22,0.98)",
  },
  commentInput: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    paddingHorizontal: Spacing.xl,
    color: "#FFFFFF",
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
