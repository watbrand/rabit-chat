import React, { useEffect, useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { getApiUrl } from "@/lib/query-client";
import { useAuth } from "@/hooks/useAuth";
import FeedStackNavigator from "@/navigation/FeedStackNavigator";
import DiscoverStackNavigator from "@/navigation/DiscoverStackNavigator";
import MallStackNavigator from "@/navigation/MallStackNavigator";
import MessagesStackNavigator from "@/navigation/MessagesStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Animation } from "@/constants/theme";

export type MainTabParamList = {
  FeedTab: undefined;
  DiscoverTab: undefined;
  MallTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function NotificationIcon({ color, size }: { color: string; size: number }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const pulseScale = useSharedValue(1);
  
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    // Skip WebSocket on web - use polling only
    if (Platform.OS === "web") return;
    if (!user?.id) return;
    
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isUnmounted = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connect = () => {
      if (isUnmounted) return;
      
      try {
        const wsUrl = getApiUrl().replace("https://", "wss://").replace("http://", "ws://");
        ws = new WebSocket(`${wsUrl}ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "notification:new") {
              queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
              queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            }
          } catch (error) {
            // WebSocket message parse error - ignore malformed messages
          }
        };
        
        ws.onclose = () => {
          if (!isUnmounted && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            reconnectTimeout = setTimeout(connect, delay);
          }
        };
        
        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        console.warn('WebSocket connection failed:', e);
      }
    };
    
    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      ws?.close();
    };
  }, [user?.id, queryClient]);

  const unreadCount = data?.count || 0;

  useEffect(() => {
    if (unreadCount > 0) {
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.2, { damping: 6 }),
          withSpring(1, { damping: 8 })
        ),
        3,
        true
      );
    }
  }, [unreadCount]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View>
      <Ionicons name="notifications" size={size} color={color} />
      {unreadCount > 0 ? (
        <Animated.View style={[styles.badge, { backgroundColor: theme.error }, badgeAnimatedStyle]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function TabBarBackground() {
  const { theme, isDark } = useTheme();

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={isDark ? 70 : 100}
        tint={isDark ? "dark" : "light"}
        style={[
          StyleSheet.absoluteFill,
          styles.tabBarBackground,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.tabBarBackground,
        {
          backgroundColor: isDark
            ? "rgba(10, 10, 15, 0.98)"
            : "rgba(255, 255, 255, 0.85)",
        },
      ]}
    />
  );
}

interface AnimatedTabIconProps {
  focused: boolean;
  color: string;
  size: number;
  icon: string;
}

function AnimatedTabIcon({ focused, color, size, icon }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, Animation.springBouncy);
      translateY.value = withSpring(-2, Animation.spring);
    } else {
      scale.value = withSpring(1, Animation.spring);
      translateY.value = withSpring(0, Animation.spring);
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={styles.tabIconWrapper}>
      <Animated.View style={animatedStyle}>
        <Ionicons name={icon as any} size={size} color={color} />
      </Animated.View>
    </View>
  );
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handleTabPress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const tabBarHeight = 64 + Math.max(insets.bottom, 8);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="FeedTab"
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: isDark
            ? "rgba(255, 255, 255, 0.45)"
            : theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
            height: tabBarHeight,
            paddingBottom: Math.max(insets.bottom, 8),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarBackground: () => <TabBarBackground />,
          headerShown: false,
        }}
        screenListeners={{
          tabPress: handleTabPress,
        }}
      >
        <Tab.Screen
          name="FeedTab"
          component={FeedStackNavigator}
          options={{
            title: "Feed",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color} size={size} icon={focused ? "home" : "home-outline"} />
            ),
          }}
        />
        <Tab.Screen
          name="DiscoverTab"
          component={DiscoverStackNavigator}
          options={{
            title: "Discover",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color} size={size} icon={focused ? "compass" : "compass-outline"} />
            ),
          }}
        />
        <Tab.Screen
          name="MallTab"
          component={MallStackNavigator}
          options={{
            title: "Mall",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color} size={size} icon={focused ? "bag" : "bag-outline"} />
            ),
          }}
        />
        <Tab.Screen
          name="MessagesTab"
          component={MessagesStackNavigator}
          options={{
            title: "Messages",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color} size={size} icon={focused ? "chatbubble" : "chatbubble-outline"} />
            ),
          }}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileStackNavigator}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <AnimatedTabIcon focused={focused} color={color} size={size} icon={focused ? "person" : "person-outline"} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarBackground: {
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#0A0A0F",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  tabIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 32,
  },
});
