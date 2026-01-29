import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  adStatus?: string; // Status of the associated ad (for showing accurate review state)
  budgetAmount: number;
  budgetSpent: number;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  createdAt: string;
  postId?: string;
  adGroups?: any[];
  adNumber?: string; // Reference code like AD-001234
  adId?: string;
}

// FIX 1: Get the effective display status considering both campaign and ad status
// Handle ALL edge cases including undefined adStatus
function getEffectiveStatus(campaign: Campaign): string {
  // PAUSED status always takes priority - user intentionally paused
  if (campaign.status === 'PAUSED') {
    return 'PAUSED';
  }
  // If ad is rejected, show rejected regardless of campaign status
  if (campaign.adStatus === 'REJECTED') {
    return 'REJECTED';
  }
  // If campaign is rejected, show rejected
  if (campaign.status === 'REJECTED') {
    return 'REJECTED';
  }
  // If ad is pending review, show that even if campaign is active
  if (campaign.adStatus === 'PENDING_REVIEW' || campaign.adStatus === 'IN_REVIEW') {
    return 'PENDING_REVIEW';
  }
  // FIX 1: If ad is approved/active, show ACTIVE (campaign status should match, but handle mismatch)
  if (campaign.adStatus === 'APPROVED' || campaign.adStatus === 'ACTIVE') {
    // If campaign isn't ACTIVE yet, it's likely an orphaned state - still show ACTIVE
    // since the backend auto-fix will sync it
    return 'ACTIVE';
  }
  // FIX 1: If adStatus is undefined but campaign is ACTIVE, trust the campaign status
  if (!campaign.adStatus && campaign.status === 'ACTIVE') {
    return 'ACTIVE';
  }
  // Otherwise use campaign status
  return campaign.status;
}

