import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeBottomTabBarHeight } from "@/hooks/useSafeBottomTabBarHeight";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { PostCard } from "@/components/PostCard";
import { ReportModal } from "@/components/ReportModal";
import { LoadingIndicator } from "@/components/animations";
import { CommentCard } from "@/components/CommentCard";
import { ThemedText } from "@/components/ThemedText";
import { MentionInput } from "@/components/MentionInput";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { FeedStackParamList } from "@/navigation/FeedStackNavigator";

type PostDetailRouteProp = RouteProp<FeedStackParamList, "PostDetail">;

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useSafeBottomTabBarHeight();
  const { theme } = useTheme();
  const route = useRoute<PostDetailRouteProp>();
  const queryClient = useQueryClient();

  const { postId } = route.params;
  const [comment, setComment] = useState("");
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const { data: post, isLoading: postLoading } = useQuery<any>({
    queryKey: [`/api/posts/${postId}`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/posts/${postId}`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<any[]>({
    queryKey: [`/api/posts/${postId}/comments`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/posts/${postId}/comments`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
      const data = await res.json();
      return data;
    },
    onMutate: async (content: string) => {
      await queryClient.cancelQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      const previousComments = queryClient.getQueryData<any[]>([`/api/posts/${postId}/comments`]);
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
      queryClient.setQueryData<any[]>([`/api/posts/${postId}/comments`], (old) => 
        old ? [optimisticComment, ...old] : [optimisticComment]
      );
      setComment("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { previousComments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}`] });
    },
    onError: (error: any, _, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData([`/api/posts/${postId}/comments`], context.previousComments);
      }
      Alert.alert("Error", error.message || "Failed to post comment");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
      return { postId };
    },
    onMutate: async ({ postId, hasLiked }) => {
      await queryClient.cancelQueries({ queryKey: [`/api/posts/${postId}`] });
      const previousPost = queryClient.getQueryData([`/api/posts/${postId}`]);
      
      queryClient.setQueryData([`/api/posts/${postId}`], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          hasLiked: !hasLiked,
          likesCount: hasLiked ? Math.max(0, (old.likesCount || 0) - 1) : (old.likesCount || 0) + 1,
        };
      });
      
      return { previousPost };
    },
    onError: (_err, variables, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData([`/api/posts/${variables.postId}`], context.previousPost);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${variables.postId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const handleSubmitComment = () => {
    if (!comment.trim() || commentMutation.isPending) {
      return;
    }
    commentMutation.mutate(comment.trim());
  };

  const viewRecordedRef = useRef(false);
  useEffect(() => {
    if (postId && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      // Fire-and-forget view tracking - failure doesn't affect user experience
      apiRequest("POST", `/api/posts/${postId}/view`).catch(() => {});
    }
  }, [postId]);

  const renderHeader = () => (
    <View style={styles.postContainer}>
      {post ? (
        <PostCard 
          post={post} 
          onLike={() => likeMutation.mutate({ postId: post.id, hasLiked: post.hasLiked })}
          onReport={() => { setReportPostId(post.id); setReportModalVisible(true); }}
          showFullContent 
        />
      ) : null}
      <ThemedText type="h4" style={styles.commentsTitle}>
        Comments ({comments?.length || 0})
      </ThemedText>
    </View>
  );

  if (postLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight : 0}
    >
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + 60 + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: tabBarHeight + 60 }}
        data={comments || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentCard comment={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          commentsLoading ? (
            <LoadingIndicator size="medium" style={{ marginTop: Spacing.xl }} />
          ) : (
            <ThemedText style={[styles.noComments, { color: theme.textSecondary }]}>
              No comments yet. Be the first!
            </ThemedText>
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: tabBarHeight + Spacing.sm,
            backgroundColor: theme.backgroundRoot,
            borderTopColor: theme.border,
          },
        ]}
      >
        <MentionInput
          style={[
            styles.input,
            {
              backgroundColor: theme.glassBackground,
              borderColor: theme.glassBorder,
              color: theme.text,
            },
          ]}
          placeholder="Write a comment... Use @ to mention"
          placeholderTextColor={theme.textSecondary}
          value={comment}
          onChangeText={setComment}
          maxLength={500}
          testID="input-comment"
          returnKeyType="send"
          onSubmitEditing={handleSubmitComment}
        />
        <Pressable
          style={[
            styles.sendButton,
            { backgroundColor: theme.primary },
            (!comment.trim() || commentMutation.isPending) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmitComment}
          disabled={!comment.trim() || commentMutation.isPending}
          testID="button-send-comment"
        >
          {commentMutation.isPending ? (
            <LoadingIndicator size="small" />
          ) : (
            <Feather name="send" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <ReportModal
        isVisible={reportModalVisible}
        onClose={() => { setReportModalVisible(false); setReportPostId(null); }}
        onSubmit={async () => { setReportModalVisible(false); setReportPostId(null); }}
        reportType="post"
        targetId={reportPostId || ''}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  postContainer: {
    marginBottom: Spacing.lg,
  },
  commentsTitle: {
    marginTop: Spacing.xl,
  },
  noComments: {
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
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
});
