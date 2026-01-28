import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { AuditLog, User } from "@shared/schema";

type AuditLogWithActor = AuditLog & { actor?: User };

interface AuditResponse {
  logs: AuditLogWithActor[];
  total: number;
}

const ACTION_ICONS: Record<string, string> = {
  CREATE: "plus",
  UPDATE: "edit-2",
  DELETE: "trash-2",
  LOGIN: "log-in",
  LOGOUT: "log-out",
  ROLE_ASSIGNED: "user-plus",
  ROLE_REMOVED: "user-minus",
  PERMISSION_GRANTED: "check-circle",
  PERMISSION_REVOKED: "x-circle",
  USER_SUSPENDED: "user-x",
  USER_ACTIVATED: "user-check",
  REPORT_RESOLVED: "flag",
  SETTING_CHANGED: "settings",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "#10B981",
  UPDATE: "#3B82F6",
  DELETE: "#EF4444",
  LOGIN: "#8B5CF6",
  LOGOUT: "#6B7280",
  ROLE_ASSIGNED: "#10B981",
  ROLE_REMOVED: "#F59E0B",
  PERMISSION_GRANTED: "#10B981",
  PERMISSION_REVOKED: "#EF4444",
  USER_SUSPENDED: "#EF4444",
  USER_ACTIVATED: "#10B981",
  REPORT_RESOLVED: "#3B82F6",
  SETTING_CHANGED: "#6366F1",
};

const ACTIONS = [
  "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
  "ROLE_ASSIGNED", "ROLE_REMOVED", "PERMISSION_GRANTED", "PERMISSION_REVOKED",
  "USER_SUSPENDED", "USER_ACTIVATED", "REPORT_RESOLVED", "SETTING_CHANGED",
];

const TARGET_TYPES = ["user", "post", "comment", "role", "setting", "report"];

