import React from "react";
import { View, Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
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
  myReactions?: string[];
}

export function GossipCard({
  post,
  onReact,
  onReply,
  onReport,
  onViewReplies,
  myReactions = [],
}: GossipCardProps) {
  const { theme } = useTheme();
  
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
  
  return (
    <View style={[styles.card, { backgroundColor: theme.glassBackground, borderColor: post.isWhisper ? "#6366F1" : theme.glassBorder }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.anonymousAvatar, { backgroundColor: post.isWhisper ? "#6366F120" : theme.backgroundTertiary }]}>
            {post.isWhisper ? (
              <Feather name="eye-off" size={18} color="#6366F1" />
            ) : (
              <Feather name="user" size={18} color={theme.textSecondary} />
            )}
          </View>
          <View style={styles.metaContainer}>
            <View style={styles.nameRow}>
              <ThemedText style={[styles.anonymousLabel, { color: post.isWhisper ? "#6366F1" : theme.textSecondary }]}>
                {post.isWhisper ? "Whisper" : "Anonymous"}
              </ThemedText>
              {post.isWhisper ? (
                <View style={styles.whisperBadge}>
                  <ThemedText style={styles.whisperTimeText}>{getWhisperTimeRemaining()}</ThemedText>
                </View>
              ) : null}
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
        <TeaMeter score={post.teaMeter} size="small" />
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
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            if (onViewReplies) onViewReplies(post.id);
            else onReply(post.id);
          }}
        >
          <Feather name="message-circle" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
            {post.replyCount > 0 ? `${post.replyCount} replies` : "Reply"}
          </ThemedText>
        </Pressable>
        
        <Pressable style={styles.actionButton} onPress={() => onReport(post.id)}>
          <Feather name="flag" size={14} color={theme.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  actionText: {
    fontSize: 12,
  },
});
