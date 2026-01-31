import React, { useState, useRef, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
  Pressable,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ConversationCard } from "@/components/ConversationCard";
import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { GlassInput } from "@/components/GlassInput";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, Fonts, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { MessageListSkeleton } from "@/components/ShimmerPlaceholder";
import { GradientBackground } from "@/components/GradientBackground";

type WealthyUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  netWorth: number;
};

type TabType = "PRIMARY" | "GENERAL" | "REQUESTS";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("PRIMARY");
  const [searchQuery, setSearchQuery] = useState("");
  const lastRefreshTimeRef = useRef<number>(0);
  const REFRESH_THROTTLE_MS = 2000;

  const { data: primaryConversations, isLoading: primaryLoading, refetch: refetchPrimary, isRefetching: primaryRefetching } = useQuery<any[]>({
    queryKey: ["/api/messages/inbox/primary"],
  });

  const { data: generalConversations, isLoading: generalLoading, refetch: refetchGeneral, isRefetching: generalRefetching } = useQuery<any[]>({
    queryKey: ["/api/messages/inbox/general"],
  });

  const { data: requests, isLoading: requestsLoading, refetch: refetchRequests, isRefetching: requestsRefetching } = useQuery<any[]>({
    queryKey: ["/api/messages/requests"],
  });

  // Fetch top wealthy users from Mall - same data source
  const { data: top50 } = useQuery<WealthyUser[]>({
    queryKey: ["/api/mall/top50"],
  });

  // Auto-scrolling animation for the NetWorth carousel
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [carouselWidth, setCarouselWidth] = useState(0);

  useEffect(() => {
    if (!top50 || top50.length === 0) return;
    
    const itemWidth = 76; // avatar + padding
    const totalWidth = top50.length * itemWidth;
    let scrollPosition = 0;
    
    const interval = setInterval(() => {
      scrollPosition += 1;
      if (scrollPosition >= totalWidth - 300) {
        scrollPosition = 0;
      }
      scrollViewRef.current?.scrollTo({ x: scrollPosition, animated: true });
    }, 50);
    
    return () => clearInterval(interval);
  }, [top50]);

  const formatNetWorth = (value: number) => {
    if (value >= 1_000_000_000) return `R${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `R${(value / 1_000).toFixed(1)}K`;
    return `R${value}`;
  };

  const handleWealthyUserPress = (userId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("UserProfile", { userId });
  };

  const acceptMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("POST", `/api/messages/requests/${conversationId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox/primary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/inbox/general"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest("DELETE", `/api/messages/requests/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/requests"] });
    },
  });

  const handleConversationPress = (conversation: any) => {
    const otherUser =
      conversation.participant1.id === user?.id
        ? conversation.participant2
        : conversation.participant1;

    navigation.navigate("Chat", {
      conversationId: conversation.id,
      otherUserId: otherUser.id,
      otherUserName: otherUser.displayName,
    });
  };

  const handleUserProfilePress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const filterConversations = (conversations: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return conversations;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return conversations.filter((conversation) => {
      const otherUser =
        conversation.participant1.id === user?.id
          ? conversation.participant2
          : conversation.participant1;
      
      const displayName = otherUser.displayName?.toLowerCase() || "";
      const username = otherUser.username?.toLowerCase() || "";
      
      return displayName.includes(lowerSearchTerm) || username.includes(lowerSearchTerm);
    });
  };

  const getActiveData = () => {
    let data: any[] = [];
    switch (activeTab) {
      case "PRIMARY":
        data = primaryConversations || [];
        break;
      case "GENERAL":
        data = generalConversations || [];
        break;
      case "REQUESTS":
        data = requests || [];
        break;
    }
    return filterConversations(data, searchQuery);
  };

  const isLoading = activeTab === "PRIMARY" ? primaryLoading : activeTab === "GENERAL" ? generalLoading : requestsLoading;
  const isRefetching = activeTab === "PRIMARY" ? primaryRefetching : activeTab === "GENERAL" ? generalRefetching : requestsRefetching;
  const refetch = activeTab === "PRIMARY" ? refetchPrimary : activeTab === "GENERAL" ? refetchGeneral : refetchRequests;

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < REFRESH_THROTTLE_MS) {
      return;
    }
    lastRefreshTimeRef.current = now;
    refetch();
  };

  const renderEmpty = () => {
    const emptyMessages: Record<TabType, { title: string; text: string }> = {
      PRIMARY: {
        title: "No messages yet",
        text: "Messages from people you follow will appear here",
      },
      GENERAL: {
        title: "No messages",
        text: "Messages from others will appear here",
      },
      REQUESTS: {
        title: "No requests",
        text: "Message requests from new people will appear here",
      },
    };

    return (
      <View style={styles.emptyContainer} testID="empty-messages-container">
        <Image
          source={require("../../assets/images/empty-states/empty-messages.png")}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <ThemedText type="h4" style={styles.emptyTitle}>
          {emptyMessages[activeTab].title}
        </ThemedText>
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          {emptyMessages[activeTab].text}
        </ThemedText>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: any }) => {
    const otherUser =
      item.participant1.id === user?.id
        ? item.participant2
        : item.participant1;

    return (
      <View style={[styles.requestCard, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.requestInfo}>
          <Pressable onPress={() => handleUserProfilePress(otherUser.id)}>
            <Image
              source={
                otherUser.avatarUrl
                  ? { uri: otherUser.avatarUrl }
                  : require("../../assets/images/default-avatar.png")
              }
              style={styles.requestAvatar}
            />
          </Pressable>
          <Pressable onPress={() => handleConversationPress(item)} style={styles.requestTextPress}>
            <View style={styles.requestText}>
              <ThemedText type="headline">{otherUser.displayName}</ThemedText>
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                @{otherUser.username}
              </ThemedText>
            </View>
          </Pressable>
        </View>
        <View style={styles.requestActions}>
          <Pressable
            style={[styles.acceptButton, { backgroundColor: theme.primary }]}
            onPress={() => acceptMutation.mutate(item.id)}
            disabled={acceptMutation.isPending}
          >
            <ThemedText style={styles.buttonText}>Accept</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.declineButton, { backgroundColor: theme.backgroundTertiary }]}
            onPress={() => declineMutation.mutate(item.id)}
            disabled={declineMutation.isPending}
          >
            <ThemedText style={[styles.buttonText, { color: theme.text }]}>Decline</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <MessageListSkeleton />
      </View>
    );
  }

  const renderNetWorthCarousel = () => {
    if (!top50 || top50.length === 0) return null;
    
    return (
      <View style={[styles.netWorthCarouselContainer, { paddingTop: headerHeight + Spacing.md }]}>
        <View style={styles.netWorthHeader}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.netWorthBadge}
          >
            <Feather name="award" size={12} color="#FFFFFF" />
            <ThemedText style={styles.netWorthBadgeText}>Top Wealthy</ThemedText>
          </LinearGradient>
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.netWorthScroll}
        >
          {top50.map((wealthyUser, index) => (
            <Pressable
              key={wealthyUser.id}
              style={styles.netWorthItem}
              onPress={() => handleWealthyUserPress(wealthyUser.id)}
              testID={`wealthy-user-${wealthyUser.id}`}
            >
              <View style={styles.netWorthAvatarContainer}>
                <LinearGradient
                  colors={index < 3 ? ['#FFD700', '#FFA500'] : Gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.netWorthAvatarRing}
                >
                  <View style={[styles.netWorthAvatarInner, { backgroundColor: theme.backgroundRoot }]}>
                    <Avatar uri={wealthyUser.avatarUrl} size={48} />
                  </View>
                </LinearGradient>
                {index < 3 ? (
                  <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
                    <ThemedText style={styles.rankText}>{index + 1}</ThemedText>
                  </View>
                ) : null}
              </View>
              <ThemedText style={styles.netWorthName} numberOfLines={1}>
                {wealthyUser.displayName.split(' ')[0]}
              </ThemedText>
              <ThemedText style={[styles.netWorthValue, { color: theme.success }]}>
                {formatNetWorth(wealthyUser.netWorth)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <GradientBackground variant="subtle">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {renderNetWorthCarousel()}
        <View style={[styles.tabBar, { paddingTop: top50 && top50.length > 0 ? Spacing.sm : headerHeight + Spacing.sm }]}>
          {(["PRIMARY", "GENERAL", "REQUESTS"] as TabType[]).map((tab) => {
          const labels: Record<TabType, string> = {
            PRIMARY: "Primary",
            GENERAL: "General",
            REQUESTS: "Requests",
          };
          const isActive = activeTab === tab;
          const count = tab === "REQUESTS" ? (requests?.length || 0) : 0;

          return (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                isActive && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  { color: isActive ? theme.primary : theme.textSecondary },
                ]}
              >
                {labels[tab]}
                {count > 0 && (
                  <ThemedText style={{ color: theme.primary }}> ({count})</ThemedText>
                )}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.searchContainer, { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <GlassInput
          placeholder="Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          rightIcon={searchQuery.length > 0 ? "x" : undefined}
          onRightIconPress={() => setSearchQuery("")}
          containerStyle={styles.searchInput}
        />
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Spacing.md,
          paddingBottom: tabBarHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: tabBarHeight }}
        data={getActiveData()}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === "REQUESTS" ? renderRequestItem : ({ item }) => (
          <ConversationCard
            conversation={item}
            currentUserId={user?.id || ""}
            onPress={() => handleConversationPress(item)}
            onAvatarPress={handleUserProfilePress}
          />
        )}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={true}
        />
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.semiBold || "System",
      },
      android: {
        fontFamily: Fonts?.semiBold,
        fontWeight: "600" as const,
      },
      default: {
        fontWeight: "600" as const,
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  requestCard: {
    borderRadius: 16,
    padding: Spacing.md,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
  },
  requestText: {
    flex: 1,
  },
  requestTextPress: {
    flex: 1,
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  declineButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    letterSpacing: 0,
    ...Platform.select({
      ios: {
        fontFamily: Fonts?.semiBold || "System",
      },
      android: {
        fontFamily: Fonts?.semiBold,
        fontWeight: "600" as const,
      },
      default: {
        fontWeight: "600" as const,
      },
    }),
  },
  searchContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.1)",
  },
  searchInput: {
    marginBottom: 0,
  },
  netWorthCarouselContainer: {
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.1)",
  },
  netWorthHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  netWorthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  netWorthBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  netWorthScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  netWorthItem: {
    alignItems: "center",
    width: 68,
  },
  netWorthAvatarContainer: {
    marginBottom: 4,
    position: "relative",
  },
  netWorthAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  netWorthAvatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  rankText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "700" as const,
  },
  netWorthName: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 2,
  },
  netWorthValue: {
    fontSize: 10,
    fontWeight: "600" as const,
    textAlign: "center",
  },
});
