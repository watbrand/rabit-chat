import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  reportType: "user" | "post";
  targetId: string;
}

export function ReportModal({
  isVisible,
  onClose,
  onSubmit,
  reportType,
  targetId,
}: ReportModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const reportMutation = useMutation({
    mutationFn: async () => {
      const body =
        reportType === "user"
          ? { reason, reportedUserId: targetId }
          : { reason, reportedPostId: targetId };

      const res = await apiRequest("POST", "/api/reports", body);
      return res.json();
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      if (onSubmit) {
        onSubmit(data);
      }
      setTimeout(() => {
        setShowSuccess(false);
        handleClose();
      }, 1500);
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to submit report");
    },
  });

  const handleClose = () => {
    setReason("");
    setShowSuccess(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert("Required", "Please describe the issue");
      return;
    }
    reportMutation.mutate();
  };

  const isLoading = reportMutation.isPending;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <View style={[styles.overlay, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}>
          <View
            style={[
              styles.modal,
              {
                backgroundColor: theme.glassBackground,
                borderColor: theme.glassBorder,
                marginBottom: insets.bottom,
                marginTop: insets.top,
              },
            ]}
          >
          {showSuccess ? (
            <View style={styles.successContainer}>
              <Feather
                name="check-circle"
                size={48}
                color={theme.success}
                style={styles.successIcon}
              />
              <ThemedText style={styles.successText}>
                Report submitted
              </ThemedText>
              <ThemedText
                style={[styles.successSubtext, { color: theme.textSecondary }]}
              >
                Thank you for helping keep our community safe
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.title}>
                  Report {reportType === "user" ? "User" : "Post"}
                </ThemedText>
                <Pressable
                  onPress={handleClose}
                  hitSlop={8}
                  testID="button-close-report-modal"
                >
                  <Feather name="x" size={24} color={theme.text} />
                </Pressable>
              </View>

              <View style={styles.content}>
                <ThemedText
                  style={[
                    styles.label,
                    { color: theme.textSecondary, marginBottom: Spacing.sm },
                  ]}
                >
                  Why are you reporting this{" "}
                  {reportType === "user" ? "user" : "post"}?
                </ThemedText>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: theme.glassBorder,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Describe the issue..."
                  placeholderTextColor={theme.textSecondary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                  testID="input-report-reason"
                />

                <ThemedText
                  style={[
                    styles.charCount,
                    { color: theme.textSecondary },
                  ]}
                >
                  {reason.length}/500
                </ThemedText>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[
                    styles.cancelButton,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                  onPress={handleClose}
                  disabled={isLoading}
                  testID="button-cancel-report"
                >
                  <ThemedText
                    style={[
                      styles.cancelButtonText,
                      { color: theme.text, opacity: isLoading ? 0.5 : 1 },
                    ]}
                  >
                    Cancel
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: isLoading ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  testID="button-submit-report"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={theme.buttonText} />
                  ) : (
                    <ThemedText style={styles.submitButtonText}>
                      Submit Report
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </>
          )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
  },
  modal: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.h4.fontSize,
    fontWeight: Typography.h4.fontWeight,
  },
  content: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.small.fontSize,
  },
  input: {
    minHeight: 120,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    marginTop: Spacing.sm,
    fontSize: Typography.small.fontSize,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  successSubtext: {
    fontSize: Typography.small.fontSize,
    textAlign: "center",
  },
});
