import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface SubscriptionTier {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  monthlyPriceCoins: number;
  yearlyPriceCoins: number | null;
  benefits: string[];
  isActive: boolean;
  subscriberCount: number;
}

interface Subscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  tierId: string;
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAUSED";
  isYearly: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  creator?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  tier?: SubscriptionTier;
}

interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
  bio?: string;
  followerCount?: number;
}

export function SubscriptionsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"subscriptions" | "subscribers" | "tiers">("subscriptions");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [showCreateTier, setShowCreateTier] = useState(false);

  const { data: mySubscriptions, isLoading: loadingSubscriptions } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions/my"],
    enabled: !!user,
  });

  const { data: mySubscribers, isLoading: loadingSubscribers } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions/subscribers"],
    enabled: !!user,
  });

  const { data: myTiers, isLoading: loadingTiers } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/subscriptions/my-tiers"],
    enabled: !!user,
  });

  const { data: selectedTiers } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/subscriptions/tiers", selectedCreator?.id],
    enabled: !!selectedCreator,
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ creatorId, tierId }: { creatorId: string; tierId: string }) => {
      return apiRequest("POST", "/api/subscriptions/subscribe", { creatorId, tierId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
      Alert.alert("Subscribed!", "You are now a super follower!");
      setSelectedCreator(null);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to subscribe");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return apiRequest("POST", `/api/subscriptions/${subscriptionId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/my"] });
      Alert.alert("Cancelled", "Your subscription has been cancelled");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to cancel subscription");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
    setRefreshing(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCoins = (coins: number) => {
    if (coins >= 1000000) {
      return `${(coins / 1000000).toFixed(1)}M`;
    }
    if (coins >= 1000) {
      return `${(coins / 1000).toFixed(1)}K`;
    }
    return coins.toString();
  };

  const renderTierCard = (tier: SubscriptionTier, isOwn: boolean = false) => (
    <Animated.View entering={FadeInUp.delay(100)} key={tier.id}>
      <Card style={styles.tierCard}>
        <View style={styles.tierHeader}>
          <View style={styles.tierBadge}>
            <Feather name="star" size={16} color="#FFD700" />
            <ThemedText style={[styles.tierName, { color: theme.text }]}>
              {tier.name}
            </ThemedText>
          </View>
          <View style={[styles.priceBadge, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText style={[styles.priceText, { color: theme.primary }]}>
              {formatCoins(tier.monthlyPriceCoins)} coins/mo
            </ThemedText>
          </View>
        </View>

        {tier.description ? (
          <ThemedText style={[styles.tierDescription, { color: theme.textSecondary }]}>
            {tier.description}
          </ThemedText>
        ) : null}

        {Array.isArray(tier.benefits) && tier.benefits.length > 0 ? (
          <View style={styles.benefitsList}>
            {tier.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Feather name="check-circle" size={14} color={theme.success} />
                <ThemedText style={[styles.benefitText, { color: theme.text }]}>
                  {benefit}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.tierFooter}>
          <ThemedText style={[styles.subscriberCount, { color: theme.textSecondary }]}>
            {tier.subscriberCount} super followers
          </ThemedText>
          
          {!isOwn ? (
            <Pressable
              style={[styles.subscribeButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                if (selectedCreator) {
                  subscribeMutation.mutate({ creatorId: selectedCreator.id, tierId: tier.id });
                }
              }}
            >
              {subscribeMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <ThemedText style={styles.subscribeButtonText}>
                  Super Follow
                </ThemedText>
              )}
            </Pressable>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );

  const renderSubscriptionCard = (subscription: Subscription) => (
    <Animated.View entering={FadeInUp.delay(100)} key={subscription.id}>
      <Card style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View style={styles.creatorInfo}>
            <Avatar uri={subscription.creator?.avatarUrl} size={48} />
            <View style={styles.creatorDetails}>
              <View style={styles.nameRow}>
                <ThemedText style={[styles.creatorName, { color: theme.text }]}>
                  {subscription.creator?.displayName || "Unknown"}
                </ThemedText>
                {subscription.creator?.isVerified ? (
                  <Feather name="check-circle" size={14} color={theme.primary} />
                ) : null}
              </View>
              <ThemedText style={[styles.tierLabel, { color: theme.primary }]}>
                {subscription.tier?.name || "Tier"}
              </ThemedText>
            </View>
          </View>
          
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  subscription.status === "ACTIVE"
                    ? theme.success + "20"
                    : subscription.status === "PAUSED"
                    ? theme.warning + "20"
                    : theme.error + "20",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                {
                  color:
                    subscription.status === "ACTIVE"
                      ? theme.success
                      : subscription.status === "PAUSED"
                      ? theme.warning
                      : theme.error,
                },
              ]}
            >
              {subscription.status}
            </ThemedText>
          </View>
        </View>

        <View style={styles.subscriptionDetails}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              Renews {formatDate(subscription.currentPeriodEnd)}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="credit-card" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {subscription.isYearly ? "Yearly" : "Monthly"} billing
            </ThemedText>
          </View>
        </View>

        {subscription.status === "ACTIVE" ? (
          <View style={styles.subscriptionActions}>
            <Pressable
              style={[styles.actionButton, { borderColor: theme.error }]}
              onPress={() => {
                Alert.alert(
                  "Cancel Subscription?",
                  "You will lose access to exclusive content at the end of your billing period.",
                  [
                    { text: "Keep", style: "cancel" },
                    {
                      text: "Cancel",
                      style: "destructive",
                      onPress: () => cancelMutation.mutate(subscription.id),
                    },
                  ]
                );
              }}
            >
              <ThemedText style={[styles.actionButtonText, { color: theme.error }]}>
                Cancel
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </Card>
    </Animated.View>
  );

  const renderSubscriberCard = (subscription: Subscription) => (
    <Animated.View entering={FadeInUp.delay(100)} key={subscription.id}>
      <Card style={styles.subscriberCard}>
        <View style={styles.subscriberInfo}>
          <Avatar uri={undefined} size={40} />
          <View style={styles.subscriberDetails}>
            <ThemedText style={[styles.subscriberName, { color: theme.text }]}>
              Subscriber #{subscription.subscriberId.slice(-6)}
            </ThemedText>
            <View style={styles.subscriberMeta}>
              <ThemedText style={[styles.tierLabel, { color: theme.primary }]}>
                {subscription.tier?.name || "Tier"}
              </ThemedText>
              <ThemedText style={[styles.subscriberDate, { color: theme.textSecondary }]}>
                Since {formatDate(subscription.currentPeriodStart)}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );

  const renderMyTierCard = (tier: SubscriptionTier) => (
    <Animated.View entering={FadeInUp.delay(100)} key={tier.id}>
      <Card style={styles.myTierCard}>
        <View style={styles.myTierHeader}>
          <View>
            <ThemedText style={[styles.myTierName, { color: theme.text }]}>
              {tier.name}
            </ThemedText>
            <ThemedText style={[styles.myTierPrice, { color: theme.primary }]}>
              {formatCoins(tier.monthlyPriceCoins)} coins/month
            </ThemedText>
          </View>
          <View style={styles.myTierStats}>
            <Feather name="users" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.myTierStat, { color: theme.text }]}>
              {tier.subscriberCount}
            </ThemedText>
          </View>
        </View>
        {tier.description ? (
          <ThemedText style={[styles.myTierDesc, { color: theme.textSecondary }]} numberOfLines={2}>
            {tier.description}
          </ThemedText>
        ) : null}
      </Card>
    </Animated.View>
  );

  const renderContent = () => {
    if (selectedCreator) {
      return (
        <View style={styles.tiersView}>
          <Card style={styles.creatorCard}>
            <View style={styles.creatorProfile}>
              <Avatar uri={selectedCreator.avatarUrl} size={64} />
              <View style={styles.creatorProfileDetails}>
                <View style={styles.nameRow}>
                  <ThemedText style={[styles.creatorDisplayName, { color: theme.text }]}>
                    {selectedCreator.displayName}
                  </ThemedText>
                  {selectedCreator.isVerified ? (
                    <Feather name="check-circle" size={16} color={theme.primary} />
                  ) : null}
                </View>
                <ThemedText style={[styles.creatorUsername, { color: theme.textSecondary }]}>
                  @{selectedCreator.username}
                </ThemedText>
              </View>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelectedCreator(null)}
            >
              <Feather name="x" size={24} color={theme.textSecondary} />
            </Pressable>
          </Card>

          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Super Follow Tiers
          </ThemedText>

          {selectedTiers?.map((tier) => renderTierCard(tier))}
        </View>
      );
    }

    switch (activeTab) {
      case "subscriptions":
        if (loadingSubscriptions) {
          return (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" />
            </View>
          );
        }
        
        if (!mySubscriptions?.length) {
          return (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="star" size={48} color={theme.primary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No Super Follows Yet
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Super follow your favorite creators for exclusive content and perks
              </ThemedText>
            </View>
          );
        }

        return mySubscriptions.map(renderSubscriptionCard);

      case "subscribers":
        if (loadingSubscribers) {
          return (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" />
            </View>
          );
        }

        if (!mySubscribers?.length) {
          return (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.pink + "20" }]}>
                <Feather name="users" size={48} color={theme.pink} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No Subscribers Yet
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Create subscription tiers to start earning from your super followers
              </ThemedText>
            </View>
          );
        }

        return mySubscribers.map(renderSubscriberCard);

      case "tiers":
        if (loadingTiers) {
          return (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" />
            </View>
          );
        }

        return (
          <>
            {myTiers?.map(renderMyTierCard)}
            
            <Pressable
              style={[styles.createTierButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                Alert.alert(
                  "Create Tier",
                  "Tier creation will be available from your profile settings"
                );
              }}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.createTierText}>Create New Tier</ThemedText>
            </Pressable>
          </>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {!selectedCreator ? (
          <View style={styles.tabsContainer}>
            <Pressable
              style={[
                styles.tab,
                activeTab === "subscriptions" && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab("subscriptions")}
            >
              <Feather
                name="star"
                size={16}
                color={activeTab === "subscriptions" ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  { color: activeTab === "subscriptions" ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                Following
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                activeTab === "subscribers" && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab("subscribers")}
            >
              <Feather
                name="users"
                size={16}
                color={activeTab === "subscribers" ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  { color: activeTab === "subscribers" ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                Followers
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                activeTab === "tiers" && { backgroundColor: theme.primary },
              ]}
              onPress={() => setActiveTab("tiers")}
            >
              <Feather
                name="layers"
                size={16}
                color={activeTab === "tiers" ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  { color: activeTab === "tiers" ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                My Tiers
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabText: {
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.h2.fontSize,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    textAlign: "center",
    lineHeight: 22,
  },
  subscriptionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  creatorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  creatorDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  creatorName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  tierLabel: {
    fontSize: 12,
    marginTop: 2,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    textTransform: "uppercase",
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  subscriptionDetails: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: 13,
  },
  subscriptionActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  subscriberCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subscriberInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  subscriberDetails: {
    flex: 1,
  },
  subscriberName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  subscriberMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  subscriberDate: {
    fontSize: 12,
  },
  myTierCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  myTierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  myTierName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  myTierPrice: {
    fontSize: 13,
    marginTop: 2,
  },
  myTierStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  myTierStat: {
    fontSize: 14,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  myTierDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  createTierButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  createTierText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  tiersView: {
    gap: Spacing.md,
  },
  creatorCard: {
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creatorProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  creatorProfileDetails: {
    flex: 1,
  },
  creatorDisplayName: {
    fontSize: Typography.h3.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  creatorUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.h3.fontSize,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  tierCard: {
    padding: Spacing.lg,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  tierName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  priceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priceText: {
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  tierDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  benefitsList: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: 13,
    flex: 1,
  },
  tierFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  subscriberCount: {
    fontSize: 12,
  },
  subscribeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
});
