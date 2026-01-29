import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

const { width } = Dimensions.get("window");

interface NetWorthTier {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradientColors: [string, string];
}

const TIERS: NetWorthTier[] = [
  {
    id: "BUILDING",
    name: "Building Wealth",
    description: "Starting my journey",
    icon: "trending-up",
    color: "#94A3B8",
    gradientColors: ["#94A3B8", "#64748B"],
  },
  {
    id: "SILVER",
    name: "Silver Circle",
    description: "R100K+ net worth",
    icon: "award",
    color: "#C0C0C0",
    gradientColors: ["#C0C0C0", "#A8A8A8"],
  },
  {
    id: "GOLD",
    name: "Gold Circle",
    description: "R1M+ net worth",
    icon: "star",
    color: "#D4AF37",
    gradientColors: ["#D4AF37", "#B8972E"],
  },
  {
    id: "PLATINUM",
    name: "Platinum Elite",
    description: "R10M+ net worth",
    icon: "zap",
    color: "#A1D6E2",
    gradientColors: ["#A1D6E2", "#7BC4D4"],
  },
  {
    id: "DIAMOND",
    name: "Diamond Legacy",
    description: "Ultra High Net Worth",
    icon: "hexagon",
    color: "#B9F2FF",
    gradientColors: ["#B9F2FF", "#87E8F7"],
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TierCard({
  tier,
  isSelected,
  onSelect,
  index,
}: {
  tier: NetWorthTier;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { isDark } = useTheme();
  const scale = useSharedValue(1);
  const selected = useSharedValue(isSelected ? 1 : 0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    selected.value = withSpring(isSelected ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
    glowOpacity.value = withTiming(isSelected ? 1 : 0, { duration: 300 });
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
      borderWidth: interpolate(selected.value, [0, 1], [1, 3], Extrapolation.CLAMP),
      borderColor: tier.color,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value * 0.6,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const IconComponent = Feather as any;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify()}
      style={[styles.cardWrapper, animatedStyle]}
    >
      <Animated.View style={[styles.glowEffect, { backgroundColor: tier.color }, glowStyle]} />
      <AnimatedPressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          { 
            backgroundColor: isDark ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.9)",
          },
          borderStyle,
        ]}
        testID={`tier-card-${tier.id.toLowerCase()}`}
      >
        <LinearGradient
          colors={tier.gradientColors}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <IconComponent
            name={tier.icon}
            size={28}
            color="#FFFFFF"
          />
        </LinearGradient>
        
        <View style={styles.cardTextContent}>
          <ThemedText style={[styles.cardTitle, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
            {tier.name}
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: isDark ? "#A8A8B0" : "#6B6B78" }]}>
            {tier.description}
          </ThemedText>
        </View>

        <Animated.View style={[styles.checkmark, checkmarkStyle]}>
          <LinearGradient
            colors={tier.gradientColors}
            style={styles.checkmarkCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="check" size={16} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function NetWorthTierScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const selectMutation = useMutation({
    mutationFn: async (tier: string) => {
      return apiRequest("POST", "/api/onboarding/net-worth-tier", { tier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      navigation.navigate("SuggestedUsers");
    },
    onError: (error: any) => {
      // Always continue - preferences can be set later
      console.log("[NetWorthTier] Error saving, continuing anyway:", error?.message);
      navigation.navigate("SuggestedUsers");
    },
  });

  const handleSelect = useCallback((tierId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTier(tierId);
  }, []);

  const handleContinue = () => {
    if (!selectedTier) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Select a Tier", "Please select your net worth tier to continue.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    selectMutation.mutate(selectedTier);
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
        <View style={styles.headerContent}>
          <ThemedText style={[styles.title, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
            What's your wealth tier?
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: isDark ? "#A8A8B0" : "#6B6B78" }]}>
            Join the circle that matches your journey
          </ThemedText>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 200 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {TIERS.map((tier, index) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isSelected={selectedTier === tier.id}
            onSelect={() => handleSelect(tier.id)}
            index={index}
          />
        ))}
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(500).springify()}
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 24,
            backgroundColor: isDark ? "rgba(10, 10, 15, 0.95)" : "rgba(255, 255, 255, 0.95)",
          },
        ]}
      >
        <View style={styles.privacyNote}>
          <Feather
            name="lock"
            size={14}
            color={isDark ? "#A8A8B0" : "#6B6B78"}
          />
          <ThemedText style={[styles.privacyText, { color: isDark ? "#A8A8B0" : "#6B6B78" }]}>
            Your tier is private by default
          </ThemedText>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            {
              opacity: selectedTier ? (pressed ? 0.9 : 1) : 0.5,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={handleContinue}
          disabled={!selectedTier || selectMutation.isPending}
          testID="continue-button"
        >
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {selectMutation.isPending ? (
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
    position: "relative",
  },
  glowEffect: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.xl + 4,
    opacity: 0,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  cardTextContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  checkmark: {
    marginLeft: Spacing.md,
  },
  checkmarkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.1)",
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  privacyText: {
    fontSize: 14,
    marginLeft: Spacing.sm,
  },
  continueButton: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  continueGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
