import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Report, ReportStatus, User, Post } from "@shared/schema";

type ReportWithDetails = Report & {
  reporter: User;
  reportedUser?: User;
  reportedPost?: Post & { author: User };
};

type FilterStatus = ReportStatus | "ALL";
type FilterType = "all" | "user" | "post";

export default function AdminReportsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("PENDING");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") {
      params.append("status", statusFilter);
    }
    if (typeFilter !== "all") {
      params.append("type", typeFilter);
    }
    return params.toString();
  };

  const queryString = buildQueryParams();
  const queryKey = ["/api/admin/reports", queryString];

  const {
    data: reports,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<ReportWithDetails[]>({
    queryKey,
    queryFn: async () => {
      try {
        const url = queryString
          ? `/api/admin/reports?${queryString}`
          : "/api/admin/reports";
        const response = await fetch(
          new URL(url, getApiUrl()).href,
          { credentials: "include" }
        );

        if (response.status === 403) {
          setError("You do not have permission to view reports.");
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

  const takeActionMutation = useMutation({
    mutationFn: async ({
      reportId,
      action,
      reason,
    }: {
      reportId: string;
      action: "suspend_user" | "hide_post" | "delete_post";
      reason?: string;
    }) => {
      await apiRequest("POST", `/api/admin/reports/${reportId}/action`, {
        action,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Action taken successfully");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to take action");
    },
  });

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case "PENDING":
        return "#F59E0B";
      case "REVIEWED":
        return "#3B82F6";
      case "RESOLVED":
        return "#10B981";
      case "DISMISSED":
        return "#9CA3AF";
      default:
        return theme.textSecondary;
    }
  };

  const getReportType = (report: ReportWithDetails): string => {
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

  const handleStatusChange = (report: ReportWithDetails) => {
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
      onPress: () => {},
    });

    Alert.alert("Update Status", "Choose a new status for this report", options);
  };

  const handleTakeAction = (report: ReportWithDetails) => {
    const options: Array<{
      text: string;
      onPress: () => void;
      style?: "destructive" | "cancel" | "default";
    }> = [];

    if (report.reportedUserId) {
      options.push({
        text: "Suspend User",
        style: "destructive",
        onPress: () => {
          Alert.prompt(
            "Suspend User",
            "Enter a reason for the suspension:",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Suspend",
                style: "destructive",
                onPress: (reason: string | undefined) => {
                  if (reason) {
                    takeActionMutation.mutate({
                      reportId: report.id,
                      action: "suspend_user",
                      reason,
                    });
                  }
                },
              },
            ],
            "plain-text"
          );
        },
      });
    }

    if (report.reportedPostId) {
      options.push({
        text: "Hide Post",
        onPress: () => {
          takeActionMutation.mutate({
            reportId: report.id,
            action: "hide_post",
            reason: "Reported content violation",
          });
        },
      });

      options.push({
        text: "Delete Post",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Post",
            "Are you sure you want to permanently delete this post? This cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  takeActionMutation.mutate({
                    reportId: report.id,
                    action: "delete_post",
                    reason: "Reported content violation",
                  });
                },
              },
            ]
          );
        },
      });
    }

    options.push({
      text: "Cancel",
      style: "cancel",
      onPress: () => {},
    });

    if (options.length === 1) {
      Alert.alert("No Actions", "No actions available for this report type");
      return;
    }

    Alert.alert("Take Action", "Choose an action for this report", options);
  };

  const FilterChip = ({
    label,
    active,
    onPress,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.primary : `${theme.primary}15`,
          borderColor: active ? theme.primary : `${theme.primary}40`,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.filterChipText,
          { color: active ? "#FFFFFF" : theme.primary },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderReportItem = ({ item }: { item: ReportWithDetails }) => {
    const statusColor = getStatusColor(item.status);
    const canTakeAction = item.status === "PENDING" || item.status === "REVIEWED";
    const isExpanded = expandedItems.has(item.id);

    return (
      <Card elevation={1} style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <View style={styles.reportContent}>
            <Pressable onPress={() => toggleExpand(item.id)}>
              <ThemedText
                style={[styles.reportReason, { flex: 1 }]}
                numberOfLines={isExpanded ? undefined : 2}
              >
                {item.reason}
              </ThemedText>
              <ThemedText style={[styles.expandButton, { color: theme.primary }]}>
                {isExpanded ? 'See less' : 'See more'}
              </ThemedText>
            </Pressable>
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
        </View>

        <View style={styles.reportDetails}>
          <ThemedText
            style={[styles.detailText, { color: theme.textSecondary }]}
          >
            Reported by: @{item.reporter?.username || "unknown"}
          </ThemedText>
          {item.reportedUser ? (
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
            >
              Reported user: @{item.reportedUser.username}
            </ThemedText>
          ) : null}
          {item.reportedPost ? (
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              Reported post: "{item.reportedPost.content?.slice(0, 50)}..."
            </ThemedText>
          ) : null}
          <ThemedText
            style={[styles.detailText, { color: theme.textSecondary }]}
          >
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => handleStatusChange(item)}
            style={[
              styles.actionButton,
              { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` },
            ]}
          >
            <Feather name="edit-2" size={14} color={theme.primary} />
            <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
              Status
            </ThemedText>
          </Pressable>

          {canTakeAction ? (
            <Pressable
              onPress={() => handleTakeAction(item)}
              style={[
                styles.actionButton,
                { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}40` },
              ]}
            >
              <Feather name="alert-triangle" size={14} color={theme.error} />
              <ThemedText style={[styles.actionButtonText, { color: theme.error }]}>
                Take Action
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </Card>
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
        {statusFilter === "PENDING"
          ? "All pending reports have been reviewed"
          : "No reports match your filters"}
      </ThemedText>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
        Status
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <FilterChip
          label="Pending"
          active={statusFilter === "PENDING"}
          onPress={() => setStatusFilter("PENDING")}
        />
        <FilterChip
          label="Reviewed"
          active={statusFilter === "REVIEWED"}
          onPress={() => setStatusFilter("REVIEWED")}
        />
        <FilterChip
          label="Resolved"
          active={statusFilter === "RESOLVED"}
          onPress={() => setStatusFilter("RESOLVED")}
        />
        <FilterChip
          label="Dismissed"
          active={statusFilter === "DISMISSED"}
          onPress={() => setStatusFilter("DISMISSED")}
        />
        <FilterChip
          label="All"
          active={statusFilter === "ALL"}
          onPress={() => setStatusFilter("ALL")}
        />
      </ScrollView>

      <ThemedText style={[styles.filterLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>
        Type
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <FilterChip
          label="All Types"
          active={typeFilter === "all"}
          onPress={() => setTypeFilter("all")}
        />
        <FilterChip
          label="User Reports"
          active={typeFilter === "user"}
          onPress={() => setTypeFilter("user")}
        />
        <FilterChip
          label="Post Reports"
          active={typeFilter === "post"}
          onPress={() => setTypeFilter("post")}
        />
      </ScrollView>
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
      {renderFilters()}
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Spacing.md,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
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
        scrollIndicatorInsets={{ bottom: insets.bottom }}
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
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
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
    marginBottom: Spacing.xs,
  },
  expandButton: {
    fontSize: 12,
    fontWeight: "500",
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
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
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
