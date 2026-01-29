import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Spacing } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

type TabType = "overview" | "wallets" | "gifts" | "bundles" | "withdrawals" | "emergency";

interface WalletStats {
  totalWallets: number;
  totalCoinsInCirculation: number;
  totalFrozenWallets: number;
  totalGiftsSent: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
}

interface UserWallet {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  isFrozen: boolean;
}

interface GiftType {
  id: string;
  name: string;
  coinCost: number;
  netWorthValue: number;
  iconUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface CoinBundle {
  id: string;
  name: string;
  coinAmount: number;
  bonusCoins: number;
  priceRands: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  amountCoins: number;
  netAmountRands: number;
  platformFee: number;
  status: string;
  createdAt: string;
  bankAccountLast4?: string;
}

export default function AdminEconomyScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<WalletStats>({
    queryKey: ["/api/admin/wallet/stats"],
  });

  const { data: wallets, isLoading: walletsLoading, refetch: refetchWallets } = useQuery<UserWallet[]>({
    queryKey: ["/api/admin/wallets"],
    enabled: activeTab === "wallets",
  });

  const { data: giftTypes, isLoading: giftsLoading, refetch: refetchGifts } = useQuery<GiftType[]>({
    queryKey: ["/api/admin/gift-types"],
    enabled: activeTab === "gifts",
  });

  const { data: bundles, isLoading: bundlesLoading, refetch: refetchBundles } = useQuery<CoinBundle[]>({
    queryKey: ["/api/admin/coin-bundles"],
    enabled: activeTab === "bundles",
  });

