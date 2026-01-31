import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { Avatar } from "@/components/Avatar";
import { UserBadge } from "@/components/UserBadge";
import { PostCard } from "@/components/PostCard";
import { ThemedText } from "@/components/ThemedText";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ReportModal } from "@/components/ReportModal";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { ProfileEnhancementsSection, BirthdayDisplay } from "@/components/profile";
import { GiftSheet } from "@/components/GiftSheet";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { trackProfileView } from "@/lib/analytics";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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

interface MutualFollower {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

interface MutualsResponse {
  count: number;
  users: MutualFollower[];
}

type UserProfileRouteProp = RouteProp<RootStackParamList, "UserProfile">;
type ContentTab = "PHOTO" | "VIDEO" | "VOICE" | "TEXT";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_GAP = 2;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  const route = useRoute<UserProfileRouteProp>();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const { userId } = route.params;
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [giftSheetVisible, setGiftSheetVisible] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{ isBlocked: boolean; isBlockedBy: boolean } | null>(null);
  const [showBlockAlert, setShowBlockAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>("PHOTO");
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState("");
  const [viewerImageTitle, setViewerImageTitle] = useState("");

  const handleViewImage = (url: string, title: string) => {
    setViewerImageUrl(url);
    setViewerImageTitle(title);
    setImageViewerVisible(true);
  };

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${userId}`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const { data: userPosts, isLoading: postsLoading } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/posts`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${userId}/posts`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const { data: stories } = useQuery<Story[]>({
    queryKey: [`/api/users/${userId}/stories`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${userId}/stories`, getApiUrl()),
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

  const isOwnProfile = currentUser?.id === userId;

