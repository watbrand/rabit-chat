import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Switch,
  Platform,
  RefreshControl,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Haptics from "@/lib/safeHaptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface KeywordFilter {
  id: string;
  userId: string;
  keyword: string;
  filterType: string;
  isActive: boolean;
  createdAt: string;
}

interface MutedAccount {
  id: string;
  userId: string;
  mutedUserId: string;
  mutePosts: boolean;
  muteStories: boolean;
  muteMessages: boolean;
  expiresAt: string | null;
  createdAt: string;
  mutedUser?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

interface RestrictedAccount {
  id: string;
  userId: string;
  restrictedUserId: string;
  reason: string | null;
  createdAt: string;
  restrictedUser?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

export function PrivacyControlsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"keywords" | "muted" | "restricted">("keywords");
  const [refreshing, setRefreshing] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  const { data: keywords, isLoading: loadingKeywords } = useQuery<KeywordFilter[]>({
    queryKey: ["/api/keyword-filters"],
    enabled: !!user,
  });

  const { data: mutedAccounts, isLoading: loadingMuted } = useQuery<MutedAccount[]>({
    queryKey: ["/api/muted-accounts"],
    enabled: !!user,
  });

  const { data: restrictedAccounts, isLoading: loadingRestricted } = useQuery<RestrictedAccount[]>({
    queryKey: ["/api/restricted-accounts"],
    enabled: !!user,
  });

