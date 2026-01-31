import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface DataExportRequest {
  id: string;
  userId: string;
  status: string;
  dataTypes: string[];
  downloadUrl: string | null;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
}

interface AccountBackup {
  id: string;
  userId: string;
  status: string;
  downloadUrl: string | null;
  requestedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
}

const DATA_TYPES = [
  { id: "profile", label: "Profile Information", icon: "user", description: "Your profile data, bio, and settings" },
  { id: "posts", label: "Posts & Media", icon: "image", description: "All your posts, photos, and videos" },
  { id: "stories", label: "Stories", icon: "circle", description: "Your story history and highlights" },
  { id: "messages", label: "Messages", icon: "message-circle", description: "Your direct message conversations" },
  { id: "followers", label: "Followers & Following", icon: "users", description: "Your follower and following lists" },
  { id: "activity", label: "Activity", icon: "activity", description: "Likes, comments, and interactions" },
];

export function DataExportScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["profile", "posts"]);

  const { data: exportRequests, isLoading: loadingExports } = useQuery<DataExportRequest[]>({
    queryKey: ["/api/data-exports"],
    enabled: !!user,
  });

  const { data: backup, isLoading: loadingBackup } = useQuery<AccountBackup>({
    queryKey: ["/api/account/backup"],
    enabled: !!user,
  });

  const requestExportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/data-exports", { dataTypes: selectedTypes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-exports"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Export Requested", "We're preparing your data. This may take a few minutes.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to request export");
    },
  });

  const requestBackupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/account/backup");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account/backup"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Backup Requested", "We're creating a full backup of your account. This may take a while.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to request backup");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/data-exports"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/account/backup"] }),
    ]);
    setRefreshing(false);
  };

  const toggleDataType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const openDownload = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED": return theme.success;
      case "PENDING": case "PROCESSING": return theme.warning || "#F59E0B";
      case "FAILED": return theme.error;
      default: return theme.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInUp.delay(0)}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="download" size={20} color={theme.primary} />
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Export Your Data</ThemedText>
            </View>
            <ThemedText style={[styles.cardDesc, { color: theme.textSecondary }]}>
              Download a copy of your RabitChat data. Select what you want to include:
            </ThemedText>

            {DATA_TYPES.map((type) => (
              <Pressable
                key={type.id}
                style={[styles.dataTypeRow, { borderColor: theme.glassBorder }]}
                onPress={() => toggleDataType(type.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: selectedTypes.includes(type.id) ? theme.primary : "transparent",
                      borderColor: selectedTypes.includes(type.id) ? theme.primary : theme.textSecondary,
                    },
                  ]}
                >
                  {selectedTypes.includes(type.id) ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                </View>
                <View style={[styles.dataTypeIcon, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name={type.icon as any} size={18} color={theme.primary} />
                </View>
                <View style={styles.dataTypeInfo}>
                  <ThemedText style={[styles.dataTypeLabel, { color: theme.text }]}>{type.label}</ThemedText>
                  <ThemedText style={[styles.dataTypeDesc, { color: theme.textSecondary }]}>{type.description}</ThemedText>
                </View>
              </Pressable>
            ))}

            <Pressable
              style={[
                styles.exportButton,
                { backgroundColor: theme.primary },
                (selectedTypes.length === 0 || requestExportMutation.isPending) && styles.buttonDisabled,
              ]}
              onPress={() => requestExportMutation.mutate()}
              disabled={selectedTypes.length === 0 || requestExportMutation.isPending}
            >
              {requestExportMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <>
                  <Feather name="download" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.exportButtonText}>Request Export</ThemedText>
                </>
              )}
            </Pressable>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="archive" size={20} color={theme.pink} />
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Full Account Backup</ThemedText>
            </View>
            <ThemedText style={[styles.cardDesc, { color: theme.textSecondary }]}>
              Create a complete backup of your entire account including all data, settings, and media.
            </ThemedText>

            {backup && backup.status !== "NONE" ? (
              <View style={[styles.backupStatus, { backgroundColor: theme.glassBackground }]}>
                <View style={styles.backupStatusHeader}>
                  <ThemedText style={[styles.backupStatusLabel, { color: theme.text }]}>Latest Backup</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(backup.status) + "20" }]}>
                    <ThemedText style={[styles.statusText, { color: getStatusColor(backup.status) }]}>
                      {backup.status}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.backupDate, { color: theme.textSecondary }]}>
                  Requested: {formatDate(backup.requestedAt)}
                </ThemedText>
                {backup.downloadUrl ? (
                  <Pressable
                    style={[styles.downloadButton, { borderColor: theme.primary }]}
                    onPress={() => openDownload(backup.downloadUrl!)}
                  >
                    <Feather name="download-cloud" size={16} color={theme.primary} />
                    <ThemedText style={[styles.downloadButtonText, { color: theme.primary }]}>Download Backup</ThemedText>
                  </Pressable>
                ) : null}
                {backup.expiresAt ? (
                  <ThemedText style={[styles.expiresText, { color: theme.error }]}>
                    Expires: {formatDate(backup.expiresAt)}
                  </ThemedText>
                ) : null}
              </View>
            ) : null}

            <Pressable
              style={[
                styles.exportButton,
                { backgroundColor: theme.pink },
                requestBackupMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={() => requestBackupMutation.mutate()}
              disabled={requestBackupMutation.isPending}
            >
              {requestBackupMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <>
                  <Feather name="archive" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.exportButtonText}>Request Full Backup</ThemedText>
                </>
              )}
            </Pressable>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            Previous Exports ({exportRequests?.length || 0})
          </ThemedText>

          {loadingExports ? (
            <LoadingIndicator size="large" style={styles.loader} />
          ) : exportRequests && exportRequests.length > 0 ? (
            exportRequests.map((request, index) => (
              <Card key={request.id} style={styles.exportCard}>
                <View style={styles.exportHeader}>
                  <View style={[styles.exportIcon, { backgroundColor: getStatusColor(request.status) + "20" }]}>
                    <Feather
                      name={request.status === "COMPLETED" ? "check" : request.status === "FAILED" ? "x" : "clock"}
                      size={16}
                      color={getStatusColor(request.status)}
                    />
                  </View>
                  <View style={styles.exportInfo}>
                    <ThemedText style={[styles.exportDate, { color: theme.text }]}>
                      {formatDate(request.requestedAt)}
                    </ThemedText>
                    <ThemedText style={[styles.exportTypes, { color: theme.textSecondary }]}>
                      {request.dataTypes.join(", ")}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + "20" }]}>
                    <ThemedText style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                      {request.status}
                    </ThemedText>
                  </View>
                </View>
                {request.downloadUrl ? (
                  <Pressable
                    style={[styles.downloadButton, { borderColor: theme.primary, marginTop: Spacing.sm }]}
                    onPress={() => openDownload(request.downloadUrl!)}
                  >
                    <Feather name="download" size={14} color={theme.primary} />
                    <ThemedText style={[styles.downloadButtonText, { color: theme.primary }]}>Download</ThemedText>
                  </Pressable>
                ) : null}
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Feather name="inbox" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Exports Yet</ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Your export history will appear here
              </ThemedText>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  card: { padding: Spacing.lg },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  cardTitle: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  cardDesc: { fontSize: 13, marginBottom: Spacing.md, lineHeight: 20 },
  dataTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dataTypeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  dataTypeInfo: { flex: 1 },
  dataTypeLabel: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  dataTypeDesc: { fontSize: 11, marginTop: 2 },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  buttonDisabled: { opacity: 0.6 },
  backupStatus: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md },
  backupStatusHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.xs },
  backupStatusLabel: {
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  statusText: {
    fontSize: 10,
    textTransform: "uppercase",
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  backupDate: { fontSize: 12 },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  downloadButtonText: {
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  expiresText: { fontSize: 11, marginTop: Spacing.xs },
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  loader: { paddingVertical: Spacing.xl },
  exportCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  exportHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  exportIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  exportInfo: { flex: 1 },
  exportDate: {
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  exportTypes: { fontSize: 11, marginTop: 2 },
  emptyCard: { padding: Spacing.xl, alignItems: "center" },
  emptyTitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.md,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  emptyText: { fontSize: 13, marginTop: Spacing.xs, textAlign: "center" },
});
