import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { GlassButton } from "@/components/GlassButton";

interface TrustedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  lastUsedAt: string;
  trustLevel?: "standard" | "elevated" | "full";
  isCurrent?: boolean;
}

type TrustLevel = "standard" | "elevated" | "full";

const TRUST_LEVEL_CONFIG: Record<TrustLevel, { label: string; description: string; color: string }> = {
  standard: {
    label: "Standard",
    description: "Basic access with regular security checks",
    color: "#A8A8B0",
  },
  elevated: {
    label: "Elevated",
    description: "Skip some security prompts",
    color: "#F59E0B",
  },
  full: {
    label: "Full Trust",
    description: "Complete access without additional verification",
    color: "#10B981",
  },
};

export default function TrustedDevicesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [selectedDevice, setSelectedDevice] = useState<TrustedDevice | null>(null);
  const [showTrustLevelModal, setShowTrustLevelModal] = useState(false);

  const {
    data: trustedDevices,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery<TrustedDevice[]>({
    queryKey: ["/api/security/devices"],
  });

  const removeDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return apiRequest("DELETE", `/api/security/devices/${deviceId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/security/devices"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error.message || "Failed to remove device. Please try again."
      );
    },
  });

  const updateTrustLevelMutation = useMutation({
    mutationFn: async ({
      deviceId,
      trustLevel,
    }: {
      deviceId: string;
      trustLevel: TrustLevel;
    }) => {
      return apiRequest("PATCH", `/api/security/devices/${deviceId}`, {
        trustLevel,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/security/devices"] });
      setShowTrustLevelModal(false);
      setSelectedDevice(null);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        error.message || "Failed to update trust level. Please try again."
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

  const handleRemoveDevice = (device: TrustedDevice) => {
    if (device.isCurrent) {
      Alert.alert(
        "Cannot Remove",
        "You cannot remove the device you're currently using."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Remove Trusted Device",
      `Are you sure you want to remove "${device.deviceName || "Unknown Device"}" from your trusted devices?\n\nThis device will need to verify its identity again on the next login.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeDeviceMutation.mutate(device.id);
          },
        },
      ]
    );
  };

  const handleTrustLevelPress = (device: TrustedDevice) => {
    setSelectedDevice(device);
    setShowTrustLevelModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTrustLevelChange = (level: TrustLevel) => {
    if (!selectedDevice) return;

    if (level === "full") {
      Alert.alert(
        "Confirm Full Trust",
        "Full trust allows this device to skip all additional security checks. Only use this for devices you fully control.\n\nContinue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm",
            onPress: () => {
              updateTrustLevelMutation.mutate({
                deviceId: selectedDevice.id,
                trustLevel: level,
              });
            },
          },
        ]
      );
    } else {
      updateTrustLevelMutation.mutate({
        deviceId: selectedDevice.id,
        trustLevel: level,
      });
    }
  };

  const renderTrustLevelBadge = (device: TrustedDevice) => {
    const level = device.trustLevel || "standard";
    const config = TRUST_LEVEL_CONFIG[level];

    return (
      <Pressable
        onPress={() => handleTrustLevelPress(device)}
        style={[
          styles.trustLevelBadge,
          { backgroundColor: config.color + "20" },
        ]}
      >
        <View
          style={[styles.trustLevelDot, { backgroundColor: config.color }]}
        />
        <ThemedText style={[styles.trustLevelText, { color: config.color }]}>
          {config.label}
        </ThemedText>
        <Feather name="chevron-down" size={12} color={config.color} />
      </Pressable>
    );
  };

  const renderItem = ({ item }: { item: TrustedDevice }) => (
    <View
      style={[
        styles.deviceItem,
        {
          backgroundColor: theme.glassStrong,
          borderColor: item.isCurrent ? theme.primary + "60" : theme.glassBorder,
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
                : theme.glassLight,
            },
          ]}
        >
          <Feather
            name={getDeviceIcon(item.deviceType)}
            size={20}
            color={item.isCurrent ? theme.primary : theme.textSecondary}
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
                  styles.currentBadge,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <ThemedText
                  style={[styles.currentBadgeText, { color: theme.primary }]}
                >
                  This Device
                </ThemedText>
              </View>
            ) : null}
          </View>
          {renderTrustLevelBadge(item)}
        </View>
        {!item.isCurrent ? (
          <Pressable
            onPress={() => handleRemoveDevice(item)}
            style={[styles.removeButton, { backgroundColor: theme.error + "15" }]}
            disabled={removeDeviceMutation.isPending}
          >
            {removeDeviceMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <Feather name="trash-2" size={18} color={theme.error} />
            )}
          </Pressable>
        ) : null}
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
        <View style={styles.detailRow}>
          <Feather name="clock" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
            Last used {formatRelativeTime(item.lastUsedAt)}
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { paddingTop: headerHeight + Spacing.md }]}>
      <EmptyState
        title="No Trusted Devices"
        message="When you mark a device as trusted, it will appear here. Trusted devices can skip some security checks."
        icon="shield"
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={[styles.emptyContainer, { paddingTop: headerHeight + Spacing.md }]}>
      <EmptyState
        title="Unable to Load Devices"
        message="We couldn't load your trusted devices. Please check your connection and try again."
        icon="alert-circle"
        actionLabel="Retry"
        onAction={() => refetch()}
      />
    </View>
  );

  const renderTrustLevelModal = () => (
    <Modal
      visible={showTrustLevelModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowTrustLevelModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Device Trust Level
            </ThemedText>
            <Pressable
              onPress={() => setShowTrustLevelModal(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <ThemedText
              style={[styles.modalDescription, { color: theme.textSecondary }]}
            >
              Choose how much you trust this device. Higher trust levels skip
              more security checks.
            </ThemedText>

            {(Object.keys(TRUST_LEVEL_CONFIG) as TrustLevel[]).map((level) => {
              const config = TRUST_LEVEL_CONFIG[level];
              const isSelected = selectedDevice?.trustLevel === level || (!selectedDevice?.trustLevel && level === "standard");

              return (
                <Pressable
                  key={level}
                  onPress={() => handleTrustLevelChange(level)}
                  style={[
                    styles.trustLevelOption,
                    {
                      backgroundColor: isSelected
                        ? config.color + "15"
                        : theme.glassLight,
                      borderColor: isSelected ? config.color : theme.glassBorder,
                    },
                  ]}
                  disabled={updateTrustLevelMutation.isPending}
                >
                  <View style={styles.trustLevelOptionHeader}>
                    <View
                      style={[
                        styles.trustLevelOptionDot,
                        { backgroundColor: config.color },
                      ]}
                    />
                    <ThemedText
                      style={[styles.trustLevelOptionLabel, { color: config.color }]}
                    >
                      {config.label}
                    </ThemedText>
                    {isSelected ? (
                      <Feather name="check" size={18} color={config.color} />
                    ) : null}
                  </View>
                  <ThemedText
                    style={[
                      styles.trustLevelOptionDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {config.description}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );

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
        data={trustedDevices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          trustedDevices && trustedDevices.length > 0 ? (
            <View style={styles.headerSection}>
              <ThemedText
                style={[styles.sectionDescription, { color: theme.textSecondary }]}
              >
                Manage devices you've marked as trusted. Trusted devices may
                skip additional verification steps.
              </ThemedText>
            </View>
          ) : null
        }
      />
      {renderTrustLevelModal()}
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
  deviceItem: {
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
    gap: 6,
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
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  trustLevelBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  trustLevelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trustLevelText: {
    fontSize: 12,
    fontWeight: "500",
  },
  removeButton: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  trustLevelOption: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  trustLevelOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  trustLevelOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trustLevelOptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  trustLevelOptionDescription: {
    fontSize: 13,
    marginLeft: 18,
  },
});
