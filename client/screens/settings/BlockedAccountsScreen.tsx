import React from "react";
import { View, StyleSheet, FlatList, Pressable, Alert, Platform } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export default function BlockedAccountsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: blockedUsers, isLoading } = useQuery<BlockedUser[]>({
    queryKey: ["/api/me/blocked"],
  });

  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/me/unblock/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/blocked"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to unblock user");
    },
  });

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock @${user.username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: () => unblockMutation.mutate(user.id),
        },
      ]
    );
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View
      style={[
        styles.userRow,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
    >
      <Avatar uri={item.avatarUrl} size={44} />
      <View style={styles.userInfo}>
        <ThemedText style={styles.displayName}>{item.displayName}</ThemedText>
        <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
          @{item.username}
        </ThemedText>
      </View>
      <Pressable
        style={[styles.unblockButton, { borderColor: theme.primary }]}
        onPress={() => handleUnblock(item)}
        disabled={unblockMutation.isPending}
      >
        <ThemedText style={[styles.unblockText, { color: theme.primary }]}>
          Unblock
        </ThemedText>
      </Pressable>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="user-x" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        No blocked accounts
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        When you block someone, they will appear here
      </ThemedText>
    </View>
  );

  if (isLoading) {
    return (
      <LoadingIndicator fullScreen />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        data={blockedUsers || []}
        keyExtractor={(item) => item.id}
        renderItem={renderBlockedUser}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
  },
  unblockButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
