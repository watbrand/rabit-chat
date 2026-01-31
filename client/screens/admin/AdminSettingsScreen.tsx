import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  Switch,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LoadingIndicator } from "@/components/animations";
import { EmptyState } from "@/components/EmptyState";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { AppSetting } from "@shared/schema";

interface SettingConfig {
  key: string;
  type: "boolean" | "number" | "string";
  defaultValue: string;
  displayName: string;
  description: string;
  icon: string;
  dangerous?: boolean;
}

interface AdminAction {
  key: string;
  displayName: string;
  description: string;
  icon: string;
  dangerous?: boolean;
}

const ADMIN_ACTIONS: AdminAction[] = [
  {
    key: "seedMall",
    displayName: "Seed Mall Items",
    description: "Populate the Mall with 40+ luxury items across 10 categories. Only needed once.",
    icon: "shopping-bag",
  },
  {
    key: "resetUserNetWorth",
    displayName: "Reset User Net Worth",
    description: "Reset a specific user's net worth to R0. Enter their username.",
    icon: "trending-down",
    dangerous: true,
  },
];

const SETTINGS_CONFIG: SettingConfig[] = [
  {
    key: "maintenanceMode",
    type: "boolean",
    defaultValue: "false",
    displayName: "Maintenance Mode",
    description: "When enabled, only admins can access the app. All other users will see a maintenance message.",
    icon: "tool",
    dangerous: true,
  },
  {
    key: "signupEnabled",
    type: "boolean",
    defaultValue: "true",
    displayName: "Allow Signups",
    description: "Allow new users to register. Disable to prevent new account creation.",
    icon: "user-plus",
  },
  {
    key: "chatEnabled",
    type: "boolean",
    defaultValue: "true",
    displayName: "Enable Chat",
    description: "Allow users to send and receive messages. Admins can always access chat.",
    icon: "message-circle",
  },
  {
    key: "maxPostLength",
    type: "number",
    defaultValue: "500",
    displayName: "Max Post Length",
    description: "Maximum number of characters allowed per post (50-5000).",
    icon: "edit-3",
  },
];

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SettingConfig | null>(null);
  const [editValue, setEditValue] = useState("");
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  const {
    data: settings,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<AppSetting[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/settings", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      for (const s of settings) {
        map[s.key] = s.value || "";
      }
      for (const config of SETTINGS_CONFIG) {
        if (!map[config.key]) {
          map[config.key] = config.defaultValue;
        }
      }
      setLocalSettings(map);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Array<{ key: string; value: string | number | boolean; type: string }>) => {
      await apiRequest("PATCH", "/api/admin/settings", { settings: updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/flags"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update setting");
      refetch();
    },
  });

  const seedMallMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/mall/seed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mall"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `Created ${data.categoriesCreated} categories and ${data.itemsCreated} items`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to seed mall");
    },
  });

  const resetNetWorthMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", `/api/admin/users/by-username/${username}/reset-networth`);
      return res.json();
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `Reset ${data.username} net worth from R${data.oldNetWorth?.toLocaleString() || 0} to R0`);
      setShowUsernameModal(false);
      setUsernameInput("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to reset net worth");
    },
  });

  const handleAdminAction = (action: AdminAction) => {
    if (action.key === "seedMall") {
      Alert.alert(
        "Seed Mall",
        "This will populate the Mall with 40+ luxury items. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Seed Mall", onPress: () => seedMallMutation.mutate() },
        ]
      );
    } else if (action.key === "resetUserNetWorth") {
      setShowUsernameModal(true);
    }
  };

  const getSettingValue = (key: string, defaultValue: string): string => {
    return localSettings[key] ?? defaultValue;
  };

  const handleBooleanToggle = (config: SettingConfig) => {
    const currentValue = getSettingValue(config.key, config.defaultValue) === "true";
    const newValue = !currentValue;

    if (config.dangerous && newValue) {
      Alert.alert(
        "Warning",
        `Enabling ${config.displayName} will affect all users. Are you sure?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable",
            style: "destructive",
            onPress: () => toggleSetting(config.key, newValue),
          },
        ]
      );
    } else {
      toggleSetting(config.key, newValue);
    }
  };

  const toggleSetting = (key: string, value: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: String(value) }));
    updateSettingsMutation.mutate([{ key, value, type: "boolean" }]);
  };

  const openEditModal = (config: SettingConfig) => {
    setEditingSetting(config);
    setEditValue(getSettingValue(config.key, config.defaultValue));
    setShowEditModal(true);
  };

  const handleSaveNumber = () => {
    if (!editingSetting) return;
    
    const numValue = parseInt(editValue, 10);
    if (isNaN(numValue)) {
      Alert.alert("Error", "Please enter a valid number");
      return;
    }

    if (editingSetting.key === "maxPostLength") {
      if (numValue < 50 || numValue > 5000) {
        Alert.alert("Error", "Post length must be between 50 and 5000");
        return;
      }
    }

    setLocalSettings((prev) => ({ ...prev, [editingSetting.key]: String(numValue) }));
    updateSettingsMutation.mutate([{ key: editingSetting.key, value: numValue, type: "number" }]);
    setShowEditModal(false);
    setEditingSetting(null);
  };

  const renderSettingItem = ({ item }: { item: SettingConfig }) => {
    const isBoolean = item.type === "boolean";
    const currentValue = getSettingValue(item.key, item.defaultValue);
    const boolValue = currentValue === "true";

    return (
      <Card elevation={1} style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
            <Feather name={item.icon as any} size={20} color={theme.primary} />
          </View>
          <View style={styles.settingInfo}>
            <View style={styles.settingNameRow}>
              <ThemedText type="body" style={styles.settingName}>
                {item.displayName}
              </ThemedText>
              {item.dangerous ? (
                <View style={[styles.dangerBadge, { backgroundColor: `${theme.error}20` }]}>
                  <ThemedText style={[styles.dangerText, { color: theme.error }]}>
                    Caution
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
              {item.description}
            </ThemedText>
          </View>
        </View>

        <View style={styles.settingControl}>
          {isBoolean ? (
            <View style={styles.toggleRow}>
              <ThemedText style={[styles.toggleLabel, { color: boolValue ? theme.primary : theme.textSecondary }]}>
                {boolValue ? "Enabled" : "Disabled"}
              </ThemedText>
              <Switch
                value={boolValue}
                onValueChange={() => handleBooleanToggle(item)}
                trackColor={{ false: theme.glassBackground, true: `${theme.primary}80` }}
                thumbColor={boolValue ? theme.primary : "#f4f3f4"}
                disabled={updateSettingsMutation.isPending}
              />
            </View>
          ) : (
            <Pressable
              onPress={() => openEditModal(item)}
              style={[styles.valueButton, { backgroundColor: theme.glassBackground, borderColor: `${theme.primary}30` }]}
            >
              <ThemedText style={styles.valueText}>{currentValue}</ThemedText>
              <Feather name="edit-2" size={14} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </Card>
    );
  };

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowEditModal(false)}>
            <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
          </Pressable>
          <ThemedText type="h4">Edit Setting</ThemedText>
          <Pressable
            onPress={handleSaveNumber}
            disabled={updateSettingsMutation.isPending}
          >
            <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>Save</ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {editingSetting ? (
            <View style={styles.formGroup}>
              <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                {editingSetting.displayName}
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: `${theme.primary}30` }]}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="number-pad"
                placeholder="Enter value"
                placeholderTextColor={theme.textSecondary}
              />
              <ThemedText style={[styles.formHint, { color: theme.textSecondary }]}>
                {editingSetting.description}
              </ThemedText>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
        <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        data={SETTINGS_CONFIG}
        keyExtractor={(item) => item.key}
        renderItem={renderSettingItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon="sliders"
            title="No settings configured"
            message="Settings will appear here when available"
          />
        }
        ListHeaderComponent={
          <Card elevation={1} style={styles.infoCard}>
            <Feather name="sliders" size={20} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Configure feature flags and app behavior. Changes take effect immediately for all users.
            </ThemedText>
          </Card>
        }
        ListFooterComponent={
          <View style={styles.actionsSection}>
            <ThemedText type="h4" style={styles.sectionTitle}>Admin Actions</ThemedText>
            {ADMIN_ACTIONS.map((action) => (
              <Card key={action.key} elevation={1} style={styles.settingCard}>
                <View style={styles.settingHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: action.dangerous ? `${theme.error}15` : `${theme.primary}15` }]}>
                    <Feather name={action.icon as any} size={20} color={action.dangerous ? theme.error : theme.primary} />
                  </View>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingNameRow}>
                      <ThemedText type="body" style={styles.settingName}>
                        {action.displayName}
                      </ThemedText>
                      {action.dangerous ? (
                        <View style={[styles.dangerBadge, { backgroundColor: `${theme.error}20` }]}>
                          <ThemedText style={[styles.dangerText, { color: theme.error }]}>
                            Caution
                          </ThemedText>
                        </View>
                      ) : null}
                    </View>
                    <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                      {action.description}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.settingControl}>
                  <Pressable
                    onPress={() => handleAdminAction(action)}
                    style={[
                      styles.actionButton,
                      { 
                        backgroundColor: action.dangerous ? `${theme.error}20` : `${theme.primary}20`,
                        borderColor: action.dangerous ? theme.error : theme.primary,
                      }
                    ]}
                    disabled={seedMallMutation.isPending || resetNetWorthMutation.isPending}
                  >
                    {(seedMallMutation.isPending && action.key === "seedMall") || 
                     (resetNetWorthMutation.isPending && action.key === "resetUserNetWorth") ? (
                      <LoadingIndicator size="small" />
                    ) : (
                      <ThemedText style={{ color: action.dangerous ? theme.error : theme.primary, fontWeight: "600" }}>
                        Run Action
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

      {renderEditModal()}
      
      <Modal
        visible={showUsernameModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUsernameModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowUsernameModal(false)}>
              <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="h4">Reset Net Worth</ThemedText>
            <Pressable
              onPress={() => {
                if (usernameInput.trim()) {
                  Alert.alert(
                    "Confirm Reset",
                    `Reset @${usernameInput.trim()}'s net worth to R0?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Reset", style: "destructive", onPress: () => resetNetWorthMutation.mutate(usernameInput.trim()) },
                    ]
                  );
                }
              }}
              disabled={resetNetWorthMutation.isPending || !usernameInput.trim()}
            >
              <ThemedText style={{ color: usernameInput.trim() ? theme.error : theme.textSecondary, fontWeight: "600" }}>Reset</ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                Username
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: `${theme.primary}30` }]}
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="Enter username (without @)"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ThemedText style={[styles.formHint, { color: theme.error }]}>
                This will permanently reset the user's net worth to R0.
              </ThemedText>
            </View>
          </ScrollView>
        </View>
      </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  settingCard: {
    padding: Spacing.lg,
  },
  settingHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  settingName: {
    fontWeight: "600",
  },
  dangerBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  dangerText: {
    fontSize: 10,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingControl: {
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
    paddingTop: Spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  valueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  valueText: {
    fontWeight: "600",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.15)",
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formHint: {
    fontSize: 12,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 18,
    fontWeight: "600",
  },
  actionsSection: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
