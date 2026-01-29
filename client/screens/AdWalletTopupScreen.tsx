import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

const TOPUP_OPTIONS = [
  { amount: 100, label: "R100" },
  { amount: 250, label: "R250" },
  { amount: 500, label: "R500" },
  { amount: 1000, label: "R1,000" },
  { amount: 2500, label: "R2,500" },
  { amount: 5000, label: "R5,000" },
];

export default function AdWalletTopupScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [selectedAmount, setSelectedAmount] = useState(TOPUP_OPTIONS[2]);
  const [customAmount, setCustomAmount] = useState("");
  const [promoCode, setPromoCode] = useState("");

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["/api/ads/wallet"],
  });

  type PaymentResponse = {
    transactionId: string;
    paymentUrl: string;
    paymentData: any;
    topup: {
      amount: number;
      amountRands: number;
    };
  };

  const topupMutation = useMutation({
    mutationFn: async () => {
      const amountInRands = customAmount ? parseInt(customAmount) : selectedAmount.amount;
      const amountInCents = amountInRands * 100;
      const response = await apiRequest("POST", "/api/ads/wallet/payfast/create", {
        amount: amountInCents,
        promoCode: promoCode || undefined,
      });
      return (await response.json()) as PaymentResponse;
    },
    onSuccess: (data: PaymentResponse) => {
      if (data.paymentUrl && data.paymentData) {
        // Navigate to in-app checkout screen (same pattern as mall)
        navigation.navigate("AdWalletCheckout", {
          transactionId: data.transactionId,
          paymentUrl: data.paymentUrl,
          paymentData: data.paymentData,
          topup: data.topup,
        });
      }
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to initiate payment");
    },
  });

  const redeemPromoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ads/wallet/redeem-promo", {
        code: promoCode,
      });
      return (await response.json()) as { amount: number };
    },
    onSuccess: (data: { amount: number }) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success!", `R${(data.amount / 100).toFixed(2)} has been added to your wallet!`);
      setPromoCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/ads/wallet"] });
    },
    onError: (error: any) => {
      Alert.alert("Invalid Code", error.message || "This promo code is invalid or has expired.");
    },
  });

  const walletBalance = ((walletData as any)?.balance || 0) / 100;
  const topupAmount = customAmount ? parseInt(customAmount) : selectedAmount.amount;

  const handleTopup = () => {
    if (topupAmount < 50) {
      Alert.alert("Minimum Amount", "Minimum top-up amount is R50");
      return;
    }
    topupMutation.mutate();
  };

  const handleRedeemPromo = () => {
    if (!promoCode.trim()) {
      Alert.alert("Enter Code", "Please enter a promo code");
      return;
    }
    redeemPromoMutation.mutate();
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="headline" style={styles.title}>Add Funds</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.balanceCard, { backgroundColor: theme.backgroundSecondary }]}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
            <ThemedText type="largeTitle" style={styles.balanceAmount}>
              R{walletBalance.toFixed(2)}
            </ThemedText>
            <Feather name="credit-card" size={40} color="rgba(255,255,255,0.3)" style={styles.balanceIcon} />
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <ThemedText type="title3" style={styles.sectionTitle}>Select Amount</ThemedText>
          <View style={styles.amountGrid}>
            {TOPUP_OPTIONS.map((option) => (
              <Pressable
                key={option.amount}
                style={[
                  styles.amountOption,
                  {
                    backgroundColor: selectedAmount.amount === option.amount
                      ? theme.primary
                      : theme.backgroundSecondary,
                    borderColor: selectedAmount.amount === option.amount
                      ? theme.primary
                      : theme.glassBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedAmount(option);
                  setCustomAmount("");
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <ThemedText
                  weight="bold"
                  style={{
                    color: selectedAmount.amount === option.amount ? "#FFFFFF" : theme.text,
                    fontSize: 18,
                  }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.customAmountCard, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText weight="semiBold">Custom Amount</ThemedText>
          <View style={[styles.customInputContainer, { borderColor: theme.glassBorder }]}>
            <ThemedText style={styles.currencyPrefix}>R</ThemedText>
            <TextInput
              style={[styles.customInput, { color: theme.text }]}
              placeholder="Enter amount"
              placeholderTextColor={theme.textTertiary}
              keyboardType="number-pad"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text.replace(/[^0-9]/g, ""));
              }}
            />
          </View>
          <ThemedText style={[styles.minAmount, { color: theme.textSecondary }]}>
            Minimum: R50
          </ThemedText>
        </View>

        <View style={[styles.promoCard, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.promoHeader}>
            <Feather name="gift" size={20} color={theme.primary} />
            <ThemedText weight="semiBold">Have a Promo Code?</ThemedText>
          </View>
          <View style={styles.promoInputRow}>
            <TextInput
              style={[
                styles.promoInput,
                { 
                  color: theme.text, 
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  borderColor: theme.glassBorder,
                },
              ]}
              placeholder="Enter code"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="characters"
              value={promoCode}
              onChangeText={setPromoCode}
            />
            <Pressable
              style={[styles.redeemButton, { backgroundColor: theme.primary }]}
              onPress={handleRedeemPromo}
              disabled={redeemPromoMutation.isPending}
            >
              {redeemPromoMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <ThemedText weight="semiBold" style={{ color: "#FFFFFF" }}>
                  Redeem
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: `${theme.primary}15` }]}>
          <Feather name="shield" size={20} color={theme.primary} />
          <View style={styles.infoContent}>
            <ThemedText weight="semiBold">Secure Payment</ThemedText>
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Payments are processed securely via PayFast. Your financial information is never stored on our servers.
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.summaryRow}>
          <ThemedText style={{ color: theme.textSecondary }}>Amount to add:</ThemedText>
          <ThemedText type="title1" style={{ color: theme.primary }}>
            R{topupAmount || 0}
          </ThemedText>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.payButton,
            pressed && { opacity: 0.9 },
          ]}
          onPress={handleTopup}
          disabled={topupMutation.isPending || topupAmount < 50}
        >
          <LinearGradient
            colors={topupAmount >= 50 ? Gradients.primary : ["#6B7280", "#4B5563"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButtonGradient}
          >
            {topupMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="credit-card" size={20} color="#FFFFFF" />
                <ThemedText weight="bold" style={styles.payButtonText}>
                  Pay with PayFast
                </ThemedText>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  balanceCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  balanceGradient: {
    padding: Spacing.xl,
    alignItems: "center",
    position: "relative",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 42,
  },
  balanceIcon: {
    position: "absolute",
    right: Spacing.lg,
    top: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  amountOption: {
    flex: 1,
    minWidth: "30%",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
  },
  customAmountCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  customInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: Spacing.sm,
  },
  customInput: {
    flex: 1,
    fontSize: 18,
    paddingVertical: Spacing.md,
  },
  minAmount: {
    fontSize: 12,
  },
  promoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  promoInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  promoInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  redeemButton: {
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
  },
  infoCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  payButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