  const { data: withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: activeTab === "withdrawals",
  });

  const freezeWalletMutation = useMutation({
    mutationFn: async ({ userId, freeze }: { userId: string; freeze: boolean }) => {
      const endpoint = freeze ? "freeze" : "unfreeze";
      return apiRequest("POST", `/api/admin/wallets/${userId}/${endpoint}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet/stats"] });
      Alert.alert("Success", "Wallet status updated");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update wallet");
    },
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/wallets/${userId}/adjust`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet/stats"] });
      Alert.alert("Success", "Balance adjusted");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to adjust balance");
    },
  });

  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      return apiRequest("POST", `/api/admin/withdrawals/${id}/${action}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet/stats"] });
      Alert.alert("Success", "Withdrawal processed");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to process withdrawal");
    },
  });

  const toggleGiftMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/gift-types/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gift-types"] });
      Alert.alert("Success", "Gift type updated");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update gift type");
    },
  });

  const toggleBundleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/coin-bundles/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coin-bundles"] });
      Alert.alert("Success", "Coin bundle updated");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update bundle");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
      activeTab === "wallets" && refetchWallets(),
      activeTab === "gifts" && refetchGifts(),
      activeTab === "bundles" && refetchBundles(),
      activeTab === "withdrawals" && refetchWithdrawals(),
    ]);
    setRefreshing(false);
  };

  const handleFreezeWallet = (userId: string, currentlyFrozen: boolean) => {
    const action = currentlyFrozen ? "unfreeze" : "freeze";
    Alert.alert(
      `${currentlyFrozen ? "Unfreeze" : "Freeze"} Wallet`,
      `Are you sure you want to ${action} this wallet?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: currentlyFrozen ? "default" : "destructive",
          onPress: () => freezeWalletMutation.mutate({ userId, freeze: !currentlyFrozen }),
        },
      ]
    );
  };

  const handleAdjustBalance = (userId: string, username: string) => {
    Alert.prompt(
      "Adjust Balance",
      `Enter amount to add/subtract for ${username} (use negative for deduction):`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Adjust",
          onPress: (amount: string | undefined) => {
            const numAmount = parseInt(amount || "0", 10);
            if (isNaN(numAmount) || numAmount === 0) {
              Alert.alert("Error", "Please enter a valid amount");
              return;
            }
            adjustBalanceMutation.mutate({
              userId,
              amount: numAmount,
              reason: "Admin adjustment",
            });
          },
        },
      ],
      "plain-text",
      ""
    );
  };

  const handleProcessWithdrawal = (id: string, action: "approve" | "reject") => {
    Alert.alert(
      `${action === "approve" ? "Approve" : "Reject"} Withdrawal`,
      `Are you sure you want to ${action} this withdrawal request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === "reject" ? "destructive" : "default",
          onPress: () => processWithdrawalMutation.mutate({ id, action }),
        },
      ]
    );
  };

  const tabs: { key: TabType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "overview", label: "Overview", icon: "bar-chart-2" },
    { key: "wallets", label: "Wallets", icon: "credit-card" },
    { key: "gifts", label: "Gifts", icon: "gift" },
    { key: "bundles", label: "Bundles", icon: "package" },
    { key: "withdrawals", label: "Payouts", icon: "dollar-sign" },
    { key: "emergency", label: "Emergency", icon: "alert-triangle" },
  ];

  const filteredWallets = wallets?.filter(
    (w) =>
      w.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingWithdrawals = withdrawals?.filter((w) => w.status === "PENDING");

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <Animated.View entering={FadeInUp.delay(100).springify()}>
        <Card variant="glass" style={styles.statCard}>
          <Feather name="credit-card" size={24} color={theme.primary} />
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {stats?.totalWallets?.toLocaleString() || 0}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total Wallets
          </ThemedText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).springify()}>
        <Card variant="glass" style={styles.statCard}>
          <Feather name="disc" size={24} color={theme.gold} />
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {stats?.totalCoinsInCirculation?.toLocaleString() || 0}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Coins in Circulation
          </ThemedText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).springify()}>
        <Card variant="glass" style={styles.statCard}>
          <Feather name="lock" size={24} color={theme.error} />
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {stats?.totalFrozenWallets || 0}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Frozen Wallets
          </ThemedText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).springify()}>
        <Card variant="glass" style={styles.statCard}>
          <Feather name="gift" size={24} color={theme.success} />
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {stats?.totalGiftsSent?.toLocaleString() || 0}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Gifts Sent
          </ThemedText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).springify()}>
        <Card variant="glass" style={styles.statCard}>
          <Feather name="dollar-sign" size={24} color={theme.primary} />
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            {stats?.pendingWithdrawals || 0}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Pending Withdrawals
          </ThemedText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600).springify()}>
        <Card variant="glass" style={styles.statCard}>
          <Feather name="check-circle" size={24} color={theme.success} />
          <ThemedText style={[styles.statValue, { color: theme.text }]}>
            R{stats?.totalWithdrawals?.toLocaleString() || 0}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total Withdrawn
          </ThemedText>
        </Card>
      </Animated.View>
    </View>
  );

  const renderWallets = () => (
    <View style={styles.listContainer}>
      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border },
        ]}
        placeholder="Search by username..."
        placeholderTextColor={theme.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {walletsLoading ? (
        <LoadingIndicator size="small" style={styles.loader} />
      ) : (
        filteredWallets?.map((wallet, index) => (
          <Animated.View key={wallet.id} entering={FadeInUp.delay(index * 50).springify()}>
            <Card variant="glass" style={styles.walletCard}>
              <View style={styles.walletHeader}>
                <View>
                  <ThemedText style={[styles.walletName, { color: theme.text }]}>
                    {wallet.displayName || wallet.username}
                  </ThemedText>
                  <ThemedText style={[styles.walletUsername, { color: theme.textSecondary }]}>
                    @{wallet.username}
                  </ThemedText>
                </View>
                {wallet.isFrozen && (
                  <View style={[styles.frozenBadge, { backgroundColor: theme.error + "20" }]}>
                    <Feather name="lock" size={12} color={theme.error} />
                    <ThemedText style={[styles.frozenText, { color: theme.error }]}>Frozen</ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.walletStats}>
                <View style={styles.walletStat}>
                  <ThemedText style={[styles.walletStatValue, { color: theme.gold }]}>
                    {wallet.balance?.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={[styles.walletStatLabel, { color: theme.textSecondary }]}>
                    Balance
                  </ThemedText>
                </View>
                <View style={styles.walletStat}>
                  <ThemedText style={[styles.walletStatValue, { color: theme.success }]}>
                    {wallet.lifetimeEarned?.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={[styles.walletStatLabel, { color: theme.textSecondary }]}>
                    Earned
                  </ThemedText>
                </View>
                <View style={styles.walletStat}>
                  <ThemedText style={[styles.walletStatValue, { color: theme.error }]}>
                    {wallet.lifetimeSpent?.toLocaleString()}
                  </ThemedText>
                  <ThemedText style={[styles.walletStatLabel, { color: theme.textSecondary }]}>
                    Spent
                  </ThemedText>
                </View>
              </View>

              <View style={styles.walletActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: theme.primary + "20" }]}
                  onPress={() => handleAdjustBalance(wallet.userId, wallet.username)}
                >
                  <Feather name="edit-2" size={16} color={theme.primary} />
                  <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
                    Adjust
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionButton,
                    { backgroundColor: wallet.isFrozen ? theme.success + "20" : theme.error + "20" },
                  ]}
                  onPress={() => handleFreezeWallet(wallet.userId, wallet.isFrozen)}
                >
                  <Feather
                    name={wallet.isFrozen ? "unlock" : "lock"}
                    size={16}
                    color={wallet.isFrozen ? theme.success : theme.error}
                  />
                  <ThemedText
                    style={[styles.actionButtonText, { color: wallet.isFrozen ? theme.success : theme.error }]}
                  >
                    {wallet.isFrozen ? "Unfreeze" : "Freeze"}
                  </ThemedText>
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderGifts = () => (
    <View style={styles.listContainer}>
      {giftsLoading ? (
        <LoadingIndicator size="small" style={styles.loader} />
      ) : (
        giftTypes?.map((gift, index) => (
          <Animated.View key={gift.id} entering={FadeInUp.delay(index * 50).springify()}>
            <Card variant="glass" style={styles.giftCard}>
              <View style={styles.giftHeader}>
                <View style={[styles.giftIcon, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="gift" size={24} color={theme.primary} />
                </View>
                <View style={styles.giftInfo}>
                  <ThemedText style={[styles.giftName, { color: theme.text }]}>{gift.name}</ThemedText>
                  <View style={styles.giftPrices}>
                    <ThemedText style={[styles.giftPrice, { color: theme.gold }]}>
                      {gift.coinCost?.toLocaleString()} coins
                    </ThemedText>
                    <ThemedText style={[styles.giftNetWorth, { color: theme.textSecondary }]}>
                      +R{gift.netWorthValue?.toLocaleString()} net worth
                    </ThemedText>
                  </View>
                </View>
                <Pressable
                  style={[
                    styles.toggleButton,
                    { backgroundColor: gift.isActive ? theme.success + "20" : theme.error + "20" },
                  ]}
                  onPress={() => toggleGiftMutation.mutate({ id: gift.id, isActive: !gift.isActive })}
                >
                  <Feather
                    name={gift.isActive ? "check-circle" : "x-circle"}
                    size={20}
                    color={gift.isActive ? theme.success : theme.error}
                  />
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderBundles = () => (
    <View style={styles.listContainer}>
      {bundlesLoading ? (
        <LoadingIndicator size="small" style={styles.loader} />
      ) : (
        bundles?.map((bundle, index) => (
          <Animated.View key={bundle.id} entering={FadeInUp.delay(index * 50).springify()}>
            <Card variant="glass" style={styles.bundleCard}>
              <View style={styles.bundleHeader}>
                <View style={[styles.bundleIcon, { backgroundColor: theme.gold + "20" }]}>
                  <Feather name="package" size={24} color={theme.gold} />
                </View>
                <View style={styles.bundleInfo}>
                  <ThemedText style={[styles.bundleName, { color: theme.text }]}>{bundle.name}</ThemedText>
                  <View style={styles.bundleDetails}>
                    <ThemedText style={[styles.bundleCoins, { color: theme.gold }]}>
                      {bundle.coinAmount?.toLocaleString()} + {bundle.bonusCoins?.toLocaleString()} bonus
                    </ThemedText>
                    <ThemedText style={[styles.bundlePrice, { color: theme.success }]}>
                      R{bundle.priceRands}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.bundleToggles}>
                  {bundle.isFeatured && (
                    <View style={[styles.featuredBadge, { backgroundColor: theme.gold + "20" }]}>
                      <Feather name="star" size={12} color={theme.gold} />
                    </View>
                  )}
                  <Pressable
                    style={[
                      styles.toggleButton,
                      { backgroundColor: bundle.isActive ? theme.success + "20" : theme.error + "20" },
                    ]}
                    onPress={() => toggleBundleMutation.mutate({ id: bundle.id, isActive: !bundle.isActive })}
                  >
                    <Feather
                      name={bundle.isActive ? "check-circle" : "x-circle"}
                      size={20}
                      color={bundle.isActive ? theme.success : theme.error}
                    />
                  </Pressable>
                </View>
              </View>
            </Card>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderWithdrawals = () => (
    <View style={styles.listContainer}>
      {withdrawalsLoading ? (
        <LoadingIndicator size="small" style={styles.loader} />
      ) : pendingWithdrawals?.length === 0 ? (
        <Card variant="glass" style={styles.emptyCard}>
          <Feather name="check-circle" size={48} color={theme.success} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            No pending withdrawals
          </ThemedText>
        </Card>
      ) : (
        pendingWithdrawals?.map((withdrawal, index) => (
          <Animated.View key={withdrawal.id} entering={FadeInUp.delay(index * 50).springify()}>
            <Card variant="glass" style={styles.withdrawalCard}>
              <View style={styles.withdrawalHeader}>
                <View>
                  <ThemedText style={[styles.withdrawalUser, { color: theme.text }]}>
                    {withdrawal.displayName || withdrawal.username}
                  </ThemedText>
                  <ThemedText style={[styles.withdrawalUsername, { color: theme.textSecondary }]}>
                    @{withdrawal.username}
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: theme.warning + "20" }]}>
                  <Feather name="clock" size={12} color={theme.warning} />
                  <ThemedText style={[styles.statusText, { color: theme.warning }]}>
                    Pending
                  </ThemedText>
                </View>
              </View>

              <View style={styles.withdrawalDetails}>
                <View style={styles.withdrawalDetail}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Amount
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: theme.gold }]}>
                    {withdrawal.amountCoins?.toLocaleString()} coins
                  </ThemedText>
                </View>
                <View style={styles.withdrawalDetail}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Platform Fee (50%)
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: theme.error }]}>
                    -{withdrawal.platformFee?.toLocaleString()} coins
                  </ThemedText>
                </View>
                <View style={styles.withdrawalDetail}>
                  <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                    Payout
                  </ThemedText>
                  <ThemedText style={[styles.detailValue, { color: theme.success }]}>
                    R{withdrawal.netAmountRands?.toLocaleString()}
                  </ThemedText>
                </View>
                {withdrawal.bankAccountLast4 && (
                  <View style={styles.withdrawalDetail}>
                    <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      Bank Account
                    </ThemedText>
                    <ThemedText style={[styles.detailValue, { color: theme.text }]}>
                      ****{withdrawal.bankAccountLast4}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.withdrawalActions}>
                <Pressable
                  style={[styles.approveButton, { backgroundColor: theme.success }]}
                  onPress={() => handleProcessWithdrawal(withdrawal.id, "approve")}
                >
                  <Feather name="check" size={16} color="#fff" />
                  <ThemedText style={styles.buttonText}>Approve</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.rejectButton, { backgroundColor: theme.error }]}
                  onPress={() => handleProcessWithdrawal(withdrawal.id, "reject")}
                >
                  <Feather name="x" size={16} color="#fff" />
                  <ThemedText style={styles.buttonText}>Reject</ThemedText>
                </Pressable>
              </View>
            </Card>
          </Animated.View>
        ))
      )}
    </View>
  );

  const renderEmergency = () => (
    <View style={styles.emergencyContainer}>
      <Animated.View entering={FadeInUp.delay(100).springify()}>
        <Card variant="glass" style={{ ...styles.emergencyCard, borderColor: theme.warning }}>
          <View style={styles.emergencyHeader}>
            <View style={[styles.emergencyIcon, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="alert-triangle" size={24} color={theme.warning} />
            </View>
            <View style={styles.emergencyInfo}>
              <ThemedText style={[styles.emergencyTitle, { color: theme.text }]}>
                Freeze All Wallets
              </ThemedText>
              <ThemedText style={[styles.emergencyDesc, { color: theme.textSecondary }]}>
                Emergency freeze all user wallets to prevent transactions
              </ThemedText>
            </View>
          </View>
          <Pressable
            style={[styles.emergencyButton, { backgroundColor: theme.warning }]}
            onPress={() => {
              Alert.alert(
                "Freeze All Wallets",
                "This will freeze ALL user wallets immediately. Are you absolutely sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Freeze All",
                    style: "destructive",
                    onPress: () => Alert.alert("Info", "Emergency freeze endpoint not configured"),
                  },
                ]
              );
            }}
          >
            <Feather name="lock" size={16} color="#fff" />
            <ThemedText style={styles.buttonText}>Freeze All</ThemedText>
          </Pressable>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200).springify()}>
        <Card variant="glass" style={{ ...styles.emergencyCard, borderColor: theme.error }}>
          <View style={styles.emergencyHeader}>
            <View style={[styles.emergencyIcon, { backgroundColor: theme.error + "20" }]}>
              <Feather name="pause-circle" size={24} color={theme.error} />
            </View>
            <View style={styles.emergencyInfo}>
              <ThemedText style={[styles.emergencyTitle, { color: theme.text }]}>
                Pause Withdrawals
              </ThemedText>
              <ThemedText style={[styles.emergencyDesc, { color: theme.textSecondary }]}>
                Temporarily pause all withdrawal processing
              </ThemedText>
            </View>
          </View>
          <Pressable
            style={[styles.emergencyButton, { backgroundColor: theme.error }]}
            onPress={() => {
              Alert.alert(
                "Pause Withdrawals",
                "This will pause all pending and new withdrawal requests. Continue?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Pause",
                    style: "destructive",
                    onPress: () => Alert.alert("Info", "Withdrawal pause endpoint not configured"),
                  },
                ]
              );
            }}
          >
            <Feather name="pause" size={16} color="#fff" />
            <ThemedText style={styles.buttonText}>Pause</ThemedText>
          </Pressable>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).springify()}>
        <Card variant="glass" style={{ ...styles.emergencyCard, borderColor: theme.primary }}>
          <View style={styles.emergencyHeader}>
            <View style={[styles.emergencyIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="refresh-cw" size={24} color={theme.primary} />
            </View>
            <View style={styles.emergencyInfo}>
              <ThemedText style={[styles.emergencyTitle, { color: theme.text }]}>
                Recalculate All Balances
              </ThemedText>
              <ThemedText style={[styles.emergencyDesc, { color: theme.textSecondary }]}>
                Recalculate all wallet balances from transaction history
              </ThemedText>
            </View>
          </View>
          <Pressable
            style={[styles.emergencyButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              Alert.alert(
                "Recalculate Balances",
                "This will recalculate all balances from transaction history. This may take a while.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Recalculate",
                    onPress: () => Alert.alert("Info", "Balance recalculation endpoint not configured"),
                  },
                ]
              );
            }}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <ThemedText style={styles.buttonText}>Recalculate</ThemedText>
          </Pressable>
        </Card>
      </Animated.View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "wallets":
        return renderWallets();
      case "gifts":
        return renderGifts();
      case "bundles":
        return renderBundles();
      case "withdrawals":
        return renderWithdrawals();
      case "emergency":
        return renderEmergency();
      default:
        return renderOverview();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? theme.primary : theme.backgroundSecondary,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Feather
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? "#fff" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? "#fff" : theme.textSecondary },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {statsLoading && activeTab === "overview" ? (
          <LoadingIndicator size="medium" style={styles.loader} />
        ) : (
          renderContent()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  tabsContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
    marginRight: Spacing.xs,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing["2xl"],
  },
  loader: {
    marginTop: Spacing["2xl"],
  },
  overviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statCard: {
    width: "47%",
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  listContainer: {
    gap: Spacing.md,
  },
  searchInput: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  walletCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  walletName: {
    fontSize: 16,
    fontWeight: "600",
  },
  walletUsername: {
    fontSize: 13,
  },
  frozenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frozenText: {
    fontSize: 11,
    fontWeight: "600",
  },
  walletStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  walletStat: {
    alignItems: "center",
  },
  walletStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  walletStatLabel: {
    fontSize: 11,
  },
  walletActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  giftCard: {
    padding: Spacing.md,
  },
  giftHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  giftIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  giftInfo: {
    flex: 1,
  },
  giftName: {
    fontSize: 16,
    fontWeight: "600",
  },
  giftPrices: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  giftPrice: {
    fontSize: 13,
    fontWeight: "500",
  },
  giftNetWorth: {
    fontSize: 12,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bundleCard: {
    padding: Spacing.md,
  },
  bundleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  bundleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 16,
    fontWeight: "600",
  },
  bundleDetails: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  bundleCoins: {
    fontSize: 13,
    fontWeight: "500",
  },
  bundlePrice: {
    fontSize: 13,
    fontWeight: "600",
  },
  bundleToggles: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featuredBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawalCard: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  withdrawalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  withdrawalUser: {
    fontSize: 16,
    fontWeight: "600",
  },
  withdrawalUsername: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  withdrawalDetails: {
    gap: Spacing.xs,
  },
  withdrawalDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  withdrawalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    padding: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
  },
  emergencyContainer: {
    gap: Spacing.md,
  },
  emergencyCard: {
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emergencyDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
});
