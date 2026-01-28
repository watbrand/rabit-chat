import React from "react";
import { View, StyleSheet, Pressable, Linking, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ContactButtonsProps {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export function ContactButtons({ email, phone, address }: ContactButtonsProps) {
  const { theme } = useTheme();

  if (!email && !phone && !address) return null;

  const handleEmail = () => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handlePhone = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleAddress = () => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    }
  };

  return (
    <View style={styles.container}>
      {email ? (
        <Pressable 
          style={[styles.button, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
          onPress={handleEmail}
          testID="button-contact-email"
        >
          <Feather name="mail" size={16} color={theme.primary} />
          <ThemedText style={[styles.buttonText, { color: theme.text }]}>
            Email
          </ThemedText>
        </Pressable>
      ) : null}
      
      {phone ? (
        <Pressable 
          style={[styles.button, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
          onPress={handlePhone}
          testID="button-contact-phone"
        >
          <Feather name="phone" size={16} color={theme.primary} />
          <ThemedText style={[styles.buttonText, { color: theme.text }]}>
            Call
          </ThemedText>
        </Pressable>
      ) : null}
      
      {address ? (
        <Pressable 
          style={[styles.button, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
          onPress={handleAddress}
          testID="button-contact-address"
        >
          <Feather name="map-pin" size={16} color={theme.primary} />
          <ThemedText style={[styles.buttonText, { color: theme.text }]}>
            Directions
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "500",
  },
});