import React, { useEffect, useCallback } from "react";
import { StyleSheet, View, Platform } from "react-native";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { OnboardingProvider, useOnboarding } from "@/hooks/useOnboarding";
import { AudioManagerProvider } from "@/contexts/AudioManagerContext";
import { IncomingCallProvider } from "@/contexts/IncomingCallContext";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

const prefix = Linking.createURL("/");

const linking: LinkingOptions<any> = {
  prefixes: [prefix, "rabitchat://"],
  config: {
    screens: {
      Main: {
        screens: {
          MallTab: {
            screens: {
              Mall: "mall",
            },
          },
          FeedTab: {
            screens: {
              Feed: "feed",
            },
          },
          ProfileTab: {
            screens: {
              Profile: "profile",
            },
          },
        },
      },
      Wallet: "wallet",
    },
  },
};

function PushNotificationInitializer({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}

// Wrapper component that provides a key to NavigationContainer based on auth state
// This forces a complete navigation reset when auth state changes
function NavigationWrapper() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasSeenOnboarding, isLoading: onboardingLoading } = useOnboarding();
  
  // Determine navigation key based on current auth/onboarding state
  const isLoading = authLoading || onboardingLoading;
  const showOnboarding = hasSeenOnboarding === false;
  const showAuth = !showOnboarding && !isAuthenticated;
  
  // Use different keys to force complete remount of NavigationContainer
  const navKey = isLoading ? "loading" : showOnboarding ? "onboarding" : showAuth ? "auth" : "main";
  
  console.log("[NavigationWrapper] Auth state:", { isAuthenticated, navKey, isLoading });
  
  return (
    <NavigationContainer 
      key={navKey}
      linking={linking}
      onStateChange={(state) => {
        // When navigating via deep link, invalidate wallet queries to refresh balance
        queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
      }}
    >
      <IncomingCallProvider>
        <RootStackNavigator />
        <IncomingCallModal />
      </IncomingCallProvider>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.loading, { backgroundColor: Colors.dark.backgroundRoot }]} />
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <OnboardingProvider>
            <AuthProvider>
              <PushNotificationInitializer>
                <AudioManagerProvider>
                  <SafeAreaProvider>
                    <GestureHandlerRootView style={styles.root}>
                      <KeyboardProvider>
                        <NavigationWrapper />
                        <StatusBar style="auto" />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </AudioManagerProvider>
              </PushNotificationInitializer>
            </AuthProvider>
          </OnboardingProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  loading: {
    flex: 1,
  },
});
