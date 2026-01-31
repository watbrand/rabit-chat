import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "@/components/Avatar";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface VideoCall {
  id: string;
  callerId: string;
  calleeId: string;
  callType: "VIDEO" | "AUDIO";
  status: "RINGING" | "ONGOING" | "ENDED" | "MISSED" | "DECLINED";
  roomId?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  caller?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  callee?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

interface CallScreenProps {
  route: any;
  navigation: any;
}

export default function VideoCallScreen({ route, navigation }: CallScreenProps) {
  const { callId, isIncoming, otherUser, callType = "VIDEO" } = route.params || {};
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const { data: call, isLoading, error, refetch } = useQuery<VideoCall>({
    queryKey: ["/api/calls", callId],
    enabled: !!callId,
    refetchInterval: 3000,
  });

  const answerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/calls/${callId}/answer`);
    },
  });

  const endMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/calls/${callId}/end`);
    },
    onSuccess: () => {
      navigation.goBack();
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (call?.status === "ONGOING" && call.startedAt) {
      interval = setInterval(() => {
        const start = new Date(call.startedAt!).getTime();
        const now = Date.now();
        setCallDuration(Math.floor((now - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [call?.status, call?.startedAt]);

  useEffect(() => {
    if (call?.status === "ENDED" || call?.status === "DECLINED") {
      setTimeout(() => navigation.goBack(), 2000);
    }
  }, [call?.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const displayUser = otherUser || (isIncoming ? call?.caller : call?.callee);
  const isOngoing = call?.status === "ONGOING";
  const isRinging = call?.status === "RINGING" || !call;

  if (error && callId) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Feather name="alert-circle" size={48} color="#f44336" />
        <Text style={styles.errorText}>Failed to load call</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#1a1a2e" }]}>
      <View style={styles.videoBackground}>
        {callType === "VIDEO" && isOngoing ? (
          <View style={styles.videoPlaceholder}>
            <Feather name="video" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.videoPlaceholderText}>Video Stream</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.overlay, { paddingTop: insets.top + 16 }]}>
        <View style={styles.topBar}>
          {isOngoing ? (
            <View style={styles.durationBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.centerSection}>
          <Animated.View style={[styles.avatarWrapper, isRinging && pulseStyle]}>
            <Avatar
              uri={displayUser?.avatarUrl}
              size={120}
            />
          </Animated.View>
          <Text style={styles.userName}>
            {displayUser?.displayName || displayUser?.username || "Unknown"}
          </Text>
          <Text style={styles.callStatus}>
            {isRinging
              ? isIncoming
                ? "Incoming call..."
                : "Calling..."
              : isOngoing
              ? callType === "VIDEO" ? "Video Call" : "Voice Call"
              : call?.status || "Connecting..."}
          </Text>
        </View>

        <View style={[styles.controlsSection, { paddingBottom: insets.bottom + 32 }]}>
          {isRinging && isIncoming ? (
            <View style={styles.incomingControls}>
              <Pressable
                style={[styles.callButton, styles.declineButton]}
                onPress={() => endMutation.mutate()}
              >
                <Feather name="phone-off" size={28} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.callButton, styles.answerButton]}
                onPress={() => answerMutation.mutate()}
              >
                <Feather name="phone" size={28} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.ongoingControls}>
              <View style={styles.controlRow}>
                <Pressable
                  style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  <Feather name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
                  <Text style={styles.controlLabel}>{isMuted ? "Unmute" : "Mute"}</Text>
                </Pressable>

                {callType === "VIDEO" ? (
                  <Pressable
                    style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
                    onPress={() => setIsVideoOff(!isVideoOff)}
                  >
                    <Feather name={isVideoOff ? "video-off" : "video"} size={24} color="#fff" />
                    <Text style={styles.controlLabel}>{isVideoOff ? "Camera On" : "Camera Off"}</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
                  onPress={() => setIsSpeaker(!isSpeaker)}
                >
                  <Feather name={isSpeaker ? "volume-2" : "volume-1"} size={24} color="#fff" />
                  <Text style={styles.controlLabel}>Speaker</Text>
                </Pressable>

                {callType === "VIDEO" ? (
                  <Pressable style={styles.controlButton}>
                    <Feather name="refresh-cw" size={24} color="#fff" />
                    <Text style={styles.controlLabel}>Flip</Text>
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                style={[styles.callButton, styles.endCallButton]}
                onPress={() => endMutation.mutate()}
              >
                <Feather name="phone-off" size={28} color="#fff" />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {callType === "VIDEO" && isOngoing && !isVideoOff ? (
        <View style={[styles.selfVideoContainer, { top: insets.top + 60 }]}>
          <View style={styles.selfVideo}>
            <Feather name="user" size={24} color="rgba(255,255,255,0.5)" />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#1a1a2e",
  },
  errorText: {
    color: "#fff",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#8B5CF6",
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
  },
  videoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlaceholderText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 16,
    marginTop: 12,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e53935",
    marginRight: 8,
  },
  durationText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centerSection: {
    alignItems: "center",
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  userName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  callStatus: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  controlsSection: {
    paddingHorizontal: 24,
  },
  incomingControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },
  ongoingControls: {
    alignItems: "center",
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 32,
  },
  controlButton: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  controlButtonActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  controlLabel: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
  },
  callButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  answerButton: {
    backgroundColor: "#4caf50",
  },
  declineButton: {
    backgroundColor: "#f44336",
  },
  endCallButton: {
    backgroundColor: "#f44336",
  },
  selfVideoContainer: {
    position: "absolute",
    right: 16,
  },
  selfVideo: {
    width: 100,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
