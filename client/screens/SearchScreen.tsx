import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import debounce from "lodash.debounce";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

type User = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  netWorth: number;
  influenceScore: number;
};

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const url = new URL("/api/users/search", getApiUrl());
      url.searchParams.set("q", debouncedQuery);
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length > 0,
  });

  const handleUserPress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const formatNetWorth = (value: number) => {
    if (value >= 1000000000) return `R${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
    return `R${value}`;
  };

  const renderUser = ({ item }: { item: User }) => (
    <Pressable
      style={[styles.userCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
      onPress={() => handleUserPress(item.id)}
    >
      <Avatar
        uri={item.avatarUrl}
        size={50}
      />
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.displayName}>{item.displayName}</ThemedText>
          {item.isVerified ? (
            <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={10} color="#FFF" />
            </View>
          ) : null}
        </View>
        <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
          @{item.username}
        </ThemedText>
        <View style={styles.statsRow}>
          <ThemedText style={[styles.statText, { color: theme.primary }]}>
            {formatNetWorth(item.netWorth)}
          </ThemedText>
          <ThemedText style={[styles.statDivider, { color: theme.textSecondary }]}>•</ThemedText>
          <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
            {item.influenceScore.toLocaleString()} influence
          </ThemedText>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingIndicator size="large" />
        </View>
      );
    }

    if (!debouncedQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            Search for users
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Find people to follow by name or username
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Feather name="user-x" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
          No users found
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Try a different search term
        </ThemedText>
      </View>
    );
  };

  return (
    <GradientBackground variant={isDark ? "orbs" : "subtle"}>
      <KeyboardAvoidingView 
        style={[styles.container, { paddingTop: headerHeight + Spacing.md }]}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={[styles.searchContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-search"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => { setSearchQuery(""); setDebouncedQuery(""); }}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={users || []}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "600",
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  statText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
