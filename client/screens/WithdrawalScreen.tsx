import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Haptics from "@/lib/safeHaptics";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { GlassButton } from "@/components/GlassButton";
import { GlassInput } from "@/components/GlassInput";
import { Card } from "@/components/Card";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

interface Wallet {
  id: string;
  coinBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  isFrozen: boolean;
}

interface KYCData {
  id: string;
  status: "NOT_STARTED" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  accountType: string;
  isPrimary: boolean;
  isVerified: boolean;
}

interface WithdrawalRequest {
  id: string;
  amountCoins: number;
  platformFeeCoins: number;
  netAmountCoins: number;
  amountRands: number;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED" | "COMPLETED" | "FAILED" | "CANCELLED";
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

interface EconomyConfig {
  coinToRandRate: number;
  platformFeePercent: number;
  minWithdrawalCoins: number;
  maxWithdrawalCoins: number;
}

const CONVERSION_RATE = 100;
const PLATFORM_FEE_PERCENT = 50;
const MIN_WITHDRAWAL_COINS = 1000;

export default function WithdrawalScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [amountCoins, setAmountCoins] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const { data: kyc, isLoading: kycLoading } = useQuery<KYCData>({
    queryKey: ["/api/kyc"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawals"],
  });

  const submitWithdrawalMutation = useMutation({
    mutationFn: async (data: { amountCoins: number; bankAccountId: string }) => {
      const res = await apiRequest("POST", "/api/withdrawals", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      setAmountCoins("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Your withdrawal request has been submitted and is pending review.");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to submit withdrawal request");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchWithdrawals()]);
    setRefreshing(false);
  };

  const isLoading = walletLoading || kycLoading || accountsLoading || withdrawalsLoading;
  const isKycApproved = kyc?.status === "APPROVED";
  const verifiedAccounts = accounts.filter((a) => a.isVerified);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const coinAmount = parseInt(amountCoins) || 0;
  const platformFee = Math.floor(coinAmount * (PLATFORM_FEE_PERCENT / 100));
  const netCoins = coinAmount - platformFee;
  const randAmount = netCoins / CONVERSION_RATE;

  const canSubmit = useMemo(() => {
    if (!isKycApproved) return false;
    if (!selectedAccountId) return false;
    if (coinAmount < MIN_WITHDRAWAL_COINS) return false;
    if (coinAmount > (wallet?.coinBalance || 0)) return false;
    return true;
  }, [isKycApproved, selectedAccountId, coinAmount, wallet?.coinBalance]);

  const handleSubmit = () => {
    if (!selectedAccountId) {
      Alert.alert("Error", "Please select a bank account");
      return;
    }
    if (coinAmount < MIN_WITHDRAWAL_COINS) {
      Alert.alert("Error", `Minimum withdrawal is ${MIN_WITHDRAWAL_COINS.toLocaleString()} coins`);
      return;
    }
    if (coinAmount > (wallet?.coinBalance || 0)) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    Alert.alert(
      "Confirm Withdrawal",
      `You are withdrawing ${coinAmount.toLocaleString()} coins.\n\nPlatform Fee: ${platformFee.toLocaleString()} coins (${PLATFORM_FEE_PERCENT}%)\nNet Payout: R${randAmount.toFixed(2)}\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => submitWithdrawalMutation.mutate({ amountCoins: coinAmount, bankAccountId: selectedAccountId }),
        },
      ]
    );
  };

  const getStatusConfig = (status: WithdrawalRequest["status"]) => {
    switch (status) {
      case "COMPLETED":
        return { color: theme.success, icon: "check-circle", label: "Completed" };
      case "APPROVED":
      case "PROCESSING":
        return { color: theme.info, icon: "loader", label: status === "APPROVED" ? "Approved" : "Processing" };
      case "PENDING":
        return { color: theme.warning, icon: "clock", label: "Pending" };
      case "REJECTED":
      case "FAILED":
      case "CANCELLED":
        return { color: theme.error, icon: "x-circle", label: status.charAt(0) + status.slice(1).toLowerCase() };
      default:
        return { color: theme.textSecondary, icon: "circle", label: status };
    }
  };

  const maskAccountNumber = (num: string) => {
    if (num.length <= 4) return num;
    return "*".repeat(num.length - 4) + num.slice(-4);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.lg },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.header}>
          <ThemedText type="title2" style={styles.title}>Withdraw Coins</ThemedText>
          <ThemedText type="subhead" style={{ color: theme.textSecondary }}>
            Convert your earnings to real money
          </ThemedText>
        </View>

        <Card variant="premium" style={styles.balanceCard}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <ThemedText type="footnote" style={styles.balanceLabel}>Available Balance</ThemedText>
            <View style={styles.balanceRow}>
              <Text style={styles.coinIcon}>💰</Text>
              <Text style={styles.balanceAmount}>{wallet?.coinBalance?.toLocaleString() || 0}</Text>
            </View>
            <ThemedText type="subhead" style={styles.balanceRands}>
              ≈ R{((wallet?.coinBalance || 0) / CONVERSION_RATE).toFixed(2)}
            </ThemedText>
          </LinearGradient>
        </Card>

        <Card variant="glass" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="repeat" size={18} color={theme.primary} />
            <View style={styles.infoContent}>
              <ThemedText type="subhead" weight="semiBold">Conversion Rate</ThemedText>
              <ThemedText type="footnote" style={{ color: theme.textSecondary }}>
                100 coins = R1
              </ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Feather name="percent" size={18} color={theme.warning} />
            <View style={styles.infoContent}>
              <ThemedText type="subhead" weight="semiBold">Platform Fee</ThemedText>
              <ThemedText type="footnote" style={{ color: theme.textSecondary }}>
                {PLATFORM_FEE_PERCENT}% fee applies to all withdrawals
              </ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.infoRow}>
            <Feather name="alert-circle" size={18} color={theme.textSecondary} />
            <View style={styles.infoContent}>
              <ThemedText type="subhead" weight="semiBold">Minimum Withdrawal</ThemedText>
              <ThemedText type="footnote" style={{ color: theme.textSecondary }}>
                {MIN_WITHDRAWAL_COINS.toLocaleString()} coins (R{(MIN_WITHDRAWAL_COINS / CONVERSION_RATE).toFixed(2)})
              </ThemedText>
            </View>
          </View>
        </Card>

        {!isKycApproved ? (
          <Card variant="glass" style={StyleSheet.flatten([styles.warningCard, { borderColor: theme.warning }])}>
            <View style={styles.warningHeader}>
              <Feather name="alert-triangle" size={24} color={theme.warning} />
              <ThemedText type="headline" style={{ marginLeft: Spacing.md }}>KYC Verification Required</ThemedText>
            </View>
            <ThemedText type="subhead" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              You must complete identity verification before you can withdraw funds.
            </ThemedText>
            <GlassButton
              title="Complete Verification"
              icon="shield"
              variant="secondary"
              onPress={() => navigation.navigate("KYC")}
              style={{ marginTop: Spacing.lg }}
            />
          </Card>
        ) : accounts.length === 0 ? (
          <Card variant="glass" style={StyleSheet.flatten([styles.warningCard, { borderColor: theme.warning }])}>
            <View style={styles.warningHeader}>
              <Feather name="credit-card" size={24} color={theme.warning} />
              <ThemedText type="headline" style={{ marginLeft: Spacing.md }}>No Bank Account</ThemedText>
            </View>
            <ThemedText type="subhead" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Add a verified bank account to withdraw your earnings.
            </ThemedText>
            <GlassButton
              title="Add Bank Account"
              icon="plus"
              variant="secondary"
              onPress={() => navigation.navigate("BankAccounts")}
              style={{ marginTop: Spacing.lg }}
            />
          </Card>
        ) : (
          <>
            <Card variant="glass" style={styles.formCard}>
              <ThemedText type="headline" style={styles.sectionTitle}>Withdrawal Amount</ThemedText>

              <GlassInput
                label="Amount (Coins)"
                placeholder="Enter amount to withdraw"
                value={amountCoins}
                onChangeText={(text) => setAmountCoins(text.replace(/\D/g, ""))}
                keyboardType="numeric"
                leftIcon="credit-card"
              />

              {coinAmount > 0 ? (
                <View style={styles.calculationBox}>
                  <View style={styles.calcRow}>
                    <ThemedText type="subhead" style={{ color: theme.textSecondary }}>Amount</ThemedText>
                    <ThemedText type="subhead">{coinAmount.toLocaleString()} coins</ThemedText>
                  </View>
                  <View style={styles.calcRow}>
                    <ThemedText type="subhead" style={{ color: theme.warning }}>Platform Fee ({PLATFORM_FEE_PERCENT}%)</ThemedText>
                    <ThemedText type="subhead" style={{ color: theme.warning }}>-{platformFee.toLocaleString()} coins</ThemedText>
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />
                  <View style={styles.calcRow}>
                    <ThemedText type="headline" style={{ color: theme.success }}>Net Payout</ThemedText>
                    <ThemedText type="headline" style={{ color: theme.success }}>R{randAmount.toFixed(2)}</ThemedText>
                  </View>
                </View>
              ) : null}

              <Pressable
                style={[styles.pickerButton, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderColor: theme.border }]}
                onPress={() => setShowAccountPicker(true)}
              >
                {selectedAccount ? (
                  <View>
                    <ThemedText type="subhead" weight="semiBold">{selectedAccount.bankName}</ThemedText>
                    <ThemedText type="footnote" style={{ color: theme.textSecondary }}>
                      {maskAccountNumber(selectedAccount.accountNumber)} • {selectedAccount.accountType}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={{ color: theme.textTertiary }}>Select Bank Account</ThemedText>
                )}
                <Feather name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              <GlassButton
                title={submitWithdrawalMutation.isPending ? "Submitting..." : "Submit Withdrawal Request"}
                variant="gradient"
                onPress={handleSubmit}
                loading={submitWithdrawalMutation.isPending}
                disabled={!canSubmit || submitWithdrawalMutation.isPending}
                fullWidth
                glowEffect
                style={{ marginTop: Spacing.lg }}
              />

              {coinAmount > 0 && coinAmount < MIN_WITHDRAWAL_COINS ? (
                <ThemedText type="footnote" style={[styles.errorHint, { color: theme.error }]}>
                  Minimum withdrawal is {MIN_WITHDRAWAL_COINS.toLocaleString()} coins
                </ThemedText>
              ) : null}
              {coinAmount > (wallet?.coinBalance || 0) ? (
                <ThemedText type="footnote" style={[styles.errorHint, { color: theme.error }]}>
                  Insufficient balance
                </ThemedText>
              ) : null}
            </Card>

            {withdrawals.length > 0 ? (
              <View style={styles.historySection}>
                <ThemedText type="headline" style={styles.historyTitle}>Withdrawal History</ThemedText>
                {withdrawals.map((withdrawal) => {
                  const statusConfig = getStatusConfig(withdrawal.status);
                  return (
                    <Card key={withdrawal.id} variant="glass" style={styles.historyCard}>
                      <View style={styles.historyHeader}>
                        <View>
                          <ThemedText type="headline">{withdrawal.amountCoins.toLocaleString()} coins</ThemedText>
                          <ThemedText type="footnote" style={{ color: theme.textSecondary }}>
                            Net: R{(withdrawal.netAmountCoins / CONVERSION_RATE).toFixed(2)} • {new Date(withdrawal.createdAt).toLocaleDateString()}
                          </ThemedText>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
                          <Feather name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                          <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                        </View>
                      </View>
                      {withdrawal.rejectionReason ? (
                        <View style={[styles.rejectionBox, { backgroundColor: theme.error + "15" }]}>
                          <ThemedText type="footnote" style={{ color: theme.error }}>
                            {withdrawal.rejectionReason}
                          </ThemedText>
                        </View>
                      ) : null}
                    </Card>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Modal visible={showAccountPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.pickerModal, { backgroundColor: theme.backgroundElevated }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title3">Select Bank Account</ThemedText>
              <Pressable onPress={() => setShowAccountPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerList}>
              {accounts.map((account) => (
                <Pressable
                  key={account.id}
                  style={[styles.pickerItem, selectedAccountId === account.id && { backgroundColor: theme.primary + "20" }]}
                  onPress={() => {
                    setSelectedAccountId(account.id);
                    setShowAccountPicker(false);
                  }}
                >
                  <View style={styles.accountPickerInfo}>
                    <View style={styles.accountPickerRow}>
                      <ThemedText type="subhead" weight="semiBold">{account.bankName}</ThemedText>
                      {account.isPrimary ? (
                        <View style={[styles.primaryTag, { backgroundColor: theme.gold + "30" }]}>
                          <Feather name="star" size={10} color={theme.gold} />
                        </View>
                      ) : null}
                    </View>
                    <ThemedText type="footnote" style={{ color: theme.textSecondary }}>
                      {maskAccountNumber(account.accountNumber)} • {account.accountType}
                    </ThemedText>
                  </View>
                  {selectedAccountId === account.id ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  balanceCard: {
    marginBottom: Spacing.lg,
    overflow: "hidden",
    borderRadius: BorderRadius.xl,
  },
  balanceGradient: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.sm,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIcon: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
  },
  balanceRands: {
    color: "rgba(255,255,255,0.9)",
    marginTop: Spacing.xs,
  },
  infoCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    marginLeft: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  warningCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  calculationBox: {
    marginBottom: Spacing.lg,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  errorHint: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  historySection: {
    marginBottom: Spacing.xl,
  },
  historyTitle: {
    marginBottom: Spacing.lg,
  },
  historyCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rejectionBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  pickerList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  accountPickerInfo: {
    flex: 1,
  },
  accountPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  primaryTag: {
    padding: 2,
    borderRadius: 4,
  },
});
