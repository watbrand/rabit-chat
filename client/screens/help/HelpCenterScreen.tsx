import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  interpolateColor,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - CARD_GAP) / 2;

type HelpCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
};

type HelpArticle = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  difficulty: string | null;
  has_walkthrough: boolean;
  has_video: boolean;
  estimated_read_time: number | null;
  view_count: number;
  helpful_count: number;
  tags: string[] | null;
  published_at: string | null;
};

type SystemStatus = {
  status: "operational" | "degraded" | "outage";
  message: string;
  lastChecked: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HelpCenterScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery<HelpCategory[]>({
    queryKey: ["/api/help/categories"],
  });

  const { data: articlesResponse, isLoading: articlesLoading, refetch: refetchArticles } = useQuery<{ articles: HelpArticle[]; total: number }>({
    queryKey: ["/api/help/articles", { featured: true }],
  });
  
  const featuredArticles = articlesResponse?.articles || [];

  const { data: systemStatus, refetch: refetchStatus } = useQuery<SystemStatus>({
    queryKey: ["/api/help/status"],
  });

  const { data: searchResults, isFetching: isSearching } = useQuery<HelpArticle[]>({
    queryKey: ["/api/help/search", { query: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchCategories(), refetchArticles(), refetchStatus()]);
    setIsRefreshing(false);
  }, [refetchCategories, refetchArticles, refetchStatus]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.length > 0) {
      Haptics.selectionAsync();
      navigation.navigate("HelpSearch", { query: searchQuery });
    }
  }, [searchQuery, navigation]);

  const handleCategoryPress = useCallback((category: HelpCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("HelpCategory", { 
      categoryId: category.id, 
      categoryName: category.name 
    });
  }, [navigation]);

  const handleArticlePress = useCallback((article: HelpArticle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("HelpArticleDetail", { articleId: article.id });
  }, [navigation]);

  const handleQuickAction = useCallback((action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (action) {
      case "inbox":
        navigation.navigate("SupportInbox");
        break;
      case "faqs":
        navigation.navigate("FAQs");
        break;
      case "features":
        navigation.navigate("FeatureRequests");
        break;
      case "bug":
        navigation.navigate("ReportBug");
        break;
    }
  }, [navigation]);

  const handleSafetyPress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    navigation.navigate("SafetyCenter");
  }, [navigation]);

  const handleCommunityPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("CommunityQA");
  }, [navigation]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "operational":
        return theme.success;
      case "degraded":
        return theme.warning;
      case "outage":
        return theme.error;
      default:
        return theme.success;
    }
  };

  const getCategoryIcon = (icon: string | null): keyof typeof Feather.glyphMap => {
    const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
      "getting-started": "play-circle",
      "account": "user",
      "feed": "rss",
      "messaging": "message-circle",
      "privacy": "lock",
      "payments": "credit-card",
      "settings": "settings",
      "content": "image",
      "security": "shield",
      "notifications": "bell",
    };
    return iconMap[icon || ""] || "help-circle";
  };

  const QuickActionButton = ({ 
    icon, 
    label, 
    action, 
    testID 
  }: { 
    icon: keyof typeof Feather.glyphMap; 
    label: string; 
    action: string;
    testID: string;
  }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
      <AnimatedPressable
        testID={testID}
        style={[
          styles.quickActionButton,
          { 
            backgroundColor: theme.glassBackground, 
            borderColor: theme.glassBorder 
          },
          animatedStyle,
        ]}
        onPress={() => handleQuickAction(action)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.quickActionIconWrap, { backgroundColor: theme.primary + "20" }]}>
          <Feather name={icon} size={20} color={theme.primary} />
        </View>
        <ThemedText style={styles.quickActionLabel} numberOfLines={2}>
          {label}
        </ThemedText>
      </AnimatedPressable>
    );
  };

  const CategoryCard = ({ category, index }: { category: HelpCategory; index: number }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
        <AnimatedPressable
          testID={`category-${category.slug}`}
          style={[
            styles.categoryCard,
            { 
              backgroundColor: theme.glassBackground, 
              borderColor: theme.glassBorder,
              width: CARD_WIDTH,
            },
            animatedStyle,
          ]}
          onPress={() => handleCategoryPress(category)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View 
            style={[
              styles.categoryIconWrap, 
              { backgroundColor: (category.color || theme.primary) + "20" }
            ]}
          >
            <Feather 
              name={getCategoryIcon(category.icon)} 
              size={24} 
              color={category.color || theme.primary} 
            />
          </View>
          <ThemedText type="headline" style={styles.categoryName}>
            {category.name}
          </ThemedText>
          {category.description ? (
            <ThemedText 
              style={[styles.categoryDescription, { color: theme.textSecondary }]} 
              numberOfLines={2}
            >
              {category.description}
            </ThemedText>
          ) : null}
          <View style={styles.categoryArrow}>
            <Feather name="chevron-right" size={16} color={theme.textTertiary} />
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  };

  const ArticleCard = ({ article, index }: { article: HelpArticle; index: number }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
      <AnimatedPressable
        testID={`article-${article.id}`}
        style={[
          styles.articleCard,
          { 
            backgroundColor: theme.glassBackground, 
            borderColor: theme.glassBorder,
            marginLeft: index === 0 ? Spacing.lg : Spacing.sm,
          },
          animatedStyle,
        ]}
        onPress={() => handleArticlePress(article)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.articleHeader}>
          {article.has_video ? (
            <View style={[styles.articleBadge, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="play" size={12} color={theme.primary} />
              <ThemedText style={[styles.articleBadgeText, { color: theme.primary }]}>Video</ThemedText>
            </View>
          ) : article.has_walkthrough ? (
            <View style={[styles.articleBadge, { backgroundColor: theme.teal + "20" }]}>
              <Feather name="navigation" size={12} color={theme.teal} />
              <ThemedText style={[styles.articleBadgeText, { color: theme.teal }]}>Guide</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="headline" style={styles.articleTitle} numberOfLines={2}>
          {article.title}
        </ThemedText>
        {article.summary ? (
          <ThemedText 
            style={[styles.articleSummary, { color: theme.textSecondary }]} 
            numberOfLines={2}
          >
            {article.summary}
          </ThemedText>
        ) : null}
        <View style={styles.articleFooter}>
          {article.estimated_read_time ? (
            <View style={styles.articleMeta}>
              <Feather name="clock" size={12} color={theme.textTertiary} />
              <ThemedText style={[styles.articleMetaText, { color: theme.textTertiary }]}>
                {article.estimated_read_time} min
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.articleMeta}>
            <Feather name="thumbs-up" size={12} color={theme.textTertiary} />
            <ThemedText style={[styles.articleMetaText, { color: theme.textTertiary }]}>
              {article.helpful_count || 0}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
      }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.glassBackground,
                borderColor: isSearchFocused ? theme.primary : theme.glassBorder,
                ...(isSearchFocused && isDark ? Shadows.glow : {}),
              },
            ]}
          >
            <View style={[styles.searchIconWrap, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="search" size={18} color={theme.primary} />
            </View>
            <TextInput
              ref={searchInputRef}
              testID="search-input"
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Ask me anything..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchQuery.length > 0 ? (
              <Pressable 
                testID="clear-search-button"
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Feather name="x" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null}
            <View style={[styles.aiIndicator, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText style={[styles.aiText, { color: theme.primary }]}>AI</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.statusSection}>
          <Pressable
            testID="system-status-card"
            style={[
              styles.statusCard,
              { 
                backgroundColor: theme.glassBackground, 
                borderColor: theme.glassBorder 
              },
            ]}
          >
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: getStatusColor(systemStatus?.status) }
              ]} 
            />
            <View style={styles.statusContent}>
              <ThemedText type="headline">
                {systemStatus?.status === "operational" 
                  ? "All Systems Operational" 
                  : systemStatus?.message || "Checking status..."}
              </ThemedText>
              <ThemedText style={[styles.statusSubtext, { color: theme.textSecondary }]}>
                {systemStatus?.lastChecked 
                  ? `Last checked: ${new Date(systemStatus.lastChecked).toLocaleTimeString()}`
                  : "Monitoring system health"}
              </ThemedText>
            </View>
            <Feather name="activity" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.quickActionsSection}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Quick Actions
          </ThemedText>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="inbox"
              label="My Support Inbox"
              action="inbox"
              testID="quick-action-inbox"
            />
            <QuickActionButton
              icon="help-circle"
              label="FAQs"
              action="faqs"
              testID="quick-action-faqs"
            />
            <QuickActionButton
              icon="star"
              label="Feature Requests"
              action="features"
              testID="quick-action-features"
            />
            <QuickActionButton
              icon="alert-triangle"
              label="Report a Bug"
              action="bug"
              testID="quick-action-bug"
            />
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Browse Categories
          </ThemedText>
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={{ color: theme.textSecondary }}>Loading categories...</ThemedText>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {(categories || []).map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.articlesSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              Popular Articles
            </ThemedText>
            <Pressable 
              testID="see-all-articles-button"
              onPress={() => navigation.navigate("HelpArticles")}
            >
              <ThemedText style={[styles.seeAllLink, { color: theme.primary }]}>
                See All
              </ThemedText>
            </Pressable>
          </View>
          {articlesLoading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={{ color: theme.textSecondary }}>Loading articles...</ThemedText>
            </View>
          ) : (
            <FlatList
              data={featuredArticles.slice(0, 5)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: Spacing.lg }}
              renderItem={({ item, index }) => (
                <ArticleCard article={item} index={index} />
              )}
              ListEmptyComponent={
                <View style={[styles.emptyContainer, { marginLeft: Spacing.lg }]}>
                  <ThemedText style={{ color: theme.textSecondary }}>
                    No featured articles yet
                  </ThemedText>
                </View>
              }
            />
          )}
        </View>

        <View style={styles.communitySection}>
          <Pressable
            testID="community-help-card"
            style={[
              styles.communityCard,
              { 
                backgroundColor: theme.glassBackground, 
                borderColor: theme.glassBorder 
              },
            ]}
            onPress={handleCommunityPress}
          >
            <View style={[styles.communityIconWrap, { backgroundColor: theme.teal + "20" }]}>
              <Feather name="users" size={24} color={theme.teal} />
            </View>
            <View style={styles.communityContent}>
              <ThemedText type="headline">Community Help</ThemedText>
              <ThemedText style={[styles.communitySubtext, { color: theme.textSecondary }]}>
                Get answers from the RabitChat community
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.safetySection}>
          <Pressable
            testID="safety-sos-button"
            style={[
              styles.safetyCard,
              { 
                backgroundColor: theme.error + "15", 
                borderColor: theme.error + "40" 
              },
            ]}
            onPress={handleSafetyPress}
          >
            <View style={[styles.safetyIconWrap, { backgroundColor: theme.error + "30" }]}>
              <Feather name="alert-circle" size={24} color={theme.error} />
            </View>
            <View style={styles.safetyContent}>
              <ThemedText type="headline" style={{ color: theme.error }}>
                Safety & Emergency
              </ThemedText>
              <ThemedText style={[styles.safetySubtext, { color: theme.error + "CC" }]}>
                Report urgent safety issues or get immediate help
              </ThemedText>
            </View>
            <View style={[styles.sosButton, { backgroundColor: theme.error }]}>
              <ThemedText style={styles.sosText}>SOS</ThemedText>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  searchIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  aiIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  aiText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  quickActionsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  seeAllLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickActionButton: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  quickActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  categoriesSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  categoryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    minHeight: 120,
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  categoryName: {
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  categoryArrow: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },
  articlesSection: {
    marginBottom: Spacing.xl,
  },
  articleCard: {
    width: 260,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  articleHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    minHeight: 24,
  },
  articleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  articleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  articleTitle: {
    marginBottom: Spacing.xs,
  },
  articleSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  articleFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: "auto",
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  articleMetaText: {
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  communitySection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  communityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  communityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  communityContent: {
    flex: 1,
  },
  communitySubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  safetySection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  safetyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  safetyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  safetyContent: {
    flex: 1,
  },
  safetySubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  sosButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  sosText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
