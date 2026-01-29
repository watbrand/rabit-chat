import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

type FollowersRouteProp = RouteProp<{ Followers: { userId: string; type: "followers" | "following" } }, "Followers">;

interface FollowUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  bio: string | null;
}

export default function FollowersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const route = useRoute<FollowersRouteProp>();
  const navigation = useNavigation<any>();
  const { user: currentUser } = useAuth();

  const { userId, type } = route.params;
  const [activeTab, setActiveTab] = useState<"followers" | "following">(type);

  const { data: followers, isLoading: followersLoading, refetch: refetchFollowers, isRefetching: isRefetchingFollowers } = useQuery<FollowUser[]>({
    queryKey: [`/api/users/${userId}/followers`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${userId}/followers`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch followers");
      return res.json();
    },
  });

  const { data: following, isLoading: followingLoading, refetch: refetchFollowing, isRefetching: isRefetchingFollowing } = useQuery<FollowUser[]>({
    queryKey: [`/api/users/${userId}/following`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/users/${userId}/following`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch following");
      return res.json();
    },
  });

  const handleUserPress = (targetUserId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (targetUserId === currentUser?.id) {
      navigation.navigate("Profile");
    } else {
      navigation.push("UserProfile", { userId: targetUserId });
    }
  };

  const handleRefresh = () => {
    if (activeTab === "followers") {
      refetchFollowers();
    } else {
      refetchFollowing();
    }
  };

  const currentData = activeTab === "followers" ? followers : following;
  const isLoading = activeTab === "followers" ? followersLoading : followingLoading;
  const isRefetching = activeTab === "followers" ? isRefetchingFollowers : isRefetchingFollowing;

  const renderUser = ({ item }: { item: FollowUser }) => (
    <Pressable
      style={[styles.userCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
      onPress={() => handleUserPress(item.id)}
      testID={`user-card-${item.id}`}
    >
      <Avatar uri={item.avatarUrl} size={52} />
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.displayName}>
            {item.displayName || item.username}
          </ThemedText>
          {item.isVerified ? (
            <Feather name="check-circle" size={14} color="#1DA1F2" />
          ) : null}
        </View>
        <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
          @{item.username}
        </ThemedText>
        {item.bio ? (
          <ThemedText style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.bio}
          </ThemedText>
        ) : null}
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
    return (
      <View style={styles.emptyContainer}>
        <Feather 
          name={activeTab === "followers" ? "users" : "user-plus"} 
          size={48} 
          color={theme.textSecondary} 
        />
        <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
          {activeTab === "followers" ? "No followers yet" : "Not following anyone"}
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          {activeTab === "followers" 
            ? "When people follow this account, they will appear here."
            : "When this account follows people, they will appear here."
          }
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.tabBar, { paddingTop: Platform.OS === "android" ? 0 : headerHeight, backgroundColor: theme.backgroundDefault, borderBottomColor: theme.glassBorder }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "followers" && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab("followers")}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "followers" ? theme.text : theme.textSecondary },
            ]}
          >
            Followers
          </ThemedText>
          <ThemedText style={[styles.tabCount, { color: theme.textSecondary }]}>
            {followers?.length || 0}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            activeTab === "following" && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab("following")}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "following" ? theme.text : theme.textSecondary },
            ]}
          >
            Following
          </ThemedText>
          <ThemedText style={[styles.tabCount, { color: theme.textSecondary }]}>
            {following?.length || 0}
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={currentData}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabCount: {
    fontSize: 13,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  userInfo: {
    flex: 1,
    gap: 2,
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
  username: {
    fontSize: 13,
  },
  bio: {
    fontSize: 13,
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"] * 2,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
