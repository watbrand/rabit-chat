import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { LoadingIndicator } from "@/components/animations";

interface CreatorEarnings {
  totalEarningsCoins: number;
  pendingWithdrawalCoins: number;
  withdrawnCoins: number;
  platformFeePaid: number;
  platformFeePercent?: number;
}

interface EarningEntry {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  senderName?: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  isVerified: boolean;
  isPrimary: boolean;
}

type FilterType = "all" | "tips" | "gifts" | "subscriptions";

const FILTERS: { id: FilterType; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "list" },
  { id: "tips", label: "Tips", icon: "zap" },
  { id: "gifts", label: "Gifts", icon: "gift" },
  { id: "subscriptions", label: "Subs", icon: "users" },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  index,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  index: number;
}) {
  const { theme, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.summaryCard}
    >
      <Card variant="glass" style={styles.summaryCardInner}>
        <View style={[styles.summaryIcon, { backgroundColor: color + "20" }]}>
          <Feather name={icon as any} size={20} color={color} />
        </View>
        <ThemedText style={[styles.summaryValue, { color: theme.text }]}>
          {value.toLocaleString()}
        </ThemedText>
        <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
      </Card>
    </Animated.View>
  );
}

function EarningCard({ entry }: { entry: EarningEntry }) {
  const { theme } = useTheme();

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "tip":
        return "zap";
      case "gift":
        return "gift";
      case "subscription":
        return "users";
      default:
        return "dollar-sign";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "tip":
        return theme.gold;
      case "gift":
        return "#EC4899";
      case "subscription":
        return theme.primary;
      default:
        return theme.success;
    }
  };

  return (
    <Card variant="glass" style={styles.earningCard}>
      <View
        style={[
          styles.earningIcon,
          { backgroundColor: getTypeColor(entry.type) + "20" },
        ]}
      >
        <Feather
          name={getTypeIcon(entry.type) as any}
          size={18}
          color={getTypeColor(entry.type)}
        />
      </View>
      <View style={styles.earningInfo}>
        <ThemedText style={[styles.earningType, { color: theme.text }]}>
          {entry.type}
        </ThemedText>
        <ThemedText style={[styles.earningDescription, { color: theme.textSecondary }]}>
          {entry.senderName ? `From ${entry.senderName}` : entry.description}
        </ThemedText>
        <ThemedText style={[styles.earningDate, { color: theme.textTertiary }]}>
          {formatDate(entry.createdAt)}
        </ThemedText>
      </View>
      <ThemedText style={[styles.earningAmount, { color: theme.success }]}>
        +{entry.amount.toLocaleString()}
      </ThemedText>
    </Card>
  );
}

