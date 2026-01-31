import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

type RootStackParamList = {
  VerifyOTP: {
    email?: string;
    phoneNumber?: string;
    verificationType: "email" | "phone";
  };
  LegalAgreement: { fromSignup?: boolean };
};

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "VerifyOTP">>();

  const { email, phoneNumber, verificationType } = route.params || {};
  const contactMethod = verificationType === "email" ? email : phoneNumber;
  const maskedContact = maskContact(contactMethod || "", verificationType);

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 500);
    return () => clearTimeout(timer);
  }, []);

  function maskContact(contact: string, type: "email" | "phone"): string {
    if (!contact) return "";
    if (type === "email") {
      const [local, domain] = contact.split("@");
      if (!local || !domain) return contact;
      const masked = local.slice(0, 2) + "***" + local.slice(-1);
      return `${masked}@${domain}`;
    } else {
      if (contact.length < 6) return contact;
      return contact.slice(0, 3) + "****" + contact.slice(-3);
    }
  }

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    
    if (value.length > 1) {
      const digits = value.split("").slice(0, OTP_LENGTH - index);
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      Alert.alert("Invalid Code", "Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      const endpoint = verificationType === "email" 
        ? "/api/auth/verify-email" 
        : "/api/auth/verify-phone";
      
      await apiRequest("POST", endpoint, { code });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      navigation.replace("LegalAgreement", { fromSignup: true });
    } catch (error: any) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        "Verification Failed",
        error.message || "Invalid or expired code. Please try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      const endpoint = verificationType === "email"
        ? "/api/auth/send-verification"
        : "/api/auth/send-phone-verification";
      
      await apiRequest("POST", endpoint, {});

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert("Code Sent", `A new verification code has been sent to ${maskedContact}`);
      setResendCooldown(60);
      setOtp(new Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Error", error.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const isComplete = otp.every((digit) => digit !== "");

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <GradientBackground variant="mesh" style={styles.container}>
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

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing["3xl"] + 100 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={80}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View
          entering={FadeInUp.delay(100).springify()}
          style={styles.titleContainer}
        >
          <LinearGradient
            colors={["#8B5CF6", "#A78BFA"]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="shield" size={32} color="#FFFFFF" />
          </LinearGradient>
          <ThemedText
            style={[styles.title, { fontFamily: "Poppins_700Bold" }]}
          >
            Verify Your {verificationType === "email" ? "Email" : "Phone"}
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            We sent a 6-digit code to{"\n"}
            <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
              {maskedContact}
            </ThemedText>
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.otpContainer}
        >
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputWrapper}>
                <BlurView
                  intensity={isDark ? 40 : 60}
                  tint={isDark ? "dark" : "light"}
                  style={[
                    styles.otpBlur,
                    {
                      borderColor: digit
                        ? theme.primary
                        : isDark
                        ? "rgba(139, 92, 246, 0.20)"
                        : "rgba(255, 255, 255, 0.6)",
                    },
                  ]}
                >
                  <TextInput
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    testID={`otp-input-${index}`}
                    style={[
                      styles.otpInput,
                      {
                        color: theme.text,
                        fontFamily: "Poppins_600SemiBold",
                      },
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={6}
                    selectTextOnFocus
                  />
                </BlurView>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify()}>
          <Animated.View style={buttonAnimatedStyle}>
            <Pressable
              testID="verify-button"
              style={[
                styles.verifyButton,
                {
                  backgroundColor: isComplete
                    ? theme.primary
                    : isDark
                    ? "rgba(139, 92, 246, 0.3)"
                    : "rgba(139, 92, 246, 0.2)",
                  opacity: isVerifying ? 0.7 : 1,
                },
              ]}
              onPress={handleVerify}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!isComplete || isVerifying}
            >
              {isVerifying ? (
                <LoadingIndicator size="small" />
              ) : (
                <>
                  <ThemedText
                    style={[
                      styles.verifyButtonText,
                      { color: isComplete ? "white" : theme.textSecondary },
                    ]}
                  >
                    Verify & Continue
                  </ThemedText>
                  <Feather
                    name="arrow-right"
                    size={20}
                    color={isComplete ? "white" : theme.textSecondary}
                  />
                </>
              )}
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.resendContainer}
        >
          <ThemedText style={[styles.resendLabel, { color: theme.textSecondary }]}>
            Didn't receive the code?
          </ThemedText>
          <Pressable
            testID="resend-button"
            onPress={handleResend}
            disabled={resendCooldown > 0 || isResending}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {isResending ? (
              <LoadingIndicator size="small" />
            ) : (
              <ThemedText
                style={[
                  styles.resendText,
                  {
                    color: resendCooldown > 0 ? theme.textTertiary : theme.primary,
                  },
                ]}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </ThemedText>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(500).springify()}
          style={styles.infoContainer}
        >
          <Feather name="info" size={16} color={theme.textTertiary} />
          <ThemedText style={[styles.infoText, { color: theme.textTertiary }]}>
            Check your {verificationType === "email" ? "inbox and spam folder" : "messages"} for the verification code.
          </ThemedText>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  otpContainer: {
    marginBottom: Spacing.xl,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  otpInputWrapper: {
    width: 48,
    height: 56,
  },
  otpBlur: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  otpInput: {
    width: "100%",
    height: "100%",
    fontSize: 24,
    textAlign: "center",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  verifyButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  resendLabel: {
    fontSize: 14,
  },
  resendText: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginTop: Spacing["2xl"],
    padding: Spacing.md,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
