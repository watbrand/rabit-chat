import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { LoadingIndicator, InlineLoader } from "@/components/animations";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileGridTile } from "./ProfileGridTile";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type TabType = "ALL" | "VIDEO" | "PHOTO" | "VOICE" | "TEXT" | "PINNED" | "SWIPE";

interface TabInfo {
  key: TabType;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const TABS: TabInfo[] = [
  { key: "ALL", label: "Posts", icon: "grid" },
  { key: "VIDEO", label: "Videos", icon: "video" },
  { key: "PHOTO", label: "Photos", icon: "image" },
  { key: "VOICE", label: "Voice", icon: "mic" },
  { key: "TEXT", label: "Text", icon: "align-left" },
  { key: "SWIPE", label: "Swipe", icon: "play-circle" },
];

interface GridPost {
  id: string;
  type: string;
  thumbnailUrl: string | null;
  durationMs: number | null;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  isPinned?: boolean;
}

interface ProfileTabsProps {
  posts: GridPost[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onTabChange: (tab: TabType) => void;
  onPostPress: (postId: string) => void;
  onSwipePress: () => void;
  activeTab: TabType;
}

export function ProfileTabs({
  posts,
  isLoading,
  hasMore,
  onLoadMore,
  onTabChange,
  onPostPress,
  onSwipePress,
  activeTab,
}: ProfileTabsProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const numColumns = width < 500 ? 2 : 4;

  const handleTabPress = (tab: TabType) => {
    if (tab === "SWIPE") {
      onSwipePress();
    } else {
      onTabChange(tab);
    }
  };

  const renderItem = ({ item }: { item: GridPost }) => (
    <View style={{ width: `${100 / numColumns}%` }}>
      <ProfileGridTile
        id={item.id}
        type={item.type}
        thumbnailUrl={item.thumbnailUrl}
        durationMs={item.durationMs}
        likesCount={item.likesCount}
        viewsCount={item.viewsCount}
        isPinned={item.isPinned}
        onPress={() => onPostPress(item.id)}
      />
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <InlineLoader size={24} />
      </View>
    );
  };

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
        <Feather name="inbox" size={48} color={theme.textSecondary} />
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          No posts yet
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { borderBottomColor: theme.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                isActive && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => handleTabPress(tab.key)}
              testID={`tab-${tab.key.toLowerCase()}`}
            >
              <Feather
                name={tab.icon}
                size={18}
                color={isActive ? theme.primary : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.primary : theme.textSecondary },
                ]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeTab !== "SWIPE" && (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={`grid-${numColumns}`}
          contentContainerStyle={styles.gridContent}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          scrollEnabled={false}
          nestedScrollEnabled
          scrollIndicatorInsets={{ bottom: insets.bottom }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsScroll: {
    borderBottomWidth: 1,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: -1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  gridContent: {
    paddingVertical: Spacing.xs,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: Spacing["5xl"],
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
});
