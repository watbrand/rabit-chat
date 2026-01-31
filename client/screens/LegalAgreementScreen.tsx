import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type RootStackParamList = {
  LegalAgreement: {
    fromSignup?: boolean;
    accountType?: string;
  };
  InterestSelection: undefined;
  MainTabs: undefined;
};

interface LegalDocument {
  type: "terms" | "privacy" | "guidelines";
  title: string;
  version: string;
  effectiveDate: string;
  content: string;
}

interface LegalResponse {
  currentVersion: string;
  documents: LegalDocument[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label: string;
  sublabel?: string;
  required?: boolean;
  onViewDocument?: () => void;
  documentAvailable?: boolean;
}

function Checkbox({
  checked,
  onPress,
  label,
  sublabel,
  required = true,
  onViewDocument,
  documentAvailable = true,
}: CheckboxProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    scale.value = withSpring(0.95, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 100);
    onPress();
  };

  return (
    <AnimatedPressable
      style={[styles.checkboxContainer, animatedStyle]}
      onPress={handlePress}
      testID={`checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked
              ? theme.primary
              : isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
            borderColor: checked
              ? theme.primary
              : isDark
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.1)",
          },
        ]}
      >
        {checked ? (
          <Feather name="check" size={14} color="white" />
        ) : null}
      </View>
      <View style={styles.checkboxContent}>
        <View style={styles.labelRow}>
          <ThemedText style={[styles.checkboxLabel, { color: theme.text }]}>
            {label}
          </ThemedText>
          {required ? (
            <ThemedText style={[styles.requiredBadge, { color: theme.error }]}>
              Required
            </ThemedText>
          ) : null}
        </View>
        {sublabel ? (
          <ThemedText style={[styles.checkboxSublabel, { color: theme.textSecondary }]}>
            {sublabel}
          </ThemedText>
        ) : null}
        {onViewDocument ? (
          <Pressable 
            onPress={onViewDocument} 
            style={styles.viewLink}
            testID={`view-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <ThemedText style={[styles.viewLinkText, { color: theme.primary }]}>
              {documentAvailable ? "Read full document" : "Loading..."}
            </ThemedText>
            <Feather name="external-link" size={12} color={theme.primary} />
          </Pressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

interface DocumentModalProps {
  visible: boolean;
  onClose: () => void;
  document: LegalDocument | null;
  isLoading: boolean;
}

function DocumentModal({ visible, onClose, document, isLoading }: DocumentModalProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: isDark ? "#1a1a2e" : "#F8F5FF" }]}>
        <View 
          style={[
            styles.modalHeader, 
            { 
              paddingTop: Platform.OS === 'ios' ? 20 : insets.top + 10,
              borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            }
          ]}
        >
          <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
            {document?.title || "Document"}
          </ThemedText>
          <Pressable onPress={onClose} style={styles.closeButton} testID="close-document-modal">
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.modalLoading}>
            <LoadingIndicator size="large" />
            <ThemedText style={[styles.modalLoadingText, { color: theme.textSecondary }]}>
              Loading document...
            </ThemedText>
          </View>
        ) : document ? (
          <ScrollView 
            style={styles.modalScroll}
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator
            scrollIndicatorInsets={{ bottom: insets.bottom }}
          >
            <View style={styles.documentMeta}>
              <ThemedText style={[styles.documentVersion, { color: theme.textSecondary }]}>
                Version {document.version} - Effective {document.effectiveDate}
              </ThemedText>
            </View>
            <ThemedText style={[styles.documentFullText, { color: theme.text }]}>
              {document.content}
            </ThemedText>
          </ScrollView>
        ) : (
          <View style={styles.modalLoading}>
            <Feather name="alert-circle" size={48} color={theme.error} />
            <ThemedText style={[styles.modalLoadingText, { color: theme.error }]}>
              Unable to load document
            </ThemedText>
            <ThemedText style={[styles.modalLoadingSubtext, { color: theme.textSecondary }]}>
              Please check your connection and try again
            </ThemedText>
          </View>
        )}
      </View>
    </Modal>
  );
}