  const addKeywordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/keyword-filters", {
        keyword: newKeyword,
        filterType: "HIDE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keyword-filters"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewKeyword("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add keyword");
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/keyword-filters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keyword-filters"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const unmuteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/muted-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/muted-accounts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const unrestrictMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/restricted-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restricted-accounts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/keyword-filters"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/muted-accounts"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/restricted-accounts"] }),
    ]);
    setRefreshing(false);
  };

  const renderKeywordsTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="filter" size={24} color={theme.primary} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Keyword Filters</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Hide posts and comments containing specific words or phrases
          </ThemedText>
        </View>
      </Card>

      <View style={styles.addKeywordRow}>
        <TextInput
          style={[
            styles.keywordInput,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, color: theme.text },
          ]}
          placeholder="Enter keyword to filter..."
          placeholderTextColor={theme.textSecondary}
          value={newKeyword}
          onChangeText={setNewKeyword}
        />
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => addKeywordMutation.mutate()}
          disabled={!newKeyword.trim() || addKeywordMutation.isPending}
        >
          {addKeywordMutation.isPending ? (
            <LoadingIndicator size="small" />
          ) : (
            <Feather name="plus" size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {loadingKeywords ? (
        <LoadingIndicator size="medium" style={styles.loader} />
      ) : keywords && keywords.length > 0 ? (
        keywords.map((kw, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={kw.id}>
            <Card style={styles.keywordCard}>
              <View style={[styles.keywordIcon, { backgroundColor: theme.error + "20" }]}>
                <Feather name="slash" size={16} color={theme.error} />
              </View>
              <ThemedText style={[styles.keywordText, { color: theme.text }]}>{kw.keyword}</ThemedText>
              <Pressable onPress={() => deleteKeywordMutation.mutate(kw.id)}>
                <Feather name="x" size={18} color={theme.error} />
              </Pressable>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="filter" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Keywords</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Add keywords you want to filter from your feed
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderMutedTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="volume-x" size={24} color={theme.warning || "#F59E0B"} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Muted Accounts</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            You won't see posts from muted accounts, but they can still see yours
          </ThemedText>
        </View>
      </Card>

      {loadingMuted ? (
        <LoadingIndicator size="medium" style={styles.loader} />
      ) : mutedAccounts && mutedAccounts.length > 0 ? (
        mutedAccounts.map((muted, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={muted.id}>
            <Card style={styles.accountCard}>
              <Avatar uri={muted.mutedUser?.avatarUrl} size={48} />
              <View style={styles.accountInfo}>
                <ThemedText style={[styles.accountName, { color: theme.text }]}>
                  {muted.mutedUser?.displayName}
                </ThemedText>
                <ThemedText style={[styles.accountUsername, { color: theme.textSecondary }]}>
                  @{muted.mutedUser?.username}
                </ThemedText>
                <View style={styles.muteOptions}>
                  {muted.mutePosts ? <ThemedText style={[styles.muteTag, { color: theme.warning || "#F59E0B" }]}>Posts</ThemedText> : null}
                  {muted.muteStories ? <ThemedText style={[styles.muteTag, { color: theme.warning || "#F59E0B" }]}>Stories</ThemedText> : null}
                  {muted.muteMessages ? <ThemedText style={[styles.muteTag, { color: theme.warning || "#F59E0B" }]}>Messages</ThemedText> : null}
                </View>
              </View>
              <Pressable
                style={[styles.unmuteButton, { borderColor: theme.primary }]}
                onPress={() => unmuteMutation.mutate(muted.id)}
              >
                <ThemedText style={[styles.unmuteText, { color: theme.primary }]}>Unmute</ThemedText>
              </Pressable>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="volume-x" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Muted Accounts</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            You haven't muted anyone yet
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderRestrictedTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="shield" size={24} color={theme.error} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Restricted Accounts</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Restricted users can see your posts but their comments are hidden from others
          </ThemedText>
        </View>
      </Card>

      {loadingRestricted ? (
        <LoadingIndicator size="medium" style={styles.loader} />
      ) : restrictedAccounts && restrictedAccounts.length > 0 ? (
        restrictedAccounts.map((restricted, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={restricted.id}>
            <Card style={styles.accountCard}>
              <Avatar uri={restricted.restrictedUser?.avatarUrl} size={48} />
              <View style={styles.accountInfo}>
                <ThemedText style={[styles.accountName, { color: theme.text }]}>
                  {restricted.restrictedUser?.displayName}
                </ThemedText>
                <ThemedText style={[styles.accountUsername, { color: theme.textSecondary }]}>
                  @{restricted.restrictedUser?.username}
                </ThemedText>
                {restricted.reason ? (
                  <ThemedText style={[styles.restrictReason, { color: theme.error }]}>
                    Reason: {restricted.reason}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                style={[styles.unmuteButton, { borderColor: theme.primary }]}
                onPress={() => unrestrictMutation.mutate(restricted.id)}
              >
                <ThemedText style={[styles.unmuteText, { color: theme.primary }]}>Remove</ThemedText>
              </Pressable>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="shield" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Restricted Accounts</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            You haven't restricted anyone yet
          </ThemedText>
        </Card>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "keywords" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("keywords")}
          >
            <Feather name="filter" size={16} color={activeTab === "keywords" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "keywords" ? "#FFFFFF" : theme.textSecondary }]}>
              Keywords
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "muted" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("muted")}
          >
            <Feather name="volume-x" size={16} color={activeTab === "muted" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "muted" ? "#FFFFFF" : theme.textSecondary }]}>
              Muted
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "restricted" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("restricted")}
          >
            <Feather name="shield" size={16} color={activeTab === "restricted" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "restricted" ? "#FFFFFF" : theme.textSecondary }]}>
              Restricted
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "keywords" && renderKeywordsTab()}
        {activeTab === "muted" && renderMutedTab()}
        {activeTab === "restricted" && renderRestrictedTab()}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  tabsContainer: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.lg },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabText: {
    fontSize: 11,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  infoCard: { flexDirection: "row", padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.md, alignItems: "center" },
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  infoText: { fontSize: 12, marginTop: 2 },
  addKeywordRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  keywordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
  },
  addButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  loader: { paddingVertical: Spacing.xl },
  keywordCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  keywordIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  keywordText: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  emptyCard: { padding: Spacing.xl, alignItems: "center" },
  emptyTitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.md,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  emptyText: { fontSize: 13, marginTop: Spacing.xs, textAlign: "center" },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  accountInfo: { flex: 1 },
  accountName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  accountUsername: { fontSize: 12, marginTop: 2 },
  muteOptions: { flexDirection: "row", gap: Spacing.xs, marginTop: 4 },
  muteTag: { fontSize: 10 },
  restrictReason: { fontSize: 11, marginTop: 4 },
  unmuteButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md, borderWidth: 1 },
  unmuteText: {
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
});
