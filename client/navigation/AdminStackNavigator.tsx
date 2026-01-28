import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScreenOptions } from "@/hooks/useScreenOptions";

import AdminOverviewScreen from "@/screens/admin/AdminOverviewScreen";
import AdminUsersScreen from "@/screens/admin/AdminUsersScreen";
import AdminPostsScreen from "@/screens/admin/AdminPostsScreen";
import AdminCommentsScreen from "@/screens/admin/AdminCommentsScreen";
import AdminStoriesScreen from "@/screens/admin/AdminStoriesScreen";
import AdminReportsScreen from "@/screens/admin/AdminReportsScreen";
import AdminRolesScreen from "@/screens/admin/AdminRolesScreen";
import AdminSettingsScreen from "@/screens/admin/AdminSettingsScreen";
import AdminAuditScreen from "@/screens/admin/AdminAuditScreen";
import AdminVerificationScreen from "@/screens/admin/AdminVerificationScreen";
import AdminMusicScreen from "@/screens/admin/AdminMusicScreen";
import AdminEconomyScreen from "@/screens/admin/AdminEconomyScreen";
import AdminTicketsScreen from "@/screens/admin/AdminTicketsScreen";
import AdminHelpCenterScreen from "@/screens/admin/AdminHelpCenterScreen";

export type AdminStackParamList = {
  AdminOverview: undefined;
  AdminUsers: undefined;
  AdminPosts: undefined;
  AdminComments: undefined;
  AdminStories: undefined;
  AdminReports: undefined;
  AdminRoles: undefined;
  AdminSettings: undefined;
  AdminAudit: undefined;
  AdminVerification: undefined;
  AdminMusic: undefined;
  AdminEconomy: undefined;
  AdminTickets: undefined;
  AdminHelpCenter: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        headerTintColor: "#8B5CF6",
      }}
    >
      <Stack.Screen
        name="AdminOverview"
        component={AdminOverviewScreen}
        options={{ title: "Admin Panel" }}
      />
      <Stack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: "Users" }}
      />
      <Stack.Screen
        name="AdminPosts"
        component={AdminPostsScreen}
        options={{ title: "Posts" }}
      />
      <Stack.Screen
        name="AdminComments"
        component={AdminCommentsScreen}
        options={{ title: "Comments" }}
      />
      <Stack.Screen
        name="AdminStories"
        component={AdminStoriesScreen}
        options={{ title: "Stories" }}
      />
      <Stack.Screen
        name="AdminReports"
        component={AdminReportsScreen}
        options={{ title: "Reports" }}
      />
      <Stack.Screen
        name="AdminRoles"
        component={AdminRolesScreen}
        options={{ title: "Roles & Permissions" }}
      />
      <Stack.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{ title: "App Settings" }}
      />
      <Stack.Screen
        name="AdminAudit"
        component={AdminAuditScreen}
        options={{ title: "Audit Logs" }}
      />
      <Stack.Screen
        name="AdminVerification"
        component={AdminVerificationScreen}
        options={{ title: "Verification Requests" }}
      />
      <Stack.Screen
        name="AdminMusic"
        component={AdminMusicScreen}
        options={{ title: "Music Library" }}
      />
      <Stack.Screen
        name="AdminEconomy"
        component={AdminEconomyScreen}
        options={{ title: "Economy Management" }}
      />
      <Stack.Screen
        name="AdminTickets"
        component={AdminTicketsScreen}
        options={{ title: "Support Tickets" }}
      />
      <Stack.Screen
        name="AdminHelpCenter"
        component={AdminHelpCenterScreen}
        options={{ title: "Help Center" }}
      />
    </Stack.Navigator>
  );
}
