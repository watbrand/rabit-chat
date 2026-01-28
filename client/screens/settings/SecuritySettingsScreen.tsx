import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Session {
  id: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface LoginSession {
  id: string;
  deviceType: string | null;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  isActive: boolean;
  lastActiveAt: string;
  createdAt: string;
}

interface TrustedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  lastUsedAt: string;
}

export default function SecuritySettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ["/api/me/sessions"],
  });

  const { data: loginSessions, isLoading: loginSessionsLoading } = useQuery<LoginSession[]>({
    queryKey: ["/api/security/sessions"],
  });

  const { data: trustedDevices, isLoading: devicesLoading } = useQuery<TrustedDevice[]>({
    queryKey: ["/api/security/devices"],
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/me/change-password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to change password");
    },
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/me/sessions/revoke-all");
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "All other sessions have been signed out");
      queryClient.invalidateQueries({ queryKey: ["/api/me/sessions"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to revoke sessions");
    },
  });

  const invalidateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("DELETE", `/api/security/sessions/${sessionId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/security/sessions"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to end session");
    },
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/security/sessions/logout-all");
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Logged out from all other devices");
      queryClient.invalidateQueries({ queryKey: ["/api/security/sessions"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to logout all");
    },
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
      Alert.alert("Error", error.message || "Failed to remove device");
    },
  });

  const handleChangePassword = () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }
    if (!newPassword) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleRevokeSessions = () => {
    const otherSessions = sessions?.filter(s => !s.isCurrent).length || 0;
    if (otherSessions === 0) {
      Alert.alert("No Other Sessions", "You only have one active session");
      return;
    }
    Alert.alert(
      "Sign Out Other Sessions",
      `This will sign out ${otherSessions} other session${otherSessions > 1 ? "s" : ""}. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out All",
          style: "destructive",
          onPress: () => revokeSessionsMutation.mutate(),
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Change Password
        </ThemedText>
        <View
          style={[
            styles.formContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Current Password</ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: theme.glassBorder, backgroundColor: theme.backgroundRoot },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Feather
                  name={showCurrentPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>New Password</ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: theme.glassBorder, backgroundColor: theme.backgroundRoot },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Enter new password"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                <Feather
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Confirm New Password</ThemedText>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: theme.glassBorder, backgroundColor: theme.backgroundRoot },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showNewPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleChangePassword}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Change Password</ThemedText>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Active Sessions
        </ThemedText>
        <View
          style={[
            styles.sessionsContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          {sessionsLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <ThemedText style={styles.sessionCount}>
                {sessions?.length || 0} active session{sessions?.length !== 1 ? "s" : ""}
              </ThemedText>
              {sessions?.map((session) => (
                <View
                  key={session.id}
                  style={[styles.sessionItem, { borderColor: theme.glassBorder }]}
                >
                  <Feather
                    name={session.isCurrent ? "smartphone" : "monitor"}
                    size={20}
                    color={session.isCurrent ? theme.primary : theme.textSecondary}
                  />
                  <View style={styles.sessionInfo}>
                    <ThemedText style={styles.sessionLabel}>
                      {session.isCurrent ? "Current Session" : "Other Session"}
                    </ThemedText>
                    <ThemedText style={[styles.sessionExpiry, { color: theme.textSecondary }]}>
                      Expires: {new Date(session.expiresAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </View>
              ))}
              <Pressable
                style={[styles.revokeButton, { borderColor: theme.error }]}
                onPress={handleRevokeSessions}
                disabled={revokeSessionsMutation.isPending}
              >
                {revokeSessionsMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.error} />
                ) : (
                  <ThemedText style={[styles.revokeButtonText, { color: theme.error }]}>
                    Sign Out Other Sessions
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Login History
        </ThemedText>
        <View
          style={[
            styles.sessionsContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          {loginSessionsLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : loginSessions && loginSessions.length > 0 ? (
            <>
              <ThemedText style={styles.sessionCount}>
                {loginSessions.length} recent login{loginSessions.length !== 1 ? "s" : ""}
              </ThemedText>
              {loginSessions.slice(0, 5).map((session) => (
                <View
                  key={session.id}
                  style={[styles.sessionItem, { borderColor: theme.glassBorder }]}
                >
                  <Feather
                    name={session.deviceType === "mobile" ? "smartphone" : "monitor"}
                    size={20}
                    color={session.isActive ? theme.primary : theme.textSecondary}
                  />
                  <View style={styles.sessionInfo}>
                    <ThemedText style={styles.sessionLabel}>
                      {session.deviceName || session.browser || "Unknown Device"}
                    </ThemedText>
                    <ThemedText style={[styles.sessionExpiry, { color: theme.textSecondary }]}>
                      {session.location || session.ipAddress || "Unknown location"}
                    </ThemedText>
                    <ThemedText style={[styles.sessionExpiry, { color: theme.textSecondary }]}>
                      {new Date(session.lastActiveAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  {session.isActive ? (
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          "End Session",
                          "This will sign out this device. Continue?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "End Session",
                              style: "destructive",
                              onPress: () => invalidateSessionMutation.mutate(session.id),
                            },
                          ]
                        );
                      }}
                    >
                      <Feather name="x-circle" size={20} color={theme.error} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
              <Pressable
                style={[styles.revokeButton, { borderColor: theme.error }]}
                onPress={() => {
                  Alert.alert(
                    "Logout All Devices",
                    "This will sign you out from all other devices. You'll stay logged in here.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Logout All",
                        style: "destructive",
                        onPress: () => logoutAllMutation.mutate(),
                      },
                    ]
                  );
                }}
                disabled={logoutAllMutation.isPending}
              >
                {logoutAllMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.error} />
                ) : (
                  <ThemedText style={[styles.revokeButtonText, { color: theme.error }]}>
                    Logout All Other Devices
                  </ThemedText>
                )}
              </Pressable>
            </>
          ) : (
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No login history available
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Trusted Devices
        </ThemedText>
        <View
          style={[
            styles.sessionsContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          {devicesLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : trustedDevices && trustedDevices.length > 0 ? (
            <>
              <ThemedText style={styles.sessionCount}>
                {trustedDevices.length} trusted device{trustedDevices.length !== 1 ? "s" : ""}
              </ThemedText>
              {trustedDevices.map((device) => (
                <View
                  key={device.id}
                  style={[styles.sessionItem, { borderColor: theme.glassBorder }]}
                >
                  <Feather
                    name={device.deviceType === "mobile" ? "smartphone" : "monitor"}
                    size={20}
                    color={theme.success}
                  />
                  <View style={styles.sessionInfo}>
                    <ThemedText style={styles.sessionLabel}>
                      {device.deviceName}
                    </ThemedText>
                    <ThemedText style={[styles.sessionExpiry, { color: theme.textSecondary }]}>
                      {device.browser} - {device.os}
                    </ThemedText>
                    <ThemedText style={[styles.sessionExpiry, { color: theme.textSecondary }]}>
                      Last used: {new Date(device.lastUsedAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Remove Device",
                        `Remove "${device.deviceName}" from trusted devices?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => removeDeviceMutation.mutate(device.id),
                          },
                        ]
                      );
                    }}
                  >
                    <Feather name="trash-2" size={18} color={theme.error} />
                  </Pressable>
                </View>
              ))}
            </>
          ) : (
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No trusted devices. When you login from a new device, you can mark it as trusted.
            </ThemedText>
          )}
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  formContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  primaryButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sessionsContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  sessionCount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  sessionExpiry: {
    fontSize: 12,
  },
  revokeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  revokeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
});
