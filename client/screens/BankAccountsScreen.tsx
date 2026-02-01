import React, { useState } from "react";
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
import Haptics from "@/lib/safeHaptics";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { GlassButton } from "@/components/GlassButton";
import { GlassInput } from "@/components/GlassInput";
import { Card } from "@/components/Card";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchCode?: string;
  accountType: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

const SA_BANKS = [
  "ABSA",
  "Standard Bank",
  "FNB (First National Bank)",
  "Nedbank",
  "Capitec Bank",
  "Investec",
  "African Bank",
  "TymeBank",
  "Discovery Bank",
  "Bank Zero",
  "Bidvest Bank",
  "Grindrod Bank",
];

const ACCOUNT_TYPES = ["Savings", "Current", "Transmission"];

export default function BankAccountsScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    branchCode: "",
    accountType: "Savings",
    accountHolderName: "",
  });

  const { data: accounts = [], isLoading, refetch } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  const addAccountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/bank-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setShowAddModal(false);
      resetForm();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to add bank account");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("DELETE", `/api/bank-accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setDeleteConfirmId(null);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to delete bank account");
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await apiRequest("PATCH", `/api/bank-accounts/${accountId}/primary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to set primary account");
    },
  });

  const resetForm = () => {
    setFormData({
      bankName: "",
      accountNumber: "",
      branchCode: "",
      accountType: "Savings",
      accountHolderName: "",
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    return "*".repeat(accountNumber.length - 4) + lastFour;
  };

  const handleSubmit = () => {
    if (!formData.bankName) {
      Alert.alert("Error", "Please select a bank");
      return;
    }
    if (!formData.accountNumber || formData.accountNumber.length < 8) {
      Alert.alert("Error", "Please enter a valid account number");
      return;
    }
    if (!formData.accountHolderName) {
      Alert.alert("Error", "Please enter the account holder name");
      return;
    }
    addAccountMutation.mutate(formData);
  };

  const handleDelete = (accountId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setDeleteConfirmId(accountId);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteAccountMutation.mutate(deleteConfirmId);
    }
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
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <ThemedText type="title2" style={styles.title}>Bank Accounts</ThemedText>
          <ThemedText type="subhead" style={{ color: theme.textSecondary }}>
            Manage your bank accounts for withdrawals
          </ThemedText>
        </View>

        {accounts.length === 0 ? (
          <Card variant="glass" style={styles.emptyCard}>
            <Feather name="credit-card" size={48} color={theme.textSecondary} />
            <ThemedText type="headline" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
              No Bank Accounts
            </ThemedText>
            <ThemedText type="subhead" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              Add a bank account to start withdrawing your earnings
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.accountsList}>
            {accounts.map((account) => (
              <Card key={account.id} variant="glass" style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.accountInfo}>
                    <View style={styles.bankNameRow}>
                      <ThemedText type="headline">{account.bankName}</ThemedText>
                      {account.isPrimary ? (
                        <View style={[styles.primaryBadge, { backgroundColor: theme.gold + "30" }]}>
                          <Feather name="star" size={12} color={theme.gold} />
                          <Text style={[styles.primaryText, { color: theme.gold }]}>Primary</Text>
                        </View>
                      ) : null}
                    </View>
                    <ThemedText type="subhead" style={{ color: theme.textSecondary, marginTop: 2 }}>
                      {maskAccountNumber(account.accountNumber)}
                    </ThemedText>
                    <View style={styles.accountMeta}>
                      <Text style={[styles.accountType, { color: theme.textTertiary }]}>
                        {account.accountType}
                      </Text>
                      <Text style={[styles.separator, { color: theme.textTertiary }]}>•</Text>
                      <Text style={[styles.holderName, { color: theme.textTertiary }]}>
                        {account.accountHolderName}
                      </Text>
                    </View>
                  </View>
                  {account.isVerified ? (
                    <View style={[styles.verifiedBadge, { backgroundColor: theme.success + "20" }]}>
                      <Feather name="check-circle" size={14} color={theme.success} />
                    </View>
                  ) : null}
                </View>

                <View style={styles.accountActions}>
                  {!account.isPrimary ? (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: theme.primary + "20" }]}
                      onPress={() => setPrimaryMutation.mutate(account.id)}
                      disabled={setPrimaryMutation.isPending}
                    >
                      <Feather name="star" size={16} color={theme.primary} />
                      <Text style={[styles.actionText, { color: theme.primary }]}>Set Primary</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.error + "20" }]}
                    onPress={() => handleDelete(account.id)}
                  >
                    <Feather name="trash-2" size={16} color={theme.error} />
                    <Text style={[styles.actionText, { color: theme.error }]}>Delete</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}

        <GlassButton
          title="Add Bank Account"
          icon="plus"
          variant="gradient"
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
          fullWidth
          glowEffect
        />

        <Card variant="glass" style={styles.ficaNotice}>
          <View style={styles.ficaHeader}>
            <Feather name="shield" size={20} color={theme.warning} />
            <ThemedText type="headline" style={{ marginLeft: Spacing.sm }}>FICA Compliance</ThemedText>
          </View>
          <ThemedText type="subhead" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
            In accordance with the Financial Intelligence Centre Act (FICA), all bank accounts must be verified 
            before withdrawals can be processed. Please ensure your KYC verification is complete and your bank 
            details match your verified identity.
          </ThemedText>
        </Card>
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElevated }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title3">Add Bank Account</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Pressable
                style={[styles.pickerButton, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderColor: theme.border }]}
                onPress={() => setShowBankPicker(true)}
              >
                <ThemedText style={{ color: formData.bankName ? theme.text : theme.textTertiary }}>
                  {formData.bankName || "Select Bank"}
                </ThemedText>
                <Feather name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              <GlassInput
                label="Account Number"
                placeholder="Enter account number"
                value={formData.accountNumber}
                onChangeText={(text) => setFormData({ ...formData, accountNumber: text.replace(/\D/g, "") })}
                keyboardType="numeric"
                maxLength={20}
              />

              <GlassInput
                label="Branch Code"
                placeholder="Enter branch code (optional)"
                value={formData.branchCode}
                onChangeText={(text) => setFormData({ ...formData, branchCode: text.replace(/\D/g, "") })}
                keyboardType="numeric"
                maxLength={10}
              />

              <Pressable
                style={[styles.pickerButton, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderColor: theme.border }]}
                onPress={() => setShowTypePicker(true)}
              >
                <View>
                  <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>Account Type</Text>
                  <ThemedText>{formData.accountType}</ThemedText>
                </View>
                <Feather name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              <GlassInput
                label="Account Holder Name"
                placeholder="Enter account holder name"
                value={formData.accountHolderName}
                onChangeText={(text) => setFormData({ ...formData, accountHolderName: text })}
                autoCapitalize="words"
              />

              <GlassButton
                title={addAccountMutation.isPending ? "Adding..." : "Add Account"}
                variant="gradient"
                onPress={handleSubmit}
                loading={addAccountMutation.isPending}
                disabled={addAccountMutation.isPending}
                fullWidth
                style={{ marginTop: Spacing.lg }}
                glowEffect
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showBankPicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.pickerModal, { backgroundColor: theme.backgroundElevated }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title3">Select Bank</ThemedText>
              <Pressable onPress={() => setShowBankPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerList}>
              {SA_BANKS.map((bank) => (
                <Pressable
                  key={bank}
                  style={[styles.pickerItem, formData.bankName === bank && { backgroundColor: theme.primary + "20" }]}
                  onPress={() => {
                    setFormData({ ...formData, bankName: bank });
                    setShowBankPicker(false);
                  }}
                >
                  <ThemedText>{bank}</ThemedText>
                  {formData.bankName === bank ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showTypePicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.pickerModal, { backgroundColor: theme.backgroundElevated }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title3">Account Type</ThemedText>
              <Pressable onPress={() => setShowTypePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerList}>
              {ACCOUNT_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.pickerItem, formData.accountType === type && { backgroundColor: theme.primary + "20" }]}
                  onPress={() => {
                    setFormData({ ...formData, accountType: type });
                    setShowTypePicker(false);
                  }}
                >
                  <ThemedText>{type}</ThemedText>
                  {formData.accountType === type ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteConfirmId !== null} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.confirmModal, { backgroundColor: theme.backgroundElevated }]}>
            <Feather name="alert-triangle" size={48} color={theme.error} />
            <ThemedText type="title3" style={{ marginTop: Spacing.lg, textAlign: "center" }}>
              Delete Bank Account?
            </ThemedText>
            <ThemedText type="subhead" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              This action cannot be undone. Any pending withdrawals to this account will be cancelled.
            </ThemedText>
            <View style={styles.confirmActions}>
              <GlassButton
                title="Cancel"
                variant="secondary"
                onPress={() => setDeleteConfirmId(null)}
                style={{ flex: 1, marginRight: Spacing.sm }}
              />
              <GlassButton
                title={deleteAccountMutation.isPending ? "Deleting..." : "Delete"}
                variant="danger"
                onPress={confirmDelete}
                loading={deleteAccountMutation.isPending}
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
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
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  accountsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  accountCard: {
    padding: Spacing.lg,
  },
  accountHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  accountInfo: {
    flex: 1,
  },
  bankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  primaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  primaryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  accountMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  accountType: {
    fontSize: 13,
  },
  separator: {
    marginHorizontal: 6,
    fontSize: 13,
  },
  holderName: {
    fontSize: 13,
  },
  verifiedBadge: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  accountActions: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  addButton: {
    marginBottom: Spacing.xl,
  },
  ficaNotice: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  ficaHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalForm: {
    maxHeight: 500,
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
  pickerLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  pickerModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "70%",
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
  confirmModal: {
    margin: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
  },
  confirmActions: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    width: "100%",
  },
});
