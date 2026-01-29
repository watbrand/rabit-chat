import { Platform } from "react-native";

export const Gradients = {
  primary: ["#8B5CF6", "#EC4899"] as const,
  accent: ["#14B8A6", "#8B5CF6"] as const,
  gold: ["#F59E0B", "#FBBF24"] as const,
  pink: ["#EC4899", "#F472B6"] as const,
  teal: ["#14B8A6", "#2DD4BF"] as const,
  sunset: ["#8B5CF6", "#EC4899", "#F59E0B"] as const,
  mesh: ["#8B5CF6", "#EC4899", "#14B8A6"] as const,
  story: ["#8B5CF6", "#EC4899", "#F59E0B", "#14B8A6"] as const,
  lightBackground: ["#E8D5F5", "#F5E1F0", "#E5E8F8", "#F0E5F8"] as const,
  lightBackgroundSoft: ["#F3E8FA", "#FAEBF5", "#EBF0FC", "#F5EBFA"] as const,
};

export const GlassLayers = {
  light: "rgba(139, 92, 246, 0.08)",
  medium: "rgba(139, 92, 246, 0.15)",
  strong: "rgba(139, 92, 246, 0.25)",
  border: "rgba(139, 92, 246, 0.20)",
  glow: "rgba(139, 92, 246, 0.40)",
  borderGlow: "rgba(139, 92, 246, 0.35)",
};

export const Colors = {
  light: {
    primary: "#8B5CF6",
    primaryDark: "#6D28D9",
    primaryLight: "#A78BFA",
    pink: "#EC4899",
    teal: "#14B8A6",
    
    text: "#1D1D1F",
    textSecondary: "rgba(29, 29, 31, 0.70)",
    textTertiary: "rgba(29, 29, 31, 0.50)",
    textInverse: "#FFFFFF",
    buttonText: "#FFFFFF",
    
    backgroundRoot: "#F5F5F7",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "rgba(139, 92, 246, 0.08)",
    backgroundTertiary: "rgba(139, 92, 246, 0.12)",
    backgroundElevated: "#FFFFFF",
    backgroundFloating: "#FAFAFA",
    
    glassBackground: "rgba(255, 255, 255, 0.85)",
    glassBorder: "rgba(255, 255, 255, 0.6)",
    glassBackgroundDark: "rgba(255, 255, 255, 0.75)",
    glassLight: GlassLayers.light,
    glassMedium: GlassLayers.medium,
    glassStrong: GlassLayers.strong,
    glassGlow: GlassLayers.glow,
    
    ambientPurple: "rgba(139, 92, 246, 0.15)",
    ambientPink: "rgba(236, 72, 153, 0.12)",
    ambientTeal: "rgba(20, 184, 166, 0.12)",
    ambientGold: "rgba(212, 175, 55, 0.10)",
    accentGlow: "rgba(139, 92, 246, 0.30)",
    
    border: "rgba(0, 0, 0, 0.08)",
    borderLight: "rgba(0, 0, 0, 0.04)",
    borderGradient: GlassLayers.borderGlow,
    divider: "rgba(0, 0, 0, 0.06)",
    
    tabIconDefault: "rgba(29, 29, 31, 0.40)",
    tabIconSelected: "#8B5CF6",
    tabBarBackground: "rgba(255, 255, 255, 0.85)",
    
    link: "#8B5CF6",
    
    success: "#10B981",
    successLight: "rgba(16, 185, 129, 0.15)",
    error: "#EF4444",
    errorLight: "rgba(239, 68, 68, 0.15)",
    warning: "#F59E0B",
    warningLight: "rgba(245, 158, 11, 0.15)",
    info: "#3B82F6",
    infoLight: "rgba(59, 130, 246, 0.15)",
    
    gold: "#F59E0B",
    goldLight: "rgba(245, 158, 11, 0.20)",
    goldShimmer: "#FFD700",
    goldGlow: "rgba(245, 158, 11, 0.50)",
    silver: "#94A3B8",
    silverLight: "rgba(148, 163, 184, 0.20)",
    silverShimmer: "#C0C0C0",
    silverGlow: "rgba(148, 163, 184, 0.40)",
    
    verified: "#8B5CF6",
    
    overlay: "rgba(0, 0, 0, 0.5)",
    overlayLight: "rgba(0, 0, 0, 0.3)",
  },
  dark: {
    primary: "#8B5CF6",
    primaryDark: "#7C3AED",
    primaryLight: "#A78BFA",
    pink: "#EC4899",
    teal: "#14B8A6",
    
    text: "#FFFFFF",
    textSecondary: "#A8A8B0",
    textTertiary: "#6B6B78",
    textInverse: "#0A0A0F",
    buttonText: "#FFFFFF",
    
    backgroundRoot: "#0A0A0F",
    backgroundDefault: "#121218",
    backgroundSecondary: "#1A1A24",
    backgroundTertiary: "#22222E",
    backgroundElevated: "#1E1E2A",
    backgroundFloating: "#0F0F14",
    
    glassBackground: "rgba(26, 26, 36, 0.70)",
    glassBorder: "rgba(139, 92, 246, 0.25)",
    glassBackgroundDark: "rgba(10, 10, 15, 0.85)",
    glassLight: GlassLayers.light,
    glassMedium: GlassLayers.medium,
    glassStrong: GlassLayers.strong,
    glassGlow: GlassLayers.glow,
    
    ambientPurple: "rgba(139, 92, 246, 0.20)",
    ambientPink: "rgba(236, 72, 153, 0.15)",
    ambientTeal: "rgba(20, 184, 166, 0.15)",
    ambientGold: "rgba(245, 158, 11, 0.12)",
    accentGlow: "rgba(139, 92, 246, 0.50)",
    
    border: "rgba(139, 92, 246, 0.20)",
    borderLight: "rgba(255, 255, 255, 0.08)",
    borderGradient: GlassLayers.borderGlow,
    divider: "rgba(255, 255, 255, 0.06)",
    
    tabIconDefault: "rgba(245, 245, 247, 0.40)",
    tabIconSelected: "#8B5CF6",
    tabBarBackground: "rgba(10, 10, 15, 0.90)",
    
    link: "#A78BFA",
    
    success: "#34D399",
    successLight: "rgba(52, 211, 153, 0.15)",
    error: "#F87171",
    errorLight: "rgba(248, 113, 113, 0.15)",
    warning: "#FBBF24",
    warningLight: "rgba(251, 191, 36, 0.15)",
    info: "#60A5FA",
    infoLight: "rgba(96, 165, 250, 0.15)",
    
    gold: "#F59E0B",
    goldLight: "rgba(245, 158, 11, 0.25)",
    goldShimmer: "#FFD700",
    goldGlow: "rgba(245, 158, 11, 0.50)",
    silver: "#CBD5E1",
    silverLight: "rgba(203, 213, 225, 0.20)",
    silverShimmer: "#E2E8F0",
    silverGlow: "rgba(203, 213, 225, 0.40)",
    
    verified: "#A78BFA",
    
    overlay: "rgba(0, 0, 0, 0.7)",
    overlayLight: "rgba(0, 0, 0, 0.5)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 48,
  buttonHeight: 52,
  cardPadding: 16,
  screenPadding: 20,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  // Instagram-inspired compact typography (reduced ~2-3pt from original)
  largeTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.37,
    lineHeight: 34,
  },
  title1: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: 0.36,
    lineHeight: 30,
  },
  title2: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: 0.35,
    lineHeight: 24,
  },
  title3: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: 0.38,
    lineHeight: 21,
  },
  headline: {
    fontSize: 15,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
    lineHeight: 20,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    letterSpacing: -0.41,
    lineHeight: 19,
  },
  callout: {
    fontSize: 14,
    fontWeight: "400" as const,
    letterSpacing: -0.32,
    lineHeight: 18,
  },
  subhead: {
    fontSize: 13,
    fontWeight: "400" as const,
    letterSpacing: -0.24,
    lineHeight: 17,
  },
  footnote: {
    fontSize: 12,
    fontWeight: "400" as const,
    letterSpacing: -0.08,
    lineHeight: 16,
  },
  caption1: {
    fontSize: 11,
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 14,
  },
  caption2: {
    fontSize: 10,
    fontWeight: "400" as const,
    letterSpacing: 0.07,
    lineHeight: 12,
  },
  // Legacy typography (for backward compatibility) - also reduced
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  link: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
};

