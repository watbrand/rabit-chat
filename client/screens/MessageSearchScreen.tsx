import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import debounce from "lodash.debounce";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { LoadingIndicator } from "@/components/animations";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type MessageSearchScreenRouteProp = RouteProp<RootStackParamList, "MessageSearch">;

interface SearchResult {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
}

export default function MessageSearchScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<MessageSearchScreenRouteProp>();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { conversationId } = route.params;

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

  const clearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
  };

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: [`/api/conversations/${conversationId}/search`, debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const url = new URL(`/api/conversations/${conversationId}/search`, getApiUrl());
      url.searchParams.set("q", debouncedQuery);
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleResultPress = (messageId: string) => {
    navigation.navigate("Chat", {
      conversationId,
      otherUserId: route.params.otherUserId || "",
      otherUserName: route.params.otherUserName || "",
      scrollToMessageId: messageId,
    });
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const parts: { text: string; highlighted: boolean }[] = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerQuery);

    while (index !== -1) {
      if (index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, index), highlighted: false });
      }
      parts.push({ text: text.slice(index, index + query.length), highlighted: true });
      lastIndex = index + query.length;
      index = lowerText.indexOf(lowerQuery, lastIndex);
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlighted: false });
    }

    return parts;
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    const highlightedParts = highlightMatch(item.content, debouncedQuery);
    const truncatedContent = item.content.length > 100 
      ? item.content.slice(0, 100) + "..." 
      : item.content;

    return (
      <Pressable
        style={[
          styles.resultCard,
          { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
        ]}
        onPress={() => handleResultPress(item.id)}
        testID={`result-message-${item.id}`}
      >
        <Avatar uri={item.sender.avatarUrl} size={44} />
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <ThemedText style={styles.senderName} numberOfLines={1}>
              {item.sender.displayName}
            </ThemedText>
            <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatTimestamp(item.createdAt)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.messagePreview, { color: theme.textSecondary }]} numberOfLines={2}>
            {typeof highlightedParts === "string" ? (
              truncatedContent
            ) : (
              highlightedParts.map((part, index) =>
                part.highlighted ? (
                  <ThemedText
                    key={index}
                    style={[styles.highlightedText, { backgroundColor: theme.primaryLight + "40" }]}
                  >
                    {part.text}
                  </ThemedText>
                ) : (
                  <ThemedText key={index}>{part.text}</ThemedText>
                )
              )
            )}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    );
  };

  const renderEmpty = () => {
    if (isLoading && debouncedQuery.length >= 2) {
      return (
        <View style={styles.emptyContainer}>
          <LoadingIndicator size="large" />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Searching messages...
          </ThemedText>
        </View>
      );
    }

    if (debouncedQuery.length < 2) {
      return (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            Search Messages
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Enter at least 2 characters to search
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Feather name="inbox" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
          No messages found
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
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search in conversation..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-message-search"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={clearSearch} testID="button-clear-search">
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={results || []}
          keyExtractor={(item) => item.id}
          renderItem={renderResult}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
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
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  resultContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  senderName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
  },
  messagePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  highlightedText: {
    fontWeight: "600",
    borderRadius: 2,
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
