import { useEffect, useState, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAuth } from "./useAuth";
import { apiRequest, getApiUrl } from "@/lib/query-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null;
  }

  if (!Device.isDevice) {
    console.log("[Push] Physical device required for push notifications");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission not granted");
    return null;
  }

  try {
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      Constants.expoConfig?.slug;
    
    if (!projectId) {
      console.log("[Push] No projectId available - push notifications disabled");
      return null;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return tokenData.data;
  } catch (error: any) {
    if (error?.message?.includes("projectId")) {
      console.log("[Push] Push notifications require EAS project configuration");
    } else {
      console.error("[Push] Failed to get push token:", error);
    }
    return null;
  }
}

export function usePushNotifications() {
  const { user, isLoading } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const hasRegistered = useRef(false);

  useEffect(() => {
    if (isLoading || !user || hasRegistered.current) {
      return;
    }

    const registerToken = async () => {
      hasRegistered.current = true;
      
      const token = await registerForPushNotificationsAsync();
      setPushToken(token);

      if (token) {
        try {
          await fetch(new URL("/api/push-tokens", getApiUrl()), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              token,
              platform: Platform.OS,
              deviceName: Device.deviceName || "Unknown Device",
            }),
          });
          console.log("[Push] Token registered successfully");
        } catch (error) {
          console.error("[Push] Failed to register token:", error);
        }
      }
    };

    registerToken();
  }, [user, isLoading]);

  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    };
    checkPermission();
  }, []);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      console.log("[Push] Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      console.log("[Push] Notification tapped:", data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    pushToken,
    permissionStatus,
    isRegistered: !!pushToken,
  };
}
