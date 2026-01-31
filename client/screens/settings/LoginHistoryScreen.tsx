import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface LoginHistoryEntry {
  id: string;
  timestamp: string;
  ipAddress: string | null;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  success: boolean;
}

export default function LoginHistoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();

  const { data: loginHistory, isLoading, refetch, isRefetching } = useQuery<LoginHistoryEntry[]>({
    queryKey: ["/api/me/login-history"],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (deviceType: string | null): keyof typeof Feather.glyphMap => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return "smartphone";
      case "tablet":
        return "tablet";
      default:
        return "monitor";
    }
  };

  const renderItem = ({ item }: { item: LoginHistoryEntry }) => (
    <View
      style={[
        styles.historyItem,
        {
          backgroundColor: theme.glassStrong,
          borderColor: item.success ? theme.glassBorder : theme.error + "40",
        },
      ]}
    >
      <View style={styles.itemHeader}>
        <View
          style={[
            styles.deviceIconContainer,
            {
              backgroundColor: item.success 
                ? theme.success + "20" 
                : theme.error + "20",
            },
          ]}
        >
          <Feather
            name={getDeviceIcon(item.deviceType)}
            size={20}
            color={item.success ? theme.success : theme.error}
          />
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.deviceName}>
            {item.deviceName || "Unknown Device"}
          </ThemedText>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.success 
                    ? theme.success + "20" 
                    : theme.error + "20",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.success ? theme.success : theme.error,
                  },
                ]}
              />
              <ThemedText
                style={[
                  styles.statusText,
                  { color: item.success ? theme.success : theme.error },
                ]}
              >
                {item.success ? "Successful" : "Failed"}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <ThemedText style={[styles.timeAgo, { color: theme.textSecondary }]}>
            {formatDate(item.timestamp)}
          </ThemedText>
          <ThemedText style={[styles.exactTime, { color: theme.textTertiary }]}>
            {formatTime(item.timestamp)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.detailsSection, { borderTopColor: theme.glassBorder }]}>
        {item.browser && item.os ? (
          <View style={styles.detailRow}>
            <Feather name="globe" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {item.browser} on {item.os}
            </ThemedText>
          </View>
        ) : null}
        {item.ipAddress ? (
          <View style={styles.detailRow}>
            <Feather name="wifi" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {item.ipAddress}
            </ThemedText>
          </View>
        ) : null}
        {item.location ? (
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {item.location}
            </ThemedText>
          </View>
        ) : null}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyState
        title="No Login History"
        message="Your recent login activity will appear here"
        icon="shield"
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={loginHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          loginHistory && loginHistory.length > 0 ? (
            <View style={styles.headerSection}>
              <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
                Review your recent login activity. If you see any suspicious activity, 
                change your password immediately.
              </ThemedText>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  headerSection: {
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  historyItem: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
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
  timeContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  timeAgo: {
    fontSize: 12,
    fontWeight: "500",
  },
  exactTime: {
    fontSize: 11,
  },
  detailsSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: "center",
  },
});
