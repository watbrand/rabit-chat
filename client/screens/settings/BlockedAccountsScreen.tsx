import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  blockedAt?: string;
}

type SortOption = "recent" | "alphabetical";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BlockedAccountsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  const debounceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(text);
    }, 300);
  }, []);

  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: blockedUsers, isLoading } = useQuery<BlockedUser[]>({
    queryKey: ["/api/me/blocked"],
  });

  const filteredAndSortedUsers = useMemo(() => {
    if (!blockedUsers) return [];

    let filtered = blockedUsers;

    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase().trim();
      filtered = blockedUsers.filter(
        (user) =>
          user.displayName.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === "alphabetical") {
        return a.displayName.localeCompare(b.displayName);
      }
      if (a.blockedAt && b.blockedAt) {
        return new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime();
      }
      return 0;
    });

    return sorted;
  }, [blockedUsers, debouncedQuery, sortOption]);

  const unblockMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/me/unblock/${userId}`);
    },
    onSuccess: () => {
      setUnblockingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/me/blocked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/discover/people"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      setUnblockingUserId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to unblock user. Please try again.");
    },
  });

  const handleUnblock = (user: BlockedUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock @${user.username}?\n\nThey will be able to:\n• See your profile and posts\n• Message you again\n• Follow you (if your account is public)`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setUnblockingUserId(user.id);
            unblockMutation.mutate(user.id);
          },
        },
      ]
    );
  };

  const handleSortChange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortOption((prev) => (prev === "recent" ? "alphabetical" : "recent"));
  };

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const isUnblocking = unblockingUserId === item.id;

    return (
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
          style={[
            styles.unblockButton,
            { borderColor: theme.primary },
            isUnblocking && styles.unblockButtonDisabled,
          ]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking || unblockMutation.isPending}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <ThemedText style={[styles.unblockText, { color: theme.primary }]}>
              Unblock
            </ThemedText>
          )}
        </Pressable>
      </View>
    );
  };

  const renderEmpty = () => {
    const hasSearchQuery = debouncedQuery.trim().length > 0;
    const hasBlockedUsers = blockedUsers && blockedUsers.length > 0;

    if (hasSearchQuery && hasBlockedUsers) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            No results found
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            No blocked accounts match "{debouncedQuery}"
          </ThemedText>
          <Pressable
            style={[styles.clearSearchButton, { borderColor: theme.primary }]}
            onPress={handleClearSearch}
          >
            <ThemedText style={[styles.clearSearchText, { color: theme.primary }]}>
              Clear Search
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return (
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
  };

  const renderHeader = () => {
    const hasBlockedUsers = blockedUsers && blockedUsers.length > 0;

    return (
      <View style={styles.headerContainer}>
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search blocked accounts..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <Feather name="x-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {hasBlockedUsers && (
          <View style={styles.sortContainer}>
            <ThemedText style={[styles.sortLabel, { color: theme.textSecondary }]}>
              Sort by:
            </ThemedText>
            <Pressable
              style={[
                styles.sortButton,
                { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
              ]}
              onPress={handleSortChange}
            >
              <Feather
                name={sortOption === "recent" ? "clock" : "type"}
                size={14}
                color={theme.primary}
              />
              <ThemedText style={[styles.sortButtonText, { color: theme.text }]}>
                {sortOption === "recent" ? "Most Recent" : "Alphabetical"}
              </ThemedText>
              <Feather name="chevron-down" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>
        )}

        {hasBlockedUsers && (
          <ThemedText style={[styles.countText, { color: theme.textSecondary }]}>
            {filteredAndSortedUsers.length} of {blockedUsers.length} blocked account
            {blockedUsers.length !== 1 ? "s" : ""}
          </ThemedText>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
        <FlatList
        data={filteredAndSortedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderBlockedUser}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.lg : headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? Spacing.xs : 0,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sortLabel: {
    fontSize: 14,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  countText: {
    fontSize: 13,
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
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  unblockButtonDisabled: {
    opacity: 0.7,
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
  clearSearchButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
