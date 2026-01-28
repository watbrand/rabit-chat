import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = Spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - CARD_GAP) / 2;

const EMERGENCY_RED = "#EF4444";
const EMERGENCY_ORANGE = "#F97316";
const EMERGENCY_RED_LIGHT = "rgba(239, 68, 68, 0.15)";
const EMERGENCY_RED_DARK = "rgba(239, 68, 68, 0.25)";

interface SafetyResource {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  action: string;
}

interface CrisisHotline {
  name: string;
  number: string;
  description: string;
}

interface SafetyTip {
  id: string;
  title: string;
  content: string;
}

const SAFETY_RESOURCES: SafetyResource[] = [
  {
    id: "report-harassment",
    title: "Report Harassment",
    description: "Report abusive behavior or harassment",
    icon: "alert-triangle",
    action: "report",
  },
  {
    id: "block-someone",
    title: "Block Someone",
    description: "Manage blocked accounts",
    icon: "slash",
    action: "block",
  },
  {
    id: "mental-health",
    title: "Mental Health",
    description: "Access mental health resources",
    icon: "heart",
    action: "mental-health",
  },
  {
    id: "account-security",
    title: "Account Security",
    description: "Secure your account",
    icon: "lock",
    action: "security",
  },
  {
    id: "privacy-checkup",
    title: "Privacy Checkup",
    description: "Review your privacy settings",
    icon: "eye-off",
    action: "privacy",
  },
  {
    id: "appeal-decision",
    title: "Appeal a Decision",
    description: "Appeal content or account decisions",
    icon: "message-square",
    action: "appeal",
  },
];

const CRISIS_HOTLINES: CrisisHotline[] = [
  {
    name: "SADAG",
    number: "0800 567 567",
    description: "South African Depression and Anxiety Group - Free 24/7 helpline",
  },
  {
    name: "Lifeline SA",
    number: "0861 322 322",
    description: "Crisis intervention and counseling",
  },
  {
    name: "Childline",
    number: "116",
    description: "Free helpline for children and youth",
  },
];

