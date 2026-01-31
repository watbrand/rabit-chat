import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
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
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInUp,
  ZoomIn,
  Easing,
} from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, CommonActions } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import ConfettiCelebration from "@/components/ConfettiCelebration";

const { width, height } = Dimensions.get("window");

interface OnboardingStatus {
  interests: string[];
  industry: string | null;
  hasInterests: boolean;
  hasIndustry: boolean;
}

const INDUSTRY_LABELS: Record<string, string> = {
  TECH: "Technology",
  FINANCE: "Finance",
  REAL_ESTATE: "Real Estate",
  ENTERTAINMENT: "Entertainment",
  SPORTS: "Sports",
  HEALTHCARE: "Healthcare",
  LEGAL: "Legal",
  FASHION: "Fashion",
  HOSPITALITY: "Hospitality",
  MEDIA: "Media",
  AUTOMOTIVE: "Automotive",
  AVIATION: "Aviation",
  ART: "Art",
  EDUCATION: "Education",
  CONSULTING: "Consulting",
  CRYPTO: "Crypto",
  VENTURE_CAPITAL: "Venture Capital",
  PRIVATE_EQUITY: "Private Equity",
  PHILANTHROPY: "Philanthropy",
  OTHER: "Other",
};

function GlowingCheckmark() {
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      300,
      withSpring(1, { damping: 8, stiffness: 100 })
    );
    glowOpacity.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    rotation.value = withDelay(
      300,
      withTiming(360, { duration: 800, easing: Easing.out(Easing.back(1.5)) })
    );
  }, []);

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0.4, 1], [1, 1.3], Extrapolation.CLAMP) }],
  }));

  return (
    <View style={styles.checkmarkContainer}>
      <Animated.View style={[styles.glowRing, glowStyle]} />
      <Animated.View style={[styles.glowRingOuter, glowStyle]} />
      <Animated.View style={[styles.checkmarkCircle, checkmarkStyle]}>
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          style={styles.checkmarkGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="check" size={48} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function FloatingParticle({ delay, startX, startY }: { delay: number; startX: number; startY: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-30, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
    left: startX,
    top: startY,
  }));

  return (
    <Animated.View style={[styles.floatingParticle, style]} pointerEvents="none">
      <LinearGradient
        colors={["#8B5CF6", "#EC4899"]}
        style={styles.particleGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
}

export default function WelcomeCompleteScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const queryClient = useQueryClient();
  const [showConfetti, setShowConfetti] = useState(true);
  const [isEntering, setIsEntering] = useState(false);

  const { data: onboardingStatus } = useQuery<OnboardingStatus>({
    queryKey: ["/api/onboarding/status"],
  });

  useEffect(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleEnterApp = () => {
    if (isEntering) return;
    setIsEntering(true);
    
    console.log("[WelcomeComplete] Button pressed - navigating to Main");
    
    // Fire API in background - don't wait
    apiRequest("POST", "/api/onboarding/first-session-complete", {}).catch(() => {});
    
    // Clear cache
    queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    
    // Navigate to Main - now exists in both auth and non-auth branches
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Main" }],
      })
    );
  };

  const interestsCount = onboardingStatus?.interests?.length || 0;
  const industry = onboardingStatus?.industry
    ? INDUSTRY_LABELS[onboardingStatus.industry] || onboardingStatus.industry
    : null;

  const particles = [
    { delay: 0, startX: width * 0.1, startY: height * 0.2 },
    { delay: 200, startX: width * 0.85, startY: height * 0.15 },
    { delay: 400, startX: width * 0.15, startY: height * 0.7 },
    { delay: 600, startX: width * 0.8, startY: height * 0.65 },
    { delay: 300, startX: width * 0.5, startY: height * 0.1 },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ConfettiCelebration
        isActive={showConfetti}
        onComplete={() => setShowConfetti(false)}
        pieceCount={60}
        duration={4000}
      />

      {particles.map((particle, index) => (
        <FloatingParticle
          key={index}
          delay={particle.delay}
          startX={particle.startX}
          startY={particle.startY}
        />
      ))}

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 30 }]}>
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.mainContent}>
          <GlowingCheckmark />

          <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.textContent}>
            <ThemedText style={[styles.title, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
              Welcome to the Elite
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: isDark ? "rgba(255,255,255,0.8)" : "#666" }]}>
              Your journey to extraordinary connections begins now
            </ThemedText>
          </Animated.View>

          {(interestsCount > 0 || industry) ? (
            <Animated.View
              entering={FadeInUp.delay(800).springify()}
              style={[
                styles.statsCard,
                {
                  backgroundColor: isDark
                    ? "rgba(139, 92, 246, 0.15)"
                    : "rgba(139, 92, 246, 0.08)",
                  borderColor: isDark
                    ? "rgba(139, 92, 246, 0.25)"
                    : "rgba(139, 92, 246, 0.15)",
                },
              ]}
            >
              {interestsCount > 0 ? (
                <View style={styles.statRow}>
                  <View style={[styles.statIcon, { backgroundColor: "rgba(139, 92, 246, 0.2)" }]}>
                    <Feather name="heart" size={16} color={theme.primary} />
                  </View>
                  <View style={styles.statText}>
                    <ThemedText style={[styles.statLabel, { color: isDark ? "#A8A8B0" : "#6B7280" }]}>
                      Your Interests
                    </ThemedText>
                    <ThemedText style={[styles.statValue, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
                      {interestsCount} topic{interestsCount !== 1 ? "s" : ""} selected
                    </ThemedText>
                  </View>
                </View>
              ) : null}
              {industry ? (
                <View style={[styles.statRow, interestsCount > 0 ? styles.statRowBorder : undefined]}>
                  <View style={[styles.statIcon, { backgroundColor: "rgba(236, 72, 153, 0.2)" }]}>
                    <Feather name="briefcase" size={16} color="#EC4899" />
                  </View>
                  <View style={styles.statText}>
                    <ThemedText style={[styles.statLabel, { color: isDark ? "#A8A8B0" : "#6B7280" }]}>
                      Your Industry
                    </ThemedText>
                    <ThemedText style={[styles.statValue, { color: isDark ? "#FFFFFF" : "#1a1a2e" }]}>
                      {industry}
                    </ThemedText>
                  </View>
                </View>
              ) : null}
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInUp.delay(1000).springify()} style={styles.messageCard}>
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"]}
              style={styles.messageGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="star" size={20} color={theme.primary} style={styles.messageIcon} />
              <ThemedText style={[styles.messageText, { color: isDark ? "rgba(255,255,255,0.9)" : "#333" }]}>
                You've joined a community of visionaries, innovators, and leaders. Get ready to make meaningful connections.
              </ThemedText>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(1200).duration(500)} style={styles.footer}>
          <Pressable
            style={styles.enterButton}
            onPress={handleEnterApp}
            testID="enter-app-button"
          >
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              style={styles.enterGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isEntering ? (
                <LoadingIndicator size="small" />
              ) : (
                <>
                  <ThemedText style={styles.enterText}>Enter RabitChat</ThemedText>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={[styles.decorCircle2, { backgroundColor: theme.primary }]} pointerEvents="none" />
      <View style={styles.decorCircle3} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  checkmarkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  checkmarkGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.4)",
  },
  glowRingOuter: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  textContent: {
    alignItems: "center",
    marginBottom: 32,
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
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  statsCard: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  statRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
    marginTop: 8,
    paddingTop: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  messageCard: {
    width: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  messageGradient: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  messageIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 16,
  },
  enterButton: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  enterGradient: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  enterText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  floatingParticle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  particleGradient: {
    flex: 1,
  },
  decorCircle1: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  decorCircle3: {
    position: "absolute",
    top: height * 0.4,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(236, 72, 153, 0.1)",
  },
});
