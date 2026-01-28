import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
  Layout,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ShimmerPlaceholder } from "@/components/ShimmerPlaceholder";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type TicketStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type SupportTicket = {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  is_read: boolean;
  message_count: number;
  has_staff_reply: boolean;
};

type FilterTab = "ALL" | "OPEN" | "PENDING" | "RESOLVED";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "PENDING", label: "Pending" },
  { key: "RESOLVED", label: "Resolved" },
];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

export default function SupportInboxScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statusParam = activeFilter === "ALL" ? undefined : activeFilter;
  
  const { data: tickets, isLoading, refetch } = useQuery<SupportTicket[]>({
    queryKey: ["/api/help/inbox", { status: statusParam }],
  });

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    if (activeFilter === "ALL") return tickets;
    return tickets.filter((t) => t.status === activeFilter);
  }, [tickets, activeFilter]);

  const unreadCount = useMemo(() => {
    return tickets?.filter((t) => !t.is_read).length || 0;
  }, [tickets]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleNewTicket = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("NewTicket");
  }, [navigation]);

  const handleTicketPress = useCallback((ticket: SupportTicket) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("TicketChat", { ticketId: ticket.id });
  }, [navigation]);

  const handleFilterChange = useCallback((filter: FilterTab) => {
    if (filter !== activeFilter) {
      Haptics.selectionAsync();
      setActiveFilter(filter);
    }
  }, [activeFilter]);

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "OPEN":
        return theme.primary;
      case "PENDING":
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
      case "OPEN":
        return "Open";
      case "PENDING":
        return "Pending";
      case "RESOLVED":
        return "Resolved";
      case "CLOSED":
        return "Closed";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case "URGENT":
        return theme.error;
      case "HIGH":
        return theme.warning;
      default:
        return null;
    }
  };

  const FilterPill = ({ tab, isActive }: { tab: typeof FILTER_TABS[0]; isActive: boolean }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
      <AnimatedPressable
        testID={`filter-${tab.key.toLowerCase()}`}
        style={[
          styles.filterPill,
          {
            backgroundColor: isActive ? theme.primary : theme.glassBackground,
            borderColor: isActive ? theme.primary : theme.glassBorder,
          },
          animatedStyle,
        ]}
        onPress={() => handleFilterChange(tab.key)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <ThemedText
          style={[
            styles.filterPillText,
            { color: isActive ? "#FFFFFF" : theme.textSecondary },
          ]}
        >
          {tab.label}
        </ThemedText>
      </AnimatedPressable>
    );
  };

  const TicketCard = ({ ticket, index }: { ticket: SupportTicket; index: number }) => {
    const scale = useSharedValue(1);
    const priorityColor = getPriorityColor(ticket.priority);
    const statusColor = getStatusColor(ticket.status);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
      >
        <AnimatedPressable
          testID={`ticket-${ticket.id}`}
          style={[
            styles.ticketCard,
            {
              backgroundColor: theme.glassBackground,
              borderColor: !ticket.is_read ? theme.primary + "40" : theme.glassBorder,
            },
            animatedStyle,
          ]}
          onPress={() => handleTicketPress(ticket)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.ticketHeader}>
            <View style={styles.ticketTitleRow}>
              {!ticket.is_read ? (
                <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
              ) : null}
              <ThemedText
                type="headline"
                style={[
                  styles.ticketSubject,
                  !ticket.is_read && styles.ticketSubjectUnread,
                ]}
                numberOfLines={1}
              >
                {ticket.subject}
              </ThemedText>
            </View>
            <View style={styles.ticketMeta}>
              {priorityColor ? (
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "20" }]}>
                  <Feather name="alert-circle" size={10} color={priorityColor} />
                  <ThemedText style={[styles.priorityText, { color: priorityColor }]}>
                    {ticket.priority}
                  </ThemedText>
                </View>
              ) : null}
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                  {getStatusLabel(ticket.status)}
                </ThemedText>
              </View>
            </View>
          </View>

          {ticket.last_message_preview ? (
            <ThemedText
              style={[styles.ticketPreview, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {ticket.last_message_preview}
            </ThemedText>
          ) : null}

          <View style={styles.ticketFooter}>
            <View style={styles.ticketFooterLeft}>
              <Feather name="clock" size={12} color={theme.textTertiary} />
              <ThemedText style={[styles.ticketTime, { color: theme.textTertiary }]}>
                {formatRelativeTime(ticket.last_message_at || ticket.updated_at)}
              </ThemedText>
            </View>
            <View style={styles.ticketFooterRight}>
              {ticket.has_staff_reply ? (
                <View style={[styles.staffBadge, { backgroundColor: theme.teal + "20" }]}>
                  <Feather name="check-circle" size={10} color={theme.teal} />
                  <ThemedText style={[styles.staffBadgeText, { color: theme.teal }]}>
                    Staff replied
                  </ThemedText>
                </View>
              ) : null}
              <View style={styles.messageCount}>
                <Feather name="message-circle" size={12} color={theme.textTertiary} />
                <ThemedText style={[styles.messageCountText, { color: theme.textTertiary }]}>
                  {ticket.message_count}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={16} color={theme.textTertiary} />
            </View>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  };

  const LoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.ticketCard,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.skeletonHeader}>
            <ShimmerPlaceholder
              width="60%"
              height={20}
              borderRadius={BorderRadius.sm}
              baseColor={theme.backgroundSecondary}
            />
            <ShimmerPlaceholder
              width={60}
              height={20}
              borderRadius={BorderRadius.sm}
              baseColor={theme.backgroundSecondary}
            />
          </View>
          <ShimmerPlaceholder
            width="100%"
            height={40}
            borderRadius={BorderRadius.sm}
            baseColor={theme.backgroundSecondary}
            style={styles.skeletonPreview}
          />
          <View style={styles.skeletonFooter}>
            <ShimmerPlaceholder
              width={60}
              height={14}
              borderRadius={BorderRadius.xs}
              baseColor={theme.backgroundSecondary}
            />
            <ShimmerPlaceholder
              width={40}
              height={14}
              borderRadius={BorderRadius.xs}
              baseColor={theme.backgroundSecondary}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const EmptyState = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, { backgroundColor: theme.primary + "15" }]}>
        <Feather name="inbox" size={48} color={theme.primary} />
      </View>
      <ThemedText type="title3" style={styles.emptyTitle}>
        No Support Tickets
      </ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        You haven't created any support tickets yet. Need help with something?
      </ThemedText>
      <Pressable
        testID="empty-state-new-ticket"
        style={[styles.emptyButton, { backgroundColor: theme.primary }]}
        onPress={handleNewTicket}
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
        <ThemedText style={styles.emptyButtonText}>Create Your First Ticket</ThemedText>
      </Pressable>
    </Animated.View>
  );

  const NewTicketButton = () => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
      <AnimatedPressable
        testID="button-new-ticket"
        style={[
          styles.newTicketButton,
          { backgroundColor: theme.primary },
          animatedStyle,
        ]}
        onPress={handleNewTicket}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Feather name="plus" size={18} color="#FFFFFF" />
        <ThemedText style={styles.newTicketButtonText}>New Ticket</ThemedText>
      </AnimatedPressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.headerSection,
          {
            paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.md,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTitleSection}>
            <ThemedText type="title2">Support Inbox</ThemedText>
            {unreadCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.unreadBadgeText}>{unreadCount}</ThemedText>
              </View>
            ) : null}
          </View>
          <NewTicketButton />
        </View>

        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => (
            <FilterPill key={tab.key} tab={tab} isActive={activeFilter === tab.key} />
          ))}
        </View>
      </Animated.View>

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <FlatList
          testID="tickets-list"
          data={filteredTickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <TicketCard ticket={item} index={index} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={<EmptyState />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  newTicketButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  newTicketButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  ticketCard: {
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
  ticketTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ticketSubject: {
    flex: 1,
  },
  ticketSubjectUnread: {
    fontWeight: "700",
  },
  ticketMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  ticketPreview: {
    fontSize: 14,
    lineHeight: 20,
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
  staffBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  staffBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  messageCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  messageCountText: {
    fontSize: 12,
  },
  skeletonContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skeletonPreview: {
    marginTop: Spacing.sm,
  },
  skeletonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["4xl"],
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
