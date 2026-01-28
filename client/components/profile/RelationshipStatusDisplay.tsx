import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface RelationshipPartner {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface RelationshipStatusDisplayProps {
  status: string;
  partner?: RelationshipPartner | null;
  onPartnerPress?: (partnerId: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  SINGLE: { label: "Single", icon: "user" },
  IN_RELATIONSHIP: { label: "In a relationship", icon: "heart" },
  ENGAGED: { label: "Engaged", icon: "heart" },
  MARRIED: { label: "Married", icon: "heart" },
  COMPLICATED: { label: "It's complicated", icon: "help-circle" },
  OPEN: { label: "In an open relationship", icon: "users" },
  PREFER_NOT_TO_SAY: { label: "Prefer not to say", icon: "minus" },
};

export function RelationshipStatusDisplay({ status, partner, onPartnerPress }: RelationshipStatusDisplayProps) {
  const { theme } = useTheme();
  const statusInfo = STATUS_LABELS[status] || { label: status, icon: "user" };

  if (status === "PREFER_NOT_TO_SAY") return null;

  return (
    <View style={[styles.container, { borderTopColor: theme.glassBorder }]}>
      <View style={styles.statusRow}>
        <Feather name={statusInfo.icon} size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.statusText, { color: theme.textSecondary }]}>
          {statusInfo.label}
        </ThemedText>
      </View>
      
      {partner ? (
        <Pressable 
          style={styles.partnerRow}
          onPress={() => onPartnerPress?.(partner.id)}
          testID={`partner-${partner.id}`}
        >
          <ThemedText style={[styles.withText, { color: theme.textSecondary }]}>
            with
          </ThemedText>
          <Avatar uri={partner.avatarUrl} size={20} />
          <ThemedText style={[styles.partnerName, { color: theme.primary }]}>
            {partner.displayName}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 13,
  },
  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  withText: {
    fontSize: 13,
  },
  partnerName: {
    fontSize: 13,
    fontWeight: "500",
  },
});