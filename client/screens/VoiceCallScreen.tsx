import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  AppState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { LinearGradient } from "expo-linear-gradient";
import { Spacing } from "@/constants/theme";

// Only import native modules on native platforms
let Audio: any = null;
let InterruptionModeIOS: any = null;
let InterruptionModeAndroid: any = null;
let FileSystem: any = null;
let Haptics: any = null;

if (Platform.OS !== "web") {
  try {
    const av = require("expo-av");
    Audio = av.Audio;
    InterruptionModeIOS = av.InterruptionModeIOS;
    InterruptionModeAndroid = av.InterruptionModeAndroid;
    FileSystem = require("expo-file-system/legacy");
    Haptics = require("expo-haptics");
  } catch (e) {
    // Native modules not available
  }
}
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type CallStatus = "connecting" | "ringing" | "ongoing" | "ended" | "declined" | "missed";

interface VoiceCallScreenProps {
  route: any;
  navigation: any;
}

export default function VoiceCallScreen({ route, navigation }: VoiceCallScreenProps) {
  const { otherUserId, otherUser, isIncoming, callId: initialCallId } = route.params || {};
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Voice calls are not supported on web
  if (Platform.OS === "web") {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <Feather name="phone-off" size={48} color="#8B5CF6" />
        <ThemedText style={{ marginTop: 16, color: '#fff', fontSize: 18 }}>
          Voice calls are only available in the mobile app
        </ThemedText>
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#8B5CF6', borderRadius: 24 }}
        >
          <ThemedText style={{ color: '#fff' }}>Go Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const [callStatus, setCallStatus] = useState<CallStatus>(isIncoming ? "ongoing" : "connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callId, setCallId] = useState(initialCallId || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const [audioPermission, setAudioPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [wsAuthenticated, setWsAuthenticated] = useState(false);
  const [audioStats, setAudioStats] = useState({ sent: 0, received: 0 });

  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempFileCounterRef = useRef(0);
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  // CRITICAL: Refs to avoid stale closure issues in intervals/callbacks
  const callStatusRef = useRef<CallStatus>(isIncoming ? "ongoing" : "connecting");
  const isMutedRef = useRef(false);
  const wsAuthenticatedRef = useRef(false);

  const pulseScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.3);

  // Keep refs in sync with state (CRITICAL for interval callbacks)
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { wsAuthenticatedRef.current = wsAuthenticated; }, [wsAuthenticated]);

  useEffect(() => {
    if (callStatus === "ringing" || callStatus === "connecting") {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.2, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
      ringOpacity.value = withTiming(0);
    }
  }, [callStatus]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
  }));

  const setupAudio = useCallback(async () => {
    try {
      const { status: currentStatus } = await Audio.getPermissionsAsync();
      let permissionGranted = currentStatus === "granted";
      
      if (!permissionGranted) {
        const { status } = await Audio.requestPermissionsAsync();
        permissionGranted = status === "granted";
      }
      
      if (!permissionGranted) {
        setInitError("Microphone access is required for voice calls");
        setIsInitializing(false);
        return false;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !isSpeaker,
      });
      
      setAudioPermission(true);
      setIsInitializing(false);
      return true;
    } catch (error) {
      setInitError("Failed to initialize audio. Please try again.");
      setIsInitializing(false);
      return false;
    }
  }, [isSpeaker, isIncoming]);

  const connectWebSocket = useCallback(() => {
    if (!user?.id) {
      return;
    }
    
    // Build WebSocket URL with userId for authentication
    const wsUrl = new URL("/ws", getApiUrl());
    wsUrl.protocol = wsUrl.protocol.replace("https", "wss").replace("http", "ws");
    wsUrl.searchParams.set("userId", user.id);
    
    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      // Send auth_success immediately since we authenticated via URL
      // The server sends auth_success after connection with userId param
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "auth_success") {
          setWsAuthenticated(true);
          wsAuthenticatedRef.current = true; // Update ref immediately
          
          if (isIncoming) {
            // For incoming calls, we're already in "ongoing" state - start recording now
            callStartTimeRef.current = Date.now();
            callStatusRef.current = "ongoing"; // Ensure ref is correct
            // Delay slightly to ensure audio is configured
            const timeoutId = setTimeout(() => {
              startRecording();
            }, 300);
            timeoutsRef.current.add(timeoutId);
          } else {
            // For outgoing calls, send offer
            ws.send(JSON.stringify({
              type: "call_offer",
              targetUserId: otherUserId,
              callId,
              callType: "AUDIO",
              caller: user ? {
                id: user.id,
                username: user.username,
                displayName: user.displayName || user.username,
                avatarUrl: user.avatarUrl,
              } : null,
            }));
            setCallStatus("ringing");
          }
        }

        if (data.type === "call_answered" && data.callId === callId) {
          setCallStatus("ongoing");
          callStatusRef.current = "ongoing"; // Update ref immediately
          callStartTimeRef.current = Date.now();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Start recording - wsAuthenticatedRef should be true since we got here via call_offer
          const timeoutId = setTimeout(() => startRecording(), 100);
          timeoutsRef.current.add(timeoutId);
        }

        if (data.type === "call_declined" && data.callId === callId) {
          setCallStatus("declined");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          const timeoutId = setTimeout(() => navigation.goBack(), 2000);
          timeoutsRef.current.add(timeoutId);
        }

        if (data.type === "call_ended" && data.callId === callId) {
          setCallStatus("ended");
          stopRecording();
          const timeoutId = setTimeout(() => navigation.goBack(), 1500);
          timeoutsRef.current.add(timeoutId);
        }

        if (data.type === "audio_data" && data.callId === callId) {
          setAudioStats(prev => ({ ...prev, received: prev.received + 1 }));
          audioQueueRef.current.push(data.audioData);
          playNextAudio();
        }

        if (data.type === "incoming_call" && isIncoming) {
          setCallId(data.callId);
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onclose = () => {
      // WebSocket closed
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [callId, isIncoming, otherUserId, navigation, user]);

  const startRecording = async () => {
    if (recordingRef.current || isMutedRef.current || !wsAuthenticatedRef.current) return;

    try {
      const recording = new Audio.Recording();
      
      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 32000,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 32000,
        },
      });
      
      await recording.startAsync();
      recordingRef.current = recording;

      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      
      // 300ms chunks for low latency
      recordingIntervalRef.current = setInterval(async () => {
        if (recordingRef.current && callStatusRef.current === "ongoing" && !isMutedRef.current && wsAuthenticatedRef.current) {
          await sendAudioChunk();
        }
      }, 300);
      
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const sendAudioChunk = async () => {
    if (!recordingRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      const currentRecording = recordingRef.current;
      recordingRef.current = null;
      
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      
      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Voice Activity Detection: only send if chunk is substantial (not silence)
        // Silence produces very small base64 chunks (~100-200 chars), voice is larger
        const MIN_VOICE_SIZE = 200;
        if (base64 && base64.length > MIN_VOICE_SIZE && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "audio_data",
            targetUserId: otherUserId,
            callId,
            audioData: base64,
            timestamp: Date.now(),
          }));
          setAudioStats(prev => ({ ...prev, sent: prev.sent + 1 }));
        }
        
        // Fire-and-forget temp file cleanup - failure is non-critical
        try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch (e) {
          // Cleanup - ignore errors: temp file may not exist or already deleted
        }
      }

      // Start new recording immediately
      if (callStatusRef.current === "ongoing" && !isMutedRef.current && wsAuthenticatedRef.current) {
        const newRecording = new Audio.Recording();
        await newRecording.prepareToRecordAsync({
          android: {
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 32000,
          },
          ios: {
            extension: ".m4a",
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.LOW,
            sampleRate: 16000,
            numberOfChannels: 1,
            bitRate: 32000,
          },
          web: {
            mimeType: "audio/webm",
            bitsPerSecond: 32000,
          },
        });
        await newRecording.startAsync();
        recordingRef.current = newRecording;
      }
    } catch (error) {
      recordingRef.current = null;
      if (callStatusRef.current === "ongoing" && !isMutedRef.current && wsAuthenticatedRef.current) {
        const timeoutId = setTimeout(() => startRecording(), 300);
        timeoutsRef.current.add(timeoutId);
      }
    }
  };

  const stopRecording = async () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        // Fire-and-forget temp file cleanup - failure is non-critical
        if (uri) { try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch (e) {
          // Cleanup - ignore errors: temp file may not exist or already deleted
        } }
      } catch (error) {
        // Recording may already be stopped/unloaded - non-critical cleanup error
      }
      recordingRef.current = null;
    }
  };

  const playNextAudio = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    // Skip stale audio if queue is backed up (prioritize current audio)
    while (audioQueueRef.current.length > 3) {
      audioQueueRef.current.shift();
    }

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift();

    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      tempFileCounterRef.current += 1;
      const tempUri = `${FileSystem.cacheDirectory}voice_${Date.now()}_${tempFileCounterRef.current}.m4a`;
      
      await FileSystem.writeAsStringAsync(tempUri, audioData!, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Ensure audio mode is configured for playback on iOS
      if (Platform.OS === "ios") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      }
      
      // Create and play sound
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: tempUri },
        { shouldPlay: true, volume: 1.0, isMuted: false }
      );
      soundRef.current = sound;

      // Pre-prepare next audio while current plays (overlapping preparation)
      const prepareNextChunk = audioQueueRef.current.length > 0;

      sound.setOnPlaybackStatusUpdate(async (status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          isPlayingRef.current = false;
          // Fire-and-forget temp file cleanup - failure is non-critical
          try { await FileSystem.deleteAsync(tempUri, { idempotent: true }); } catch (e) {
            // Cleanup - ignore errors: temp file may not exist or already deleted
          }
          playNextAudio();
        }
      });

      // If more chunks waiting, prep next file in background
      if (prepareNextChunk && audioQueueRef.current.length > 0) {
        const nextData = audioQueueRef.current[0];
        const nextUri = `${FileSystem.cacheDirectory}voice_${Date.now()}_${tempFileCounterRef.current + 1}.m4a`;
        // Fire-and-forget background pre-caching - failure handled by main playback flow
        FileSystem.writeAsStringAsync(nextUri, nextData, {
          encoding: FileSystem.EncodingType.Base64,
        }).catch(() => {
          // Cleanup - ignore errors: pre-caching is optional, main flow handles failures
        });
      }
    } catch (error) {
      isPlayingRef.current = false;
      // Try next chunk after a small delay
      const timeoutId = setTimeout(() => playNextAudio(), 50);
      timeoutsRef.current.add(timeoutId);
    }
  };

  const answerCall = async () => {
    const audioReady = await setupAudio();
    if (!audioReady) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_answer",
        targetUserId: otherUserId,
        callId,
      }));
      setCallStatus("ongoing");
      callStartTimeRef.current = Date.now();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startRecording();
    }
  };

  const declineCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_decline",
        targetUserId: otherUserId,
        callId,
      }));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.goBack();
  };

  const endCall = async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "call_end",
        targetUserId: otherUserId,
        callId,
      }));
    }
    await stopRecording();
    setCallStatus("ended");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const timeoutId = setTimeout(() => navigation.goBack(), 500);
    timeoutsRef.current.add(timeoutId);
  };

  const toggleMute = async () => {
    setIsMuted((prev) => {
      if (!prev) {
        stopRecording();
      } else if (callStatus === "ongoing") {
        startRecording();
      }
      return !prev;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSpeaker = async () => {
    const newSpeaker = !isSpeaker;
    setIsSpeaker(newSpeaker);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: !newSpeaker,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeCall = async () => {
      try {
        const ready = await setupAudio();
        
        if (!isMounted) {
          return;
        }
        
        if (ready) {
          connectWebSocket();
          // Recording will start after auth_success is received from WebSocket
          // See ws.onmessage handler for auth_success
        }
      } catch (error) {
        if (isMounted) {
          setInitError("Failed to start call. Please try again.");
          setIsInitializing(false);
        }
      }
    };
    
    initializeCall();

    return () => {
      isMounted = false;
      stopRecording();
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (callStatus === "ongoing") {
      // Ensure call start time is set
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current!) / 1000);
        setCallDuration(elapsed);
      }, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case "connecting":
        return "Connecting...";
      case "ringing":
        return isIncoming ? "Incoming call..." : "Ringing...";
      case "ongoing":
        return formatDuration(callDuration);
      case "ended":
        return "Call ended";
      case "declined":
        return "Call declined";
      case "missed":
        return "Missed call";
      default:
        return "";
    }
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f23"] : ["#667eea", "#764ba2", "#6B73FF"]}
        style={styles.container}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={otherUser?.avatarUrl}
              size={140}
            />
          </View>
          <ThemedText style={[styles.userName, { marginTop: 24 }]}>
            {otherUser?.displayName || otherUser?.username || "Unknown"}
          </ThemedText>
          <ThemedText style={[styles.callStatus, { marginTop: 8 }]}>
            Setting up call...
          </ThemedText>
        </View>
      </LinearGradient>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f23"] : ["#667eea", "#764ba2", "#6B73FF"]}
        style={styles.container}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40, justifyContent: 'center', alignItems: 'center' }]}>
          <View style={[styles.errorIcon, { marginBottom: 24 }]}>
            <Feather name="mic-off" size={64} color="rgba(255,255,255,0.7)" />
          </View>
          <ThemedText style={[styles.userName, { marginTop: 16 }]}>
            Call Failed
          </ThemedText>
          <ThemedText style={[styles.callStatus, { marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }]}>
            {initError}
          </ThemedText>
          <Pressable
            style={[styles.callButton, styles.endButton, { marginTop: 32 }]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={28} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f23"] : ["#667eea", "#764ba2", "#6B73FF"]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 100 }]}>
        <View style={styles.topSection}>
          {callStatus === "ongoing" ? (
            <View style={styles.ongoingBadge}>
              <View style={styles.recordingDot} />
              <ThemedText style={styles.ongoingText}>Voice Call</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.centerSection}>
          <View style={styles.avatarContainer}>
            {(callStatus === "ringing" || callStatus === "connecting") ? (
              <>
                <Animated.View style={[styles.pulseRing, styles.pulseRing1, ringStyle]} />
                <Animated.View style={[styles.pulseRing, styles.pulseRing2, ringStyle]} />
              </>
            ) : null}
            <Animated.View style={[styles.avatarWrapper, (callStatus === "ringing" || callStatus === "connecting") ? pulseStyle : undefined]}>
              <Avatar
                uri={otherUser?.avatarUrl}
                size={140}
              />
            </Animated.View>
          </View>

          <ThemedText style={styles.userName}>
            {otherUser?.displayName || otherUser?.username || "Unknown"}
          </ThemedText>
          <ThemedText style={styles.callStatus}>
            {getStatusText()}
          </ThemedText>
          {callStatus === "ongoing" ? (
            <View style={styles.audioStatsContainer}>
              <View style={styles.audioStatItem}>
                <Feather name="arrow-up" size={12} color="rgba(255,255,255,0.7)" />
                <ThemedText style={styles.audioStatText}>{audioStats.sent}</ThemedText>
              </View>
              <View style={styles.audioStatItem}>
                <Feather name="arrow-down" size={12} color="rgba(255,255,255,0.7)" />
                <ThemedText style={styles.audioStatText}>{audioStats.received}</ThemedText>
              </View>
            </View>
          ) : null}
        </View>

        <View style={[styles.controlsSection, { paddingBottom: insets.bottom + 40 }]}>
          {callStatus === "ringing" && isIncoming ? (
            <View style={styles.incomingControls}>
              <Pressable
                style={[styles.callButton, styles.declineButton]}
                onPress={declineCall}
              >
                <Feather name="phone-off" size={32} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.callButton, styles.answerButton]}
                onPress={answerCall}
              >
                <Feather name="phone" size={32} color="#fff" />
              </Pressable>
            </View>
          ) : callStatus === "ongoing" ? (
            <View style={styles.ongoingControls}>
              <View style={styles.controlRow}>
                <Pressable
                  style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                  onPress={toggleMute}
                >
                  <View style={[styles.controlIcon, isMuted && styles.controlIconActive]}>
                    <Feather name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
                  </View>
                  <ThemedText style={styles.controlLabel}>
                    {isMuted ? "Unmute" : "Mute"}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
                  onPress={toggleSpeaker}
                >
                  <View style={[styles.controlIcon, isSpeaker && styles.controlIconActive]}>
                    <Feather name={isSpeaker ? "volume-2" : "volume-1"} size={24} color="#fff" />
                  </View>
                  <ThemedText style={styles.controlLabel}>
                    {isSpeaker ? "Speaker" : "Earpiece"}
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable
                style={[styles.callButton, styles.endCallButton]}
                onPress={endCall}
              >
                <Feather name="phone-off" size={32} color="#fff" />
              </Pressable>
            </View>
          ) : callStatus === "connecting" || (callStatus === "ringing" && !isIncoming) ? (
            <View style={styles.connectingControls}>
              <Pressable
                style={[styles.callButton, styles.endCallButton]}
                onPress={endCall}
              >
                <Feather name="phone-off" size={32} color="#fff" />
              </Pressable>
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  ongoingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 8,
  },
  ongoingText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
  centerSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  avatarContainer: {
    position: "relative",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  pulseRing1: {
    width: 180,
    height: 180,
  },
  pulseRing2: {
    width: 200,
    height: 200,
  },
  avatarWrapper: {
    borderRadius: 70,
    overflow: "hidden",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 24,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  callStatus: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 8,
    textAlign: "center",
  },
  controlsSection: {
    paddingHorizontal: 32,
  },
  incomingControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  ongoingControls: {
    alignItems: "center",
  },
  connectingControls: {
    alignItems: "center",
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
    gap: 48,
  },
  controlButton: {
    alignItems: "center",
  },
  controlButtonActive: {},
  controlIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  controlIconActive: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  controlLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "500",
  },
  callButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  answerButton: {
    backgroundColor: "#22C55E",
  },
  declineButton: {
    backgroundColor: "#EF4444",
  },
  endCallButton: {
    backgroundColor: "#EF4444",
  },
  cancelText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 16,
    marginTop: 16,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  endButton: {
    backgroundColor: "#EF4444",
  },
  audioStatsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 16,
  },
  audioStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  audioStatText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "500",
  },
});
