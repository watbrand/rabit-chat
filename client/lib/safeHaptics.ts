import { Platform } from "react-native";

let Haptics: typeof import("expo-haptics") | null = null;

if (Platform.OS !== "web") {
  try {
    Haptics = require("expo-haptics");
  } catch (e) {
    // Haptics not available
  }
}

export const triggerHaptic = (
  type: "light" | "medium" | "heavy" | "error" | "success" | "warning" | "selection"
) => {
  if (Platform.OS === "web" || !Haptics) return;
  try {
    switch (type) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "selection":
        Haptics.selectionAsync();
        break;
    }
  } catch (e) {
    // Ignore haptics errors
  }
};

export default {
  impactAsync: (style: any) => {
    if (Platform.OS === "web" || !Haptics) return Promise.resolve();
    try {
      return Haptics.impactAsync(style);
    } catch (e) {
      return Promise.resolve();
    }
  },
  notificationAsync: (type: any) => {
    if (Platform.OS === "web" || !Haptics) return Promise.resolve();
    try {
      return Haptics.notificationAsync(type);
    } catch (e) {
      return Promise.resolve();
    }
  },
  selectionAsync: () => {
    if (Platform.OS === "web" || !Haptics) return Promise.resolve();
    try {
      return Haptics.selectionAsync();
    } catch (e) {
      return Promise.resolve();
    }
  },
  ImpactFeedbackStyle: {
    Light: "LIGHT" as any,
    Medium: "MEDIUM" as any,
    Heavy: "HEAVY" as any,
  },
  NotificationFeedbackType: {
    Success: "SUCCESS" as any,
    Warning: "WARNING" as any,
    Error: "ERROR" as any,
  },
};
