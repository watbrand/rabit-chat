import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface VerifiedBadgeProps {
  size?: number;
}

export default function VerifiedBadge({ size = 14 }: VerifiedBadgeProps) {
  const containerSize = size;
  const iconSize = size * 0.65;

  return (
    <View
      style={[
        styles.badge,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
        },
      ]}
    >
      <Ionicons name="checkmark" size={iconSize} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#3897F0",
    alignItems: "center",
    justifyContent: "center",
  },
});
