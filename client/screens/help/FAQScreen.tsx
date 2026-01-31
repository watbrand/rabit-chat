import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  RefreshControl,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  FadeIn,
  FadeInDown,
  Layout,
} from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string | null;
  category_name: string | null;
  sort_order: number;
  is_featured: boolean;
}

interface FAQCategory {
  name: string;
  faqs: FAQ[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FAQItem({ faq, isExpanded, onToggle }: { faq: FAQ; isExpanded: boolean; onToggle: () => void }) {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);
  const height = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withSpring(isExpanded ? 180 : 0, { damping: 15, stiffness: 200 });
    height.value = withTiming(isExpanded ? 1 : 0, { duration: 250 });
  }, [isExpanded]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: height.value,
    maxHeight: height.value * 500,
  }));

  return (
    <Pressable
      testID={`faq-item-${faq.id}`}
      style={[
        styles.faqItem,
        {
          backgroundColor: theme.glassBackground,
          borderColor: isExpanded ? theme.primary : theme.glassBorder,
        },
      ]}
      onPress={onToggle}
    >
      <View style={styles.faqHeader}>
        <ThemedText type="headline" style={styles.faqQuestion}>
          {faq.question}
        </ThemedText>
        <Animated.View style={iconStyle}>
          <Feather name="chevron-down" size={20} color={theme.primary} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.faqAnswerContainer, contentStyle]}>
        {isExpanded ? (
          <View style={[styles.faqAnswerInner, { borderTopColor: theme.border }]}>
            <ThemedText style={[styles.faqAnswer, { color: theme.textSecondary }]}>
              {faq.answer}
            </ThemedText>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: faqsResponse, isLoading, isError, error: faqsError, refetch } = useQuery<{ faqs: FAQ[] }>({
    queryKey: ["/api/help/faqs"],
  });
  
  const faqs = faqsResponse?.faqs || [];
  
  const filteredFaqs = useMemo(() => {
    if (!faqs) return [];
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
    );
  }, [faqs, searchQuery]);

  const groupedFaqs = useMemo(() => {
    const groups: FAQCategory[] = [];
    const categoryMap = new Map<string, FAQ[]>();

    filteredFaqs.forEach((faq) => {
      const categoryName = faq.category_name || "General";
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)!.push(faq);
    });

    categoryMap.forEach((faqList, name) => {
      groups.push({
        name,
        faqs: faqList.sort((a, b) => a.sort_order - b.sort_order),
      });
    });

    return groups.sort((a, b) => {
      if (a.name === "General") return 1;
      if (b.name === "General") return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredFaqs]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleToggle = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading FAQs...
        </ThemedText>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={theme.error} />
        <ThemedText style={[styles.errorTitle, { color: theme.text }]}>
          Failed to Load FAQs
        </ThemedText>
        <ThemedText style={[styles.errorMessage, { color: theme.textSecondary }]}>
          {String(faqsError) || "Please check your connection and try again."}
        </ThemedText>
        <Pressable 
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => refetch()}
        >
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </Pressable>
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
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.glassBackground,
              borderColor: isSearchFocused ? theme.primary : theme.glassBorder,
            },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            testID="input-faq-search"
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search FAQs..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable testID="button-clear-search" onPress={handleClearSearch}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="help-circle" size={48} color={theme.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? "No FAQs match your search" : "No FAQs available"}
            </ThemedText>
          </View>
        ) : (
          groupedFaqs.map((category, categoryIndex) => (
            <Animated.View
              key={category.name}
              entering={FadeInDown.delay(categoryIndex * 50).duration(300)}
              layout={Layout.springify()}
              style={styles.categorySection}
            >
              <ThemedText type="headline" style={[styles.categoryTitle, { color: theme.textSecondary }]}>
                {category.name}
              </ThemedText>
              {category.faqs.map((faq, index) => (
                <Animated.View
                  key={faq.id}
                  entering={FadeInDown.delay((categoryIndex * 50) + (index * 30)).duration(300)}
                  layout={Layout.springify()}
                >
                  <FAQItem
                    faq={faq}
                    isExpanded={expandedId === faq.id}
                    onToggle={() => handleToggle(faq.id)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          ))
        )}

        {searchQuery && filteredFaqs.length > 0 ? (
          <ThemedText style={[styles.resultCount, { color: theme.textTertiary }]}>
            {filteredFaqs.length} result{filteredFaqs.length !== 1 ? "s" : ""} found
          </ThemedText>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  faqItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
  },
  faqAnswerContainer: {
    overflow: "hidden",
  },
  faqAnswerInner: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    marginTop: -1,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    paddingTop: Spacing.md,
  },
  resultCount: {
    fontSize: 13,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
  errorTitle: {
    marginTop: Spacing.lg,
    fontSize: 18,
    fontWeight: "600",
  },
  errorMessage: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  retryButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
