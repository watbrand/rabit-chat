import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  RefreshControl,
  FlatList,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type HelpCategoryScreenRouteProp = RouteProp<RootStackParamList, "HelpCategory">;

interface HelpArticle {
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
  thumbnail_url: string | null;
  published_at: string | null;
  category_id: string;
  category_name: string;
  category_slug: string;
}

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  article_count?: number;
}

interface ArticlesResponse {
  articles: HelpArticle[];
  total: number;
  limit: number;
  offset: number;
}

interface SubcategoriesResponse {
  categories: HelpCategory[];
}

export default function HelpCategoryScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<HelpCategoryScreenRouteProp>();
  const { categoryId, categoryName } = route.params;

  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: categoryName || "Category",
    });
  }, [categoryName, navigation]);

  const { data: articlesResponse, isLoading: articlesLoading, refetch: refetchArticles } = useQuery<ArticlesResponse>({
    queryKey: [`/api/help/articles?categoryId=${categoryId}&limit=50`],
  });

  const { data: subcategoriesResponse, isLoading: subcategoriesLoading, refetch: refetchSubcategories } = useQuery<SubcategoriesResponse>({
    queryKey: [`/api/help/categories?parentId=${categoryId}`],
  });

  const articles = articlesResponse?.articles || [];
  const subcategories = subcategoriesResponse?.categories || [];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchArticles(), refetchSubcategories()]);
    setIsRefreshing(false);
  }, [refetchArticles, refetchSubcategories]);

  const handleArticlePress = useCallback((article: HelpArticle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("HelpArticleDetail", { articleId: article.id });
  }, [navigation]);

  const handleSubcategoryPress = useCallback((subcategory: HelpCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.push("HelpCategory", { 
      categoryId: subcategory.id, 
      categoryName: subcategory.name 
    });
  }, [navigation]);

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toUpperCase()) {
      case "BEGINNER": return "#10B981";
      case "INTERMEDIATE": return "#F59E0B";
      case "ADVANCED": return "#EF4444";
      default: return theme.textSecondary;
    }
  };

  const ArticleCard = ({ article, index }: { article: HelpArticle; index: number }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.98, { damping: 15 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15 });
    };

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).duration(400)}
        style={animatedStyle}
      >
        <Pressable
          style={[
            styles.articleCard,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            },
          ]}
          onPress={() => handleArticlePress(article)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          testID={`article-card-${article.slug}`}
        >
          <View style={styles.articleHeader}>
            <View style={styles.articleMeta}>
              {article.difficulty ? (
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(article.difficulty) + "20" }]}>
                  <ThemedText style={[styles.difficultyText, { color: getDifficultyColor(article.difficulty) }]}>
                    {article.difficulty}
                  </ThemedText>
                </View>
              ) : null}
              {article.has_video ? (
                <View style={[styles.videoBadge, { backgroundColor: theme.primary + "20" }]}>
                  <Feather name="play-circle" size={12} color={theme.primary} />
                  <ThemedText style={[styles.videoBadgeText, { color: theme.primary }]}>Video</ThemedText>
                </View>
              ) : null}
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </View>
          
          <ThemedText style={styles.articleTitle}>{article.title}</ThemedText>
          
          {article.summary ? (
            <ThemedText style={[styles.articleSummary, { color: theme.textSecondary }]} numberOfLines={2}>
              {article.summary}
            </ThemedText>
          ) : null}

          <View style={styles.articleFooter}>
            <View style={styles.articleStats}>
              {article.estimated_read_time ? (
                <View style={styles.statItem}>
                  <Feather name="clock" size={12} color={theme.textSecondary} />
                  <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
                    {article.estimated_read_time} min
                  </ThemedText>
                </View>
              ) : null}
              <View style={styles.statItem}>
                <Feather name="eye" size={12} color={theme.textSecondary} />
                <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
                  {article.view_count?.toLocaleString() || 0}
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <Feather name="thumbs-up" size={12} color={theme.textSecondary} />
                <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
                  {article.helpful_count?.toLocaleString() || 0}
                </ThemedText>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const SubcategoryCard = ({ subcategory, index }: { subcategory: HelpCategory; index: number }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.97, { damping: 15 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15 });
    };

    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 30).duration(300)}
        style={animatedStyle}
      >
        <Pressable
          style={[
            styles.subcategoryCard,
            {
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            },
          ]}
          onPress={() => handleSubcategoryPress(subcategory)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          testID={`subcategory-card-${subcategory.slug}`}
        >
          <View style={styles.subcategoryContent}>
            <View 
              style={[
                styles.subcategoryIcon, 
                { backgroundColor: (subcategory.color || theme.primary) + "20" }
              ]}
            >
              <Feather 
                name={(subcategory.icon || "folder") as any} 
                size={16} 
                color={subcategory.color || theme.primary} 
              />
            </View>
            <View style={styles.subcategoryText}>
              <ThemedText style={styles.subcategoryName}>{subcategory.name}</ThemedText>
              {subcategory.article_count !== undefined ? (
                <ThemedText style={[styles.subcategoryCount, { color: theme.textSecondary }]}>
                  {subcategory.article_count} articles
                </ThemedText>
              ) : null}
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textSecondary} />
        </Pressable>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {subcategories.length > 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.subcategoriesSection}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Subcategories
          </ThemedText>
          {subcategories.map((subcategory, index) => (
            <SubcategoryCard key={subcategory.id} subcategory={subcategory} index={index} />
          ))}
        </Animated.View>
      ) : null}

      {articles.length > 0 ? (
        <View style={styles.articlesHeader}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            {subcategories.length > 0 ? "Articles in this Category" : "Articles"}
          </ThemedText>
          <ThemedText style={[styles.articleCount, { color: theme.textSecondary }]}>
            {articles.length} {articles.length === 1 ? "article" : "articles"}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );

  const renderEmpty = () => {
    if (articlesLoading || subcategoriesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading content...
          </ThemedText>
        </View>
      );
    }

    if (articles.length === 0 && subcategories.length === 0) {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "15" }]}>
            <Feather name="file-text" size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Articles Yet</ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            We're working on adding helpful articles to this category. Check back soon!
          </ThemedText>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
            testID="button-go-back"
          >
            <Feather name="arrow-left" size={18} color="#fff" />
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </Pressable>
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ArticleCard article={item} index={index} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          { 
            paddingTop: headerHeight + Spacing.md,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            progressViewOffset={headerHeight}
          />
        }
        testID="category-articles-list"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  headerContent: {
    marginBottom: Spacing.md,
  },
  subcategoriesSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  subcategoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  subcategoryContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  subcategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  subcategoryText: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  subcategoryCount: {
    fontSize: 12,
  },
  articlesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  articleCount: {
    fontSize: 12,
  },
  articleCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  articleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  articleMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  videoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  videoBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  articleTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  articleSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  articleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  articleStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: Spacing.xl,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
