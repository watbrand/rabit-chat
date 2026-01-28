import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

type VerificationCategory = "CELEBRITY" | "INFLUENCER" | "BUSINESS" | "ORGANIZATION" | "GOVERNMENT" | "OTHER";
type VerificationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "DENIED" | "MORE_INFO_NEEDED";

interface VerificationRequest {
  id: string;
  userId: string;
  fullName: string;
  category: VerificationCategory;
  documentUrls: string[];
  links: string[];
  reason: string;
  status: VerificationStatus;
  adminNotes: string | null;
  denialReason: string | null;
  submittedAt: string;
  updatedAt: string;
}

interface VerificationResponse {
  isVerified: boolean;
  verifiedAt: string | null;
  latestRequest: VerificationRequest | null;
}

const categoryOptions: { value: VerificationCategory; label: string }[] = [
  { value: "CELEBRITY", label: "Celebrity" },
  { value: "INFLUENCER", label: "Influencer" },
  { value: "BUSINESS", label: "Business" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "OTHER", label: "Other" },
];

const statusLabels: Record<VerificationStatus, { label: string; color: string }> = {
  SUBMITTED: { label: "Submitted", color: "#3B82F6" },
  UNDER_REVIEW: { label: "Under Review", color: "#F59E0B" },
  APPROVED: { label: "Approved", color: "#10B981" },
  DENIED: { label: "Denied", color: "#EF4444" },
  MORE_INFO_NEEDED: { label: "More Info Needed", color: "#F59E0B" },
};

