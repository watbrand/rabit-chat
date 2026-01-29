import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { HeaderButton } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type HelpArticleScreenRouteProp = RouteProp<RootStackParamList, "HelpArticleDetail">;

interface ArticleStep {
  stepNumber: number;
  title: string;
  content: string;
  imageUrl?: string | null;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  difficulty: string | null;
  estimated_read_time: number | null;
}

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  difficulty: string | null;
  has_walkthrough: boolean;
  has_video: boolean;
  video_url: string | null;
  thumbnail_url: string | null;
  estimated_read_time: number | null;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  tags: string[] | null;
  published_at: string | null;
  steps?: ArticleStep[];
  relatedArticles?: RelatedArticle[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  isBookmarked?: boolean;
  userFeedback?: "helpful" | "not_helpful" | null;
}

export default function HelpArticleScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<HelpArticleScreenRouteProp>();
  const queryClient = useQueryClient();
  const { articleId } = route.params;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"helpful" | "not_helpful" | null>(null);

  const { data: articleResponse, isLoading, refetch } = useQuery<{ article: HelpArticle }>({
    queryKey: [`/api/help/articles/${articleId}`],
  });
  
  const article = articleResponse?.article;

  React.useEffect(() => {
    if (article) {
      setFeedbackGiven(article.userFeedback || null);
      navigation.setOptions({
        headerTitle: article.title,
        headerRight: () => (
          <HeaderButton
            onPress={handleBookmarkToggle}
            testID="button-bookmark-article"
          >
            <Feather
              name={article.isBookmarked ? "bookmark" : "bookmark"}
              size={22}
              color={article.isBookmarked ? theme.primary : theme.textSecondary}
            />
          </HeaderButton>
        ),
      });
    }
  }, [article, navigation, theme]);

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/help/articles/${articleId}/bookmark`, {});
      return res.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: [`/api/help/articles/${articleId}`] });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (isHelpful: boolean) => {
      const res = await apiRequest("POST", `/api/help/articles/${articleId}/feedback`, { isHelpful });
      return res.json();
    },
    onSuccess: (_, isHelpful) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedbackGiven(isHelpful ? "helpful" : "not_helpful");
    },
  });

  const handleBookmarkToggle = useCallback(() => {
    bookmarkMutation.mutate();
  }, [bookmarkMutation]);

  const handleFeedback = useCallback((isHelpful: boolean) => {
    if (feedbackGiven) return;
    feedbackMutation.mutate(isHelpful);
  }, [feedbackGiven, feedbackMutation]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleRelatedArticlePress = useCallback((relatedArticle: RelatedArticle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.push("HelpArticleDetail", { articleId: relatedArticle.id });
  }, [navigation]);

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "BEGINNER":
        return theme.success;
      case "INTERMEDIATE":
        return theme.warning;
      case "ADVANCED":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="file-text" size={48} color={theme.textTertiary} />
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Article not found
        </ThemedText>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
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
        <View style={styles.metaRow}>
          {article.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: theme.primary + "15" }]}>
              <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
                {article.category.name}
              </ThemedText>
            </View>
          ) : null}
          {article.difficulty ? (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(article.difficulty) + "15" }]}>
              <ThemedText style={[styles.difficultyText, { color: getDifficultyColor(article.difficulty) }]}>
                {article.difficulty.charAt(0) + article.difficulty.slice(1).toLowerCase()}
              </ThemedText>
            </View>
          ) : null}
          {article.estimated_read_time ? (
            <View style={styles.readTimeContainer}>
              <Feather name="clock" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.readTimeText, { color: theme.textSecondary }]}>
                {article.estimated_read_time} min read
              </ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText type="title1" style={styles.title}>
          {article.title}
        </ThemedText>

        {article.summary ? (
          <ThemedText style={[styles.summary, { color: theme.textSecondary }]}>
            {article.summary}
          </ThemedText>
        ) : null}

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.contentContainer}>
          <ThemedText style={styles.content}>
            {article.content}
          </ThemedText>
        </View>

        {article.has_walkthrough && article.steps && article.steps.length > 0 ? (
          <View style={styles.walkthroughSection}>
            <ThemedText type="title3" style={styles.sectionTitle}>
              Step-by-Step Guide
            </ThemedText>
            {article.steps.map((step, index) => (
              <Animated.View
                key={step.stepNumber}
                entering={FadeInDown.delay(index * 100).duration(300)}
                style={[
                  styles.stepCard,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                  },
                ]}
              >
                <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.stepNumberText}>
                    {step.stepNumber}
                  </ThemedText>
                </View>
                <View style={styles.stepContent}>
                  <ThemedText type="headline" style={styles.stepTitle}>
                    {step.title}
                  </ThemedText>
                  <ThemedText style={[styles.stepText, { color: theme.textSecondary }]}>
                    {step.content}
                  </ThemedText>
                </View>
              </Animated.View>
            ))}
          </View>
        ) : null}

        {article.tags && article.tags.length > 0 ? (
          <View style={styles.tagsSection}>
            <ThemedText style={[styles.tagsLabel, { color: theme.textSecondary }]}>
              Tags
            </ThemedText>
            <View style={styles.tagsContainer}>
              {article.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tagPill, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText style={[styles.tagText, { color: theme.textSecondary }]}>
                    {tag}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: theme.glassBackground,
              borderColor: theme.glassBorder,
            },
          ]}
        >
          <ThemedText type="headline" style={styles.feedbackTitle}>
            Was this article helpful?
          </ThemedText>
          <View style={styles.feedbackButtons}>
            <Pressable
              testID="button-feedback-helpful"
              style={[
                styles.feedbackButton,
                {
                  backgroundColor: feedbackGiven === "helpful" ? theme.success + "20" : theme.backgroundSecondary,
                  borderColor: feedbackGiven === "helpful" ? theme.success : theme.border,
                },
              ]}
              onPress={() => handleFeedback(true)}
              disabled={!!feedbackGiven}
            >
              <Feather
                name="thumbs-up"
                size={20}
                color={feedbackGiven === "helpful" ? theme.success : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.feedbackButtonText,
                  { color: feedbackGiven === "helpful" ? theme.success : theme.text },
                ]}
              >
                Yes
              </ThemedText>
            </Pressable>
            <Pressable
              testID="button-feedback-not-helpful"
              style={[
                styles.feedbackButton,
                {
                  backgroundColor: feedbackGiven === "not_helpful" ? theme.error + "20" : theme.backgroundSecondary,
                  borderColor: feedbackGiven === "not_helpful" ? theme.error : theme.border,
                },
              ]}
              onPress={() => handleFeedback(false)}
              disabled={!!feedbackGiven}
            >
              <Feather
                name="thumbs-down"
                size={20}
                color={feedbackGiven === "not_helpful" ? theme.error : theme.textSecondary}
              />
              <ThemedText
                style={[
                  styles.feedbackButtonText,
                  { color: feedbackGiven === "not_helpful" ? theme.error : theme.text },
                ]}
              >
                No
              </ThemedText>
            </Pressable>
          </View>
          {feedbackGiven ? (
            <ThemedText style={[styles.feedbackThanks, { color: theme.textSecondary }]}>
              Thanks for your feedback!
            </ThemedText>
          ) : null}
        </View>

        {article.relatedArticles && article.relatedArticles.length > 0 ? (
          <View style={styles.relatedSection}>
            <ThemedText type="title3" style={styles.sectionTitle}>
              Related Articles
            </ThemedText>
            {article.relatedArticles.map((related, index) => (
              <Pressable
                key={related.id}
                testID={`related-article-${related.id}`}
                style={[
                  styles.relatedCard,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                  },
                ]}
                onPress={() => handleRelatedArticlePress(related)}
              >
                <View style={styles.relatedContent}>
                  <ThemedText type="headline" style={styles.relatedTitle} numberOfLines={2}>
                    {related.title}
                  </ThemedText>
                  {related.summary ? (
                    <ThemedText
                      style={[styles.relatedSummary, { color: theme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {related.summary}
                    </ThemedText>
                  ) : null}
                  <View style={styles.relatedMeta}>
                    {related.difficulty ? (
                      <View style={[styles.miniDifficultyBadge, { backgroundColor: getDifficultyColor(related.difficulty) + "15" }]}>
                        <ThemedText style={[styles.miniDifficultyText, { color: getDifficultyColor(related.difficulty) }]}>
                          {related.difficulty.charAt(0) + related.difficulty.slice(1).toLowerCase()}
                        </ThemedText>
                      </View>
                    ) : null}
                    {related.estimated_read_time ? (
                      <ThemedText style={[styles.relatedReadTime, { color: theme.textTertiary }]}>
                        {related.estimated_read_time} min
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  readTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readTimeText: {
    fontSize: 12,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  contentContainer: {
    marginBottom: Spacing.xl,
  },
  content: {
    fontSize: 16,
    lineHeight: 26,
  },
  walkthroughSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  stepCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    marginBottom: Spacing.xs,
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagsSection: {
    marginBottom: Spacing.xl,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tagPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 12,
  },
  feedbackCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  feedbackTitle: {
    marginBottom: Spacing.md,
  },
  feedbackButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  feedbackThanks: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  relatedSection: {
    marginBottom: Spacing.xl,
  },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    marginBottom: Spacing.xs,
  },
  relatedSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  relatedMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  miniDifficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniDifficultyText: {
    fontSize: 10,
    fontWeight: "600",
  },
  relatedReadTime: {
    fontSize: 11,
  },
});