interface CampaignDetails extends Campaign {
  adGroups: any[];
  diagnostics?: any;
  callToAction?: string;
  destinationUrl?: string;
  postPreview?: {
    id: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
    user?: {
      displayName: string;
      username: string;
      profilePicUrl?: string;
    };
  };
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

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE: { bg: "#22C55E20", text: "#22C55E", label: "Live" },
  PENDING_REVIEW: { bg: "#F59E0B20", text: "#F59E0B", label: "Pending Review" },
  IN_REVIEW: { bg: "#F59E0B20", text: "#F59E0B", label: "In Review" },
  APPROVED: { bg: "#22C55E20", text: "#22C55E", label: "Approved" },
  REJECTED: { bg: "#EF444420", text: "#EF4444", label: "Rejected" },
  PAUSED: { bg: "#6B728020", text: "#6B7280", label: "Paused" },
  COMPLETED: { bg: "#3B82F620", text: "#3B82F6", label: "Completed" },
  DRAFT: { bg: "#6B728020", text: "#6B7280", label: "Draft" },
};

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatCurrency(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-ZA", { 
    day: "numeric", 
    month: "long", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function CampaignCard({ 
  campaign, 
  isExpanded, 
  onToggle 
}: { 
  campaign: Campaign; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();
  
  // Get the effective status considering both campaign and ad status
  const effectiveStatus = getEffectiveStatus(campaign);
  const statusStyle = STATUS_COLORS[effectiveStatus] || STATUS_COLORS.DRAFT;
  
  // Fetch detailed campaign info when expanded
  const { data: details, isLoading: detailsLoading } = useQuery<CampaignDetails>({
    queryKey: ["/api/ads/campaigns", campaign.id],
    enabled: isExpanded,
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/ads/campaigns/${campaign.id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads/campaigns"] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/ads/campaigns/${campaign.id}/resume`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads/campaigns"] });
    },
  });

  const isPaused = campaign.status === "PAUSED";
  const canPause = effectiveStatus === "ACTIVE";
  // Can only resume if paused AND ad is approved (not pending review or rejected)
  const adReady = campaign.adStatus === 'APPROVED' || campaign.adStatus === 'ACTIVE';
  const canResume = isPaused && adReady;
  const isLive = effectiveStatus === "ACTIVE";

  return (
    <Pressable 
      style={[
        styles.campaignCard,
        { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
        isExpanded && styles.campaignCardExpanded,
      ]}
      onPress={onToggle}
    >
      {/* Header - Always visible */}
      <View style={styles.campaignHeader}>
        <View style={styles.campaignTitleRow}>
          <View style={styles.titleContainer}>
            {isLive && (
              <View style={styles.liveDot} />
            )}
            <ThemedText style={styles.campaignName} numberOfLines={isExpanded ? undefined : 1}>
              {campaign.name.replace("Boost: ", "")}
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <ThemedText style={[styles.statusText, { color: statusStyle.text }]}>
                {statusStyle.label}
              </ThemedText>
            </View>
            <Feather 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={theme.textSecondary} 
            />
          </View>
        </View>
        <View style={styles.subHeader}>
          <ThemedText style={styles.dateRange}>
            {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
          </ThemedText>
          {campaign.adNumber && (
            <View style={styles.adNumberBadge}>
              <Feather name="hash" size={10} color="#8B5CF6" />
              <ThemedText style={styles.adNumberText}>{campaign.adNumber}</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Stats Grid - Always visible */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{formatNumber(campaign.impressions)}</ThemedText>
          <ThemedText style={styles.statLabel}>Impressions</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{formatNumber(campaign.reach)}</ThemedText>
          <ThemedText style={styles.statLabel}>Reach</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{formatNumber(campaign.clicks)}</ThemedText>
          <ThemedText style={styles.statLabel}>Clicks</ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{(campaign.ctr * 100).toFixed(2)}%</ThemedText>
          <ThemedText style={styles.statLabel}>CTR</ThemedText>
        </View>
      </View>

      {/* Budget Progress */}
      <View style={styles.budgetRow}>
        <View style={styles.budgetInfo}>
          <ThemedText style={styles.budgetLabel}>Budget Spent</ThemedText>
          <ThemedText style={styles.budgetValue}>
            {formatCurrency(campaign.budgetSpent)} / {formatCurrency(campaign.budgetAmount)}
          </ThemedText>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${Math.min((campaign.budgetSpent / campaign.budgetAmount) * 100, 100)}%` }
            ]} 
          />
        </View>
      </View>

      {/* Expanded Content */}
      {isExpanded && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(150)}
          layout={Layout.springify()}
          style={styles.expandedContent}
        >
          {detailsLoading ? (
            <View style={styles.loadingDetails}>
              <LoadingIndicator size="small" />
              <ThemedText style={styles.loadingText}>Loading details...</ThemedText>
            </View>
          ) : (
            <>
              {/* Detailed Stats */}
              <View style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>Performance Details</ThemedText>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <ThemedText style={styles.detailLabel}>Cost per Click</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {campaign.clicks > 0 ? formatCurrency(campaign.budgetSpent / campaign.clicks) : "N/A"}
                    </ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={styles.detailLabel}>Cost per 1K Impressions</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {campaign.impressions > 0 ? formatCurrency((campaign.budgetSpent / campaign.impressions) * 1000) : "N/A"}
                    </ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={styles.detailLabel}>Conversions</ThemedText>
                    <ThemedText style={styles.detailValue}>{campaign.conversions}</ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={styles.detailLabel}>Started</ThemedText>
                    <ThemedText style={styles.detailValue}>{formatFullDate(campaign.startDate)}</ThemedText>
                  </View>
                </View>
              </View>

              {/* CTA & Destination Section */}
              {details?.callToAction ? (
                <View style={styles.detailSection}>
                  <ThemedText style={styles.sectionTitle}>Call-to-Action</ThemedText>
                  <View style={[
                    styles.ctaInfoCard,
                    { backgroundColor: isDark ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.08)" }
                  ]}>
                    <View style={styles.ctaRow}>
                      <Feather 
                        name={(CTA_LABELS[details.callToAction]?.icon || "external-link") as any} 
                        size={18} 
                        color="#8B5CF6" 
                      />
                      <ThemedText style={styles.ctaLabel}>
                        {CTA_LABELS[details.callToAction]?.label || details.callToAction}
                      </ThemedText>
                    </View>
                    {details.destinationUrl ? (
                      <View style={styles.destinationRow}>
                        <Feather name="link" size={14} color={theme.textSecondary} />
                        <ThemedText style={[styles.destinationUrl, { color: theme.textSecondary }]} numberOfLines={1}>
                          {details.destinationUrl.startsWith("http") 
                            ? new URL(details.destinationUrl).hostname 
                            : details.destinationUrl.replace("rabitchat://", "")}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {/* Ad Preview Section */}
              <View style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>Ad Preview</ThemedText>
                <View style={[
                  styles.previewCard,
                  { backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.8)" }
                ]}>
                  <View style={styles.previewHeader}>
                    <View style={styles.previewBadge}>
                      <Feather name="zap" size={10} color="#8B5CF6" />
                      <ThemedText style={styles.previewBadgeText}>Sponsored</ThemedText>
                    </View>
                  </View>
                  {details?.postPreview ? (
                    <>
                      {details.postPreview.user && (
                        <View style={styles.previewUser}>
                          <View style={styles.previewAvatar}>
                            {details.postPreview.user.profilePicUrl ? (
                              <Image 
                                source={{ uri: details.postPreview.user.profilePicUrl }} 
                                style={styles.previewAvatarImage}
                              />
                            ) : (
                              <Feather name="user" size={14} color={theme.textSecondary} />
                            )}
                          </View>
                          <View>
                            <ThemedText style={styles.previewDisplayName}>
                              {details.postPreview.user.displayName}
                            </ThemedText>
                            <ThemedText style={styles.previewUsername}>
                              @{details.postPreview.user.username}
                            </ThemedText>
                          </View>
                        </View>
                      )}
                      <ThemedText style={styles.previewContent} numberOfLines={3}>
                        {details.postPreview.content}
                      </ThemedText>
                      {details.postPreview.mediaUrl && (
                        <Image 
                          source={{ uri: details.postPreview.mediaUrl }}
                          style={styles.previewMedia}
                          resizeMode="cover"
                        />
                      )}
                    </>
                  ) : (
                    <ThemedText style={styles.previewContent} numberOfLines={3}>
                      {campaign.name.replace("Boost: ", "")}
                    </ThemedText>
                  )}
                  <View style={styles.previewStats}>
                    <ThemedText style={styles.previewStatText}>
                      Shown to {formatNumber(campaign.reach)} people
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.previewHint}>
                  This is how your boosted post appears in users' feeds with a "Sponsored" label
                </ThemedText>
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {canPause && (
              <Pressable 
                style={[styles.actionButton, { backgroundColor: "#F59E0B20" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  pauseMutation.mutate();
                }}
                disabled={pauseMutation.isPending}
              >
                <Feather name="pause" size={16} color="#F59E0B" />
                <ThemedText style={[styles.actionText, { color: "#F59E0B" }]}>
                  {pauseMutation.isPending ? "Pausing..." : "Pause Campaign"}
                </ThemedText>
              </Pressable>
            )}
            {canResume && (
              <Pressable 
                style={[styles.actionButton, { backgroundColor: "#22C55E20" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  resumeMutation.mutate();
                }}
                disabled={resumeMutation.isPending}
              >
                <Feather name="play" size={16} color="#22C55E" />
                <ThemedText style={[styles.actionText, { color: "#22C55E" }]}>
                  {resumeMutation.isPending ? "Resuming..." : "Resume Campaign"}
                </ThemedText>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

export default function MyBoostsScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Calculate safe top padding - use headerHeight if available, otherwise fallback to insets + estimated header
  const topPadding = Math.max(headerHeight, insets.top + 44) + Spacing.lg;

  const { data: campaigns, isLoading, refetch, isRefetching } = useQuery<Campaign[]>({
    queryKey: ["/api/ads/campaigns"],
    staleTime: 0, // FIX 4: Always fetch fresh data
    refetchOnMount: 'always',
  });

  const { data: walletData } = useQuery({
    queryKey: ["/api/ads/advertiser/me"],
  });

  // FIX 7 & 9: Sync mutation to force-fix orphaned campaigns
  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ads/campaigns/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads/campaigns"] });
      refetch();
    },
  });

  const wallet = (walletData as any)?.wallet;
  const activeCampaigns = campaigns?.filter(c => getEffectiveStatus(c) === "ACTIVE") || [];
  const totalSpent = campaigns?.reduce((sum, c) => sum + (c.budgetSpent || 0), 0) || 0;
  const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // FIX 9: Handle manual sync
  const handleSync = () => {
    syncMutation.mutate();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={Gradients.primary as [string, string]}
        style={styles.emptyIcon}
      >
        <Feather name="trending-up" size={32} color="white" />
      </LinearGradient>
      <ThemedText style={styles.emptyTitle}>No Boosted Posts Yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Boost your posts to reach more people and grow your influence
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: insets.bottom + Spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
            progressViewOffset={topPadding}
          />
        }
      >
        {wallet && (
          <Pressable 
            style={[
              styles.walletCard,
              { backgroundColor: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.1)" }
            ]}
            onPress={() => navigation.navigate("AdWalletTopup")}
          >
            <View style={styles.walletInfo}>
              <ThemedText style={styles.walletLabel}>Ad Wallet Balance</ThemedText>
              <ThemedText style={styles.walletBalance}>
                {formatCurrency(wallet.balance || 0)}
              </ThemedText>
            </View>
            <LinearGradient
              colors={Gradients.primary as [string, string]}
              style={styles.topUpButton}
            >
              <Feather name="plus" size={18} color="white" />
              <ThemedText style={styles.topUpText}>Top Up</ThemedText>
            </LinearGradient>
          </Pressable>
        )}

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}>
            <ThemedText style={styles.summaryValue}>{activeCampaigns.length}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Active</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}>
            <ThemedText style={styles.summaryValue}>{formatCurrency(totalSpent)}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Spent</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}>
            <ThemedText style={styles.summaryValue}>{formatNumber(totalImpressions)}</ThemedText>
            <ThemedText style={styles.summaryLabel}>Views</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.listHeader}>Your Campaigns</ThemedText>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator size="large" />
          </View>
        ) : campaigns && campaigns.length > 0 ? (
          campaigns.map(campaign => (
            <CampaignCard 
              key={campaign.id}
              campaign={campaign}
              isExpanded={expandedId === campaign.id}
              onToggle={() => toggleExpanded(campaign.id)}
            />
          ))
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 22,
    fontWeight: "700",
    marginRight: Spacing.sm,
  },
  topUpButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  topUpText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: "center",
  },
  listHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  campaignCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  campaignCardExpanded: {
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  campaignHeader: {
    marginBottom: Spacing.md,
  },
  campaignTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  campaignName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 16,
  },
  dateRange: {
    fontSize: 12,
    opacity: 0.6,
  },
  adNumberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(139,92,246,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adNumberText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
  },
  budgetRow: {
    marginBottom: Spacing.sm,
  },
  budgetInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  budgetValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "rgba(139,92,246,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 3,
  },
  expandedContent: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(139,92,246,0.2)",
    paddingTop: Spacing.md,
  },
  loadingDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    fontSize: 13,
    opacity: 0.6,
  },
  detailSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.8,
    marginBottom: Spacing.sm,
  },
  detailGrid: {
    gap: Spacing.sm,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    opacity: 0.6,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  ctaInfoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  ctaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  ctaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingLeft: Spacing.lg + Spacing.sm,
  },
  destinationUrl: {
    fontSize: 12,
    flex: 1,
  },
  previewCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  previewHeader: {
    marginBottom: Spacing.sm,
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  previewContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  previewStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewStatText: {
    fontSize: 11,
    opacity: 0.6,
  },
  previewUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  previewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  previewAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  previewDisplayName: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewUsername: {
    fontSize: 11,
    opacity: 0.6,
  },
  previewMedia: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  previewHint: {
    fontSize: 11,
    opacity: 0.5,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  loadingContainer: {
    paddingVertical: Spacing["2xl"],
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing["2xl"] * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 20,
  },
});
