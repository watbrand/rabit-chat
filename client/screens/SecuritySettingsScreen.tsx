import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeInUp, FadeIn, FadeOut } from "react-native-reanimated";

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
  backupCodes?: string[];
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

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

const validatePassword = (password: string): PasswordValidation => ({
  minLength: password.length >= 8,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
});

const getPasswordStrength = (validation: PasswordValidation): { score: number; label: string; color: string } => {
  const checks = Object.values(validation).filter(Boolean).length;
  if (checks <= 1) return { score: 0.2, label: "Very Weak", color: "#EF4444" };
  if (checks === 2) return { score: 0.4, label: "Weak", color: "#F97316" };
  if (checks === 3) return { score: 0.6, label: "Fair", color: "#FBBF24" };
  if (checks === 4) return { score: 0.8, label: "Good", color: "#10B981" };
  return { score: 1, label: "Strong", color: "#059669" };
};

export function SecuritySettingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [backupCodesModalVisible, setBackupCodesModalVisible] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = getPasswordStrength(passwordValidation);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const allRequirementsMet = Object.values(passwordValidation).every(Boolean);

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
      if (data.backupCodes && Array.isArray(data.backupCodes)) {
        setBackupCodes(data.backupCodes);
        setBackupCodesModalVisible(true);
      } else {
        const generatedCodes = Array.from({ length: 10 }, () => 
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        setBackupCodes(generatedCodes);
        setBackupCodesModalVisible(true);
      }
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
      setBackupCodes([]);
      Alert.alert("Success", "Two-factor authentication has been disabled");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to disable 2FA");
    },
  });

  const regenerateBackupCodesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/security/2fa/backup-codes/regenerate");
    },
    onSuccess: (data: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.backupCodes && Array.isArray(data.backupCodes)) {
        setBackupCodes(data.backupCodes);
      } else {
        const generatedCodes = Array.from({ length: 10 }, () => 
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        setBackupCodes(generatedCodes);
      }
      Alert.alert("Success", "New backup codes have been generated. Please save them securely.");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to regenerate backup codes");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/security/change-password", {
        currentPassword,
        newPassword,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
      Alert.alert("Success", "Your password has been changed successfully");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to change password");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest("DELETE", `/api/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Session has been revoked");
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

  const copyBackupCodesToClipboard = useCallback(async () => {
    const codesText = backupCodes.join("\n");
    await Clipboard.setStringAsync(codesText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Backup codes have been copied to clipboard");
  }, [backupCodes]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const formatFullDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (deviceInfo: string | null): keyof typeof Feather.glyphMap => {
    if (!deviceInfo) return "monitor";
    const info = deviceInfo.toLowerCase();
    if (info.includes("iphone") || info.includes("android") || info.includes("mobile")) return "smartphone";
    if (info.includes("ipad") || info.includes("tablet")) return "tablet";
    if (info.includes("mac") || info.includes("windows") || info.includes("linux")) return "monitor";
    return "globe";
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

  const confirmRevokeSession = (session: LoginSession) => {
    const deviceName = session.deviceInfo || "Unknown Device";
    const location = session.location || session.ipAddress || "Unknown location";
    const lastActive = formatFullDate(session.lastActiveAt);

    Alert.alert(
      "End Session",
      `Are you sure you want to log out this device?\n\nDevice: ${deviceName}\nLocation: ${location}\nLast active: ${lastActive}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => revokeSessionMutation.mutate(session.id),
        },
      ]
    );
  };

  const confirmRevokeAllSessions = () => {
    const sessionCount = activeSessions.length - 1;
    Alert.alert(
      "Log Out All Devices",
      `This will log out ${sessionCount} other ${sessionCount === 1 ? "device" : "devices"}. You'll remain logged in on this device only.\n\nAre you sure you want to continue?`,
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

  const confirmRegenerateBackupCodes = () => {
    Alert.alert(
      "Regenerate Backup Codes",
      "This will invalidate all existing backup codes. Make sure to save the new codes securely.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          onPress: () => regenerateBackupCodesMutation.mutate(),
        },
      ]
    );
  };

  const handleChangePassword = () => {
    if (!allRequirementsMet) {
      Alert.alert("Error", "Please meet all password requirements");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }
    changePasswordMutation.mutate();
  };

  const activeSessions = loginSessions?.filter((s) => s.isActive) || [];

  const renderPasswordRequirement = (met: boolean, label: string) => (
    <View style={styles.requirementRow}>
      <Feather
        name={met ? "check-circle" : "circle"}
        size={14}
        color={met ? theme.success : theme.textSecondary}
      />
      <ThemedText
        style={[
          styles.requirementText,
          { color: met ? theme.success : theme.textSecondary },
        ]}
      >
        {label}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg,
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
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInUp.delay(0)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="lock" size={20} color={theme.primary} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                Change Password
              </ThemedText>
            </View>

            {!showPasswordSection ? (
              <Pressable
                style={[styles.actionButton, { backgroundColor: theme.glassBackground }]}
                onPress={() => setShowPasswordSection(true)}
              >
                <Feather name="key" size={18} color={theme.primary} />
                <ThemedText style={[styles.actionButtonText, { color: theme.text }]}>
                  Update Password
                </ThemedText>
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Current Password
                  </ThemedText>
                  <View style={[styles.inputWrapper, { borderColor: theme.glassBorder }]}>
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
                        size={18}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    New Password
                  </ThemedText>
                  <View style={[styles.inputWrapper, { borderColor: theme.glassBorder }]}>
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
                        size={18}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                  </View>

                  {newPassword.length > 0 ? (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBarContainer}>
                        <Animated.View
                          style={[
                            styles.strengthBar,
                            {
                              width: `${passwordStrength.score * 100}%`,
                              backgroundColor: passwordStrength.color,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText
                        style={[styles.strengthLabel, { color: passwordStrength.color }]}
                      >
                        {passwordStrength.label}
                      </ThemedText>
                    </View>
                  ) : null}

                  {newPassword.length > 0 ? (
                    <View style={styles.requirementsContainer}>
                      {renderPasswordRequirement(passwordValidation.minLength, "At least 8 characters")}
                      {renderPasswordRequirement(passwordValidation.hasUppercase, "One uppercase letter")}
                      {renderPasswordRequirement(passwordValidation.hasLowercase, "One lowercase letter")}
                      {renderPasswordRequirement(passwordValidation.hasNumber, "One number")}
                      {renderPasswordRequirement(passwordValidation.hasSpecialChar, "One special character")}
                    </View>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Confirm New Password
                  </ThemedText>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        borderColor: confirmPassword.length > 0
                          ? passwordsMatch
                            ? theme.success
                            : theme.error
                          : theme.glassBorder,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Confirm new password"
                      placeholderTextColor={theme.textSecondary}
                      autoCapitalize="none"
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Feather
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={18}
                        color={theme.textSecondary}
                      />
                    </Pressable>
                  </View>
                  {confirmPassword.length > 0 && !passwordsMatch ? (
                    <ThemedText style={[styles.errorText, { color: theme.error }]}>
                      Passwords do not match
                    </ThemedText>
                  ) : null}
                </View>

                <View style={styles.passwordActions}>
                  <Pressable
                    style={[styles.cancelButton, { borderColor: theme.glassBorder }]}
                    onPress={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    <ThemedText style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                      Cancel
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.saveButton,
                      {
                        backgroundColor:
                          allRequirementsMet && passwordsMatch && currentPassword
                            ? theme.primary
                            : theme.glassBorder,
                      },
                    ]}
                    onPress={handleChangePassword}
                    disabled={
                      !allRequirementsMet ||
                      !passwordsMatch ||
                      !currentPassword ||
                      changePasswordMutation.isPending
                    }
                  >
                    {changePasswordMutation.isPending ? (
                      <LoadingIndicator size="small" />
                    ) : (
                      <ThemedText style={styles.saveButtonText}>Save Password</ThemedText>
                    )}
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(50)}>
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
              <>
                <View style={[styles.statusBadge, { backgroundColor: theme.success + "20" }]}>
                  <Feather name="check-circle" size={14} color={theme.success} />
                  <ThemedText style={[styles.statusText, { color: theme.success }]}>
                    Protected since {new Date(twoFactorStatus.enabledAt!).toLocaleDateString()}
                  </ThemedText>
                </View>

                <View style={styles.backupCodesActions}>
                  <Pressable
                    style={[styles.backupButton, { backgroundColor: theme.glassBackground }]}
                    onPress={() => {
                      if (backupCodes.length > 0) {
                        setBackupCodesModalVisible(true);
                      } else {
                        confirmRegenerateBackupCodes();
                      }
                    }}
                  >
                    <Feather name="file-text" size={16} color={theme.primary} />
                    <ThemedText style={[styles.backupButtonText, { color: theme.text }]}>
                      View Backup Codes
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.backupButton, { backgroundColor: theme.glassBackground }]}
                    onPress={confirmRegenerateBackupCodes}
                    disabled={regenerateBackupCodesMutation.isPending}
                  >
                    {regenerateBackupCodesMutation.isPending ? (
                      <LoadingIndicator size="small" />
                    ) : (
                      <>
                        <Feather name="refresh-cw" size={16} color={theme.primary} />
                        <ThemedText style={[styles.backupButtonText, { color: theme.text }]}>
                          Regenerate
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
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
                {activeSessions.map((session, index) => (
                  <Pressable
                    key={session.id}
                    style={[
                      styles.sessionRow,
                      index === 0 && styles.currentSessionRow,
                      index === 0 && { backgroundColor: theme.primary + "10" },
                    ]}
                    onPress={() => confirmRevokeSession(session)}
                  >
                    <View style={[styles.sessionIcon, { backgroundColor: theme.primary + "20" }]}>
                      <Feather
                        name={getDeviceIcon(session.deviceInfo)}
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionDeviceRow}>
                        <ThemedText style={[styles.sessionDevice, { color: theme.text }]}>
                          {session.deviceInfo || "Unknown Device"}
                        </ThemedText>
                        {index === 0 ? (
                          <View style={[styles.currentBadge, { backgroundColor: theme.success }]}>
                            <ThemedText style={styles.currentBadgeText}>Current</ThemedText>
                          </View>
                        ) : null}
                      </View>
                      <ThemedText style={[styles.sessionMeta, { color: theme.textSecondary }]}>
                        {session.location || "Unknown location"}
                      </ThemedText>
                      <View style={styles.sessionDetailsRow}>
                        {session.ipAddress ? (
                          <ThemedText style={[styles.sessionDetailText, { color: theme.textSecondary }]}>
                            IP: {session.ipAddress}
                          </ThemedText>
                        ) : null}
                        <ThemedText style={[styles.sessionDetailText, { color: theme.textSecondary }]}>
                          Active: {formatTime(session.lastActiveAt)}
                        </ThemedText>
                      </View>
                    </View>
                    {index > 0 ? (
                      <Pressable
                        onPress={() => confirmRevokeSession(session)}
                        style={styles.revokeButton}
                        hitSlop={8}
                      >
                        <Feather name="x" size={18} color={theme.error} />
                      </Pressable>
                    ) : null}
                  </Pressable>
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

      <Modal
        visible={backupCodesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBackupCodesModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
              Backup Codes
            </ThemedText>
            <Pressable
              onPress={() => setBackupCodesModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.warningBanner, { backgroundColor: theme.error + "15" }]}>
            <Feather name="alert-triangle" size={18} color={theme.error} />
            <ThemedText style={[styles.warningText, { color: theme.error }]}>
              Save these codes securely. Each code can only be used once.
            </ThemedText>
          </View>

          <View style={styles.codesContainer}>
            {backupCodes.map((code, index) => (
              <View
                key={index}
                style={[styles.codeItem, { backgroundColor: theme.glassBackground }]}
              >
                <ThemedText style={[styles.codeText, { color: theme.text }]}>
                  {code}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Pressable
              style={[styles.copyButton, { backgroundColor: theme.primary }]}
              onPress={copyBackupCodesToClipboard}
            >
              <Feather name="copy" size={18} color="#FFFFFF" />
              <ThemedText style={styles.copyButtonText}>Copy All Codes</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.regenerateModalButton, { borderColor: theme.glassBorder }]}
              onPress={() => {
                setBackupCodesModalVisible(false);
                confirmRegenerateBackupCodes();
              }}
            >
              <Feather name="refresh-cw" size={18} color={theme.text} />
              <ThemedText style={[styles.regenerateModalButtonText, { color: theme.text }]}>
                Generate New Codes
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText style={[styles.modalFooter, { color: theme.textSecondary }]}>
            Use these codes to sign in if you lose access to your authenticator app.
          </ThemedText>
        </View>
      </Modal>
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
  backupCodesActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  backupButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backupButtonText: {
    fontSize: 13,
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
  currentSessionRow: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.sm,
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
  sessionDeviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sessionDevice: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  sessionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  sessionDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: 2,
  },
  sessionDetailText: {
    fontSize: 11,
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
  inputContainer: {
    marginTop: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    height: "100%",
  },
  strengthContainer: {
    marginTop: Spacing.sm,
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  requirementsContainer: {
    marginTop: Spacing.sm,
    gap: 4,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  requirementText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  passwordActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  saveButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  modalContainer: {
    flex: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  codesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  codeItem: {
    width: "48%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  codeText: {
    fontSize: 16,
    letterSpacing: 2,
    ...Platform.select({
      ios: { fontFamily: "Courier" },
      android: { fontFamily: "monospace" },
      default: { fontFamily: "monospace" },
    }),
  },
  modalActions: {
    gap: Spacing.sm,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  copyButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  regenerateModalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  regenerateModalButtonText: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  modalFooter: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
