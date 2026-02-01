import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { LoadingIndicator, InlineLoader } from "@/components/animations";

interface StakingTier {
  days: number;
  bonusPercent: number;
  label: string;
  icon: string;
}

const STAKING_TIERS: StakingTier[] = [
  { days: 7, bonusPercent: 2, label: "1 Week", icon: "clock" },
  { days: 30, bonusPercent: 5, label: "1 Month", icon: "calendar" },
  { days: 90, bonusPercent: 12, label: "3 Months", icon: "trending-up" },
  { days: 180, bonusPercent: 25, label: "6 Months", icon: "star" },
  { days: 365, bonusPercent: 50, label: "1 Year", icon: "award" },
];

const MINIMUM_STAKE_AMOUNT = 100;

interface ActiveStake {
  id: string;
  amount: number;
  bonusPercent: number;
  startDate: string;
  endDate: string;
  matured: boolean;
  claimed: boolean;
}

interface GiftReceived {
  id: string;
  coinAmount: number;
  senderName: string;
  createdAt: string;
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Matured");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

function StakeCountdown({ endDate }: { endDate: string }) {
  const timeLeft = useCountdown(endDate);
  const { theme } = useTheme();

  return (
    <ThemedText style={[styles.countdownText, { color: theme.primary }]}>
      {timeLeft}
    </ThemedText>
  );
}

function StakingTierCard({
  tier,
  onStake,
  index,
}: {
  tier: StakingTier;
  onStake: (tier: StakingTier) => void;
  index: number;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onStake(tier);
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.tierCard,
          {
            backgroundColor: isDark ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.9)",
            borderColor: theme.border,
          },
        ]}
      >
        <LinearGradient
          colors={Gradients.primary}
          style={styles.tierIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={tier.icon as any} size={24} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.tierInfo}>
          <ThemedText style={[styles.tierLabel, { color: theme.text }]}>
            {tier.label}
          </ThemedText>
          <ThemedText style={[styles.tierDays, { color: theme.textSecondary }]}>
            {tier.days} days
          </ThemedText>
        </View>
        <View style={styles.tierBonus}>
          <ThemedText style={[styles.bonusPercent, { color: theme.success }]}>
            +{tier.bonusPercent}%
          </ThemedText>
          <ThemedText style={[styles.bonusLabel, { color: theme.textSecondary }]}>
            bonus
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ActiveStakeCard({
  stake,
  onClaim,
}: {
  stake: ActiveStake;
  onClaim: (stakeId: string) => void;
}) {
  const { theme, isDark } = useTheme();
  const expectedReturn = Math.floor(stake.amount * (1 + stake.bonusPercent / 100));

  return (
    <Card
      variant="glass"
      style={StyleSheet.flatten([
        styles.stakeCard,
        stake.matured ? { borderColor: theme.gold, borderWidth: 2 } : {},
      ])}
    >
      <View style={styles.stakeHeader}>
        <View style={styles.stakeAmount}>
          <ThemedText style={[styles.stakeCoins, { color: theme.text }]}>
            {stake.amount.toLocaleString()}
          </ThemedText>
          <ThemedText style={[styles.stakeLabel, { color: theme.textSecondary }]}>
            coins staked
          </ThemedText>
        </View>
        <View style={styles.stakeStatus}>
          {stake.matured ? (
            <View style={[styles.maturedBadge, { backgroundColor: theme.goldLight }]}>
              <ThemedText style={[styles.maturedText, { color: theme.gold }]}>
                Ready
              </ThemedText>
            </View>
          ) : (
            <StakeCountdown endDate={stake.endDate} />
          )}
        </View>
      </View>

      <View style={styles.stakeDetails}>
        <View style={styles.stakeDetail}>
          <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
            Bonus
          </ThemedText>
          <ThemedText style={[styles.detailValue, { color: theme.success }]}>
            +{stake.bonusPercent}%
          </ThemedText>
        </View>
        <View style={styles.stakeDetail}>
          <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
            Expected Return
          </ThemedText>
          <ThemedText style={[styles.detailValue, { color: theme.gold }]}>
            {expectedReturn.toLocaleString()}
          </ThemedText>
        </View>
      </View>

      {stake.matured && !stake.claimed ? (
        <Pressable
          onPress={() => onClaim(stake.id)}
          style={styles.claimButton}
        >
          <LinearGradient
            colors={Gradients.gold}
            style={styles.claimGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Feather name="gift" size={18} color="#000000" />
            <ThemedText style={styles.claimText}>Claim Rewards</ThemedText>
          </LinearGradient>
        </Pressable>
      ) : null}
    </Card>
  );
}

export default function StakingScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [selectedTier, setSelectedTier] = useState<StakingTier | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");

  const { data: wallet } = useQuery<{ coinBalance: number }>({
    queryKey: ["/api/wallet"],
  });

  const { data: activeStakes = [], isLoading, refetch, isRefetching } = useQuery<ActiveStake[]>({
    queryKey: ["/api/staking/active"],
  });

  const { data: giftsReceived = [] } = useQuery<GiftReceived[]>({
    queryKey: ["/api/gifts/received"],
  });

  const stakeMutation = useMutation({
    mutationFn: async ({ amount, days }: { amount: number; days: number }) => {
      return apiRequest("POST", "/api/staking/stake", { amount, days });
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/staking/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setStakeModalVisible(false);
      setStakeAmount("");
    },
    onError: (error: any) => {
      Alert.alert("Staking Failed", error.message || "Failed to stake coins");
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (stakeId: string) => {
      return apiRequest("POST", `/api/staking/${stakeId}/claim`);
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/staking/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      Alert.alert(
        "Rewards Claimed!",
        "Your staked coins and bonus have been added to your wallet.",
        [{ text: "OK" }]
      );
    },
    onError: (error: any) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        "Claim Failed",
        error.message || "Failed to claim your staked coins. Please try again."
      );
    },
  });

  const handleStakeTier = (tier: StakingTier) => {
    setSelectedTier(tier);
    setStakeModalVisible(true);
  };

  const handleConfirmStake = () => {
    const amount = parseInt(stakeAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to stake");
      return;
    }
    if (amount < MINIMUM_STAKE_AMOUNT) {
      Alert.alert(
        "Minimum Stake Required",
        `The minimum stake amount is ${MINIMUM_STAKE_AMOUNT.toLocaleString()} coins`
      );
      return;
    }
    const coinBalance = wallet?.coinBalance || 0;
    if (amount > coinBalance) {
      Alert.alert(
        "Insufficient Balance",
        `You only have ${coinBalance.toLocaleString()} coins available to stake`
      );
      return;
    }
    if (selectedTier) {
      Alert.alert(
        "Confirm Stake",
        `Are you sure you want to stake ${amount.toLocaleString()} coins for ${selectedTier.label}?\n\nExpected return: ${expectedReturn.toLocaleString()} coins (+${selectedTier.bonusPercent}% bonus)`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Stake",
            onPress: () => stakeMutation.mutate({ amount, days: selectedTier.days }),
          },
        ]
      );
    }
  };

  const handleClaimStake = (stakeId: string) => {
    const stake = activeStakes.find((s) => s.id === stakeId);
    if (!stake) return;

    const expectedAmount = Math.floor(stake.amount * (1 + stake.bonusPercent / 100));

    Alert.alert(
      "Claim Rewards",
      `Are you sure you want to claim your staked coins?\n\nYou will receive ${expectedAmount.toLocaleString()} coins (original ${stake.amount.toLocaleString()} + ${stake.bonusPercent}% bonus)`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            claimMutation.mutate(stakeId);
          },
        },
      ]
    );
  };

  const expectedReturn = selectedTier && stakeAmount
    ? Math.floor(parseInt(stakeAmount, 10) * (1 + selectedTier.bonusPercent / 100))
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
        <Animated.View entering={FadeInUp.springify()}>
          <Card variant="glass" style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View>
                <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                  Available to Stake
                </ThemedText>
                <ThemedText style={[styles.balanceValue, { color: theme.text }]}>
                  {(wallet?.coinBalance || 0).toLocaleString()} coins
                </ThemedText>
              </View>
              <Feather name="lock" size={32} color={theme.primary} />
            </View>
          </Card>
        </Animated.View>

        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Staking Tiers
        </ThemedText>

        <View style={styles.tiersContainer}>
          {STAKING_TIERS.map((tier, index) => (
            <StakingTierCard
              key={tier.days}
              tier={tier}
              onStake={handleStakeTier}
              index={index}
            />
          ))}
        </View>

        {activeStakes.length > 0 ? (
          <>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Active Stakes ({activeStakes.length})
            </ThemedText>
            {activeStakes.map((stake) => (
              <ActiveStakeCard
                key={stake.id}
                stake={stake}
                onClaim={handleClaimStake}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={stakeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setStakeModalVisible(false)}
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
                Stake Coins
              </ThemedText>
              <Pressable onPress={() => setStakeModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedTier ? (
              <>
                <View style={styles.selectedTierInfo}>
                  <ThemedText style={[styles.selectedTierLabel, { color: theme.textSecondary }]}>
                    Duration: {selectedTier.label} ({selectedTier.days} days)
                  </ThemedText>
                  <ThemedText style={[styles.selectedTierBonus, { color: theme.success }]}>
                    +{selectedTier.bonusPercent}% bonus
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
                  placeholder="Enter amount to stake"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="number-pad"
                  value={stakeAmount}
                  onChangeText={setStakeAmount}
                />

                {stakeAmount && !isNaN(parseInt(stakeAmount, 10)) ? (
                  <View style={styles.expectedReturn}>
                    <ThemedText style={[styles.returnLabel, { color: theme.textSecondary }]}>
                      Expected Return:
                    </ThemedText>
                    <ThemedText style={[styles.returnValue, { color: theme.gold }]}>
                      {expectedReturn.toLocaleString()} coins
                    </ThemedText>
                  </View>
                ) : null}

                <Pressable
                  onPress={handleConfirmStake}
                  disabled={stakeMutation.isPending}
                  style={[styles.confirmButton, { opacity: stakeMutation.isPending ? 0.6 : 1 }]}
                >
                  <LinearGradient
                    colors={Gradients.primary}
                    style={styles.confirmGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {stakeMutation.isPending ? (
                      <InlineLoader size={20} />
                    ) : (
                      <ThemedText style={styles.confirmText}>Confirm Stake</ThemedText>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            ) : null}
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
  balanceCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  tiersContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  tierCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  tierIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  tierInfo: {
    flex: 1,
  },
  tierLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  tierDays: {
    fontSize: 14,
  },
  tierBonus: {
    alignItems: "flex-end",
  },
  bonusPercent: {
    fontSize: 20,
    fontWeight: "700",
  },
  bonusLabel: {
    fontSize: 12,
  },
  stakeCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  stakeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  stakeAmount: {},
  stakeCoins: {
    fontSize: 24,
    fontWeight: "700",
  },
  stakeLabel: {
    fontSize: 14,
  },
  stakeStatus: {},
  countdownText: {
    fontSize: 16,
    fontWeight: "600",
  },
  maturedBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  maturedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  stakeDetails: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.md,
  },
  stakeDetail: {},
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  claimButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  claimGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  claimText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
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
  selectedTierInfo: {
    marginBottom: Spacing.lg,
  },
  selectedTierLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  selectedTierBonus: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  expectedReturn: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  returnLabel: {
    fontSize: 14,
  },
  returnValue: {
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
