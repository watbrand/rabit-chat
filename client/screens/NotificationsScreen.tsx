import React from "react";
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

type Notification = {
  id: string;
  userId: string;
  actorId: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "MESSAGE" | "MENTION";
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
  actor?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  othersCount?: number;
  otherActors?: Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  }>;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  const { data: notifications, isLoading, refetch, isRefetching } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/notifications/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return { name: "heart" as const, color: "#EF4444" };
      case "COMMENT":
        return { name: "message-circle" as const, color: theme.primary };
      case "FOLLOW":
        return { name: "user-plus" as const, color: "#10B981" };
      case "MESSAGE":
        return { name: "send" as const, color: "#3B82F6" };
      case "MENTION":
        return { name: "at-sign" as const, color: "#F59E0B" };
      default:
        return { name: "bell" as const, color: theme.textSecondary };
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor?.displayName || notification.actor?.username || "Someone";
    const othersCount = notification.othersCount || 0;
    const othersText = othersCount > 0 ? ` and ${othersCount} other${othersCount > 1 ? "s" : ""}` : "";
    
    switch (notification.type) {
      case "LIKE":
        return `${actorName}${othersText} liked your post`;
      case "COMMENT":
        return `${actorName}${othersText} commented on your post`;
      case "FOLLOW":
        return `${actorName}${othersText} started following you`;
      case "MESSAGE":
        return `${actorName} sent you a message`;
      case "MENTION":
        return `${actorName} mentioned you`;
      default:
        return "You have a new notification";
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.readAt) {
      markReadMutation.mutate(notification.id);
    }
    
    const actorName = notification.actor?.displayName || notification.actor?.username || "User";
    
    switch (notification.type) {
      case "LIKE":
      case "COMMENT":
      case "MENTION":
        if (notification.entityId) {
          navigation.navigate("PostDetail", { postId: notification.entityId });
        }
        break;
      case "FOLLOW":
        if (notification.actorId) {
          navigation.navigate("UserProfile", { userId: notification.actorId });
        }
        break;
      case "MESSAGE":
        if (notification.entityId && notification.actorId) {
          navigation.navigate("Chat", { 
            conversationId: notification.entityId,
            otherUserId: notification.actorId,
            otherUserName: actorName
          });
        }
        break;
    }
  };

  const formatTime = (dateString: string) => {
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

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconInfo = getNotificationIcon(item.type);
    
    const isUnread = !item.readAt;
    
    return (
      <Card 
        elevation={isUnread ? 2 : 1} 
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(item)}
      >
          <View style={[
            styles.notificationRow,
            isUnread && { backgroundColor: `${theme.primary}08` }
          ]}>
            <View style={styles.avatarContainer}>
              <Avatar
                uri={item.actor?.avatarUrl}
                size={48}
              />
              <View style={[styles.iconBadge, { backgroundColor: iconInfo.color }]}>
                <Feather name={iconInfo.name} size={12} color="white" />
              </View>
            </View>
            <View style={styles.contentContainer}>
              <ThemedText style={[styles.notificationText, isUnread && { fontWeight: "600" }]}>
                {getNotificationText(item)}
              </ThemedText>
              <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
                {formatTime(item.createdAt)}
              </ThemedText>
            </View>
            {isUnread ? (
              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
            ) : null}
          </View>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="bell-off" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      <ThemedText type="h4" style={styles.emptyTitle}>
        No notifications yet
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        When someone likes, comments, or follows you, it will appear here
      </ThemedText>
    </View>
  );

  const hasUnread = notifications?.some(n => !n.readAt);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={notifications || []}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={hasUnread ? (
          <Pressable
            style={[styles.markAllButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => markAllReadMutation.mutate()}
          >
            <ThemedText style={[styles.markAllText, { color: theme.primary }]}>
              Mark all as read
            </ThemedText>
          </Pressable>
        ) : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  markAllButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  notificationCard: {
    padding: Spacing.md,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  contentContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  notificationText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 13,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
});
