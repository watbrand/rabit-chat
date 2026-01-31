import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48 - 12) / 2;
const CARD_HEIGHT = 100;

interface IndustryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  gradientColors: [string, string];
}

const INDUSTRIES: IndustryOption[] = [
  { id: "TECH", name: "Tech", icon: "cpu", color: "#6366F1", gradientColors: ["#6366F1", "#A5B4FC"] },
  { id: "FINANCE", name: "Finance", icon: "dollar-sign", color: "#10B981", gradientColors: ["#10B981", "#34D399"] },
  { id: "REAL_ESTATE", name: "Real Estate", icon: "home", color: "#8B5CF6", gradientColors: ["#8B5CF6", "#C4B5FD"] },
  { id: "ENTERTAINMENT", name: "Entertainment", icon: "film", color: "#A855F7", gradientColors: ["#A855F7", "#D8B4FE"] },
  { id: "SPORTS", name: "Sports", icon: "activity", color: "#22C55E", gradientColors: ["#22C55E", "#86EFAC"] },
  { id: "HEALTHCARE", name: "Healthcare", icon: "heart", color: "#F43F5E", gradientColors: ["#F43F5E", "#FDA4AF"] },
  { id: "LEGAL", name: "Legal", icon: "book", color: "#64748B", gradientColors: ["#64748B", "#94A3B8"] },
  { id: "FASHION", name: "Fashion", icon: "shopping-bag", color: "#F59E0B", gradientColors: ["#F59E0B", "#FCD34D"] },
  { id: "HOSPITALITY", name: "Hospitality", icon: "coffee", color: "#EC4899", gradientColors: ["#EC4899", "#F9A8D4"] },
  { id: "MEDIA", name: "Media", icon: "tv", color: "#0EA5E9", gradientColors: ["#0EA5E9", "#7DD3FC"] },
  { id: "AUTOMOTIVE", name: "Automotive", icon: "truck", color: "#DC2626", gradientColors: ["#DC2626", "#F87171"] },
  { id: "AVIATION", name: "Aviation", icon: "navigation", color: "#0284C7", gradientColors: ["#0284C7", "#38BDF8"] },
  { id: "ART", name: "Art", icon: "image", color: "#EF4444", gradientColors: ["#EF4444", "#FCA5A5"] },
  { id: "EDUCATION", name: "Education", icon: "book-open", color: "#14B8A6", gradientColors: ["#14B8A6", "#5EEAD4"] },
  { id: "CONSULTING", name: "Consulting", icon: "briefcase", color: "#7C3AED", gradientColors: ["#7C3AED", "#A78BFA"] },
  { id: "CRYPTO", name: "Crypto", icon: "database", color: "#F97316", gradientColors: ["#F97316", "#FDBA74"] },
  { id: "VENTURE_CAPITAL", name: "Venture Capital", icon: "trending-up", color: "#059669", gradientColors: ["#059669", "#34D399"] },
  { id: "PRIVATE_EQUITY", name: "Private Equity", icon: "pie-chart", color: "#4F46E5", gradientColors: ["#4F46E5", "#818CF8"] },
  { id: "PHILANTHROPY", name: "Philanthropy", icon: "gift", color: "#3B82F6", gradientColors: ["#3B82F6", "#93C5FD"] },
  { id: "OTHER", name: "Other", icon: "more-horizontal", color: "#6B7280", gradientColors: ["#6B7280", "#9CA3AF"] },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function IndustryCard({
  industry,
  isSelected,
  onSelect,
  index,
}: {
  industry: IndustryOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const insets = useSafeAreaInsets();
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
      borderColor: industry.color,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const IconComponent = Feather as any;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 40).springify()}
      style={animatedStyle}
    >
      <AnimatedPressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, borderStyle]}
        testID={`industry-card-${industry.id}`}
      >
        <LinearGradient
          colors={industry.gradientColors}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <IconComponent
                name={industry.icon}
                size={26}
                color="#FFFFFF"
              />
            </View>
            <ThemedText style={styles.cardTitle} numberOfLines={2}>
              {industry.name}
            </ThemedText>
          </View>
          <Animated.View style={[styles.checkmark, { top: insets.top + Spacing.sm }, checkmarkStyle]}>
            <View style={styles.checkmarkCircle}>
              <Feather name="check" size={14} color="#FFFFFF" />
            </View>
          </Animated.View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function IndustrySelectionScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const industryMutation = useMutation({
    mutationFn: async (industry: string) => {
      return apiRequest("POST", "/api/onboarding/industry", { industry });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      navigation.navigate("NetWorthTier");
    },
    onError: (error: any) => {
      // Always continue - preferences can be set later
      navigation.navigate("NetWorthTier");
    },
  });

  const handleSelect = useCallback((industryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIndustry(industryId);
  }, []);

  const handleContinue = () => {
    if (!selectedIndustry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Select Industry", "Please select your primary industry.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    industryMutation.mutate(selectedIndustry);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("NetWorthTier");
  };

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
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <ThemedText style={[styles.title, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
              What's your industry?
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: isDark ? "#A8A8B0" : "#6B7280" }]}>
              Select the industry you work in
            </ThemedText>
          </View>
          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ThemedText style={[styles.skipText, { color: theme.primary }]}>
              Skip
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.lg + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.grid}>
          {INDUSTRIES.map((industry, index) => (
            <IndustryCard
              key={industry.id}
              industry={industry}
              isSelected={selectedIndustry === industry.id}
              onSelect={() => handleSelect(industry.id)}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeIn.delay(400).duration(500)}
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 24,
            backgroundColor: isDark ? "rgba(15, 15, 26, 0.95)" : "rgba(255, 255, 255, 0.95)",
          },
        ]}
      >
        <Pressable
          style={[
            styles.continueButton,
            {
              opacity: selectedIndustry ? 1 : 0.5,
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedIndustry || industryMutation.isPending}
        >
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            {industryMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <ThemedText style={styles.continueText}>Continue</ThemedText>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerContent: {
    flex: 1,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  cardGradient: {
    flex: 1,
    padding: 14,
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
  },
  checkmark: {
    position: "absolute",
    right: 10,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.30)",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
  },
  continueButton: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  continueGradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  continueText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