export const Shadows = {
  none: {},
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 0,
  },
  goldGlow: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 0,
  },
  silverGlow: {
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 0,
  },
};

export const GlassStyles = {
  light: {
    card: {
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    elevated: {
      backgroundColor: "rgba(255, 255, 255, 0.92)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.7)",
    },
    frosted: {
      backgroundColor: "rgba(255, 255, 255, 0.75)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.5)",
    },
  },
  dark: {
    card: {
      backgroundColor: "rgba(20, 15, 30, 0.60)",
      borderWidth: 1,
      borderColor: "rgba(139, 92, 246, 0.25)",
    },
    elevated: {
      backgroundColor: "rgba(30, 25, 45, 0.75)",
      borderWidth: 1,
      borderColor: "rgba(139, 92, 246, 0.30)",
    },
    intense: {
      backgroundColor: "rgba(10, 10, 15, 0.80)",
      borderWidth: 1,
      borderColor: "rgba(139, 92, 246, 0.35)",
    },
  },
};

export const Animation = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
  springGentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};

export const Fonts = Platform.select({
  ios: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semiBold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
    // Fallbacks
    sans: "System",
    serif: "Georgia",
    rounded: "System",
    mono: "Menlo",
  },
  android: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semiBold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
    // Fallbacks
    sans: "Roboto",
    serif: "serif",
    rounded: "Roboto",
    mono: "monospace",
  },
  default: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semiBold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
    // Fallbacks
    sans: "System",
    serif: "Georgia",
    rounded: "System",
    mono: "monospace",
  },
  web: {
    regular: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    medium: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    semiBold: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    bold: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    // Fallbacks
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', system-ui, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
