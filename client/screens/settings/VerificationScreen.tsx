import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { uploadFileWithProgress } from "@/lib/upload";

type VerificationCategory = "CELEBRITY" | "INFLUENCER" | "BUSINESS" | "ORGANIZATION" | "GOVERNMENT" | "OTHER";
type VerificationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "DENIED" | "MORE_INFO_NEEDED";
type DocumentType = "id_card" | "passport" | "drivers_license";

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

interface DocumentPreview {
  uri: string;
  mimeType?: string;
}

const categoryOptions: { value: VerificationCategory; label: string }[] = [
  { value: "CELEBRITY", label: "Celebrity" },
  { value: "INFLUENCER", label: "Influencer" },
  { value: "BUSINESS", label: "Business" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "OTHER", label: "Other" },
];

const documentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: "id_card", label: "ID Card" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
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
  const [documentType, setDocumentType] = useState<DocumentType>("id_card");
  const [reason, setReason] = useState("");
  const [links, setLinks] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<DocumentPreview | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery<VerificationResponse>({
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
    mutationFn: async (submitData: {
      fullName: string;
      category: VerificationCategory;
      reason: string;
      documentUrls: string[];
      links: string[];
    }) => {
      return apiRequest("POST", "/api/me/verification", submitData);
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/me/verification"] });
      setShowForm(false);
      resetForm();
      Alert.alert(
        "Request Submitted",
        "Your verification request has been submitted. We'll review it and get back to you soon."
      );
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to submit verification request");
    },
  });

  const resetForm = () => {
    setFullName("");
    setCategory("INFLUENCER");
    setDocumentType("id_card");
    setReason("");
    setLinks("");
    setDocumentPreview(null);
    setUploadProgress(0);
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Gallery"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        "Upload Document",
        "Choose how to add your document",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: takePhoto },
          { text: "Choose from Gallery", onPress: pickFromGallery },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera access to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setDocumentPreview({
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType,
      });

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to take photo");
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant access to your photo library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setDocumentPreview({
        uri: result.assets[0].uri,
        mimeType: result.assets[0].mimeType,
      });

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick image");
    }
  };

  const removeDocument = () => {
    setDocumentPreview(null);
    setUploadProgress(0);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name or entity name");
      return;
    }
    if (!reason.trim() || reason.length < 50) {
      Alert.alert("Error", "Please provide a reason with at least 50 characters");
      return;
    }
    if (!documentPreview) {
      Alert.alert("Error", "Please upload an identity document");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const uploadResult = await uploadFileWithProgress(
        documentPreview.uri,
        "general",
        documentPreview.mimeType,
        undefined,
        (progress) => setUploadProgress(progress)
      );

      const linksArray = links
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      await submitMutation.mutateAsync({
        fullName: fullName.trim(),
        category,
        reason: `[Document Type: ${documentTypeOptions.find(d => d.value === documentType)?.label}]\n\n${reason.trim()}`,
        documentUrls: [uploadResult.url],
        links: linksArray,
      });
    } catch (error: any) {
      Alert.alert("Upload Error", error.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const canSubmit = () => {
    if (data?.isVerified) return false;
    if (!data?.latestRequest) return true;
    const status = data.latestRequest.status;
    return status !== "SUBMITTED" && status !== "UNDER_REVIEW" && status !== "APPROVED";
  };

  if (isLoading) {
    return <LoadingIndicator fullScreen />;
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
                        testID="input-fullname"
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
                            testID={`button-category-${option.value}`}
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
                      <ThemedText style={styles.formLabel}>Identity Document Type</ThemedText>
                      <View style={styles.categoryGrid}>
                        {documentTypeOptions.map((option) => (
                          <Pressable
                            key={option.value}
                            style={[
                              styles.documentTypeOption,
                              {
                                backgroundColor:
                                  documentType === option.value ? theme.primary : theme.backgroundRoot,
                                borderColor: theme.glassBorder,
                              },
                            ]}
                            onPress={() => setDocumentType(option.value)}
                            testID={`button-doctype-${option.value}`}
                          >
                            <Feather
                              name={option.value === "passport" ? "globe" : option.value === "drivers_license" ? "truck" : "credit-card"}
                              size={16}
                              color={documentType === option.value ? "#FFFFFF" : theme.text}
                              style={{ marginRight: Spacing.xs }}
                            />
                            <ThemedText
                              style={{
                                color: documentType === option.value ? "#FFFFFF" : theme.text,
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
                      <ThemedText style={styles.formLabel}>Upload Document</ThemedText>
                      {documentPreview ? (
                        <View style={styles.documentPreviewContainer}>
                          <Image
                            source={{ uri: documentPreview.uri }}
                            style={styles.documentPreviewImage}
                            contentFit="cover"
                          />
                          <View style={styles.documentPreviewOverlay}>
                            <View style={[styles.documentTypeBadge, { backgroundColor: theme.primary }]}>
                              <ThemedText style={styles.documentTypeBadgeText}>
                                {documentTypeOptions.find(d => d.value === documentType)?.label}
                              </ThemedText>
                            </View>
                            <Pressable
                              style={[styles.removeDocumentButton, { backgroundColor: theme.error }]}
                              onPress={removeDocument}
                              testID="button-remove-document"
                            >
                              <Feather name="x" size={18} color="#FFFFFF" />
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Pressable
                          style={[
                            styles.uploadButton,
                            { backgroundColor: theme.backgroundRoot, borderColor: theme.glassBorder },
                          ]}
                          onPress={showImagePickerOptions}
                          testID="button-upload-document"
                        >
                          <Feather name="upload" size={24} color={theme.primary} />
                          <ThemedText style={[styles.uploadButtonText, { color: theme.textSecondary }]}>
                            Take photo or choose from gallery
                          </ThemedText>
                          <ThemedText style={[styles.uploadHint, { color: theme.textSecondary }]}>
                            Accepted: ID Card, Passport, Driver's License
                          </ThemedText>
                        </Pressable>
                      )}
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
                        testID="input-reason"
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
                        testID="input-links"
                      />
                    </View>

                    {isUploading ? (
                      <View style={styles.uploadingContainer}>
                        <LoadingIndicator size="small" />
                        <ThemedText style={[styles.uploadingText, { color: theme.textSecondary }]}>
                          Uploading document... {uploadProgress}%
                        </ThemedText>
                        <View style={[styles.progressBar, { backgroundColor: theme.glassBorder }]}>
                          <View
                            style={[
                              styles.progressFill,
                              { backgroundColor: theme.primary, width: `${uploadProgress}%` },
                            ]}
                          />
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        style={[
                          styles.submitButton,
                          { backgroundColor: theme.primary },
                          submitMutation.isPending && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={submitMutation.isPending}
                        testID="button-submit-verification"
                      >
                        {submitMutation.isPending ? (
                          <LoadingIndicator size="small" />
                        ) : (
                          <ThemedText style={styles.submitButtonText}>Submit Request</ThemedText>
                        )}
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      testID="button-cancel"
                    >
                      <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable
                  style={[styles.requestButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowForm(true)}
                  testID="button-request-verification"
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
            <Feather name="upload-cloud" size={18} color={theme.primary} />
            <ThemedText style={[styles.infoText, { color: theme.text }]}>
              Upload a valid government-issued ID document
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
  documentTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  uploadButton: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  uploadHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  documentPreviewContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  documentPreviewImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  documentPreviewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.sm,
  },
  documentTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  documentTypeBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  removeDocumentButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingContainer: {
    alignItems: "center",
    padding: Spacing.lg,
  },
  uploadingText: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.7,
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
