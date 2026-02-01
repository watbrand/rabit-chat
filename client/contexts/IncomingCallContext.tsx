import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

// Only import native-only modules on native platforms
let Audio: typeof import("expo-av").Audio | null = null;
let Haptics: typeof import("expo-haptics") | null = null;

if (Platform.OS !== "web") {
  Audio = require("expo-av").Audio;
  Haptics = require("expo-haptics");
}

interface IncomingCall {
  callId: string;
  callerId: string;
  caller: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface IncomingCallContextType {
  incomingCall: IncomingCall | null;
  acceptCall: () => void;
  declineCall: () => void;
}

const IncomingCallContext = createContext<IncomingCallContextType | undefined>(undefined);

export function IncomingCallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const ringtoneRef = useRef<any>(null);
  const navigationRef = useRef<NativeStackNavigationProp<RootStackParamList> | null>(null);

  const stopRingtone = useCallback(async () => {
    if (ringtoneRef.current && Audio) {
      try {
        await ringtoneRef.current.stopAsync();
        await ringtoneRef.current.unloadAsync();
      } catch (e) {
        console.warn('Ringtone cleanup error:', e);
      }
      ringtoneRef.current = null;
    }
  }, []);

  const playRingtone = useCallback(async () => {
    if (Platform.OS === "web" || !Audio) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" },
        { isLooping: true, volume: 0.8 }
      );
      ringtoneRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.log("Could not play ringtone:", e);
    }
  }, []);

  const triggerHaptic = useCallback((type: 'impact' | 'notification') => {
    if (Platform.OS === "web" || !Haptics) return;
    
    try {
      if (type === 'impact') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      // Ignore haptics errors
    }
  }, []);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    await stopRingtone();
    triggerHaptic('impact');

    if (Platform.OS !== "web" && Audio) {
      console.log("[IncomingCall] Requesting audio permission before navigation...");
      try {
        const { status } = await Audio.requestPermissionsAsync();
        console.log("[IncomingCall] Audio permission status:", status);
        
        if (status !== "granted") {
          console.log("[IncomingCall] Audio permission denied, declining call");
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "call_decline",
              targetUserId: incomingCall.callerId,
              callId: incomingCall.callId,
            }));
          }
          setIncomingCall(null);
          return;
        }
      } catch (error) {
        console.error("[IncomingCall] Permission request error:", error);
        setIncomingCall(null);
        return;
      }
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_answer",
        targetUserId: incomingCall.callerId,
        callId: incomingCall.callId,
      }));
    }

    if (navigationRef.current) {
      navigationRef.current.navigate("VoiceCall", {
        otherUserId: incomingCall.callerId,
        otherUser: incomingCall.caller,
        isIncoming: true,
        callId: incomingCall.callId,
      });
    }

    setIncomingCall(null);
  }, [incomingCall, stopRingtone, triggerHaptic]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    
    stopRingtone();
    triggerHaptic('impact');

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_decline",
        targetUserId: incomingCall.callerId,
        callId: incomingCall.callId,
      }));
    }

    setIncomingCall(null);
  }, [incomingCall, stopRingtone, triggerHaptic]);

  useEffect(() => {
    // Skip WebSocket connection on web - calls not supported on web
    if (Platform.OS === "web") return;
    if (!user?.id) return;

    const wsUrl = new URL("/ws", getApiUrl());
    wsUrl.protocol = wsUrl.protocol.replace("http", "ws");
    wsUrl.searchParams.set("userId", user.id);

    let ws: WebSocket | null = null;
    
    try {
      ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "incoming_call") {
            triggerHaptic('notification');
            playRingtone();
            setIncomingCall({
              callId: data.callId,
              callerId: data.callerId,
              caller: data.caller || {
                id: data.callerId,
                username: "Unknown",
                displayName: "Unknown Caller",
                avatarUrl: null,
              },
            });
          }

          if (data.type === "call_ended" || data.type === "call_declined") {
            stopRingtone();
            setIncomingCall(null);
          }
        } catch (e) {
          console.warn('WebSocket message parse error:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('IncomingCall WebSocket error:', e);
      };
    } catch (e) {
      console.warn('Failed to create WebSocket:', e);
    }

    return () => {
      ws?.close();
      stopRingtone();
    };
  }, [user?.id, playRingtone, stopRingtone, triggerHaptic]);

  return (
    <IncomingCallContext.Provider value={{ incomingCall, acceptCall, declineCall }}>
      <NavigationSetter navigationRef={navigationRef} />
      {children}
    </IncomingCallContext.Provider>
  );
}

function NavigationSetter({ navigationRef }: { navigationRef: React.MutableRefObject<NativeStackNavigationProp<RootStackParamList> | null> }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation, navigationRef]);

  return null;
}

export function useIncomingCall() {
  const context = useContext(IncomingCallContext);
  if (!context) {
    throw new Error("useIncomingCall must be used within IncomingCallProvider");
  }
  return context;
}
