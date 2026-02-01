import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { StyleSheet, View, Text, Switch, Platform } from "react-native";
import { safeGetItem, safeSetItem } from "@/lib/safeStorage";
import * as Haptics from "expo-haptics";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AccessibilityContextType {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  hapticFeedback: boolean;
  setHapticFeedback: (value: boolean) => void;
  largeText: boolean;
  setLargeText: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = "@accessibility_settings";

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      reducedMotion: false,
      setReducedMotion: () => {},
      hapticFeedback: true,
      setHapticFeedback: () => {},
      largeText: false,
      setLargeText: () => {},
      highContrast: false,
      setHighContrast: () => {},
    };
  }
  return context;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [hapticFeedback, setHapticFeedbackState] = useState(true);
  const [largeText, setLargeTextState] = useState(false);
  const [highContrast, setHighContrastState] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await safeGetItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        setReducedMotionState(settings.reducedMotion ?? false);
        setHapticFeedbackState(settings.hapticFeedback ?? true);
        setLargeTextState(settings.largeText ?? false);
        setHighContrastState(settings.highContrast ?? false);
      }
    } catch (error) {
      console.error("Failed to load accessibility settings:", error);
    }
  };

  const saveSettings = async (settings: Partial<AccessibilityContextType>) => {
    try {
      const current = {
        reducedMotion,
        hapticFeedback,
        largeText,
        highContrast,
        ...settings,
      };
      await safeSetItem(STORAGE_KEY, JSON.stringify(current));
    } catch (error) {
      console.error("Failed to save accessibility settings:", error);
    }
  };

  const setReducedMotion = useCallback((value: boolean) => {
    setReducedMotionState(value);
    saveSettings({ reducedMotion: value });
    if (hapticFeedback && Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  }, [hapticFeedback]);

  const setHapticFeedback = useCallback((value: boolean) => {
    setHapticFeedbackState(value);
    saveSettings({ hapticFeedback: value });
    if (value && Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  }, []);

  const setLargeText = useCallback((value: boolean) => {
    setLargeTextState(value);
    saveSettings({ largeText: value });
    if (hapticFeedback && Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  }, [hapticFeedback]);

  const setHighContrast = useCallback((value: boolean) => {
    setHighContrastState(value);
    saveSettings({ highContrast: value });
    if (hapticFeedback && Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  }, [hapticFeedback]);

  return (
    <AccessibilityContext.Provider
      value={{
        reducedMotion,
        setReducedMotion,
        hapticFeedback,
        setHapticFeedback,
        largeText,
        setLargeText,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

function SettingRow({ label, description, value, onValueChange }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "rgba(255, 255, 255, 0.2)", true: "#8B5CF6" }}
        thumbColor={value ? "#FFFFFF" : "#888888"}
        ios_backgroundColor="rgba(255, 255, 255, 0.2)"
      />
    </View>
  );
}

export default function AccessibilitySettings() {
  const {
    reducedMotion,
    setReducedMotion,
    hapticFeedback,
    setHapticFeedback,
    largeText,
    setLargeText,
    highContrast,
    setHighContrast,
  } = useAccessibility();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Accessibility</Text>
      <View style={styles.settingsCard}>
        <SettingRow
          label="Reduce Motion"
          description="Minimize animations throughout the app"
          value={reducedMotion}
          onValueChange={setReducedMotion}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Haptic Feedback"
          description="Vibration feedback for interactions"
          value={hapticFeedback}
          onValueChange={setHapticFeedback}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Large Text"
          description="Increase text size for better readability"
          value={largeText}
          onValueChange={setLargeText}
        />
        <View style={styles.divider} />
        <SettingRow
          label="High Contrast"
          description="Increase contrast for better visibility"
          value={highContrast}
          onValueChange={setHighContrast}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: Spacing.md,
  },
  settingsCard: {
    backgroundColor: "rgba(30, 30, 45, 0.6)",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: Spacing.md,
  },
});
