import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  FlatList,
  Platform,
  Switch,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface InterestCategory {
  slug: string;
  name: string;
  icon: string;
  color: string;
  gradient: string[];
}

interface UserInterest {
  interest: string;
  affinityScore: number;
  contentConsumed: number;
  lastUpdated: string;
}

interface AlgorithmPreferences {
  showNetWorthPriority: boolean;
  showVerifiedPriority: boolean;
  diversifyFeed: boolean;
  showCreatorContent: boolean;
}

export default function AlgorithmSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const queryClient = useQueryClient();

  const { data: interests, isLoading: isLoadingInterests } = useQuery<UserInterest[]>({
    queryKey: ["/api/me/interests"],
  });

  const { data: categories } = useQuery<InterestCategory[]>({
    queryKey: ["/api/interests/categories"],
  });

  const { data: preferences, isLoading: isLoadingPrefs } = useQuery<AlgorithmPreferences>({
    queryKey: ["/api/algorithm/preferences"],
    queryFn: async () => {
      try {
        const res = await fetch(new URL("/api/algorithm/preferences", getApiUrl()), {
          credentials: "include",
        });
        if (!res.ok) {
          return {
            showNetWorthPriority: true,
            showVerifiedPriority: true,
            diversifyFeed: true,
            showCreatorContent: true,
          };
        }
        return res.json();
      } catch (error) {
        return {
          showNetWorthPriority: true,
          showVerifiedPriority: true,
          diversifyFeed: true,
          showCreatorContent: true,
        };
      }
    },
  });

  const removeInterestMutation = useMutation({
    mutationFn: async (interest: string) => {
      return apiRequest("DELETE", `/api/me/interests/${interest}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/interests"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: any) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error", error.message || "Failed to remove interest. Please try again.");
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<AlgorithmPreferences>) => {
      return apiRequest("PATCH", "/api/algorithm/preferences", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/algorithm/preferences"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: any) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error", error.message || "Failed to update preferences. Please try again.");
    },
  });

  const handleTogglePreference = (key: keyof AlgorithmPreferences) => {
    if (!preferences) return;
    updatePreferencesMutation.mutate({ [key]: !preferences[key] });
  };

  const handleRemoveInterest = (interest: string, name: string) => {
    Alert.alert(
      "Remove Interest",
      `Remove "${name}" from your interests? This will affect your personalized feed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeInterestMutation.mutate(interest),
        },
      ]
    );
  };

  const getCategoryInfo = (slug: string): InterestCategory | undefined => {
    return categories?.find((c) => c.slug === slug);
  };

  const getAffinityColor = (score: number): string => {
    if (score >= 8) return "#22C55E";
    if (score >= 5) return "#EAB308";
    return "#EF4444";
  };

  const getAffinityLabel = (score: number): string => {
    if (score >= 8) return "High Match";
    if (score >= 5) return "Medium";
    return "Low";
  };

  const renderInterest = ({ item, index }: { item: UserInterest; index: number }) => {
    const category = getCategoryInfo(item.interest);
    const affinityColor = getAffinityColor(item.affinityScore);

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50).duration(400)}
        style={[
          styles.interestCard,
          {
            backgroundColor: theme.glassBackground,
            borderColor: theme.glassBorder,
          },
        ]}
      >
        <View style={styles.interestContent}>
          {category?.gradient ? (
            <LinearGradient
              colors={category.gradient as [string, string]}
              style={styles.interestIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ThemedText style={styles.iconEmoji}>{category.icon}</ThemedText>
            </LinearGradient>
          ) : (
            <View style={[styles.interestIcon, { backgroundColor: theme.primary + "30" }]}>
              <Feather name="star" size={18} color={theme.primary} />
            </View>
          )}
          <View style={styles.interestDetails}>
            <ThemedText style={styles.interestName}>
              {category?.name || item.interest}
            </ThemedText>
            <View style={styles.affinityRow}>
              <View
                style={[styles.affinityBadge, { backgroundColor: affinityColor + "20" }]}
              >
                <View style={[styles.affinityDot, { backgroundColor: affinityColor }]} />
                <ThemedText style={[styles.affinityText, { color: affinityColor }]}>
                  {getAffinityLabel(item.affinityScore)} ({item.affinityScore}/10)
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
        <Pressable
          onPress={() => handleRemoveInterest(item.interest, category?.name || item.interest)}
          style={({ pressed }) => [
            styles.removeButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="x" size={18} color={theme.error} />
        </Pressable>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[
          styles.infoCard,
          {
            backgroundColor: isDark ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.08)",
            borderColor: theme.primary + "40",
          },
        ]}
      >
        <View style={styles.infoIcon}>
          <Feather name="sliders" size={24} color={theme.primary} />
        </View>
        <View style={styles.infoContent}>
          <ThemedText style={styles.infoTitle}>Your Algorithm</ThemedText>
          <ThemedText style={[styles.infoDescription, { color: theme.textSecondary }]}>
            RabitChat personalizes your feed based on your interests and engagement.
            Your data is used to show you relevant content from the elite community.
          </ThemedText>
        </View>
      </Animated.View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          How It Works
        </ThemedText>
        <View
          style={[
            styles.explainerCard,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.explainerRow}>
            <View style={[styles.explainerIcon, { backgroundColor: "#22C55E20" }]}>
              <Feather name="heart" size={16} color="#22C55E" />
            </View>
            <ThemedText style={styles.explainerText}>
              Posts matching your interests get boosted in your feed
            </ThemedText>
          </View>
          <View style={styles.explainerRow}>
            <View style={[styles.explainerIcon, { backgroundColor: "#EAB30820" }]}>
              <Feather name="trending-up" size={16} color="#EAB308" />
            </View>
            <ThemedText style={styles.explainerText}>
              High-affinity topics appear more frequently
            </ThemedText>
          </View>
          <View style={styles.explainerRow}>
            <View style={[styles.explainerIcon, { backgroundColor: "#8B5CF620" }]}>
              <Feather name="users" size={16} color="#8B5CF6" />
            </View>
            <ThemedText style={styles.explainerText}>
              Content from people in your network gets priority
            </ThemedText>
          </View>
          <View style={styles.explainerRow}>
            <View style={[styles.explainerIcon, { backgroundColor: "#3B82F620" }]}>
              <Feather name="check-circle" size={16} color="#3B82F6" />
            </View>
            <ThemedText style={styles.explainerText}>
              Verified and high net worth users get extra visibility
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Your Interests
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {interests?.length || 0} selected
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="star" size={32} color={theme.primary} />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
        No Interests Selected
      </ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: theme.textSecondary }]}>
        Your feed will show general content. Select interests during onboarding
        to get personalized recommendations.
      </ThemedText>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Feed Preferences
        </ThemedText>
        <View
          style={[
            styles.preferencesCard,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <ThemedText style={styles.preferenceLabel}>Net Worth Priority</ThemedText>
              <ThemedText style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                Show higher net worth users more prominently
              </ThemedText>
            </View>
            <Switch
              value={preferences?.showNetWorthPriority ?? true}
              onValueChange={() => handleTogglePreference("showNetWorthPriority")}
              trackColor={{ false: theme.border, true: theme.primary + "80" }}
              thumbColor={preferences?.showNetWorthPriority ? theme.primary : theme.textSecondary}
            />
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <ThemedText style={styles.preferenceLabel}>Verified Priority</ThemedText>
              <ThemedText style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                Prioritize verified accounts in your feed
              </ThemedText>
            </View>
            <Switch
              value={preferences?.showVerifiedPriority ?? true}
              onValueChange={() => handleTogglePreference("showVerifiedPriority")}
              trackColor={{ false: theme.border, true: theme.primary + "80" }}
              thumbColor={preferences?.showVerifiedPriority ? theme.primary : theme.textSecondary}
            />
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <ThemedText style={styles.preferenceLabel}>Diversify Feed</ThemedText>
              <ThemedText style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                Show variety of content beyond your interests
              </ThemedText>
            </View>
            <Switch
              value={preferences?.diversifyFeed ?? true}
              onValueChange={() => handleTogglePreference("diversifyFeed")}
              trackColor={{ false: theme.border, true: theme.primary + "80" }}
              thumbColor={preferences?.diversifyFeed ? theme.primary : theme.textSecondary}
            />
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <ThemedText style={styles.preferenceLabel}>Creator Content</ThemedText>
              <ThemedText style={[styles.preferenceDescription, { color: theme.textSecondary }]}>
                Show content from creators you support
              </ThemedText>
            </View>
            <Switch
              value={preferences?.showCreatorContent ?? true}
              onValueChange={() => handleTogglePreference("showCreatorContent")}
              trackColor={{ false: theme.border, true: theme.primary + "80" }}
              thumbColor={preferences?.showCreatorContent ? theme.primary : theme.textSecondary}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Algorithm Stats
        </ThemedText>
        <View
          style={[
            styles.statsCard,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Total Interests</ThemedText>
            <ThemedText style={styles.statValue}>{interests?.length || 0}</ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Average Affinity</ThemedText>
            <ThemedText style={styles.statValue}>
              {interests && interests.length > 0
                ? (
                    interests.reduce((sum, i) => sum + i.affinityScore, 0) /
                    interests.length
                  ).toFixed(1)
                : "—"}
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Personalization Level</ThemedText>
            <View style={styles.personalizationBar}>
              <View
                style={[
                  styles.personalizationFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${Math.min((interests?.length || 0) * 20, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Feather name="info" size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.disclaimerText, { color: theme.textSecondary }]}>
          Your interests and engagement data help us personalize your experience.
          You can remove interests at any time.
        </ThemedText>
      </View>
    </View>
  );

  if (isLoadingInterests) {
    return (
      <LoadingIndicator fullScreen />
    );
  }

  return (
    <FlatList
      data={interests || []}
      keyExtractor={(item) => item.interest}
      renderItem={renderInterest}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      showsVerticalScrollIndicator={false}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
  },
  explainerCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  explainerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  explainerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  explainerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  interestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  interestContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  interestIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  iconEmoji: {
    fontSize: 22,
  },
  interestDetails: {
    flex: 1,
  },
  interestName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  affinityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  affinityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  affinityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  affinityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  removeButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.lg,
  },
  preferencesCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  preferenceLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  preferenceDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  statDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  personalizationBar: {
    width: 100,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    overflow: "hidden",
  },
  personalizationFill: {
    height: "100%",
    borderRadius: 4,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: Spacing.lg,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: Spacing.sm,
  },
});
