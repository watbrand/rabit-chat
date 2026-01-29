import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface TwoFactorStatus {
  isEnabled: boolean;
  method: string | null;
  enabledAt: string | null;
}

interface LoginSession {
  id: string;
  userId: string;
  sessionToken: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
}

interface TrustedDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName: string;
  deviceType: string | null;
  createdAt: string;
  lastUsedAt: string;
}

interface LinkedAccount {
  id: string;
  userId: string;
  provider: string;
  providerId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  linkedAt: string;
}

export function SecuritySettingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [is2faModalVisible, setIs2faModalVisible] = useState(false);

  const { data: twoFactorStatus, isLoading: loading2fa } = useQuery<TwoFactorStatus>({
    queryKey: ["/api/security/2fa"],
    enabled: !!user,
  });

  const { data: loginSessions, isLoading: loadingSessions } = useQuery<LoginSession[]>({
    queryKey: ["/api/sessions"],
    enabled: !!user,
  });

  const { data: trustedDevices, isLoading: loadingDevices } = useQuery<TrustedDevice[]>({
    queryKey: ["/api/devices"],
    enabled: !!user,
  });

  const { data: linkedAccounts, isLoading: loadingAccounts } = useQuery<LinkedAccount[]>({
    queryKey: ["/api/linked-accounts"],
    enabled: !!user,
  });

  const setup2faMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/security/2fa/setup", { method: "TOTP" });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/2fa"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "2FA Setup",
        `Two-factor authentication has been enabled. Your setup key is: ${data.secret || 'Check your authenticator app'}`,
        [{ text: "OK" }]
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to setup 2FA");
    },
  });

  const disable2faMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/security/2fa");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security/2fa"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Two-factor authentication has been disabled");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to disable 2FA");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("DELETE", `/api/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to revoke session");
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/sessions?exceptCurrent=true");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "All other sessions have been logged out");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to revoke sessions");
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return apiRequest("DELETE", `/api/devices/${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to remove device");
    },
  });

  const unlinkAccountMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest("DELETE", `/api/linked-accounts/${provider}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/linked-accounts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to unlink account");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/security/2fa"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/linked-accounts"] }),
    ]);
    setRefreshing(false);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const getDeviceIcon = (deviceInfo: string | null): keyof typeof Feather.glyphMap => {
    if (!deviceInfo) return "monitor";
    const info = deviceInfo.toLowerCase();
    if (info.includes("iphone") || info.includes("android")) return "smartphone";
    if (info.includes("ipad") || info.includes("tablet")) return "tablet";
    return "monitor";
  };

  const getProviderIcon = (provider: string): keyof typeof Feather.glyphMap => {
    switch (provider.toLowerCase()) {
      case "google": return "mail";
      case "apple": return "message-circle";
      case "twitter": return "twitter";
      case "facebook": return "facebook";
      default: return "link";
    }
  };

  const confirmToggle2fa = () => {
    if (twoFactorStatus?.isEnabled) {
      Alert.alert(
        "Disable 2FA",
        "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: () => disable2faMutation.mutate(),
          },
        ]
      );
    } else {
      Alert.alert(
        "Enable 2FA",
        "Two-factor authentication adds an extra layer of security to your account. You'll need an authenticator app to set this up.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable",
            onPress: () => setup2faMutation.mutate(),
          },
        ]
      );
    }
  };

  const confirmRevokeSession = (sessionId: string) => {
    Alert.alert(
      "Revoke Session",
      "This will log out this device. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: () => revokeSessionMutation.mutate(sessionId),
        },
      ]
    );
  };

  const confirmRevokeAllSessions = () => {
    Alert.alert(
      "Log Out All Devices",
      "This will log out all other devices except this one. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out All",
          style: "destructive",
          onPress: () => revokeAllSessionsMutation.mutate(),
        },
      ]
    );
  };

  const confirmRemoveDevice = (deviceId: string, deviceName: string) => {
    Alert.alert(
      "Remove Device",
      `Remove "${deviceName}" from trusted devices? You'll need to verify again on this device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeDeviceMutation.mutate(deviceId),
        },
      ]
    );
  };

  const confirmUnlinkAccount = (provider: string) => {
    Alert.alert(
      "Unlink Account",
      `Unlink your ${provider} account? You won't be able to sign in with ${provider} anymore.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: () => unlinkAccountMutation.mutate(provider),
        },
      ]
    );
  };

  const activeSessions = loginSessions?.filter((s) => s.isActive) || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <Animated.View entering={FadeInUp.delay(0)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="shield" size={20} color={theme.primary} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Two-Factor Authentication
              </ThemedText>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={[styles.settingLabel, { color: theme.text }]}>
                  Enable 2FA
                </ThemedText>
                <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>
                  Add extra security to your account
                </ThemedText>
              </View>
              {loading2fa ? (
                <LoadingIndicator size="small" />
              ) : (
                <Switch
                  value={twoFactorStatus?.isEnabled ?? false}
                  onValueChange={confirmToggle2fa}
                  trackColor={{ false: theme.glassBorder, true: theme.primary + "80" }}
                  thumbColor={twoFactorStatus?.isEnabled ? theme.primary : theme.textSecondary}
                  disabled={setup2faMutation.isPending || disable2faMutation.isPending}
                />
              )}
            </View>

            {twoFactorStatus?.isEnabled ? (
              <View style={[styles.statusBadge, { backgroundColor: theme.success + "20" }]}>
                <Feather name="check-circle" size={14} color={theme.success} />
                <ThemedText style={[styles.statusText, { color: theme.success }]}>
                  Protected since {new Date(twoFactorStatus.enabledAt!).toLocaleDateString()}
                </ThemedText>
              </View>
            ) : null}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="monitor" size={20} color={theme.primary} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Active Sessions ({activeSessions.length})
              </ThemedText>
            </View>

            {loadingSessions ? (
              <LoadingIndicator size="small" style={styles.loader} />
            ) : activeSessions.length > 0 ? (
              <>
                {activeSessions.map((session) => (
                  <View key={session.id} style={styles.sessionRow}>
                    <View style={[styles.sessionIcon, { backgroundColor: theme.primary + "20" }]}>
                      <Feather
                        name={getDeviceIcon(session.deviceInfo)}
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.sessionInfo}>
                      <ThemedText style={[styles.sessionDevice, { color: theme.text }]}>
                        {session.deviceInfo || "Unknown Device"}
                      </ThemedText>
                      <ThemedText style={[styles.sessionMeta, { color: theme.textSecondary }]}>
                        {session.location || session.ipAddress || "Unknown location"} • {formatTime(session.lastActiveAt)}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => confirmRevokeSession(session.id)}
                      style={styles.revokeButton}
                    >
                      <Feather name="x" size={18} color={theme.error} />
                    </Pressable>
                  </View>
                ))}

                {activeSessions.length > 1 ? (
                  <Pressable
                    style={[styles.dangerButton, { borderColor: theme.error }]}
                    onPress={confirmRevokeAllSessions}
                    disabled={revokeAllSessionsMutation.isPending}
                  >
                    {revokeAllSessionsMutation.isPending ? (
                      <LoadingIndicator size="small" />
                    ) : (
                      <>
                        <Feather name="log-out" size={16} color={theme.error} />
                        <ThemedText style={[styles.dangerButtonText, { color: theme.error }]}>
                          Log Out All Other Devices
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </>
            ) : (
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No active sessions found
              </ThemedText>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="smartphone" size={20} color={theme.primary} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Trusted Devices ({trustedDevices?.length || 0})
              </ThemedText>
            </View>

            {loadingDevices ? (
              <LoadingIndicator size="small" style={styles.loader} />
            ) : trustedDevices && trustedDevices.length > 0 ? (
              trustedDevices.map((device) => (
                <View key={device.id} style={styles.sessionRow}>
                  <View style={[styles.sessionIcon, { backgroundColor: theme.success + "20" }]}>
                    <Feather name="check" size={18} color={theme.success} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <ThemedText style={[styles.sessionDevice, { color: theme.text }]}>
                      {device.deviceName}
                    </ThemedText>
                    <ThemedText style={[styles.sessionMeta, { color: theme.textSecondary }]}>
                      Added {formatTime(device.createdAt)} • Last used {formatTime(device.lastUsedAt)}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => confirmRemoveDevice(device.id, device.deviceName)}
                    style={styles.revokeButton}
                  >
                    <Feather name="trash-2" size={16} color={theme.error} />
                  </Pressable>
                </View>
              ))
            ) : (
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No trusted devices. Trust a device to skip verification on future logins.
              </ThemedText>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="link" size={20} color={theme.primary} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Linked Accounts ({linkedAccounts?.length || 0})
              </ThemedText>
            </View>

            {loadingAccounts ? (
              <LoadingIndicator size="small" style={styles.loader} />
            ) : linkedAccounts && linkedAccounts.length > 0 ? (
              linkedAccounts.map((account) => (
                <View key={account.id} style={styles.sessionRow}>
                  <View style={[styles.sessionIcon, { backgroundColor: theme.primary + "20" }]}>
                    <Feather name={getProviderIcon(account.provider)} size={18} color={theme.primary} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <ThemedText style={[styles.sessionDevice, { color: theme.text }]}>
                      {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                    </ThemedText>
                    <ThemedText style={[styles.sessionMeta, { color: theme.textSecondary }]}>
                      {account.email || account.displayName || "Connected"}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => confirmUnlinkAccount(account.provider)}
                    style={styles.revokeButton}
                  >
                    <Feather name="x-circle" size={18} color={theme.error} />
                  </Pressable>
                </View>
              ))
            ) : (
              <View>
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Link accounts for easier sign-in options
                </ThemedText>
                <View style={styles.linkOptions}>
                  <Pressable style={[styles.linkButton, { backgroundColor: "#DB4437" }]}>
                    <Feather name="mail" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.linkButtonText}>Google</ThemedText>
                  </Pressable>
                  <Pressable style={[styles.linkButton, { backgroundColor: "#000000" }]}>
                    <Feather name="message-circle" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.linkButtonText}>Apple</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="download" size={20} color={theme.primary} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Account Data
              </ThemedText>
            </View>

            <Pressable style={[styles.actionButton, { backgroundColor: theme.glassBackground }]}>
              <Feather name="download-cloud" size={18} color={theme.primary} />
              <ThemedText style={[styles.actionButtonText, { color: theme.text }]}>
                Download My Data
              </ThemedText>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </Pressable>

            <Pressable style={[styles.actionButton, { backgroundColor: theme.glassBackground }]}>
              <Feather name="archive" size={18} color={theme.primary} />
              <ThemedText style={[styles.actionButtonText, { color: theme.text }]}>
                Request Account Backup
              </ThemedText>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </Pressable>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)}>
          <Card style={{ ...styles.sectionCard, borderColor: theme.error + "40" }}>
            <View style={styles.sectionHeader}>
              <Feather name="alert-triangle" size={20} color={theme.error} />
              <ThemedText style={[styles.sectionTitle, { color: theme.error }]}>
                Danger Zone
              </ThemedText>
            </View>

            <Pressable style={[styles.dangerButton, { borderColor: theme.error }]}>
              <Feather name="user-x" size={16} color={theme.error} />
              <ThemedText style={[styles.dangerButtonText, { color: theme.error }]}>
                Deactivate Account
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.dangerButton,
                { borderColor: theme.error, backgroundColor: theme.error + "10" },
              ]}
            >
              <Feather name="trash-2" size={16} color={theme.error} />
              <ThemedText style={[styles.dangerButtonText, { color: theme.error }]}>
                Delete Account Permanently
              </ThemedText>
            </Pressable>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  statusText: {
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  loader: {
    paddingVertical: Spacing.lg,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDevice: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  revokeButton: {
    padding: Spacing.sm,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  dangerButtonText: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  linkOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  linkButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  linkButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
});
