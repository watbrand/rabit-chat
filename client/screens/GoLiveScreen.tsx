import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { Avatar } from "@/components/Avatar";

export default function GoLiveScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const cameraRef = useRef<any>(null);
  
  const [permission, requestPermission] = useCameraPermissions();

  const createStreamMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/live-streams", {
        title: title.trim() || `${user?.displayName}'s Live`,
        description: description.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: async (data) => {
      setStreamId(data.id);
      await startStreamMutation.mutateAsync(data.id);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Could not start live stream");
    },
  });

  const startStreamMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/live-streams/${id}/start`);
      return res.json();
    },
    onSuccess: () => {
      setIsStreaming(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Could not start streaming");
    },
  });

  const endStreamMutation = useMutation({
    mutationFn: async () => {
      if (!streamId) return;
      const res = await apiRequest("POST", `/api/live-streams/${streamId}/end`);
      return res.json();
    },
    onSuccess: () => {
      setIsStreaming(false);
      setStreamId(null);
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Could not end stream");
      navigation.goBack();
    },
  });

  useEffect(() => {
    if (!isStreaming || !streamId) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest("GET", `/api/live-streams/${streamId}`);
        if (res.ok) {
          const data = await res.json();
          setViewerCount(data.viewerCount || 0);
        }
      } catch (error) {
        // Silent fail for polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isStreaming, streamId]);

  const handleGoLive = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    createStreamMutation.mutate();
  };

  const handleEndStream = () => {
    Alert.alert(
      "End Live Stream",
      "Are you sure you want to end your live stream?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Stream", 
          style: "destructive",
          onPress: () => endStreamMutation.mutate(),
        },
      ]
    );
  };

  const toggleCameraFacing = () => {
    setFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: "#000", paddingTop: insets.top }]}>
        <View style={styles.permissionContainer}>
          <Feather name="video-off" size={64} color={theme.textSecondary} />
          <ThemedText style={[styles.permissionTitle, { color: "#FFF" }]}>
            Camera Access Required
          </ThemedText>
          <ThemedText style={[styles.permissionText, { color: "rgba(255,255,255,0.7)" }]}>
            To go live, we need access to your camera
          </ThemedText>
          <Pressable
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={requestPermission}
          >
            <ThemedText style={styles.permissionButtonText}>Enable Camera</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.backButton, { marginTop: Spacing.md }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={{ color: "rgba(255,255,255,0.7)" }}>Go Back</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
      />
      
      <KeyboardAvoidingView 
        style={[styles.overlay, { paddingTop: insets.top }]}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable 
            onPress={isStreaming ? handleEndStream : () => navigation.goBack()} 
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color="#FFF" />
          </Pressable>
          
          {isStreaming ? (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <ThemedText style={styles.liveText}>LIVE</ThemedText>
            </View>
          ) : null}
          
          <Pressable onPress={toggleCameraFacing} style={styles.flipButton}>
            <Feather name="refresh-cw" size={20} color="#FFF" />
          </Pressable>
        </View>

        {isStreaming ? (
          <View style={styles.streamingInfo}>
            <View style={styles.viewerBadge}>
              <Feather name="eye" size={16} color="#FFF" />
              <ThemedText style={styles.viewerCount}>{viewerCount}</ThemedText>
            </View>
            
            <View style={styles.hostInfo}>
              <Avatar uri={user?.avatarUrl} size={40} />
              <View style={styles.hostDetails}>
                <ThemedText style={styles.hostName}>{user?.displayName}</ThemedText>
                <ThemedText style={styles.streamTitle}>{title || "Live Stream"}</ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {!isStreaming ? (
            <View style={styles.setupSection}>
              <View style={[styles.inputCard, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                <TextInput
                  style={[styles.titleInput, { color: "#FFF" }]}
                  placeholder="Add a title for your stream..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  testID="input-stream-title"
                />
                <TextInput
                  style={[styles.descriptionInput, { color: "#FFF" }]}
                  placeholder="Add a description (optional)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  multiline
                  testID="input-stream-description"
                />
              </View>
              
              <Pressable
                style={[
                  styles.goLiveButton,
                  { backgroundColor: theme.error },
                  (createStreamMutation.isPending || startStreamMutation.isPending) && styles.disabledButton,
                ]}
                onPress={handleGoLive}
                disabled={createStreamMutation.isPending || startStreamMutation.isPending}
                testID="button-start-live"
              >
                {createStreamMutation.isPending || startStreamMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Feather name="radio" size={24} color="#FFF" />
                    <ThemedText style={styles.goLiveButtonText}>Go Live</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.streamingControls}>
              <Pressable
                style={[styles.endStreamButton, { backgroundColor: theme.error }]}
                onPress={handleEndStream}
                disabled={endStreamMutation.isPending}
                testID="button-end-stream"
              >
                {endStreamMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Feather name="square" size={20} color="#FFF" />
                    <ThemedText style={styles.endStreamText}>End Stream</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e53935",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  liveText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  streamingInfo: {
    paddingHorizontal: Spacing.md,
  },
  viewerBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  viewerCount: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  hostInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  streamTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  bottomSection: {
    paddingHorizontal: Spacing.md,
  },
  setupSection: {
    gap: Spacing.md,
  },
  inputCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  descriptionInput: {
    fontSize: 14,
    paddingVertical: Spacing.sm,
    minHeight: 60,
  },
  goLiveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  goLiveButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  streamingControls: {
    alignItems: "center",
  },
  endStreamButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  endStreamText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  permissionButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  permissionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    padding: Spacing.md,
  },
});
