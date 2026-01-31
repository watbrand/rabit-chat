import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import debounce from "lodash.debounce";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";

type AuthScreenParams = {
  mode?: "login" | "signup";
  accountType?: string;
};

interface UsernameCheckResult {
  available: boolean;
  suggestions?: string[];
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, signup } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute();
  const params = route.params as AuthScreenParams | undefined;
  
  // Start in login mode if passed from AccountTypeScreen, or default to login
  const [isLogin, setIsLogin] = useState(params?.mode !== "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

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
    setUsername(text);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    
    if (text.length >= 3) {
      debouncedCheckUsername(text);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameAvailable(true);
    setUsernameSuggestions([]);
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    
    if (!isLogin && (!username || !displayName)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!isLogin && usernameAvailable === false) {
      Alert.alert("Error", "Please choose an available username");
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        // After login, check onboarding status and navigate accordingly
        try {
          const baseUrl = getApiUrl();
          const url = new URL("/api/onboarding/status", baseUrl);
          const response = await fetch(url.toString(), { credentials: "include" });
          if (response.ok) {
            const status = await response.json();
            if (!status.onboardingCompleted) {
              // Navigate to the appropriate onboarding step
              if (!status.hasInterests) {
                navigation.navigate("LegalAgreement", { fromSignup: true });
              } else if (!status.hasIndustry) {
                navigation.navigate("IndustrySelection");
              } else if (status.onboardingStep < 4) {
                navigation.navigate("NetWorthTier");
              } else if (status.onboardingStep < 5) {
                navigation.navigate("PrivacySetup");
              } else if (status.onboardingStep < 6) {
                navigation.navigate("SuggestedUsers");
              }
            }
          }
        } catch (e) {
          // Could not check onboarding status, continue with default flow
        }
      } else {
        await signup(username, email, password, displayName);
        // After signup, navigate to legal agreement then onboarding
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate("LegalAgreement", { fromSignup: true });
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setUsernameAvailable(null);
    setUsernameSuggestions([]);
    setUsername("");
  };

  const renderUsernameStatus = () => {
    if (username.length < 3) return null;

    if (isCheckingUsername) {
      return (
        <View style={styles.usernameStatus}>
          <LoadingIndicator size="small" />
          <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
            Checking...
          </ThemedText>
        </View>
      );
    }

    if (usernameAvailable === true) {
      return (
        <View style={styles.usernameStatus}>
          <Feather name="check-circle" size={16} color="#10B981" />
          <ThemedText style={[styles.statusText, { color: "#10B981" }]}>
            Available
          </ThemedText>
        </View>
      );
    }

    if (usernameAvailable === false) {
      return (
        <View style={styles.usernameStatusContainer}>
          <View style={styles.usernameStatus}>
            <Feather name="x-circle" size={16} color="#EF4444" />
            <ThemedText style={[styles.statusText, { color: "#EF4444" }]}>
              Taken
            </ThemedText>
          </View>
          {usernameSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ThemedText style={[styles.suggestionsLabel, { color: theme.textSecondary }]}>
                Try:
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                {usernameSuggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    style={[styles.suggestionChip, { backgroundColor: theme.glassBackground, borderColor: theme.primary }]}
                    onPress={() => handleSuggestionSelect(suggestion)}
                    testID={`suggestion-${suggestion}`}
                  >
                    <ThemedText style={[styles.suggestionText, { color: theme.primary }]}>
                      {suggestion}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText type="h1" style={styles.title}>
            RabitChat
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Where wealth meets influence
          </ThemedText>
        </View>

        <BlurView intensity={20} tint="dark" style={styles.glassCard}>
          <View style={[styles.cardContent, { borderColor: theme.glassBorder }]}>
            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.glassBackground,
                          borderColor: usernameAvailable === true 
                            ? "#10B981" 
                            : usernameAvailable === false 
                            ? "#EF4444" 
                            : theme.glassBorder,
                          color: theme.text,
                        },
                      ]}
                      placeholder="Username"
                      placeholderTextColor={theme.textSecondary}
                      value={username}
                      onChangeText={handleUsernameChange}
                      autoCapitalize="none"
                      testID="input-username"
                    />
                    {username.length >= 3 ? (
                      <View style={styles.inputIcon}>
                        {isCheckingUsername ? (
                          <LoadingIndicator size="small" />
                        ) : usernameAvailable === true ? (
                          <Feather name="check-circle" size={20} color="#10B981" />
                        ) : usernameAvailable === false ? (
                          <Feather name="x-circle" size={20} color="#EF4444" />
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                  {renderUsernameStatus()}
                </View>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.glassBackground,
                        borderColor: theme.glassBorder,
                        color: theme.text,
                      },
                    ]}
                    placeholder="Display Name"
                    placeholderTextColor={theme.textSecondary}
                    value={displayName}
                    onChangeText={setDisplayName}
                    testID="input-displayname"
                  />
                </View>
              </>
            )}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Email or Username"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                testID="input-email"
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                testID="input-password"
              />
            </View>

            <Pressable
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
              testID="button-submit"
            >
              {isLoading ? (
                <LoadingIndicator size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {isLogin ? "Sign In" : "Create Account"}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.switchButton}
              onPress={handleToggleMode}
              testID="button-switch-auth"
            >
              <ThemedText style={{ color: theme.textSecondary }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <ThemedText style={{ color: theme.primary }}>
                  {isLogin ? "Sign Up" : "Sign In"}
                </ThemedText>
              </ThemedText>
            </Pressable>
          </View>
        </BlurView>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
  },
  glassCard: {
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
  },
  cardContent: {
    padding: Spacing.xl,
    borderWidth: 1,
    borderRadius: BorderRadius["2xl"],
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingRight: 48,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
  },
  inputIcon: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  usernameStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: 6,
  },
  usernameStatusContainer: {
    marginTop: Spacing.xs,
  },
  statusText: {
    fontSize: 13,
  },
  suggestionsContainer: {
    marginTop: Spacing.sm,
  },
  suggestionsLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  suggestionsScroll: {
    flexGrow: 0,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginRight: 8,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  button: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  switchButton: {
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
});