export default function CreatorDashboardScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const {
    data: earnings,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<CreatorEarnings>({
    queryKey: ["/api/my/earnings"],
  });

  const { data: earningsHistory = [] } = useQuery<EarningEntry[]>({
    queryKey: ["/api/my/earnings/history"],
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/my/bank-accounts"],
  });
  
  const bankAccount = bankAccounts.find(acc => acc.isPrimary) || bankAccounts[0] || null;

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", "/api/withdrawal/request", { amountCoins: amount });
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/my/earnings"] });
      setWithdrawModalVisible(false);
      setWithdrawAmount("");
      Alert.alert("Success", "Withdrawal request submitted successfully");
    },
    onError: (error: any) => {
      Alert.alert("Withdrawal Failed", error.message || "Failed to process withdrawal");
    },
  });

  const handleWithdraw = () => {
    if (!bankAccount?.isVerified) {
      Alert.alert(
        "Bank Account Required",
        "Please set up and verify your bank account before withdrawing.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Set Up Now",
            onPress: () => navigation.navigate("EditProfile", { tab: "bank" }),
          },
        ]
      );
      return;
    }
    setWithdrawModalVisible(true);
  };

  const handleConfirmWithdraw = () => {
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }
    if (earnings && amount > (earnings.totalEarningsCoins - earnings.pendingWithdrawalCoins - earnings.withdrawnCoins)) {
      Alert.alert("Insufficient Balance", "You don't have enough pending balance");
      return;
    }
    withdrawMutation.mutate(amount);
  };

  const filteredEarnings = earningsHistory.filter((entry) =>
    selectedFilter === "all"
      ? true
      : entry.type.toLowerCase().includes(selectedFilter.slice(0, -1))
  );

  const netAmount = withdrawAmount
    ? Math.floor(parseInt(withdrawAmount, 10) * 0.5)
    : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="trending-up"
            label="Total Earned"
            value={earnings?.totalEarningsCoins || 0}
            color={theme.success}
            index={0}
          />
          <SummaryCard
            icon="clock"
            label="Withdrawable"
            value={(earnings?.totalEarningsCoins || 0) - (earnings?.pendingWithdrawalCoins || 0) - (earnings?.withdrawnCoins || 0)}
            color={theme.gold}
            index={1}
          />
          <SummaryCard
            icon="check-circle"
            label="Withdrawn"
            value={earnings?.withdrawnCoins || 0}
            color={theme.primary}
            index={2}
          />
        </View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Card variant="glass" style={styles.feeNotice}>
            <Feather name="info" size={20} color={theme.warning} />
            <View style={styles.feeNoticeText}>
              <ThemedText style={[styles.feeTitle, { color: theme.text }]}>
                Platform Fee: 50%
              </ThemedText>
              <ThemedText style={[styles.feeDescription, { color: theme.textSecondary }]}>
                A 50% platform fee applies to all withdrawals
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <View style={styles.actionButtons}>
            <Pressable onPress={handleWithdraw} style={styles.withdrawButton}>
              <LinearGradient
                colors={Gradients.primary}
                style={styles.withdrawGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="dollar-sign" size={20} color="#FFFFFF" />
                <ThemedText style={styles.withdrawText}>Request Withdrawal</ThemedText>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate("EditProfile", { tab: "bank" })}
              style={[
                styles.bankButton,
                {
                  backgroundColor: isDark ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.9)",
                  borderColor: theme.border,
                },
              ]}
            >
              <Feather name="credit-card" size={20} color={theme.text} />
              <ThemedText style={[styles.bankButtonText, { color: theme.text }]}>
                {bankAccount ? "Bank Account" : "Set Up Bank"}
              </ThemedText>
              {bankAccount?.isVerified ? (
                <View style={[styles.verifiedBadge, { backgroundColor: theme.success }]}>
                  <Feather name="check" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          </View>
        </Animated.View>

        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Earnings History
        </ThemedText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((filter) => (
            <Pressable
              key={filter.id}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedFilter(filter.id);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedFilter === filter.id
                      ? theme.primary
                      : isDark
                      ? "rgba(26, 26, 36, 0.8)"
                      : "rgba(255, 255, 255, 0.9)",
                  borderColor: selectedFilter === filter.id ? theme.primary : theme.border,
                },
              ]}
            >
              <Feather
                name={filter.icon as any}
                size={14}
                color={selectedFilter === filter.id ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.filterLabel,
                  { color: selectedFilter === filter.id ? "#FFFFFF" : theme.text },
                ]}
              >
                {filter.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.earningsList}>
          {filteredEarnings.map((entry) => (
            <EarningCard key={entry.id} entry={entry} />
          ))}
        </View>

        {filteredEarnings.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={theme.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No earnings yet
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={withdrawModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#1A1A24" : "#FFFFFF" },
              ]}
            >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                Request Withdrawal
              </ThemedText>
              <Pressable onPress={() => setWithdrawModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.availableBalance}>
              <ThemedText style={[styles.availableLabel, { color: theme.textSecondary }]}>
                Available Balance
              </ThemedText>
              <ThemedText style={[styles.availableValue, { color: theme.gold }]}>
                {((earnings?.totalEarningsCoins || 0) - (earnings?.pendingWithdrawalCoins || 0) - (earnings?.withdrawnCoins || 0)).toLocaleString()} coins
              </ThemedText>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter amount"
              placeholderTextColor={theme.textTertiary}
              keyboardType="number-pad"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            {withdrawAmount && !isNaN(parseInt(withdrawAmount, 10)) ? (
              <View style={styles.feeBreakdown}>
                <View style={styles.feeRow}>
                  <ThemedText style={[styles.feeRowLabel, { color: theme.textSecondary }]}>
                    Amount
                  </ThemedText>
                  <ThemedText style={[styles.feeRowValue, { color: theme.text }]}>
                    {parseInt(withdrawAmount, 10).toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.feeRow}>
                  <ThemedText style={[styles.feeRowLabel, { color: theme.textSecondary }]}>
                    Platform Fee ({earnings?.platformFeePercent || 50}%)
                  </ThemedText>
                  <ThemedText style={[styles.feeRowValue, { color: theme.error }]}>
                    -{(parseInt(withdrawAmount, 10) - netAmount).toLocaleString()}
                  </ThemedText>
                </View>
                <View style={[styles.feeRow, styles.netRow]}>
                  <ThemedText style={[styles.netLabel, { color: theme.text }]}>
                    You'll Receive
                  </ThemedText>
                  <ThemedText style={[styles.netValue, { color: theme.success }]}>
                    {netAmount.toLocaleString()} coins
                  </ThemedText>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={handleConfirmWithdraw}
              disabled={withdrawMutation.isPending}
              style={[styles.confirmButton, { opacity: withdrawMutation.isPending ? 0.6 : 1 }]}
            >
              <LinearGradient
                colors={Gradients.primary}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {withdrawMutation.isPending ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <ThemedText style={styles.confirmText}>Confirm Withdrawal</ThemedText>
                )}
              </LinearGradient>
            </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
  },
  summaryCardInner: {
    padding: Spacing.md,
    alignItems: "center",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  feeNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  feeNoticeText: {
    flex: 1,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  feeDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionButtons: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  withdrawButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  withdrawGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  withdrawText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bankButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  bankButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  filtersScroll: {
    marginBottom: Spacing.lg,
  },
  filtersContent: {
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  earningsList: {
    gap: Spacing.md,
  },
  earningCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  earningIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  earningInfo: {
    flex: 1,
  },
  earningType: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  earningDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  earningDate: {
    fontSize: 11,
    marginTop: 2,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  availableBalance: {
    marginBottom: Spacing.lg,
  },
  availableLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  availableValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  feeBreakdown: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feeRowLabel: {
    fontSize: 14,
  },
  feeRowValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  netRow: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.2)",
    marginTop: Spacing.sm,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  netValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  confirmButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  confirmGradient: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
