import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import AdminReportsScreen from "@/screens/AdminReportsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import PrivacySettingsScreen from "@/screens/settings/PrivacySettingsScreen";
import NotificationSettingsScreen from "@/screens/settings/NotificationSettingsScreen";
import MediaSettingsScreen from "@/screens/settings/MediaSettingsScreen";
import BlockedAccountsScreen from "@/screens/settings/BlockedAccountsScreen";
import SecuritySettingsScreen from "@/screens/settings/SecuritySettingsScreen";
import DataAccountScreen from "@/screens/settings/DataAccountScreen";
import VerificationScreen from "@/screens/settings/VerificationScreen";
import ContactInfoSettingsScreen from "@/screens/settings/ContactInfoSettingsScreen";
import DraftsScreen from "@/screens/settings/DraftsScreen";
import ScheduledPostsScreen from "@/screens/settings/ScheduledPostsScreen";
import AlgorithmSettingsScreen from "@/screens/settings/AlgorithmSettingsScreen";
import StudioOverviewScreen from "@/screens/studio/StudioOverviewScreen";
import StudioContentScreen from "@/screens/studio/StudioContentScreen";
import StudioAudienceScreen from "@/screens/studio/StudioAudienceScreen";
import StudioPostDetailScreen from "@/screens/studio/StudioPostDetailScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import FollowersScreen from "@/screens/FollowersScreen";
import SavedPostsScreen from "@/screens/SavedPostsScreen";
import NetWorthPortfolioScreen from "@/screens/NetWorthPortfolioScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  AdminReports: undefined;
  Notifications: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  MediaSettings: undefined;
  BlockedAccounts: undefined;
  SecuritySettings: undefined;
  ContactInfoSettings: undefined;
  DataAccount: undefined;
  Verification: undefined;
  AlgorithmSettings: undefined;
  Drafts: undefined;
  ScheduledPosts: undefined;
  Studio: undefined;
  StudioContent: undefined;
  StudioAudience: undefined;
  StudioPostDetail: { postId: string };
  UserProfile: { userId: string };
  PostDetail: { postId: string };
  Followers: { userId: string; type: "followers" | "following" };
  SavedPosts: undefined;
  NetWorthPortfolio: { userId: string; username?: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

function NotificationBellButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });
  
  const unreadCount = data?.count || 0;
  
  return (
    <Pressable 
      onPress={() => navigation.navigate("Notifications")}
      style={{ marginRight: 16 }}
      testID="button-notifications"
    >
      <View>
        <Feather name="bell" size={24} color={theme.text} />
        {unreadCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.error }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function SettingsButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  
  return (
    <Pressable onPress={() => navigation.navigate("Settings")} testID="button-settings">
      <Feather name="settings" size={24} color={theme.text} />
    </Pressable>
  );
}

function ProfileHeaderRight() {
  return (
    <View style={styles.headerRight}>
      <NotificationBellButton />
      <SettingsButton />
    </View>
  );
}

export default function ProfileStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Profile">
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          headerRight: () => <ProfileHeaderRight />,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: "Edit Profile",
        }}
      />
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{
          title: "Privacy",
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="MediaSettings"
        component={MediaSettingsScreen}
        options={{
          title: "Media",
        }}
      />
      <Stack.Screen
        name="BlockedAccounts"
        component={BlockedAccountsScreen}
        options={{
          title: "Blocked Accounts",
        }}
      />
      <Stack.Screen
        name="SecuritySettings"
        component={SecuritySettingsScreen}
        options={{
          title: "Security",
        }}
      />
      <Stack.Screen
        name="ContactInfoSettings"
        component={ContactInfoSettingsScreen}
        options={{
          title: "Contact Info",
        }}
      />
      <Stack.Screen
        name="DataAccount"
        component={DataAccountScreen}
        options={{
          title: "Data & Account",
        }}
      />
      <Stack.Screen
        name="AdminReports"
        component={AdminReportsScreen}
        options={{
          title: "Reports",
        }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{
          title: "Verification",
        }}
      />
      <Stack.Screen
        name="AlgorithmSettings"
        component={AlgorithmSettingsScreen}
        options={{
          title: "Your Algorithm",
        }}
      />
      <Stack.Screen
        name="Drafts"
        component={DraftsScreen}
        options={{
          title: "Drafts",
        }}
      />
      <Stack.Screen
        name="ScheduledPosts"
        component={ScheduledPostsScreen}
        options={{
          title: "Scheduled Posts",
        }}
      />
      <Stack.Screen
        name="Studio"
        component={StudioOverviewScreen}
        options={{
          title: "Creator Studio",
        }}
      />
      <Stack.Screen
        name="StudioContent"
        component={StudioContentScreen}
        options={{
          title: "Content",
        }}
      />
      <Stack.Screen
        name="StudioAudience"
        component={StudioAudienceScreen}
        options={{
          title: "Audience",
        }}
      />
      <Stack.Screen
        name="StudioPostDetail"
        component={StudioPostDetailScreen}
        options={{
          title: "Post Analytics",
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          title: "Post",
        }}
      />
      <Stack.Screen
        name="Followers"
        component={FollowersScreen}
        options={{
          title: "Connections",
        }}
      />
      <Stack.Screen
        name="SavedPosts"
        component={SavedPostsScreen}
        options={{
          title: "Saved Posts",
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
        }}
      />
      <Stack.Screen
        name="NetWorthPortfolio"
        component={NetWorthPortfolioScreen}
        options={{
          title: "Net Worth Portfolio",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
