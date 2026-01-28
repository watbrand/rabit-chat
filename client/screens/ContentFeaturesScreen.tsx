import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  RefreshControl,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Thread {
  id: string;
  userId: string;
  title: string;
  postCount: number;
  createdAt: string;
  user?: {
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

interface DuetPost {
  id: string;
  originalPostId: string;
  userId: string;
  layoutType: string;
  createdAt: string;
  originalPost?: {
    id: string;
    content: string;
    mediaUrl?: string;
    user?: {
      displayName: string;
      username: string;
    };
  };
}

interface ARFilter {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: string;
  isActive: boolean;
  usageCount: number;
}

const FILTER_CATEGORIES = [
  { id: "face", label: "Face Effects", icon: "smile" },
  { id: "background", label: "Backgrounds", icon: "image" },
  { id: "overlay", label: "Overlays", icon: "layers" },
  { id: "beauty", label: "Beauty", icon: "star" },
  { id: "fun", label: "Fun", icon: "zap" },
];

const DUET_LAYOUTS = [
  { id: "side_by_side", label: "Side by Side", icon: "columns" },
  { id: "top_bottom", label: "Top & Bottom", icon: "align-justify" },
  { id: "picture_in_picture", label: "Picture in Picture", icon: "maximize-2" },
  { id: "green_screen", label: "Green Screen", icon: "monitor" },
];

export function ContentFeaturesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"threads" | "duets" | "filters">("threads");
  const [refreshing, setRefreshing] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("face");

  const { data: threads, isLoading: loadingThreads } = useQuery<Thread[]>({
    queryKey: ["/api/threads"],
    enabled: !!user,
  });

  const { data: duets, isLoading: loadingDuets } = useQuery<DuetPost[]>({
    queryKey: ["/api/duets"],
    enabled: !!user,
  });

  const { data: arFilters, isLoading: loadingFilters } = useQuery<ARFilter[]>({
    queryKey: ["/api/ar-filters"],
    enabled: true,
  });

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/threads", { title: threadTitle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thread Created", "Start adding posts to your thread!");
      setThreadTitle("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create thread");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/duets"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/ar-filters"] }),
    ]);
    setRefreshing(false);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return "Today";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const renderThreadsTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="list" size={24} color={theme.primary} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Post Threads</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Create connected posts that tell a story or share related content
          </ThemedText>
        </View>
      </Card>

      <View style={styles.createRow}>
        <TextInput
          style={[
            styles.threadInput,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, color: theme.text },
          ]}
          placeholder="Thread title..."
          placeholderTextColor={theme.textSecondary}
          value={threadTitle}
          onChangeText={setThreadTitle}
        />
        <Pressable
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={() => createThreadMutation.mutate()}
          disabled={!threadTitle.trim() || createThreadMutation.isPending}
        >
          {createThreadMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="plus" size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
        Your Threads ({threads?.length || 0})
      </ThemedText>

      {loadingThreads ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : threads && threads.length > 0 ? (
        threads.map((thread, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={thread.id}>
            <Card style={styles.threadCard}>
              <View style={[styles.threadIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="message-circle" size={20} color={theme.primary} />
              </View>
              <View style={styles.threadInfo}>
                <ThemedText style={[styles.threadTitle, { color: theme.text }]}>{thread.title}</ThemedText>
                <ThemedText style={[styles.threadMeta, { color: theme.textSecondary }]}>
                  {thread.postCount} posts · {formatTime(thread.createdAt)}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="list" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Threads</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Create a thread to share connected posts
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderDuetsTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="copy" size={24} color={theme.pink} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Duet & Stitch</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            React to other videos with your own content side-by-side
          </ThemedText>
        </View>
      </Card>

      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Layout Options</ThemedText>
      <View style={styles.layoutsGrid}>
        {DUET_LAYOUTS.map((layout) => (
          <Card key={layout.id} style={styles.layoutCard}>
            <View style={[styles.layoutIcon, { backgroundColor: theme.pink + "20" }]}>
              <Feather name={layout.icon as any} size={24} color={theme.pink} />
            </View>
            <ThemedText style={[styles.layoutLabel, { color: theme.text }]}>{layout.label}</ThemedText>
          </Card>
        ))}
      </View>

      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
        Your Duets ({duets?.length || 0})
      </ThemedText>

      {loadingDuets ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : duets && duets.length > 0 ? (
        duets.map((duet, index) => (
          <Animated.View entering={FadeInUp.delay(50 * index)} key={duet.id}>
            <Card style={styles.duetCard}>
              <View style={styles.duetContent}>
                <ThemedText style={[styles.duetType, { color: theme.pink }]}>
                  {duet.layoutType.replace("_", " ")}
                </ThemedText>
                <ThemedText style={[styles.duetOriginal, { color: theme.textSecondary }]}>
                  Original by @{duet.originalPost?.user?.username}
                </ThemedText>
              </View>
              <ThemedText style={[styles.duetTime, { color: theme.textSecondary }]}>
                {formatTime(duet.createdAt)}
              </ThemedText>
            </Card>
          </Animated.View>
        ))
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="copy" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Duets</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Create a duet from any video post
          </ThemedText>
        </Card>
      )}
    </View>
  );

  const renderFiltersTab = () => (
    <View>
      <Card style={styles.infoCard}>
        <Feather name="aperture" size={24} color={theme.success} />
        <View style={styles.infoContent}>
          <ThemedText style={[styles.infoTitle, { color: theme.text }]}>AR Filters</ThemedText>
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Enhance your photos and videos with augmented reality effects
          </ThemedText>
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
        {FILTER_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === cat.id ? theme.primary : theme.glassBackground,
                borderColor: selectedCategory === cat.id ? theme.primary : theme.glassBorder,
              },
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Feather
              name={cat.icon as any}
              size={14}
              color={selectedCategory === cat.id ? "#FFFFFF" : theme.text}
            />
            <ThemedText
              style={[styles.categoryText, { color: selectedCategory === cat.id ? "#FFFFFF" : theme.text }]}
            >
              {cat.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {loadingFilters ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : arFilters && arFilters.length > 0 ? (
        <View style={styles.filtersGrid}>
          {arFilters
            .filter((f) => f.category === selectedCategory || selectedCategory === "all")
            .map((filter, index) => (
              <Animated.View entering={FadeInUp.delay(50 * index)} key={filter.id}>
                <Card style={styles.filterCard}>
                  <Image
                    source={{ uri: filter.previewUrl }}
                    style={styles.filterPreview}
                    contentFit="cover"
                  />
                  <View style={styles.filterInfo}>
                    <ThemedText style={[styles.filterName, { color: theme.text }]}>{filter.name}</ThemedText>
                    <ThemedText style={[styles.filterUsage, { color: theme.textSecondary }]}>
                      {filter.usageCount.toLocaleString()} uses
                    </ThemedText>
                  </View>
                </Card>
              </Animated.View>
            ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Feather name="aperture" size={48} color={theme.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Filters</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            AR filters will appear here
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
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "threads" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("threads")}
          >
            <Feather name="list" size={16} color={activeTab === "threads" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "threads" ? "#FFFFFF" : theme.textSecondary }]}>
              Threads
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "duets" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("duets")}
          >
            <Feather name="copy" size={16} color={activeTab === "duets" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "duets" ? "#FFFFFF" : theme.textSecondary }]}>
              Duets
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "filters" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("filters")}
          >
            <Feather name="aperture" size={16} color={activeTab === "filters" ? "#FFFFFF" : theme.textSecondary} />
            <ThemedText style={[styles.tabText, { color: activeTab === "filters" ? "#FFFFFF" : theme.textSecondary }]}>
              AR Filters
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "threads" && renderThreadsTab()}
        {activeTab === "duets" && renderDuetsTab()}
        {activeTab === "filters" && renderFiltersTab()}
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
  createRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  threadInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
  },
  createButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
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
  threadCard: { flexDirection: "row", alignItems: "center", padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  threadIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  threadInfo: { flex: 1 },
  threadTitle: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  threadMeta: { fontSize: 12, marginTop: 2 },
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
  layoutsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  layoutCard: { width: "48%", padding: Spacing.md, alignItems: "center" },
  layoutIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: Spacing.sm },
  layoutLabel: {
    fontSize: 12,
    textAlign: "center",
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  duetCard: { flexDirection: "row", alignItems: "center", padding: Spacing.md, marginBottom: Spacing.sm },
  duetContent: { flex: 1 },
  duetType: {
    fontSize: 13,
    textTransform: "capitalize",
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  duetOriginal: { fontSize: 12, marginTop: 2 },
  duetTime: { fontSize: 11 },
  categoriesRow: { marginBottom: Spacing.lg },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  categoryText: { fontSize: 12 },
  filtersGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  filterCard: { width: "48%", overflow: "hidden" },
  filterPreview: { width: "100%", height: 100 },
  filterInfo: { padding: Spacing.sm },
  filterName: {
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  filterUsage: { fontSize: 11, marginTop: 2 },
});
