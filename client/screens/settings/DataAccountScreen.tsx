import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform, FlatList, Linking } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface DataExportRequest {
  id: string;
  userId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  includeProfile: boolean;
  includePosts: boolean;
  includeMessages: boolean;
  includeMedia: boolean;
  downloadUrl: string | null;
  expiresAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function DataAccountScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeProfile: true,
    includePosts: true,
    includeMessages: true,
    includeMedia: false,
  });

  const { data: exportHistory = [], isLoading: isLoadingHistory } = useQuery<DataExportRequest[]>({
    queryKey: ["/api/data-export"],
    staleTime: 30000,
  });

  const createExportMutation = useMutation({
    mutationFn: async (options: typeof exportOptions): Promise<DataExportRequest> => {
      const response = await apiRequest("POST", "/api/data-export", options);
      return response.json();
    },
    onSuccess: (data: DataExportRequest) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/data-export"] });
      setShowExportOptions(false);
      
      if (data.status === "PENDING" || data.status === "PROCESSING") {
        Alert.alert(
          "Export Requested",
          "We're preparing your data export. This may take a few minutes depending on the amount of data. You'll receive a notification when it's ready.",
          [{ text: "OK" }]
        );
      } else if (data.status === "COMPLETED" && data.downloadUrl) {
        Alert.alert(
          "Export Ready",
          "Your data export is ready for download.",
          [
            { text: "Later" },
            { text: "Download Now", onPress: () => handleDownload(data) },
          ]
        );
      }
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Export Failed",
        error.message || "We couldn't process your data export request. Please try again later.",
        [{ text: "OK" }]
      );
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to deactivate account. Please try again.");
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
      Alert.alert("Error", error.message || "Failed to delete account. Please try again.");
    },
  });

  const handleDownload = useCallback(async (exportRequest: DataExportRequest) => {
    if (!exportRequest.downloadUrl) {
      Alert.alert("Error", "Download link is not available");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (Platform.OS === "web") {
        Linking.openURL(exportRequest.downloadUrl);
        return;
      }

      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        const filename = `rabitchat-export-${new Date(exportRequest.createdAt).toISOString().split('T')[0]}.json`;
        const localUri = FileSystem.documentDirectory + filename;
        
        Alert.alert(
          "Downloading...",
          "Please wait while we prepare your export file."
        );

        const downloadResult = await FileSystem.downloadAsync(
          exportRequest.downloadUrl,
          localUri
        );

        if (downloadResult.status === 200) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: "application/json",
            dialogTitle: "Save your RabitChat data export",
          });
        } else {
          throw new Error("Download failed");
        }
      } else {
        Linking.openURL(exportRequest.downloadUrl);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Download Failed",
        "We couldn't download your export. Would you like to open it in your browser instead?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open in Browser", onPress: () => Linking.openURL(exportRequest.downloadUrl!) },
        ]
      );
    }
  }, []);

  const handleExport = () => {
    const hasPendingExport = exportHistory.some(
      (e) => e.status === "PENDING" || e.status === "PROCESSING"
    );

    if (hasPendingExport) {
      Alert.alert(
        "Export in Progress",
        "You already have a data export in progress. Please wait for it to complete before requesting a new one.",
        [{ text: "OK" }]
      );
      return;
    }

    setShowExportOptions(true);
  };

  const confirmExport = () => {
    Alert.alert(
      "Request Data Export",
      "This will create a downloadable copy of your selected data. Depending on the amount of data, this may take several minutes.\n\nYou'll receive a notification when your export is ready.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Start Export", 
          onPress: () => createExportMutation.mutate(exportOptions) 
        },
      ]
    );
  };

  const handleDeactivate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Deactivate Account",
      "Your account will be hidden from others and you will be logged out.\n\nYou can reactivate it anytime by signing in again with your credentials.\n\nContinue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deactivateMutation.mutate();
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    if (!deletePassword) {
      Alert.alert("Error", "Please enter your password to confirm deletion");
      return;
    }
    if (deleteConfirmation !== "DELETE") {
      Alert.alert("Error", "Please type DELETE to confirm account deletion");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Permanently Delete Account?",
      "⚠️ WARNING: This action is IRREVERSIBLE.\n\nAll of the following will be permanently deleted:\n• Your profile and all posts\n• All messages and conversations\n• All followers and following data\n• All saved content and settings\n• Your account cannot be recovered\n\nAre you absolutely certain you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteMutation.mutate();
          },
        },
      ]
    );
  };

  const getStatusColor = (status: DataExportRequest["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "#10B981";
      case "PENDING":
      case "PROCESSING":
        return "#F59E0B";
      case "FAILED":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: DataExportRequest["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "Ready";
      case "PENDING":
        return "Queued";
      case "PROCESSING":
        return "Processing";
      case "FAILED":
        return "Failed";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const renderExportItem = ({ item }: { item: DataExportRequest }) => {
    const expired = isExpired(item.expiresAt);
    const canDownload = item.status === "COMPLETED" && item.downloadUrl && !expired;

    return (
      <Pressable
        style={[
          styles.exportItem,
          { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
        ]}
        onPress={() => canDownload ? handleDownload(item) : null}
        disabled={!canDownload}
      >
        <View style={styles.exportItemHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.exportDate, { color: theme.textSecondary }]}>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>

        <View style={styles.exportDetails}>
          <View style={styles.exportIncludes}>
            {item.includeProfile ? <ThemedText style={[styles.includeTag, { color: theme.textSecondary }]}>Profile</ThemedText> : null}
            {item.includePosts ? <ThemedText style={[styles.includeTag, { color: theme.textSecondary }]}>Posts</ThemedText> : null}
            {item.includeMessages ? <ThemedText style={[styles.includeTag, { color: theme.textSecondary }]}>Messages</ThemedText> : null}
            {item.includeMedia ? <ThemedText style={[styles.includeTag, { color: theme.textSecondary }]}>Media</ThemedText> : null}
          </View>

          {item.status === "FAILED" && item.errorMessage ? (
            <ThemedText style={[styles.errorText, { color: theme.error }]}>
              {item.errorMessage}
            </ThemedText>
          ) : null}

          {expired ? (
            <ThemedText style={[styles.expiredText, { color: theme.textSecondary }]}>
              Download link expired
            </ThemedText>
          ) : null}

          {canDownload ? (
            <View style={styles.downloadRow}>
              <Feather name="download" size={16} color={theme.primary} />
              <ThemedText style={[styles.downloadText, { color: theme.primary }]}>
                Tap to download
              </ThemedText>
            </View>
          ) : null}

          {(item.status === "PENDING" || item.status === "PROCESSING") ? (
            <View style={styles.downloadRow}>
              <LoadingIndicator size="small" />
              <ThemedText style={[styles.processingText, { color: theme.textSecondary }]}>
                Preparing your export...
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderExportOptions = () => (
    <View style={[styles.optionsContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
      <ThemedText style={styles.optionsTitle}>Select data to export</ThemedText>
      
      <Pressable
        style={styles.optionRow}
        onPress={() => setExportOptions(prev => ({ ...prev, includeProfile: !prev.includeProfile }))}
      >
        <View style={styles.optionInfo}>
          <Feather name="user" size={20} color={theme.text} />
          <ThemedText style={styles.optionLabel}>Profile Information</ThemedText>
        </View>
        <Feather
          name={exportOptions.includeProfile ? "check-square" : "square"}
          size={22}
          color={exportOptions.includeProfile ? theme.primary : theme.textSecondary}
        />
      </Pressable>

      <Pressable
        style={styles.optionRow}
        onPress={() => setExportOptions(prev => ({ ...prev, includePosts: !prev.includePosts }))}
      >
        <View style={styles.optionInfo}>
          <Feather name="image" size={20} color={theme.text} />
          <ThemedText style={styles.optionLabel}>Posts & Stories</ThemedText>
        </View>
        <Feather
          name={exportOptions.includePosts ? "check-square" : "square"}
          size={22}
          color={exportOptions.includePosts ? theme.primary : theme.textSecondary}
        />
      </Pressable>

      <Pressable
        style={styles.optionRow}
        onPress={() => setExportOptions(prev => ({ ...prev, includeMessages: !prev.includeMessages }))}
      >
        <View style={styles.optionInfo}>
          <Feather name="message-circle" size={20} color={theme.text} />
          <ThemedText style={styles.optionLabel}>Messages</ThemedText>
        </View>
        <Feather
          name={exportOptions.includeMessages ? "check-square" : "square"}
          size={22}
          color={exportOptions.includeMessages ? theme.primary : theme.textSecondary}
        />
      </Pressable>

      <Pressable
        style={styles.optionRow}
        onPress={() => setExportOptions(prev => ({ ...prev, includeMedia: !prev.includeMedia }))}
      >
        <View style={styles.optionInfo}>
          <Feather name="film" size={20} color={theme.text} />
          <View style={styles.optionLabelContainer}>
            <ThemedText style={styles.optionLabel}>Media Files</ThemedText>
            <ThemedText style={[styles.optionNote, { color: theme.textSecondary }]}>
              Photos, videos (larger export)
            </ThemedText>
          </View>
        </View>
        <Feather
          name={exportOptions.includeMedia ? "check-square" : "square"}
          size={22}
          color={exportOptions.includeMedia ? theme.primary : theme.textSecondary}
        />
      </Pressable>

      <View style={styles.optionButtons}>
        <Pressable
          style={[styles.optionButton, { backgroundColor: theme.backgroundElevated }]}
          onPress={() => setShowExportOptions(false)}
        >
          <ThemedText style={styles.optionButtonText}>Cancel</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.optionButton, styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={confirmExport}
          disabled={createExportMutation.isPending}
        >
          {createExportMutation.isPending ? (
            <LoadingIndicator size="small" />
          ) : (
            <ThemedText style={[styles.optionButtonText, { color: "#FFFFFF" }]}>
              Request Export
            </ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Your Data
        </ThemedText>
        
        {showExportOptions ? (
          renderExportOptions()
        ) : (
          <Pressable
            style={[
              styles.actionRow,
              { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
            ]}
            onPress={handleExport}
            disabled={createExportMutation.isPending}
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
            {createExportMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        )}
      </View>

      {exportHistory.length > 0 ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Export History
          </ThemedText>
          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="small" />
            </View>
          ) : (
            exportHistory.map((item) => (
              <View key={item.id} style={styles.exportItemWrapper}>
                {renderExportItem({ item })}
              </View>
            ))
          )}
        </View>
      ) : null}

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
            <ThemedText style={styles.inputLabel}>Type DELETE to confirm</ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: theme.error + "40", backgroundColor: theme.backgroundRoot },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Type DELETE"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
              />
              {deleteConfirmation === "DELETE" ? (
                <Feather name="check-circle" size={20} color="#10B981" />
              ) : null}
            </View>
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
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  exportItemWrapper: {
    marginBottom: Spacing.sm,
  },
  exportItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  exportItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  exportDate: {
    fontSize: 12,
  },
  exportDetails: {
    gap: Spacing.xs,
  },
  exportIncludes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  includeTag: {
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  downloadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: "500",
  },
  processingText: {
    fontSize: 13,
    marginLeft: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  expiredText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: Spacing.xs,
  },
  optionsContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  optionLabelContainer: {
    flex: 1,
  },
  optionNote: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  optionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  optionButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {},
  optionButtonText: {
    fontSize: 15,
    fontWeight: "600",
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
