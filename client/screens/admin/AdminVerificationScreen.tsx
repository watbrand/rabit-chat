import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

type VerificationStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "DENIED" | "MORE_INFO_NEEDED";
type VerificationCategory = "CELEBRITY" | "INFLUENCER" | "BUSINESS" | "ORGANIZATION" | "GOVERNMENT" | "OTHER";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  isVerified: boolean;
}

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
  reviewedById: string | null;
  submittedAt: string;
  updatedAt: string;
  user: User;
  reviewedBy?: User;
}

type FilterStatus = VerificationStatus | "ALL";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DOC_THUMBNAIL_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.lg * 2 - Spacing.sm * 2) / 3;

const statusColors: Record<VerificationStatus, string> = {
  SUBMITTED: "#3B82F6",
  UNDER_REVIEW: "#F59E0B",
  APPROVED: "#10B981",
  DENIED: "#EF4444",
  MORE_INFO_NEEDED: "#8B5CF6",
};

const statusLabels: Record<VerificationStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  DENIED: "Denied",
  MORE_INFO_NEEDED: "More Info",
};

const categoryLabels: Record<VerificationCategory, string> = {
  CELEBRITY: "Celebrity",
  INFLUENCER: "Influencer",
  BUSINESS: "Business",
  ORGANIZATION: "Organization",
  GOVERNMENT: "Government",
  OTHER: "Other",
};

