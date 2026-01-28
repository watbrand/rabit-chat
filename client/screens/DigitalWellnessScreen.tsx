import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface UsageStats {
  todayMinutes: number;
  weeklyMinutes: number;
  averageDailyMinutes: number;
  sessionsToday: number;
  postsViewed: number;
  storiesViewed: number;
  messagessSent: number;
}

interface FocusModeSettings {
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  hideNotifications: boolean;
  hideLikes: boolean;
  hideCommentCounts: boolean;
  dailyLimitMinutes: number;
  breakReminderMinutes: number;
}

export function DigitalWellnessScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: usageStats, isLoading: loadingStats } = useQuery<UsageStats>({
    queryKey: ["/api/usage-stats"],
    enabled: !!user,
  });

  const { data: focusMode, isLoading: loadingFocus } = useQuery<FocusModeSettings>({
    queryKey: ["/api/focus-mode"],
    enabled: !!user,
  });

  const updateFocusModeMutation = useMutation({
    mutationFn: async (settings: Partial<FocusModeSettings>) => {
      return apiRequest("PUT", "/api/focus-mode", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/focus-mode"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update settings");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/usage-stats"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/focus-mode"] });
    setRefreshing(false);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getUsageColor = (minutes: number) => {
    if (minutes < 60) return theme.success;
    if (minutes < 120) return theme.warning || "#FFA500";
    return theme.error;
  };

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
    <View style={[styles.statCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
      <View style={[styles.statIcon, { backgroundColor: (color || theme.primary) + "20" }]}>
        <Feather name={icon as any} size={20} color={color || theme.primary} />
      </View>
      <ThemedText style={[styles.statValue, { color: color || theme.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );

  const SettingRow = ({ icon, label, description, value, onValueChange }: {
    icon: string;
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (val: boolean) => void;
  }) => (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon as any} size={18} color={theme.primary} />
      </View>
      <View style={styles.settingInfo}>
        <ThemedText style={[styles.settingLabel, { color: theme.text }]}>{label}</ThemedText>
        {description ? (
          <ThemedText style={[styles.settingDesc, { color: theme.textSecondary }]}>{description}</ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.glassBorder, true: theme.primary + "80" }}
        thumbColor={value ? theme.primary : theme.textSecondary}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <Animated.View entering={FadeInUp.delay(0)}>
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={[styles.heroIcon, { backgroundColor: theme.primary + "20" }]}>
                <Feather name="activity" size={32} color={theme.primary} />
              </View>
              <View style={styles.heroInfo}>
                <ThemedText style={[styles.heroTitle, { color: theme.text }]}>
                  Today's Screen Time
                </ThemedText>
                {loadingStats ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <ThemedText
                    style={[
                      styles.heroValue,
                      { color: getUsageColor(usageStats?.todayMinutes || 0) },
                    ]}
                  >
                    {formatTime(usageStats?.todayMinutes || 0)}
                  </ThemedText>
                )}
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard icon="calendar" label="This Week" value={formatTime(usageStats?.weeklyMinutes || 0)} />
              <StatCard icon="trending-up" label="Daily Avg" value={formatTime(usageStats?.averageDailyMinutes || 0)} />
              <StatCard icon="refresh-cw" label="Sessions" value={String(usageStats?.sessionsToday || 0)} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100)}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="eye" size={20} color={theme.primary} />
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Activity Today</ThemedText>
            </View>

            <View style={styles.activityGrid}>
              <View style={[styles.activityItem, { backgroundColor: theme.glassBackground }]}>
                <Feather name="image" size={24} color={theme.pink} />
                <ThemedText style={[styles.activityValue, { color: theme.text }]}>
                  {usageStats?.postsViewed || 0}
                </ThemedText>
                <ThemedText style={[styles.activityLabel, { color: theme.textSecondary }]}>
                  Posts Viewed
                </ThemedText>
              </View>
              <View style={[styles.activityItem, { backgroundColor: theme.glassBackground }]}>
                <Feather name="circle" size={24} color={theme.primary} />
                <ThemedText style={[styles.activityValue, { color: theme.text }]}>
                  {usageStats?.storiesViewed || 0}
                </ThemedText>
                <ThemedText style={[styles.activityLabel, { color: theme.textSecondary }]}>
                  Stories Watched
                </ThemedText>
              </View>
              <View style={[styles.activityItem, { backgroundColor: theme.glassBackground }]}>
                <Feather name="send" size={24} color={theme.success} />
                <ThemedText style={[styles.activityValue, { color: theme.text }]}>
                  {usageStats?.messagessSent || 0}
                </ThemedText>
                <ThemedText style={[styles.activityLabel, { color: theme.textSecondary }]}>
                  Messages Sent
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="moon" size={20} color={theme.primary} />
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Focus Mode</ThemedText>
            </View>

            {loadingFocus ? (
              <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
            ) : (
              <>
                <SettingRow
                  icon="power"
                  label="Enable Focus Mode"
                  description="Reduce distractions while browsing"
                  value={focusMode?.isEnabled ?? false}
                  onValueChange={(val) => updateFocusModeMutation.mutate({ isEnabled: val })}
                />

                <SettingRow
                  icon="bell-off"
                  label="Hide Notifications"
                  description="Mute all in-app notifications"
                  value={focusMode?.hideNotifications ?? false}
                  onValueChange={(val) => updateFocusModeMutation.mutate({ hideNotifications: val })}
                />

                <SettingRow
                  icon="heart"
                  label="Hide Like Counts"
                  description="Don't show like counts on posts"
                  value={focusMode?.hideLikes ?? false}
                  onValueChange={(val) => updateFocusModeMutation.mutate({ hideLikes: val })}
                />

                <SettingRow
                  icon="message-circle"
                  label="Hide Comment Counts"
                  description="Don't show comment counts"
                  value={focusMode?.hideCommentCounts ?? false}
                  onValueChange={(val) => updateFocusModeMutation.mutate({ hideCommentCounts: val })}
                />
              </>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="clock" size={20} color={theme.primary} />
              <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Time Limits</ThemedText>
            </View>

            <View style={styles.limitRow}>
              <ThemedText style={[styles.limitLabel, { color: theme.text }]}>Daily Limit</ThemedText>
              <View style={styles.limitButtons}>
                {[30, 60, 120, 180].map((mins) => (
                  <Pressable
                    key={mins}
                    style={[
                      styles.limitButton,
                      {
                        backgroundColor:
                          focusMode?.dailyLimitMinutes === mins ? theme.primary : theme.glassBackground,
                        borderColor: focusMode?.dailyLimitMinutes === mins ? theme.primary : theme.glassBorder,
                      },
                    ]}
                    onPress={() => updateFocusModeMutation.mutate({ dailyLimitMinutes: mins })}
                  >
                    <ThemedText
                      style={[
                        styles.limitButtonText,
                        { color: focusMode?.dailyLimitMinutes === mins ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      {formatTime(mins)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.limitRow}>
              <ThemedText style={[styles.limitLabel, { color: theme.text }]}>Break Reminder</ThemedText>
              <View style={styles.limitButtons}>
                {[15, 30, 45, 60].map((mins) => (
                  <Pressable
                    key={mins}
                    style={[
                      styles.limitButton,
                      {
                        backgroundColor:
                          focusMode?.breakReminderMinutes === mins ? theme.primary : theme.glassBackground,
                        borderColor: focusMode?.breakReminderMinutes === mins ? theme.primary : theme.glassBorder,
                      },
                    ]}
                    onPress={() => updateFocusModeMutation.mutate({ breakReminderMinutes: mins })}
                  >
                    <ThemedText
                      style={[
                        styles.limitButtonText,
                        { color: focusMode?.breakReminderMinutes === mins ? "#FFFFFF" : theme.text },
                      ]}
                    >
                      {mins}m
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <Card style={styles.tipsCard}>
            <Feather name="info" size={20} color={theme.primary} />
            <View style={styles.tipsContent}>
              <ThemedText style={[styles.tipsTitle, { color: theme.text }]}>Wellness Tips</ThemedText>
              <ThemedText style={[styles.tipsText, { color: theme.textSecondary }]}>
                Take regular breaks, limit screen time before bed, and focus on meaningful connections rather than endless scrolling.
              </ThemedText>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  heroCard: { padding: Spacing.lg },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.lg },
  heroIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  heroInfo: { flex: 1 },
  heroTitle: { fontSize: 13 },
  heroValue: {
    fontSize: 32,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  statsRow: { flexDirection: "row", gap: Spacing.sm },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: Spacing.xs },
  statValue: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  statLabel: { fontSize: 11 },
  card: { padding: Spacing.lg },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  cardTitle: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  activityGrid: { flexDirection: "row", gap: Spacing.sm },
  activityItem: { flex: 1, alignItems: "center", padding: Spacing.md, borderRadius: BorderRadius.md },
  activityValue: {
    fontSize: 20,
    marginTop: Spacing.xs,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  activityLabel: { fontSize: 10, textAlign: "center", marginTop: 2 },
  loader: { paddingVertical: Spacing.lg },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  settingIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  settingInfo: { flex: 1 },
  settingLabel: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  settingDesc: { fontSize: 12, marginTop: 2 },
  limitRow: { marginTop: Spacing.md },
  limitLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  limitButtons: { flexDirection: "row", gap: Spacing.sm },
  limitButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  limitButtonText: { fontSize: 13 },
  tipsCard: { flexDirection: "row", padding: Spacing.md, gap: Spacing.md, alignItems: "flex-start" },
  tipsContent: { flex: 1 },
  tipsTitle: {
    fontSize: 13,
    marginBottom: Spacing.xs,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  tipsText: { fontSize: 12, lineHeight: 18 },
});
