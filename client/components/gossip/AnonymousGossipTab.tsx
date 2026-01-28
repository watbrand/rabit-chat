import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "../ThemedText";
import { Colors, Spacing } from "@/constants/theme";

export function AnonymousGossipTab() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="coffee" size={64} color={Colors.dark.primary} />
        </View>
        <ThemedText style={styles.title}>Gossip Coming Soon</ThemedText>
        <ThemedText style={styles.subtitle}>
          Anonymous gossip from your area is brewing...
        </ThemedText>
        <ThemedText style={styles.description}>
          Share and discover local tea without revealing your identity. 
          Stay tuned for this exciting feature!
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.primary,
    marginBottom: Spacing.md,
    textAlign: "center",
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
