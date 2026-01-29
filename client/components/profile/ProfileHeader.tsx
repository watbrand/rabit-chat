import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ImageBackground,
  Linking,
  Share,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { UserBadge } from "@/components/UserBadge";
import { ThemedText } from "@/components/ThemedText";
import { GlassButton, GlassIconButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverUrl: string | null;
    category: string | null;
    location: string | null;
    linkUrl: string | null;
    netWorth: number;
    influenceScore: number;
    verified: boolean;
    createdAt: string;
    counts: {
      posts: number;
      followers: number;
      following: number;
      totalLikes: number;
    };
    relationship: {
      isFollowing: boolean;
      isBlocked: boolean;
      canMessage: boolean;
    };
    privacy: {
      isPrivate: boolean;
      viewerCanSeeContent: boolean;
    };
  };
  isOwner: boolean;
  onFollow?: () => void;
  onMessage?: () => void;
  onEditProfile?: () => void;
  onSettings?: () => void;
  onCreatorTools?: () => void;
  onRequestVerification?: () => void;
  isFollowPending?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function getCategoryLabel(category: string | null): string {
  switch (category) {
    case "CREATOR": return "Creator";
    case "BUSINESS": return "Business";
    case "PERSONAL": return "Personal";
    default: return "";
  }
}

export function ProfileHeader({
  profile,
  isOwner,
  onFollow,
  onMessage,
  onEditProfile,
  onSettings,
  onCreatorTools,
  onRequestVerification,
  isFollowPending,
}: ProfileHeaderProps) {
  const { theme, isDark } = useTheme();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${profile.displayName || profile.username}'s profile on RabitChat!`,
        url: `https://rabitchat.app/@${profile.username}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleLinkPress = async () => {
    if (profile.linkUrl) {
      const url = profile.linkUrl.startsWith("http")
        ? profile.linkUrl
        : `https://${profile.linkUrl}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert("Cannot open link");
      }
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={
          profile.coverUrl
            ? { uri: profile.coverUrl }
            : undefined
        }
        style={[
          styles.coverImage,
          !profile.coverUrl && { backgroundColor: isDark ? theme.primaryDark : theme.primary },
        ]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={
            isDark
              ? ["transparent", "rgba(10, 10, 15, 0.8)", theme.backgroundRoot]
              : ["transparent", "rgba(255,255,255,0.6)", theme.backgroundRoot]
          }
          locations={[0, 0.6, 1]}
          style={styles.coverGradient}
        />
        {isOwner && (
          <Pressable
            style={[styles.coverEditButton, { backgroundColor: theme.glassBackground }]}
            onPress={onEditProfile}
            testID="button-edit-cover"
          >
            <Feather name="camera" size={16} color={theme.text} />
          </Pressable>
        )}
      </ImageBackground>

      <View style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <Avatar uri={profile.avatarUrl} size={100} />
          {profile.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoSection}>
        <ThemedText type="h3" style={styles.displayName}>
          {profile.displayName || profile.username}
        </ThemedText>
        <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
          @{profile.username}
        </ThemedText>

        {profile.category ? (
          <View style={[styles.categoryBadge, { backgroundColor: theme.glassBackground }]}>
            <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
              {getCategoryLabel(profile.category)}
            </ThemedText>
          </View>
        ) : null}

        {profile.bio ? (
          <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>
            {profile.bio}
          </ThemedText>
        ) : null}

        <View style={styles.metaRow}>
          {profile.location ? (
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {profile.location}
              </ThemedText>
            </View>
          ) : null}
          {profile.linkUrl ? (
            <Pressable style={styles.metaItem} onPress={handleLinkPress}>
              <Feather name="link" size={14} color={theme.primary} />
              <ThemedText
                style={[styles.metaText, { color: theme.primary }]}
                numberOfLines={1}
              >
                {profile.linkUrl.replace(/^https?:\/\//, "")}
              </ThemedText>
            </Pressable>
          ) : null}
          <View style={styles.metaItem}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
              Joined {formatDate(profile.createdAt)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.badgesContainer}>
          <UserBadge type="networth" value={profile.netWorth} />
          <UserBadge type="influence" value={profile.influenceScore} />
        </View>
      </View>

      {profile.relationship.isBlocked ? (
        <View style={[styles.blockedNotice, { backgroundColor: `${theme.error}20` }]}>
          <Feather name="alert-circle" size={16} color={theme.error} />
          <ThemedText style={{ color: theme.error, marginLeft: Spacing.sm }}>
            You have blocked this user
          </ThemedText>
        </View>
      ) : isOwner ? (
        <View style={styles.ownerActions}>
          <GlassButton
            title="Edit Profile"
            icon="edit-2"
            variant="primary"
            size="md"
            onPress={onEditProfile || (() => {})}
            testID="button-edit-profile"
          />
          <GlassButton
            title="Creator Tools"
            icon="zap"
            variant="outline"
            size="md"
            onPress={onCreatorTools || (() => {})}
            testID="button-creator-tools"
          />
          <GlassIconButton
            icon="settings"
            variant="ghost"
            size="md"
            onPress={onSettings || (() => {})}
            testID="button-settings"
          />
        </View>
      ) : (
        <View style={styles.visitorActions}>
          <GlassButton
            title={
              profile.relationship.isFollowing
                ? "Following"
                : (profile as any).relationship?.isFollowedBy
                ? "Follow Back"
                : "Follow"
            }
            variant={profile.relationship.isFollowing ? "secondary" : "primary"}
            size="md"
            loading={isFollowPending}
            onPress={() => onFollow?.()}
            testID="button-follow"
            style={{ minWidth: 100 }}
          />
          {profile.relationship.canMessage ? (
            <GlassIconButton
              icon="message-circle"
              variant="ghost"
              size="md"
              onPress={onMessage || (() => {})}
              testID="button-message"
            />
          ) : null}
          <GlassIconButton
            icon="share"
            variant="ghost"
            size="md"
            onPress={handleShare}
            testID="button-share"
          />
        </View>
      )}

      <View style={styles.statsRow}>
        <Pressable style={styles.statItem}>
          <ThemedText type="h4">{formatCount(profile.counts.posts)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Posts
          </ThemedText>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <Pressable style={styles.statItem}>
          <ThemedText type="h4">{formatCount(profile.counts.followers)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Followers
          </ThemedText>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <Pressable style={styles.statItem}>
          <ThemedText type="h4">{formatCount(profile.counts.following)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Following
          </ThemedText>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <Pressable style={styles.statItem}>
          <ThemedText type="h4">{formatCount(profile.counts.totalLikes)}</ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Likes
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.lg,
  },
  coverImage: {
    height: 180,
    width: "100%",
  },
  coverGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  coverEditButton: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginTop: -50,
  },
  avatarWrapper: {
    position: "relative",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  infoSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  displayName: {
    textAlign: "center",
  },
  username: {
    marginTop: Spacing.xs,
  },
  categoryBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bio: {
    marginTop: Spacing.md,
    textAlign: "center",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 13,
  },
  badgesContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  blockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  ownerActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  visitorActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  followButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.full,
    minWidth: 100,
    alignItems: "center",
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
});
