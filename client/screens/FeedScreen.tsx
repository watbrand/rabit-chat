import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Image, Platform, Pressable, ScrollView, TextInput, Text, Dimensions, Alert } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import { PostCard } from "@/components/PostCard";
import { SponsoredPostCard } from "@/components/SponsoredPostCard";
import { ReportModal } from "@/components/ReportModal";
import { ThemedText } from "@/components/ThemedText";
import { FeedSkeletonLoader } from "@/components/ShimmerSkeleton";
import { Avatar, AnimatedStoryAvatar } from "@/components/Avatar";
import { GradientBackground } from "@/components/GradientBackground";
import { CoachingMarkSequence, useCoachingMarks } from "@/components/CoachingMark";
import { EliteLeaderboard } from "@/components/EliteLeaderboard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { trackPostView, batchTrackPostViews } from "@/lib/analytics";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type Story = {
  id: string;
  userId: string;
  mediaUrl: string;
  audioUrl?: string;
  mediaType: string;
  caption: string | null;
  duration: number | null;
  durationMs?: number | null;
  viewsCount: number;
  expiresAt: string;
  createdAt: string;
  type?: string;
  textContent?: string;
  backgroundColor?: string;
  fontFamily?: string;
  stickers?: any[];
  musicUrl?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartTime?: number;
  musicDuration?: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

