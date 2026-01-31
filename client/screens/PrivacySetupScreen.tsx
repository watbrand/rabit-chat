import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
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

type VisibilityOption = "EVERYONE" | "FOLLOWERS" | "NOBODY";

interface PrivacyOption {
  value: VisibilityOption;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

const VISIBILITY_OPTIONS: PrivacyOption[] = [
  {
    value: "EVERYONE",
    label: "Everyone",
    icon: "globe",
    description: "Visible to all users",
  },
  {
    value: "FOLLOWERS",
    label: "Followers",
    icon: "users",
    description: "Only your followers",
  },
  {
    value: "NOBODY",
    label: "Nobody",
    icon: "lock",
    description: "Keep it private",
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PrivacyOptionCard({
  option,
  isSelected,
  onSelect,
  index,
}: {
  option: PrivacyOption;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const glowOpacity = isSelected ? 1 : 0;
    return {
      opacity: withSpring(glowOpacity, { damping: 15, stiffness: 200 }),
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const cardWidth = (width - 48 - 24) / 3;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify()}
      style={[animatedStyle, { width: cardWidth }]}
    >
      <AnimatedPressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.optionCard,
          {
            backgroundColor: isDark
              ? "rgba(26, 26, 36, 0.70)"
              : "rgba(255, 255, 255, 0.85)",
            borderColor: isSelected
              ? theme.primary
              : isDark
              ? "rgba(139, 92, 246, 0.20)"
              : "rgba(0, 0, 0, 0.08)",
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        testID={`privacy-option-${option.value.toLowerCase()}`}
      >
        <Animated.View
          style={[
            styles.glowOverlay,
            glowStyle,
            {
              backgroundColor: `${theme.primary}15`,
              borderRadius: BorderRadius.lg,
            },
          ]}
        />
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isSelected
                ? theme.primary
                : isDark
                ? "rgba(139, 92, 246, 0.15)"
                : "rgba(139, 92, 246, 0.10)",
            },
          ]}
        >
          <Feather
            name={option.icon}
            size={22}
            color={isSelected ? "#FFFFFF" : theme.primary}
          />
        </View>
        <ThemedText
          style={[
            styles.optionLabel,
            {
              color: isSelected
                ? theme.primary
                : isDark
                ? "#FFFFFF"
                : "#1D1D1F",
            },
          ]}
          numberOfLines={1}
        >
          {option.label}
        </ThemedText>
        {isSelected ? (
          <View style={[styles.selectedIndicator, { backgroundColor: theme.primary, top: insets.top + Spacing.xs }]}>
            <Feather name="check" size={10} color="#FFFFFF" />
          </View>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

function PrivacySection({
  title,
  description,
  selectedValue,
  onSelect,
  sectionIndex,
}: {
  title: string;
  description: string;
  selectedValue: VisibilityOption;
  onSelect: (value: VisibilityOption) => void;
  sectionIndex: number;
}) {
  const { theme, isDark } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(sectionIndex * 150).springify()}
      style={[
        styles.section,
        {
          backgroundColor: isDark
            ? "rgba(26, 26, 36, 0.50)"
            : "rgba(255, 255, 255, 0.70)",
          borderColor: isDark
            ? "rgba(139, 92, 246, 0.15)"
            : "rgba(0, 0, 0, 0.06)",
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <ThemedText
          style={[
            styles.sectionTitle,
            { color: isDark ? "#FFFFFF" : "#1D1D1F" },
          ]}
        >
          {title}
        </ThemedText>
        <ThemedText
          style={[
            styles.sectionDescription,
            { color: isDark ? "#A8A8B0" : "rgba(29, 29, 31, 0.70)" },
          ]}
        >
          {description}
        </ThemedText>
      </View>
      <View style={styles.optionsRow}>
        {VISIBILITY_OPTIONS.map((option, index) => (
          <PrivacyOptionCard
            key={option.value}
            option={option}
            isSelected={selectedValue === option.value}
            onSelect={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }}
            index={index}
          />
        ))}
      </View>
    </Animated.View>
  );
}

export default function PrivacySetupScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();

  const [netWorthVisibility, setNetWorthVisibility] =
    useState<VisibilityOption>("FOLLOWERS");
  const [profileVisibility, setProfileVisibility] =
    useState<VisibilityOption>("FOLLOWERS");

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Fire API in background - don't wait for it
    apiRequest("POST", "/api/onboarding/privacy", {
      netWorthVisibility,
      profileVisibility,
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    }).catch(() => {
      // Ignore errors - settings can be updated later
    });
    
    // Navigate immediately without waiting
    navigation.navigate("EliteCircle");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDark
            ? ["#1a1a2e", "#16213e", "#0f0f1a"]
            : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]
        }
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={FadeIn.duration(600)}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <ThemedText
            style={[
              styles.title,
              { color: isDark ? "#FFFFFF" : "#1a1a2e" },
            ]}
          >
            Privacy Settings
          </ThemedText>
          <ThemedText
            style={[
              styles.subtitle,
              { color: isDark ? "#A8A8B0" : "rgba(29, 29, 31, 0.70)" },
            ]}
          >
            Control who can see your profile information and net worth. You can
            change these settings anytime.
          </ThemedText>
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
        <PrivacySection
          title="Net Worth Visibility"
          description="Who can see your net worth tier and badge"
          selectedValue={netWorthVisibility}
          onSelect={setNetWorthVisibility}
          sectionIndex={0}
        />

        <PrivacySection
          title="Profile Visibility"
          description="Who can view your full profile and posts"
          selectedValue={profileVisibility}
          onSelect={setProfileVisibility}
          sectionIndex={1}
        />

        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark
                ? "rgba(139, 92, 246, 0.10)"
                : "rgba(139, 92, 246, 0.08)",
              borderColor: isDark
                ? "rgba(139, 92, 246, 0.20)"
                : "rgba(139, 92, 246, 0.15)",
            },
          ]}
        >
          <Feather
            name="shield"
            size={20}
            color={theme.primary}
            style={styles.infoIcon}
          />
          <ThemedText
            style={[
              styles.infoText,
              { color: isDark ? "#A8A8B0" : "rgba(29, 29, 31, 0.70)" },
            ]}
          >
            Your privacy is our priority. All settings are encrypted and can be
            updated anytime from your profile settings.
          </ThemedText>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(500)}
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 24,
            backgroundColor: isDark
              ? "rgba(10, 10, 15, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            borderTopColor: isDark
              ? "rgba(139, 92, 246, 0.15)"
              : "rgba(0, 0, 0, 0.06)",
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          testID="privacy-continue-button"
        >
          <LinearGradient
            colors={["#8B5CF6", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            <ThemedText style={styles.continueButtonText}>
              Continue
            </ThemedText>
            <Feather
              name="arrow-right"
              size={20}
              color="#FFFFFF"
              style={styles.continueIcon}
            />
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
    paddingBottom: Spacing.sm,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    borderRadius: BorderRadius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  optionCard: {
    borderRadius: BorderRadius.lg,
    padding: 14,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  selectedIndicator: {
    position: "absolute",
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  continueButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  continueIcon: {
    marginLeft: 8,
  },
});