const SAFETY_TIPS: SafetyTip[] = [
  {
    id: "passwords",
    title: "Use Strong Passwords",
    content: "Create unique passwords with a mix of letters, numbers, and symbols. Never share your password with anyone.",
  },
  {
    id: "personal-info",
    title: "Protect Personal Information",
    content: "Never share sensitive information like your address, phone number, or financial details with strangers online.",
  },
  {
    id: "suspicious-links",
    title: "Avoid Suspicious Links",
    content: "Don't click on links from unknown sources. They could lead to phishing sites or malware.",
  },
  {
    id: "report-abuse",
    title: "Report Abuse Immediately",
    content: "If you experience or witness harassment, bullying, or threatening behavior, report it immediately using our safety tools.",
  },
  {
    id: "privacy-settings",
    title: "Review Privacy Settings",
    content: "Regularly check and update your privacy settings to control who can see your content and contact you.",
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CollapsibleTip({ tip, isExpanded, onToggle }: { tip: SafetyTip; isExpanded: boolean; onToggle: () => void }) {
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
    maxHeight: height.value * 200,
  }));

  return (
    <Pressable
      testID={`safety-tip-${tip.id}`}
      style={[
        styles.tipItem,
        {
          backgroundColor: theme.glassBackground,
          borderColor: isExpanded ? EMERGENCY_RED : theme.glassBorder,
        },
      ]}
      onPress={onToggle}
    >
      <View style={styles.tipHeader}>
        <View style={[styles.tipIconWrap, { backgroundColor: EMERGENCY_RED_LIGHT }]}>
          <Feather name="check-circle" size={16} color={EMERGENCY_RED} />
        </View>
        <ThemedText type="headline" style={styles.tipTitle}>
          {tip.title}
        </ThemedText>
        <Animated.View style={iconStyle}>
          <Feather name="chevron-down" size={18} color={EMERGENCY_RED} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.tipContentContainer, contentStyle]}>
        {isExpanded ? (
          <View style={[styles.tipContentInner, { borderTopColor: theme.border }]}>
            <ThemedText style={[styles.tipContent, { color: theme.textSecondary }]}>
              {tip.content}
            </ThemedText>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default function SafetyCenterScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: safetyResources, isLoading, refetch } = useQuery({
    queryKey: ["/api/help/safety-resources"],
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleEmergencyCall = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Linking.openURL("tel:10111");
  }, []);

  const handleContactSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("NewTicket", { category: "safety", priority: "urgent" });
  }, [navigation]);

  const handleResourcePress = useCallback((resource: SafetyResource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (resource.action) {
      case "report":
        navigation.navigate("NewTicket", { category: "safety", priority: "urgent" });
        break;
      case "block":
        navigation.navigate("BlockedAccounts");
        break;
      case "mental-health":
        break;
      case "security":
        navigation.navigate("SecuritySettings");
        break;
      case "privacy":
        navigation.navigate("PrivacySettings");
        break;
      case "appeal":
        navigation.navigate("Appeals");
        break;
    }
  }, [navigation]);

  const handleHotlineCall = useCallback((hotline: CrisisHotline) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const phoneNumber = hotline.number.replace(/\s/g, "");
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const handleTipToggle = useCallback((tipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedTipId((prev) => (prev === tipId ? null : tipId));
  }, []);

  const ResourceCard = ({ resource, index }: { resource: SafetyResource; index: number }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    };

    return (
      <AnimatedPressable
        testID={`resource-${resource.id}`}
        style={[
          styles.resourceCard,
          {
            backgroundColor: theme.glassBackground,
            borderColor: theme.glassBorder,
          },
          animatedStyle,
        ]}
        onPress={() => handleResourcePress(resource)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.resourceIconWrap, { backgroundColor: EMERGENCY_RED_LIGHT }]}>
          <Feather name={resource.icon} size={22} color={EMERGENCY_RED} />
        </View>
        <ThemedText type="headline" style={styles.resourceTitle} numberOfLines={1}>
          {resource.title}
        </ThemedText>
        <ThemedText style={[styles.resourceDescription, { color: theme.textSecondary }]} numberOfLines={2}>
          {resource.description}
        </ThemedText>
      </AnimatedPressable>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={EMERGENCY_RED} />
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
          tintColor={EMERGENCY_RED}
          colors={[EMERGENCY_RED]}
        />
      }
    >
      <Animated.View entering={FadeIn.duration(300)}>
        <Animated.View entering={FadeInDown.delay(50).duration(300)} style={styles.header}>
          <View style={[styles.sosIconWrap, { backgroundColor: EMERGENCY_RED_DARK }]}>
            <Feather name="shield" size={32} color={EMERGENCY_RED} />
          </View>
          <ThemedText type="title1" style={[styles.headerTitle, { color: EMERGENCY_RED }]}>
            Safety Center
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Your safety is our priority. Find resources and support here.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <LinearGradient
            colors={[EMERGENCY_RED, EMERGENCY_ORANGE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emergencyCard}
          >
            <View style={styles.emergencyHeader}>
              <Feather name="alert-circle" size={24} color="#FFFFFF" />
              <ThemedText style={styles.emergencyTitle}>In immediate danger?</ThemedText>
            </View>
            <ThemedText style={styles.emergencyDescription}>
              If you or someone you know is in immediate danger, please contact emergency services.
            </ThemedText>
            <View style={styles.emergencyButtons}>
              <Pressable
                testID="button-emergency-call"
                style={styles.emergencyButton}
                onPress={handleEmergencyCall}
              >
                <Feather name="phone-call" size={18} color={EMERGENCY_RED} />
                <ThemedText style={[styles.emergencyButtonText, { color: EMERGENCY_RED }]}>
                  Call 10111
                </ThemedText>
              </Pressable>
              <Pressable
                testID="button-contact-support"
                style={[styles.emergencyButton, styles.emergencyButtonOutline]}
                onPress={handleContactSupport}
              >
                <Feather name="message-circle" size={18} color="#FFFFFF" />
                <ThemedText style={styles.emergencyButtonTextWhite}>
                  Contact Support
                </ThemedText>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.section}>
          <ThemedText type="headline" style={[styles.sectionTitle, { color: theme.text }]}>
            Safety Resources
          </ThemedText>
          <View style={styles.resourcesGrid}>
            {SAFETY_RESOURCES.map((resource, index) => (
              <Animated.View
                key={resource.id}
                entering={FadeInDown.delay(150 + index * 50).duration(300)}
                style={styles.resourceCardWrapper}
              >
                <ResourceCard resource={resource} index={index} />
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(450).duration(300)}
          style={styles.section}
        >
          <ThemedText type="headline" style={[styles.sectionTitle, { color: theme.text }]}>
            Crisis Hotlines (South Africa)
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Free and confidential support is available 24/7
          </ThemedText>
          {CRISIS_HOTLINES.map((hotline, index) => (
            <Pressable
              key={hotline.number}
              testID={`hotline-${hotline.name.toLowerCase().replace(/\s/g, "-")}`}
              style={[
                styles.hotlineCard,
                {
                  backgroundColor: theme.glassBackground,
                  borderColor: theme.glassBorder,
                },
              ]}
              onPress={() => handleHotlineCall(hotline)}
            >
              <View style={styles.hotlineInfo}>
                <ThemedText type="headline" style={styles.hotlineName}>
                  {hotline.name}
                </ThemedText>
                <ThemedText style={[styles.hotlineDescription, { color: theme.textSecondary }]}>
                  {hotline.description}
                </ThemedText>
              </View>
              <View style={styles.hotlineAction}>
                <View style={[styles.hotlineNumberWrap, { backgroundColor: EMERGENCY_RED_LIGHT }]}>
                  <Feather name="phone" size={16} color={EMERGENCY_RED} />
                  <ThemedText style={[styles.hotlineNumber, { color: EMERGENCY_RED }]}>
                    {hotline.number}
                  </ThemedText>
                </View>
              </View>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(550).duration(300)}
          style={styles.section}
        >
          <ThemedText type="headline" style={[styles.sectionTitle, { color: theme.text }]}>
            Safety Tips
          </ThemedText>
          {SAFETY_TIPS.map((tip) => (
            <CollapsibleTip
              key={tip.id}
              tip={tip}
              isExpanded={expandedTipId === tip.id}
              onToggle={() => handleTipToggle(tip.id)}
            />
          ))}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600).duration(300)}
          style={[styles.footerCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
        >
          <Feather name="info" size={20} color={theme.textSecondary} />
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
            If you need additional support, our team is available around the clock to help keep you safe.
          </ThemedText>
        </Animated.View>
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
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  sosIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emergencyCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  emergencyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emergencyDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  emergencyButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emergencyButtonOutline: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emergencyButtonTextWhite: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  resourcesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -CARD_GAP / 2,
  },
  resourceCardWrapper: {
    width: "50%",
    paddingHorizontal: CARD_GAP / 2,
    marginBottom: CARD_GAP,
  },
  resourceCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 120,
  },
  resourceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  resourceDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  hotlineCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  hotlineDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  hotlineAction: {
    marginLeft: Spacing.md,
  },
  hotlineNumberWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  hotlineNumber: {
    fontSize: 13,
    fontWeight: "600",
  },
  tipItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    overflow: "hidden",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  tipTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  tipContentContainer: {
    overflow: "hidden",
  },
  tipContentInner: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    marginTop: -1,
  },
  tipContent: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: Spacing.md,
  },
  footerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
