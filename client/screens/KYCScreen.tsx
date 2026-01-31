import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { GlassButton } from "@/components/GlassButton";
import { GlassInput } from "@/components/GlassInput";
import { Card } from "@/components/Card";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { uploadFileWithProgress } from "@/lib/upload";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

interface KYCData {
  id: string;
  userId: string;
  status: "NOT_STARTED" | "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
  idType?: string;
  idNumber?: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  proofOfAddressUrl?: string;
  fullLegalName?: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

const ID_TYPES = ["South African ID", "Passport"];

export default function KYCScreen({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [popiaConsent, setPopiaConsent] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    idType: "",
    idNumber: "",
    fullLegalName: "",
    idDocumentUrl: "",
    proofOfAddressUrl: "",
    selfieUrl: "",
  });

  const { data: kyc, isLoading, refetch } = useQuery<KYCData>({
    queryKey: ["/api/kyc"],
  });

  const submitKycMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/kyc/submit", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kyc"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Your KYC documents have been submitted for review.");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to submit KYC documents");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const pickAndUploadImage = async (type: "idDocument" | "proofOfAddress" | "selfie") => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant access to your photo library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "selfie" ? [1, 1] : [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset) return;

      setUploading(type);
      const uploadResult = await uploadFileWithProgress(
        asset.uri,
        "general",
        asset.mimeType
      );

      const urlKey = type === "idDocument" ? "idDocumentUrl" : type === "proofOfAddress" ? "proofOfAddressUrl" : "selfieUrl";
      setFormData((prev) => ({ ...prev, [urlKey]: uploadResult.url }));

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error: any) {
      Alert.alert("Upload Error", error.message || "Failed to upload image");
    } finally {
      setUploading(null);
    }
  };

  const takeSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera access for selfie verification.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset) return;

      setUploading("selfie");
      const uploadResult = await uploadFileWithProgress(
        asset.uri,
        "general",
        asset.mimeType
      );

      setFormData((prev) => ({ ...prev, selfieUrl: uploadResult.url }));

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error: any) {
      Alert.alert("Upload Error", error.message || "Failed to upload selfie");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = () => {
    if (!formData.idType) {
      Alert.alert("Error", "Please select an ID type");
      return;
    }
    if (!formData.idNumber) {
      Alert.alert("Error", "Please enter your ID number");
      return;
    }
    if (!formData.fullLegalName) {
      Alert.alert("Error", "Please enter your full legal name");
      return;
    }
    if (!formData.idDocumentUrl) {
      Alert.alert("Error", "Please upload your ID document");
      return;
    }
    if (!formData.proofOfAddressUrl) {
      Alert.alert("Error", "Please upload proof of address");
      return;
    }
    if (!formData.selfieUrl) {
      Alert.alert("Error", "Please take a selfie for verification");
      return;
    }
    if (!popiaConsent) {
      Alert.alert("Error", "Please accept the POPIA consent");
      return;
    }
    submitKycMutation.mutate(formData);
  };

  const getStatusConfig = (status: KYCData["status"]) => {
    switch (status) {
      case "APPROVED":
        return { color: theme.success, icon: "check-circle", label: "Verified", bgColor: theme.success + "20" };
      case "PENDING":
      case "UNDER_REVIEW":
        return { color: theme.warning, icon: "clock", label: status === "PENDING" ? "Pending" : "Under Review", bgColor: theme.warning + "20" };
      case "REJECTED":
        return { color: theme.error, icon: "x-circle", label: "Rejected", bgColor: theme.error + "20" };
      case "EXPIRED":
        return { color: theme.error, icon: "alert-circle", label: "Expired", bgColor: theme.error + "20" };
      default:
        return { color: theme.textSecondary, icon: "user", label: "Not Started", bgColor: theme.textSecondary + "20" };
    }
  };

  const getProgressPercentage = () => {
    let completed = 0;
    if (formData.idType) completed++;
    if (formData.idNumber) completed++;
    if (formData.fullLegalName) completed++;
    if (formData.idDocumentUrl) completed++;
    if (formData.proofOfAddressUrl) completed++;
    if (formData.selfieUrl) completed++;
    if (popiaConsent) completed++;
    return Math.round((completed / 7) * 100);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  const statusConfig = getStatusConfig(kyc?.status || "NOT_STARTED");
  const isEditable = !kyc || kyc.status === "NOT_STARTED" || kyc.status === "REJECTED" || kyc.status === "EXPIRED";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.lg },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <ThemedText type="title2" style={styles.title}>KYC Verification</ThemedText>
          <ThemedText type="subhead" style={{ color: theme.textSecondary }}>
            Verify your identity to enable withdrawals
          </ThemedText>
        </View>

        <Card variant="glass" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Feather name={statusConfig.icon as any} size={20} color={statusConfig.color} />
            </View>
            <View style={styles.statusInfo}>
              <ThemedText type="headline">{statusConfig.label}</ThemedText>
              {kyc?.submittedAt ? (
                <ThemedText type="footnote" style={{ color: theme.textSecondary }}>
                  Submitted {new Date(kyc.submittedAt).toLocaleDateString()}
                </ThemedText>
              ) : null}
            </View>
          </View>

          {kyc?.status === "REJECTED" && kyc.rejectionReason ? (
            <View style={[styles.rejectionBox, { backgroundColor: theme.error + "15" }]}>
              <Feather name="alert-circle" size={16} color={theme.error} />
              <View style={styles.rejectionContent}>
                <ThemedText type="footnote" weight="semiBold" style={{ color: theme.error }}>
                  Rejection Reason
                </ThemedText>
                <ThemedText type="subhead" style={{ color: theme.error, marginTop: 2 }}>
                  {kyc.rejectionReason}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </Card>

        {isEditable ? (
          <>
            <Card variant="glass" style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <ThemedText type="headline">Progress</ThemedText>
                <ThemedText type="headline" style={{ color: theme.primary }}>{getProgressPercentage()}%</ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: theme.backgroundTertiary }]}>
                <LinearGradient
                  colors={Gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]}
                />
              </View>
              <View style={styles.progressItems}>
                <ProgressItem label="ID Type" completed={!!formData.idType} theme={theme} />
                <ProgressItem label="ID Number" completed={!!formData.idNumber} theme={theme} />
                <ProgressItem label="Full Name" completed={!!formData.fullLegalName} theme={theme} />
                <ProgressItem label="ID Document" completed={!!formData.idDocumentUrl} theme={theme} />
                <ProgressItem label="Proof of Address" completed={!!formData.proofOfAddressUrl} theme={theme} />
                <ProgressItem label="Selfie" completed={!!formData.selfieUrl} theme={theme} />
                <ProgressItem label="POPIA Consent" completed={popiaConsent} theme={theme} />
              </View>
            </Card>

            <Card variant="glass" style={styles.formCard}>
              <ThemedText type="headline" style={styles.sectionTitle}>Identity Information</ThemedText>

              <Pressable
                style={[styles.pickerButton, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderColor: theme.border }]}
                onPress={() => setShowTypePicker(true)}
              >
                <ThemedText style={{ color: formData.idType ? theme.text : theme.textTertiary }}>
                  {formData.idType || "Select ID Type"}
                </ThemedText>
                <Feather name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              <GlassInput
                label="ID Number"
                placeholder={formData.idType === "South African ID" ? "Enter 13-digit SA ID" : "Enter passport number"}
                value={formData.idNumber}
                onChangeText={(text) => setFormData({ ...formData, idNumber: text })}
                keyboardType={formData.idType === "South African ID" ? "numeric" : "default"}
                maxLength={formData.idType === "South African ID" ? 13 : 20}
              />

              <GlassInput
                label="Full Legal Name"
                placeholder="Enter your full legal name"
                value={formData.fullLegalName}
                onChangeText={(text) => setFormData({ ...formData, fullLegalName: text })}
                autoCapitalize="words"
              />
            </Card>

            <Card variant="glass" style={styles.formCard}>
              <ThemedText type="headline" style={styles.sectionTitle}>Documents</ThemedText>

              <DocumentUpload
                label="ID Document"
                description="Upload a clear photo of your ID or passport"
                imageUrl={formData.idDocumentUrl}
                isUploading={uploading === "idDocument"}
                onUpload={() => pickAndUploadImage("idDocument")}
                theme={theme}
              />

              <DocumentUpload
                label="Proof of Address"
                description="Utility bill, bank statement, or lease agreement (not older than 3 months)"
                imageUrl={formData.proofOfAddressUrl}
                isUploading={uploading === "proofOfAddress"}
                onUpload={() => pickAndUploadImage("proofOfAddress")}
                theme={theme}
              />

              <View style={styles.selfieSection}>
                <ThemedText type="subhead" weight="semiBold" style={styles.documentLabel}>
                  Selfie Verification
                </ThemedText>
                <ThemedText type="footnote" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
                  Take a clear selfie with your face visible for identity verification
                </ThemedText>

                {formData.selfieUrl ? (
                  <View style={styles.uploadedContainer}>
                    <Image source={{ uri: formData.selfieUrl }} style={styles.selfiePreview} contentFit="cover" />
                    <Pressable style={[styles.changeButton, { backgroundColor: theme.primary + "20" }]} onPress={takeSelfie}>
                      <Feather name="refresh-cw" size={16} color={theme.primary} />
                      <Text style={[styles.changeButtonText, { color: theme.primary }]}>Retake</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.selfieActions}>
                    <GlassButton
                      title={uploading === "selfie" ? "Uploading..." : "Take Selfie"}
                      icon="camera"
                      variant="secondary"
                      onPress={takeSelfie}
                      loading={uploading === "selfie"}
                      style={{ flex: 1, marginRight: Spacing.sm }}
                    />
                    <GlassButton
                      title="Upload"
                      icon="upload"
                      variant="outline"
                      onPress={() => pickAndUploadImage("selfie")}
                      loading={uploading === "selfie"}
                      style={{ flex: 1, marginLeft: Spacing.sm }}
                    />
                  </View>
                )}
              </View>
            </Card>

            <Card variant="glass" style={styles.consentCard}>
              <Pressable style={styles.consentRow} onPress={() => setPopiaConsent(!popiaConsent)}>
                <View style={[styles.checkbox, popiaConsent && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                  {popiaConsent ? <Feather name="check" size={14} color="#fff" /> : null}
                </View>
                <ThemedText type="subhead" style={{ flex: 1, marginLeft: Spacing.md }}>
                  I consent to the processing of my personal information in accordance with the Protection of Personal 
                  Information Act (POPIA). I understand that my data will be used solely for identity verification purposes.
                </ThemedText>
              </Pressable>
            </Card>

            <GlassButton
              title={submitKycMutation.isPending ? "Submitting..." : "Submit for Verification"}
              variant="gradient"
              onPress={handleSubmit}
              loading={submitKycMutation.isPending}
              disabled={submitKycMutation.isPending || getProgressPercentage() < 100}
              fullWidth
              glowEffect
              style={styles.submitButton}
            />
          </>
        ) : (
          <Card variant="glass" style={styles.statusDetailCard}>
            <Feather name="shield" size={48} color={theme.primary} style={{ alignSelf: "center" }} />
            <ThemedText type="headline" style={{ textAlign: "center", marginTop: Spacing.lg }}>
              {kyc?.status === "APPROVED" ? "Verification Complete" : "Verification In Progress"}
            </ThemedText>
            <ThemedText type="subhead" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              {kyc?.status === "APPROVED"
                ? "Your identity has been verified. You can now withdraw your earnings."
                : "We are reviewing your documents. This usually takes 1-2 business days."}
            </ThemedText>
          </Card>
        )}
      </ScrollView>

      <Modal visible={showTypePicker} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <View style={[styles.pickerModal, { backgroundColor: theme.backgroundElevated }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title3">Select ID Type</ThemedText>
              <Pressable onPress={() => setShowTypePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <View style={styles.pickerList}>
              {ID_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.pickerItem, formData.idType === type && { backgroundColor: theme.primary + "20" }]}
                  onPress={() => {
                    setFormData({ ...formData, idType: type, idNumber: "" });
                    setShowTypePicker(false);
                  }}
                >
                  <ThemedText>{type}</ThemedText>
                  {formData.idType === type ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProgressItem({ label, completed, theme }: { label: string; completed: boolean; theme: any }) {
  return (
    <View style={styles.progressItem}>
      <Feather
        name={completed ? "check-circle" : "circle"}
        size={16}
        color={completed ? theme.success : theme.textTertiary}
      />
      <ThemedText type="footnote" style={{ marginLeft: Spacing.sm, color: completed ? theme.text : theme.textTertiary }}>
        {label}
      </ThemedText>
    </View>
  );
}

function DocumentUpload({
  label,
  description,
  imageUrl,
  isUploading,
  onUpload,
  theme,
}: {
  label: string;
  description: string;
  imageUrl: string;
  isUploading: boolean;
  onUpload: () => void;
  theme: any;
}) {
  return (
    <View style={styles.documentSection}>
      <ThemedText type="subhead" weight="semiBold" style={styles.documentLabel}>
        {label}
      </ThemedText>
      <ThemedText type="footnote" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
        {description}
      </ThemedText>

      {imageUrl ? (
        <View style={styles.uploadedContainer}>
          <Image source={{ uri: imageUrl }} style={styles.documentPreview} contentFit="cover" />
          <Pressable style={[styles.changeButton, { backgroundColor: theme.primary + "20" }]} onPress={onUpload}>
            <Feather name="refresh-cw" size={16} color={theme.primary} />
            <Text style={[styles.changeButtonText, { color: theme.primary }]}>Change</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.uploadBox, { borderColor: theme.border, backgroundColor: theme.backgroundSecondary }]}
          onPress={onUpload}
          disabled={isUploading}
        >
          {isUploading ? (
            <LoadingIndicator size="small" />
          ) : (
            <>
              <Feather name="upload" size={24} color={theme.textSecondary} />
              <ThemedText type="subhead" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                Tap to upload
              </ThemedText>
            </>
          )}
        </Pressable>
      )}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  statusCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: {
    marginLeft: Spacing.lg,
  },
  rejectionBox: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rejectionContent: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  progressCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressItems: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  pickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  documentSection: {
    marginBottom: Spacing.xl,
  },
  documentLabel: {
    marginBottom: Spacing.xs,
  },
  uploadBox: {
    height: 120,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadedContainer: {
    position: "relative",
  },
  documentPreview: {
    height: 150,
    borderRadius: BorderRadius.lg,
    width: "100%",
  },
  selfiePreview: {
    height: 200,
    width: 200,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
  },
  changeButton: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  selfieSection: {
    marginBottom: Spacing.lg,
  },
  selfieActions: {
    flexDirection: "row",
  },
  consentCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    marginBottom: Spacing.xl,
  },
  statusDetailCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  pickerList: {
    gap: Spacing.sm,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
});
