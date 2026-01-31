import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/hooks/useAuth";
import { LocationPicker } from "@/components/LocationPicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

type AccountType = "PERSONAL" | "CREATOR" | "BUSINESS";

interface AccountTypeOption {
  id: AccountType;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  gradientColors: readonly [string, string];
}

const ACCOUNT_TYPES: AccountTypeOption[] = [
  {
    id: "PERSONAL",
    title: "Personal Elite",
    subtitle: "For networking and connecting",
    icon: "user",
    gradientColors: ["#8B5CF6", "#A78BFA"],
  },
  {
    id: "CREATOR",
    title: "Creator",
    subtitle: "For influencers and content creators",
    icon: "star",
    gradientColors: ["#EC4899", "#F472B6"],
  },
  {
    id: "BUSINESS",
    title: "Business",
    subtitle: "For companies and brands",
    icon: "briefcase",
    gradientColors: ["#14B8A6", "#2DD4BF"],
  },
];

const CREATOR_CATEGORIES = [
  { value: "INFLUENCER", label: "Influencer" },
  { value: "ARTIST_MUSICIAN", label: "Artist / Musician" },
  { value: "PHOTOGRAPHER", label: "Photographer" },
  { value: "VIDEOGRAPHER", label: "Videographer" },
  { value: "BLOGGER", label: "Blogger" },
  { value: "DJ_PRODUCER", label: "DJ / Producer" },
  { value: "COMEDIAN", label: "Comedian" },
  { value: "PUBLIC_FIGURE", label: "Public Figure" },
  { value: "GAMER_STREAMER", label: "Gamer / Streamer" },
  { value: "EDUCATOR", label: "Educator" },
  { value: "FASHION_MODEL", label: "Fashion Model" },
  { value: "FITNESS_COACH", label: "Fitness Coach" },
  { value: "BEAUTY_MAKEUP", label: "Beauty / Makeup" },
  { value: "BUSINESS_CREATOR", label: "Business Creator" },
  { value: "OTHER", label: "Other" },
];

