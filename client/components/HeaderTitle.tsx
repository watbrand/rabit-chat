import React from "react";
import { View, StyleSheet, Image, Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  const { theme } = useTheme();

  return (
    <View style={[
      styles.container,
      Platform.OS === "android" && styles.androidContainer,
    ]}>
      <Image
        source={require("../../assets/images/icon.png")}
        style={[
          styles.icon,
          Platform.OS === "android" && styles.androidIcon,
        ]}
        resizeMode="contain"
      />
      <ThemedText style={[styles.title, { color: theme.primary }]}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  androidContainer: {
    marginTop: 4,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  androidIcon: {
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
});