export default function AdminVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<FilterStatus>("SUBMITTED");
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "deny" | "request_info" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState<string | null>(null);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") {
      params.append("status", statusFilter);
    }
    return params.toString();
  };

  const queryString = buildQueryParams();
  const queryKey = ["/api/admin/verification", queryString];

  const {
    data: requests,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<VerificationRequest[]>({
    queryKey,
    queryFn: async () => {
      try {
        const url = queryString
          ? `/api/admin/verification?${queryString}`
          : "/api/admin/verification";
        const response = await fetch(new URL(url, getApiUrl()).href, {
          credentials: "include",
        });

        if (response.status === 403) {
          setError("You do not have permission to view verification requests.");
          return [];
        }

        if (!response.ok) {
          throw new Error("Failed to fetch verification requests");
        }

        return await response.json();
      } catch (err: any) {
        setError(err.message || "Failed to fetch verification requests");
        return [];
      }
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
      reason,
      notes,
    }: {
      requestId: string;
      action: "approve" | "deny" | "request_info";
      reason?: string;
      notes?: string;
    }) => {
      await apiRequest("POST", `/api/admin/verification/${requestId}/action`, {
        action,
        reason,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verification"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setActionModalVisible(false);
      setDetailModalVisible(false);
      setSelectedRequest(null);
      setActionType(null);
      setActionReason("");
      setActionNotes("");
      Alert.alert("Success", "Verification request processed successfully");
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to process verification request");
    },
  });

  const formatDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFullDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const openDetailModal = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setActionNotes(request.adminNotes || "");
    setDetailModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openActionModal = (type: "approve" | "deny" | "request_info") => {
    setActionType(type);
    setActionReason("");
    setActionModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === "deny" && !actionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for denial");
      return;
    }

    if (actionType === "request_info" && !actionReason.trim()) {
      Alert.alert("Error", "Please specify what additional information is needed");
      return;
    }

    actionMutation.mutate({
      requestId: selectedRequest.id,
      action: actionType,
      reason: actionReason.trim() || undefined,
      notes: actionNotes.trim() || undefined,
    });
  };

  const getDocumentTypeLabel = (url: string, index: number): string => {
    const extension = url.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
      return `Document ${index + 1}`;
    }
    if (["pdf"].includes(extension)) {
      return `PDF Document ${index + 1}`;
    }
    return `File ${index + 1}`;
  };

  const renderFilterChip = (status: FilterStatus, label: string) => (
    <Pressable
      key={status}
      style={[
        styles.filterChip,
        {
          backgroundColor: statusFilter === status ? theme.primary : theme.glassBackground,
          borderColor: theme.glassBorder,
        },
      ]}
      onPress={() => {
        setStatusFilter(status);
        Haptics.selectionAsync();
      }}
    >
      <ThemedText
        style={[
          styles.filterChipText,
          { color: statusFilter === status ? "#FFFFFF" : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderDocumentThumbnail = (url: string, index: number) => (
    <Pressable
      key={`${url}-${index}`}
      style={[
        styles.documentThumbnail,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
      onPress={() => {
        setViewingDocumentUrl(url);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <Image
        source={{ uri: url }}
        style={styles.documentImage}
        contentFit="cover"
      />
      <View style={[styles.documentLabel, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
        <ThemedText style={styles.documentLabelText} numberOfLines={1}>
          {getDocumentTypeLabel(url, index)}
        </ThemedText>
      </View>
      <View style={[styles.zoomIcon, { backgroundColor: theme.primary }]}>
        <Feather name="maximize-2" size={12} color="#FFFFFF" />
      </View>
    </Pressable>
  );

  const renderRequest = ({ item }: { item: VerificationRequest }) => (
    <Pressable onPress={() => openDetailModal(item)}>
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.userRow}>
            <Avatar
              uri={item.user?.avatarUrl}
              size={48}
            />
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <ThemedText style={styles.displayName}>{item.user?.displayName || "Unknown"}</ThemedText>
                {item.user?.isVerified ? (
                  <View style={[styles.verifiedBadge, { backgroundColor: "#10B981" }]}>
                    <Feather name="check" size={10} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
                @{item.user?.username || "unknown"}
              </ThemedText>
              <ThemedText style={[styles.joinDate, { color: theme.textTertiary }]}>
                Joined {formatDate(item.user?.createdAt || item.submittedAt)}
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[item.status] },
            ]}
          >
            <ThemedText style={styles.statusText}>{statusLabels[item.status]}</ThemedText>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Category:
            </ThemedText>
            <ThemedText style={styles.detailValue}>{categoryLabels[item.category]}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Submitted:
            </ThemedText>
            <ThemedText style={styles.detailValue}>{formatDate(item.submittedAt)}</ThemedText>
          </View>
          {item.documentUrls?.length > 0 ? (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Documents:
              </ThemedText>
              <ThemedText style={styles.detailValue}>{item.documentUrls.length} file(s)</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.tapHint}>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Card>
    </Pressable>
  );

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={[
            { status: "ALL" as FilterStatus, label: "All" },
            { status: "SUBMITTED" as FilterStatus, label: "Submitted" },
            { status: "UNDER_REVIEW" as FilterStatus, label: "Reviewing" },
            { status: "APPROVED" as FilterStatus, label: "Approved" },
            { status: "DENIED" as FilterStatus, label: "Denied" },
            { status: "MORE_INFO_NEEDED" as FilterStatus, label: "More Info" },
          ]}
          renderItem={({ item }) => renderFilterChip(item.status, item.label)}
          keyExtractor={(item) => item.status}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingTop: Spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="award" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No verification requests found
            </ThemedText>
          </View>
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={[styles.detailModalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.detailHeader, { paddingTop: insets.top + Spacing.md }]}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setDetailModalVisible(false)}
              hitSlop={12}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.detailTitle}>Verification Review</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          {selectedRequest ? (
            <ScrollView
              style={styles.detailScrollView}
              contentContainerStyle={[
                styles.detailContent,
                { paddingBottom: insets.bottom + Spacing.xl },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <Card style={styles.userCard}>
                <View style={styles.userCardHeader}>
                  <Avatar
                    uri={selectedRequest.user?.avatarUrl}
                    size={72}
                  />
                  <View style={styles.userCardInfo}>
                    <View style={styles.nameRow}>
                      <ThemedText style={styles.userCardName}>
                        {selectedRequest.user?.displayName || "Unknown"}
                      </ThemedText>
                      {selectedRequest.user?.isVerified ? (
                        <View style={[styles.verifiedBadgeLarge, { backgroundColor: "#10B981" }]}>
                          <Feather name="check" size={12} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </View>
                    <ThemedText style={[styles.userCardHandle, { color: theme.textSecondary }]}>
                      @{selectedRequest.user?.username || "unknown"}
                    </ThemedText>
                    <View style={styles.userMetaRow}>
                      <Feather name="calendar" size={12} color={theme.textTertiary} />
                      <ThemedText style={[styles.userMetaText, { color: theme.textTertiary }]}>
                        Joined {formatFullDate(selectedRequest.user?.createdAt || selectedRequest.submittedAt)}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={[styles.statusSection, { borderTopColor: theme.glassBorder }]}>
                  <View style={styles.statusRow}>
                    <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                      Request Status
                    </ThemedText>
                    <View
                      style={[
                        styles.statusBadgeLarge,
                        { backgroundColor: statusColors[selectedRequest.status] },
                      ]}
                    >
                      <ThemedText style={styles.statusTextLarge}>
                        {statusLabels[selectedRequest.status]}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </Card>

              <Card style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>Request Details</ThemedText>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.detailItemLabel, { color: theme.textSecondary }]}>
                      Full Name
                    </ThemedText>
                    <ThemedText style={styles.detailItemValue}>
                      {selectedRequest.fullName}
                    </ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.detailItemLabel, { color: theme.textSecondary }]}>
                      Category
                    </ThemedText>
                    <ThemedText style={styles.detailItemValue}>
                      {categoryLabels[selectedRequest.category]}
                    </ThemedText>
                  </View>
                  <View style={styles.detailItem}>
                    <ThemedText style={[styles.detailItemLabel, { color: theme.textSecondary }]}>
                      Submitted
                    </ThemedText>
                    <ThemedText style={styles.detailItemValue}>
                      {formatFullDate(selectedRequest.submittedAt)}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.reasonBox}>
                  <ThemedText style={[styles.detailItemLabel, { color: theme.textSecondary }]}>
                    Reason for Verification
                  </ThemedText>
                  <ThemedText style={styles.reasonText}>
                    {selectedRequest.reason}
                  </ThemedText>
                </View>

                {selectedRequest.links?.length > 0 ? (
                  <View style={styles.linksBox}>
                    <ThemedText style={[styles.detailItemLabel, { color: theme.textSecondary }]}>
                      Supporting Links ({selectedRequest.links.length})
                    </ThemedText>
                    {selectedRequest.links.map((link, idx) => (
                      <View key={idx} style={styles.linkItem}>
                        <Feather name="link" size={14} color={theme.primary} />
                        <ThemedText
                          style={[styles.linkText, { color: theme.primary }]}
                          numberOfLines={1}
                        >
                          {link}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>

              {selectedRequest.documentUrls?.length > 0 ? (
                <Card style={styles.sectionCard}>
                  <ThemedText style={styles.sectionTitle}>
                    Submitted Documents ({selectedRequest.documentUrls.length})
                  </ThemedText>
                  <ThemedText style={[styles.documentHint, { color: theme.textSecondary }]}>
                    Tap to view fullscreen
                  </ThemedText>
                  <View style={styles.documentsGrid}>
                    {selectedRequest.documentUrls.map((url, idx) =>
                      renderDocumentThumbnail(url, idx)
                    )}
                  </View>
                </Card>
              ) : null}

              <Card style={styles.sectionCard}>
                <ThemedText style={styles.sectionTitle}>Admin Notes</ThemedText>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: theme.glassBackground,
                      color: theme.text,
                      borderColor: theme.glassBorder,
                    },
                  ]}
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  placeholder="Add notes about this verification request..."
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </Card>

              {selectedRequest.denialReason ? (
                <View style={[styles.denialCard, { borderColor: "#EF4444", backgroundColor: theme.backgroundElevated }]}>
                  <View style={styles.denialHeader}>
                    <Feather name="x-circle" size={16} color="#EF4444" />
                    <ThemedText style={[styles.sectionTitleInline, { color: "#EF4444" }]}>
                      Denial Reason
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.denialText}>
                    {selectedRequest.denialReason}
                  </ThemedText>
                </View>
              ) : null}

              {selectedRequest.status !== "APPROVED" ? (
                <View style={styles.actionButtons}>
                  <Pressable
                    style={[styles.actionButtonLarge, { backgroundColor: "#10B981" }]}
                    onPress={() => openActionModal("approve")}
                  >
                    <Feather name="check-circle" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonLargeText}>Approve</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButtonLarge, { backgroundColor: "#EF4444" }]}
                    onPress={() => openActionModal("deny")}
                  >
                    <Feather name="x-circle" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonLargeText}>Deny</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButtonLarge, { backgroundColor: "#F59E0B" }]}
                    onPress={() => openActionModal("request_info")}
                  >
                    <Feather name="help-circle" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonLargeText}>Request More Info</ThemedText>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.approvedBanner, { backgroundColor: "#10B98120" }]}>
                  <Feather name="check-circle" size={24} color="#10B981" />
                  <ThemedText style={{ color: "#10B981", marginLeft: Spacing.sm, fontSize: 16, fontWeight: "600" }}>
                    This user has been verified
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundElevated }]}>
            <ThemedText style={styles.modalTitle}>
              {actionType === "approve" && "Approve Verification"}
              {actionType === "deny" && "Deny Verification"}
              {actionType === "request_info" && "Request More Information"}
            </ThemedText>

            {selectedRequest ? (
              <View style={styles.modalUserInfo}>
                <Avatar uri={selectedRequest.user?.avatarUrl} size={36} />
                <View style={{ marginLeft: Spacing.sm }}>
                  <ThemedText style={{ fontWeight: "600" }}>
                    {selectedRequest.user?.displayName || "Unknown"}
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                    @{selectedRequest.user?.username || "unknown"}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {actionType === "approve" ? (
              <View style={[styles.approveNote, { backgroundColor: "#10B98115", borderColor: "#10B981" }]}>
                <Feather name="info" size={16} color="#10B981" />
                <ThemedText style={{ color: "#10B981", marginLeft: Spacing.sm, flex: 1 }}>
                  This will grant the user a verified badge on their profile.
                </ThemedText>
              </View>
            ) : null}

            {actionType === "deny" ? (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Denial Reason (Required)</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder },
                  ]}
                  value={actionReason}
                  onChangeText={setActionReason}
                  placeholder="Why is this request being denied?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            {actionType === "request_info" ? (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Information Needed (Required)</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder },
                  ]}
                  value={actionReason}
                  onChangeText={setActionReason}
                  placeholder="What additional information or documents are needed?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.glassBackground }]}
                onPress={() => setActionModalVisible(false)}
                disabled={actionMutation.isPending}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      actionType === "approve" ? "#10B981" :
                      actionType === "deny" ? "#EF4444" : "#F59E0B",
                    opacity: actionMutation.isPending ? 0.7 : 1,
                  },
                ]}
                onPress={handleAction}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    {actionType === "approve" ? "Approve" :
                     actionType === "deny" ? "Deny" : "Request Info"}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ImageViewerModal
        isVisible={!!viewingDocumentUrl}
        imageUrl={viewingDocumentUrl || ""}
        onClose={() => setViewingDocumentUrl(null)}
        title="Verification Document"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
  filtersContainer: {
    paddingVertical: Spacing.md,
  },
  filtersList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  requestCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  displayName: {
    fontWeight: "600",
    fontSize: 16,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  verifiedBadgeLarge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  username: {
    fontSize: 13,
    marginTop: 2,
  },
  joinDate: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeLarge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextLarge: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  requestDetails: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    fontSize: 13,
    width: 90,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
  tapHint: {
    position: "absolute",
    right: Spacing.md,
    top: "50%",
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  detailModalContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  detailScrollView: {
    flex: 1,
  },
  detailContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  userCard: {
    padding: Spacing.lg,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userCardInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userCardName: {
    fontSize: 20,
    fontWeight: "700",
  },
  userCardHandle: {
    fontSize: 14,
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  userMetaText: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  statusSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 13,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  detailGrid: {
    gap: Spacing.md,
  },
  detailItem: {
    marginBottom: Spacing.sm,
  },
  detailItemLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailItemValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  reasonBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  linksBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  linkText: {
    fontSize: 13,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  documentHint: {
    fontSize: 12,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
  },
  documentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  documentThumbnail: {
    width: DOC_THUMBNAIL_SIZE,
    height: DOC_THUMBNAIL_SIZE,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  documentLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  documentLabelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "500",
  },
  zoomIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 100,
    lineHeight: 20,
  },
  denialCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  denialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitleInline: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Spacing.xs,
  },
  denialText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  actionButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  actionButtonLargeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  approvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  approveNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
