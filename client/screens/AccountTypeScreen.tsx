import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Haptics from "@/lib/safeHaptics";
import * as AppleAuthentication from "expo-apple-authentication";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { useAuth } from "@/hooks/useAuth";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

type AccountType = "personal" | "creator" | "business";

interface AccountTypeOption {
  id: AccountType;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  icon: keyof typeof Feather.glyphMap;
  gradientColors: readonly [string, string];
}

const ACCOUNT_TYPES: AccountTypeOption[] = [
  {
    id: "personal",
    title: "Personal Elite",
    subtitle: "Join as an elite member",
    description: "For networking and connecting with peers in exclusive circles",
    icon: "user",
    gradientColors: ["#8B5CF6", "#A78BFA"],
  },
  {
    id: "creator",
    title: "Creator",
    subtitle: "Build your audience",
    description: "For influencers, artists, and content creators",
    badge: "15 categories",
    icon: "star",
    gradientColors: ["#EC4899", "#F472B6"],
  },
  {
    id: "business",
    title: "Business",
    subtitle: "Grow your brand",
    description: "For companies, brands, and luxury businesses",
    badge: "16 industries",
    icon: "briefcase",
    gradientColors: ["#14B8A6", "#2DD4BF"],
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SocialAuthButtonProps {
  provider: "google" | "apple";
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

function SocialAuthButton({ provider, onPress, loading, disabled }: SocialAuthButtonProps) {
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

  const isGoogle = provider === "google";
  const buttonColor = isGoogle 
    ? (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.9)")
    : "#000000";
  const textColor = isGoogle
    ? (isDark ? "#FFFFFF" : "#1F2937")
    : "#FFFFFF";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)";

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, { opacity: disabled ? 0.5 : 1 }]}
      testID={`social-auth-${provider}-button`}
    >
      <View
        style={[
          styles.socialButton,
          {
            backgroundColor: buttonColor,
            borderColor: borderColor,
            borderWidth: isGoogle ? 1 : 0,
          },
        ]}
      >
        {loading ? (
          <LoadingIndicator size="small" />
        ) : (
          <>
            {isGoogle ? (
              <View style={styles.googleIconContainer}>
                <ThemedText style={[styles.googleIcon, { color: "#4285F4" }]}>G</ThemedText>
              </View>
            ) : (
              <Feather name="command" size={18} color={textColor} />
            )}
            <ThemedText style={[styles.socialButtonText, { color: textColor }]}>
              {isGoogle ? "Continue with Google" : "Continue with Apple"}
            </ThemedText>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

function AccountTypeCard({
  option,
  onSelect,
  index,
}: {
  option: AccountTypeOption;
  onSelect: () => void;
  index: number;
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
    <Animated.View
      entering={FadeInUp.delay(200 + index * 100).springify().damping(15)}
      style={animatedStyle}
    >
      <AnimatedPressable
        onPress={onSelect}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`account-type-card-${option.id}`}
        style={styles.cardWrapper}
      >
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.card,
            {
              backgroundColor: isDark
                ? "rgba(26, 26, 36, 0.70)"
                : "rgba(255, 255, 255, 0.85)",
              borderColor: isDark
                ? "rgba(139, 92, 246, 0.25)"
                : "rgba(255, 255, 255, 0.6)",
            },
          ]}
        >
          <View style={styles.cardContent}>
            <LinearGradient
              colors={option.gradientColors}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name={option.icon} size={28} color="#FFFFFF" />
            </LinearGradient>

            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <ThemedText
                  style={[
                    styles.cardTitle,
                    { fontFamily: "Poppins_600SemiBold" },
                  ]}
                >
                  {option.title}
                </ThemedText>
                {option.badge ? (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${option.gradientColors[0]}20` },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.badgeText,
                        { color: option.gradientColors[0] },
                      ]}
                    >
                      {option.badge}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              <ThemedText
                style={[
                  styles.cardSubtitle,
                  { color: option.gradientColors[0] },
                ]}
              >
                {option.subtitle}
              </ThemedText>

              <ThemedText
                style={[styles.cardDescription, { color: theme.textSecondary }]}
              >
                {option.description}
              </ThemedText>
            </View>

            <View style={styles.arrowContainer}>
              <LinearGradient
                colors={Gradients.primary}
                style={styles.arrowGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>
        </BlurView>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function AccountTypeScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const socialAuthMutation = useMutation({
    mutationFn: async (data: { provider: string; email: string; displayName?: string; providerId?: string; avatarUrl?: string }) => {
      const response = await apiRequest("POST", "/api/auth/social", data);
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await refreshUser();
      
      if (data.needsProfileComplete) {
        navigation.reset({
          index: 0,
          routes: [{ name: "CompleteProfile" }],
        });
      }
    },
    onError: (error: Error) => {
      Alert.alert("Sign In Failed", error.message || "Unable to sign in. Please try again.");
    },
  });

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleSelectType = (type: AccountType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switch (type) {
      case "personal":
        navigation.navigate("PersonalSignup");
        break;
      case "creator":
        navigation.navigate("CreatorSignup");
        break;
      case "business":
        navigation.navigate("BusinessSignup");
        break;
      default:
        navigation.navigate("Auth", { accountType: type });
    }
  };

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGoogleLoading(true);
    try {
      if (Platform.OS === "web") {
        Alert.alert("Google Sign-In", "Please use the mobile app for Google Sign-In via Expo Go.");
        return;
      }
      Alert.alert(
        "Google Sign-In", 
        "Google Sign-In requires Expo Go. Scan the QR code in Expo Go to use this feature.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Sign In Failed", error.message || "Google Sign-In failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppleLoading(true);
    try {
      if (Platform.OS !== "ios") {
        Alert.alert("Apple Sign-In", "Apple Sign-In is only available on iOS devices.");
        return;
      }
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (credential.email) {
        const displayName = credential.fullName 
          ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim()
          : undefined;
        
        socialAuthMutation.mutate({
          provider: "apple",
          email: credential.email,
          displayName: displayName || undefined,
          providerId: credential.user,
        });
      } else {
        Alert.alert("Apple Sign-In", "Email is required for sign-in. Please allow email access.");
      }
    } catch (error: any) {
      if (error.code !== "ERR_CANCELED") {
        Alert.alert("Sign In Failed", error.message || "Apple Sign-In failed");
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <GradientBackground variant="intense" style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
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
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(100).springify()}
        style={styles.titleContainer}
      >
        <ThemedText
          style={[
            styles.title,
            { fontFamily: "Poppins_700Bold" },
          ]}
        >
          Choose Your Path
        </ThemedText>
        <ThemedText
          style={[
            styles.subtitle,
            { color: theme.textSecondary },
          ]}
        >
          Select the account type that best describes you
        </ThemedText>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200).springify()}
        style={styles.socialAuthContainer}
      >
        <SocialAuthButton
          provider="google"
          onPress={handleGoogleSignIn}
          loading={googleLoading}
          disabled={appleLoading || socialAuthMutation.isPending}
        />
        {Platform.OS === "ios" && (
          <SocialAuthButton
            provider="apple"
            onPress={handleAppleSignIn}
            loading={appleLoading}
            disabled={googleLoading || socialAuthMutation.isPending}
          />
        )}
        
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <ThemedText style={[styles.dividerText, { color: theme.textTertiary }]}>
            or create an account
          </ThemedText>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>
      </Animated.View>

      <View style={styles.cardsContainer}>
        {ACCOUNT_TYPES.map((option, index) => (
          <AccountTypeCard
            key={option.id}
            option={option}
            onSelect={() => handleSelectType(option.id)}
            index={index}
          />
        ))}
      </View>

      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <Pressable
          onPress={() => navigation.navigate("Auth", { mode: "login" })}
          testID="login-link"
          style={styles.loginLinkContainer}
        >
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
            Already have an account?{" "}
          </ThemedText>
          <ThemedText style={[styles.loginLinkText, { color: theme.primary }]}>
            Sign In
          </ThemedText>
        </Pressable>
        <ThemedText
          style={[styles.footerText, { color: theme.textTertiary, marginTop: Spacing.sm }]}
        >
          You can change your account type anytime in settings
        </ThemedText>
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  cardDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  arrowContainer: {
    marginLeft: Spacing.sm,
  },
  arrowGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
  },
  loginLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  socialAuthContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
