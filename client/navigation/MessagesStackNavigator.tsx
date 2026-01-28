import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MessagesScreen from "@/screens/MessagesScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import FollowersScreen from "@/screens/FollowersScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type MessagesStackParamList = {
  Messages: undefined;
  UserProfile: { userId: string };
  Followers: { userId: string; type: "followers" | "following" };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export default function MessagesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: "Messages",
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
        name="Followers"
        component={FollowersScreen}
        options={{
          title: "Connections",
        }}
      />
    </Stack.Navigator>
  );
}