const BUSINESS_CATEGORIES = [
  { value: "LUXURY_BRAND", label: "Luxury Brand" },
  { value: "RESTAURANT_FOOD", label: "Restaurant / Food" },
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "FASHION_CLOTHING", label: "Fashion / Clothing" },
  { value: "AUTOMOTIVE", label: "Automotive" },
  { value: "BEAUTY_SALON_SPA", label: "Beauty / Salon / Spa" },
  { value: "FINANCE_TRADING", label: "Finance / Trading" },
  { value: "MEDIA_ENTERTAINMENT", label: "Media / Entertainment" },
  { value: "NIGHTLIFE_CLUB_EVENTS", label: "Nightlife / Events" },
  { value: "TECH_SOFTWARE", label: "Tech / Software" },
  { value: "EDUCATION", label: "Education" },
  { value: "HEALTH_MEDICAL", label: "Health / Medical" },
  { value: "ECOMMERCE_STORE", label: "E-Commerce Store" },
  { value: "SERVICES", label: "Services" },
  { value: "AGENCY_MARKETING", label: "Agency / Marketing" },
  { value: "OTHER", label: "Other" },
];

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-Binary" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer Not to Say" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SelectionCard({
  option,
  isSelected,
  onSelect,
}: {
  option: AccountTypeOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
      testID={`account-type-${option.id.toLowerCase()}`}
    >
      <View
        style={[
          styles.selectionCard,
          {
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(255, 255, 255, 0.9)",
            borderColor: isSelected
              ? option.gradientColors[0]
              : isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
        <LinearGradient
          colors={option.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Feather name={option.icon} size={20} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.cardTextContainer}>
          <ThemedText style={styles.cardTitle}>{option.title}</ThemedText>
          <ThemedText
            style={[styles.cardSubtitle, { color: theme.textSecondary }]}
          >
            {option.subtitle}
          </ThemedText>
        </View>
        {isSelected ? (
          <Feather name="check-circle" size={20} color={option.gradientColors[0]} />
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

function ChipSelector({
  options,
  selectedValue,
  onSelect,
  testIDPrefix,
}: {
  options: { value: string; label: string }[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  testIDPrefix: string;
}) {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.chipContainer}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected
                  ? "#8B5CF6"
                  : isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.05)",
                borderColor: isSelected
                  ? "#8B5CF6"
                  : isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
            testID={`${testIDPrefix}-${option.value.toLowerCase()}`}
          >
            <ThemedText
              style={[
                styles.chipText,
                { color: isSelected ? "#FFFFFF" : theme.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CompleteProfileScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>("PERSONAL");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [creatorCategory, setCreatorCategory] = useState<string | null>(null);
  const [businessCategory, setBusinessCategory] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);

  const completeProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/complete-profile", data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refreshUser();
      navigation.navigate("LegalAgreement", { fromSignup: true });
    },
    onError: (error: Error) => {
      // Always continue - profile can be updated later
      console.log("[CompleteProfile] Error saving, continuing anyway:", error?.message);
      navigation.navigate("LegalAgreement", { fromSignup: true });
    },
  });

  const canProceedStep1 = accountType !== null;
  const canProceedStep2 = country && province && city;
  const canProceedStep3 =
    accountType === "PERSONAL" ||
    (accountType === "CREATOR" && creatorCategory) ||
    (accountType === "BUSINESS" && businessCategory);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step === 1 && canProceedStep1) {
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    } else if (step === 3 && canProceedStep3) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    const data: any = {
      category: accountType,
      country,
      province,
      city,
    };

    if (gender) data.gender = gender;
    if (accountType === "CREATOR" && creatorCategory) {
      data.creatorCategory = creatorCategory;
    }
    if (accountType === "BUSINESS" && businessCategory) {
      data.businessCategory = businessCategory;
    }

    completeProfileMutation.mutate(data);
  };

  const handleLocationChange = (loc: { country: string; province: string; city: string }) => {
    setCountry(loc.country);
    setProvince(loc.province);
    setCity(loc.city);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Choose Your Account Type";
      case 2:
        return "Set Your Location";
      case 3:
        return accountType === "CREATOR"
          ? "Select Your Creator Category"
          : accountType === "BUSINESS"
          ? "Select Your Business Category"
          : "A Few More Details";
      default:
        return "";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1:
        return "This helps us personalize your experience";
      case 2:
        return "Connect with people in your area";
      case 3:
        return accountType === "CREATOR"
          ? "Let others know what content you create"
          : accountType === "BUSINESS"
          ? "Help customers find your business"
          : "Optional details to enhance your profile";
      default:
        return "";
    }
  };

  const canProceed = step === 1 ? canProceedStep1 : step === 2 ? canProceedStep2 : canProceedStep3;
  const isLastStep = step === 3;

  return (
    <GradientBackground variant="intense" style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        {step > 1 ? (
          <Pressable
            onPress={handleBack}
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            ]}
            testID="back-button"
          >
            <Feather
              name="arrow-left"
              size={22}
              color={isDark ? "#FFFFFF" : theme.text}
            />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}

        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    s <= step
                      ? "#8B5CF6"
                      : isDark
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.backButton} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={styles.titleContainer}
        >
          <ThemedText style={[styles.title, { fontFamily: "Poppins_700Bold" }]}>
            {getStepTitle()}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {getStepSubtitle()}
          </ThemedText>
        </Animated.View>

        {step === 1 && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.content}>
            {ACCOUNT_TYPES.map((option) => (
              <SelectionCard
                key={option.id}
                option={option}
                isSelected={accountType === option.id}
                onSelect={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setAccountType(option.id);
                }}
              />
            ))}
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.content}>
            <LocationPicker
              initialLocation={{ country, province, city }}
              onLocationChange={handleLocationChange}
            />
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.content}>
            {accountType === "CREATOR" && (
              <>
                <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Creator Category
                </ThemedText>
                <ChipSelector
                  options={CREATOR_CATEGORIES}
                  selectedValue={creatorCategory}
                  onSelect={setCreatorCategory}
                  testIDPrefix="creator-category"
                />
              </>
            )}

            {accountType === "BUSINESS" && (
              <>
                <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Business Category
                </ThemedText>
                <ChipSelector
                  options={BUSINESS_CATEGORIES}
                  selectedValue={businessCategory}
                  onSelect={setBusinessCategory}
                  testIDPrefix="business-category"
                />
              </>
            )}

            {accountType === "PERSONAL" && (
              <>
                <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                  Gender (Optional)
                </ThemedText>
                <ChipSelector
                  options={GENDERS}
                  selectedValue={gender}
                  onSelect={setGender}
                  testIDPrefix="gender"
                />
              </>
            )}
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(400)}
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: isDark
              ? "rgba(26, 26, 36, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          },
        ]}
      >
        <Pressable
          onPress={handleNext}
          disabled={!canProceed || completeProfileMutation.isPending}
          style={({ pressed }) => [
            styles.continueButton,
            {
              opacity: canProceed && !completeProfileMutation.isPending ? (pressed ? 0.9 : 1) : 0.5,
            },
          ]}
          testID="continue-button"
        >
          <LinearGradient
            colors={["#8B5CF6", "#A78BFA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {completeProfileMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <ThemedText style={styles.buttonText}>
                {isLastStep ? "Complete Profile" : "Continue"}
              </ThemedText>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  titleContainer: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    gap: Spacing.md,
  },
  selectionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  continueButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
