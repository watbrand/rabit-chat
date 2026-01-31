import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Pressable,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, Gradients } from "@/constants/theme";
import { Avatar } from "@/components/Avatar";
import { LoadingIndicator } from "@/components/animations";

type RouteParams = {
  NetWorthPortfolio: {
    userId: string;
    username?: string;
  };
};

interface PortfolioItem {
  id: string;
  quantity: number;
  createdAt: string;
  item: {
    id: string;
    name: string;
    description: string;
    value: number;
    categoryId: string;
    imageUrl?: string | null;
  };
}

interface PortfolioData {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    netWorth: number | null;
    isVerified: boolean;
  };
  wealthRank: number | null;
  totalPurchaseValue: number;
  totalNetWorthGain: number;
  purchases: PortfolioItem[];
  categoryBreakdown: Record<string, { count: number; totalValue: number; netWorthGain: number }>;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) {
    return `R${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `R${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `R${(value / 1e3).toFixed(1)}K`;
  }
  return `R${value.toLocaleString()}`;
}

function formatFullCurrency(value: number): string {
  return `R${value.toLocaleString()}`;
}

export default function NetWorthPortfolioScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RouteParams, "NetWorthPortfolio">>();
  const { userId } = route.params;
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { data: portfolio, isLoading, refetch, isRefetching, error } = useQuery<PortfolioData>({
    queryKey: [`/api/users/${userId}/portfolio`],
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" style={{ marginTop: headerHeight + 100 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>Failed to load portfolio</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!portfolio) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.emptyState, { marginTop: headerHeight }]}>
          <Ionicons name="wallet-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Portfolio not found
          </Text>
        </View>
      </View>
    );
  }

  const { user, wealthRank, totalPurchaseValue, totalNetWorthGain, purchases } = portfolio;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{ paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
      }
    >
      <View style={styles.header}>
        <Avatar
          uri={user.avatarUrl}
          size={80}
          glowEffect
        />
        <Text style={[styles.displayName, { color: theme.text }]}>
          {user.displayName || user.username}
          {user.isVerified ? (
            <Text> <Ionicons name="checkmark-circle" size={18} color={theme.primary} /></Text>
          ) : null}
        </Text>
        <Text style={[styles.username, { color: theme.textSecondary }]}>
          @{user.username}
        </Text>
      </View>

      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.netWorthCard}
      >
        <Text style={styles.netWorthLabel}>Total Net Worth</Text>
        <Text style={styles.netWorthValue}>
          {formatFullCurrency(user.netWorth || 0)}
        </Text>
        {wealthRank ? (
          <View style={styles.rankBadge}>
            <Ionicons name="trophy" size={16} color="#FFD700" />
            <Text style={styles.rankText}>#{wealthRank} Worldwide</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>
            {purchases.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {formatCurrency(totalPurchaseValue)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Invested</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.statValue, { color: "#FFD700" }]}>
            {formatCurrency(totalNetWorthGain)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gained</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          <Ionicons name="bag" size={18} color={theme.primary} /> Luxury Collection
        </Text>
        
        {purchases.length === 0 ? (
          <View style={[styles.emptyPurchases, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="bag-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyPurchasesText, { color: theme.textSecondary }]}>
              No items in collection yet
            </Text>
          </View>
        ) : null}

        {purchases.map((purchase) => (
          <View
            key={purchase.id}
            style={[styles.purchaseCard, { backgroundColor: theme.backgroundSecondary }]}
          >
            <View style={styles.purchaseIcon}>
              <LinearGradient
                colors={Gradients.primary}
                style={styles.purchaseIconGradient}
              >
                <Ionicons name="diamond" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.purchaseInfo}>
              <Text style={[styles.purchaseName, { color: theme.text }]} numberOfLines={1}>
                {purchase.item.name}
              </Text>
              <Text style={[styles.purchaseDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                {purchase.item.description}
              </Text>
            </View>
            <View style={styles.purchaseValue}>
              <Text style={[styles.purchaseValueText, { color: theme.success }]}>
                +{formatCurrency(purchase.item.value * 10 * purchase.quantity)}
              </Text>
              {purchase.quantity > 1 ? (
                <Text style={[styles.purchaseQuantity, { color: theme.textSecondary }]}>
                  x{purchase.quantity}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  displayName: {
    ...Typography.title2,
    marginTop: Spacing.sm,
  },
  username: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  netWorthCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  netWorthLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: Spacing.xs,
  },
  netWorthValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  rankBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  rankText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subhead,
    marginBottom: Spacing.md,
  },
  purchaseCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  purchaseIcon: {
    width: 44,
    height: 44,
  },
  purchaseIconGradient: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseName: {
    fontSize: 15,
    fontWeight: "600",
  },
  purchaseDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  purchaseValue: {
    alignItems: "flex-end",
  },
  purchaseValueText: {
    fontSize: 14,
    fontWeight: "700",
  },
  purchaseQuantity: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyPurchases: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  emptyPurchasesText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
});
