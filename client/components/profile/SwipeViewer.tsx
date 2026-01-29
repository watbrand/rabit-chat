import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SwipePost {
  id: string;
  type: string;
  content: string | null;
  caption: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationMs: number | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  createdAt: string;
  hasLiked: boolean;
  hasSaved: boolean;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    verified: boolean;
  };
}

interface SwipeViewerProps {
  posts: SwipePost[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onLike: (postId: string, hasLiked: boolean) => void;
  onSave: (postId: string, hasSaved: boolean) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
  onDownload?: (imageUrl: string) => void;
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function SwipeViewer({
  posts,
  isLoading,
  hasMore,
  onLoadMore,
  onLike,
  onSave,
  onComment,
  onShare,
  onClose,
  onUserPress,
  onDownload,
}: SwipeViewerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const renderMediaContent = (item: SwipePost) => {
    if (item.type === "VOICE") {
      return (
        <View style={[styles.voiceContent, { backgroundColor: theme.backgroundSecondary }]}>
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.voiceThumbnail}
              resizeMode="cover"
              blurRadius={20}
            />
          ) : null}
          <View style={styles.voiceOverlay}>
            <View style={[styles.voiceIcon, { backgroundColor: theme.glassBackground }]}>
              <Feather name="mic" size={48} color={theme.primary} />
            </View>
            <View style={styles.audioPlayerWrapper}>
              <AudioPlayer uri={item.mediaUrl || ""} durationMs={item.durationMs} />
            </View>
          </View>
        </View>
      );
    }

    if (item.mediaUrl || item.thumbnailUrl) {
      return (
        <Image
          source={{ uri: item.mediaUrl || item.thumbnailUrl || "" }}
          style={styles.media}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={[styles.textContent, { backgroundColor: theme.backgroundSecondary }]}>
        <ThemedText type="h3" style={styles.textPost}>
          {item.content || item.caption}
        </ThemedText>
      </View>
    );
  };

  const renderItem = ({ item }: { item: SwipePost }) => (
    <View style={[styles.card, { height: height - insets.top - insets.bottom }]}>
      {renderMediaContent(item)}

      <View style={styles.contentOverlay}>
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <Pressable
            style={[styles.closeButton, { backgroundColor: theme.glassBackground }]}
            onPress={onClose}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.bottomSection}>
          <Pressable 
            style={styles.authorInfo}
            onPress={() => {
              if (onUserPress && item.author?.id) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onUserPress(item.author.id);
              }
            }}
          >
            <Avatar uri={item.author?.avatarUrl} size={44} />
            <View style={styles.authorText}>
              <View style={styles.authorNameRow}>
                <ThemedText style={styles.authorName}>
                  {item.author?.displayName || item.author?.username || 'Unknown'}
                </ThemedText>
                {item.author?.verified && (
                  <Feather name="check-circle" size={14} color={theme.primary} />
                )}
              </View>
              <ThemedText style={styles.authorUsername}>@{item.author?.username || 'unknown'}</ThemedText>
            </View>
          </Pressable>

          {(item.caption || item.content) && item.mediaUrl ? (
            <ThemedText style={styles.caption} numberOfLines={3}>
              {item.caption || item.content}
            </ThemedText>
          ) : null}
        </View>

        <View style={[styles.actionsColumn, { bottom: 100 + insets.bottom }]}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onLike(item.id, item.hasLiked);
            }}
          >
            <Feather
              name={item.hasLiked ? "heart" : "heart"}
              size={28}
              color={item.hasLiked ? theme.error : "#FFFFFF"}
            />
            <ThemedText style={styles.actionCount}>{formatCount(item.likesCount)}</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => onComment(item.id)}>
            <Feather name="message-circle" size={28} color="#FFFFFF" />
            <ThemedText style={styles.actionCount}>{formatCount(item.commentsCount)}</ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSave(item.id, item.hasSaved);
            }}
          >
            <Feather
              name={item.hasSaved ? "bookmark" : "bookmark"}
              size={28}
              color={item.hasSaved ? theme.gold : "#FFFFFF"}
            />
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => onShare(item.id)}>
            <Feather name="share" size={28} color="#FFFFFF" />
            <ThemedText style={styles.actionCount}>{formatCount(item.sharesCount)}</ThemedText>
          </Pressable>

          {item.mediaUrl && onDownload ? (
            <Pressable 
              style={styles.actionButton} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDownload(item.mediaUrl!);
              }}
            >
              <Feather name="download" size={28} color="#FFFFFF" />
              <ThemedText style={styles.actionCount}>Save</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>

      {item.type === "VIDEO" && (
        <View style={styles.playButton}>
          <Feather name="play" size={48} color="#FFFFFF" />
        </View>
      )}

      {item.type === "VOICE" && (
        <View style={styles.playButton}>
          <Feather name="volume-2" size={48} color="#FFFFFF" />
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={[styles.emptyContainer, { height }]}>
          <LoadingIndicator size="large" />
        </View>
      );
    }
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Feather name="inbox" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          No posts to show
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: "#000000" }]}>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        snapToInterval={height - insets.top - insets.bottom}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    width: "100%",
    position: "relative",
  },
  media: {
    width: "100%",
    height: "100%",
  },
  textContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  textPost: {
    textAlign: "center",
    color: "#FFFFFF",
    lineHeight: 36,
  },
  contentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 70,
    paddingHorizontal: Spacing.lg,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  authorText: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  authorName: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  authorUsername: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  caption: {
    color: "#FFFFFF",
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  actionsColumn: {
    position: "absolute",
    right: Spacing.lg,
    alignItems: "center",
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  voiceContent: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  voiceThumbnail: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  voiceOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.xl,
  },
  voiceIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  audioPlayerWrapper: {
    width: "100%",
    maxWidth: 320,
  },
});
