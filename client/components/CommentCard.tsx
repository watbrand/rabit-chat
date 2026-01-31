import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { MentionText } from "@/components/MentionText";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface CommentCardProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
      isVerified?: boolean;
    };
  };
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString();
}

export function CommentCard({ comment }: CommentCardProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleUserPress = () => {
    if (comment.author?.username) {
      navigation.navigate("ProfilePage", { username: comment.author.username });
    }
  };

  const needsTruncation = comment.content && comment.content.length > 150;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.glassBackground,
          borderColor: theme.glassBorder,
        },
      ]}
    >
      <Pressable onPress={handleUserPress}>
        <Avatar uri={comment.author?.avatarUrl} size={36} />
      </Pressable>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={handleUserPress} style={styles.authorRow}>
            <ThemedText style={styles.displayName}>
              {comment.author?.displayName || 'Unknown'}
            </ThemedText>
            {comment.author?.isVerified ? <VerifiedBadge size={12} /> : null}
          </Pressable>
          <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
            {formatTimeAgo(comment.createdAt)}
          </ThemedText>
        </View>
        <MentionText 
          text={comment.content} 
          style={styles.text} 
          numberOfLines={isExpanded ? undefined : 3}
        />
        {needsTruncation ? (
          <Pressable 
            onPress={() => setIsExpanded(!isExpanded)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText style={[styles.seeMoreText, { color: theme.primary }]}>
              {isExpanded ? "See less" : "See more"}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  displayName: {
    fontWeight: "600",
    fontSize: Typography.small.fontSize,
  },
  time: {
    fontSize: 12,
  },
  text: {
    fontSize: Typography.small.fontSize,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
});
