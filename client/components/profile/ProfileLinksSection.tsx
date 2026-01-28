import React from "react";
import { View, StyleSheet, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface UserLink {
  id: string;
  title: string;
  url: string;
  iconType: string;
  clicks: number;
  isActive: boolean;
}

interface ProfileLinksSectionProps {
  links: UserLink[];
  isOwner?: boolean;
  onEditLinks?: () => void;
}

const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  LINK: "link",
  WEBSITE: "globe",
  INSTAGRAM: "instagram",
  TWITTER: "twitter",
  YOUTUBE: "youtube",
  TIKTOK: "music",
  LINKEDIN: "linkedin",
  GITHUB: "github",
  DISCORD: "message-circle",
  TWITCH: "tv",
  SPOTIFY: "headphones",
  AMAZON: "shopping-bag",
  SHOP: "shopping-cart",
  OTHER: "external-link",
};

export function ProfileLinksSection({ links, isOwner, onEditLinks }: ProfileLinksSectionProps) {
  const { theme } = useTheme();

  const handleLinkPress = async (link: UserLink) => {
    try {
      await apiRequest("POST", `/api/links/${link.id}/click`);
    } catch (error) {
      // Click tracking failed - continue to open link anyway
    }
    Linking.openURL(link.url);
  };

  if (links.length === 0) {
    if (isOwner) {
      return (
        <Pressable 
          style={[styles.addLinkButton, { borderColor: theme.glassBorder, backgroundColor: theme.glassBackground }]}
          onPress={onEditLinks}
          testID="button-add-links"
        >
          <Feather name="plus" size={16} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, marginLeft: Spacing.xs }}>
            Add links
          </ThemedText>
        </Pressable>
      );
    }
    return null;
  }

  return (
    <View style={styles.container}>
      {links.map((link) => (
        <Pressable
          key={link.id}
          style={[styles.linkItem, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
          onPress={() => handleLinkPress(link)}
          testID={`link-${link.id}`}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}20` }]}>
            <Feather 
              name={ICON_MAP[link.iconType] || "link"} 
              size={16} 
              color={theme.primary} 
            />
          </View>
          <ThemedText style={[styles.linkTitle, { color: theme.text }]} numberOfLines={1}>
            {link.title}
          </ThemedText>
          <Feather name="chevron-right" size={16} color={theme.textSecondary} />
        </Pressable>
      ))}
      {isOwner ? (
        <Pressable 
          style={[styles.editButton, { borderColor: theme.glassBorder }]}
          onPress={onEditLinks}
          testID="button-edit-links"
        >
          <Feather name="edit-2" size={14} color={theme.textSecondary} />
          <ThemedText style={{ color: theme.textSecondary, marginLeft: Spacing.xs, fontSize: 13 }}>
            Edit links
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  linkTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  addLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.xs,
  },
});