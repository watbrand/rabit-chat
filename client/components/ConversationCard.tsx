import React, { memo, useCallback } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { getQueryFn } from "@/lib/query-client";

interface ConversationCardProps {
  conversation: {
    id: string;
    participant1: {
      id: string;
      displayName: string;
      avatarUrl?: string | null;
      isVerified?: boolean;
    };
    participant2: {
      id: string;
      displayName: string;
      avatarUrl?: string | null;
      isVerified?: boolean;
    };
    lastMessage?: {
      content: string;
      createdAt: string;
    };
    lastMessageAt: string;
  };
  currentUserId: string;
  onPress: () => void;
  onAvatarPress?: (userId: string) => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export const ConversationCard = memo(function ConversationCard({
  conversation,
  currentUserId,
  onPress,
  onAvatarPress,
}: ConversationCardProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const otherUser =
    conversation.participant1.id === currentUserId
      ? conversation.participant2
      : conversation.participant1;

  const handleAvatarPress = useCallback(() => {
    if (onAvatarPress) {
      onAvatarPress(otherUser.id);
    }
  }, [onAvatarPress, otherUser.id]);

  const handlePressIn = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: [`/api/conversations/${conversation.id}/messages`],
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 30000,
    });
  }, [queryClient, conversation.id]);

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: theme.glassBackground,
          borderColor: theme.glassBorder,
        },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      testID={`conversation-card-${conversation.id}`}
    >
      <Pressable onPress={handleAvatarPress} testID={`conversation-avatar-${conversation.id}`}>
        <Avatar uri={otherUser.avatarUrl} size={50} />
      </Pressable>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.name} numberOfLines={1}>
              {otherUser.displayName}
            </ThemedText>
            {otherUser.isVerified ? <VerifiedBadge size={14} /> : null}
          </View>
          <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
            {formatTimeAgo(conversation.lastMessageAt)}
          </ThemedText>
        </View>
        <ThemedText
          style={[styles.preview, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {conversation.lastMessage?.content || "Start a conversation"}
        </ThemedText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  name: {
    flex: 1,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.semiBold || "System",
      },
      android: {
        fontFamily: Fonts?.semiBold,
        fontWeight: "600" as const,
      },
      default: {
        fontWeight: "600" as const,
      },
    }),
  },
  time: {
    fontSize: Typography.small.fontSize,
    marginLeft: Spacing.sm,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.regular || "System",
      },
      android: {
        fontFamily: Fonts?.regular,
      },
      default: {},
    }),
  },
  preview: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.xs,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.regular || "System",
      },
      android: {
        fontFamily: Fonts?.regular,
      },
      default: {},
    }),
  },
});
