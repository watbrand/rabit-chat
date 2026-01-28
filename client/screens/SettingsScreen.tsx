import React from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useThemeContext } from "@/contexts/ThemeContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const { logout, user } = useAuth();
  const navigation = useNavigation<any>();
  const { themeMode, setThemeMode } = useThemeContext();
  
  const { data: adminStatus } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/users/me/admin"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/users/me/admin", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) return { isAdmin: false };
      return res.json();
    },
  });

  const handleLogout = () => {
    console.log("[SettingsScreen] handleLogout called");
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            console.log("[SettingsScreen] Sign Out confirmed, calling logout()");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            logout();
            console.log("[SettingsScreen] logout() called");
          },
        },
      ]
    );
  };

  const handleHelpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("HelpCenter");
  };

  const SettingsRow = ({
    icon,
    label,
    description,
    onPress,
    isDestructive,
    showChevron = true,
  }: {
    icon: string;
    label: string;
    description?: string;
    onPress: () => void;
    isDestructive?: boolean;
    showChevron?: boolean;
  }) => (
    <Pressable
      style={[
        styles.settingsRow,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isDestructive ? theme.error + "20" : theme.primary + "20" },
        ]}
      >
        <Feather
          name={icon as any}
          size={18}
          color={isDestructive ? theme.error : theme.primary}
        />
      </View>
      <View style={styles.labelContainer}>
        <ThemedText
          style={[
            styles.settingsLabel,
            isDestructive && { color: theme.error },
          ]}
        >
          {label}
        </ThemedText>
        {description ? (
          <ThemedText style={[styles.settingsDescription, { color: theme.textSecondary }]}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );

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
          Account
        </ThemedText>
        <View style={[styles.accountCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
          <View style={styles.accountInfo}>
            <ThemedText type="body" style={styles.accountName}>
              {user?.displayName}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              @{user?.username}
            </ThemedText>
          </View>
        </View>
        <View style={{ height: Spacing.sm }} />
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="user"
            label="Edit Profile"
            description="Name, bio, avatar, and more"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="award"
            label="Verification"
            description="Get a verified badge on your profile"
            onPress={() => navigation.navigate("Verification")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="bookmark"
            label="Saved Posts"
            description="View posts you've bookmarked"
            onPress={() => navigation.navigate("SavedPosts")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Creator Tools
        </ThemedText>
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="bar-chart-2"
            label="Creator Studio"
            description="View your content performance and audience insights"
            onPress={() => navigation.navigate("Studio")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="file-text"
            label="Drafts"
            description="View and manage your saved drafts"
            onPress={() => navigation.navigate("Drafts")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="clock"
            label="Scheduled Posts"
            description="View and manage scheduled posts"
            onPress={() => navigation.navigate("ScheduledPosts")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Preferences
        </ThemedText>
        <View style={styles.sectionContent}>
          <View
            style={[
              styles.settingsRow,
              { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather
                name={isDark ? "moon" : "sun"}
                size={18}
                color={theme.primary}
              />
            </View>
            <View style={styles.labelContainer}>
              <ThemedText style={styles.settingsLabel}>
                Dark Mode
              </ThemedText>
              <ThemedText style={[styles.settingsDescription, { color: theme.textSecondary }]}>
                {isDark ? "Dark theme enabled" : "Light theme enabled"}
              </ThemedText>
            </View>
            <Switch
              value={themeMode === "dark"}
              onValueChange={(value) => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setThemeMode(value ? "dark" : "light");
              }}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isDark ? theme.primaryLight : "#FFFFFF"}
            />
          </View>
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="lock"
            label="Privacy"
            description="Account privacy and interaction controls"
            onPress={() => navigation.navigate("PrivacySettings")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="bell"
            label="Notifications"
            description="Manage push notification settings"
            onPress={() => navigation.navigate("NotificationSettings")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="sliders"
            label="Your Algorithm"
            description="View interests and how your feed is personalized"
            onPress={() => navigation.navigate("AlgorithmSettings")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="video"
            label="Media"
            description="Autoplay, data saver, upload quality"
            onPress={() => navigation.navigate("MediaSettings")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="user-x"
            label="Blocked Accounts"
            description="Manage blocked users"
            onPress={() => navigation.navigate("BlockedAccounts")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Security
        </ThemedText>
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="shield"
            label="Password & Sessions"
            description="Change password, manage active sessions"
            onPress={() => navigation.navigate("SecuritySettings")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Features
        </ThemedText>
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="users"
            label="Elite Circles"
            description="Join exclusive groups based on net worth"
            onPress={() => navigation.navigate("Groups")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="calendar"
            label="Events"
            description="Discover and RSVP to exclusive events"
            onPress={() => navigation.navigate("Events")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="credit-card"
            label="Wallet"
            description="Manage your coins and transactions"
            onPress={() => navigation.navigate("Wallet")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="star"
            label="Super Follows"
            description="Manage your subscriptions and followers"
            onPress={() => navigation.navigate("Subscriptions")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="map-pin"
            label="Check In"
            description="Share your location and find nearby friends"
            onPress={() => navigation.navigate("CheckIn")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="radio"
            label="Broadcast Channels"
            description="Follow broadcast channels for updates"
            onPress={() => navigation.navigate("BroadcastChannels")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="video"
            label="Live Streams"
            description="Watch and start live broadcasts"
            onPress={() => navigation.navigate("LiveStream")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="cpu"
            label="AI Features"
            description="AI avatars, translation, and more"
            onPress={() => navigation.navigate("AIFeatures")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="activity"
            label="Digital Wellness"
            description="Focus mode, screen time, and breaks"
            onPress={() => navigation.navigate("DigitalWellness")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="folder"
            label="Chat Folders"
            description="Organize chats, scheduled messages"
            onPress={() => navigation.navigate("ChatFolders")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="send"
            label="Social Features"
            description="Pokes, BFFs, and close friends"
            onPress={() => navigation.navigate("SocialFeatures")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="filter"
            label="Privacy Controls"
            description="Keyword filters, muted & restricted"
            onPress={() => navigation.navigate("PrivacyControls")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="layers"
            label="Content Features"
            description="Threads, duets, stitch, AR filters"
            onPress={() => navigation.navigate("ContentFeatures")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Data & Account
        </ThemedText>
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="download"
            label="Data Export"
            description="Export and backup your account data"
            onPress={() => navigation.navigate("DataExport")}
          />
          <View style={{ height: Spacing.sm }} />
          <SettingsRow
            icon="code"
            label="Developer Tools"
            description="Webhooks and API integrations"
            onPress={() => navigation.navigate("DeveloperTools")}
          />
        </View>
      </View>

      {adminStatus?.isAdmin ? (
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Admin
          </ThemedText>
          <View style={styles.sectionContent}>
            <SettingsRow
              icon="sliders"
              label="Admin Panel"
              description="Manage users and app settings"
              onPress={() => navigation.navigate("Admin")}
            />
            <View style={{ height: Spacing.sm }} />
            <SettingsRow
              icon="flag"
              label="View Reports"
              description="Review user reports"
              onPress={() => navigation.navigate("AdminReports")}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Support
        </ThemedText>
        <View style={styles.sectionContent}>
          <SettingsRow
            icon="help-circle"
            label="Help & Support"
            description="Get help or report an issue"
            onPress={handleHelpPress}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionContent}>
          <Pressable
            style={[
              styles.settingsRow,
              { backgroundColor: theme.error + "15", borderColor: theme.error + "40" },
            ]}
            onPress={() => {
              console.log("[SettingsScreen] Sign Out button pressed directly");
              handleLogout();
            }}
            testID="button-signout"
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.error + "20" },
              ]}
            >
              <Feather
                name="log-out"
                size={18}
                color={theme.error}
              />
            </View>
            <View style={styles.labelContainer}>
              <ThemedText
                style={[
                  styles.settingsLabel,
                  { color: theme.error },
                ]}
              >
                Sign Out
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          RabitChat v1.0.0
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
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
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  accountCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  accountInfo: {
    gap: 2,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  labelContainer: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingsDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  footerText: {
    fontSize: 12,
  },
});
