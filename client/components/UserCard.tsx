import React from "react";
import { View, StyleSheet, Pressable } from "react-native";

import { Avatar } from "@/components/Avatar";
import { UserBadge } from "@/components/UserBadge";
import VerifiedBadge from "@/components/VerifiedBadge";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface UserCardProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    netWorth: number;
    influenceScore: number;
    isVerified?: boolean;
  };
  onPress: () => void;
}

export function UserCard({ user, onPress }: UserCardProps) {
  const { theme } = useTheme();

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
      testID={`user-card-${user.id}`}
    >
      <Avatar uri={user.avatarUrl} size={50} />
      
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.displayName}>{user.displayName}</ThemedText>
          {user.isVerified ? <VerifiedBadge size={14} /> : null}
        </View>
        <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
          @{user.username}
        </ThemedText>
        {user.bio ? (
          <ThemedText
            style={[styles.bio, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {user.bio}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.badges}>
        <UserBadge type="networth" value={user.netWorth} compact />
        <UserBadge type="influence" value={user.influenceScore} compact />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  displayName: {
    fontWeight: "600",
  },
  username: {
    fontSize: Typography.small.fontSize,
  },
  bio: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.xs,
  },
  badges: {
    gap: Spacing.xs,
  },
});
