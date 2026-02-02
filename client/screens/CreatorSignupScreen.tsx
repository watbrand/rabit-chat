import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Modal,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Haptics from "@/lib/safeHaptics";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { validateEmail, validatePhone, formatPhoneAsTyping, validatePassword } from "@/lib/validation";

interface UsernameCheckResult {
  available: boolean;
  suggestions?: string[];
}

interface LocationData {
  country: string;
  province: string;
  city: string;
}

type CreatorCategoryType =
  | "INFLUENCER"
  | "ARTIST_MUSICIAN"
  | "PHOTOGRAPHER"
  | "VIDEOGRAPHER"
  | "BLOGGER"
  | "DJ_PRODUCER"
  | "COMEDIAN"
  | "PUBLIC_FIGURE"
  | "GAMER_STREAMER"
  | "EDUCATOR"
  | "FASHION_MODEL"
  | "FITNESS_COACH"
  | "BEAUTY_MAKEUP"
  | "BUSINESS_CREATOR"
  | "OTHER";

const CREATOR_CATEGORIES: { value: CreatorCategoryType | ""; label: string }[] = [
  { value: "", label: "Select Creator Category" },
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

const PLATFORM_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter",
  "Facebook",
  "LinkedIn",
  "Twitch",
  "Spotify",
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CreatorSignupScreen() {
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
  const [location, setLocation] = useState<LocationData | null>(null);

  const [creatorCategory, setCreatorCategory] = useState<CreatorCategoryType | "">("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [contentLanguage, setContentLanguage] = useState("");
  const [contentTags, setContentTags] = useState("");
  const [hasManagement, setHasManagement] = useState(false);
  const [managementName, setManagementName] = useState("");
  const [showLocationPublicly, setShowLocationPublicly] = useState(false);

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

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

  const handlePlatformToggle = (platform: string) => {
    Haptics.selectionAsync();
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
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

    if (!creatorCategory) {
      newErrors.creatorCategory = "Please select a creator category";
    }

    if (!location || !location.country || !location.province || !location.city) {
      newErrors.location = "Location is required";
    }

    if (bio.length > 500) {
      newErrors.bio = "Bio must be 500 characters or less";
    }

    if (portfolioUrl && !/^https?:\/\/.+/.test(portfolioUrl)) {
      newErrors.portfolioUrl = "Please enter a valid URL";
    }

    if (hasManagement && !managementName.trim()) {
      newErrors.managementName = "Management name is required when enabled";
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
        category: "CREATOR",
        country: location?.country,
        province: location?.province,
        city: location?.city,
        creatorCategory,
        showLocationPublicly,
      };

      if (useEmail) {
        signupData.email = email.trim();
      } else {
        signupData.phoneNumber = phoneNumber.trim();
      }

      if (bio.trim()) {
        signupData.bio = bio.trim();
      }

      if (portfolioUrl.trim()) {
        signupData.portfolioUrl = portfolioUrl.trim();
      }

      if (selectedPlatforms.length > 0) {
        signupData.primaryPlatforms = selectedPlatforms;
      }

      if (contentLanguage.trim()) {
        signupData.contentLanguage = contentLanguage.trim();
      }

      if (contentTags.trim()) {
        signupData.contentTags = contentTags.split(",").map((t) => t.trim()).filter(Boolean);
      }

      if (hasManagement) {
        signupData.hasManagement = true;
        signupData.managementName = managementName.trim();
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

  const getCategoryLabel = (value: string): string => {
    const option = CREATOR_CATEGORIES.find((o) => o.value === value);
    return option?.label || "Select Creator Category";
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
      keyboardType?: "default" | "email-address" | "phone-pad" | "url";
      autoCapitalize?: "none" | "sentences" | "words" | "characters";
      showPasswordToggle?: boolean;
      rightComponent?: React.ReactNode;
      multiline?: boolean;
      maxLength?: number;
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
      multiline,
      maxLength,
    } = options;

    return (
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <BlurView
            intensity={isDark ? 40 : 60}
            tint={isDark ? "dark" : "light"}
            style={[
              styles.inputBlur,
              multiline && styles.inputBlurMultiline,
              {
                borderColor: error
                  ? theme.error
                  : isDark
                  ? "rgba(139, 92, 246, 0.20)"
                  : "rgba(255, 255, 255, 0.6)",
              },
            ]}
          >
            <View style={[styles.inputInner, multiline && styles.inputInnerMultiline]}>
              {icon ? (
                <Feather
                  name={icon as any}
                  size={20}
                  color={value ? theme.primary : theme.textTertiary}
                  style={[styles.inputIcon, multiline && styles.inputIconMultiline]}
                />
              ) : null}
              <TextInput
                testID={testID}
                style={[
                  styles.input,
                  multiline && styles.inputMultiline,
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
                multiline={multiline}
                maxLength={maxLength}
                textAlignVertical={multiline ? "top" : "center"}
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
        {maxLength && value.length > 0 ? (
          <ThemedText style={[styles.charCount, { color: theme.textTertiary }]}>
            {value.length}/{maxLength}
          </ThemedText>
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

  const renderToggle = (
    label: string,
    value: boolean,
    onValueChange: (val: boolean) => void,
    testID: string,
    description?: string
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <ThemedText style={[styles.toggleLabel, { fontFamily: "Poppins_500Medium" }]}>
          {label}
        </ThemedText>
        {description ? (
          <ThemedText style={[styles.toggleDescription, { color: theme.textSecondary }]}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={(val) => {
          Haptics.selectionAsync();
          onValueChange(val);
        }}
        trackColor={{ false: theme.backgroundTertiary, true: theme.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

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
            colors={["#EC4899", "#F472B6"]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="star" size={32} color="#FFFFFF" />
          </LinearGradient>
          <ThemedText
            style={[styles.title, { fontFamily: "Poppins_700Bold" }]}
          >
            Creator Account
          </ThemedText>
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Build your audience and showcase your talent
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
              style={[styles.sectionLabelSmall, { color: theme.textSecondary }]}
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
            Creator Information
          </ThemedText>

          <View style={styles.inputContainer}>
            <Pressable
              testID="input-creator-category"
              onPress={() => setShowCategoryPicker(true)}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? "dark" : "light"}
                style={[
                  styles.inputBlur,
                  {
                    borderColor: errors.creatorCategory
                      ? theme.error
                      : isDark
                      ? "rgba(139, 92, 246, 0.20)"
                      : "rgba(255, 255, 255, 0.6)",
                  },
                ]}
              >
                <View style={styles.inputInner}>
                  <Feather
                    name="award"
                    size={20}
                    color={creatorCategory ? theme.primary : theme.textTertiary}
                    style={styles.inputIcon}
                  />
                  <ThemedText
                    style={[
                      styles.pickerText,
                      {
                        color: creatorCategory ? theme.text : theme.textTertiary,
                        fontFamily: "Poppins_400Regular",
                      },
                    ]}
                  >
                    {getCategoryLabel(creatorCategory)}
                  </ThemedText>
                  <Feather name="chevron-down" size={20} color={theme.textSecondary} />
                </View>
              </BlurView>
            </Pressable>
            {errors.creatorCategory ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={theme.error} />
                <ThemedText style={[styles.errorText, { color: theme.error }]}>
                  {errors.creatorCategory}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {renderInput(
            "Bio (optional)",
            bio,
            (text) => {
              setBio(text);
              setErrors((prev) => ({ ...prev, bio: "" }));
            },
            "input-bio",
            {
              icon: "file-text",
              error: errors.bio,
              autoCapitalize: "sentences",
              multiline: true,
              maxLength: 500,
            }
          )}

          {renderInput(
            "Portfolio URL (optional)",
            portfolioUrl,
            (text) => {
              setPortfolioUrl(text);
              setErrors((prev) => ({ ...prev, portfolioUrl: "" }));
            },
            "input-portfolio-url",
            {
              icon: "link",
              error: errors.portfolioUrl,
              keyboardType: "url",
            }
          )}

          <ThemedText
            style={[styles.sectionLabelSmall, { color: theme.textSecondary }]}
          >
            Primary Platforms (optional)
          </ThemedText>
          <View style={styles.platformsContainer}>
            {PLATFORM_OPTIONS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform);
              return (
                <Pressable
                  key={platform}
                  testID={`platform-chip-${platform.toLowerCase()}`}
                  onPress={() => handlePlatformToggle(platform)}
                  style={[
                    styles.platformChip,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(236, 72, 153, 0.25)"
                          : "rgba(236, 72, 153, 0.15)"
                        : isDark
                        ? "rgba(139, 92, 246, 0.12)"
                        : "rgba(139, 92, 246, 0.08)",
                      borderColor: isSelected ? theme.pink : "transparent",
                      borderWidth: isSelected ? 1 : 0,
                    },
                  ]}
                >
                  {isSelected ? (
                    <Feather name="check" size={14} color={theme.pink} style={{ marginRight: 4 }} />
                  ) : null}
                  <ThemedText
                    style={[
                      styles.platformChipText,
                      { color: isSelected ? theme.pink : theme.text },
                    ]}
                  >
                    {platform}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {renderInput(
            "Content Language (optional)",
            contentLanguage,
            setContentLanguage,
            "input-content-language",
            {
              icon: "globe",
              autoCapitalize: "words",
            }
          )}

          {renderInput(
            "Content Tags - comma separated (optional)",
            contentTags,
            setContentTags,
            "input-content-tags",
            {
              icon: "hash",
            }
          )}

          <ThemedText
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Settings
          </ThemedText>

          {renderToggle(
            "Has Management",
            hasManagement,
            setHasManagement,
            "toggle-has-management",
            "Are you represented by a management team?"
          )}

          {hasManagement ? (
            renderInput(
              "Management Name",
              managementName,
              (text) => {
                setManagementName(text);
                setErrors((prev) => ({ ...prev, managementName: "" }));
              },
              "input-management-name",
              {
                icon: "users",
                error: errors.managementName,
                autoCapitalize: "words",
              }
            )
          ) : null}

          {renderToggle(
            "Show Location Publicly",
            showLocationPublicly,
            setShowLocationPublicly,
            "toggle-show-location",
            "Display your location on your profile"
          )}

          <ThemedText
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            Location
          </ThemedText>

          <LocationPicker
            onLocationChange={handleLocationChange}
            containerStyle={styles.locationPicker}
            label="Your Location"
          />
          {errors.location ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={14} color={theme.error} />
              <ThemedText style={[styles.errorText, { color: theme.error }]}>
                {errors.location}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.submitContainer}>
            <AnimatedPressable
              testID="button-submit"
              onPress={handleSubmit}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isLoading}
              style={[
                styles.submitButton,
                buttonAnimatedStyle,
                isLoading && styles.submitButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                {isLoading ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <>
                    <ThemedText style={styles.submitText}>
                      Create Creator Account
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
          </View>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>

      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalDismiss}
            onPress={() => setShowCategoryPicker(false)}
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
                <ThemedText
                  style={[styles.modalTitle, { fontFamily: "Poppins_600SemiBold" }]}
                >
                  Creator Category
                </ThemedText>
                <Pressable
                  testID="category-picker-close"
                  onPress={() => setShowCategoryPicker(false)}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Picker
                testID="category-picker"
                selectedValue={creatorCategory}
                onValueChange={(value) => {
                  setCreatorCategory(value as CreatorCategoryType | "");
                  setErrors((prev) => ({ ...prev, creatorCategory: "" }));
                }}
                style={styles.picker}
                itemStyle={{ color: theme.text }}
              >
                {CREATOR_CATEGORIES.map((cat) => (
                  <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                ))}
              </Picker>
              <Pressable
                testID="category-picker-done"
                style={[styles.modalDoneButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowCategoryPicker(false)}
              >
                <ThemedText style={styles.modalDoneText}>Done</ThemedText>
              </Pressable>
            </BlurView>
          ) : (
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark
                    ? "rgba(26, 26, 36, 0.95)"
                    : "rgba(255, 255, 255, 0.98)",
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText
                  style={[styles.modalTitle, { fontFamily: "Poppins_600SemiBold" }]}
                >
                  Creator Category
                </ThemedText>
                <Pressable
                  testID="category-picker-close"
                  onPress={() => setShowCategoryPicker(false)}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Picker
                testID="category-picker"
                selectedValue={creatorCategory}
                onValueChange={(value) => {
                  setCreatorCategory(value as CreatorCategoryType | "");
                  setErrors((prev) => ({ ...prev, creatorCategory: "" }));
                }}
                style={styles.picker}
                dropdownIconColor={theme.textSecondary}
              >
                {CREATOR_CATEGORIES.map((cat) => (
                  <Picker.Item
                    key={cat.value}
                    label={cat.label}
                    value={cat.value}
                    color={theme.text}
                  />
                ))}
              </Picker>
              <Pressable
                testID="category-picker-done"
                style={[styles.modalDoneButton, { backgroundColor: theme.primary }]}
                onPress={() => setShowCategoryPicker(false)}
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
    textAlign: "center",
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
  inputBlurMultiline: {
    minHeight: 120,
  },
  inputInner: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
  },
  inputInnerMultiline: {
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  inputIconMultiline: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: Spacing.sm,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
    marginRight: 4,
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
  sectionLabelSmall: {
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
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    marginLeft: 2,
    fontWeight: "600",
  },
  platformsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  platformChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: 15,
  },
  toggleDescription: {
    fontSize: 12,
    marginTop: 2,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
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
