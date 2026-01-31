import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Dimensions,
  ScrollView,
  Platform,
  Share,
  Alert,
  Modal,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as Clipboard from "expo-clipboard";

import { Avatar } from "@/components/Avatar";
import { apiRequest } from "@/lib/query-client";
import { UserBadge } from "@/components/UserBadge";
import { PostCard } from "@/components/PostCard";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ReportModal } from "@/components/ReportModal";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { ThemedText } from "@/components/ThemedText";
import { ProfileEnhancementsSection, BirthdayDisplay } from "@/components/profile";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { GradientBackground } from "@/components/GradientBackground";

type ContentTab = "PHOTO" | "VIDEO" | "VOICE" | "TEXT";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

interface FeaturedIntro {
  id: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

interface Story {
  id: string;
  type: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  expiresAt: string;
  user?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface StoriesFeed {
  yourStories: Story[];
  followingStories: { user: Story["user"]; stories: Story[] }[];
}

interface PinnedPost {
  id: string;
  type: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  likesCount: number;
  durationMs?: number;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>("PHOTO");
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState("");
  const [viewerImageTitle, setViewerImageTitle] = useState("");
  const [createMenuVisible, setCreateMenuVisible] = useState(false);

  const handleViewImage = (url: string, title: string) => {
    setViewerImageUrl(url);
    setViewerImageTitle(title);
    setImageViewerVisible(true);
  };

