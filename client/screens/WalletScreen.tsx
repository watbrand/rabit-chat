import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { apiRequest } from "@/lib/query-client";
import * as Haptics from "expo-haptics";

interface Wallet {
  id: string;
  userId: string;
  coinBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  isFrozen: boolean;
}

interface Transaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  description?: string;
  balanceAfter: number;
  createdAt: string;
}

interface CoinBundle {
  id: string;
  name: string;
  coinAmount: number;
  priceRands: number;
  bonusCoins: number;
  iconUrl?: string;
  isFeatured: boolean;
}

interface DailyRewardStatus {
  canClaim: boolean;
  currentStreak: number;
  nextRewardCoins: number;
  lastClaimDate?: string;
}

interface CreatorEarnings {
  totalEarningsCoins: number;
  pendingWithdrawalCoins: number;
  withdrawnCoins: number;
  platformFeePaid: number;
}

interface WealthClubMembership {
  membership: {
    id: string;
    clubId: string;
    userId: string;
    joinedAt: string;
    isActive: boolean;
  } | null;
  club: {
    id: string;
    name: string;
    tier: number;
    minNetWorth: number;
    perks: string;
    badgeUrl?: string;
    color?: string;
  } | null;
}

interface PendingPurchase {
  id: string;
  bundleId?: string;
  coinsReceived: number;
  amountPaidRands: number;
  paymentReference?: string;
  createdAt: string;
}

