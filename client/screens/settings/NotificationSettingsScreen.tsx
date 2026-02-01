import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, Alert, Platform } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Haptics from "@/lib/safeHaptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface NotificationPrefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  mentions: boolean;
}

interface UserSettings {
  notifications: NotificationPrefs;
}

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/me/settings"],
  });

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
    mentions: true,
  });

  useEffect(() => {
    if (settings?.notifications) {
      setNotifications(settings.notifications);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPrefs>) => {
      return apiRequest("PATCH", "/api/me/settings", {
        notifications: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/settings"] });
    },
    onError: (error: any) => {
      if (settings?.notifications) {
        setNotifications(settings.notifications);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update settings. Please try again.");
    },
  });

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    updateMutation.mutate(updated);
  };

  const NotificationToggle = ({
    label,
    description,
    settingKey,
  }: {
    label: string;
    description: string;
    settingKey: keyof NotificationPrefs;
  }) => (
    <View
      style={[
        styles.settingRow,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
    >
      <View style={styles.settingInfo}>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={notifications[settingKey]}
        onValueChange={(value) => handleToggle(settingKey, value)}
        trackColor={{ false: theme.glassBorder, true: theme.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  if (isLoading) {
    return (
      <LoadingIndicator fullScreen />
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Push Notifications
        </ThemedText>
        <View style={styles.toggleList}>
          <NotificationToggle
            label="Likes"
            description="When someone likes your post"
            settingKey="likes"
          />
          <NotificationToggle
            label="Comments"
            description="When someone comments on your post"
            settingKey="comments"
          />
          <NotificationToggle
            label="New Followers"
            description="When someone starts following you"
            settingKey="follows"
          />
          <NotificationToggle
            label="Messages"
            description="When you receive a new message"
            settingKey="messages"
          />
          <NotificationToggle
            label="Mentions"
            description="When someone mentions you in a post"
            settingKey="mentions"
          />
        </View>
      </View>

      {updateMutation.isPending ? (
        <View style={styles.savingIndicator}>
          <LoadingIndicator size="small" />
          <ThemedText style={[styles.savingText, { color: theme.textSecondary }]}>
            Saving...
          </ThemedText>
        </View>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  toggleList: {
    gap: Spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: 13,
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  savingText: {
    fontSize: 14,
  },
});
