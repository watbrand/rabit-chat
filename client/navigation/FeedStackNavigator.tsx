import React from "react";
import { Pressable, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import FeedScreen from "@/screens/FeedScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import FollowersScreen from "@/screens/FollowersScreen";
import SearchScreen from "@/screens/SearchScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";

export type FeedStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
  UserProfile: { userId: string };
  Followers: { userId: string; type: "followers" | "following" };
  Search: undefined;
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

function SearchButton() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  
  return (
    <Pressable 
      onPress={() => navigation.navigate("Search")}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ padding: 8 }}
    >
      <Feather name="search" size={22} color={theme.text} />
    </Pressable>
  );
}

export default function FeedStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          headerShown: false,
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
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: "Search",
        }}
      />
    </Stack.Navigator>
  );
}
