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
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
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
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "deny" | "request_info" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");

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
      setSelectedRequest(null);
      setActionType(null);
      setActionReason("");
      setActionNotes("");
      Alert.alert("Success", "Verification request processed successfully");
    },
    onError: (error: any) => {
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

  const openActionModal = (request: VerificationRequest, type: "approve" | "deny" | "request_info") => {
    setSelectedRequest(request);
    setActionType(type);
    setActionReason("");
    setActionNotes("");
    setActionModalVisible(true);
  };

  const handleAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === "deny" && !actionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for denial");
      return;
    }

    if (actionType === "request_info" && !actionNotes.trim()) {
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
      onPress={() => setStatusFilter(status)}
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

  const renderRequest = ({ item }: { item: VerificationRequest }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userRow}>
          <Avatar
            uri={item.user?.avatarUrl}
            size={44}
          />
          <View style={styles.userInfo}>
            <ThemedText style={styles.displayName}>{item.user?.displayName || 'Unknown'}</ThemedText>
            <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
              @{item.user?.username || 'unknown'}
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
            Full Name:
          </ThemedText>
          <ThemedText style={styles.detailValue}>{item.fullName}</ThemedText>
        </View>
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
      </View>

      <View style={styles.reasonSection}>
        <ThemedText style={[styles.reasonLabel, { color: theme.textSecondary }]}>
          Reason for verification:
        </ThemedText>
        <ThemedText style={styles.reasonText} numberOfLines={3}>
          {item.reason}
        </ThemedText>
      </View>

      {item.links.length > 0 ? (
        <View style={styles.linksSection}>
          <ThemedText style={[styles.linksLabel, { color: theme.textSecondary }]}>
            Supporting links: {item.links.length}
          </ThemedText>
        </View>
      ) : null}

      {item.status !== "APPROVED" ? (
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#10B981" }]}
            onPress={() => openActionModal(item, "approve")}
          >
            <Feather name="check" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Approve</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
            onPress={() => openActionModal(item, "deny")}
          >
            <Feather name="x" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Deny</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#8B5CF6" }]}
            onPress={() => openActionModal(item, "request_info")}
          >
            <Feather name="help-circle" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Info</ThemedText>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.approvedNote, { backgroundColor: "#10B98120" }]}>
          <Feather name="check-circle" size={16} color="#10B981" />
          <ThemedText style={{ color: "#10B981", marginLeft: Spacing.xs }}>
            User has been verified
          </ThemedText>
        </View>
      )}
    </Card>
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
      />

      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText style={styles.modalTitle}>
              {actionType === "approve" && "Approve Verification"}
              {actionType === "deny" && "Deny Verification"}
              {actionType === "request_info" && "Request More Information"}
            </ThemedText>

            {selectedRequest ? (
              <View style={styles.modalUserInfo}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  Request from: {selectedRequest.user?.displayName || 'Unknown'} (@{selectedRequest.user?.username || 'unknown'})
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
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  placeholder="What additional information is needed?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            {actionType === "approve" ? (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Admin Notes (Optional)</ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder },
                  ]}
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  placeholder="Any notes about this approval..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.glassBackground }]}
                onPress={() => setActionModalVisible(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  {
                    backgroundColor:
                      actionType === "approve" ? "#10B981" :
                      actionType === "deny" ? "#EF4444" : "#8B5CF6",
                  },
                ]}
                onPress={handleAction}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <ThemedText style={{ color: "#FFFFFF" }}>
                    {actionType === "approve" ? "Approve" :
                     actionType === "deny" ? "Deny" : "Request Info"}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  displayName: {
    fontWeight: "600",
    fontSize: 16,
  },
  username: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  requestDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    fontSize: 13,
    width: 80,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
  reasonSection: {
    marginBottom: Spacing.md,
  },
  reasonLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  linksSection: {
    marginBottom: Spacing.md,
  },
  linksLabel: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  approvedNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    marginBottom: Spacing.md,
  },
  modalUserInfo: {
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
  },
});