  const { data: mutuals } = useQuery<MutualsResponse>({
    queryKey: [`/api/users/${userId}/mutuals`],
    enabled: !isOwnProfile,
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${userId}/mutuals`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return { count: 0, users: [] };
      return res.json();
    },
  });

  const { data: pinnedPosts } = useQuery<PinnedPost[]>({
    queryKey: [`/api/users/${userId}/pins`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${userId}/pins`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return [];
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

  const followMutation = useMutation({
    mutationFn: async () => {
      if (user?.isFollowing) {
        await apiRequest("DELETE", `/api/users/${userId}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${userId}/follow`);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [`/api/users/${userId}`] });
      const previousData = queryClient.getQueryData([`/api/users/${userId}`]);
      
      queryClient.setQueryData([`/api/users/${userId}`], (old: any) => {
        if (!old) return old;
        const wasFollowing = old.isFollowing;
        return {
          ...old,
          isFollowing: !wasFollowing,
          followersCount: wasFollowing 
            ? Math.max(0, (old.followersCount || 0) - 1) 
            : (old.followersCount || 0) + 1,
        };
      });
      
      return { previousData };
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([`/api/users/${userId}`], context.previousData);
      }
      Alert.alert("Error", error.message || "Failed to update follow status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      // Also invalidate current user's profile to update following count
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/profile"] });
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
      await queryClient.cancelQueries({ queryKey: [`/api/users/${userId}/posts`] });
      const previousData = queryClient.getQueryData([`/api/users/${userId}/posts`]);
      
      queryClient.setQueryData([`/api/users/${userId}/posts`], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((post: any) =>
          post.id === postId
            ? {
                ...post,
                hasLiked: !hasLiked,
                likesCount: hasLiked ? Math.max(0, post.likesCount - 1) : post.likesCount + 1,
              }
            : post
        );
      });
      
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([`/api/users/${userId}/posts`], context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/posts`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${variables.postId}`] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (shouldBlock: boolean) => {
      if (shouldBlock) {
        await apiRequest("POST", `/api/users/${userId}/block`);
      } else {
        await apiRequest("DELETE", `/api/users/${userId}/block`);
      }
      return shouldBlock;
    },
    onSuccess: (shouldBlock) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      if (shouldBlock) {
        Alert.alert("User blocked. You won't see their content anymore.");
      }
      setBlockStatus((prev) => prev ? { ...prev, isBlocked: shouldBlock } : null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update block status");
    },
  });

  const handleMessage = async () => {
    try {
      const res = await apiRequest("POST", "/api/conversations", { userId });
      const conversation = await res.json();
      navigation.navigate("Chat", {
        conversationId: conversation.id,
        otherUserId: userId,
        otherUserName: user?.displayName || "User",
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start conversation");
    }
  };

  const handleMenuPress = async () => {
    try {
      const res = await fetch(
        new URL(`/api/users/${userId}/blocked`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch block status");
      const status = await res.json();
      setBlockStatus(status);
      setShowBlockAlert(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to fetch block status");
    }
  };

  const handleBlockPress = async () => {
    setShowBlockAlert(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (blockStatus?.isBlocked) {
      Alert.alert(
        "Unblock User",
        "Are you sure you want to unblock this user?\n\nThey will be able to see your profile and message you again.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unblock",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              blockMutation.mutate(false);
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Block User",
        "Are you sure you want to block this user?\n\nThey will:\n• Not be able to see your profile or posts\n• Not be able to message you\n• Not be notified that they are blocked\n\nYou can unblock them later from settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Block",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              blockMutation.mutate(true);
            },
            style: "destructive",
          },
        ]
      );
    }
  };

  const handleReportPress = () => {
    setShowBlockAlert(false);
    setReportModalVisible(true);
  };

  useEffect(() => {
    if (!isOwnProfile) {
      navigation.setOptions({
        headerRight: () => (
          <Pressable
            onPress={handleMenuPress}
            hitSlop={8}
            testID="button-menu"
          >
            <Feather name="more-vertical" size={24} color={theme.text} />
          </Pressable>
        ),
      });
    }
  }, [isOwnProfile, theme.text, navigation]);

  useEffect(() => {
    if (userId) {
      trackProfileView(userId, "PROFILE");
    }
  }, [userId]);

  useEffect(() => {
    if (showBlockAlert && blockStatus) {
      Alert.alert(
        "Options",
        "What would you like to do?",
        [
          {
            text: blockStatus.isBlocked ? "Unblock User" : "Block User",
            onPress: handleBlockPress,
            style: "destructive",
          },
          {
            text: "Report User",
            onPress: handleReportPress,
          },
          {
            text: "Cancel",
            onPress: () => setShowBlockAlert(false),
            style: "cancel",
          },
        ]
      );
    }
  }, [showBlockAlert, blockStatus]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.round(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 5) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Active ${diffDays}d ago`;
    return `Active ${formatJoinDate(dateString)}`;
  };

  const isActiveNow = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 5;
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

  const getMutualFollowersText = () => {
    if (!mutuals || mutuals.count === 0) return null;
    const names = mutuals.users.slice(0, 2).map(u => u.displayName || u.username);
    const remaining = mutuals.count - names.length;
    if (names.length === 1 && remaining === 0) {
      return `Followed by ${names[0]}`;
    } else if (names.length === 2 && remaining === 0) {
      return `Followed by ${names[0]} and ${names[1]}`;
    } else if (remaining > 0) {
      return `Followed by ${names.join(', ')} and ${remaining} ${remaining === 1 ? 'other' : 'others'} you follow`;
    }
    return null;
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
        userId: userId,
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

  const renderEmptyState = () => {
    if (postsLoading) {
      return <LoadingIndicator size="medium" style={{ marginTop: Spacing.xl }} />;
    }
    
    const emptyMessages: Record<ContentTab, { icon: string; text: string }> = {
      PHOTO: { icon: "image", text: "No photos yet" },
      VIDEO: { icon: "video", text: "No reels yet" },
      VOICE: { icon: "mic", text: "No voice notes yet" },
      TEXT: { icon: "type", text: "No text posts yet" },
    };

    const { icon, text } = emptyMessages[activeTab];

    return (
      <View style={[styles.emptyState, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
        <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name={icon as any} size={32} color={theme.primary} />
        </View>
        <ThemedText style={[styles.emptyText, { color: theme.text }]}>
          {text}
        </ThemedText>
      </View>
    );
  };

  const renderHeader = () => (
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
          <View style={styles.displayNameRow}>
            <ThemedText type="h3" style={styles.displayName}>
              {user?.displayName}
            </ThemedText>
            {user?.isVerified ? <VerifiedBadge size={18} /> : null}
            {user?.pronouns ? (
              <ThemedText style={[styles.pronouns, { color: theme.textSecondary }]}>
                {user.pronouns}
              </ThemedText>
            ) : null}
          </View>
          <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
            @{user?.username}
          </ThemedText>

          {user?.category ? (() => {
            const categoryInfo = getCategoryLabel(user.category);
            return categoryInfo ? (
              <View style={[styles.categoryBadge, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
                <Feather name={categoryInfo.icon as any} size={12} color={theme.primary} />
                <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
                  {categoryInfo.label}
                </ThemedText>
              </View>
            ) : null;
          })() : null}

          {user?.bio ? (
            <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>
              {user.bio}
            </ThemedText>
          ) : null}

          <View style={styles.infoRow}>
            {user?.location ? (
              <View style={styles.infoItem}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} style={styles.infoIcon} />
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  {user.location}
                </ThemedText>
              </View>
            ) : null}
            {user?.linkUrl ? (
              <Pressable style={styles.infoItem} onPress={() => handleOpenLink(user.linkUrl)}>
                <Feather name="link" size={14} color={theme.primary} style={styles.infoIcon} />
                <ThemedText style={[styles.infoLink, { color: theme.primary }]} numberOfLines={1}>
                  {user.linkUrl.replace(/^https?:\/\//, '')}
                </ThemedText>
              </Pressable>
            ) : null}
            {user?.createdAt ? (
              <View style={styles.infoItem}>
                <Feather name="calendar" size={14} color={theme.textSecondary} style={styles.infoIcon} />
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  Joined {formatJoinDate(user.createdAt)}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        {user?.lastActiveAt ? (
          <View style={styles.activityRow}>
            <View style={[
              styles.activityDot, 
              { backgroundColor: isActiveNow(user.lastActiveAt) ? theme.success : theme.textSecondary }
            ]} />
            <ThemedText style={[styles.activityText, { color: theme.textSecondary }]}>
              {formatLastActive(user.lastActiveAt)}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.badgesRow}>
          <UserBadge 
            type="networth" 
            value={user?.netWorth || 0} 
            onPress={() => userId ? navigation.push("NetWorthPortfolio", { userId, username: user?.username }) : undefined}
          />
          <UserBadge type="influence" value={user?.influenceScore || 0} />
        </View>

        {userId ? (
          <ProfileEnhancementsSection
            userId={userId}
            isOwner={false}
            onNavigateToPartner={(partnerId) => navigation.push("UserProfile", { userId: partnerId })}
          />
        ) : null}

        <View style={[styles.statsCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
          <Pressable 
            style={styles.statItem}
            onPress={() => navigation.navigate("Followers", { userId, type: "followers" })}
          >
            <ThemedText type="h4" style={{ color: theme.text }}>{user?.followersCount || 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Followers</ThemedText>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: theme.glassBorder }]} />
          <Pressable 
            style={styles.statItem}
            onPress={() => navigation.navigate("Followers", { userId, type: "following" })}
          >
            <ThemedText type="h4" style={{ color: theme.text }}>{user?.followingCount || 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Following</ThemedText>
          </Pressable>
          <View style={[styles.statDivider, { backgroundColor: theme.glassBorder }]} />
          <View style={styles.statItem}>
            <ThemedText type="h4" style={{ color: theme.text }}>{userPosts?.length || 0}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Posts</ThemedText>
          </View>
        </View>

        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            {user?.isBlocked || user?.isBlockedBy ? (
              <View style={[styles.blockedMessage, { backgroundColor: theme.error + '20' }]}>
                <Feather name="alert-circle" size={16} color={theme.error} />
                <ThemedText style={{ color: theme.error, marginLeft: Spacing.sm }}>
                  {user?.isBlocked ? "You blocked this user" : "This user has blocked you"}
                </ThemedText>
              </View>
            ) : (
              <>
                <Pressable
                  style={[
                    styles.followButton,
                    user?.isFollowing
                      ? { borderColor: theme.primary, backgroundColor: "transparent" }
                      : { backgroundColor: theme.primary, borderColor: theme.primary },
                  ]}
                  onPress={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  testID="button-follow"
                >
                  {followMutation.isPending ? (
                    <LoadingIndicator size="small" />
                  ) : (
                    <>
                      <Feather 
                        name={user?.isFollowing ? "user-check" : "user-plus"} 
                        size={16} 
                        color={user?.isFollowing ? theme.primary : "#FFF"} 
                      />
                      <ThemedText
                        style={{
                          color: user?.isFollowing ? theme.primary : "#FFFFFF",
                          fontWeight: "600",
                          marginLeft: Spacing.sm,
                        }}
                      >
                        {user?.isFollowing ? "Following" : user?.isFollowedBy ? "Follow Back" : "Follow"}
                      </ThemedText>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.messageButton, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}
                  onPress={handleMessage}
                  testID="button-message"
                >
                  <Feather name="message-circle" size={18} color={theme.text} />
                </Pressable>
                <Pressable
                  style={[styles.giftButton, { backgroundColor: "#FFD700" }]}
                  onPress={() => setGiftSheetVisible(true)}
                  testID="button-gift"
                >
                  <Feather name="gift" size={18} color="#000" />
                </Pressable>
              </>
            )}
          </View>
        )}

        {!isOwnProfile && mutuals && mutuals.count > 0 ? (
          <View style={styles.mutualRow}>
            <View style={styles.mutualAvatars}>
              {mutuals.users.slice(0, 3).map((mutual, index) => (
                <View 
                  key={mutual.id} 
                  style={[
                    styles.mutualAvatar, 
                    { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index }
                  ]}
                >
                  <Avatar uri={mutual.avatarUrl} size={24} />
                </View>
              ))}
            </View>
            <ThemedText style={[styles.mutualText, { color: theme.textSecondary }]} numberOfLines={2}>
              {getMutualFollowersText()}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {stories && stories.length > 0 ? (
        <View style={[styles.storiesSection, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Stories</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContent}
          >
            {stories.map((story, index) => (
              <Pressable
                key={story.id}
                style={styles.storyItem}
                onPress={() => {
                  // Build list of all users with stories for Instagram-like swiping
                  const allUsers: { userId: string; username: string; displayName?: string; avatarUrl?: string; stories: Story[] }[] = [];
                  
                  // Add this user's stories first (so they appear first when swiping)
                  if (userId && stories.length > 0) {
                    allUsers.push({
                      userId: userId,
                      username: user?.username || '',
                      displayName: user?.displayName,
                      avatarUrl: user?.avatarUrl || undefined,
                      stories: stories,
                    });
                  }
                  
                  // Add current user's stories (your own stories)
                  if (storiesFeed?.yourStories && storiesFeed.yourStories.length > 0 && currentUser && currentUser.id !== userId) {
                    allUsers.push({
                      userId: currentUser.id,
                      username: currentUser.username,
                      displayName: currentUser.displayName,
                      avatarUrl: currentUser.avatarUrl || undefined,
                      stories: storiesFeed.yourStories,
                    });
                  }
                  
                  // Add all following users' stories (except the current profile user)
                  if (storiesFeed?.followingStories) {
                    storiesFeed.followingStories.forEach((item) => {
                      if (item.user && item.stories.length > 0 && item.user.id !== userId) {
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
                      userId: userId || '',
                      username: user?.username || '',
                      displayName: user?.displayName,
                      avatarUrl: user?.avatarUrl,
                      stories: stories,
                    }],
                    initialUserIndex: 0,
                    initialStoryIndex: index,
                  });
                }}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark, '#F59E0B']}
                  style={styles.storyRing}
                >
                  <Image
                    source={{ uri: story.thumbnailUrl || story.mediaUrl }}
                    style={styles.storyImage}
                    contentFit="cover"
                  />
                </LinearGradient>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {pinnedPosts && pinnedPosts.length > 0 ? (
        <View style={[styles.pinnedSection, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.pinnedHeader}>
            <Feather name="bookmark" size={16} color={theme.primary} />
            <ThemedText style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginLeft: Spacing.sm }]}>
              Pinned
            </ThemedText>
          </View>
          <View style={styles.pinnedGrid}>
            {pinnedPosts.slice(0, 3).map((item, index) => {
              const isVideo = item.type === "VIDEO";
              const thumbnailUri = item.thumbnailUrl || item.mediaUrl;
              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.pinnedItem,
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
            })}
          </View>
        </View>
      ) : null}

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

  if (userLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  const isGridView = activeTab === "PHOTO" || activeTab === "VIDEO";

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.md : headerHeight + Spacing.md,
          paddingBottom: insets.bottom + Spacing.xl,
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
                />
              )
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={
          isGridView
            ? () => <View style={{ height: GRID_GAP }} />
            : () => <View style={{ height: Spacing.lg }} />
        }
      />
      <ReportModal
        isVisible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        reportType="user"
        targetId={userId}
      />
      <ImageViewerModal
        isVisible={imageViewerVisible}
        imageUrl={viewerImageUrl}
        title={viewerImageTitle}
        onClose={() => setImageViewerVisible(false)}
      />
      <GiftSheet
        visible={giftSheetVisible}
        onClose={() => setGiftSheetVisible(false)}
        recipientId={userId}
        recipientName={user?.displayName || user?.username || "User"}
        recipientAvatar={user?.avatarUrl}
      />
    </>
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
    height: 140,
  },
  coverOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
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
    marginTop: -50,
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
  displayName: {
    textAlign: "center",
  },
  username: {
    marginTop: Spacing.xs,
    fontSize: 14,
  },
  bio: {
    marginTop: Spacing.md,
    textAlign: "center",
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
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
    gap: Spacing.md,
  },
  followButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  giftButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  blockedMessage: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
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
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
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
  },
  voiceMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  displayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  pronouns: {
    fontSize: 14,
    fontWeight: "400",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
    alignItems: "center",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
  },
  infoLink: {
    fontSize: 13,
    fontWeight: "500",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityText: {
    fontSize: 13,
  },
  mutualRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  mutualAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  mutualAvatar: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  mutualText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  storiesSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  storiesContent: {
    gap: Spacing.md,
  },
  storyItem: {
    alignItems: "center",
  },
  storyRing: {
    padding: 3,
    borderRadius: 36,
  },
  storyImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#FFF",
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
  },
  pinnedItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginBottom: GRID_GAP,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  pinnedBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