  const handleCreatePost = () => {
    setCreateMenuVisible(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("CreatePost");
  };

  const handleCreateStory = () => {
    setCreateMenuVisible(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("CreatePost", { type: "STORY" });
  };

  const openCreateMenu = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCreateMenuVisible(true);
  };

  const likeMutation = useMutation({
    mutationFn: async ({ postId, hasLiked }: { postId: string; hasLiked: boolean }) => {
      if (hasLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${postId}/like`);
      }
      return { postId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/posts`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${variables.postId}`] });
    },
  });

  const { data: userPosts, isLoading, refetch, isRefetching } = useQuery<any[]>({
    queryKey: [`/api/users/${user?.id}/posts`],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${user?.id}/posts`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const { data: stats } = useQuery<any>({
    queryKey: [`/api/users/${user?.id}`],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${user?.id}`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const { data: pinnedPosts } = useQuery<PinnedPost[]>({
    queryKey: ["/api/me/pins"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(
        new URL("/api/me/pins", getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: stories } = useQuery<Story[]>({
    queryKey: [`/api/users/${user?.id}/stories`],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${user?.id}/stories`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch all stories feed for Instagram-like swiping between users
  const { data: storiesFeed } = useQuery<StoriesFeed>({
    queryKey: ["/api/stories/feed"],
  });

  const { data: featuredIntro } = useQuery<FeaturedIntro | null>({
    queryKey: ["/api/me/featured-intro"],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(
        new URL("/api/me/featured-intro", getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data || null;
    },
  });

  const { data: shareLink } = useQuery<{ url: string }>({
    queryKey: [`/api/users/${user?.id}/share-link`],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${user?.id}/share-link`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return { url: "" };
      return res.json();
    },
  });

  const filteredPosts = useMemo(() => {
    if (!userPosts) return [];
    return userPosts.filter((post) => post.type === activeTab);
  }, [userPosts, activeTab]);

  const postCounts = useMemo(() => {
    if (!userPosts) return { PHOTO: 0, VIDEO: 0, VOICE: 0, TEXT: 0 };
    return userPosts.reduce(
      (acc, post) => {
        acc[post.type as ContentTab] = (acc[post.type as ContentTab] || 0) + 1;
        return acc;
      },
      { PHOTO: 0, VIDEO: 0, VOICE: 0, TEXT: 0 }
    );
  }, [userPosts]);

  const handleRefresh = () => {
    refetch();
    refreshUser();
    queryClient.invalidateQueries({ queryKey: ["/api/me/pins"] });
    queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stories`] });
    queryClient.invalidateQueries({ queryKey: ["/api/me/featured-intro"] });
  };

  const handleShareProfile = async () => {
    const profileUrl = shareLink?.url || `https://rabitchat.com/@${user?.username}`;
    try {
      const result = await Share.share({
        message: `Check out my profile on RabitChat: ${profileUrl}`,
        url: profileUrl,
      });
      if (result.action === Share.dismissedAction) {
        return;
      }
    } catch (error) {
      try {
        await Clipboard.setStringAsync(profileUrl);
        Alert.alert("Link Copied", "Profile link copied to clipboard!");
      } catch {
        Alert.alert("Error", "Could not share profile");
      }
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      let fullUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        fullUrl = 'https://' + url;
      }
      if (Platform.OS === 'web') {
        window.open(fullUrl, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(fullUrl);
      }
    } catch (error) {
      console.error("Failed to open link:", error);
      Alert.alert("Error", "Could not open link");
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `Joined ${month} ${year}`;
  };

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "CREATOR":
        return { label: "Creator", icon: "star" };
      case "BUSINESS":
        return { label: "Business", icon: "briefcase" };
      default:
        return null;
    }
  };

  const TabButton = ({ tab, icon, label }: { tab: ContentTab; icon: string; label: string }) => (
    <Pressable
      style={[
        styles.tabButton,
        {
          backgroundColor: activeTab === tab ? theme.primary : "transparent",
          borderColor: activeTab === tab ? theme.primary : theme.glassBorder,
        },
      ]}
      onPress={() => setActiveTab(tab)}
      testID={`tab-${tab.toLowerCase()}`}
    >
      <Feather
        name={icon as any}
        size={16}
        color={activeTab === tab ? "#FFF" : theme.textSecondary}
      />
      <ThemedText
        style={[
          styles.tabLabel,
          { color: activeTab === tab ? "#FFF" : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
      <View
        style={[
          styles.tabCount,
          { backgroundColor: activeTab === tab ? "rgba(255,255,255,0.25)" : theme.glassBackground },
        ]}
      >
        <ThemedText
          style={[
            styles.tabCountText,
            { color: activeTab === tab ? "#FFF" : theme.textSecondary },
          ]}
        >
          {postCounts[tab]}
        </ThemedText>
      </View>
    </Pressable>
  );

  const videoPosts = useMemo(() => {
    if (!userPosts) return [];
    return userPosts.filter((post) => post.type === "VIDEO");
  }, [userPosts]);

  const handleGridItemPress = (item: any) => {
    if (item.type === "VIDEO" && videoPosts.length > 0) {
      const videoIndex = videoPosts.findIndex((p) => p.id === item.id);
      navigation.navigate("ProfileReels", {
        userId: user?.id || "",
        posts: videoPosts,
        initialIndex: videoIndex >= 0 ? videoIndex : 0,
      });
    } else {
      navigation.navigate("PostDetail", { postId: item.id });
    }
  };

  const renderGridItem = ({ item, index }: { item: any; index: number }) => {
    const isVideo = item.type === "VIDEO";
    const thumbnailUri = item.thumbnailUrl || item.mediaUrl;

    return (
      <Pressable
        style={[
          styles.gridItem,
          { marginRight: (index + 1) % GRID_COLUMNS === 0 ? 0 : GRID_GAP },
        ]}
        onPress={() => handleGridItemPress(item)}
        testID={`grid-item-${item.id}`}
      >
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.gridImage}
          contentFit="cover"
        />
        {isVideo && item.durationMs ? (
          <View style={styles.durationBadge}>
            <Feather name="play" size={10} color="#FFF" />
            <ThemedText style={styles.durationText}>
              {formatDuration(item.durationMs)}
            </ThemedText>
          </View>
        ) : null}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gridGradient}
        >
          <View style={styles.gridStat}>
            <Feather name="heart" size={12} color="#FFF" />
            <ThemedText style={styles.gridStatText}>{item.likesCount}</ThemedText>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderPinnedItem = ({ item, index }: { item: PinnedPost; index: number }) => {
    const isVideo = item.type === "VIDEO";
    const thumbnailUri = item.thumbnailUrl || item.mediaUrl;

    return (
      <Pressable
        style={[
          styles.gridItem,
          { marginRight: (index + 1) % GRID_COLUMNS === 0 ? 0 : GRID_GAP },
        ]}
        onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
        testID={`pinned-item-${item.id}`}
      >
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.gridImage}
          contentFit="cover"
        />
        <View style={[styles.pinnedBadge, { backgroundColor: theme.primary }]}>
          <Feather name="bookmark" size={10} color="#FFF" />
        </View>
        {isVideo && item.durationMs ? (
          <View style={styles.durationBadge}>
            <Feather name="play" size={10} color="#FFF" />
            <ThemedText style={styles.durationText}>
              {formatDuration(item.durationMs)}
            </ThemedText>
          </View>
        ) : null}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gridGradient}
        >
          <View style={styles.gridStat}>
            <Feather name="heart" size={12} color="#FFF" />
            <ThemedText style={styles.gridStatText}>{item.likesCount}</ThemedText>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  const renderVoiceItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.voiceItem, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
      onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
      testID={`voice-item-${item.id}`}
    >
      <LinearGradient
        colors={[theme.primary, theme.primaryDark]}
        style={styles.voiceIconGradient}
      >
        <Feather name="mic" size={20} color="#FFF" />
      </LinearGradient>
      <View style={styles.voiceContent}>
        <ThemedText style={{ color: theme.text, fontWeight: "500" }} numberOfLines={2}>
          {item.caption || "Voice Note"}
        </ThemedText>
        <View style={styles.voiceMeta}>
          {item.durationMs ? (
            <View style={styles.voiceDurationBadge}>
              <Feather name="clock" size={10} color={theme.textSecondary} />
              <ThemedText style={[styles.voiceDuration, { color: theme.textSecondary }]}>
                {formatDuration(item.durationMs)}
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.voiceStats}>
            <Feather name="heart" size={12} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 4 }}>
              {item.likesCount}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={[styles.playButton, { backgroundColor: theme.primary }]}>
        <Feather name="play" size={16} color="#FFF" />
      </View>
    </Pressable>
  );

  const renderStoryHighlights = () => {
    const hasStories = stories && stories.length > 0;

    return (
      <View style={[styles.storiesSection, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.md }]}>
          Highlights
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesRow}
        >
          <Pressable
            style={styles.storyItem}
            onPress={() => navigation.navigate("StoryComposer")}
            testID="button-add-story"
          >
            <View style={[styles.addStoryCircle, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}>
              <Feather name="plus" size={24} color={theme.primary} />
            </View>
            <ThemedText style={[styles.storyLabel, { color: theme.textSecondary }]}>
              Add Story
            </ThemedText>
          </Pressable>
          {hasStories ? (
            stories.map((story, index) => (
              <Pressable
                key={story.id}
                style={styles.storyItem}
                onPress={() => {
                  // Build list of all users with stories for Instagram-like swiping
                  const allUsers: { userId: string; username: string; displayName?: string; avatarUrl?: string; stories: Story[] }[] = [];
                  
                  // Add current user's stories first
                  if (user && stories.length > 0) {
                    allUsers.push({
                      userId: user.id,
                      username: user.username,
                      displayName: user.displayName,
                      avatarUrl: user.avatarUrl || undefined,
                      stories: stories,
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
                  
                  navigation.navigate("StoryViewer", { 
                    users: allUsers.length > 0 ? allUsers : [{
                      userId: user?.id || '',
                      username: user?.username || '',
                      displayName: user?.displayName,
                      avatarUrl: user?.avatarUrl,
                      stories: stories,
                    }],
                    initialUserIndex: 0,
                    initialStoryIndex: index,
                  });
                }}
                testID={`story-${story.id}`}
              >
                <View style={[styles.storyCircle, { borderColor: theme.primary }]}>
                  <Image
                    source={{ uri: story.thumbnailUrl || story.mediaUrl }}
                    style={styles.storyImage}
                    contentFit="cover"
                  />
                </View>
                <ThemedText style={[styles.storyLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  Story
                </ThemedText>
              </Pressable>
            ))
          ) : null}
        </ScrollView>
      </View>
    );
  };

  const renderFeaturedIntro = () => {
    if (!featuredIntro) return null;

    return (
      <View style={[styles.featuredIntroCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.featuredIntroHeader}>
          <Feather name="info" size={18} color={theme.primary} />
          <ThemedText style={[styles.featuredIntroTitle, { color: theme.text }]}>
            {featuredIntro.title}
          </ThemedText>
        </View>
        <ThemedText style={[styles.featuredIntroBody, { color: theme.textSecondary }]}>
          {featuredIntro.body}
        </ThemedText>
        {featuredIntro.ctaText && featuredIntro.ctaUrl ? (
          <Pressable
            style={[styles.featuredCta, { backgroundColor: theme.primary }]}
            onPress={() => handleOpenLink(featuredIntro.ctaUrl!)}
            testID="button-featured-cta"
          >
            <ThemedText style={styles.featuredCtaText}>{featuredIntro.ctaText}</ThemedText>
            <Feather name="external-link" size={14} color="#FFF" />
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderPinnedPosts = () => {
    if (!pinnedPosts || pinnedPosts.length === 0) return null;

    return (
      <View style={[styles.pinnedSection, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.pinnedHeader}>
          <Feather name="bookmark" size={16} color={theme.primary} />
          <ThemedText style={[styles.sectionTitle, { color: theme.text, marginLeft: Spacing.sm }]}>
            Pinned
          </ThemedText>
        </View>
        <View style={styles.pinnedGrid}>
          {pinnedPosts.slice(0, 3).map((post, index) => (
            <View key={post.id}>
              {renderPinnedItem({ item: post, index })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    const categoryInfo = getCategoryLabel(user?.category || "PERSONAL");

    return (
      <View style={styles.profileHeader}>
        <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}>
          <Pressable 
            style={styles.coverContainer}
            onPress={() => user?.coverUrl ? handleViewImage(user.coverUrl, "Cover Photo") : null}
            disabled={!user?.coverUrl}
          >
            {user?.coverUrl ? (
              <Image
                source={{ uri: user.coverUrl }}
                style={styles.coverPhoto}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverPhoto}
              />
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)"]}
              style={styles.coverOverlay}
            />
            {user?.coverUrl ? (
              <View style={[styles.viewImageHint, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                <Feather name="maximize-2" size={14} color="#FFF" />
              </View>
            ) : null}
          </Pressable>
          
          <Pressable 
            style={styles.avatarSection}
            onPress={() => user?.avatarUrl ? handleViewImage(user.avatarUrl, "Profile Photo") : null}
            disabled={!user?.avatarUrl}
          >
            <View style={[styles.avatarRing, { borderColor: theme.backgroundDefault }]}>
              <Avatar uri={user?.avatarUrl} size={90} />
            </View>
            {user?.isVerified ? (
              <View style={[styles.verifiedBadge, { backgroundColor: "#FFF" }]}>
                <Feather name="check" size={12} color="#1DA1F2" />
              </View>
            ) : null}
          </Pressable>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <ThemedText type="h2" style={styles.displayName}>
                {user?.displayName}
              </ThemedText>
              {user?.isVerified ? <VerifiedBadge size={18} /> : null}
              {user?.pronouns ? (
                <ThemedText style={[styles.pronouns, { color: theme.textSecondary }]}>
                  {user.pronouns}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.usernameRow}>
              <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
                @{user?.username}
              </ThemedText>
            </View>

            {categoryInfo ? (
              <View style={[styles.categoryBadge, { backgroundColor: `${theme.primary}20` }]}>
                <Feather name={categoryInfo.icon as any} size={12} color={theme.primary} />
                <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
                  {categoryInfo.label}
                </ThemedText>
              </View>
            ) : null}

            {user?.bio ? (
              <ThemedText style={[styles.bio, { color: theme.text }]}>
                {user.bio}
              </ThemedText>
            ) : null}

            <View style={styles.metaInfo}>
              {user?.location ? (
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={14} color={theme.textSecondary} />
                  <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                    {user.location}
                  </ThemedText>
                </View>
              ) : null}

              {user?.linkUrl ? (
                <Pressable 
                  style={({ pressed }) => [
                    styles.metaRow,
                    styles.linkPressable,
                    pressed && { opacity: 0.7 }
                  ]}
                  onPress={() => handleOpenLink(user.linkUrl!)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  testID="button-profile-link"
                >
                  <Feather name="link" size={14} color={theme.primary} />
                  <ThemedText style={[styles.linkText, { color: theme.primary }]} numberOfLines={1}>
                    {user.linkUrl.replace(/^https?:\/\//, "").split("/")[0]}
                  </ThemedText>
                </Pressable>
              ) : null}

              {user?.createdAt ? (
                <View style={styles.metaRow}>
                  <Feather name="calendar" size={14} color={theme.textSecondary} />
                  <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                    {formatJoinDate(user.createdAt)}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.badgesRow}>
            <UserBadge 
              type="networth" 
              value={stats?.netWorth ?? user?.netWorth ?? 0} 
              onPress={() => user?.id ? navigation.navigate("NetWorthPortfolio", { userId: user.id, username: user.username }) : undefined}
            />
            <UserBadge type="influence" value={stats?.influenceScore ?? user?.influenceScore ?? 0} />
          </View>

          {user?.id ? (
            <ProfileEnhancementsSection
              userId={user.id}
              isOwner={true}
              onNavigateToPartner={(partnerId) => navigation.navigate("UserProfile", { userId: partnerId })}
              onEditLinks={() => navigation.navigate("EditProfile", { tab: "links" })}
              onEditInterests={() => navigation.navigate("EditProfile", { tab: "interests" })}
            />
          ) : null}

          <View style={[styles.statsCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
            <Pressable 
              style={styles.statItem}
              onPress={() => navigation.navigate("Followers", { userId: user?.id, type: "followers" })}
              testID="button-followers"
            >
              <ThemedText type="h4" style={{ color: theme.text }}>{stats?.followersCount || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</ThemedText>
            </Pressable>
            <View style={[styles.statDivider, { backgroundColor: theme.glassBorder }]} />
            <Pressable 
              style={styles.statItem}
              onPress={() => navigation.navigate("Followers", { userId: user?.id, type: "following" })}
              testID="button-following"
            >
              <ThemedText type="h4" style={{ color: theme.text }}>{stats?.followingCount || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Following</ThemedText>
            </Pressable>
            <View style={[styles.statDivider, { backgroundColor: theme.glassBorder }]} />
            <View style={styles.statItem}>
              <ThemedText type="h4" style={{ color: theme.text }}>{userPosts?.length || 0}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</ThemedText>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.editButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("EditProfile")}
              testID="button-edit-profile"
            >
              <Feather name="edit-2" size={16} color="#FFF" />
              <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.iconButton, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}
              onPress={handleShareProfile}
              testID="button-share-profile"
            >
              <Feather name="share" size={18} color={theme.text} />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}
              onPress={() => navigation.navigate("Studio")}
              testID="button-creator-studio"
            >
              <Feather name="bar-chart-2" size={18} color={theme.text} />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}
              onPress={() => navigation.navigate("MyBoosts")}
              testID="button-my-boosts"
            >
              <Feather name="trending-up" size={18} color={theme.text} />
            </Pressable>
            <Pressable
              style={[styles.iconButton, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}
              onPress={() => navigation.navigate("Settings")}
              testID="button-settings"
            >
              <Feather name="settings" size={18} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {renderStoryHighlights()}

        {renderFeaturedIntro()}

        {renderPinnedPosts()}

        <View style={[styles.contentCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Content</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            <TabButton tab="PHOTO" icon="image" label="Photos" />
            <TabButton tab="VIDEO" icon="video" label="Reels" />
            <TabButton tab="VOICE" icon="mic" label="Voice" />
            <TabButton tab="TEXT" icon="type" label="Texts" />
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return <LoadingIndicator size="medium" style={{ marginTop: Spacing.xl }} />;
    }
    
    const emptyMessages: Record<ContentTab, { icon: string; text: string; subtext: string }> = {
      PHOTO: { icon: "image", text: "No photos yet", subtext: "Share your first photo" },
      VIDEO: { icon: "video", text: "No reels yet", subtext: "Create your first reel" },
      VOICE: { icon: "mic", text: "No voice notes yet", subtext: "Record your first voice note" },
      TEXT: { icon: "type", text: "No text posts yet", subtext: "Write your first post" },
    };

    const { icon, text, subtext } = emptyMessages[activeTab];

    return (
      <View style={[styles.emptyState, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name={icon as any} size={32} color={theme.primary} />
        </View>
        <ThemedText style={[styles.emptyText, { color: theme.text }]}>
          {text}
        </ThemedText>
        <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          {subtext}
        </ThemedText>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  const isGridView = activeTab === "PHOTO" || activeTab === "VIDEO";

  return (
    <GradientBackground variant="subtle">
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        numColumns={isGridView ? GRID_COLUMNS : 1}
        key={isGridView ? "grid" : "list"}
        renderItem={
          isGridView
            ? renderGridItem
            : activeTab === "VOICE"
            ? renderVoiceItem
            : ({ item }) => (
                <PostCard
                  post={item}
                  onLike={() => likeMutation.mutate({ postId: item.id, hasLiked: item.hasLiked })}
                  onReport={() => {
                    setReportPostId(item.id);
                    setReportModalVisible(true);
                  }}
                />
              )
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={
          isGridView
            ? () => <View style={{ height: GRID_GAP }} />
            : () => <View style={{ height: Spacing.lg }} />
        }
      />
      <ReportModal
        isVisible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setReportPostId(null);
        }}
        onSubmit={async () => {
          setReportModalVisible(false);
          setReportPostId(null);
        }}
        reportType="post"
        targetId={reportPostId || ""}
      />
      <ImageViewerModal
        isVisible={imageViewerVisible}
        imageUrl={viewerImageUrl}
        title={viewerImageTitle}
        onClose={() => setImageViewerVisible(false)}
      />

      <Pressable
        style={[
          styles.createFab,
          {
            bottom: tabBarHeight + Spacing.lg,
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
          },
        ]}
        onPress={openCreateMenu}
        testID="button-create-content"
      >
        <Feather name="plus" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={createMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateMenuVisible(false)}
      >
        <Pressable 
          style={styles.createMenuOverlay}
          onPress={() => setCreateMenuVisible(false)}
        >
          <View style={[styles.createMenuContainer, { bottom: tabBarHeight + Spacing.lg + 80 }]}>
            <Pressable
              style={[styles.createMenuItem, { backgroundColor: theme.glassBackground }]}
              onPress={handleCreateStory}
              testID="button-create-story"
            >
              <View style={[styles.createMenuIcon, { backgroundColor: theme.primaryLight }]}>
                <Feather name="clock" size={20} color={theme.primary} />
              </View>
              <View style={styles.createMenuText}>
                <ThemedText style={styles.createMenuTitle}>Story</ThemedText>
                <ThemedText style={[styles.createMenuSubtitle, { color: theme.textSecondary }]}>
                  Share a moment (24h)
                </ThemedText>
              </View>
            </Pressable>

            <Pressable
              style={[styles.createMenuItem, { backgroundColor: theme.glassBackground }]}
              onPress={handleCreatePost}
              testID="button-create-post"
            >
              <View style={[styles.createMenuIcon, { backgroundColor: theme.primaryLight }]}>
                <Feather name="edit-3" size={20} color={theme.primary} />
              </View>
              <View style={styles.createMenuText}>
                <ThemedText style={styles.createMenuTitle}>Post</ThemedText>
                <ThemedText style={[styles.createMenuSubtitle, { color: theme.textSecondary }]}>
                  Share photos, videos, or text
                </ThemedText>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeader: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  profileCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  coverContainer: {
    position: "relative",
  },
  coverPhoto: {
    width: "100%",
    height: 160,
  },
  coverOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  viewImageHint: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: -55,
    position: "relative",
  },
  avatarRing: {
    borderRadius: 52,
    borderWidth: 4,
    padding: 2,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  displayName: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "700",
  },
  pronouns: {
    fontSize: 14,
    fontWeight: "400",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  username: {
    fontSize: 15,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bio: {
    marginTop: Spacing.md,
    textAlign: "center",
    lineHeight: 22,
    fontSize: 15,
  },
  metaInfo: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 14,
  },
  linkPressable: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
    maxWidth: 200,
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  editButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 15,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  storiesSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  storiesRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  storyItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  storyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    padding: 2,
    overflow: "hidden",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  storyLabel: {
    fontSize: 11,
    width: 64,
    textAlign: "center",
  },
  featuredIntroCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  featuredIntroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  featuredIntroTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  featuredIntroBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuredCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.xs,
    alignSelf: "flex-start",
  },
  featuredCtaText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  pinnedSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  pinnedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  pinnedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  pinnedBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  contentCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  tabsContainer: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  tabsContent: {
    gap: Spacing.sm,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    alignItems: "center",
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: "600",
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginBottom: GRID_GAP,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: "flex-end",
    paddingBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  gridStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridStatText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  durationBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 3,
  },
  durationText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  voiceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  voiceIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  voiceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  voiceDurationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voiceDuration: {
    fontSize: 12,
  },
  voiceStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  createFab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  createMenuContainer: {
    position: "absolute",
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  createMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    minWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  createMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  createMenuText: {
    flex: 1,
  },
  createMenuTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  createMenuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
