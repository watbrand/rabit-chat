import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/useAuth";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

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
  const ringtoneRef = useRef<Audio.Sound | null>(null);
  const navigationRef = useRef<NativeStackNavigationProp<RootStackParamList> | null>(null);

  const stopRingtone = useCallback(async () => {
    if (ringtoneRef.current) {
      try {
        await ringtoneRef.current.stopAsync();
        await ringtoneRef.current.unloadAsync();
      } catch (e) {}
      ringtoneRef.current = null;
    }
  }, []);

  const playRingtone = useCallback(async () => {
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

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    // Stop ringtone first and wait for it to fully stop
    await stopRingtone();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Request microphone permission BEFORE navigating on iOS
    // This prevents the permission dialog from being dismissed by navigation
    console.log("[IncomingCall] Requesting audio permission before navigation...");
    try {
      const { status } = await Audio.requestPermissionsAsync();
      console.log("[IncomingCall] Audio permission status:", status);
      
      if (status !== "granted") {
        console.log("[IncomingCall] Audio permission denied, declining call");
        // If permission denied, decline the call
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

    // Now that we have permission, send the answer and navigate
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
  }, [incomingCall, stopRingtone]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    
    stopRingtone();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_decline",
        targetUserId: incomingCall.callerId,
        callId: incomingCall.callId,
      }));
    }

    setIncomingCall(null);
  }, [incomingCall, stopRingtone]);

  useEffect(() => {
    if (!user?.id) return;

    const wsUrl = new URL("/ws", getApiUrl());
    wsUrl.protocol = wsUrl.protocol.replace("http", "ws");
    wsUrl.searchParams.set("userId", user.id);

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "incoming_call") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      } catch (e) {}
    };

    return () => {
      ws.close();
      stopRingtone();
    };
  }, [user?.id, playRingtone, stopRingtone]);

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
