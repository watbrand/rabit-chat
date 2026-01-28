import { useContext } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

let ThemeContextModule: any = null;
try {
  ThemeContextModule = require("@/contexts/ThemeContext");
} catch (e) {
}

export function useColorScheme(): "light" | "dark" {
  if (ThemeContextModule?.useThemeContext) {
    try {
      const { effectiveTheme } = ThemeContextModule.useThemeContext();
      return effectiveTheme;
    } catch (e) {
      return "light";
    }
  }
  return "light";
}
