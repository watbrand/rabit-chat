import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { GlassButton } from "@/components/GlassButton";

interface LoginSession {
  id: string;
  deviceType: string | null;
  deviceName: string | null;
  deviceInfo: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  isActive: boolean;
  isCurrent?: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export default function LoginActivityScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const {
    data: sessions,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery<LoginSession[]>({
    queryKey: ["/api/security/sessions"],
  });

  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("DELETE", `/api/security/sessions/${sessionId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/security/sessions"] });
      Alert.alert("Success", "Session has been terminated");
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error.message || "Failed to terminate session. Please try again."
      );
    },
  });

  const terminateAllSessionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/security/sessions/logout-all");
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/security/sessions"] });
      Alert.alert("Success", "All other sessions have been terminated");
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error.message || "Failed to terminate sessions. Please try again."
      );
    },
  });

  const formatRelativeTime = (dateString: string) => {
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
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (
    deviceType: string | null
  ): keyof typeof Feather.glyphMap => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return "smartphone";
      case "tablet":
        return "tablet";
      default:
        return "monitor";
    }
  };

  const handleTerminateSession = (session: LoginSession) => {
    if (session.isCurrent) {
      Alert.alert(
        "Cannot End Current Session",
        "You cannot end the session you're currently using. Log out from the settings instead."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "End Session",
      `Are you sure you want to end this session on "${session.deviceName || "Unknown Device"}"?\n\nThis device will be logged out immediately and will need to sign in again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            terminateSessionMutation.mutate(session.id);
          },
        },
      ]
    );
  };

  const handleTerminateAll = () => {
    const otherSessions = sessions?.filter((s) => !s.isCurrent && s.isActive).length || 0;

    if (otherSessions === 0) {
      Alert.alert(
        "No Other Sessions",
        "You only have one active session (this device)."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "End All Other Sessions",
      `This will immediately log out ${otherSessions} other device${otherSessions > 1 ? "s" : ""}. They will need to sign in again.\n\nAre you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End All Sessions",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            terminateAllSessionsMutation.mutate();
          },
        },
      ]
    );
  };

  const activeSessions = sessions?.filter((s) => s.isActive) || [];
  const inactiveSessions = sessions?.filter((s) => !s.isActive) || [];
  const otherActiveSessions = activeSessions.filter((s) => !s.isCurrent);

  const renderSessionItem = ({
    item,
    showTerminate = true,
  }: {
    item: LoginSession;
    showTerminate?: boolean;
  }) => (
    <View
      style={[
        styles.sessionItem,
        {
          backgroundColor: theme.glassStrong,
          borderColor: item.isCurrent
            ? theme.primary + "60"
            : item.isActive
            ? theme.success + "40"
            : theme.glassBorder,
        },
      ]}
    >
      <View style={styles.itemHeader}>
        <View
          style={[
            styles.deviceIconContainer,
            {
              backgroundColor: item.isCurrent
                ? theme.primary + "20"
                : item.isActive
                ? theme.success + "20"
                : theme.glassLight,
            },
          ]}
        >
          <Feather
            name={getDeviceIcon(item.deviceType)}
            size={20}
            color={
              item.isCurrent
                ? theme.primary
                : item.isActive
                ? theme.success
                : theme.textSecondary
            }
          />
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.deviceName}>
              {item.deviceName || "Unknown Device"}
            </ThemedText>
            {item.isCurrent ? (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: theme.primary }]}
                />
                <ThemedText
                  style={[styles.statusText, { color: theme.primary }]}
                >
                  Current
                </ThemedText>
              </View>
            ) : item.isActive ? (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.success + "20" },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: theme.success }]}
                />
                <ThemedText
                  style={[styles.statusText, { color: theme.success }]}
                >
                  Active
                </ThemedText>
              </View>
            ) : (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: theme.textTertiary + "20" },
                ]}
              >
                <ThemedText
                  style={[styles.statusText, { color: theme.textTertiary }]}
                >
                  Expired
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={[styles.timeInfo, { color: theme.textSecondary }]}>
            {item.isActive ? "Active " : "Last active "}
            {formatRelativeTime(item.lastActiveAt)}
          </ThemedText>
        </View>
        {showTerminate && !item.isCurrent && item.isActive ? (
          <Pressable
            onPress={() => handleTerminateSession(item)}
            style={[styles.terminateButton, { backgroundColor: theme.error + "15" }]}
            disabled={terminateSessionMutation.isPending}
          >
            {terminateSessionMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <Feather name="log-out" size={18} color={theme.error} />
            )}
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.detailsSection, { borderTopColor: theme.glassBorder }]}>
        {item.browser && item.os ? (
          <View style={styles.detailRow}>
            <Feather name="globe" size={14} color={theme.textSecondary} />
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
            >
              {item.browser} on {item.os}
            </ThemedText>
          </View>
        ) : null}
        {item.ipAddress ? (
          <View style={styles.detailRow}>
            <Feather name="wifi" size={14} color={theme.textSecondary} />
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
            >
              {item.ipAddress}
            </ThemedText>
          </View>
        ) : null}
        {item.location ? (
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText
              style={[styles.detailText, { color: theme.textSecondary }]}
            >
              {item.location}
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={theme.textSecondary} />
          <ThemedText
            style={[styles.detailText, { color: theme.textSecondary }]}
          >
            Signed in {formatDateTime(item.createdAt)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { paddingTop: headerHeight + Spacing.md }]}>
      <EmptyState
        title="No Login Activity"
        message="Your login activity will appear here when you sign in from different devices."
        icon="activity"
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={[styles.emptyContainer, { paddingTop: headerHeight + Spacing.md }]}>
      <EmptyState
        title="Unable to Load Activity"
        message="We couldn't load your login activity. Please check your connection and try again."
        icon="alert-circle"
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    </View>
  );

  const renderListHeader = () => {
    if (!sessions || sessions.length === 0) return null;

    return (
      <View style={styles.headerSection}>
        <ThemedText
          style={[styles.sectionDescription, { color: theme.textSecondary }]}
        >
          Review your active sessions and sign out from devices you don't
          recognize. If you see suspicious activity, change your password
          immediately.
        </ThemedText>

        {otherActiveSessions.length > 0 ? (
          <Pressable
            onPress={handleTerminateAll}
            style={[
              styles.terminateAllButton,
              { backgroundColor: theme.error + "15", borderColor: theme.error + "30" },
            ]}
            disabled={terminateAllSessionsMutation.isPending}
          >
            {terminateAllSessionsMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="log-out" size={18} color={theme.error} />
                <ThemedText style={[styles.terminateAllText, { color: theme.error }]}>
                  End All Other Sessions ({otherActiveSessions.length})
                </ThemedText>
              </>
            )}
          </Pressable>
        ) : null}

        {activeSessions.length > 0 ? (
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionDot, { backgroundColor: theme.success }]}
            />
            <ThemedText style={styles.sectionTitle}>
              Active Sessions ({activeSessions.length})
            </ThemedText>
          </View>
        ) : null}
      </View>
    );
  };

  const renderListFooter = () => {
    if (inactiveSessions.length === 0) return null;

    return (
      <View style={styles.footerSection}>
        <View style={styles.sectionHeader}>
          <View
            style={[styles.sectionDot, { backgroundColor: theme.textTertiary }]}
          />
          <ThemedText style={styles.sectionTitle}>
            Recent Sessions ({inactiveSessions.length})
          </ThemedText>
        </View>
        {inactiveSessions.map((session) => (
          <View key={session.id}>
            {renderSessionItem({ item: session, showTerminate: false })}
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
        <LoadingIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight },
        ]}
      >
        {renderErrorState()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={activeSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderSessionItem({ item })}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        ListEmptyComponent={
          sessions && sessions.length > 0 ? null : renderEmptyState
        }
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
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
    marginBottom: Spacing.sm,
    gap: Spacing.lg,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  terminateAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  terminateAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerSection: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  sessionItem: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeInfo: {
    fontSize: 13,
  },
  terminateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    alignItems: "center",
  },
});
