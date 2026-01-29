import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  TextInput,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/query-client";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { LoadingIndicator } from "@/components/animations";

type BoostPostRouteParams = {
  BoostPost: {
    postId: string;
    postContent?: string;
    postMediaUrl?: string;
    postType?: string;
  };
};

const NET_WORTH_TIERS = [
  { id: "BUILDING", label: "Building", min: 0, max: 99999, color: "#6B7280" },
  { id: "SILVER", label: "Silver", min: 100000, max: 999999, color: "#9CA3AF" },
  { id: "GOLD", label: "Gold", min: 1000000, max: 9999999, color: "#F59E0B" },
  { id: "PLATINUM", label: "Platinum", min: 10000000, max: 99999999, color: "#818CF8" },
  { id: "DIAMOND", label: "Diamond", min: 100000000, max: null, color: "#60A5FA" },
];

const INTEREST_CATEGORIES = [
  "Luxury Lifestyle", "Investments", "Real Estate", "Yachts & Aviation",
  "Fine Dining", "Fashion", "Art", "Exotic Cars", "Watches", "Tech",
  "Wellness", "Entertainment", "Sports", "Philanthropy", "Crypto"
];

const BUDGET_OPTIONS = [
  { amount: 50, label: "R50", reach: "500-1K" },
  { amount: 100, label: "R100", reach: "1K-2K" },
  { amount: 250, label: "R250", reach: "2.5K-5K" },
  { amount: 500, label: "R500", reach: "5K-10K" },
  { amount: 1000, label: "R1,000", reach: "10K-20K" },
  { amount: 2500, label: "R2,500", reach: "25K-50K" },
];

const DURATION_OPTIONS = [
  { days: 1, label: "1 Day" },
  { days: 3, label: "3 Days" },
  { days: 7, label: "7 Days" },
  { days: 14, label: "14 Days" },
  { days: 30, label: "30 Days" },
];

// Auto-destination CTAs - these don't need a custom URL
const AUTO_CTAS = ['VISIT_PROFILE', 'VIEW_POST'];

const CTA_OPTIONS = [
  { id: "VISIT_PROFILE", label: "Visit Profile", icon: "user" as const, needsUrl: false },
  { id: "VIEW_POST", label: "View Post", icon: "file-text" as const, needsUrl: false },
  { id: "LEARN_MORE", label: "Learn More", icon: "info" as const, needsUrl: true },
  { id: "SHOP_NOW", label: "Shop Now", icon: "shopping-bag" as const, needsUrl: true },
  { id: "SIGN_UP", label: "Sign Up", icon: "user-plus" as const, needsUrl: true },
  { id: "CONTACT", label: "Contact", icon: "mail" as const, needsUrl: true },
  { id: "WATCH_MORE", label: "Watch More", icon: "play-circle" as const, needsUrl: true },
  { id: "BOOK_NOW", label: "Book Now", icon: "calendar" as const, needsUrl: true },
  { id: "GET_OFFER", label: "Get Offer", icon: "gift" as const, needsUrl: true },
  { id: "DOWNLOAD", label: "Download", icon: "download" as const, needsUrl: true },
  { id: "APPLY_NOW", label: "Apply Now", icon: "send" as const, needsUrl: true },
];

