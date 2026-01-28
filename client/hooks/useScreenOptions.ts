import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

import { useTheme } from "@/hooks/useTheme";

interface UseScreenOptionsParams {
  transparent?: boolean;
}

export function useScreenOptions({
  transparent = true,
}: UseScreenOptionsParams = {}): NativeStackNavigationOptions {
  const { theme, isDark } = useTheme();

  // On Android, use solid header to avoid layout issues with headerHeight calculations
  const isHeaderTransparent = Platform.OS === "android" ? false : transparent;

  return {
    headerTitleAlign: Platform.OS === "android" ? "left" : "center",
    headerTransparent: isHeaderTransparent,
    headerBlurEffect: Platform.OS === "ios" ? "light" : undefined,
    headerTintColor: theme.text,
    headerBackVisible: true,
    headerStyle: {
      backgroundColor: Platform.select({
        ios: undefined,
        android: theme.backgroundRoot,
        web: theme.backgroundRoot,
      }),
    },
    headerShadowVisible: Platform.OS === "android" ? false : undefined,
    gestureEnabled: true,
    gestureDirection: "horizontal",
    fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
  };
}
