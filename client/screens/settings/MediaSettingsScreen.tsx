import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, Pressable, Alert, Platform } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

type UploadQuality = "low" | "medium" | "high";

interface MediaPrefs {
  autoplay: boolean;
  dataSaver: boolean;
  uploadQuality: UploadQuality;
}

interface UserSettings {
  mediaPrefs: MediaPrefs;
}

const qualityOptions: { value: UploadQuality; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "Smaller files, faster uploads" },
  { value: "medium", label: "Medium", description: "Balanced quality and size" },
  { value: "high", label: "High", description: "Best quality, larger files" },
];

export default function MediaSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/me/settings"],
  });

  const [mediaPrefs, setMediaPrefs] = useState<MediaPrefs>({
    autoplay: true,
    dataSaver: false,
    uploadQuality: "high",
  });

  useEffect(() => {
    if (settings?.mediaPrefs) {
      setMediaPrefs(settings.mediaPrefs);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<MediaPrefs>) => {
      return apiRequest("PATCH", "/api/me/settings", {
        mediaPrefs: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/settings"] });
    },
    onError: (error: any) => {
      if (settings?.mediaPrefs) {
        setMediaPrefs(settings.mediaPrefs);
      }
      Alert.alert("Error", error.message || "Failed to update settings");
    },
  });

  const handleToggle = (key: keyof MediaPrefs, value: boolean) => {
    const updated = { ...mediaPrefs, [key]: value };
    setMediaPrefs(updated);
    updateMutation.mutate({ [key]: value });
  };

  const handleQualityChange = (quality: UploadQuality) => {
    setMediaPrefs({ ...mediaPrefs, uploadQuality: quality });
    updateMutation.mutate({ uploadQuality: quality });
  };

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
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Playback
        </ThemedText>
        <View style={styles.toggleList}>
          <View
            style={[
              styles.settingRow,
              { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
            ]}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Autoplay Videos</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Automatically play videos when scrolling
              </ThemedText>
            </View>
            <Switch
              value={mediaPrefs.autoplay}
              onValueChange={(value) => handleToggle("autoplay", value)}
              trackColor={{ false: theme.glassBorder, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View
            style={[
              styles.settingRow,
              { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
            ]}
          >
            <View style={styles.settingInfo}>
              <ThemedText style={styles.settingLabel}>Data Saver</ThemedText>
              <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Use less data when on mobile networks
              </ThemedText>
            </View>
            <Switch
              value={mediaPrefs.dataSaver}
              onValueChange={(value) => handleToggle("dataSaver", value)}
              trackColor={{ false: theme.glassBorder, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Upload Quality
        </ThemedText>
        <View
          style={[
            styles.qualityContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          {qualityOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.qualityOption,
                mediaPrefs.uploadQuality === option.value && {
                  backgroundColor: theme.primary + "20",
                  borderColor: theme.primary,
                },
                { borderColor: theme.glassBorder },
              ]}
              onPress={() => handleQualityChange(option.value)}
            >
              <View style={styles.qualityRadio}>
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: mediaPrefs.uploadQuality === option.value ? theme.primary : theme.glassBorder },
                  ]}
                >
                  {mediaPrefs.uploadQuality === option.value ? (
                    <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
                  ) : null}
                </View>
              </View>
              <View style={styles.qualityInfo}>
                <ThemedText style={styles.qualityLabel}>{option.label}</ThemedText>
                <ThemedText style={[styles.qualityDescription, { color: theme.textSecondary }]}>
                  {option.description}
                </ThemedText>
              </View>
            </Pressable>
          ))}
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
  qualityContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  qualityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  qualityRadio: {
    marginRight: Spacing.md,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  qualityInfo: {
    flex: 1,
  },
  qualityLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  qualityDescription: {
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
