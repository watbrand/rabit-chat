import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

export default function DataAccountScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { logout } = useAuth();

  const [deletePassword, setDeletePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/me/export");
    },
    onSuccess: (data: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Export Ready",
        `Your data export includes:\n\n- Profile information\n- ${data.postCount} posts\n- Settings\n\nExported at: ${new Date(data.exportedAt).toLocaleString()}`,
        [{ text: "OK" }]
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to export data");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/me/deactivate");
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Account Deactivated", "Your account has been deactivated.", [
        { text: "OK", onPress: () => logout() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to deactivate account");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/me", { password: deletePassword });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Account Deleted", "Your account has been permanently deleted.", [
        { text: "OK", onPress: () => logout() },
      ]);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to delete account");
    },
  });

  const handleExport = () => {
    Alert.alert(
      "Export Your Data",
      "This will generate a summary of your profile and posts. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => exportMutation.mutate() },
      ]
    );
  };

  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Account",
      "Your account will be hidden from others. You can reactivate it by signing in again. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => deactivateMutation.mutate(),
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!deletePassword) {
      Alert.alert("Error", "Please enter your password to confirm deletion");
      return;
    }
    Alert.alert(
      "Delete Account",
      "This action is PERMANENT and cannot be undone. All your data will be permanently deleted. Are you absolutely sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Your Data
        </ThemedText>
        <Pressable
          style={[
            styles.actionRow,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
          onPress={handleExport}
          disabled={exportMutation.isPending}
        >
          <View style={styles.actionInfo}>
            <Feather name="download" size={24} color={theme.text} />
            <View style={styles.actionText}>
              <ThemedText style={styles.actionLabel}>Export Data</ThemedText>
              <ThemedText style={[styles.actionDescription, { color: theme.textSecondary }]}>
                Download a copy of your profile and posts
              </ThemedText>
            </View>
          </View>
          {exportMutation.isPending ? (
            <LoadingIndicator size="small" />
          ) : (
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Account Actions
        </ThemedText>
        <Pressable
          style={[
            styles.actionRow,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
          onPress={handleDeactivate}
          disabled={deactivateMutation.isPending}
        >
          <View style={styles.actionInfo}>
            <Feather name="pause-circle" size={24} color="#F59E0B" />
            <View style={styles.actionText}>
              <ThemedText style={styles.actionLabel}>Deactivate Account</ThemedText>
              <ThemedText style={[styles.actionDescription, { color: theme.textSecondary }]}>
                Temporarily hide your account
              </ThemedText>
            </View>
          </View>
          {deactivateMutation.isPending ? (
            <LoadingIndicator size="small" />
          ) : (
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          )}
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.error }]}>
          Danger Zone
        </ThemedText>
        <View
          style={[
            styles.deleteContainer,
            { backgroundColor: theme.error + "10", borderColor: theme.error + "40" },
          ]}
        >
          <View style={styles.deleteWarning}>
            <Feather name="alert-triangle" size={24} color={theme.error} />
            <ThemedText style={[styles.deleteWarningText, { color: theme.error }]}>
              This will permanently delete your account and all associated data
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Confirm with Password</ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: theme.error + "40", backgroundColor: theme.backgroundRoot },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.deleteButton, { backgroundColor: theme.error }]}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="trash-2" size={18} color="#FFFFFF" />
                <ThemedText style={styles.deleteButtonText}>Delete Account Forever</ThemedText>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  deleteWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  deleteWarningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: "row",
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
