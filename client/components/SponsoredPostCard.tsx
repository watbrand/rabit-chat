import React, { memo } from "react";
import { View, StyleSheet, Pressable, Image, Platform, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Haptics from "@/lib/safeHaptics";
import * as WebBrowser from "expo-web-browser";
import { useMutation } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";

interface SponsoredPostData {
  id: string;
  adId: string;
  adGroupId?: string;
  campaignId?: string;
  advertiserId?: string;
  format?: string;
  headline?: string;
  description?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  callToAction?: string;
  destinationUrl?: string;
  type?: string;
}

interface SponsoredPostCardProps {
  post: SponsoredPostData;
}

const CTA_LABELS: Record<string, { label: string; icon: string }> = {
  VISIT_PROFILE: { label: "Visit Profile", icon: "user" },
  VIEW_POST: { label: "View Post", icon: "file-text" },
  LEARN_MORE: { label: "Learn More", icon: "info" },
  SHOP_NOW: { label: "Shop Now", icon: "shopping-bag" },
  SIGN_UP: { label: "Sign Up", icon: "user-plus" },
  CONTACT: { label: "Contact", icon: "mail" },
  WATCH_MORE: { label: "Watch More", icon: "play-circle" },
  BOOK_NOW: { label: "Book Now", icon: "calendar" },
  GET_OFFER: { label: "Get Offer", icon: "gift" },
  DOWNLOAD: { label: "Download", icon: "download" },
  APPLY_NOW: { label: "Apply Now", icon: "send" },
};

export const SponsoredPostCard = memo(function SponsoredPostCard({ post }: SponsoredPostCardProps) {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const trackCtaClick = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ads/track/cta-click", {
        adId: post.adId,
        ctaType: post.callToAction,
        destinationUrl: post.destinationUrl,
        placement: "feed",
      });
    },
  });

  const handleCtaPress = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Track the click
    trackCtaClick.mutate();

    const cta = post.callToAction || "VIEW_POST";
    const destinationUrl = post.destinationUrl;

    // Handle different CTA types
    if (cta === "VISIT_PROFILE" && destinationUrl?.startsWith("rabitchat://profile/")) {
      const username = destinationUrl.replace("rabitchat://profile/", "");
      navigation.navigate("UserProfile", { username });
      return;
    }

    if (cta === "VIEW_POST" && destinationUrl?.startsWith("rabitchat://post/")) {
      const postId = destinationUrl.replace("rabitchat://post/", "");
      navigation.navigate("PostDetail", { postId });
      return;
    }

    // External URL - open in browser
    if (destinationUrl && destinationUrl.startsWith("http")) {
      try {
        await WebBrowser.openBrowserAsync(destinationUrl, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      } catch (error) {
        // Fallback to Linking
        try {
          await Linking.openURL(destinationUrl);
        } catch (e) {
          console.error("Failed to open URL:", e);
        }
      }
      return;
    }

    // Default fallback
    if (destinationUrl?.startsWith("rabitchat://post/")) {
      const postId = destinationUrl.replace("rabitchat://post/", "");
      navigation.navigate("PostDetail", { postId });
    }
  };

  const ctaConfig = CTA_LABELS[post.callToAction || "LEARN_MORE"] || CTA_LABELS.LEARN_MORE;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.backgroundSecondary : theme.backgroundRoot }]}>
      {/* Sponsored badge */}
      <View style={styles.header}>
        <View style={styles.sponsoredBadge}>
          <Feather name="zap" size={12} color={theme.primary} />
          <ThemedText style={[styles.sponsoredText, { color: theme.textSecondary }]}>
            Sponsored
          </ThemedText>
        </View>
      </View>

      {/* Media */}
      {post.mediaUrl ? (
        <Pressable onPress={handleCtaPress}>
          <Image
            source={{ uri: post.thumbnailUrl || post.mediaUrl }}
            style={styles.media}
            resizeMode="cover"
          />
          {post.type === "VIDEO" ? (
            <View style={styles.playOverlay}>
              <Feather name="play" size={32} color="#FFF" />
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {/* Content */}
      <View style={styles.content}>
        {post.headline ? (
          <ThemedText type="title3" style={styles.headline} numberOfLines={2}>
            {post.headline}
          </ThemedText>
        ) : null}
        {post.description ? (
          <ThemedText style={[styles.description, { color: theme.textSecondary }]} numberOfLines={3}>
            {post.description.replace(/^Boosted from post: [^\n]*\n/, "")}
          </ThemedText>
        ) : null}
      </View>

      {/* CTA Button */}
      <View style={styles.ctaContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleCtaPress}
        >
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Feather name={ctaConfig.icon as any} size={16} color="#FFF" />
            <ThemedText style={styles.ctaLabel}>{ctaConfig.label}</ThemedText>
            <Feather name="chevron-right" size={16} color="#FFF" />
          </LinearGradient>
        </Pressable>
        
        {/* Show destination URL preview for transparency */}
        {post.destinationUrl && post.destinationUrl.startsWith("http") ? (
          <ThemedText style={[styles.urlPreview, { color: theme.textSecondary }]} numberOfLines={1}>
            {new URL(post.destinationUrl).hostname}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginHorizontal: Spacing.md,
  },
  header: {
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  sponsoredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: BorderRadius.full,
  },
  sponsoredText: {
    fontSize: 11,
    fontWeight: "600",
  },
  media: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#1a1a1a",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  headline: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  ctaButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  ctaLabel: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  urlPreview: {
    fontSize: 11,
    textAlign: "center",
  },
});

export default SponsoredPostCard;
