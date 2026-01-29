import React from "react";
import { View, StyleSheet, Pressable, ScrollView, RefreshControl } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface AnalyticsOverview {
  totalUsers: number;
  newUsers7d: number;
  posts7d: number;
  openReports: number;
  messages7d: number;
  totalPosts: number;
  totalMessages: number;
}

const ADMIN_SECTIONS = [
  { key: "AdminUsers", icon: "users", label: "Users", color: "#8B5CF6" },
  { key: "AdminPosts", icon: "file-text", label: "Posts", color: "#3B82F6" },
  { key: "AdminComments", icon: "message-circle", label: "Comments", color: "#10B981" },
  { key: "AdminStories", icon: "film", label: "Stories", color: "#F472B6" },
  { key: "AdminMusic", icon: "music", label: "Music", color: "#EC4899" },
  { key: "AdminEconomy", icon: "dollar-sign", label: "Economy", color: "#F59E0B" },
  { key: "AdminReports", icon: "flag", label: "Reports", color: "#EF4444" },
  { key: "AdminTickets", icon: "headphones", label: "Tickets", color: "#14B8A6" },
  { key: "AdminVerification", icon: "award", label: "Verification", color: "#06B6D4" },
  { key: "AdminRoles", icon: "shield", label: "Roles", color: "#A855F7" },
  { key: "AdminSettings", icon: "settings", label: "Settings", color: "#6366F1" },
  { key: "AdminAudit", icon: "activity", label: "Audit", color: "#22C55E" },
  { key: "AdminHelpCenter", icon: "help-circle", label: "Help Center", color: "#8B5CF6" },
];

const ANALYTICS_CARDS = [
  { key: "totalUsers", icon: "users", label: "Total Users", color: "#8B5CF6" },
  { key: "newUsers7d", icon: "user-plus", label: "New Users (7d)", color: "#10B981" },
  { key: "posts7d", icon: "edit-3", label: "Posts (7d)", color: "#3B82F6" },
  { key: "openReports", icon: "alert-circle", label: "Open Reports", color: "#F59E0B", urgent: true },
  { key: "messages7d", icon: "message-square", label: "Messages (7d)", color: "#6366F1" },
];

export default function AdminOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const { data: overview, isLoading, refetch, isRefetching } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/admin/overview"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/overview", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
  });

  const getAnalyticsValue = (key: string): number => {
    if (!overview) return 0;
    return (overview as any)[key] || 0;
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
      }
    >
      <Card elevation={2} style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: theme.primary }]}>
            <Feather name="shield" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <ThemedText type="h3">Admin Panel</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              Manage your application
            </ThemedText>
          </View>
        </View>
      </Card>

      <ThemedText type="h4" style={styles.sectionTitle}>Analytics</ThemedText>
      <View style={styles.analyticsGrid}>
        {ANALYTICS_CARDS.map((card) => {
          const value = getAnalyticsValue(card.key);
          const isUrgent = card.urgent && value > 0;
          return (
            <Card key={card.key} elevation={1} style={isUrgent ? { ...styles.analyticsCard, borderWidth: 1, borderColor: card.color } : styles.analyticsCard}>
              <View style={[styles.analyticsIcon, { backgroundColor: `${card.color}15` }]}>
                <Feather name={card.icon as any} size={20} color={card.color} />
              </View>
              <ThemedText style={[styles.analyticsValue, { color: isUrgent ? card.color : theme.text }]}>
                {value.toLocaleString()}
              </ThemedText>
              <ThemedText style={[styles.analyticsLabel, { color: theme.textSecondary }]}>
                {card.label}
              </ThemedText>
            </Card>
          );
        })}
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>Management</ThemedText>
      <View style={styles.grid}>
        {ADMIN_SECTIONS.map((section) => (
          <Pressable
            key={section.key}
            style={styles.gridItem}
            onPress={() => navigation.navigate(section.key)}
          >
            <Card elevation={1} style={styles.sectionCard}>
              <View style={[styles.iconContainer, { backgroundColor: `${section.color}20` }]}>
                <Feather name={section.icon as any} size={24} color={section.color} />
              </View>
              <ThemedText type="body" style={styles.sectionLabel}>
                {section.label}
              </ThemedText>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  analyticsCard: {
    padding: Spacing.md,
    alignItems: "center",
    minWidth: 100,
    flex: 1,
  },
  analyticsIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  analyticsLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  gridItem: {
    width: "47%",
  },
  sectionCard: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontWeight: "600",
    textAlign: "center",
  },
});
