import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  FadeInDown,
} from "react-native-reanimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { TeaMeter } from "./TeaMeter";
import { ReactionButtons } from "./ReactionButtons";
import { AudioPlayer } from "@/components/AudioPlayer";
import { type AnonGossipPost, type ReactionType } from "./AnonGossipTypes";

interface GossipCardProps {
  post: AnonGossipPost;
  onReact: (postId: string, type: ReactionType) => void;
  onReply: (postId: string) => void;
  onReport: (postId: string) => void;
  onViewReplies?: (postId: string) => void;
  onDM?: (postId: string) => void;
  onShare?: (postId: string) => void;
  myReactions?: string[];
  index?: number;
}

type TrendingBadge = "breaking" | "hot" | "verified" | null;

function getTrendingBadge(post: AnonGossipPost): TrendingBadge {
  const createdAt = new Date(post.createdAt);
  const now = new Date();
  const ageInHours = (now.getTime() - createdAt.getTime()) / 3600000;
  
  const totalReactions = post.fireCount + post.mindblownCount + post.laughCount + post.skullCount + post.eyesCount;
  const engagementVelocity = ageInHours > 0 ? totalReactions / ageInHours : totalReactions;
  
  if (ageInHours < 2 && engagementVelocity > 5) {
    return "breaking";
  }
  
  if (post.teaMeter >= 80 || (ageInHours < 12 && engagementVelocity > 3)) {
    return "hot";
  }
  
  if (post.teaMeter >= 95) {
    return "verified";
  }
  
  return null;
}

function TrendingBadgeComponent({ badge }: { badge: TrendingBadge }) {
  const pulseScale = useSharedValue(1);
  
  React.useEffect(() => {
    if (badge === "breaking") {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 2 }),
          withSpring(1, { damping: 2 })
        ),
        -1,
        true
      );
    }
  }, [badge, pulseScale]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  
  if (!badge) return null;
  
  const configs = {
    breaking: { icon: "zap", color: "#FF4500", bg: "#FF450020", label: "Breaking" },
    hot: { icon: "trending-up", color: "#FF6B35", bg: "#FF6B3520", label: "Hot" },
    verified: { icon: "check-circle", color: "#10B981", bg: "#10B98120", label: "Verified Tea" },
  };
  
  const config = configs[badge];
  
  return (
    <Animated.View style={[styles.trendingBadge, { backgroundColor: config.bg }, animatedStyle]}>
      <Feather name={config.icon as any} size={10} color={config.color} />
      <ThemedText style={[styles.trendingBadgeText, { color: config.color }]}>
        {config.label}
      </ThemedText>
    </Animated.View>
  );
}

export function GossipCard({
  post,
  onReact,
  onReply,
  onReport,
  onViewReplies,
  onDM,
  onShare,
  myReactions = [],
  index = 0,
}: GossipCardProps) {
  const { theme } = useTheme();
  const trendingBadge = getTrendingBadge(post);
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };
  
  const getWhisperTimeRemaining = () => {
    if (!post.whisperExpiresAt) return null;
    const expires = new Date(post.whisperExpiresAt);
    const now = new Date();
    const hours = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 3600000));
    if (hours <= 0) return "Expiring soon";
    return `${hours}h left`;
  };
  
  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  const getBorderColor = () => {
    if (post.isWhisper) return "#6366F1";
    if (trendingBadge === "breaking") return "#FF4500";
    if (trendingBadge === "hot") return "#FF6B35";
    return theme.glassBorder;
  };
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[
        styles.card,
        {
          backgroundColor: theme.glassBackground,
          borderColor: getBorderColor(),
          shadowColor: trendingBadge === "breaking" ? "#FF4500" : theme.primary,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.anonymousAvatar,
            { backgroundColor: post.isWhisper ? "#6366F120" : theme.backgroundTertiary }
          ]}>
            {post.isWhisper ? (
              <Feather name="eye-off" size={18} color="#6366F1" />
            ) : (
              <Feather name="user" size={18} color={theme.textSecondary} />
            )}
          </View>
          <View style={styles.metaContainer}>
            <View style={styles.nameRow}>
              <ThemedText style={[
                styles.anonymousLabel,
                { color: post.isWhisper ? "#6366F1" : theme.textSecondary }
              ]}>
                {post.isWhisper ? "Whisper" : "Anonymous"}
              </ThemedText>
              {post.isWhisper ? (
                <View style={styles.whisperBadge}>
                  <ThemedText style={styles.whisperTimeText}>{getWhisperTimeRemaining()}</ThemedText>
                </View>
              ) : null}
              <TrendingBadgeComponent badge={trendingBadge} />
            </View>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={10} color={theme.textTertiary} />
              <ThemedText style={[styles.locationText, { color: theme.textTertiary }]} numberOfLines={1}>
                {post.locationDisplay || post.countryCode || "Unknown"}
              </ThemedText>
              <ThemedText style={[styles.timeText, { color: theme.textTertiary }]}>
                {formatTimeAgo(post.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TeaMeter score={post.teaMeter} size="small" />
        </View>
      </View>
      
      {post.content ? (
        <ThemedText style={styles.content}>{post.content}</ThemedText>
      ) : null}
      
      {post.type === "VOICE" && post.mediaUrl ? (
        <View style={styles.audioPlayer}>
          <AudioPlayer
            uri={post.mediaUrl}
            durationMs={post.durationMs}
            compact
            postId={`anon-gossip-${post.id}`}
            source="OTHER"
          />
        </View>
      ) : null}
      
      <View style={styles.reactions}>
        <ReactionButtons
          reactions={{
            fireCount: post.fireCount,
            mindblownCount: post.mindblownCount,
            laughCount: post.laughCount,
            skullCount: post.skullCount,
            eyesCount: post.eyesCount,
          }}
          myReactions={myReactions}
          onReact={(type) => onReact(post.id, type)}
          compact
        />
      </View>
      
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              Haptics.selectionAsync();
              if (onViewReplies) onViewReplies(post.id);
              else onReply(post.id);
            }}
          >
            <Feather name="message-circle" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
              {post.replyCount > 0 ? post.replyCount : "Reply"}
            </ThemedText>
          </Pressable>
          
          {onDM ? (
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                Haptics.selectionAsync();
                onDM(post.id);
              }}
            >
              <Feather name="send" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
                DM
              </ThemedText>
            </Pressable>
          ) : null}

          {onShare ? (
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                Haptics.selectionAsync();
                onShare(post.id);
              }}
            >
              <Feather name="share-2" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
                Share
              </ThemedText>
            </Pressable>
          ) : null}
          
          <View style={styles.viewCount}>
            <Feather name="eye" size={12} color={theme.textTertiary} />
            <ThemedText style={[styles.viewCountText, { color: theme.textTertiary }]}>
              {formatViews(post.viewCount)}
            </ThemedText>
          </View>
        </View>
        
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onReport(post.id);
          }}
        >
          <Feather name="flag" size={14} color={theme.textTertiary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerRight: {
    marginLeft: Spacing.sm,
  },
  anonymousAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  metaContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  anonymousLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  whisperBadge: {
    backgroundColor: "#6366F120",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  whisperTimeText: {
    fontSize: 10,
    color: "#6366F1",
    fontWeight: "500",
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  trendingBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    flex: 1,
  },
  timeText: {
    fontSize: 11,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  audioPlayer: {
    marginBottom: Spacing.sm,
  },
  reactions: {
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  viewCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCountText: {
    fontSize: 11,
  },
});