export default function WalletScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [customCoinAmount, setCustomCoinAmount] = useState("");

  const { data: wallet, isLoading, refetch } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });

  const { data: coinBundles = [] } = useQuery<CoinBundle[]>({
    queryKey: ["/api/coin-bundles"],
  });

  const { data: dailyReward } = useQuery<DailyRewardStatus>({
    queryKey: ["/api/daily-reward/status"],
  });

  const { data: creatorEarnings } = useQuery<CreatorEarnings>({
    queryKey: ["/api/my/earnings"],
  });

  const { data: wealthClubMembership } = useQuery<WealthClubMembership>({
    queryKey: ["/api/my/wealth-club"],
  });

  const { data: pendingPurchasesData, refetch: refetchPending } = useQuery<{ pendingPurchases: PendingPurchase[] }>({
    queryKey: ["/api/coins/pending"],
  });

  const recoverPurchaseMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      const response = await apiRequest("POST", `/api/coins/recover/${purchaseId}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (data.alreadyCompleted) {
        Alert.alert(
          "Already Completed",
          `This purchase was already completed. You have ${data.purchase?.coinsReceived?.toLocaleString() || 0} coins from this purchase.`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Purchase Recovered!",
          `${data.purchase?.coinsReceived?.toLocaleString() || 0} coins have been added to your wallet!`,
          [{ text: "OK" }]
        );
      }
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coins/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    },
    onError: (error: any) => {
      Alert.alert("Recovery Failed", error.message || "Failed to recover purchase. Please contact support.");
    },
  });

  const claimDailyRewardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/daily-reward/claim");
      return response.json();
    },
    onSuccess: (data) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "Daily Reward Claimed!",
        `You received ${data.coinsAwarded} coins! Streak: ${data.newStreak} days`,
        [{ text: "OK" }]
      );
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reward/status"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to claim daily reward");
    },
  });

  const purchaseBundleMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      const response = await apiRequest("POST", "/api/coins/purchase", { bundleId });
      const data = await response.json();
      if (!data.purchaseId) {
        throw new Error(data.message || "Failed to initiate purchase - no purchaseId returned");
      }
      return data;
    },
    onSuccess: (data) => {
      const bundle = coinBundles.find((b) => b.id === data.bundleId) || data.bundle;
      navigation.navigate("CoinCheckout", {
        purchaseId: data.purchaseId,
        paymentUrl: data.paymentUrl,
        paymentData: data.paymentData,
        bundle: bundle ? {
          name: bundle.name,
          coinAmount: bundle.coinAmount,
          bonusCoins: bundle.bonusCoins,
          priceRands: bundle.priceRands,
        } : {
          name: "Coin Bundle",
          coinAmount: 0,
          bonusCoins: 0,
          priceRands: 0,
        },
      });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to initiate purchase");
    },
  });

  const customPurchaseMutation = useMutation({
    mutationFn: async (coinAmount: number) => {
      const response = await apiRequest("POST", "/api/coins/purchase-custom", { coinAmount });
      const data = await response.json();
      if (!data.purchaseId) {
        throw new Error(data.message || "Failed to initiate custom purchase");
      }
      return data;
    },
    onSuccess: (data) => {
      setCustomCoinAmount("");
      navigation.navigate("CoinCheckout", {
        purchaseId: data.purchaseId,
        paymentUrl: data.paymentUrl,
        paymentData: data.paymentData,
        bundle: {
          name: `${data.coinAmount.toLocaleString()} Coins`,
          coinAmount: data.coinAmount,
          bonusCoins: 0,
          priceRands: data.priceRands,
        },
      });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to initiate custom purchase");
    },
  });

  // Auto-recover pending purchases on load
  useEffect(() => {
    const autoRecoverPurchases = async () => {
      if (pendingPurchasesData?.pendingPurchases && pendingPurchasesData.pendingPurchases.length > 0) {
        console.log("[Wallet] Found pending purchases, attempting auto-recovery...");
        for (const purchase of pendingPurchasesData.pendingPurchases) {
          try {
            const response = await apiRequest("POST", `/api/coins/recover/${purchase.id}`);
            const data = await response.json();
            if (data.success) {
              console.log("[Wallet] Auto-recovered purchase:", purchase.id);
              queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
              queryClient.invalidateQueries({ queryKey: ["/api/coins/pending"] });
              queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
              if (!data.alreadyCompleted && Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          } catch (err) {
            console.error("[Wallet] Auto-recovery failed for purchase:", purchase.id, err);
          }
        }
      }
    };
    autoRecoverPurchases();
  }, [pendingPurchasesData?.pendingPurchases?.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      refetchPending(),
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reward/status"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/my/earnings"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/my/wealth-club"] }),
    ]);
    setRefreshing(false);
  };

  const getWealthClubColor = (tier: number) => {
    switch (tier) {
      case 1: return "#CD7F32";
      case 2: return "#C0C0C0";
      case 3: return "#FFD700";
      case 4: return "#E5E4E2";
      case 5: return "#B9F2FF";
      default: return theme.primary;
    }
  };

  const parsePerks = (perksJson: string): string[] => {
    try {
      const perks = JSON.parse(perksJson);
      return Array.isArray(perks) ? perks : [];
    } catch {
      return [];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "plus-circle";
      case "GIFT_SENT":
        return "gift";
      case "GIFT_RECEIVED":
        return "heart";
      case "STREAM_TIP":
        return "zap";
      case "DAILY_REWARD":
        return "calendar";
      case "ACHIEVEMENT":
        return "award";
      case "STAKE_BONUS":
        return "trending-up";
      case "WITHDRAWAL":
        return "download";
      default:
        return "circle";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
      case "GIFT_RECEIVED":
      case "DAILY_REWARD":
      case "ACHIEVEMENT":
      case "STAKE_BONUS":
        return "#4caf50";
      case "GIFT_SENT":
      case "STREAM_TIP":
      case "WITHDRAWAL":
        return "#f44336";
      default:
        return theme.textSecondary;
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionCard, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + "20" }]}>
        <Feather name={getTransactionIcon(item.type) as any} size={20} color={getTransactionColor(item.type)} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionType, { color: theme.text }]}>
          {item.type.replace(/_/g, " ")}
        </Text>
        <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.transactionAmount, { color: getTransactionColor(item.type) }]}>
        {item.type.includes("RECEIVED") || item.type === "PURCHASE" || item.type === "DAILY_REWARD" || item.type === "ACHIEVEMENT" || item.type === "STAKE_BONUS" ? "+" : "-"}
        {item.amount.toLocaleString()}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.title, { color: theme.text }]}>Wallet</Text>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          {wallet?.isFrozen ? (
            <View style={styles.frozenBadge}>
              <Feather name="lock" size={12} color="#fff" />
              <Text style={styles.frozenText}>Frozen</Text>
            </View>
          ) : null}
        </View>
        
        <View style={styles.balanceRow}>
          <View style={styles.coinBalance}>
            <Text style={styles.coinIcon}>R</Text>
            <View>
              <Text style={styles.coinAmount}>{wallet?.coinBalance?.toLocaleString() || 0}</Text>
              <Text style={styles.coinLabel}>Rabit Coins</Text>
            </View>
          </View>
          <View style={styles.coinBalance}>
            <Feather name="trending-up" size={20} color="rgba(255,255,255,0.8)" />
            <View>
              <Text style={styles.statAmount}>{wallet?.lifetimeEarned?.toLocaleString() || 0}</Text>
              <Text style={styles.coinLabel}>Earned</Text>
            </View>
          </View>
          <View style={styles.coinBalance}>
            <Feather name="trending-down" size={20} color="rgba(255,255,255,0.8)" />
            <View>
              <Text style={styles.statAmount}>{wallet?.lifetimeSpent?.toLocaleString() || 0}</Text>
              <Text style={styles.coinLabel}>Spent</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.buyButton}
          onPress={() => setShowPackages(!showPackages)}
        >
          <Feather name="plus" size={20} color={theme.primary} />
          <Text style={[styles.buyButtonText, { color: theme.primary }]}>
            {showPackages ? "Hide Packages" : "Buy Coins"}
          </Text>
        </Pressable>
      </View>

      {/* Pending Purchase Recovery Banner */}
      {pendingPurchasesData?.pendingPurchases && pendingPurchasesData.pendingPurchases.length > 0 ? (
        <View style={[styles.pendingBanner, { backgroundColor: "#FFA500" }]}>
          <View style={styles.pendingBannerContent}>
            <Feather name="alert-circle" size={20} color="#fff" />
            <View style={styles.pendingBannerText}>
              <Text style={styles.pendingBannerTitle}>
                {pendingPurchasesData.pendingPurchases.length} Pending Purchase{pendingPurchasesData.pendingPurchases.length > 1 ? "s" : ""}
              </Text>
              <Text style={styles.pendingBannerSubtitle}>
                Tap to recover coins from completed payments
              </Text>
            </View>
          </View>
          {pendingPurchasesData.pendingPurchases.map((purchase) => (
            <Pressable
              key={purchase.id}
              style={styles.pendingPurchaseItem}
              onPress={() => {
                if (!recoverPurchaseMutation.isPending) {
                  Alert.alert(
                    "Recover Purchase",
                    `Recover ${purchase.coinsReceived.toLocaleString()} coins (R${purchase.amountPaidRands})?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Recover", onPress: () => recoverPurchaseMutation.mutate(purchase.id) },
                    ]
                  );
                }
              }}
              disabled={recoverPurchaseMutation.isPending}
            >
              <Text style={styles.pendingPurchaseText}>
                {purchase.coinsReceived.toLocaleString()} coins - R{purchase.amountPaidRands}
              </Text>
              {recoverPurchaseMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <Feather name="refresh-cw" size={16} color="#fff" />
              )}
            </Pressable>
          ))}
        </View>
      ) : (
        /* Show check for missed payments button even if no pending purchases found */
        <Pressable
          style={[styles.checkPaymentsButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={async () => {
            try {
              await refetchPending();
              const pending = pendingPurchasesData?.pendingPurchases || [];
              if (pending.length === 0) {
                Alert.alert(
                  "No Pending Payments",
                  "All your coin purchases have been credited. If you believe a payment is missing, please contact support.",
                  [{ text: "OK" }]
                );
              }
            } catch {
              Alert.alert("Error", "Could not check payment status. Please try again.");
            }
          }}
        >
          <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
          <Text style={[styles.checkPaymentsText, { color: theme.textSecondary }]}>
            Check for missing payments
          </Text>
        </Pressable>
      )}

      {dailyReward ? (
        <Pressable
          style={[
            styles.dailyRewardCard,
            { backgroundColor: dailyReward.canClaim ? "#FFD700" : theme.backgroundSecondary },
          ]}
          onPress={() => {
            if (dailyReward.canClaim && !claimDailyRewardMutation.isPending) {
              claimDailyRewardMutation.mutate();
            }
          }}
          disabled={!dailyReward.canClaim || claimDailyRewardMutation.isPending}
        >
          <View style={styles.dailyRewardLeft}>
            <Feather
              name="gift"
              size={24}
              color={dailyReward.canClaim ? "#333" : theme.textSecondary}
            />
            <View>
              <Text
                style={[
                  styles.dailyRewardTitle,
                  { color: dailyReward.canClaim ? "#333" : theme.text },
                ]}
              >
                Daily Reward
              </Text>
              <Text
                style={[
                  styles.dailyRewardSubtitle,
                  { color: dailyReward.canClaim ? "#555" : theme.textSecondary },
                ]}
              >
                {dailyReward.currentStreak} day streak
              </Text>
            </View>
          </View>
          <View style={styles.dailyRewardRight}>
            {claimDailyRewardMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Text
                  style={[
                    styles.dailyRewardCoins,
                    { color: dailyReward.canClaim ? "#333" : theme.primary },
                  ]}
                >
                  +{dailyReward.nextRewardCoins}
                </Text>
                <Text
                  style={[
                    styles.dailyRewardAction,
                    { color: dailyReward.canClaim ? "#333" : theme.textSecondary },
                  ]}
                >
                  {dailyReward.canClaim ? "Claim Now!" : "Come back tomorrow"}
                </Text>
              </>
            )}
          </View>
        </Pressable>
      ) : null}

      {wealthClubMembership?.club ? (
        <View style={[styles.wealthClubCard, { backgroundColor: theme.backgroundSecondary, borderColor: getWealthClubColor(wealthClubMembership.club.tier) }]}>
          <View style={styles.wealthClubHeader}>
            <View style={[styles.wealthClubBadge, { backgroundColor: getWealthClubColor(wealthClubMembership.club.tier) }]}>
              <Feather name="award" size={20} color="#fff" />
            </View>
            <View style={styles.wealthClubInfo}>
              <Text style={[styles.wealthClubName, { color: getWealthClubColor(wealthClubMembership.club.tier) }]}>
                {wealthClubMembership.club.name}
              </Text>
              <Text style={[styles.wealthClubSubtitle, { color: theme.textSecondary }]}>
                Tier {wealthClubMembership.club.tier} Member
              </Text>
            </View>
            <Pressable
              style={styles.wealthClubViewAll}
              onPress={() => navigation.navigate("WealthClub")}
            >
              <Text style={[styles.wealthClubViewAllText, { color: theme.primary }]}>View All</Text>
              <Feather name="chevron-right" size={16} color={theme.primary} />
            </Pressable>
          </View>
          <View style={styles.wealthClubPerks}>
            <Text style={[styles.wealthClubPerksTitle, { color: theme.text }]}>Your Perks</Text>
            {parsePerks(wealthClubMembership.club.perks).slice(0, 3).map((perk, index) => (
              <View key={index} style={styles.wealthClubPerkRow}>
                <Feather name="check-circle" size={14} color="#4caf50" />
                <Text style={[styles.wealthClubPerkText, { color: theme.textSecondary }]}>{perk}</Text>
              </View>
            ))}
            {parsePerks(wealthClubMembership.club.perks).length > 3 ? (
              <Text style={[styles.wealthClubMorePerks, { color: theme.textSecondary }]}>
                +{parsePerks(wealthClubMembership.club.perks).length - 3} more perks
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.wealthClubPromo, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.navigate("WealthClub")}
        >
          <Feather name="award" size={24} color="#FFD700" />
          <View style={styles.wealthClubPromoContent}>
            <Text style={[styles.wealthClubPromoTitle, { color: theme.text }]}>Join a Wealth Club</Text>
            <Text style={[styles.wealthClubPromoSubtitle, { color: theme.textSecondary }]}>
              Unlock exclusive perks based on your net worth
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      )}

      <View style={styles.quickActions}>
        <Pressable
          style={[styles.quickActionCard, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.navigate("WealthClub")}
        >
          <Feather name="award" size={24} color="#FFD700" />
          <Text style={[styles.quickActionLabel, { color: theme.text }]}>Wealth Club</Text>
        </Pressable>
        <Pressable
          style={[styles.quickActionCard, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.navigate("Staking")}
        >
          <Feather name="lock" size={24} color={theme.primary} />
          <Text style={[styles.quickActionLabel, { color: theme.text }]}>Staking</Text>
        </Pressable>
        <Pressable
          style={[styles.quickActionCard, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.navigate("Achievements")}
        >
          <Feather name="star" size={24} color="#EC4899" />
          <Text style={[styles.quickActionLabel, { color: theme.text }]}>Achievements</Text>
        </Pressable>
        <Pressable
          style={[styles.quickActionCard, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.navigate("Battles")}
        >
          <Feather name="flag" size={24} color="#14B8A6" />
          <Text style={[styles.quickActionLabel, { color: theme.text }]}>Battles</Text>
        </Pressable>
      </View>

      {creatorEarnings && creatorEarnings.totalEarningsCoins > 0 ? (
        <View style={[styles.creatorSection, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Creator Earnings</Text>
          <View style={styles.creatorStats}>
            <View style={styles.creatorStat}>
              <Text style={[styles.creatorStatValue, { color: "#4caf50" }]}>
                {creatorEarnings.totalEarningsCoins.toLocaleString()}
              </Text>
              <Text style={[styles.creatorStatLabel, { color: theme.textSecondary }]}>
                Total Earned
              </Text>
            </View>
            <View style={styles.creatorStat}>
              <Text style={[styles.creatorStatValue, { color: theme.primary }]}>
                {(creatorEarnings.totalEarningsCoins - creatorEarnings.pendingWithdrawalCoins - creatorEarnings.withdrawnCoins).toLocaleString()}
              </Text>
              <Text style={[styles.creatorStatLabel, { color: theme.textSecondary }]}>
                Withdrawable
              </Text>
            </View>
            <View style={styles.creatorStat}>
              <Text style={[styles.creatorStatValue, { color: theme.text }]}>
                {creatorEarnings.withdrawnCoins.toLocaleString()}
              </Text>
              <Text style={[styles.creatorStatLabel, { color: theme.textSecondary }]}>
                Withdrawn
              </Text>
            </View>
          </View>
          <View style={styles.creatorActions}>
            <Pressable
              style={[styles.creatorActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("CreatorDashboard")}
            >
              <Feather name="bar-chart-2" size={16} color="#fff" />
              <Text style={styles.creatorActionText}>Dashboard</Text>
            </Pressable>
            <Pressable
              style={[styles.creatorActionBtn, { backgroundColor: "#4caf50" }]}
              onPress={() => navigation.navigate("Withdrawal")}
            >
              <Feather name="download" size={16} color="#fff" />
              <Text style={styles.creatorActionText}>Withdraw</Text>
            </Pressable>
          </View>
          <View style={styles.creatorLinks}>
            <Pressable
              style={styles.creatorLink}
              onPress={() => navigation.navigate("BankAccounts")}
            >
              <Feather name="credit-card" size={16} color={theme.textSecondary} />
              <Text style={[styles.creatorLinkText, { color: theme.textSecondary }]}>
                Bank Accounts
              </Text>
              <Feather name="chevron-right" size={16} color={theme.textSecondary} />
            </Pressable>
            <Pressable
              style={styles.creatorLink}
              onPress={() => navigation.navigate("KYC")}
            >
              <Feather name="shield" size={16} color={theme.textSecondary} />
              <Text style={[styles.creatorLinkText, { color: theme.textSecondary }]}>
                KYC Verification
              </Text>
              <Feather name="chevron-right" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={[styles.creatorPromo, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="dollar-sign" size={32} color={theme.primary} />
          <Text style={[styles.creatorPromoTitle, { color: theme.text }]}>
            Become a Creator
          </Text>
          <Text style={[styles.creatorPromoText, { color: theme.textSecondary }]}>
            Receive gifts from fans and earn Rabit Coins! Set up your bank account to withdraw earnings.
          </Text>
          <View style={styles.creatorPromoActions}>
            <Pressable
              style={[styles.creatorPromoBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate("BankAccounts")}
            >
              <Text style={styles.creatorPromoBtnText}>Add Bank Account</Text>
            </Pressable>
            <Pressable
              style={[styles.creatorPromoBtn, { backgroundColor: theme.backgroundRoot }]}
              onPress={() => navigation.navigate("KYC")}
            >
              <Text style={[styles.creatorPromoBtnText, { color: theme.text }]}>
                Verify Identity
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {showPackages ? (
        <View style={styles.packagesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recommended Bundles</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Best value coin packages - save more with bigger bundles!
          </Text>
          <View style={styles.packagesGrid}>
            {coinBundles.map((bundle) => (
              <Pressable
                key={bundle.id}
                style={[
                  styles.packageCard,
                  { backgroundColor: theme.backgroundSecondary },
                  bundle.isFeatured ? { borderColor: theme.primary, borderWidth: 2 } : {},
                ]}
                onPress={() => purchaseBundleMutation.mutate(bundle.id)}
                disabled={purchaseBundleMutation.isPending}
              >
                {bundle.isFeatured ? (
                  <View style={[styles.featuredBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.featuredText}>Best Value</Text>
                  </View>
                ) : null}
                <Text style={[styles.packageCoins, { color: theme.text }]}>
                  {bundle.coinAmount.toLocaleString()}
                </Text>
                <Text style={[styles.packageCoinsLabel, { color: theme.textSecondary }]}>
                  Rabit Coins
                </Text>
                {bundle.bonusCoins > 0 ? (
                  <Text style={[styles.packageBonus, { color: "#4caf50" }]}>
                    +{bundle.bonusCoins.toLocaleString()} bonus!
                  </Text>
                ) : null}
                <Text style={[styles.packagePrice, { color: theme.primary }]}>
                  R{bundle.priceRands}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.customAmountSection, { borderTopColor: theme.border }]}>
            <Text style={[styles.customAmountTitle, { color: theme.text }]}>
              Or Enter Custom Amount
            </Text>
            <Text style={[styles.customAmountSubtitle, { color: theme.textSecondary }]}>
              1 Coin = R1 (Rand)
            </Text>
            <View style={styles.customAmountRow}>
              <View style={[styles.customAmountInputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <Text style={[styles.customAmountPrefix, { color: theme.textSecondary }]}>Coins:</Text>
                <TextInput
                  style={[styles.customAmountInput, { color: theme.text }]}
                  placeholder="Enter amount"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={customCoinAmount}
                  onChangeText={(text) => setCustomCoinAmount(text.replace(/[^0-9]/g, ""))}
                />
              </View>
              <View style={styles.customAmountPriceContainer}>
                <Text style={[styles.customAmountPriceLabel, { color: theme.textSecondary }]}>
                  Price:
                </Text>
                <Text style={[styles.customAmountPrice, { color: theme.primary }]}>
                  R{parseInt(customCoinAmount || "0", 10).toLocaleString()}
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.customAmountButton,
                { backgroundColor: customCoinAmount && parseInt(customCoinAmount, 10) >= 10 ? theme.primary : theme.backgroundSecondary },
              ]}
              onPress={() => {
                const amount = parseInt(customCoinAmount || "0", 10);
                if (amount >= 10) {
                  customPurchaseMutation.mutate(amount);
                }
              }}
              disabled={!customCoinAmount || parseInt(customCoinAmount, 10) < 10 || customPurchaseMutation.isPending}
            >
              {customPurchaseMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <Text style={[styles.customAmountButtonText, { color: customCoinAmount && parseInt(customCoinAmount, 10) >= 10 ? "#fff" : theme.textSecondary }]}>
                  {parseInt(customCoinAmount || "0", 10) < 10 ? "Minimum 10 coins" : `Buy ${parseInt(customCoinAmount || "0", 10).toLocaleString()} Coins`}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.transactionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        {transactions.length > 0 ? (
          transactions.slice(0, 10).map((item) => (
            <View key={item.id}>
              {renderTransaction({ item })}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No transactions yet
            </Text>
          </View>
        )}
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  balanceCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  frozenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  frozenText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  coinBalance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coinIcon: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
  },
  coinAmount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  statAmount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  coinLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dailyRewardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dailyRewardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dailyRewardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  dailyRewardSubtitle: {
    fontSize: 12,
  },
  dailyRewardRight: {
    alignItems: "flex-end",
  },
  dailyRewardCoins: {
    fontSize: 20,
    fontWeight: "bold",
  },
  dailyRewardAction: {
    fontSize: 12,
  },
  wealthClubCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  wealthClubHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  wealthClubBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  wealthClubInfo: {
    flex: 1,
  },
  wealthClubName: {
    fontSize: 18,
    fontWeight: "700",
  },
  wealthClubSubtitle: {
    fontSize: 12,
  },
  wealthClubViewAll: {
    flexDirection: "row",
    alignItems: "center",
  },
  wealthClubViewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  wealthClubPerks: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  wealthClubPerksTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  wealthClubPerkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  wealthClubPerkText: {
    fontSize: 13,
  },
  wealthClubMorePerks: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  wealthClubPromo: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  wealthClubPromoContent: {
    flex: 1,
  },
  wealthClubPromoTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  wealthClubPromoSubtitle: {
    fontSize: 12,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  quickActionCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  creatorSection: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  creatorStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  creatorStat: {
    alignItems: "center",
  },
  creatorStatValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  creatorStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  creatorActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  creatorActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  creatorActionText: {
    color: "#fff",
    fontWeight: "600",
  },
  creatorLinks: {
    gap: 8,
  },
  creatorLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  creatorLinkText: {
    flex: 1,
    fontSize: 14,
  },
  creatorPromo: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  creatorPromoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  creatorPromoText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  creatorPromoActions: {
    flexDirection: "row",
    gap: 12,
  },
  creatorPromoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  creatorPromoBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  packagesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  packagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  packageCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  featuredBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  featuredText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  packageCoins: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  packageCoinsLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  packageBonus: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  transactionsSection: {
    paddingHorizontal: 16,
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  customAmountSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  customAmountTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  customAmountSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  customAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  customAmountInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  customAmountPrefix: {
    fontSize: 14,
    fontWeight: "500",
  },
  customAmountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    padding: 0,
  },
  customAmountPriceContainer: {
    alignItems: "center",
  },
  customAmountPriceLabel: {
    fontSize: 11,
  },
  customAmountPrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  customAmountButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  customAmountButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pendingBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  pendingBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pendingBannerText: {
    flex: 1,
  },
  pendingBannerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  pendingBannerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  pendingPurchaseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.3)",
  },
  pendingPurchaseText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  checkPaymentsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  checkPaymentsText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
