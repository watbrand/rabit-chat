import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Platform,
  Share,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";

interface PostOptionsMenuProps {
  post: {
    id: string;
    content: string;
    type?: string;
    mediaUrl?: string | null;
    authorId: string;
    isArchived?: boolean;
    isPinned?: boolean;
    commentsEnabled?: boolean;
    hasSaved?: boolean;
    author: {
      id: string;
      username: string;
    };
  };
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onReport?: () => void;
}

interface MenuOption {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

export function PostOptionsMenu({
  post,
  visible,
  onClose,
  onEdit,
  onReport,
}: PostOptionsMenuProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const isOwnPost = user?.id === post.authorId;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/saved"] });
      onClose();
    },
  });

  const hideMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/hide`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      onClose();
    },
  });

  const notInterestedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/not-interested`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      onClose();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onClose();
    },
  });

  const pinMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/posts/${post.id}/pin`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onClose();
    },
  });

  const toggleCommentsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/posts/${post.id}/comments`, {
        enabled: !post.commentsEnabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      onClose();
    },
  });

  const handleCopyLink = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const baseUrl = getApiUrl().replace("/api", "");
    const postUrl = `${baseUrl}/post/${post.id}`;
    await Clipboard.setStringAsync(postUrl);
    Alert.alert("Link Copied", "Post link copied to clipboard");
    onClose();
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      const baseUrl = getApiUrl().replace("/api", "");
      const postUrl = `${baseUrl}/post/${post.id}`;
      await Share.share({
        message: post.content || "Check out this post!",
        url: postUrl,
      });
      onClose();
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleSave = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    saveMutation.mutate();
  };

  const handleHide = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    hideMutation.mutate();
  };

  const handleNotInterested = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    notInterestedMutation.mutate();
  };

  const handleArchive = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    archiveMutation.mutate();
  };

  const handlePin = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    pinMutation.mutate();
  };

  const handleToggleComments = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleCommentsMutation.mutate();
  };

  const handleEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to permanently delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            deleteMutation.mutate();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClose();
    if (onReport) {
      onReport();
    }
  };

  const muteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/privacy/muted/${post.authorId}`, {
        mutePosts: true,
        muteStories: false,
        muteMessages: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      Alert.alert("Muted", `You won't see posts from @${post.author?.username || 'this user'} in your feed`);
      onClose();
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/users/${post.authorId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      Alert.alert("Unfollowed", `You are no longer following @${post.author?.username || 'this user'}`);
      onClose();
    },
  });

  const handleMute = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    muteMutation.mutate();
  };

  const handleUnfollow = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Unfollow User",
      `Are you sure you want to unfollow @${post.author?.username || 'this user'}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unfollow",
          style: "destructive",
          onPress: () => unfollowMutation.mutate(),
        },
      ]
    );
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadMedia = async () => {
    if (!post.mediaUrl) {
      Alert.alert("Error", "No media to download");
      return;
    }

    if (Platform.OS === "web") {
      window.open(post.mediaUrl, "_blank");
      onClose();
      return;
    }

    try {
      setIsDownloading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to save media to your device"
        );
        setIsDownloading(false);
        return;
      }

      const extension = post.type === "VIDEO" ? "mp4" : post.type === "VOICE" ? "mp3" : "jpg";
      const filename = `rabitchat_${post.id}_${Date.now()}.${extension}`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(post.mediaUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error("Download failed");
      }

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      await MediaLibrary.createAlbumAsync("RabitChat", asset, false);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Media saved to your device");
      onClose();
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Failed to save media");
    } finally {
      setIsDownloading(false);
    }
  };

  const hasMedia = post.mediaUrl && (post.type === "PHOTO" || post.type === "VIDEO" || post.type === "VOICE");

  const handleBoostPost = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClose();
    navigation.navigate("BoostPost", {
      postId: post.id,
      postContent: post.content,
      postMediaUrl: post.mediaUrl,
      postType: post.type,
    });
  };

  const ownPostOptions: MenuOption[] = [
    {
      icon: "zap",
      label: "Boost Post",
      onPress: handleBoostPost,
    },
    {
      icon: post.isPinned ? "star" : "star",
      label: post.isPinned ? "Unpin from Profile" : "Pin to Profile",
      onPress: handlePin,
    },
    {
      icon: "edit-2",
      label: "Edit Post",
      onPress: handleEdit,
      hidden: !onEdit,
    },
    {
      icon: post.isArchived ? "eye" : "archive",
      label: post.isArchived ? "Unarchive Post" : "Archive Post",
      onPress: handleArchive,
    },
    {
      icon: post.commentsEnabled ? "message-circle" : "message-circle",
      label: post.commentsEnabled ? "Turn Off Comments" : "Turn On Comments",
      onPress: handleToggleComments,
    },
    {
      icon: "download",
      label: isDownloading ? "Saving..." : "Save to Device",
      onPress: handleDownloadMedia,
      hidden: !hasMedia,
    },
    {
      icon: "link",
      label: "Copy Link",
      onPress: handleCopyLink,
    },
    {
      icon: "share",
      label: "Share",
      onPress: handleShare,
    },
    {
      icon: "trash-2",
      label: "Delete Post",
      onPress: handleDelete,
      destructive: true,
    },
  ];

  const otherPostOptions: MenuOption[] = [
    {
      icon: post.hasSaved ? "bookmark" : "bookmark",
      label: post.hasSaved ? "Unsave Post" : "Save Post",
      onPress: handleSave,
    },
    {
      icon: "download",
      label: isDownloading ? "Saving..." : "Save to Device",
      onPress: handleDownloadMedia,
      hidden: !hasMedia,
    },
    {
      icon: "link",
      label: "Copy Link",
      onPress: handleCopyLink,
    },
    {
      icon: "share",
      label: "Share",
      onPress: handleShare,
    },
    {
      icon: "eye-off",
      label: "Hide Post",
      onPress: handleHide,
    },
    {
      icon: "thumbs-down",
      label: "Not Interested",
      onPress: handleNotInterested,
    },
    {
      icon: "volume-x",
      label: `Mute @${post.author?.username || 'user'}`,
      onPress: handleMute,
    },
    {
      icon: "user-minus",
      label: `Unfollow @${post.author?.username || 'user'}`,
      onPress: handleUnfollow,
    },
    {
      icon: "flag",
      label: "Report Post",
      onPress: handleReport,
      destructive: true,
    },
  ];

  const options = isOwnPost ? ownPostOptions : otherPostOptions;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <BlurView
            intensity={isDark ? 80 : 60}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.menu,
              { backgroundColor: isDark ? "rgba(30, 30, 35, 0.9)" : "rgba(255, 255, 255, 0.95)" },
            ]}
          >
            <View style={styles.handle} />
            <ThemedText type="headline" style={styles.title}>
              Post Options
            </ThemedText>

            {options
              .filter((opt) => !opt.hidden)
              .map((option, index) => (
                <Pressable
                  key={option.label}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && { backgroundColor: theme.backgroundSecondary },
                    index === options.filter((o) => !o.hidden).length - 1 && styles.lastOption,
                  ]}
                  onPress={option.onPress}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: option.destructive ? `${theme.error}15` : `${theme.primary}15` },
                    ]}
                  >
                    <Feather
                      name={option.icon}
                      size={20}
                      color={option.destructive ? theme.error : theme.primary}
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.optionText,
                      option.destructive && { color: theme.error },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  <Feather name="chevron-right" size={18} color={theme.textTertiary} />
                </Pressable>
              ))}

            <Pressable
              style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={onClose}
            >
              <ThemedText weight="semiBold" style={{ color: theme.primary }}>
                Cancel
              </ThemedText>
            </Pressable>
          </BlurView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  menu: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(128, 128, 128, 0.4)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  cancelButton: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
