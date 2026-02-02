import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Haptics from "@/lib/safeHaptics";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import debounce from "lodash.debounce";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { GradientBackground } from "@/components/GradientBackground";
import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { LocationPicker } from "@/components/LocationPicker";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { validateEmail, validatePhone, formatPhoneAsTyping, validatePassword, PASSWORD_STRENGTH_COLORS } from "@/lib/validation";

interface UsernameCheckResult {
  available: boolean;
  suggestions?: string[];
}

interface LocationData {
  country: string;
  province: string;
  city: string;
}

type GenderType = "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | "PREFER_NOT_TO_SAY";

const GENDER_OPTIONS: { value: GenderType | ""; label: string }[] = [
  { value: "", label: "Select Gender (Optional)" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-Binary" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer Not to Say" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PersonalSignupScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { setUserDirectly } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [useEmail, setUseEmail] = useState(true);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [gender, setGender] = useState<GenderType | "">("");
  const [location, setLocation] = useState<LocationData | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const buttonScale = useSharedValue(1);

  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL(`/api/auth/check-username?username=${encodeURIComponent(usernameToCheck)}`, baseUrl);
      const response = await fetch(url.toString(), { credentials: "include" });

      if (response.ok) {
        const result: UsernameCheckResult = await response.json();
        setUsernameAvailable(result.available);
        setUsernameSuggestions(result.suggestions || []);
      }
    } catch (error) {
      console.error("Username availability check failed:", error);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  const debouncedCheckUsername = useRef(
    debounce((usernameToCheck: string) => {
      checkUsernameAvailability(usernameToCheck);
    }, 300)
  ).current;

  useEffect(() => {
    return () => {
      debouncedCheckUsername.cancel();
    };
  }, [debouncedCheckUsername]);

  const handleUsernameChange = (text: string) => {
    const sanitized = text.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(sanitized);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    setErrors((prev) => ({ ...prev, username: "" }));

    if (sanitized.length >= 3) {
      debouncedCheckUsername(sanitized);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameAvailable(true);
    setUsernameSuggestions([]);
    Haptics.selectionAsync();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleToggleContactMethod = () => {
    setUseEmail(!useEmail);
    setEmail("");
    setPhoneNumber("");
    setErrors((prev) => ({ ...prev, email: "", phoneNumber: "" }));
    Haptics.selectionAsync();
  };

  const handleLocationChange = useCallback((loc: LocationData) => {
    setLocation(loc);
    setErrors((prev) => ({ ...prev, location: "" }));
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthday(selectedDate);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (usernameAvailable === false) {
      newErrors.username = "This username is taken";
    }

    if (useEmail) {
      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(email)) {
        newErrors.email = "Please enter a valid email";
      }
    } else {
      if (!phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!validatePhone(phoneNumber).isValid) {
        newErrors.phoneNumber = "Please enter a valid South African phone number (+27 or 0xx)";
      }
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    if (!location || !location.country || !location.province || !location.city) {
      newErrors.location = "Location is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    try {
      const signupData: Record<string, any> = {
        username,
        displayName: displayName.trim(),
        password,
        category: "PERSONAL",
        country: location?.country,
        province: location?.province,
        city: location?.city,
      };

      if (useEmail) {
        signupData.email = email.trim();
      } else {
        signupData.phoneNumber = phoneNumber.trim();
      }

      if (birthday) {
        signupData.birthday = birthday.toISOString();
      }

      if (gender) {
        signupData.gender = gender;
      }

      const response = await apiRequest("POST", "/api/auth/signup", signupData);
      const userData = await response.json();

      // Set user directly from the response to avoid cookie timing issues
      setUserDirectly(userData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // In development mode, if OTP services failed, skip verification
      if (userData.skipVerification) {
        navigation.navigate("LegalAgreement", { fromSignup: true });
      } else {
        navigation.navigate("VerifyOTP", { 
          email: useEmail ? email.trim() : undefined,
          phoneNumber: !useEmail ? phoneNumber.trim() : undefined,
          verificationType: useEmail ? "email" : "phone" 
        });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Signup Failed", error.message || "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getGenderLabel = (value: string): string => {
    const option = GENDER_OPTIONS.find((o) => o.value === value);
    return option?.label || "Select Gender (Optional)";
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    testID: string,
    options: {
      icon?: string;
      error?: string;
      secureTextEntry?: boolean;
      keyboardType?: "default" | "email-address" | "phone-pad";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      showPasswordToggle?: boolean;
      rightComponent?: React.ReactNode;
    } = {}
  ) => {
    const {
      icon,
      error,
      secureTextEntry,
      keyboardType = "default",
      autoCapitalize = "none",
      showPasswordToggle,
      rightComponent,
    } = options;

    return (
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.inputBlur,
              {
                borderColor: error
                  ? theme.error
                  : isDark
                  ? "rgba(139, 92, 246, 0.20)"
                  : "rgba(255, 255, 255, 0.6)",
              },
            ]}
          >
            <View style={styles.inputInner}>
              {icon ? (
                <Feather
                  name={icon as any}
                  size={20}
                  color={value ? theme.primary : theme.textTertiary}
                  style={styles.inputIcon}
                />
              ) : null}
              <TextInput
                testID={testID}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    fontFamily: "Poppins_400Regular",
                  },
                ]}
                placeholder={placeholder}
                placeholderTextColor={theme.textTertiary}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !showPassword}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
              />
              {showPasswordToggle ? (
                <Pressable
                  testID={`${testID}-toggle`}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={12}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              ) : null}
              {rightComponent}
            </View>
          </BlurView>
        </View>
        {error ? (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={14} color={theme.error} />
            <ThemedText style={[styles.errorText, { color: theme.error }]}>
              {error}
            </ThemedText>
          </View>
        ) : null}
      </View>
    );
  };

  const renderUsernameStatus = () => {
    if (username.length < 3) return null;

    if (isCheckingUsername) {
      return (
        <LoadingIndicator size="small" />
      );
    }

    if (usernameAvailable === true) {
      return <Feather name="check-circle" size={20} color={theme.success} />;
    }

    if (usernameAvailable === false) {
      return <Feather name="x-circle" size={20} color={theme.error} />;
    }

    return null;
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
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        bottomOffset={80}
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
            <Feather name="user" size={32} color="#FFFFFF" />
          </LinearGradient>
          <ThemedText
            style={[styles.title, { fontFamily: "Poppins_700Bold" }]}
          >
            Personal Elite
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Join the exclusive network
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={styles.formContainer}
        >
          {renderInput(
            "Display Name",
            displayName,
            (text) => {
              setDisplayName(text);
              setErrors((prev) => ({ ...prev, displayName: "" }));
            },
            "input-display-name",
            {
              icon: "user",
              error: errors.displayName,
              autoCapitalize: "words",
            }
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? "dark" : "light"}
                style={[
                  styles.inputBlur,
                  {
                    borderColor: errors.username
                      ? theme.error
                      : usernameAvailable === true
                      ? theme.success
                      : usernameAvailable === false
                      ? theme.error
                      : isDark
                      ? "rgba(139, 92, 246, 0.20)"
                      : "rgba(255, 255, 255, 0.6)",
                  },
                ]}
              >
                <View style={styles.inputInner}>
                  <Feather
                    name="at-sign"
                    size={20}
                    color={username ? theme.primary : theme.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    testID="input-username"
                    style={[
                      styles.input,
                      { color: theme.text, fontFamily: "Poppins_400Regular" },
                    ]}
                    placeholder="Username"
                    placeholderTextColor={theme.textTertiary}
                    value={username}
                    onChangeText={handleUsernameChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {renderUsernameStatus()}
                </View>
              </BlurView>
            </View>
            {errors.username ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={theme.error} />
                <ThemedText style={[styles.errorText, { color: theme.error }]}>
                  {errors.username}
                </ThemedText>
              </View>
            ) : null}
            {usernameAvailable === false && usernameSuggestions.length > 0 ? (
              <View style={styles.suggestionsContainer}>
                <ThemedText
                  style={[styles.suggestionsLabel, { color: theme.textSecondary }]}
                >
                  Try:
                </ThemedText>
                <View style={styles.suggestionsRow}>
                  {usernameSuggestions.slice(0, 3).map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      testID={`suggestion-${suggestion}`}
                      style={[
                        styles.suggestionChip,
                        {
                          backgroundColor: isDark
                            ? "rgba(139, 92, 246, 0.15)"
                            : "rgba(139, 92, 246, 0.10)",
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => handleSuggestionSelect(suggestion)}
                    >
                      <ThemedText
                        style={[styles.suggestionText, { color: theme.primary }]}
                      >
                        {suggestion}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.toggleContainer}>
            <ThemedText
              style={[styles.toggleLabel, { color: theme.textSecondary }]}
            >
              Contact Method
            </ThemedText>
            <Pressable
              testID="toggle-contact-method"
              onPress={handleToggleContactMethod}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isDark
                    ? "rgba(139, 92, 246, 0.15)"
                    : "rgba(139, 92, 246, 0.10)",
                },
              ]}
            >
              <View
                style={[
                  styles.toggleOption,
                  useEmail && styles.toggleOptionActive,
                  useEmail && { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText
                  style={[
                    styles.toggleText,
                    { color: useEmail ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  Email
                </ThemedText>
              </View>
              <View
                style={[
                  styles.toggleOption,
                  !useEmail && styles.toggleOptionActive,
                  !useEmail && { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText
                  style={[
                    styles.toggleText,
                    { color: !useEmail ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  Phone
                </ThemedText>
              </View>
            </Pressable>
          </View>

          {useEmail
            ? renderInput(
                "Email Address",
                email,
                (text) => {
                  setEmail(text);
                  setErrors((prev) => ({ ...prev, email: "" }));
                },
                "input-email",
                {
                  icon: "mail",
                  error: errors.email,
                  keyboardType: "email-address",
                }
              )
            : renderInput(
                "Phone Number",
                phoneNumber,
                (text) => {
                  setPhoneNumber(formatPhoneAsTyping(text));
                  setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                },
                "input-phone",
                {
                  icon: "phone",
                  error: errors.phoneNumber,
                  keyboardType: "phone-pad",
                }
              )}

          {renderInput(
            "Password (min 8 characters)",
            password,
            (text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: "" }));
            },
            "input-password",
            {
              icon: "lock",
              error: errors.password,
              secureTextEntry: true,
              showPasswordToggle: true,
            }
          )}

          <ThemedText
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Optional Information
          </ThemedText>

          <View style={styles.inputContainer}>
            <Pressable
              testID="input-birthday"
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? "dark" : "light"}
                style={[
                  styles.inputBlur,
                  {
                    borderColor: isDark
                      ? "rgba(139, 92, 246, 0.20)"
                      : "rgba(255, 255, 255, 0.6)",
                  },
                ]}
              >
                <View style={styles.inputInner}>
                  <Feather
                    name="calendar"
                    size={20}
                    color={birthday ? theme.primary : theme.textTertiary}
                    style={styles.inputIcon}
                  />
                  <ThemedText
                    style={[
                      styles.pickerText,
                      {
                        color: birthday ? theme.text : theme.textTertiary,
                        fontFamily: "Poppins_400Regular",
                      },
                    ]}
                  >
                    {birthday ? formatDate(birthday) : "Birthday (Optional)"}
                  </ThemedText>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              </BlurView>
            </Pressable>
          </View>

          <View style={styles.inputContainer}>
            <Pressable
              testID="input-gender"
              onPress={() => setShowGenderPicker(true)}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? "dark" : "light"}
                style={[
                  styles.inputBlur,
                  {
                    borderColor: isDark
                      ? "rgba(139, 92, 246, 0.20)"
                      : "rgba(255, 255, 255, 0.6)",
                  },
                ]}
              >
                <View style={styles.inputInner}>
                  <Feather
                    name="users"
                    size={20}
                    color={gender ? theme.primary : theme.textTertiary}
                    style={styles.inputIcon}
                  />
                  <ThemedText
                    style={[
                      styles.pickerText,
                      {
                        color: gender ? theme.text : theme.textTertiary,
                        fontFamily: "Poppins_400Regular",
                      },
                    ]}
                  >
                    {getGenderLabel(gender)}
                  </ThemedText>
                  <Feather
                    name="chevron-down"
                    size={20}
                    color={theme.textSecondary}
                  />
                </View>
              </BlurView>
            </Pressable>
          </View>

          <ThemedText
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Location
          </ThemedText>

          <LocationPicker
            onLocationChange={handleLocationChange}
            label=""
            containerStyle={styles.locationPicker}
          />
          {errors.location ? (
            <View style={[styles.errorRow, { marginTop: -Spacing.sm }]}>
              <Feather name="alert-circle" size={14} color={theme.error} />
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {errors.location}
              </ThemedText>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.submitContainer}
        >
          <AnimatedPressable
            testID="button-submit"
            onPress={handleSubmit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isLoading}
            style={[
              buttonAnimatedStyle,
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <LoadingIndicator size="small" />
              ) : (
                <>
                  <ThemedText
                    style={[
                      styles.submitText,
                      { fontFamily: "Poppins_600SemiBold" },
                    ]}
                  >
                    Create Account
                  </ThemedText>
                  <Feather name="arrow-right" size={20} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>

          <ThemedText
            style={[styles.termsText, { color: theme.textTertiary }]}
          >
            By signing up, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>

      {showDatePicker && Platform.OS === "ios" ? (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalDismiss}
              onPress={() => setShowDatePicker(false)}
            />
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? "dark" : "light"}
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark
                    ? "rgba(26, 26, 36, 0.85)"
                    : "rgba(255, 255, 255, 0.92)",
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="headline">Select Birthday</ThemedText>
                <Pressable
                  testID="birthday-modal-close"
                  onPress={() => setShowDatePicker(false)}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <DateTimePicker
                testID="birthday-picker"
                value={birthday || new Date(2000, 0, 1)}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
                textColor={theme.text}
                style={styles.datePicker}
              />
              <Pressable
                testID="birthday-done-button"
                style={[styles.modalDoneButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <ThemedText style={styles.modalDoneText}>Done</ThemedText>
              </Pressable>
            </BlurView>
          </View>
        </Modal>
      ) : null}

      {showDatePicker && Platform.OS === "android" ? (
        <DateTimePicker
          testID="birthday-picker"
          value={birthday || new Date(2000, 0, 1)}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      ) : null}

      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismiss}
            onPress={() => setShowGenderPicker(false)}
          />
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? "dark" : "light"}
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark
                    ? "rgba(26, 26, 36, 0.85)"
                    : "rgba(255, 255, 255, 0.92)",
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="headline">Select Gender</ThemedText>
                <Pressable
                  testID="gender-modal-close"
                  onPress={() => setShowGenderPicker(false)}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Picker
                testID="gender-picker"
                selectedValue={gender}
                onValueChange={(value: GenderType | "") => setGender(value)}
                style={styles.picker}
                itemStyle={{ color: theme.text, fontSize: 18 }}
              >
                {GENDER_OPTIONS.map((option) => (
                  <Picker.Item
                    key={option.value || "empty"}
                    label={option.label}
                    value={option.value}
                    color={option.value ? theme.text : theme.textTertiary}
                  />
                ))}
              </Picker>
              <Pressable
                testID="gender-done-button"
                style={[styles.modalDoneButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowGenderPicker(false)}
              >
                <ThemedText style={styles.modalDoneText}>Done</ThemedText>
              </Pressable>
            </BlurView>
          ) : (
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#1A1A24" : "#FFFFFF" },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="headline">Select Gender</ThemedText>
                <Pressable
                  testID="gender-modal-close"
                  onPress={() => setShowGenderPicker(false)}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Picker
                testID="gender-picker"
                selectedValue={gender}
                onValueChange={(value: GenderType | "") => setGender(value)}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.primary}
                mode="dropdown"
              >
                {GENDER_OPTIONS.map((option) => (
                  <Picker.Item
                    key={option.value || "empty"}
                    label={option.label}
                    value={option.value}
                    color={isDark ? "#FFFFFF" : "#1D1D1F"}
                  />
                ))}
              </Picker>
              <Pressable
                testID="gender-done-button"
                style={[styles.modalDoneButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowGenderPicker(false)}
              >
                <ThemedText style={styles.modalDoneText}>Done</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
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
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  formContainer: {
    gap: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    overflow: "hidden",
    borderRadius: BorderRadius.lg,
  },
  inputBlur: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputInner: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.xs,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
  },
  suggestionsContainer: {
    marginTop: Spacing.sm,
  },
  suggestionsLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  toggleContainer: {
    marginBottom: Spacing.sm,
  },
  toggleLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  toggleButton: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  toggleOptionActive: {},
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 14,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    marginLeft: 2,
  },
  locationPicker: {
    marginBottom: Spacing.md,
  },
  submitContainer: {
    marginTop: Spacing["2xl"],
    gap: Spacing.lg,
  },
  submitButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  datePicker: {
    height: 200,
    width: "100%",
  },
  picker: {
    width: "100%",
    height: 200,
  },
  modalDoneButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  modalDoneText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
