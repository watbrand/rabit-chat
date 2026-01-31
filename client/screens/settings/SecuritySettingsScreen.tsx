import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Session {
  id: string;
  expiresAt: string;
  isCurrent: boolean;
}

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

interface TrustedDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  lastUsedAt: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  enabledAt?: string;
}

interface TwoFactorSetupData {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl?: string;
}

interface TwoFactorVerifyResponse {
  success: boolean;
  backupCodes?: string[];
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

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<"setup" | "verify" | "backup">("setup");
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);

  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ["/api/me/sessions"],
  });

  const { data: loginSessions, isLoading: loginSessionsLoading } = useQuery<LoginSession[]>({
    queryKey: ["/api/security/sessions"],
  });

  const { data: trustedDevices, isLoading: devicesLoading } = useQuery<TrustedDevice[]>({
    queryKey: ["/api/security/devices"],
  });

  const { data: twoFactorStatus, isLoading: twoFactorLoading } = useQuery<TwoFactorStatus>({
    queryKey: ["/api/me/2fa/status"],
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
      console.error("Failed to change password:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to change password. Please try again.");
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
      queryClient.invalidateQueries({ queryKey: ["/api/security/sessions"] });
    },
    onError: (error: any) => {
      console.error("Failed to revoke sessions:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to revoke sessions. Please try again.");
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
      console.error("Failed to end session:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to end session. Please try again.");
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
      console.error("Failed to logout all devices:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to logout all devices. Please try again.");
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
      console.error("Failed to remove device:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to remove device. Please try again.");
    },
  });

  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/me/2fa/setup");
      return (await response.json()) as TwoFactorSetupData;
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSetupData(data);
      setTwoFactorStep("verify");
    },
    onError: (error: any) => {
      console.error("Failed to start 2FA setup:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to start 2FA setup. Please try again.");
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/me/2fa/verify", {
        code: verificationCode,
      });
      return (await response.json()) as TwoFactorVerifyResponse;
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
        setTwoFactorStep("backup");
      } else {
        close2FAModal();
        Alert.alert("Success", "Two-factor authentication has been enabled");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/me/2fa/status"] });
    },
    onError: (error: any) => {
      console.error("Failed to verify 2FA code:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Invalid verification code. Please check and try again.");
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/me/2fa/disable", {
        password: disablePassword,
        code: disableCode,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Two-factor authentication has been disabled");
      setShowDisable2FAModal(false);
      setDisablePassword("");
      setDisableCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/me/2fa/status"] });
    },
    onError: (error: any) => {
      console.error("Failed to disable 2FA:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to disable 2FA. Please try again.");
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
    const otherSessions = sessions?.filter((s) => !s.isCurrent).length || 0;
    if (otherSessions === 0) {
      Alert.alert("No Other Sessions", "You only have one active session");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Sign Out Other Sessions",
      `This will immediately sign out ${otherSessions} device${otherSessions > 1 ? "s" : ""} and they will need to log in again.\n\nContinue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out All",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            revokeSessionsMutation.mutate();
          },
        },
      ]
    );
  };

  const open2FASetup = () => {
    setShow2FAModal(true);
    setTwoFactorStep("setup");
    setSetupData(null);
    setVerificationCode("");
    setBackupCodes([]);
    setup2FAMutation.mutate();
  };

  const close2FAModal = () => {
    setShow2FAModal(false);
    setTwoFactorStep("setup");
    setSetupData(null);
    setVerificationCode("");
    setBackupCodes([]);
  };

  const handleVerify2FA = () => {
    if (verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter a 6-digit code");
      return;
    }
    verify2FAMutation.mutate();
  };

  const handleDisable2FA = () => {
    if (!disablePassword) {
      Alert.alert("Error", "Please enter your password");
      return;
    }
    if (disableCode.length !== 6) {
      Alert.alert("Error", "Please enter your 6-digit authenticator code");
      return;
    }
    disable2FAMutation.mutate();
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", `${label} copied to clipboard`);
  };

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

  const getDeviceIcon = (session: LoginSession) => {
    if (session.deviceType === "mobile") return "smartphone";
    if (session.deviceType === "tablet") return "tablet";
    return "monitor";
  };

  const generateQRCodeUrl = (otpauthUrl: string) => {
    const encoded = encodeURIComponent(otpauthUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}&bgcolor=0A0A0F&color=8B5CF6`;
  };

  const render2FAModal = () => (
    <Modal
      visible={show2FAModal}
      animationType="slide"
      transparent
      onRequestClose={close2FAModal}
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
              {twoFactorStep === "setup" && "Setting Up 2FA"}
              {twoFactorStep === "verify" && "Verify Your Code"}
              {twoFactorStep === "backup" && "Save Backup Codes"}
            </ThemedText>
            <Pressable onPress={close2FAModal} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            {twoFactorStep === "setup" && (
              <View style={styles.centeredContent}>
                <LoadingIndicator size="large" />
                <ThemedText
                  style={[styles.setupText, { color: theme.textSecondary }]}
                >
                  Generating your 2FA secret...
                </ThemedText>
              </View>
            )}

            {twoFactorStep === "verify" && setupData && (
              <>
                <View
                  style={[
                    styles.qrContainer,
                    { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
                  ]}
                >
                  <Image
                    source={{ uri: generateQRCodeUrl(setupData.otpauthUrl) }}
                    style={styles.qrCode}
                    resizeMode="contain"
                  />
                </View>

                <ThemedText
                  style={[styles.instructionText, { color: theme.textSecondary }]}
                >
                  Scan this QR code with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </ThemedText>

                <View
                  style={[
                    styles.secretContainer,
                    { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
                  ]}
                >
                  <ThemedText
                    style={[styles.secretLabel, { color: theme.textSecondary }]}
                  >
                    Or enter this code manually:
                  </ThemedText>
                  <Pressable
                    onPress={() => copyToClipboard(setupData.secret, "Secret key")}
                    style={styles.secretRow}
                  >
                    <ThemedText style={styles.secretText}>
                      {setupData.secret}
                    </ThemedText>
                    <Feather name="copy" size={18} color={theme.primary} />
                  </Pressable>
                </View>

                <View style={styles.verifySection}>
                  <ThemedText style={styles.inputLabel}>
                    Enter 6-digit code from your app
                  </ThemedText>
                  <View
                    style={[
                      styles.codeInputWrapper,
                      { borderColor: theme.glassBorder, backgroundColor: theme.backgroundRoot },
                    ]}
                  >
                    <TextInput
                      style={[styles.codeInput, { color: theme.text }]}
                      value={verificationCode}
                      onChangeText={(text) =>
                        setVerificationCode(text.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="000000"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                    />
                  </View>

                  <Pressable
                    style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                    onPress={handleVerify2FA}
                    disabled={verify2FAMutation.isPending}
                  >
                    {verify2FAMutation.isPending ? (
                      <LoadingIndicator size="small" />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>
                        Verify & Enable 2FA
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </>
            )}

            {twoFactorStep === "backup" && backupCodes.length > 0 && (
              <>
                <View
                  style={[
                    styles.warningBanner,
                    { backgroundColor: theme.warningLight },
                  ]}
                >
                  <Feather name="alert-triangle" size={20} color={theme.warning} />
                  <ThemedText
                    style={[styles.warningText, { color: theme.warning }]}
                  >
                    Save these backup codes in a safe place. You'll need them if
                    you lose access to your authenticator app.
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.backupCodesContainer,
                    { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
                  ]}
                >
                  {backupCodes.map((code, index) => (
                    <View key={index} style={styles.backupCodeRow}>
                      <ThemedText style={styles.backupCodeIndex}>
                        {index + 1}.
                      </ThemedText>
                      <ThemedText style={styles.backupCode}>{code}</ThemedText>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={[styles.secondaryButton, { borderColor: theme.primary }]}
                  onPress={() =>
                    copyToClipboard(backupCodes.join("\n"), "Backup codes")
                  }
                >
                  <Feather name="copy" size={18} color={theme.primary} />
                  <ThemedText style={[styles.secondaryButtonText, { color: theme.primary }]}>
                    Copy All Codes
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                  onPress={close2FAModal}
                >
                  <ThemedText style={styles.primaryButtonText}>
                    I've Saved My Codes
                  </ThemedText>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDisable2FAModal = () => (
    <Modal
      visible={showDisable2FAModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowDisable2FAModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Disable 2FA</ThemedText>
            <Pressable
              onPress={() => setShowDisable2FAModal(false)}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.modalContentContainer}
          >
            <View
              style={[
                styles.warningBanner,
                { backgroundColor: theme.errorLight },
              ]}
            >
              <Feather name="alert-circle" size={20} color={theme.error} />
              <ThemedText style={[styles.warningText, { color: theme.error }]}>
                Disabling 2FA will make your account less secure. Are you sure?
              </ThemedText>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Password</ThemedText>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: theme.glassBorder, backgroundColor: theme.backgroundRoot },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={disablePassword}
                  onChangeText={setDisablePassword}
                  secureTextEntry={!showDisablePassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowDisablePassword(!showDisablePassword)}
                >
                  <Feather
                    name={showDisablePassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                Authenticator Code
              </ThemedText>
              <View
                style={[
                  styles.codeInputWrapper,
                  { borderColor: theme.glassBorder, backgroundColor: theme.backgroundRoot },
                ]}
              >
                <TextInput
                  style={[styles.codeInput, { color: theme.text }]}
                  value={disableCode}
                  onChangeText={(text) =>
                    setDisableCode(text.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
              </View>
            </View>

            <Pressable
              style={[styles.dangerButton, { backgroundColor: theme.error }]}
              onPress={handleDisable2FA}
              disabled={disable2FAMutation.isPending}
            >
              {disable2FAMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Disable 2FA
                </ThemedText>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
        contentContainerStyle={{
          paddingTop:
            Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Two-Factor Authentication
          </ThemedText>
          <View
            style={[
              styles.twoFactorContainer,
              { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
            ]}
          >
            {twoFactorLoading ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <View style={styles.twoFactorHeader}>
                  <View style={styles.twoFactorInfo}>
                    <View
                      style={[
                        styles.twoFactorIcon,
                        {
                          backgroundColor: twoFactorStatus?.enabled
                            ? theme.successLight
                            : theme.glassLight,
                        },
                      ]}
                    >
                      <Feather
                        name="shield"
                        size={24}
                        color={twoFactorStatus?.enabled ? theme.success : theme.textSecondary}
                      />
                    </View>
                    <View style={styles.twoFactorTextContainer}>
                      <ThemedText style={styles.twoFactorTitle}>
                        {twoFactorStatus?.enabled ? "2FA Enabled" : "2FA Disabled"}
                      </ThemedText>
                      <ThemedText
                        style={[styles.twoFactorSubtitle, { color: theme.textSecondary }]}
                      >
                        {twoFactorStatus?.enabled
                          ? "Your account is protected with two-factor authentication"
                          : "Add an extra layer of security to your account"}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {twoFactorStatus?.enabled ? (
                  <Pressable
                    style={[styles.revokeButton, { borderColor: theme.error }]}
                    onPress={() => setShowDisable2FAModal(true)}
                  >
                    <Feather name="shield-off" size={18} color={theme.error} />
                    <ThemedText style={[styles.revokeButtonText, { color: theme.error }]}>
                      Disable 2FA
                    </ThemedText>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.enable2FAButton]}
                    onPress={open2FASetup}
                    disabled={setup2FAMutation.isPending}
                  >
                    <LinearGradient
                      colors={Gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientButton}
                    >
                      {setup2FAMutation.isPending ? (
                        <LoadingIndicator size="small" />
                      ) : (
                        <>
                          <Feather name="shield" size={18} color="#FFFFFF" />
                          <ThemedText style={styles.primaryButtonText}>
                            Enable 2FA
                          </ThemedText>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

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
                <Pressable
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
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
              <ThemedText style={styles.inputLabel}>
                Confirm New Password
              </ThemedText>
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
                <LoadingIndicator size="small" />
              ) : (
                <ThemedText style={styles.primaryButtonText}>
                  Change Password
                </ThemedText>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Login Sessions
          </ThemedText>
          <View
            style={[
              styles.sessionsContainer,
              { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
            ]}
          >
            {loginSessionsLoading ? (
              <LoadingIndicator size="small" />
            ) : loginSessions && loginSessions.length > 0 ? (
              <>
                <ThemedText style={styles.sessionCount}>
                  {loginSessions.length} active session
                  {loginSessions.length !== 1 ? "s" : ""}
                </ThemedText>
                {loginSessions.map((session) => (
                  <View
                    key={session.id}
                    style={[styles.sessionItem, { borderColor: theme.glassBorder }]}
                  >
                    <View
                      style={[
                        styles.sessionIconContainer,
                        {
                          backgroundColor: session.isCurrent
                            ? theme.successLight
                            : theme.glassLight,
                        },
                      ]}
                    >
                      <Feather
                        name={getDeviceIcon(session)}
                        size={20}
                        color={session.isCurrent ? theme.success : theme.textSecondary}
                      />
                    </View>
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionTitleRow}>
                        <ThemedText style={styles.sessionLabel}>
                          {session.deviceInfo ||
                            session.deviceName ||
                            session.browser ||
                            "Unknown Device"}
                        </ThemedText>
                        {session.isCurrent ? (
                          <View
                            style={[
                              styles.currentBadge,
                              { backgroundColor: theme.successLight },
                            ]}
                          >
                            <ThemedText
                              style={[styles.currentBadgeText, { color: theme.success }]}
                            >
                              Current
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                      {(session.browser || session.os) && (
                        <ThemedText
                          style={[styles.sessionDetail, { color: theme.textSecondary }]}
                        >
                          {[session.browser, session.os].filter(Boolean).join(" on ")}
                        </ThemedText>
                      )}
                      <View style={styles.sessionMetaRow}>
                        {session.ipAddress ? (
                          <View style={styles.sessionMetaItem}>
                            <Feather
                              name="globe"
                              size={12}
                              color={theme.textTertiary}
                            />
                            <ThemedText
                              style={[styles.sessionMeta, { color: theme.textTertiary }]}
                            >
                              {session.location || session.ipAddress}
                            </ThemedText>
                          </View>
                        ) : null}
                        <View style={styles.sessionMetaItem}>
                          <Feather
                            name="clock"
                            size={12}
                            color={theme.textTertiary}
                          />
                          <ThemedText
                            style={[styles.sessionMeta, { color: theme.textTertiary }]}
                          >
                            {formatRelativeTime(session.lastActiveAt)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    {!session.isCurrent && session.isActive ? (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          Alert.alert(
                            "End Session",
                            `This will immediately sign out "${session.deviceInfo || session.deviceName || session.browser || "this device"}".\n\nThe device will need to log in again to access the account.`,
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "End Session",
                                style: "destructive",
                                onPress: () => {
                                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                  invalidateSessionMutation.mutate(session.id);
                                },
                              },
                            ]
                          );
                        }}
                        style={styles.revokeSessionButton}
                      >
                        <Feather name="log-out" size={18} color={theme.error} />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
                <Pressable
                  style={[styles.revokeButton, { borderColor: theme.error }]}
                  onPress={() => {
                    const otherCount =
                      loginSessions?.filter((s) => !s.isCurrent).length || 0;
                    if (otherCount === 0) {
                      Alert.alert(
                        "No Other Sessions",
                        "You only have one active session"
                      );
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    Alert.alert(
                      "Logout All Other Devices",
                      `This will immediately sign out ${otherCount} device${otherCount > 1 ? "s" : ""}.\n\nAll other devices will need to log in again. Your current session will not be affected.\n\nContinue?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Logout All",
                          style: "destructive",
                          onPress: () => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            logoutAllMutation.mutate();
                          },
                        },
                      ]
                    );
                  }}
                  disabled={logoutAllMutation.isPending}
                >
                  {logoutAllMutation.isPending ? (
                    <LoadingIndicator size="small" />
                  ) : (
                    <>
                      <Feather name="log-out" size={16} color={theme.error} />
                      <ThemedText
                        style={[styles.revokeButtonText, { color: theme.error }]}
                      >
                        Logout All Other Devices
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No login sessions available
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
              <LoadingIndicator size="small" />
            ) : trustedDevices && trustedDevices.length > 0 ? (
              <>
                <ThemedText style={styles.sessionCount}>
                  {trustedDevices.length} trusted device
                  {trustedDevices.length !== 1 ? "s" : ""}
                </ThemedText>
                {trustedDevices.map((device) => (
                  <View
                    key={device.id}
                    style={[styles.sessionItem, { borderColor: theme.glassBorder }]}
                  >
                    <View
                      style={[
                        styles.sessionIconContainer,
                        { backgroundColor: theme.successLight },
                      ]}
                    >
                      <Feather
                        name={device.deviceType === "mobile" ? "smartphone" : "monitor"}
                        size={20}
                        color={theme.success}
                      />
                    </View>
                    <View style={styles.sessionInfo}>
                      <ThemedText style={styles.sessionLabel}>
                        {device.deviceName}
                      </ThemedText>
                      <ThemedText
                        style={[styles.sessionDetail, { color: theme.textSecondary }]}
                      >
                        {device.browser} - {device.os}
                      </ThemedText>
                      <ThemedText
                        style={[styles.sessionMeta, { color: theme.textTertiary }]}
                      >
                        Last used: {new Date(device.lastUsedAt).toLocaleDateString()}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        Alert.alert(
                          "Remove Trusted Device",
                          `Remove "${device.deviceName}" from trusted devices?\n\nYou'll need to verify again when logging in from this device.`,
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
                      }}
                      style={styles.revokeSessionButton}
                    >
                      <Feather name="trash-2" size={18} color={theme.error} />
                    </Pressable>
                  </View>
                ))}
              </>
            ) : (
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No trusted devices. When you login from a new device, you can
                mark it as trusted.
              </ThemedText>
            )}
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>

      {render2FAModal()}
      {renderDisable2FAModal()}
    </>
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
    flexDirection: "row",
    gap: Spacing.sm,
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
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  sessionDetail: {
    fontSize: 13,
    marginBottom: 4,
  },
  sessionMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: 4,
  },
  sessionMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sessionMeta: {
    fontSize: 12,
  },
  sessionExpiry: {
    fontSize: 12,
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  revokeSessionButton: {
    padding: Spacing.sm,
  },
  revokeButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
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
  twoFactorContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  twoFactorHeader: {
    marginBottom: Spacing.lg,
  },
  twoFactorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  twoFactorIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  twoFactorTextContainer: {
    flex: 1,
  },
  twoFactorTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  twoFactorSubtitle: {
    fontSize: 13,
  },
  enable2FAButton: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  gradientButton: {
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  centeredContent: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  setupText: {
    marginTop: Spacing.lg,
    fontSize: 16,
  },
  qrContainer: {
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  instructionText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  secretContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  secretLabel: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  secretRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secretText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 2,
  },
  verifySection: {
    marginTop: Spacing.md,
  },
  codeInputWrapper: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    height: 56,
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 8,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  backupCodesContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  backupCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  backupCodeIndex: {
    fontSize: 14,
    width: 24,
  },
  backupCode: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 2,
  },
  secondaryButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
});
