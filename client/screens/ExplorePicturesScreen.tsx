import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  Platform,
  ViewToken,
  Image,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Share,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type PhotoPost = {
  id: string;
  authorId: string;
  type: "PHOTO";
  content: string | null;
  mediaUrl: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
};

interface PictureItemProps {
  post: PhotoPost;
  onLike: () => void;
  onUserPress: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  isLiked?: boolean;
  localLikesCount: number;
}

function PictureItem({ post, onLike, onUserPress, onComment, onShare, onBookmark, isLiked, localLikesCount }: PictureItemProps) {
  const { theme } = useTheme();
  const heartScale = useSharedValue(0);
  const lastTapTime = useRef(0);

  const triggerHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      heartScale.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 15, stiffness: 150 })
      );
      runOnJS(triggerHaptic)();
      onLike();
    }
    lastTapTime.current = now;
  };

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartScale.value,
  }));

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <View style={styles.pictureContainer}>
      <GestureDetector gesture={doubleTapGesture}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.image}
            resizeMode="contain"
          />

          <Animated.View style={[styles.heartAnimation, heartAnimatedStyle]}>
            <Feather name="heart" size={80} color="#EF4444" />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.pictureInfo}>
        <Pressable onPress={onUserPress} style={styles.pictureUserRow}>
          <Avatar uri={post.user?.avatarUrl} size={40} />
          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <ThemedText style={styles.pictureUsername}>@{post.user?.username}</ThemedText>
              {post.user?.isVerified ? (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                  <Feather name="check" size={10} color="#FFF" />
                </View>
              ) : null}
            </View>
            <ThemedText style={styles.displayName}>{post.user?.displayName}</ThemedText>
          </View>
        </Pressable>
        {post.content ? (
          <ThemedText style={styles.pictureCaption} numberOfLines={2}>
            {post.content}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.pictureActions}>
        <Pressable style={styles.pictureActionButton} onPress={onLike} testID="like-button">
          <Feather 
            name="heart" 
            size={28} 
            color={isLiked ? "#EF4444" : "#FFFFFF"} 
            fill={isLiked ? "#EF4444" : "transparent"}
          />
          <ThemedText style={styles.pictureActionCount}>
            {formatCount(localLikesCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.pictureActionButton} onPress={onComment} testID="comment-button">
          <Feather name="message-circle" size={28} color="#FFFFFF" />
          <ThemedText style={styles.pictureActionCount}>
            {formatCount(post.commentsCount)}
          </ThemedText>
        </Pressable>
        <Pressable style={styles.pictureActionButton} onPress={onShare} testID="share-button">
          <Feather name="share" size={28} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.pictureActionButton} onPress={onBookmark} testID="bookmark-button">
          <Feather name="bookmark" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

type ExplorePicturesRouteProp = RouteProp<RootStackParamList, "ExplorePictures">;

export default function ExplorePicturesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ExplorePicturesRouteProp>();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(route.params?.initialIndex || 0);
  const flatListRef = useRef<FlatList>(null);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [localComments, setLocalComments] = useState<Record<string, any[]>>({});

  const posts = route.params?.posts || [];
  const activePost = posts[activeIndex];

  const { data: comments, isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: [`/api/posts/${activePost?.id}/comments`],
    enabled: !!activePost?.id && showComments,
  });

  const mergedComments = [
    ...(localComments[activePost?.id] || []),
    ...((comments as any[] | undefined) || []).filter(
      (c: any) => !(localComments[activePost?.id] || []).some((lc: any) => lc.id === c.id)
    ),
  ];

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/explore"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to like post. Please try again.');
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/posts/${postId}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discover/explore"] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save post. Please try again.');
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
      return response.json();
    },
    onMutate: async ({ postId, content }) => {
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        author: {
          id: "current-user",
          username: "You",
          displayName: "You",
          avatarUrl: null,
        },
      };
      setLocalComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), optimisticComment],
      }));
      setComment("");
      Keyboard.dismiss();
    },
    onSuccess: () => {
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to post comment. Please try again.');
    },
  });

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
        setShowComments(false);
        setComment("");
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  });

  const handleUserPress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleLike = (postId: string, currentLiked: boolean, currentCount: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLikedPosts((prev) => ({ ...prev, [postId]: !currentLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: currentLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
    }));
    likeMutation.mutate(postId);
  };

  const handleComment = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowComments(!showComments);
  };

  const handleShare = async (post: PhotoPost) => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await Share.share({
        message: post.content || `Check out this post by @${post.user?.username || "unknown"}`,
        url: post.mediaUrl,
      });
    } catch (error) {
    }
  };

  const handleSubmitComment = () => {
    if (!comment.trim() || !activePost?.id || commentMutation.isPending) return;
    commentMutation.mutate({ postId: activePost.id, content: comment.trim() });
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

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentItem}>
      <Avatar uri={item.author?.avatarUrl} size={32} />
      <View style={styles.commentContent}>
        <ThemedText style={styles.commentUsername}>@{item.author?.username}</ThemedText>
        <ThemedText style={styles.commentText}>{item.content}</ThemedText>
        <ThemedText style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</ThemedText>
      </View>
    </View>
  );

  const renderPicture = ({ item, index }: { item: PhotoPost; index: number }) => {
    const isLiked = likedPosts[item.id] ?? false;
    const localCount = likeCounts[item.id] ?? item.likesCount;
    
    return (
      <PictureItem
        post={item}
        onLike={() => handleLike(item.id, isLiked, localCount)}
        onUserPress={() => handleUserPress(item.user?.id)}
        onComment={handleComment}
        onShare={() => handleShare(item)}
        onBookmark={() => bookmarkMutation.mutate(item.id)}
        isLiked={isLiked}
        localLikesCount={localCount}
      />
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: "#000" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="light" />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={handleGoBack} style={styles.backButton} testID="back-button">
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Photos</ThemedText>
        <View style={styles.headerPlaceholder} />
      </View>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPicture}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        initialScrollIndex={route.params?.initialIndex || 0}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

      {showComments ? (
        <View style={[styles.commentsPanel, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.commentsPanelHeader}>
            <ThemedText style={styles.commentsPanelTitle}>
              Comments ({mergedComments.length})
            </ThemedText>
            <Pressable onPress={() => setShowComments(false)} style={styles.closeCommentsButton}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          {commentsLoading ? (
            <View style={styles.commentsLoading}>
              <LoadingIndicator size="medium" />
            </View>
          ) : (
            <FlatList
              data={mergedComments}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              style={styles.commentsList}
              contentContainerStyle={{ paddingBottom: Spacing.sm }}
              keyboardShouldPersistTaps="handled"
              scrollIndicatorInsets={{ bottom: insets.bottom }}
              ListEmptyComponent={
                <ThemedText style={styles.noComments}>No comments yet. Be the first!</ThemedText>
              }
            />
          )}

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={!comment.trim() || commentMutation.isPending}
              style={[
                styles.sendButton,
                (!comment.trim() || commentMutation.isPending) && styles.sendButtonDisabled,
              ]}
            >
              {commentMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <Feather name="send" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerPlaceholder: {
    width: 40,
  },
  pictureContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "relative",
  },
  imageContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heartAnimation: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -40,
    marginLeft: -40,
  },
  pictureInfo: {
    position: "absolute",
    bottom: 100,
    left: Spacing.md,
    right: 80,
  },
  pictureUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  userInfo: {
    marginLeft: Spacing.sm,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  pictureUsername: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  displayName: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pictureCaption: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pictureActions: {
    position: "absolute",
    right: Spacing.md,
    bottom: 120,
    alignItems: "center",
    gap: Spacing.xl,
  },
  pictureActionButton: {
    alignItems: "center",
  },
  pictureActionCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  commentsPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  commentsPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  commentsPanelTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  closeCommentsButton: {
    padding: Spacing.xs,
  },
  commentsLoading: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  commentItem: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  commentText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    marginTop: 2,
  },
  commentTime: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginTop: 4,
  },
  noComments: {
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    color: "#FFFFFF",
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(139, 92, 246, 0.5)",
  },
});