export default function VerificationScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState<VerificationCategory>("INFLUENCER");
  const [reason, setReason] = useState("");
  const [links, setLinks] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = useQuery<VerificationResponse>({
    queryKey: ["/api/me/verification"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/me/verification", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch verification status");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: {
      fullName: string;
      category: VerificationCategory;
      reason: string;
      documentUrls: string[];
      links: string[];
    }) => {
      return apiRequest("POST", "/api/me/verification", data);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/me/verification"] });
      setShowForm(false);
      Alert.alert(
        "Request Submitted",
        "Your verification request has been submitted. We'll review it and get back to you soon."
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to submit verification request");
    },
  });

  const handleSubmit = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name or entity name");
      return;
    }
    if (!reason.trim() || reason.length < 50) {
      Alert.alert("Error", "Please provide a reason with at least 50 characters");
      return;
    }

    const linksArray = links
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    submitMutation.mutate({
      fullName: fullName.trim(),
      category,
      reason: reason.trim(),
      documentUrls: [],
      links: linksArray,
    });
  };

  const canSubmit = () => {
    if (data?.isVerified) return false;
    if (!data?.latestRequest) return true;
    const status = data.latestRequest.status;
    return status !== "SUBMITTED" && status !== "UNDER_REVIEW" && status !== "APPROVED";
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
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
    >
      {data?.isVerified ? (
        <View style={styles.section}>
          <View
            style={[
              styles.statusCard,
              { backgroundColor: theme.glassBackground, borderColor: "#10B981" },
            ]}
          >
            <View style={[styles.verifiedBadge, { backgroundColor: "#10B981" }]}>
              <Feather name="check" size={24} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.verifiedTitle}>Verified Account</ThemedText>
            <ThemedText style={[styles.verifiedDescription, { color: theme.textSecondary }]}>
              Your account has been verified. The verified badge appears on your profile.
            </ThemedText>
            {data.verifiedAt ? (
              <ThemedText style={[styles.verifiedDate, { color: theme.textSecondary }]}>
                Verified on {new Date(data.verifiedAt).toLocaleDateString()}
              </ThemedText>
            ) : null}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Verification Status
            </ThemedText>
            {data?.latestRequest ? (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
                ]}
              >
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusLabels[data.latestRequest.status].color },
                  ]}
                >
                  <ThemedText style={styles.statusBadgeText}>
                    {statusLabels[data.latestRequest.status].label}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.requestInfo, { color: theme.textSecondary }]}>
                  Category: {categoryOptions.find((c) => c.value === data.latestRequest?.category)?.label}
                </ThemedText>
                <ThemedText style={[styles.requestInfo, { color: theme.textSecondary }]}>
                  Submitted: {new Date(data.latestRequest.submittedAt).toLocaleDateString()}
                </ThemedText>
                {data.latestRequest.denialReason ? (
                  <View style={[styles.denialBox, { backgroundColor: theme.error + "20" }]}>
                    <ThemedText style={[styles.denialLabel, { color: theme.error }]}>
                      Denial Reason:
                    </ThemedText>
                    <ThemedText style={{ color: theme.text }}>
                      {data.latestRequest.denialReason}
                    </ThemedText>
                  </View>
                ) : null}
                {data.latestRequest.adminNotes && data.latestRequest.status === "MORE_INFO_NEEDED" ? (
                  <View style={[styles.denialBox, { backgroundColor: "#F59E0B20" }]}>
                    <ThemedText style={[styles.denialLabel, { color: "#F59E0B" }]}>
                      Additional Info Requested:
                    </ThemedText>
                    <ThemedText style={{ color: theme.text }}>
                      {data.latestRequest.adminNotes}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
                ]}
              >
                <Feather name="award" size={32} color={theme.primary} />
                <ThemedText style={styles.noRequestTitle}>Get Verified</ThemedText>
                <ThemedText style={[styles.noRequestDescription, { color: theme.textSecondary }]}>
                  A verified badge helps people know your account is authentic.
                </ThemedText>
              </View>
            )}
          </View>

          {canSubmit() ? (
            <View style={styles.section}>
              {showForm ? (
                <>
                  <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    Verification Request
                  </ThemedText>
                  <View
                    style={[
                      styles.formCard,
                      { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
                    ]}
                  >
                    <View style={styles.formField}>
                      <ThemedText style={styles.formLabel}>Full Name / Entity Name</ThemedText>
                      <TextInput
                        style={[
                          styles.textInput,
                          { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.glassBorder },
                        ]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Enter your full name or business name"
                        placeholderTextColor={theme.textSecondary}
                      />
                    </View>

                    <View style={styles.formField}>
                      <ThemedText style={styles.formLabel}>Category</ThemedText>
                      <View style={styles.categoryGrid}>
                        {categoryOptions.map((option) => (
                          <Pressable
                            key={option.value}
                            style={[
                              styles.categoryOption,
                              {
                                backgroundColor:
                                  category === option.value ? theme.primary : theme.backgroundRoot,
                                borderColor: theme.glassBorder,
                              },
                            ]}
                            onPress={() => setCategory(option.value)}
                          >
                            <ThemedText
                              style={{
                                color: category === option.value ? "#FFFFFF" : theme.text,
                                fontSize: 13,
                              }}
                            >
                              {option.label}
                            </ThemedText>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.formField}>
                      <ThemedText style={styles.formLabel}>
                        Why should you be verified? (min. 50 characters)
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.textArea,
                          { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.glassBorder },
                        ]}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Explain why you deserve verification..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                      <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
                        {reason.length} / 2000 characters
                      </ThemedText>
                    </View>

                    <View style={styles.formField}>
                      <ThemedText style={styles.formLabel}>
                        Supporting Links (one per line, optional)
                      </ThemedText>
                      <TextInput
                        style={[
                          styles.textArea,
                          { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.glassBorder },
                        ]}
                        value={links}
                        onChangeText={setLinks}
                        placeholder="https://yourwebsite.com&#10;https://linkedin.com/in/you"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>

                    <Pressable
                      style={[styles.submitButton, { backgroundColor: theme.primary }]}
                      onPress={handleSubmit}
                      disabled={submitMutation.isPending}
                    >
                      {submitMutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <ThemedText style={styles.submitButtonText}>Submit Request</ThemedText>
                      )}
                    </Pressable>

                    <Pressable style={styles.cancelButton} onPress={() => setShowForm(false)}>
                      <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable
                  style={[styles.requestButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowForm(true)}
                >
                  <Feather name="award" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.requestButtonText}>Request Verification</ThemedText>
                </Pressable>
              )}
            </View>
          ) : null}
        </>
      )}

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          About Verification
        </ThemedText>
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.infoRow}>
            <Feather name="check-circle" size={18} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              Verified accounts get a badge on their profile
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Feather name="shield" size={18} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              Verification confirms your identity or brand
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <Feather name="clock" size={18} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              Review typically takes 3-7 business days
            </ThemedText>
          </View>
        </View>
      </View>
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
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  verifiedBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  verifiedTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  verifiedDescription: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  verifiedDate: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  requestInfo: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  denialBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
    width: "100%",
  },
  denialLabel: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  noRequestTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  noRequestDescription: {
    textAlign: "center",
  },
  formCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  formField: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: "right",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  requestButton: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  requestButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
  },
});