type StoriesFeed = {
  yourStories: Story[];
  followingStories: { user: Story["user"]; stories: Story[] }[];
};

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [showCoachingMarks, setShowCoachingMarks] = useState(true);
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const viewedPostsRef = useRef<Set<string>>(new Set());

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 1000,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: any }> }) => {
    const newPostIds = viewableItems
      .map(v => v.item?.id)
      .filter(id => id && !viewedPostsRef.current.has(id));
    
    if (newPostIds.length > 0) {
      newPostIds.forEach(id => viewedPostsRef.current.add(id));
      batchTrackPostViews(newPostIds, "FEED");
    }
  }).current;

  const {
    data: feedData,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{ posts: any[]; nextCursor: string | null }>({
    queryKey: ["/api/posts/feed"],
    queryFn: async ({ pageParam }) => {
      const url = new URL("/api/posts/feed", getApiUrl());
      if (pageParam) url.searchParams.set("cursor", pageParam as string);
      url.searchParams.set("limit", "20");
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const posts = feedData?.pages.flatMap((page) => page.posts) ?? [];

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { data: storiesFeed } = useQuery<StoriesFeed>({
    queryKey: ["/api/stories/feed"],
  });

  const handleAddStory = () => {
    navigation.navigate("StoryComposer");
  };

  const handleViewStories = (tappedUser: Story["user"], tappedStories: Story[], initialStoryIndex = 0) => {
    // Build list of all users with stories for Instagram-like swiping
    const allUsers: { userId: string; username: string; displayName?: string; avatarUrl?: string; stories: Story[] }[] = [];
    
    // Add current user's stories first if they exist
    if (storiesFeed?.yourStories && storiesFeed.yourStories.length > 0 && user) {
      allUsers.push({
        userId: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl || undefined,
        stories: storiesFeed.yourStories,
      });
    }
    
    // Add all following users' stories
    if (storiesFeed?.followingStories) {
      storiesFeed.followingStories.forEach((item) => {
        if (item.user && item.stories.length > 0) {
          allUsers.push({
            userId: item.user.id,
            username: item.user.username,
            displayName: item.user.displayName,
            avatarUrl: item.user.avatarUrl || undefined,
            stories: item.stories,
          });
        }
      });
    }
    
    // Find the index of the tapped user
    const tappedUserIndex = allUsers.findIndex((u) => u.userId === tappedUser.id);
    const initialUserIndex = tappedUserIndex >= 0 ? tappedUserIndex : 0;
    
    navigation.navigate("StoryViewer", { 
      users: allUsers.length > 0 ? allUsers : [{
        userId: tappedUser.id,
        username: tappedUser.username,
        displayName: tappedUser.displayName,
        avatarUrl: tappedUser.avatarUrl || undefined,
        stories: tappedStories,
      }], 
      initialUserIndex, 
      initialStoryIndex 
    });
  };

  const handleCreatePost = () => {
    navigation.navigate("CreatePost");
  };

  const handleCreatePostWithMedia = () => {
    navigation.navigate("CreatePost", { autoMedia: true });
  };

  const handleSearch = () => {
    (navigation as any).navigate("Search");
  };

  const handleNotifications = () => {
    (navigation as any).getParent()?.navigate("ProfileTab", { screen: "Notifications" });
  };

  const handleMessages = () => {
    (navigation as any).getParent()?.navigate("MessagesTab");
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
      <BlurView 
        intensity={isDark ? 40 : 80} 
        tint={isDark ? "dark" : "light"} 
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.headerContent}>
        <View style={styles.headerLogo}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <View style={styles.logoTextContainer}>
            <Text style={[styles.logoText, { color: theme.primary }]}>Rabit</Text>
            <Text style={[styles.logoTextAccent, { color: theme.pink }]}>Chat</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]} 
            onPress={handleSearch}
            testID="header-search-btn"
          >
            <Feather name="search" size={20} color={theme.text} />
          </Pressable>
          <Pressable 
            style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]} 
            onPress={handleNotifications}
            testID="header-notifications-btn"
          >
            <Feather name="bell" size={20} color={theme.text} />
          </Pressable>
          <Pressable 
            style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]} 
            onPress={handleMessages}
            testID="header-messages-btn"
          >
            <Feather name="send" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderComposer = () => (
    <Pressable 
      style={[styles.composerCard, { 
        backgroundColor: isDark ? theme.glassBackground : theme.backgroundElevated,
        borderColor: theme.glassBorder,
      }]} 
      onPress={handleCreatePost}
      testID="post-composer-card"
    >
      <View style={styles.composerTop}>
        <Avatar uri={user?.avatarUrl} size={44} />
        <View style={[styles.composerInput, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.composerPlaceholder, { color: theme.textSecondary }]}>
            What's on your mind?
          </ThemedText>
        </View>
      </View>
      <View style={[styles.composerDivider, { backgroundColor: theme.divider }]} />
      <View style={styles.composerActions}>
        <Pressable style={styles.composerAction} onPress={handleCreatePostWithMedia}>
          <Feather name="image" size={18} color={theme.primary} />
          <ThemedText style={[styles.composerActionText, { color: theme.textSecondary }]}>Image</ThemedText>
        </Pressable>
        <View style={[styles.composerActionDivider, { backgroundColor: theme.divider }]} />
        <Pressable style={styles.composerAction} onPress={handleCreatePostWithMedia}>
          <Feather name="video" size={18} color={theme.pink} />
          <ThemedText style={[styles.composerActionText, { color: theme.textSecondary }]}>Video</ThemedText>
        </Pressable>
        <View style={[styles.composerActionDivider, { backgroundColor: theme.divider }]} />
        <Pressable style={styles.composerAction} onPress={handleCreatePostWithMedia}>
          <Feather name="mic" size={18} color={theme.teal} />
          <ThemedText style={[styles.composerActionText, { color: theme.textSecondary }]}>Voice</ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );

  const renderStoriesRow = () => {
    const hasOwnStory = storiesFeed?.yourStories && storiesFeed.yourStories.length > 0;

    return (
      <View style={styles.storiesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesScroll}
        >
          <Pressable
            style={styles.storyItem}
            onPress={() => {
              if (hasOwnStory && user) {
                handleViewStories(
                  {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                  },
                  storiesFeed.yourStories
                );
              } else {
                handleAddStory();
              }
            }}
            testID="story-item-self"
          >
            <View style={styles.storyAvatarWrapper}>
              {hasOwnStory ? (
                <AnimatedStoryAvatar uri={user?.avatarUrl} size={64} />
              ) : (
                <View style={[styles.addStoryCircle, { 
                  backgroundColor: isDark ? theme.backgroundSecondary : theme.backgroundTertiary,
                  borderColor: theme.primary,
                }]}>
                  <LinearGradient
                    colors={Gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addStoryIconWrapper}
                  >
                    <Feather name="plus" size={22} color="#FFF" />
                  </LinearGradient>
                </View>
              )}
              {hasOwnStory ? (
                <Pressable
                  style={styles.addMoreStoryBadge}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddStory();
                  }}
                  testID="add-more-story-btn"
                >
                  <LinearGradient
                    colors={Gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addMoreGradient}
                  >
                    <Feather name="plus" size={12} color="#FFF" />
                  </LinearGradient>
                </Pressable>
              ) : null}
            </View>
            <ThemedText style={[styles.storyUsername, { color: theme.textSecondary }]} numberOfLines={1}>
              Share Story
            </ThemedText>
          </Pressable>

          {storiesFeed?.followingStories?.filter(item => item.user).map((item) => (
            <Pressable
              key={item.user?.id || Math.random().toString()}
              style={styles.storyItem}
              onPress={() => item.user && handleViewStories(item.user, item.stories)}
              testID={`story-item-${item.user?.id || 'unknown'}`}
            >
              <View style={styles.storyAvatarWrapper}>
                <Avatar
                  uri={item.user?.avatarUrl}
                  size={64}
                  showStoryRing
                />
              </View>
              <ThemedText style={[styles.storyUsername, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.user?.displayName?.split(" ")[0] || item.user?.username || 'User'}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {renderComposer()}
      {renderStoriesRow()}
      <EliteLeaderboard variant="horizontal" showTitle={true} />
    </View>
  );

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
    },
    onMutate: async ({ postId, hasLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/posts/feed"] });
      const previousData = queryClient.getQueryData(["/api/posts/feed"]);
      
      queryClient.setQueryData(["/api/posts/feed"], (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post.id === postId
                ? {
                    ...post,
                    hasLiked: !hasLiked,
                    likesCount: hasLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1,
                  }
                : post
            ),
          })),
        };
      });
      
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/posts/feed"], context.previousData);
      }
      Alert.alert("Error", "Failed to update like. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
    },
  });

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="users" size={48} color={theme.primary} />
      </View>
      <ThemedText type="h4" style={styles.emptyTitle}>
        Your feed is empty
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Follow users to see their posts here
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <GradientBackground variant="subtle">
        {renderHeader()}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + 56 + Spacing.lg }}
        >
          <FeedSkeletonLoader count={4} />
        </ScrollView>
      </GradientBackground>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <GradientBackground variant={isDark ? "orbs" : "subtle"}>
      {renderHeader()}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 56 + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Handle sponsored posts
          if ((item as any).isAd) {
            return (
              <SponsoredPostCard
                post={{
                  id: item.id,
                  adId: (item as any).adId,
                  adGroupId: (item as any).adGroupId,
                  campaignId: (item as any).campaignId,
                  advertiserId: (item as any).advertiserId,
                  format: (item as any).format,
                  headline: (item as any).headline,
                  description: (item as any).description,
                  mediaUrl: (item as any).mediaUrl,
                  thumbnailUrl: (item as any).thumbnailUrl,
                  callToAction: (item as any).callToAction,
                  destinationUrl: (item as any).destinationUrl,
                  type: item.type,
                }}
              />
            );
          }
          
          // Regular posts
          return (
            <PostCard
              post={item}
              onLike={() => likeMutation.mutate({ postId: item.id, hasLiked: item.hasLiked })}
              onReport={() => { setReportPostId(item.id); setReportModalVisible(true); }}
              onMediaPress={() => {
                // Handle VIDEO and VOICE posts with TikTok-style vertical swipe viewer
                if (item.type === "VIDEO" || item.type === "VOICE") {
                  // Get all video/voice posts for swiping
                  const mediaTypesPosts = posts.filter((p: any) => p.mediaUrl && (p.type === "VIDEO" || p.type === "VOICE"));
                  const mediaIndex = mediaTypesPosts.findIndex((p: any) => p.id === item.id);
                  if (mediaIndex >= 0) {
                    navigation.navigate("ExploreReels", { 
                      posts: mediaTypesPosts.map((p: any) => ({
                        id: p.id,
                        authorId: p.authorId || p.author?.id,
                        type: p.type,
                        content: p.content,
                        mediaUrl: p.mediaUrl,
                        thumbnailUrl: p.thumbnailUrl,
                        likesCount: p.likesCount,
                        commentsCount: p.commentsCount,
                        viewsCount: p.viewsCount || 0,
                        hasLiked: p.hasLiked,
                        createdAt: p.createdAt,
                        user: p.author
                      })),
                      initialIndex: mediaIndex
                    });
                  }
                } else if (item.type === "PHOTO") {
                  // PHOTO posts use picture gallery viewer
                  const photoPosts = posts.filter((p: any) => p.mediaUrl && p.type === "PHOTO");
                  const mediaIndex = photoPosts.findIndex((p: any) => p.id === item.id);
                  if (mediaIndex >= 0) {
                    navigation.navigate("ExplorePictures", { 
                      posts: photoPosts.map((p: any) => ({
                        id: p.id,
                        authorId: p.authorId || p.author?.id,
                        type: "PHOTO",
                        content: p.content,
                        mediaUrl: p.mediaUrl,
                        likesCount: p.likesCount,
                        commentsCount: p.commentsCount,
                        viewsCount: p.viewsCount || 0,
                        hasLiked: p.hasLiked,
                        createdAt: p.createdAt,
                        user: p.author
                      })),
                      initialIndex: mediaIndex
                    });
                  }
                }
              }}
            />
          );
        }}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
            progressBackgroundColor={theme.backgroundSecondary}
            progressViewOffset={insets.top + 56}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={false}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <LoadingIndicator size="small" />
            </View>
          ) : null
        }
      />
      <ReportModal
        isVisible={reportModalVisible}
        onClose={() => { setReportModalVisible(false); setReportPostId(null); }}
        onSubmit={async () => { setReportModalVisible(false); setReportPostId(null); }}
        reportType="post"
        targetId={reportPostId || ''}
      />
      
      {showCoachingMarks ? (
        <CoachingMarkSequence
          marks={[
            {
              id: "feed-stories",
              title: "Stories",
              description: "Tap on story circles to view ephemeral content from people you follow. Your story appears first!",
              position: { top: insets.top + 140, left: Spacing.lg },
              arrowDirection: "up",
            },
            {
              id: "feed-compose",
              title: "Share Your Thoughts",
              description: "Tap here to create a new post. Share text, photos, videos, or voice messages with the elite community.",
              position: { top: insets.top + 70, left: screenWidth / 2 - 125 },
              arrowDirection: "up",
            },
            {
              id: "feed-algorithm",
              title: "Personalized Feed",
              description: "Your feed is personalized based on your interests, connections, and the elite algorithm. Engage with content to improve recommendations!",
              position: { top: screenHeight / 3, left: Spacing.lg },
              arrowDirection: "up",
            },
          ]}
          onComplete={() => setShowCoachingMarks(false)}
        />
      ) : null}
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLogo: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    marginRight: Spacing.sm,
  },
  logoTextContainer: {
    flexDirection: "row",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
  },
  logoTextAccent: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeader: {
    marginBottom: Spacing.lg,
  },
  composerCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  composerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  composerInput: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  composerPlaceholder: {
    fontSize: 14,
  },
  composerDivider: {
    height: 1,
    marginVertical: Spacing.md,
    marginHorizontal: -Spacing.md,
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  composerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  composerActionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  composerActionDivider: {
    width: 1,
    height: 20,
  },
  storiesSection: {
    marginHorizontal: -Spacing.lg,
  },
  storiesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  storyItem: {
    alignItems: "center",
    width: 80,
  },
  storyAvatarWrapper: {
    marginBottom: Spacing.xs,
    position: "relative",
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  addStoryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addMoreStoryBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  addMoreGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0A0A0F",
  },
  storyUsername: {
    fontSize: 11,
    textAlign: "center",
    width: 80,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
});