export default function BoostPostScreen() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<BoostPostRouteParams, "BoostPost">>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const { postId, postContent, postMediaUrl, postType } = route.params;

  const [selectedBudget, setSelectedBudget] = useState(BUDGET_OPTIONS[1]);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[2]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(["BUILDING", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customBudget, setCustomBudget] = useState("");
  const [selectedCTA, setSelectedCTA] = useState(CTA_OPTIONS[0]);
  const [destinationUrl, setDestinationUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  // URL validation helper
  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  };

  const handleUrlChange = (text: string) => {
    setDestinationUrl(text);
    if (text.trim() && !validateUrl(text)) {
      setUrlError("Please enter a valid URL (e.g., https://yoursite.com)");
    } else {
      setUrlError("");
    }
  };

  const { data: advertiserData, isLoading: advertiserLoading } = useQuery({
    queryKey: ["/api/ads/advertiser/me"],
    retry: false,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["/api/ads/wallet"],
    enabled: !!advertiserData,
  });

  const registerAdvertiserMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/ads/advertiser/register", {
        companyName: user?.displayName || user?.username,
        businessType: "INDIVIDUAL",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads/advertiser/me"] });
    },
  });

  const boostPostMutation = useMutation({
    mutationFn: async () => {
      const budget = customBudget ? parseInt(customBudget) : selectedBudget.amount;
      
      const payload: any = {
        postId,
        budget: budget * 100,
        durationDays: selectedDuration.days,
        callToAction: selectedCTA.id,
        targeting: {
          netWorthTiers: selectedTiers,
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        },
      };
      
      // Include destination URL for custom CTAs
      if (selectedCTA.needsUrl && destinationUrl.trim()) {
        payload.destinationUrl = destinationUrl.trim();
      }
      
      const response = await apiRequest("POST", "/api/ads/boost-post", payload);
      return response;
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        "Post Boosted!",
        "Your post is being reviewed and will start running soon.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      queryClient.invalidateQueries({ queryKey: ["/api/ads/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/campaigns"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to boost post");
    },
  });

  useEffect(() => {
    if (!advertiserLoading && !advertiserData) {
      registerAdvertiserMutation.mutate();
    }
  }, [advertiserLoading, advertiserData]);

  const toggleTier = (tierId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTiers(prev =>
      prev.includes(tierId)
        ? prev.filter(t => t !== tierId)
        : [...prev, tierId]
    );
  };

  const toggleInterest = (interest: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const walletBalance = ((walletData as any)?.balance || 0) / 100;
  const dailyBudget = customBudget ? parseInt(customBudget) : selectedBudget.amount;
  const totalCost = dailyBudget * selectedDuration.days;
  const hasEnoughBalance = walletBalance >= totalCost;

  const handleBoost = () => {
    if (!hasEnoughBalance) {
      Alert.alert(
        "Insufficient Balance",
        `You need R${totalCost} to boost this post for ${selectedDuration.days} day(s). Your balance is R${walletBalance.toFixed(2)}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Funds", onPress: () => navigation.navigate("AdWalletTopup") },
        ]
      );
      return;
    }

    if (selectedTiers.length === 0) {
      Alert.alert("Select Audience", "Please select at least one net worth tier to target.");
      return;
    }

    // Validate destination URL for custom CTAs
    if (selectedCTA.needsUrl) {
      if (!destinationUrl.trim()) {
        Alert.alert("Destination Required", `Please enter a website URL for your "${selectedCTA.label}" button.`);
        return;
      }
      if (!validateUrl(destinationUrl)) {
        Alert.alert("Invalid URL", "Please enter a valid website URL (e.g., https://yoursite.com)");
        return;
      }
    }

    const destinationInfo = selectedCTA.needsUrl && destinationUrl 
      ? `\nDestination: ${destinationUrl}` 
      : "";

    Alert.alert(
      "Confirm Boost",
      `Boost this post for ${selectedDuration.label} at R${dailyBudget}/day?\n\nTotal: R${totalCost}${destinationInfo}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Boost Now", onPress: () => boostPostMutation.mutate() },
      ]
    );
  };

  if (advertiserLoading || registerAdvertiserMutation.isPending) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <ThemedText style={styles.loadingText}>Setting up your advertiser account...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <ThemedText type="headline" style={styles.title}>Boost Post</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {postMediaUrl ? (
          <View style={[styles.postPreview, { backgroundColor: theme.backgroundSecondary }]}>
            <Image source={{ uri: postMediaUrl }} style={styles.postImage} />
            {postContent ? (
              <ThemedText numberOfLines={2} style={styles.postCaption}>{postContent}</ThemedText>
            ) : null}
          </View>
        ) : postContent ? (
          <View style={[styles.postPreview, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText numberOfLines={3} style={styles.postText}>{postContent}</ThemedText>
          </View>
        ) : null}

        <View style={[styles.walletCard, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.walletHeader}>
            <Feather name="credit-card" size={20} color={theme.primary} />
            <ThemedText weight="semiBold">Ad Wallet Balance</ThemedText>
          </View>
          <ThemedText type="title1" style={{ color: theme.primary }}>
            R{walletBalance.toFixed(2)}
          </ThemedText>
          <Pressable 
            style={[styles.addFundsButton, { borderColor: theme.primary }]}
            onPress={() => navigation.navigate("AdWalletTopup")}
          >
            <Feather name="plus" size={16} color={theme.primary} />
            <ThemedText style={{ color: theme.primary }}>Add Funds</ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText type="title3" style={styles.sectionTitle}>Daily Budget</ThemedText>
          <View style={styles.budgetGrid}>
            {BUDGET_OPTIONS.map((option) => (
              <Pressable
                key={option.amount}
                style={[
                  styles.budgetOption,
                  { 
                    backgroundColor: selectedBudget.amount === option.amount 
                      ? theme.primary 
                      : theme.backgroundSecondary,
                    borderColor: selectedBudget.amount === option.amount 
                      ? theme.primary 
                      : theme.glassBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedBudget(option);
                  setCustomBudget("");
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <ThemedText 
                  weight="bold" 
                  style={{ 
                    color: selectedBudget.amount === option.amount ? "#FFFFFF" : theme.text,
                    fontSize: 16,
                  }}
                >
                  {option.label}
                </ThemedText>
                <ThemedText 
                  style={{ 
                    color: selectedBudget.amount === option.amount ? "rgba(255,255,255,0.8)" : theme.textSecondary,
                    fontSize: 12,
                  }}
                >
                  ~{option.reach} reach
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={[styles.customBudgetContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={styles.customLabel}>Custom amount:</ThemedText>
            <View style={styles.customInputWrapper}>
              <ThemedText style={styles.currencyPrefix}>R</ThemedText>
              <TextInput
                style={[styles.customInput, { color: theme.text }]}
                placeholder="Enter amount"
                placeholderTextColor={theme.textTertiary}
                keyboardType="number-pad"
                value={customBudget}
                onChangeText={(text) => {
                  setCustomBudget(text.replace(/[^0-9]/g, ""));
                }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="title3" style={styles.sectionTitle}>Duration</ThemedText>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((option) => (
              <Pressable
                key={option.days}
                style={[
                  styles.durationOption,
                  {
                    backgroundColor: selectedDuration.days === option.days
                      ? theme.primary
                      : theme.backgroundSecondary,
                    borderColor: selectedDuration.days === option.days
                      ? theme.primary
                      : theme.glassBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedDuration(option);
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <ThemedText
                  weight="semiBold"
                  style={{
                    color: selectedDuration.days === option.days ? "#FFFFFF" : theme.text,
                  }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="title3" style={styles.sectionTitle}>Call to Action</ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            What should viewers do when they see your post?
          </ThemedText>
          <View style={styles.ctaGrid}>
            {CTA_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.ctaOption,
                  {
                    backgroundColor: selectedCTA.id === option.id
                      ? theme.primary
                      : theme.backgroundSecondary,
                    borderColor: selectedCTA.id === option.id
                      ? theme.primary
                      : theme.glassBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedCTA(option);
                  // Clear URL when switching to auto CTA
                  if (!option.needsUrl) {
                    setDestinationUrl("");
                    setUrlError("");
                  }
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Feather 
                  name={option.icon} 
                  size={16} 
                  color={selectedCTA.id === option.id ? "#FFFFFF" : theme.text} 
                />
                <ThemedText
                  weight="semiBold"
                  style={{
                    color: selectedCTA.id === option.id ? "#FFFFFF" : theme.text,
                    marginLeft: Spacing.xs,
                  }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          
          {/* Destination URL input for custom CTAs */}
          {selectedCTA.needsUrl ? (
            <View style={styles.urlInputContainer}>
              <ThemedText style={[styles.urlLabel, { color: theme.textSecondary }]}>
                Where should "{selectedCTA.label}" take viewers?
              </ThemedText>
              <View style={[
                styles.urlInputWrapper,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: urlError ? "#EF4444" : theme.glassBorder,
                }
              ]}>
                <Feather name="link" size={18} color={theme.textSecondary} />
                <TextInput
                  style={[styles.urlInput, { color: theme.text }]}
                  placeholder="https://yourwebsite.com"
                  placeholderTextColor={theme.textSecondary}
                  value={destinationUrl}
                  onChangeText={handleUrlChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
              {urlError ? (
                <ThemedText style={styles.urlError}>{urlError}</ThemedText>
              ) : (
                <ThemedText style={[styles.urlHint, { color: theme.textSecondary }]}>
                  Users will be taken to this URL when they tap the button
                </ThemedText>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <ThemedText type="title3" style={styles.sectionTitle}>Target Audience</ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Select net worth tiers to show your post to
          </ThemedText>
          <View style={styles.tiersGrid}>
            {NET_WORTH_TIERS.map((tier) => (
              <Pressable
                key={tier.id}
                style={[
                  styles.tierOption,
                  {
                    backgroundColor: selectedTiers.includes(tier.id)
                      ? `${tier.color}20`
                      : theme.backgroundSecondary,
                    borderColor: selectedTiers.includes(tier.id)
                      ? tier.color
                      : theme.glassBorder,
                    borderWidth: selectedTiers.includes(tier.id) ? 2 : 1,
                  },
                ]}
                onPress={() => toggleTier(tier.id)}
              >
                <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                <ThemedText weight="semiBold">{tier.label}</ThemedText>
                {selectedTiers.includes(tier.id) ? (
                  <Feather name="check" size={16} color={tier.color} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable 
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <ThemedText style={{ color: theme.primary }}>
            {showAdvanced ? "Hide" : "Show"} Advanced Targeting
          </ThemedText>
          <Feather 
            name={showAdvanced ? "chevron-up" : "chevron-down"} 
            size={18} 
            color={theme.primary} 
          />
        </Pressable>

        {showAdvanced ? (
          <View style={styles.section}>
            <ThemedText type="title3" style={styles.sectionTitle}>Interest Targeting</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Target users interested in specific categories (optional)
            </ThemedText>
            <View style={styles.interestsGrid}>
              {INTEREST_CATEGORIES.map((interest) => (
                <Pressable
                  key={interest}
                  style={[
                    styles.interestChip,
                    {
                      backgroundColor: selectedInterests.includes(interest)
                        ? theme.primary
                        : theme.backgroundSecondary,
                      borderColor: selectedInterests.includes(interest)
                        ? theme.primary
                        : theme.glassBorder,
                    },
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <ThemedText
                    style={{
                      color: selectedInterests.includes(interest) ? "#FFFFFF" : theme.text,
                      fontSize: 13,
                    }}
                  >
                    {interest}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="title3">Boost Summary</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Daily Budget</ThemedText>
            <ThemedText weight="semiBold">R{dailyBudget}/day</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Duration</ThemedText>
            <ThemedText weight="semiBold">{selectedDuration.label}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Target Tiers</ThemedText>
            <ThemedText weight="semiBold">{selectedTiers.length} selected</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Call to Action</ThemedText>
            <ThemedText weight="semiBold">{selectedCTA.label}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Est. Reach</ThemedText>
            <ThemedText weight="semiBold" style={{ color: theme.primary }}>
              {customBudget 
                ? `~${Math.round(parseInt(customBudget) * 20 * selectedDuration.days)}-${Math.round(parseInt(customBudget) * 40 * selectedDuration.days)}` 
                : `~${selectedBudget.reach}`}
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
          <View style={styles.summaryRow}>
            <ThemedText weight="bold">Total Cost</ThemedText>
            <ThemedText type="title1" style={{ color: theme.primary }}>
              R{totalCost}
            </ThemedText>
          </View>
          {!hasEnoughBalance ? (
            <ThemedText style={{ color: "#EF4444", marginTop: Spacing.xs, fontSize: 13 }}>
              Insufficient balance (R{walletBalance.toFixed(2)} available)
            </ThemedText>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          style={({ pressed }) => [
            styles.boostButton,
            !hasEnoughBalance && styles.boostButtonDisabled,
            pressed && { opacity: 0.9 },
          ]}
          onPress={handleBoost}
          disabled={boostPostMutation.isPending}
        >
          <LinearGradient
            colors={hasEnoughBalance ? Gradients.primary : ["#6B7280", "#4B5563"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.boostButtonGradient}
          >
            {boostPostMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="zap" size={20} color="#FFFFFF" />
                <ThemedText weight="bold" style={styles.boostButtonText}>
                  {hasEnoughBalance ? "Boost Now" : "Add Funds to Boost"}
                </ThemedText>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    opacity: 0.7,
  },
  postPreview: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  postCaption: {
    padding: Spacing.md,
    fontSize: 14,
  },
  postText: {
    padding: Spacing.lg,
    fontSize: 15,
    lineHeight: 22,
  },
  walletCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: -Spacing.sm,
  },
  budgetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  budgetOption: {
    flex: 1,
    minWidth: "30%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  customBudgetContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  customLabel: {
    fontSize: 14,
  },
  customInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: Spacing.xs,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  durationOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  ctaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  ctaOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  urlInputContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  urlLabel: {
    fontSize: 14,
  },
  urlInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  urlInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  urlError: {
    color: "#EF4444",
    fontSize: 12,
  },
  urlHint: {
    fontSize: 12,
  },
  tiersGrid: {
    gap: Spacing.sm,
  },
  tierOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  interestChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  summaryCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  boostButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  boostButtonDisabled: {
    opacity: 0.7,
  },
  boostButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  boostButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
