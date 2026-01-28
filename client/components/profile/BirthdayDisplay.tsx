import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface BirthdayDisplayProps {
  birthday: string;
  showAge?: boolean;
}

function formatBirthday(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function calculateAge(dateString: string): number {
  const birthday = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
}

function isBirthdayToday(dateString: string): boolean {
  const birthday = new Date(dateString);
  const today = new Date();
  return birthday.getMonth() === today.getMonth() && birthday.getDate() === today.getDate();
}

export function BirthdayDisplay({ birthday, showAge = false }: BirthdayDisplayProps) {
  const { theme } = useTheme();
  const isToday = isBirthdayToday(birthday);

  return (
    <View style={styles.container}>
      <Feather 
        name="gift" 
        size={14} 
        color={isToday ? "#E91E63" : theme.textSecondary} 
      />
      <ThemedText style={[styles.text, { color: isToday ? "#E91E63" : theme.textSecondary }]}>
        {formatBirthday(birthday)}
        {showAge ? ` (${calculateAge(birthday)})` : ""}
        {isToday ? " - Birthday today!" : ""}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  text: {
    fontSize: 13,
  },
});