const DATE_RANGES = [
  { label: "All Time", value: "" },
  { label: "Last 24 hours", value: "1" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
];

export default function AdminAuditScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [showFilters, setShowFilters] = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("");

  const buildQueryUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    
    if (filterAction) params.set("action", filterAction);
    if (filterTargetType) params.set("targetType", filterTargetType);
    if (filterDateRange) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filterDateRange, 10));
      params.set("startDate", startDate.toISOString());
    }
    
    return `/api/admin/audit?${params.toString()}`;
  }, [filterAction, filterTargetType, filterDateRange]);

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<AuditResponse>({
    queryKey: ["/api/admin/audit", filterAction, filterTargetType, filterDateRange],
    queryFn: async () => {
      const url = buildQueryUrl();
      const res = await fetch(new URL(url, getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) return { logs: [], total: 0 };
      return res.json();
    },
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const activeFiltersCount = [filterAction, filterTargetType, filterDateRange].filter(Boolean).length;

  const clearFilters = () => {
    setFilterAction("");
    setFilterTargetType("");
    setFilterDateRange("");
  };

  const formatDate = (date: string | Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAction = (action: string): string => {
    return action
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const renderAuditItem = ({ item }: { item: AuditLogWithActor }) => {
    const icon = ACTION_ICONS[item.action] || "activity";
    const color = ACTION_COLORS[item.action] || theme.primary;

    return (
      <Card elevation={1} style={styles.auditCard}>
        <View style={styles.auditHeader}>
          <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
            <Feather name={icon as any} size={18} color={color} />
          </View>
          <View style={styles.auditInfo}>
            <ThemedText type="body" style={styles.actionName}>
              {formatAction(item.action)}
            </ThemedText>
            <ThemedText style={[styles.auditDate, { color: theme.textSecondary }]}>
              {formatDate(item.createdAt)}
            </ThemedText>
          </View>
        </View>

        {item.actor ? (
          <View style={styles.actorInfo}>
            <Feather name="user" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.actorText, { color: theme.textSecondary }]}>
              {item.actor.displayName || item.actor.username}
            </ThemedText>
          </View>
        ) : null}

        {item.targetType ? (
          <View style={styles.targetInfo}>
            <ThemedText style={[styles.targetLabel, { color: theme.textSecondary }]}>
              Target: {item.targetType}
            </ThemedText>
            {item.targetId ? (
              <ThemedText style={[styles.targetId, { color: theme.textSecondary }]}>
                {item.targetId.length > 12 ? `${item.targetId.substring(0, 12)}...` : item.targetId}
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        {item.details ? (
          <View style={styles.detailsContainer}>
            <ThemedText style={[styles.detailsText, { color: theme.textSecondary }]} numberOfLines={2}>
              {typeof item.details === "string" ? item.details : JSON.stringify(item.details)}
            </ThemedText>
          </View>
        ) : null}

        {item.ipAddress ? (
          <View style={styles.metaRow}>
            <Feather name="globe" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
              {item.ipAddress}
            </ThemedText>
          </View>
        ) : null}
      </Card>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowFilters(false)}>
            <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
          </Pressable>
          <ThemedText type="h4">Filters</ThemedText>
          <Pressable onPress={() => { clearFilters(); setShowFilters(false); }}>
            <ThemedText style={{ color: theme.primary }}>Clear</ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.filterSection}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
              Action Type
            </ThemedText>
            <View style={styles.filterOptions}>
              <Pressable
                style={[
                  styles.filterChip,
                  { borderColor: `${theme.primary}40` },
                  !filterAction && { backgroundColor: theme.primary }
                ]}
                onPress={() => setFilterAction("")}
              >
                <ThemedText style={[styles.filterChipText, !filterAction && { color: "#FFFFFF" }]}>
                  All
                </ThemedText>
              </Pressable>
              {ACTIONS.map((action) => (
                <Pressable
                  key={action}
                  style={[
                    styles.filterChip,
                    { borderColor: `${theme.primary}40` },
                    filterAction === action && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setFilterAction(action)}
                >
                  <ThemedText style={[styles.filterChipText, filterAction === action && { color: "#FFFFFF" }]}>
                    {formatAction(action)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
              Target Type
            </ThemedText>
            <View style={styles.filterOptions}>
              <Pressable
                style={[
                  styles.filterChip,
                  { borderColor: `${theme.primary}40` },
                  !filterTargetType && { backgroundColor: theme.primary }
                ]}
                onPress={() => setFilterTargetType("")}
              >
                <ThemedText style={[styles.filterChipText, !filterTargetType && { color: "#FFFFFF" }]}>
                  All
                </ThemedText>
              </Pressable>
              {TARGET_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.filterChip,
                    { borderColor: `${theme.primary}40` },
                    filterTargetType === type && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setFilterTargetType(type)}
                >
                  <ThemedText style={[styles.filterChipText, filterTargetType === type && { color: "#FFFFFF" }]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <ThemedText style={[styles.filterLabel, { color: theme.textSecondary }]}>
              Date Range
            </ThemedText>
            <View style={styles.filterOptions}>
              {DATE_RANGES.map((range) => (
                <Pressable
                  key={range.value}
                  style={[
                    styles.filterChip,
                    { borderColor: `${theme.primary}40` },
                    filterDateRange === range.value && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setFilterDateRange(range.value)}
                >
                  <ThemedText style={[styles.filterChipText, filterDateRange === range.value && { color: "#FFFFFF" }]}>
                    {range.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Pressable
            style={[styles.applyButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowFilters(false)}
          >
            <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderAuditItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: Spacing.lg }}>
            <Card elevation={1} style={styles.infoCard}>
              <Feather name="activity" size={20} color={theme.primary} />
              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                Audit logs track administrative actions for security and compliance.
              </ThemedText>
            </Card>

            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterButton, { backgroundColor: theme.glassBackground, borderColor: `${theme.primary}40` }]}
                onPress={() => setShowFilters(true)}
              >
                <Feather name="filter" size={16} color={theme.primary} />
                <ThemedText style={{ color: theme.primary, fontWeight: "500" }}>
                  Filters
                </ThemedText>
                {activeFiltersCount > 0 ? (
                  <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
                    <ThemedText style={styles.filterBadgeText}>{activeFiltersCount}</ThemedText>
                  </View>
                ) : null}
              </Pressable>

              <ThemedText style={{ color: theme.textSecondary }}>
                {total} {total === 1 ? "entry" : "entries"}
              </ThemedText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="activity" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText type="h4" style={styles.emptyTitle}>No audit logs</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {activeFiltersCount > 0 ? "No logs match your filters" : "Administrative actions will appear here"}
            </ThemedText>
          </View>
        }
      />

      {renderFilterModal()}
    </View>
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
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  auditCard: {
    padding: Spacing.lg,
  },
  auditHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  auditInfo: {
    flex: 1,
  },
  actionName: {
    fontWeight: "600",
    fontSize: 14,
  },
  auditDate: {
    fontSize: 12,
  },
  actorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  actorText: {
    fontSize: 12,
  },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
  },
  targetLabel: {
    fontSize: 12,
  },
  targetId: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  detailsContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
    borderRadius: BorderRadius.xs,
  },
  detailsText: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  metaText: {
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
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
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  applyButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
