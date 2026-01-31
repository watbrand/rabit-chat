import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Poke {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: string;
  message: string | null;
  seen: boolean;
  createdAt: string;
  fromUser?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

interface BffStatus {
  id: string;
  userId: string;
  bffUserId: string;
  status: string;
  createdAt: string;
  bffUser?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

interface CloseFriend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  friend?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

const POKE_TYPES = [
  { id: "wave", icon: "send", label: "Wave", emoji: "👋" },
  { id: "wink", icon: "eye", label: "Wink", emoji: "😉" },
  { id: "hug", icon: "heart", label: "Hug", emoji: "🤗" },
  { id: "highfive", icon: "zap", label: "High Five", emoji: "🙌" },
];

export function SocialFeaturesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pokes" | "bff" | "closefriends">("pokes");
  const [refreshing, setRefreshing] = useState(false);

  const { data: pokes, isLoading: loadingPokes } = useQuery<Poke[]>({
    queryKey: ["/api/pokes/received"],
    enabled: !!user,
  });

  const { data: bffList, isLoading: loadingBff } = useQuery<BffStatus[]>({
    queryKey: ["/api/bff"],
    enabled: !!user,
  });

  const { data: closeFriends, isLoading: loadingCloseFriends } = useQuery<CloseFriend[]>({
    queryKey: ["/api/close-friends"],
    enabled: !!user,
  });

  const pokeBackMutation = useMutation({
    mutationFn: async ({ userId, type }: { userId: string; type: string }) => {
      return apiRequest("POST", "/api/pokes", { toUserId: userId, type });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Poked!", "You poked them back!");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to poke");
    },
  });

  const markPokeSeenMutation = useMutation({
    mutationFn: async (pokeId: string) => {
      return apiRequest("POST", `/api/pokes/${pokeId}/seen`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pokes/received"] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/pokes/received"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/bff"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/close-friends"] }),
    ]);
    setRefreshing(false);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const renderPokesTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="send" size={24} color={theme.primary} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Pokes</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            A fun way to get someone's attention. Poke them and they'll get notified!
          </ThemedText>
        </View>
      </Card>

      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
        Received Pokes ({pokes?.length || 0})
      </ThemedText>

      {loadingPokes ? (
        <LoadingIndicator size="medium" style={styles.loader} />
      ) : pokes && pokes.length > 0 ? (
        pokes.map((poke, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={poke.id}>
            <Card style={StyleSheet.flatten([styles.pokeCard, !poke.seen && { borderColor: theme.primary, borderWidth: 1 }])}>
              <Avatar uri={poke.fromUser?.avatarUrl} size={48} />
              <View style={styles.pokeInfo}>
                <ThemedText style={[styles.pokeName, { color: theme.text }]}>
                  {poke.fromUser?.displayName || "Someone"}
                </ThemedText>
                <ThemedText style={[styles.pokeType, { color: theme.primary }]}>
                  {POKE_TYPES.find((t) => t.id === poke.type)?.emoji || "👋"} {poke.type}
                </ThemedText>
                <ThemedText style={[styles.pokeTime, { color: theme.textSecondary }]}>
                  {formatTime(poke.createdAt)}
                </ThemedText>
              </View>
              <Pressable
                style={[styles.pokeBackButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  if (!poke.seen) markPokeSeenMutation.mutate(poke.id);
                  pokeBackMutation.mutate({ userId: poke.fromUserId, type: poke.type });
                }}
              >
                <ThemedText style={styles.pokeBackText}>Poke Back</ThemedText>
              </Pressable>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="send" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Pokes Yet</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            When someone pokes you, it'll appear here
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderBffTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="users" size={24} color={theme.pink} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>BFF Status</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Track your messaging streaks with your best friends. Keep the streak alive!
          </ThemedText>
        </View>
      </Card>

      {loadingBff ? (
        <LoadingIndicator size="medium" style={styles.loader} />
      ) : bffList && bffList.length > 0 ? (
        bffList.map((bff, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={bff.id}>
            <Card style={styles.bffCard}>
              <Avatar uri={bff.bffUser?.avatarUrl} size={56} />
              <View style={styles.bffInfo}>
                <ThemedText style={[styles.bffName, { color: theme.text }]}>
                  {bff.bffUser?.displayName}
                </ThemedText>
                <ThemedText style={[styles.bffUsername, { color: theme.textSecondary }]}>
                  @{bff.bffUser?.username}
                </ThemedText>
              </View>
              <View style={[styles.bffBadge, { backgroundColor: theme.pink + "20" }]}>
                <ThemedText style={[styles.bffBadgeText, { color: theme.pink }]}>
                  {bff.status === "MUTUAL" ? "BFF" : "Pending"}
                </ThemedText>
              </View>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="heart" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No BFFs Yet</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Message someone frequently to become BFFs
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderCloseFriendsTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="star" size={24} color={theme.success} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Close Friends</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Share exclusive stories and content with your inner circle only.
          </ThemedText>
        </View>
      </Card>

      {loadingCloseFriends ? (
        <LoadingIndicator size="medium" style={styles.loader} />
      ) : closeFriends && closeFriends.length > 0 ? (
        closeFriends.map((cf, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={cf.id}>
            <Card style={styles.closeFriendCard}>
              <Avatar uri={cf.friend?.avatarUrl} size={48} />
              <View style={styles.cfInfo}>
                <ThemedText style={[styles.cfName, { color: theme.text }]}>
                  {cf.friend?.displayName}
                </ThemedText>
                <ThemedText style={[styles.cfUsername, { color: theme.textSecondary }]}>
                  @{cf.friend?.username}
                </ThemedText>
              </View>
              <View style={[styles.cfBadge, { backgroundColor: theme.success + "20" }]}>
                <Feather name="star" size={14} color={theme.success} />
              </View>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="star" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Close Friends</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Add close friends from their profile to share exclusive content
          </ThemedText>
        </Card>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "pokes" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("pokes")}
          >
            <Feather name="send" size={16} color={activeTab === "pokes" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "pokes" ? "#FFFFFF" : theme.textSecondary }]}>
              Pokes
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "bff" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("bff")}
          >
            <Feather name="users" size={16} color={activeTab === "bff" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "bff" ? "#FFFFFF" : theme.textSecondary }]}>
              BFF
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "closefriends" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("closefriends")}
          >
            <Feather name="star" size={16} color={activeTab === "closefriends" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "closefriends" ? "#FFFFFF" : theme.textSecondary }]}>
              Close Friends
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "pokes" && renderPokesTab()}
        {activeTab === "bff" && renderBffTab()}
        {activeTab === "closefriends" && renderCloseFriendsTab()}
      </ScrollView>
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
    fontSize: 12,
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
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  loader: { paddingVertical: Spacing.xl },
  pokeCard: { flexDirection: "row", alignItems: "center", padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  pokeInfo: { flex: 1 },
  pokeName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  pokeType: { fontSize: 13, marginTop: 2 },
  pokeTime: { fontSize: 11, marginTop: 2 },
  pokeBackButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  pokeBackText: {
    color: "#FFFFFF",
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
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
  bffCard: { flexDirection: "row", alignItems: "center", padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  bffInfo: { flex: 1 },
  bffName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  bffUsername: { fontSize: 12, marginTop: 2 },
  bffBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  bffBadgeText: {
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  closeFriendCard: { flexDirection: "row", alignItems: "center", padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  cfInfo: { flex: 1 },
  cfName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  cfUsername: { fontSize: 12, marginTop: 2 },
  cfBadge: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
