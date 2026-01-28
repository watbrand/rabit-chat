import React from "react";
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface HelpCenterOverview {
  publishedArticles: number;
  activeFaqs: number;
  activeTickets: number;
  newTickets: number;
  unsolvedQuestions: number;
  pendingAppeals: number;
  newFeatureRequests: number;
  avgResolutionTimeHours: number;
}

const HELP_SECTIONS = [
  { key: "AdminHelpArticles", icon: "file-text", label: "Articles", color: "#8B5CF6" },
  { key: "AdminHelpCategories", icon: "folder", label: "Categories", color: "#3B82F6" },
  { key: "AdminHelpFAQs", icon: "help-circle", label: "FAQs", color: "#14B8A6" },
  { key: "AdminHelpCannedResponses", icon: "message-square", label: "Canned Responses", color: "#EC4899" },
  { key: "AdminHelpSystemStatus", icon: "activity", label: "System Status", color: "#10B981" },
  { key: "AdminHelpKnownIssues", icon: "alert-triangle", label: "Known Issues", color: "#F59E0B" },
  { key: "AdminHelpChangelog", icon: "list", label: "Changelog", color: "#6366F1" },
  { key: "AdminHelpSafetyResources", icon: "shield", label: "Safety Resources", color: "#EF4444" },
];

const STATS_CARDS = [
  { key: "publishedArticles", icon: "file-text", label: "Published Articles", color: "#8B5CF6" },
  { key: "activeTickets", icon: "inbox", label: "Active Tickets", color: "#3B82F6", urgent: true },
  { key: "unsolvedQuestions", icon: "help-circle", label: "Unsolved Q&A", color: "#F59E0B", urgent: true },
  { key: "newFeatureRequests", icon: "lightbulb", label: "Feature Requests", color: "#14B8A6" },
];

export default function AdminHelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const { data: overview, isLoading, refetch, isRefetching } = useQuery<HelpCenterOverview>({
    queryKey: ["/api/admin/help/stats"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/help/stats", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch help center stats");
      return res.json();
    },
  });

  const getStatValue = (key: string): number => {
    if (!overview) return 0;
    return (overview as any)[key] || 0;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "createArticle":
        navigation.navigate("AdminHelpArticles", { action: "create" });
        break;
      case "addFaq":
        navigation.navigate("AdminHelpFAQs", { action: "create" });
        break;
      case "updateStatus":
        navigation.navigate("AdminHelpSystemStatus");
        break;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]} testID="loading-container">
        <ActivityIndicator size="large" color={theme.primary} testID="loading-indicator" />
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
      testID="help-center-admin-scroll"
    >
      <Card elevation={2} style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: theme.primary }]}>
            <Feather name="help-circle" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.headerText}>
            <ThemedText type="h3">Help Center Admin</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              Manage support content and resources
            </ThemedText>
          </View>
        </View>
      </Card>

      <ThemedText type="h4" style={styles.sectionTitle}>Stats</ThemedText>
      <View style={styles.statsGrid}>
        {STATS_CARDS.map((card) => {
          const value = getStatValue(card.key);
          const isUrgent = card.urgent && value > 0;
          return (
            <Card
              key={card.key}
              elevation={1}
              style={isUrgent ? { ...styles.statsCard, borderWidth: 1, borderColor: card.color } : styles.statsCard}
            >
              <View style={[styles.statsIcon, { backgroundColor: `${card.color}15` }]}>
                <Feather name={card.icon as any} size={20} color={card.color} />
              </View>
              <ThemedText style={[styles.statsValue, { color: isUrgent ? card.color : theme.text }]}>
                {value.toLocaleString()}
              </ThemedText>
              <ThemedText style={[styles.statsLabel, { color: theme.textSecondary }]}>
                {card.label}
              </ThemedText>
            </Card>
          );
        })}
      </View>

      <ThemedText type="h4" style={styles.sectionTitle}>Management</ThemedText>
      <View style={styles.grid}>
        {HELP_SECTIONS.map((section) => (
          <Pressable
            key={section.key}
            style={styles.gridItem}
            onPress={() => navigation.navigate(section.key)}
            testID={`nav-${section.key}`}
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

      <ThemedText type="h4" style={styles.sectionTitle}>Quick Actions</ThemedText>
      <View style={styles.actionsContainer}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: `${theme.primary}20` }]}
          onPress={() => handleQuickAction("createArticle")}
          testID="action-create-article"
        >
          <Feather name="plus" size={18} color={theme.primary} />
          <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
            Create New Article
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: "#14B8A620" }]}
          onPress={() => handleQuickAction("addFaq")}
          testID="action-add-faq"
        >
          <Feather name="plus" size={18} color="#14B8A6" />
          <ThemedText style={[styles.actionButtonText, { color: "#14B8A6" }]}>
            Add FAQ
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: "#10B98120" }]}
          onPress={() => handleQuickAction("updateStatus")}
          testID="action-update-status"
        >
          <Feather name="activity" size={18} color="#10B981" />
          <ThemedText style={[styles.actionButtonText, { color: "#10B981" }]}>
            Update System Status
          </ThemedText>
        </Pressable>
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statsCard: {
    padding: Spacing.md,
    alignItems: "center",
    minWidth: 100,
    flex: 1,
  },
  statsIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  statsLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
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
  actionsContainer: {
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
});
