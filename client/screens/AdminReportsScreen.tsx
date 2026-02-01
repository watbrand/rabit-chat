import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Report, ReportStatus } from "@shared/schema";

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    data: reports,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
    queryFn: async () => {
      try {
        const response = await fetch(
          new URL("/api/admin/reports", getApiUrl()).href,
          {
            credentials: "include",
          }
        );

        if (response.status === 403) {
          setError("You do not have admin access to view reports.");
          return [];
        }

        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }

        return await response.json();
      } catch (err: any) {
        setError(err.message || "Failed to fetch reports");
        return [];
      }
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
      notes,
    }: {
      reportId: string;
      status: ReportStatus;
      notes?: string;
    }) => {
      await apiRequest("PATCH", `/api/admin/reports/${reportId}`, {
        status,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update report status");
    },
  });

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case "PENDING":
        return "#F59E0B"; // yellow/amber
      case "REVIEWED":
        return "#3B82F6"; // blue
      case "RESOLVED":
        return "#10B981"; // green
      case "DISMISSED":
        return "#9CA3AF"; // gray
      default:
        return theme.textSecondary;
    }
  };

  const getReportType = (report: Report): string => {
    if (report.reportedUserId) return "User Report";
    if (report.reportedPostId) return "Post Report";
    return "Report";
  };

  const formatDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReportPress = (report: Report) => {
    const options: Array<{
      text: string;
      onPress: () => void;
      style?: "destructive" | "cancel" | "default";
    }> = [];

    if (report.status === "PENDING") {
      options.push({
        text: "Mark as Reviewed",
        onPress: () => {
          updateStatusMutation.mutate({
            reportId: report.id,
            status: "REVIEWED",
          });
        },
      });
    }

    if (report.status === "PENDING" || report.status === "REVIEWED") {
      options.push({
        text: "Mark as Resolved",
        onPress: () => {
          updateStatusMutation.mutate({
            reportId: report.id,
            status: "RESOLVED",
          });
        },
      });

      options.push({
        text: "Dismiss",
        onPress: () => {
          updateStatusMutation.mutate({
            reportId: report.id,
            status: "DISMISSED",
          });
        },
      });
    }

    options.push({
      text: "Cancel",
      style: "cancel",
      onPress: () => {
        Haptics.selectionAsync();
      },
    });

    Alert.alert(
      "Report Actions",
      `${report.reason}\n\nType: ${getReportType(report)}\nReporter: ${report.reporterId}`,
      options
    );
  };

  const renderReportItem = ({ item }: { item: Report }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <Pressable onPress={() => handleReportPress(item)}>
        <Card elevation={1} style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={styles.reportContent}>
              <ThemedText
                style={[styles.reportReason, { flex: 1 }]}
                numberOfLines={2}
              >
                {item.reason}
              </ThemedText>
              <View style={styles.reportMeta}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${statusColor}20` },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: statusColor },
                    ]}
                  >
                    {item.status}
                  </ThemedText>
                </View>
                <ThemedText
                  style={[styles.typeIndicator, { color: theme.textSecondary }]}
                >
                  {getReportType(item)}
                </ThemedText>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={theme.textSecondary}
            />
          </View>

          <View style={styles.reportDetails}>
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
            >
              Reporter: {item.reporterId}
            </ThemedText>
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
            >
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
        </Card>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather
        name="inbox"
        size={64}
        color={theme.textSecondary}
        style={{ opacity: 0.5 }}
      />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No reports
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        All reports have been reviewed
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather
          name="alert-circle"
          size={64}
          color={theme.error}
          style={{ opacity: 0.5 }}
        />
        <ThemedText type="h4" style={[styles.errorTitle, { color: theme.error }]}>
          Access Denied
        </ThemedText>
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          {error}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={reports || []}
        keyExtractor={(item) => item.id}
        renderItem={renderReportItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  errorText: {
    textAlign: "center",
  },
  reportCard: {
    padding: Spacing.lg,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  reportContent: {
    flex: 1,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  reportMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  typeIndicator: {
    fontSize: 12,
  },
  reportDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
  },
  detailText: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
});
