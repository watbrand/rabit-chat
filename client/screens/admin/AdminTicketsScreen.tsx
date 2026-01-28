import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
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
import type { User } from "@shared/schema";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TicketCategory = "ACCOUNT" | "BILLING" | "TECHNICAL" | "CONTENT" | "SAFETY" | "PRIVACY" | "VERIFICATION" | "COINS" | "WITHDRAWAL" | "OTHER";
type FilterStatus = "all" | "OPEN" | "IN_PROGRESS" | "WAITING_USER" | "RESOLVED" | "CLOSED";
type SortOption = "newest" | "oldest" | "priority" | "updated";

interface SupportTicket {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assigned_to: string | null;
  assignee_username: string | null;
  assignee_name: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface TicketStats {
  openCount: number;
  pendingCount: number;
  avgResponseHours: number;
  closedToday: number;
}

const STATUS_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "WAITING_USER", label: "Pending" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "CLOSED", label: "Closed" },
];

const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
  { key: "newest", label: "Newest", icon: "arrow-down" },
  { key: "oldest", label: "Oldest", icon: "arrow-up" },
  { key: "priority", label: "Priority", icon: "alert-circle" },
  { key: "updated", label: "Last Updated", icon: "clock" },
];

const TICKET_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"];
const TICKET_PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function AdminTicketsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("priority");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);

  const { data: ticketsData, isLoading, refetch, isRefetching } = useQuery<{ tickets: SupportTicket[]; total: number }>({
    queryKey: ["/api/admin/support/tickets", { status: filterStatus === "all" ? undefined : filterStatus }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      const res = await fetch(new URL(`/api/admin/support/tickets?${params}`, getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    },
  });

  const { data: stats } = useQuery<TicketStats>({
    queryKey: ["/api/admin/support/tickets/stats"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/help/stats", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) {
        return { openCount: 0, pendingCount: 0, avgResponseHours: 0, closedToday: 0 };
      }
      const data = await res.json();
      return {
        openCount: data.openTickets || 0,
        pendingCount: data.pendingTickets || 0,
        avgResponseHours: data.avgResolutionTime || 0,
        closedToday: data.closedToday || 0,
      };
    },
  });

  const { data: adminUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users/admins"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/users", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch admins");
      const users: User[] = await res.json();
      return users.filter(u => u.isAdmin);
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ ticketId, assigneeId }: { ticketId: string; assigneeId: string | null }) => {
      return apiRequest("PUT", `/api/admin/support/tickets/${ticketId}/assign`, { assigneeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      setAssignModalVisible(false);
      setActionModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Ticket assigned successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to assign ticket");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      return apiRequest("PUT", `/api/support/tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      setStatusModalVisible(false);
      setActionModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Status updated successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update status");
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ ticketId, priority }: { ticketId: string; priority: TicketPriority }) => {
      return apiRequest("PATCH", `/api/admin/support/tickets/${ticketId}`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      setPriorityModalVisible(false);
      setActionModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Priority updated successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update priority");
    },
  });

  const sortedTickets = useMemo(() => {
    if (!ticketsData?.tickets) return [];
    const tickets = [...ticketsData.tickets];
    
    switch (sortOption) {
      case "newest":
        return tickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return tickets.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "updated":
        return tickets.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      case "priority":
      default:
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return tickets.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
  }, [ticketsData?.tickets, sortOption]);

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return theme.primary;
      case "IN_PROGRESS":
        return theme.info;
      case "WAITING_USER":
        return theme.warning;
      case "RESOLVED":
        return theme.success;
      case "CLOSED":
        return theme.textTertiary;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case "OPEN": return "Open";
      case "IN_PROGRESS": return "In Progress";
      case "WAITING_USER": return "Waiting";
      case "RESOLVED": return "Resolved";
      case "CLOSED": return "Closed";
      default: return status;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case "URGENT": return theme.error;
      case "HIGH": return theme.warning;
      case "MEDIUM": return theme.info;
      case "LOW": return theme.textSecondary;
      default: return theme.textSecondary;
    }
  };

  const getCategoryColor = (category: TicketCategory) => {
    switch (category) {
      case "ACCOUNT": return "#8B5CF6";
      case "BILLING": return "#10B981";
      case "TECHNICAL": return "#3B82F6";
      case "CONTENT": return "#EC4899";
      case "SAFETY": return "#EF4444";
      case "PRIVACY": return "#F59E0B";
      case "VERIFICATION": return "#06B6D4";
      case "COINS": return "#F59E0B";
      case "WITHDRAWAL": return "#10B981";
      default: return theme.textSecondary;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleTicketPress = useCallback((ticket: SupportTicket) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTicket(ticket);
    setActionModalVisible(true);
  }, []);

  const handleFilterChange = useCallback((status: FilterStatus) => {
    if (status !== filterStatus) {
      Haptics.selectionAsync();
      setFilterStatus(status);
    }
  }, [filterStatus]);

  const handleSortChange = useCallback((sort: SortOption) => {
    if (sort !== sortOption) {
      Haptics.selectionAsync();
      setSortOption(sort);
    }
  }, [sortOption]);

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) => (
    <Card elevation={1} style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </Card>
  );

  const FilterPill = ({ status, isActive }: { status: typeof STATUS_OPTIONS[0]; isActive: boolean }) => (
    <Pressable
      testID={`filter-${status.key.toLowerCase()}`}
      style={[
        styles.filterPill,
        {
          backgroundColor: isActive ? theme.primary : theme.glassBackground,
          borderColor: isActive ? theme.primary : theme.glassBorder,
        },
      ]}
      onPress={() => handleFilterChange(status.key)}
    >
      <ThemedText
        style={[
          styles.filterPillText,
          { color: isActive ? "#FFFFFF" : theme.textSecondary },
        ]}
      >
        {status.label}
      </ThemedText>
    </Pressable>
  );

  const TicketRow = ({ ticket }: { ticket: SupportTicket }) => {
    const statusColor = getStatusColor(ticket.status);
    const priorityColor = getPriorityColor(ticket.priority);
    const categoryColor = getCategoryColor(ticket.category);
    const showPriority = ticket.priority === "HIGH" || ticket.priority === "URGENT";

    return (
      <Pressable
        testID={`ticket-row-${ticket.id}`}
        style={[styles.ticketRow, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
        onPress={() => handleTicketPress(ticket)}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketUserInfo}>
            <Avatar
              uri={ticket.avatar_url}
              size={36}
            />
            <View style={styles.ticketUserText}>
              <ThemedText type="headline" numberOfLines={1} style={styles.ticketSubject}>
                {ticket.subject}
              </ThemedText>
              <ThemedText style={[styles.ticketUsername, { color: theme.textSecondary }]}>
                @{ticket.username}
              </ThemedText>
            </View>
          </View>
          <View style={styles.ticketBadges}>
            {showPriority ? (
              <View style={[styles.badge, { backgroundColor: `${priorityColor}20` }]}>
                <Feather name="alert-circle" size={10} color={priorityColor} />
                <ThemedText style={[styles.badgeText, { color: priorityColor }]}>
                  {ticket.priority}
                </ThemedText>
              </View>
            ) : null}
            <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
              <ThemedText style={[styles.badgeText, { color: statusColor }]}>
                {getStatusLabel(ticket.status)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.ticketMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
            <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
              {ticket.category}
            </ThemedText>
          </View>
          {ticket.assignee_name ? (
            <View style={styles.assigneeInfo}>
              <Feather name="user" size={12} color={theme.textTertiary} />
              <ThemedText style={[styles.assigneeText, { color: theme.textTertiary }]}>
                {ticket.assignee_name}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.ticketFooter}>
          <View style={styles.ticketFooterLeft}>
            <Feather name="clock" size={12} color={theme.textTertiary} />
            <ThemedText style={[styles.ticketTime, { color: theme.textTertiary }]}>
              {formatRelativeTime(ticket.updated_at)}
            </ThemedText>
          </View>
          <View style={styles.ticketFooterRight}>
            <View style={styles.messageCount}>
              <Feather name="message-circle" size={12} color={theme.textTertiary} />
              <ThemedText style={[styles.messageCountText, { color: theme.textTertiary }]}>
                {ticket.message_count}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={16} color={theme.textTertiary} />
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />
        }
        stickyHeaderIndices={[2]}
      >
        <Card elevation={2} style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerIcon, { backgroundColor: theme.primary }]}>
              <Feather name="headphones" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerText}>
              <ThemedText type="h3">Support Tickets</ThemedText>
              <ThemedText style={{ color: theme.textSecondary }}>
                {ticketsData?.total || 0} total tickets
              </ThemedText>
            </View>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <StatCard
            icon="inbox"
            label="Open"
            value={stats?.openCount || 0}
            color={theme.primary}
          />
          <StatCard
            icon="clock"
            label="Pending"
            value={stats?.pendingCount || 0}
            color={theme.warning}
          />
          <StatCard
            icon="zap"
            label="Avg Time"
            value={`${(stats?.avgResponseHours || 0).toFixed(1)}h`}
            color={theme.info}
          />
          <StatCard
            icon="check-circle"
            label="Today"
            value={stats?.closedToday || 0}
            color={theme.success}
          />
        </View>

        <View style={[styles.filtersSection, { backgroundColor: theme.backgroundRoot }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterRow}>
              {STATUS_OPTIONS.map((status) => (
                <FilterPill key={status.key} status={status} isActive={filterStatus === status.key} />
              ))}
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((sort) => (
                <Pressable
                  key={sort.key}
                  testID={`sort-${sort.key}`}
                  style={[
                    styles.sortPill,
                    {
                      backgroundColor: sortOption === sort.key ? theme.backgroundTertiary : "transparent",
                      borderColor: sortOption === sort.key ? theme.border : "transparent",
                    },
                  ]}
                  onPress={() => handleSortChange(sort.key)}
                >
                  <Feather
                    name={sort.icon as any}
                    size={12}
                    color={sortOption === sort.key ? theme.primary : theme.textTertiary}
                  />
                  <ThemedText
                    style={[
                      styles.sortText,
                      { color: sortOption === sort.key ? theme.text : theme.textTertiary },
                    ]}
                  >
                    {sort.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {sortedTickets.length > 0 ? (
          <View style={styles.ticketsList}>
            {sortedTickets.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="inbox" size={48} color={theme.primary} />
            </View>
            <ThemedText type="title3" style={styles.emptyTitle}>No Tickets Found</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {filterStatus === "all"
                ? "There are no support tickets yet."
                : `No ${filterStatus.toLowerCase().replace("_", " ")} tickets found.`}
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <Modal visible={actionModalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundElevated }]}>
            {selectedTicket ? (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText type="title3" numberOfLines={2}>{selectedTicket.subject}</ThemedText>
                  <Pressable
                    testID="modal-close"
                    onPress={() => setActionModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Feather name="x" size={24} color={theme.text} />
                  </Pressable>
                </View>

                <View style={styles.modalInfo}>
                  <View style={styles.modalInfoRow}>
                    <ThemedText style={{ color: theme.textSecondary }}>User:</ThemedText>
                    <ThemedText>@{selectedTicket.username}</ThemedText>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <ThemedText style={{ color: theme.textSecondary }}>Status:</ThemedText>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(selectedTicket.status) + "20" }]}>
                      <ThemedText style={{ color: getStatusColor(selectedTicket.status), fontSize: 12 }}>
                        {getStatusLabel(selectedTicket.status)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <ThemedText style={{ color: theme.textSecondary }}>Priority:</ThemedText>
                    <View style={[styles.badge, { backgroundColor: getPriorityColor(selectedTicket.priority) + "20" }]}>
                      <ThemedText style={{ color: getPriorityColor(selectedTicket.priority), fontSize: 12 }}>
                        {selectedTicket.priority}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <ThemedText style={{ color: theme.textSecondary }}>Assigned:</ThemedText>
                    <ThemedText>{selectedTicket.assignee_name || "Unassigned"}</ThemedText>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    testID="action-view-details"
                    style={[styles.modalAction, { backgroundColor: theme.primary }]}
                    onPress={() => {
                      setActionModalVisible(false);
                      Alert.alert("View Ticket", `Navigate to ticket detail: ${selectedTicket.id}`);
                    }}
                  >
                    <Feather name="eye" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.modalActionText}>View Details</ThemedText>
                  </Pressable>

                  <Pressable
                    testID="action-assign"
                    style={[styles.modalAction, { backgroundColor: theme.info }]}
                    onPress={() => setAssignModalVisible(true)}
                  >
                    <Feather name="user-plus" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.modalActionText}>Assign</ThemedText>
                  </Pressable>

                  <Pressable
                    testID="action-status"
                    style={[styles.modalAction, { backgroundColor: theme.warning }]}
                    onPress={() => setStatusModalVisible(true)}
                  >
                    <Feather name="edit-2" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.modalActionText}>Status</ThemedText>
                  </Pressable>

                  <Pressable
                    testID="action-priority"
                    style={[styles.modalAction, { backgroundColor: theme.error }]}
                    onPress={() => setPriorityModalVisible(true)}
                  >
                    <Feather name="alert-triangle" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.modalActionText}>Priority</ThemedText>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={assignModalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setAssignModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundElevated }]}>
            <ThemedText type="title3" style={styles.modalTitle}>Assign Ticket</ThemedText>
            <ScrollView style={styles.optionsList}>
              <Pressable
                testID="assign-unassign"
                style={[styles.optionItem, { borderColor: theme.border }]}
                onPress={() => {
                  if (selectedTicket) {
                    assignMutation.mutate({ ticketId: selectedTicket.id, assigneeId: null });
                  }
                }}
              >
                <Feather name="user-x" size={18} color={theme.textSecondary} />
                <ThemedText>Unassign</ThemedText>
              </Pressable>
              {adminUsers?.map((admin) => (
                <Pressable
                  key={admin.id}
                  testID={`assign-${admin.id}`}
                  style={[styles.optionItem, { borderColor: theme.border }]}
                  onPress={() => {
                    if (selectedTicket) {
                      assignMutation.mutate({ ticketId: selectedTicket.id, assigneeId: admin.id });
                    }
                  }}
                >
                  <Avatar uri={admin.avatarUrl} size={24} />
                  <ThemedText>{admin.displayName || admin.username}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={statusModalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setStatusModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundElevated }]}>
            <ThemedText type="title3" style={styles.modalTitle}>Change Status</ThemedText>
            <View style={styles.optionsList}>
              {TICKET_STATUSES.map((status) => (
                <Pressable
                  key={status}
                  testID={`status-${status.toLowerCase()}`}
                  style={[
                    styles.optionItem,
                    {
                      borderColor: theme.border,
                      backgroundColor: selectedTicket?.status === status ? theme.backgroundTertiary : "transparent",
                    },
                  ]}
                  onPress={() => {
                    if (selectedTicket) {
                      updateStatusMutation.mutate({ ticketId: selectedTicket.id, status });
                    }
                  }}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <ThemedText>{getStatusLabel(status)}</ThemedText>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={priorityModalVisible} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPriorityModalVisible(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundElevated }]}>
            <ThemedText type="title3" style={styles.modalTitle}>Change Priority</ThemedText>
            <View style={styles.optionsList}>
              {TICKET_PRIORITIES.map((priority) => (
                <Pressable
                  key={priority}
                  testID={`priority-${priority.toLowerCase()}`}
                  style={[
                    styles.optionItem,
                    {
                      borderColor: theme.border,
                      backgroundColor: selectedTicket?.priority === priority ? theme.backgroundTertiary : "transparent",
                    },
                  ]}
                  onPress={() => {
                    if (selectedTicket) {
                      updatePriorityMutation.mutate({ ticketId: selectedTicket.id, priority });
                    }
                  }}
                >
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                  <ThemedText>{priority}</ThemedText>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: "center",
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  filtersSection: {
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterScroll: {
    marginBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  sortScroll: {},
  sortRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  sortText: {
    fontSize: 12,
  },
  ticketsList: {
    gap: Spacing.md,
  },
  ticketRow: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  ticketUserInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  ticketUserText: {
    flex: 1,
  },
  ticketSubject: {
    marginBottom: 2,
  },
  ticketUsername: {
    fontSize: 12,
  },
  ticketBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  ticketMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
  },
  assigneeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assigneeText: {
    fontSize: 11,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  ticketFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  ticketTime: {
    fontSize: 12,
  },
  ticketFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  messageCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  messageCountText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalTitle: {
    marginBottom: Spacing.lg,
  },
  modalInfo: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  modalAction: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  modalActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