export function LegalAgreementScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "LegalAgreement">>();
  const queryClient = useQueryClient();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buttonScale = useSharedValue(1);
  const fromSignup = route.params?.fromSignup ?? true;

  const { data: legalData, isLoading, error, refetch } = useQuery<LegalResponse>({
    queryKey: ["/api/legal/documents"],
    retry: 3,
    retryDelay: 1000,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/legal/accept", {
        termsAccepted,
        privacyAccepted,
        guidelinesAccepted,
        marketingOptIn,
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Invalidate queries in background - don't await
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }).catch(console.error);
      
      setIsSubmitting(false);
      
      // Navigate immediately
      try {
        if (fromSignup) {
          navigation.replace("InterestSelection");
        } else {
          navigation.replace("MainTabs");
        }
      } catch (navError) {
        console.error("[LegalAgreement] Navigation error:", navError);
        Alert.alert("Success", "Legal agreements accepted! Please restart the app to continue.");
      }
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      
      // Always continue - legal acceptance can be retried later
      if (fromSignup) {
        navigation.replace("InterestSelection");
      } else {
        navigation.replace("MainTabs");
      }
    },
  });

  const allRequiredAccepted = termsAccepted && privacyAccepted && guidelinesAccepted;

  const handleContinue = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!allRequiredAccepted) {
      buttonScale.value = withSequence(
        withSpring(0.95, { damping: 10 }),
        withSpring(1.02, { damping: 10 }),
        withSpring(1, { damping: 10 })
      );
      
      const missing: string[] = [];
      if (!termsAccepted) missing.push("Terms of Service");
      if (!privacyAccepted) missing.push("Privacy Policy");
      if (!guidelinesAccepted) missing.push("Community Guidelines");
      
      Alert.alert(
        "Required Agreements",
        `Please accept the following to continue:\n\n• ${missing.join("\n• ")}`,
        [{ text: "OK" }]
      );
      return;
    }

    setIsSubmitting(true);
    acceptMutation.mutate();
  };

  const handleViewDocument = (type: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDocument(type);
  };

  const getDocument = (type: string): LegalDocument | null => {
    if (!legalData?.documents) return null;
    return legalData.documents.find((d) => d.type === type) || null;
  };

  const selectedDoc = selectedDocument ? getDocument(selectedDocument) : null;

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  if (isLoading) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading legal documents...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (error && !legalData) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText style={[styles.errorTitle, { color: theme.text }]}>
            Unable to Load
          </ThemedText>
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            We couldn't load the legal documents.
          </ThemedText>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => refetch()}
          >
            <Feather name="refresh-cw" size={16} color="white" />
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientBackground />

      <DocumentModal
        visible={selectedDocument !== null}
        onClose={() => setSelectedDocument(null)}
        document={selectedDoc}
        isLoading={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
              <Feather name="shield" size={32} color={theme.primary} />
            </View>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              Legal Agreements
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Please review and accept our terms to join RabitChat
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.card,
              {
                backgroundColor: isDark
                  ? "rgba(38, 38, 48, 0.85)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.5)",
              },
            ]}
          >
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Required Agreements
            </ThemedText>

            <Checkbox
              checked={termsAccepted}
              onPress={() => setTermsAccepted(!termsAccepted)}
              label="Terms of Service"
              sublabel="Our rules for using RabitChat"
              onViewDocument={() => handleViewDocument("terms")}
              documentAvailable={!!getDocument("terms")}
            />

            <View style={styles.divider} />

            <Checkbox
              checked={privacyAccepted}
              onPress={() => setPrivacyAccepted(!privacyAccepted)}
              label="Privacy Policy"
              sublabel="How we protect and use your data (POPIA compliant)"
              onViewDocument={() => handleViewDocument("privacy")}
              documentAvailable={!!getDocument("privacy")}
            />

            <View style={styles.divider} />

            <Checkbox
              checked={guidelinesAccepted}
              onPress={() => setGuidelinesAccepted(!guidelinesAccepted)}
              label="Community Guidelines"
              sublabel="Standards for our elite community"
              onViewDocument={() => handleViewDocument("guidelines")}
              documentAvailable={!!getDocument("guidelines")}
            />
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.card,
              {
                backgroundColor: isDark
                  ? "rgba(38, 38, 48, 0.85)"
                  : "rgba(255, 255, 255, 0.7)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(255, 255, 255, 0.5)",
              },
            ]}
          >
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Optional
            </ThemedText>

            <Checkbox
              checked={marketingOptIn}
              onPress={() => setMarketingOptIn(!marketingOptIn)}
              label="Marketing Communications"
              sublabel="Receive exclusive updates, offers, and elite member perks"
              required={false}
            />
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <View style={styles.infoBox}>
            <Feather name="info" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              By continuing, you confirm you are at least 18 years old and agree to our terms.
            </ThemedText>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(500).springify()}
        style={[
          styles.bottomContainer,
          {
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: isDark
              ? "rgba(26, 26, 36, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          },
        ]}
      >
        <Pressable
          style={[
            styles.continueButton,
            {
              backgroundColor: allRequiredAccepted
                ? theme.primary
                : isDark
                ? "rgba(139, 92, 246, 0.3)"
                : "rgba(139, 92, 246, 0.2)",
              opacity: isSubmitting || acceptMutation.isPending ? 0.7 : 1,
            },
          ]}
          onPress={handleContinue}
          disabled={isSubmitting || acceptMutation.isPending}
          testID="continue-button"
        >
          {isSubmitting || acceptMutation.isPending ? (
            <LoadingIndicator size="small" />
          ) : (
            <>
              <ThemedText
                style={[
                  styles.continueButtonText,
                  { color: allRequiredAccepted ? "white" : theme.textSecondary },
                ]}
              >
                {allRequiredAccepted ? "Accept & Continue" : "Accept All to Continue"}
              </ThemedText>
              <Feather
                name="arrow-right"
                size={20}
                color={allRequiredAccepted ? "white" : theme.textSecondary}
              />
            </>
          )}
        </Pressable>

        <View style={styles.checklistIndicator}>
          <View
            style={[
              styles.checklistItem,
              { backgroundColor: termsAccepted ? theme.success : "rgba(128,128,128,0.3)" },
            ]}
          />
          <View
            style={[
              styles.checklistItem,
              { backgroundColor: privacyAccepted ? theme.success : "rgba(128,128,128,0.3)" },
            ]}
          />
          <View
            style={[
              styles.checklistItem,
              { backgroundColor: guidelinesAccepted ? theme.success : "rgba(128,128,128,0.3)" },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  retryButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  checkboxContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  requiredBadge: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  checkboxSublabel: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  viewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: Spacing.xs,
    paddingVertical: 4,
  },
  viewLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginVertical: Spacing.sm,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  continueButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  checklistIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.md,
  },
  checklistItem: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  documentMeta: {
    marginBottom: Spacing.lg,
  },
  documentVersion: {
    fontSize: 13,
    fontStyle: "italic",
  },
  documentFullText: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalLoadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    fontWeight: "500",
  },
  modalLoadingSubtext: {
    marginTop: Spacing.xs,
    fontSize: 14,
    textAlign: "center",
  },
});

export default LegalAgreementScreen;
