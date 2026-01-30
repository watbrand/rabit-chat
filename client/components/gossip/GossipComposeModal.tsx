import React, { useState, useRef, useEffect } from "react";
import { View, Pressable, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { uploadFileWithDuration } from "@/lib/upload";
import { LoadingIndicator } from "@/components/animations";

interface PresetLocation {
  countryCode: string;
  zaLocationId?: string;
  locationDisplay: string;
}

interface GossipComposeModalProps {
  visible: boolean;
  onClose: () => void;
  presetLocation?: PresetLocation | null;
}

export function GossipComposeModal({ visible, onClose, presetLocation }: GossipComposeModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const [isWhisper, setIsWhisper] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadOrCreateDeviceId = async () => {
      let id = await AsyncStorage.getItem("@gossip_device_id");
      if (!id) {
        // Create device ID if not exists (fallback for edge cases)
        id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        await AsyncStorage.setItem("@gossip_device_id", id);
      }
      setDeviceId(id);
    };
    loadOrCreateDeviceId();
  }, [visible]);
  
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!deviceId) throw new Error("Device ID not found");
      const apiUrl = getApiUrl();
      const fullUrl = `${apiUrl}/api/gossip/v2/posts`;
      
      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Failed to post");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("[GossipCompose] POST SUCCESS:", JSON.stringify(data));
      Alert.alert("Posted!", "Your gossip has been posted successfully.");
      queryClient.invalidateQueries({ queryKey: ["/api/gossip/v2/posts"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/gossip/v2/trending"], exact: false });
      resetForm();
      onClose();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error: any) => {
      console.log("[GossipCompose] POST ERROR:", error.message, error);
      const msg = error.message || "Failed to post gossip";
      if (msg.includes("Rate limited") || msg.includes("429")) {
        Alert.alert("Slow Down!", "You can only post 5 times per hour. Take a break and try again later.");
      } else if (msg.includes("min 10") || msg.includes("content")) {
        Alert.alert("Too Short", "Your gossip needs at least 10 characters. Add more details!");
      } else {
        Alert.alert("Error", msg);
      }
    },
  });
  
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Required", "Please enable microphone access.");
        return;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      
      const MAX_DURATION = 300; // 5 minutes max
      intervalRef.current = setInterval(() => {
        setRecordingDuration(d => {
          if (d >= MAX_DURATION - 1) {
            // Auto-stop at max duration
            stopRecording();
            return MAX_DURATION;
          }
          return d + 1;
        });
      }, 1000);
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Could not start recording");
    }
  };
  
  const stopRecording = async () => {
    if (!recordingRef.current) return;
    
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      if (!uri) {
        Alert.alert("Error", "Recording failed");
        return;
      }
      
      setRecordedAudioUri(uri);
      setIsUploading(true);
      
      const result = await uploadFileWithDuration(uri, "posts", "audio/m4a", recordingDuration * 1000);
      setUploadedAudioUrl(result.url);
      setIsUploading(false);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setIsUploading(false);
      Alert.alert("Error", "Could not save recording");
    }
  };
  
  const cancelRecording = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(console.error);
      recordingRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    setRecordedAudioUri(null);
    setUploadedAudioUrl(null);
    setIsUploading(false);
  };
  
  const resetForm = () => {
    setContent("");
    setIsWhisper(false);
    setIsVoiceMode(false);
    cancelRecording();
  };
  
  const canSubmit = () => {
    if (!presetLocation) return false;
    if (isVoiceMode) return !!uploadedAudioUrl && !isUploading;
    return content.trim().length >= 10;
  };
  
  const handleSubmit = () => {
    if (!canSubmit() || !presetLocation || !deviceId) return;
    
    const data: any = {
      deviceHash: deviceId,
      locationId: presetLocation.zaLocationId,
      postType: "REGULAR",
      isWhisperMode: isWhisper,
    };
    
    if (isVoiceMode) {
      data.mediaUrl = uploadedAudioUrl;
      data.mediaType = "AUDIO";
    } else {
      data.content = content.trim();
    }
    
    createMutation.mutate(data);
  };
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);
  
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { resetForm(); onClose(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.dismiss} onPress={() => { resetForm(); onClose(); }} />
        <View style={[styles.content, { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <Pressable onPress={() => { resetForm(); onClose(); }}>
              <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
            </Pressable>
            <ThemedText type="headline">
              {isWhisper ? "Whisper" : "New Gossip"}
            </ThemedText>
            <Pressable onPress={handleSubmit} disabled={!canSubmit() || createMutation.isPending}>
              <ThemedText style={{ color: canSubmit() ? theme.primary : theme.textTertiary, fontWeight: "600" }}>
                {createMutation.isPending ? "..." : "Post"}
              </ThemedText>
            </Pressable>
          </View>
          
          {presetLocation ? (
            <View style={[styles.locationDisplay, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
              <Feather name="map-pin" size={16} color={theme.primary} />
              <ThemedText style={styles.locationText}>{presetLocation.locationDisplay}</ThemedText>
            </View>
          ) : null}
          
          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeButton, !isVoiceMode ? styles.modeButtonActive : null, { borderColor: theme.glassBorder }]}
              onPress={() => { setIsVoiceMode(false); cancelRecording(); }}
            >
              <Feather name="type" size={16} color={!isVoiceMode ? theme.primary : theme.textSecondary} />
              <ThemedText style={{ color: !isVoiceMode ? theme.primary : theme.textSecondary, fontSize: 13 }}>Text</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.modeButton, isVoiceMode ? styles.modeButtonActive : null, { borderColor: theme.glassBorder }]}
              onPress={() => setIsVoiceMode(true)}
            >
              <Feather name="mic" size={16} color={isVoiceMode ? theme.primary : theme.textSecondary} />
              <ThemedText style={{ color: isVoiceMode ? theme.primary : theme.textSecondary, fontSize: 13 }}>Voice</ThemedText>
            </Pressable>
          </View>
          
          {!isVoiceMode ? (
            <View>
              <TextInput
                style={[styles.textInput, { color: theme.text, borderColor: theme.glassBorder }]}
                placeholder="Spill the tea... (min 10 chars)"
                placeholderTextColor={theme.textTertiary}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={1000}
              />
              <View style={styles.charCountContainer}>
                <ThemedText style={[
                  styles.charCount,
                  { color: content.trim().length < 10 ? theme.error : theme.textTertiary }
                ]}>
                  {content.trim().length}/1000 {content.trim().length < 10 ? `(${10 - content.trim().length} more needed)` : ''}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={[styles.voiceContainer, { borderColor: theme.glassBorder }]}>
              {isRecording ? (
                <View style={styles.recordingState}>
                  <View style={[styles.recordingDot, { backgroundColor: theme.error }]} />
                  <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>{formatDuration(recordingDuration)}</ThemedText>
                  <ThemedText style={{ color: theme.textTertiary, fontSize: 12 }}>
                    Max {formatDuration(300 - recordingDuration)} remaining
                  </ThemedText>
                  <Pressable style={[styles.stopButton, { backgroundColor: theme.error }]} onPress={stopRecording}>
                    <Feather name="square" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : uploadedAudioUrl ? (
                <View style={styles.recordedState}>
                  <Feather name="check-circle" size={32} color={theme.success} />
                  <ThemedText style={{ marginTop: Spacing.sm }}>Voice note ready ({formatDuration(recordingDuration)})</ThemedText>
                  <Pressable onPress={cancelRecording}>
                    <ThemedText style={{ color: theme.error, marginTop: Spacing.sm }}>Re-record</ThemedText>
                  </Pressable>
                </View>
              ) : isUploading ? (
                <View style={styles.uploadingState}>
                  <LoadingIndicator size="large" />
                  <ThemedText style={{ marginTop: Spacing.sm }}>Uploading...</ThemedText>
                </View>
              ) : (
                <Pressable style={[styles.recordButton, { backgroundColor: theme.primary }]} onPress={startRecording}>
                  <Feather name="mic" size={32} color="#FFFFFF" />
                  <ThemedText style={{ color: "#FFFFFF", marginTop: Spacing.sm }}>Tap to Record</ThemedText>
                </Pressable>
              )}
            </View>
          )}
          
          <View style={styles.options}>
            <Pressable
              style={[styles.whisperToggle, isWhisper ? { backgroundColor: "#6366F120", borderColor: "#6366F1" } : { borderColor: theme.glassBorder }]}
              onPress={() => setIsWhisper(!isWhisper)}
            >
              <Feather name="eye-off" size={16} color={isWhisper ? "#6366F1" : theme.textSecondary} />
              <ThemedText style={{ color: isWhisper ? "#6366F1" : theme.textSecondary, fontSize: 13, flex: 1 }}>
                Whisper Mode
              </ThemedText>
              <ThemedText style={{ color: theme.textTertiary, fontSize: 11 }}>Auto-deletes in 24h</ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  dismiss: {
    flex: 1,
  },
  content: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modeToggle: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modeButtonActive: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "#8B5CF6",
  },
  textInput: {
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    textAlignVertical: "top",
  },
  charCountContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: Spacing.xs,
  },
  charCount: {
    fontSize: 12,
  },
  voiceContainer: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  recordingState: {
    alignItems: "center",
    gap: Spacing.md,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  recordedState: {
    alignItems: "center",
  },
  uploadingState: {
    alignItems: "center",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  options: {
    gap: Spacing.sm,
  },
  whisperToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  locationDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
});
