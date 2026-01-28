import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2;
const CARD_HEIGHT = 110;
const MIN_SELECTIONS = 3;
const MAX_SELECTIONS = 10;

interface InterestCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradientColors: string[];
  order: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function InterestCard({
  category,
  isSelected,
  onSelect,
  index,
}: {
  category: InterestCategory;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const selected = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const checkmarkStyle = useAnimatedStyle(() => {
    return {
      opacity: selected.value,
      transform: [
        { scale: interpolate(selected.value, [0, 1], [0.5, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  const borderStyle = useAnimatedStyle(() => {
    return {
      borderWidth: interpolate(selected.value, [0, 1], [0, 3], Extrapolation.CLAMP),
      borderColor: category.color,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const gradientColors = category.gradientColors?.length >= 2
    ? category.gradientColors as [string, string, ...string[]]
    : [category.color, `${category.color}88`] as [string, string];

  const IconComponent = Feather as any;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      style={animatedStyle}
    >
      <AnimatedPressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, borderStyle]}
        testID={`interest-card-${category.slug}`}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <IconComponent
                name={category.icon || "star"}
                size={28}
                color="#FFFFFF"
              />
            </View>
            <ThemedText style={styles.cardTitle} numberOfLines={2}>
              {category.name}
            </ThemedText>
          </View>
          <Animated.View style={[styles.checkmark, checkmarkStyle]}>
            <View style={styles.checkmarkCircle}>
              <Feather name="check" size={14} color="#FFFFFF" />
            </View>
          </Animated.View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function InterestSelectionScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  const { data: categories = [], isLoading } = useQuery<InterestCategory[]>({
    queryKey: ["/api/interests/categories"],
  });

  const selectMutation = useMutation({
    mutationFn: async (interests: string[]) => {
      return apiRequest("POST", "/api/interests/select", { interests });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interests/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      navigation.navigate("IndustrySelection");
    },
    onError: (error: any) => {
      // Always continue - preferences can be set later
      console.log("[InterestSelection] Error saving, continuing anyway:", error?.message);
      navigation.navigate("IndustrySelection");
    },
  });

  const handleSelect = useCallback((slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSlugs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else if (newSet.size < MAX_SELECTIONS) {
        newSet.add(slug);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Maximum Reached", `You can select up to ${MAX_SELECTIONS} interests.`);
      }
      return newSet;
    });
  }, []);

  const handleContinue = () => {
    if (selectedSlugs.size < MIN_SELECTIONS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Select More", `Please select at least ${MIN_SELECTIONS} interests.`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    selectMutation.mutate(Array.from(selectedSlugs));
  };

  const selectionCount = selectedSlugs.size;
  const canContinue = selectionCount >= MIN_SELECTIONS;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient
          colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading interests...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={FadeIn.duration(600)}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <ThemedText style={[styles.title, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
            What interests you?
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: isDark ? "rgba(255,255,255,0.7)" : "#666" }]}>
            Select {MIN_SELECTIONS}-{MAX_SELECTIONS} topics to personalize your feed
          </ThemedText>
        </View>
        <View style={[styles.progressPill, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
          <ThemedText style={[styles.progressText, { color: canContinue ? theme.primary : theme.textSecondary }]}>
            {selectionCount} / {MAX_SELECTIONS}
          </ThemedText>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category, index) => (
          <InterestCard
            key={category.id}
            category={category}
            isSelected={selectedSlugs.has(category.slug)}
            onSelect={() => handleSelect(category.slug)}
            index={index}
          />
        ))}
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(500).springify()}
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        <BlurView
          intensity={isDark ? 40 : 80}
          tint={isDark ? "dark" : "light"}
          style={styles.footerBlur}
        >
          <View style={styles.footerContent}>
            <Pressable
              style={[
                styles.continueButton,
                {
                  backgroundColor: canContinue ? theme.primary : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                },
              ]}
              onPress={handleContinue}
              disabled={!canContinue || selectMutation.isPending}
              testID="continue-button"
            >
              {selectMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <ThemedText
                    style={[
                      styles.continueText,
                      { color: canContinue ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    Continue
                  </ThemedText>
                  <Feather
                    name="arrow-right"
                    size={20}
                    color={canContinue ? "#FFFFFF" : theme.textSecondary}
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>

      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={[styles.decorCircle2, { backgroundColor: theme.primary }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
    marginTop: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardGradient: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  cardContent: {
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  footerBlur: {
    paddingTop: 16,
    paddingHorizontal: 24,
  },
  footerContent: {
    alignItems: "center",
  },
  continueButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: 18,
    fontWeight: "600",
  },
  decorCircle1: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    pointerEvents: "none",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
    pointerEvents: "none",
  },
});
