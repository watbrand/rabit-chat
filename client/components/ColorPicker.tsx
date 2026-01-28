import React, { useCallback, useState } from "react";
import { StyleSheet, View, Text, Pressable, Platform, ScrollView } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Animation, BorderRadius, Spacing } from "@/constants/theme";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  colors?: string[];
  showCustom?: boolean;
}

const DEFAULT_COLORS = [
  "#8B5CF6",
  "#A855F7",
  "#C084FC",
  "#7C3AED",
  "#6D28D9",
  "#5B21B6",
  "#EF4444",
  "#F87171",
  "#F97316",
  "#FB923C",
  "#FBBF24",
  "#FCD34D",
  "#22C55E",
  "#4ADE80",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#22D3EE",
  "#3B82F6",
  "#60A5FA",
  "#6366F1",
  "#818CF8",
  "#EC4899",
  "#F472B6",
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ColorOption({
  color,
  isSelected,
  onSelect,
}: {
  color: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(isSelected ? 3 : 0);

  React.useEffect(() => {
    borderWidth.value = withSpring(isSelected ? 3 : 0, Animation.spring);
  }, [isSelected]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, Animation.springBouncy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Animation.springBouncy);
  }, []);

  const handlePress = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onSelect();
  }, [onSelect]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: borderWidth.value,
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        animatedStyle,
      ]}
    >
      {isSelected ? (
        <View style={styles.checkContainer}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

export default function ColorPicker({
  selectedColor,
  onColorChange,
  colors = DEFAULT_COLORS,
  showCustom = false,
}: ColorPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Choose Accent Color</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {colors.map((color) => (
          <ColorOption
            key={color}
            color={color}
            isSelected={selectedColor === color}
            onSelect={() => onColorChange(color)}
          />
        ))}
      </ScrollView>
      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewRow}>
          <View style={[styles.previewButton, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewButtonText}>Primary</Text>
          </View>
          <View style={[styles.previewBadge, { backgroundColor: selectedColor }]}>
            <Text style={styles.previewBadgeText}>Badge</Text>
          </View>
          <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: Spacing.md,
  },
  scrollContent: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: "rgba(30, 30, 45, 0.6)",
    borderRadius: BorderRadius.lg,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  previewButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  previewButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  previewBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  previewBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
