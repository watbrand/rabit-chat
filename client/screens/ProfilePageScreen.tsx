import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Platform,
  Share,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { FeaturedZone } from "@/components/profile/FeaturedZone";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { SwipeViewer } from "@/components/profile/SwipeViewer";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { trackProfileView } from "@/lib/analytics";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ProfilePageRouteProp = RouteProp<RootStackParamList, "ProfilePage">;

type TabType = "ALL" | "VIDEO" | "PHOTO" | "VOICE" | "TEXT" | "PINNED" | "SWIPE";

export default function ProfilePageScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const route = useRoute<ProfilePageRouteProp>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { username } = route.params;
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [showSwipeViewer, setShowSwipeViewer] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery<any>({
    queryKey: [`/api/users/${username}/profile`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${username}/profile`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const { data: featured, isLoading: featuredLoading, refetch: refetchFeatured } = useQuery<any>({
    queryKey: [`/api/users/${username}/featured`],
    enabled: !!profile && profile.privacy?.viewerCanSeeContent !== false,
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${username}/featured`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return { pinnedPosts: [], playlists: [], featuredIntro: null };
      return res.json();
    },
  });

  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useQuery<any>({
    queryKey: [`/api/users/${username}/posts`, activeTab],
    enabled: !!profile && profile.privacy?.viewerCanSeeContent !== false && activeTab !== "SWIPE",
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${username}/posts?tab=${activeTab}&limit=24`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return { posts: [], nextCursor: null };
      const data = await res.json();
      setNextCursor(data.nextCursor);
      return data;
    },
  });

  const { data: swipeData, isLoading: swipeLoading, refetch: refetchSwipe } = useQuery<any>({
    queryKey: [`/api/users/${username}/swipe`],
    enabled: showSwipeViewer,
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${username}/swipe?limit=10`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return { posts: [], nextCursor: null };
      return res.json();
    },
  });

  const isOwner = currentUser?.username === username;

  useEffect(() => {
    if (profile?.id) {
      trackProfileView(profile.id, "PROFILE");
    }
  }, [profile?.id]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      if (profile.relationship?.isFollowing) {
        await apiRequest("DELETE", `/api/users/${profile.id}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${profile.id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/profile`] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update follow status");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/swipe`] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ postId, hasSaved }: { postId: string; hasSaved: boolean }) => {
      if (hasSaved) {
        await apiRequest("DELETE", `/api/posts/${postId}/save`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/swipe`] });
    },
  });

  const handleMessage = async () => {
    if (!profile) return;
    try {
      const res = await apiRequest("POST", "/api/conversations", { userId: profile.id });
      const conversation = await res.json();
      navigation.navigate("Chat", {
        conversationId: conversation.id,
        otherUserId: profile.id,
        otherUserName: profile.displayName || profile.username,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start conversation");
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setNextCursor(null);
  };

  const handleSwipePress = () => {
    setShowSwipeViewer(true);
  };

  const handleCloseSwipe = () => {
    setShowSwipeViewer(false);
  };

  const handlePostPress = (postId: string) => {
    navigation.navigate("PostDetail", { postId });
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    try {
      const res = await fetch(
        new URL(`/api/users/${username}/posts?tab=${activeTab}&limit=24&cursor=${nextCursor}`, getApiUrl()),
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setNextCursor(data.nextCursor);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load more posts");
    }
  };

  const handleRefresh = () => {
    refetchProfile();
    refetchFeatured();
    refetchPosts();
  };

  if (profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="user-x" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          User not found
        </ThemedText>
      </View>
    );
  }

  const handleDownload = async (imageUrl: string) => {
    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `rabitchat_${Date.now()}.jpg`;
        link.target = "_blank";
        link.click();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Download started");
        return;
      }
      await WebBrowser.openBrowserAsync(imageUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to download");
    }
  };

  const handleUserPress = (userId: string) => {
    handleCloseSwipe();
    navigation.navigate("UserProfile", { userId });
  };

  if (showSwipeViewer) {
    const handleShare = async (postId: string) => {
      try {
        const postUrl = `https://rabitchat.app/posts/${postId}`;
        await Share.share({
          message: "Check out this post on RabitChat!",
          url: postUrl,
        });
      } catch (error) {
        // Share was cancelled or failed - no need to alert user
      }
    };

    return (
      <SwipeViewer
        posts={swipeData?.posts || []}
        isLoading={swipeLoading}
        hasMore={!!swipeData?.nextCursor}
        onLoadMore={handleLoadMore}
        onLike={(postId, hasLiked) => likeMutation.mutate({ postId, hasLiked })}
        onSave={(postId, hasSaved) => saveMutation.mutate({ postId, hasSaved })}
        onComment={(postId) => navigation.navigate("PostDetail", { postId })}
        onShare={handleShare}
        onClose={handleCloseSwipe}
        onUserPress={handleUserPress}
        onDownload={handleDownload}
      />
    );
  }

  const contentRestricted = !profile.privacy?.viewerCanSeeContent;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
        />
      }
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <ProfileHeader
        profile={profile}
        isOwner={isOwner}
        onFollow={() => followMutation.mutate()}
        onMessage={handleMessage}
        onEditProfile={() => navigation.navigate("EditProfile")}
        onSettings={() => navigation.navigate("Settings")}
        onCreatorTools={() => navigation.navigate("Studio")}
        onRequestVerification={() => Alert.alert("Verification", "Request submitted!")}
        isFollowPending={followMutation.isPending}
      />

      {contentRestricted ? (
        <View style={[styles.restrictedContainer, { backgroundColor: theme.glassBackground }]}>
          <Feather name="lock" size={48} color={theme.textSecondary} />
          <ThemedText type="h4" style={{ marginTop: Spacing.md }}>
            This Account is Private
          </ThemedText>
          <ThemedText style={[styles.restrictedText, { color: theme.textSecondary }]}>
            Follow this account to see their posts and content.
          </ThemedText>
        </View>
      ) : (
        <>
          {!featuredLoading && featured && (
            <FeaturedZone
              pinnedPosts={featured.pinnedPosts || []}
              playlists={featured.playlists || []}
              featuredIntro={featured.featuredIntro}
              onPostPress={handlePostPress}
              onPlaylistPress={(id) => Alert.alert("Playlist", `Opening playlist ${id}`)}
            />
          )}

          <ProfileTabs
            posts={postsData?.posts || []}
            isLoading={postsLoading}
            hasMore={!!nextCursor}
            onLoadMore={handleLoadMore}
            onTabChange={handleTabChange}
            onPostPress={handlePostPress}
            onSwipePress={handleSwipePress}
            activeTab={activeTab}
          />
        </>
      )}
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 16,
  },
  restrictedContainer: {
    margin: Spacing.lg,
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  restrictedText: {
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});
