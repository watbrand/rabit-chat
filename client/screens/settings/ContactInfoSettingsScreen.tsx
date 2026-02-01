import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ContactInfo {
  email: string;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
}

type ModalType = "email" | "phone" | "emailVerify" | "phoneVerify" | null;

export default function ContactInfoSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");

  const { data: contactInfo, isLoading } = useQuery<ContactInfo>({
    queryKey: ["/api/me/contact-info"],
  });

  const changeEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/me/email", {
        currentPassword,
        newEmail,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.requiresVerification) {
        setPendingEmail(newEmail);
        setActiveModal("emailVerify");
        setCurrentPassword("");
        setNewEmail("");
        setVerificationCode("");
      } else {
        Alert.alert("Success", data.message || "Email updated successfully");
        closeModal();
        queryClient.invalidateQueries({ queryKey: ["/api/me/contact-info"] });
      }
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update email");
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/me/email/verify", {
        code: verificationCode,
        newEmail: pendingEmail,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Email updated and verified successfully");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["/api/me/contact-info"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Invalid verification code");
    },
  });

  const changePhoneMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/me/phone", {
        currentPassword,
        newPhone,
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.requiresVerification) {
        setPendingPhone(newPhone);
        setActiveModal("phoneVerify");
        setCurrentPassword("");
        setNewPhone("");
        setVerificationCode("");
      } else {
        Alert.alert("Success", data.message || "Phone number updated successfully");
        closeModal();
        queryClient.invalidateQueries({ queryKey: ["/api/me/contact-info"] });
      }
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update phone number");
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/me/phone/verify", {
        code: verificationCode,
        newPhone: pendingPhone,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Phone number updated and verified successfully");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["/api/me/contact-info"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Invalid verification code");
    },
  });

  const closeModal = () => {
    setActiveModal(null);
    setCurrentPassword("");
    setNewEmail("");
    setNewPhone("");
    setVerificationCode("");
    setShowPassword(false);
    setPendingEmail("");
    setPendingPhone("");
  };

  const handleChangeEmail = () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    changeEmailMutation.mutate();
  };

  const handleVerifyEmail = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code");
      return;
    }
    verifyEmailMutation.mutate();
  };

  const handleChangePhone = () => {
    if (!currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }
    if (!newPhone) {
      Alert.alert("Error", "Please enter a phone number");
      return;
    }
    changePhoneMutation.mutate();
  };

  const handleVerifyPhone = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code");
      return;
    }
    verifyPhoneMutation.mutate();
  };

  const renderContactCard = (
    icon: string,
    label: string,
    value: string | null,
    verified: boolean,
    onPress: () => void
  ) => (
    <Pressable
      style={[styles.contactCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon as any} size={20} color={theme.primary} />
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]}>
          {label}
        </ThemedText>
        <View style={styles.valueRow}>
          <ThemedText style={styles.cardValue}>
            {value || "Not set"}
          </ThemedText>
          {value ? (
            <View style={[styles.statusBadge, { backgroundColor: verified ? theme.success + "20" : theme.warning + "20" }]}>
              <Feather 
                name={verified ? "check-circle" : "alert-circle"} 
                size={12} 
                color={verified ? theme.success : theme.warning} 
              />
              <ThemedText style={[styles.statusText, { color: verified ? theme.success : theme.warning }]}>
                {verified ? "Verified" : "Unverified"}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      <Feather name="edit-2" size={18} color={theme.textSecondary} />
    </Pressable>
  );

  const renderChangeModal = (type: "email" | "phone") => {
    const isEmail = type === "email";
    return (
      <Modal
        visible={activeModal === type}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Change {isEmail ? "Email" : "Phone Number"}
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                {isEmail 
                  ? "Enter your new email address. A verification code will be sent to confirm the change."
                  : "Enter your new phone number. For South Africa, use +27 or 0XX format."}
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Current Password
                </ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
                  <Feather name="lock" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your current password"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry={!showPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Feather 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={18} 
                      color={theme.textSecondary} 
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  New {isEmail ? "Email Address" : "Phone Number"}
                </ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
                  <Feather 
                    name={isEmail ? "mail" : "phone"} 
                    size={18} 
                    color={theme.textSecondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={isEmail ? "Enter new email" : "+27 or 0XX..."}
                    placeholderTextColor={theme.textSecondary}
                    value={isEmail ? newEmail : newPhone}
                    onChangeText={isEmail ? setNewEmail : setNewPhone}
                    keyboardType={isEmail ? "email-address" : "phone-pad"}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.primary },
                  (isEmail ? changeEmailMutation.isPending : changePhoneMutation.isPending) && { opacity: 0.7 },
                ]}
                onPress={isEmail ? handleChangeEmail : handleChangePhone}
                disabled={isEmail ? changeEmailMutation.isPending : changePhoneMutation.isPending}
              >
                {(isEmail ? changeEmailMutation.isPending : changePhoneMutation.isPending) ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>
                    Send Verification Code
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderVerifyModal = (type: "emailVerify" | "phoneVerify") => {
    const isEmail = type === "emailVerify";
    const pending = isEmail ? pendingEmail : pendingPhone;
    
    return (
      <Modal
        visible={activeModal === type}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Verify {isEmail ? "Email" : "Phone"}
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <View style={[styles.pendingInfo, { backgroundColor: theme.primary + "10" }]}>
                <Feather name={isEmail ? "mail" : "phone"} size={20} color={theme.primary} />
                <ThemedText style={[styles.pendingText, { color: theme.text }]}>
                  {pending}
                </ThemedText>
              </View>

              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                Enter the 6-digit verification code sent to your new {isEmail ? "email" : "phone number"}.
              </ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Verification Code
                </ThemedText>
                <View style={[styles.inputContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
                  <Feather name="hash" size={18} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.codeInput, { color: theme.text }]}
                    placeholder="000000"
                    placeholderTextColor={theme.textSecondary}
                    value={verificationCode}
                    onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.primary },
                  (isEmail ? verifyEmailMutation.isPending : verifyPhoneMutation.isPending) && { opacity: 0.7 },
                ]}
                onPress={isEmail ? handleVerifyEmail : handleVerifyPhone}
                disabled={isEmail ? verifyEmailMutation.isPending : verifyPhoneMutation.isPending}
              >
                {(isEmail ? verifyEmailMutation.isPending : verifyPhoneMutation.isPending) ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>
                    Verify & Update
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Contact Information
        </ThemedText>
        <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          Manage your email and phone number. These are used for account recovery and notifications.
        </ThemedText>

        <View style={styles.cardsContainer}>
          {renderContactCard(
            "mail",
            "Email Address",
            contactInfo?.hasEmail ? contactInfo.email : null,
            contactInfo?.emailVerified || false,
            () => setActiveModal("email")
          )}

          <View style={{ height: Spacing.md }} />

          {renderContactCard(
            "phone",
            "Phone Number",
            contactInfo?.phone || null,
            contactInfo?.phoneVerified || false,
            () => setActiveModal("phone")
          )}
        </View>
      </View>

      <View style={[styles.infoBox, { backgroundColor: theme.primary + "10", borderColor: theme.primary + "30" }]}>
        <Feather name="info" size={18} color={theme.primary} />
        <ThemedText style={[styles.infoBoxText, { color: theme.textSecondary }]}>
          Changing your email or phone requires password confirmation and verification of the new contact method.
        </ThemedText>
      </View>

      {renderChangeModal("email")}
      {renderChangeModal("phone")}
      {renderVerifyModal("emailVerify")}
      {renderVerifyModal("phoneVerify")}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    marginLeft: Spacing.sm,
  },
  cardsContainer: {
    gap: Spacing.md,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    gap: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  codeInput: {
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  pendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  pendingText: {
    fontSize: 15,
    fontWeight: "500",
  },
  submitButton: {
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
