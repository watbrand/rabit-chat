import React, { useCallback, useState, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { EmptyState, LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";

const DEVICE_ID_KEY = "@gossip_device_id";
const REFRESH_THROTTLE_MS = 2000;

interface GossipDMConversation {
  id: string;
  participant1Alias: string;
  participant2Alias: string;
  postSnippet: string;
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
  myAlias: string;
  theirAlias: string;
}

function ConversationCard({
  conversation,
  onPress,
  index,
}: {
  conversation: GossipDMConversation;
  onPress: () => void;
  index: number;
}) {
  const { theme } = useTheme();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).springify()}>
      <Pressable
        style={[
          styles.conversationCard,
          { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
        ]}
        onPress={onPress}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.anonymousAvatar, { backgroundColor: theme.backgroundTertiary }]}>
            <Feather name="user" size={20} color={theme.textSecondary} />
          </View>
          {conversation.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadBadgeText}>
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.headerRow}>
            <ThemedText style={styles.aliasText} numberOfLines={1}>
              {conversation.theirAlias}
            </ThemedText>
            <ThemedText style={[styles.timeText, { color: theme.textTertiary }]}>
              {formatTimeAgo(conversation.lastMessageAt)}
            </ThemedText>
          </View>

          <ThemedText
            style={[
              styles.lastMessage,
              { color: conversation.unreadCount > 0 ? theme.text : theme.textSecondary },
              conversation.unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={2}
          >
            {conversation.lastMessage || "Started a conversation about this post..."}
          </ThemedText>

          <View style={styles.postSnippetRow}>
            <Feather name="corner-up-left" size={10} color={theme.textTertiary} />
            <ThemedText style={[styles.postSnippet, { color: theme.textTertiary }]} numberOfLines={1}>
              {conversation.postSnippet}
            </ThemedText>
          </View>
        </View>

        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

export function GossipDMList() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshRef = useRef<number>(0);

  React.useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      }
      setDeviceId(id);
    };
    loadOrCreateDeviceId();
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/gossip/v2/dm/conversations", deviceId],
    queryFn: async () => {
      if (!deviceId) return { conversations: [] };
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/dm/conversations`, {
        headers: { "x-device-id": deviceId },
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      return response.json();
    },
    enabled: !!deviceId,
    staleTime: 30000,
  });

  const conversations = data?.conversations || [];

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase().trim();
    return conversations.filter((conv: GossipDMConversation) =>
      conv.theirAlias.toLowerCase().includes(query) ||
      conv.postSnippet.toLowerCase().includes(query) ||
      (conv.lastMessage && conv.lastMessage.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) {
      return;
    }
    lastRefreshRef.current = now;
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleConversationPress = useCallback((conversation: GossipDMConversation) => {
    navigation.navigate("GossipDMChat", {
      conversationId: conversation.id,
      theirAlias: conversation.theirAlias,
    });
  }, [navigation]);

  const renderConversation = useCallback(({ item, index }: { item: GossipDMConversation; index: number }) => (
    <ConversationCard
      conversation={item}
      onPress={() => handleConversationPress(item)}
      index={index}
    />
  ), [handleConversationPress]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <EmptyState type="messages" message="No anonymous conversations yet" />
      <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
        Start a DM from any gossip post to chat anonymously
      </ThemedText>
    </View>
  ), [theme]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  const renderSearchEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Feather name="search" size={48} color={theme.textTertiary} />
      <ThemedText style={[styles.emptyHint, { color: theme.textSecondary, marginTop: Spacing.md }]}>
        No conversations match your search
      </ThemedText>
    </View>
  ), [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Anonymous DMs</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Your identity stays hidden
        </ThemedText>
      </View>

      <View style={[styles.searchContainer, { borderColor: theme.glassBorder }]}>
        <View style={[styles.searchInputWrapper, { backgroundColor: theme.glassBackground }]}>
          <Feather name="search" size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search conversations..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <Feather name="x" size={18} color={theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing["3xl"] },
          filteredConversations.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={searchQuery.trim() ? renderSearchEmpty : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={true}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: Spacing["3xl"],
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  anonymousAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  conversationContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  aliasText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: "500",
  },
  postSnippetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postSnippet: {
    fontSize: 11,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.lg,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});
