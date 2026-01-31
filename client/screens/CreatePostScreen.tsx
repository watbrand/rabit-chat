import React, { useState, useLayoutEffect, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { Avatar } from "@/components/Avatar";
import MusicPickerModal, { MusicTrackData } from "@/components/MusicPickerModal";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { pickPostMedia, uploadFileWithDuration, UploadResult } from "@/lib/upload";
import { useAudioManager } from "@/contexts/AudioManagerContext";

type PostType = "TEXT" | "PHOTO" | "VIDEO" | "VOICE";

interface MediaState {
  localUri: string;
  uploadResult: UploadResult | null;
  isUploading: boolean;
  duration?: number;
  uploadProgress?: number;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const audioManager = useAudioManager();

  const [postType, setPostType] = useState<PostType>("TEXT");
  const [textContent, setTextContent] = useState("");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<MediaState | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrackData | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasInitiatedMediaPickerRef = useRef(false);
  const playerId = useMemo(() => `create-post-preview-${Date.now()}`, []);

  const stopPreviewPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlayingPreview(false);
    } catch (err) {
      // Cleanup - ignore errors: sound may already be unloaded
    }
  }, []);

  useEffect(() => {
    audioManager.registerPlayer(playerId, stopPreviewPlayback);
    return () => {
      audioManager.unregisterPlayer(playerId);
    };
  }, [playerId, audioManager, stopPreviewPlayback]);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        // Cleanup - ignore errors: recording may already be stopped
        recordingRef.current.stopAndUnloadAsync().catch((err) => {
          console.warn("Error stopping recording during cleanup:", err);
        });
        recordingRef.current = null;
      }
      
      if (soundRef.current) {
        // Cleanup - ignore errors: sound may already be unloaded
        soundRef.current.unloadAsync().catch((err) => {
          console.warn("Error unloading sound during cleanup:", err);
        });
        soundRef.current = null;
      }
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const autoOpenMedia = async () => {
      if (route.params?.type === "STORY") {
        return;
      }

      if (route.params?.autoMedia !== true) {
        return;
      }

      // Prevent double execution from React StrictMode or navigation re-renders
      if (hasInitiatedMediaPickerRef.current) {
        return;
      }
      hasInitiatedMediaPickerRef.current = true;

      try {
        const asset = await pickPostMedia();
        if (!asset) {
          // User canceled the picker, go back
          navigation.goBack();
          return;
        }
        await uploadSelectedMedia(asset);
      } catch (error: any) {
        // Check if it's a permission error
        const errorMessage = error?.message || "";
        if (errorMessage.includes("Permission") || errorMessage.includes("permission")) {
          // Show alert and let user stay on screen to try again or post text
          Alert.alert(
            "Permission Required",
            "Please grant access to your photo library to add media to your post. You can also post text without media.",
            [
              { text: "Post Text Instead", style: "default" },
              { text: "Go Back", style: "cancel", onPress: () => navigation.goBack() },
            ]
          );
        } else {
          // Other errors - go back
          navigation.goBack();
        }
      }
    };

    autoOpenMedia();
  }, [navigation, route.params?.type, route.params?.autoMedia]);

  const handlePlayPreview = async () => {
    if (!media?.localUri || postType !== "VOICE") return;
    
    try {
      if (isPlayingPreview && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlayingPreview(false);
        return;
      }
      
      audioManager.requestPlayback(playerId);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: media.localUri },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setIsPlayingPreview(true);
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingPreview(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      setIsPlayingPreview(false);
    }
  };

  const canPost = () => {
    if (postType === "TEXT") {
      return textContent.trim().length > 0;
    }
    // For media posts, ensure media exists, upload is complete, and result is available
    return media !== null && media.uploadResult !== null && !media.isUploading;
  };

  const uploadSelectedMedia = async (asset: any) => {
    try {
      const isVideo = asset.type === "video";
      const newType = isVideo ? "VIDEO" : "PHOTO";
      setPostType(newType);

      setMedia({
        localUri: asset.uri,
        uploadResult: null,
        isUploading: true,
        duration: asset.duration,
        uploadProgress: 0,
      });

      const result = await uploadFileWithDuration(
        asset.uri,
        "posts",
        asset.mimeType,
        asset.duration,
        (progress) => {
          setMedia((prev) => prev ? { ...prev, uploadProgress: progress } : null);
        }
      );

      setMedia({
        localUri: asset.uri,
        uploadResult: result,
        isUploading: false,
        duration: result.durationMs || asset.duration,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg = error?.message || "Could not upload media";
      const errorCode = error?.code ? ` (Code: ${error.code})` : "";
      Alert.alert("Upload Failed", `${errorMsg}${errorCode}`);
      setMedia(null);
    }
  };

  const handlePickMedia = async (type: "image" | "video") => {
    const asset = await pickPostMedia();
    if (!asset) return;
    await uploadSelectedMedia(asset);
  };

  const handlePickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setPostType("VOICE");

      setMedia({
        localUri: asset.uri,
        uploadResult: null,
        isUploading: true,
        uploadProgress: 0,
      });

      const uploadResult = await uploadFileWithDuration(
        asset.uri,
        "posts",
        asset.mimeType,
        undefined,
        (progress) => {
          setMedia((prev) => prev ? { ...prev, uploadProgress: progress } : null);
        }
      );

      setMedia({
        localUri: asset.uri,
        uploadResult: uploadResult,
        isUploading: false,
        duration: uploadResult.durationMs,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Upload Failed", error.message || "Could not upload audio");
      setMedia(null);
    }
  };

  const startRecording = async () => {
    // Prevent starting multiple recordings
    if (isRecording || recordingRef.current) {
      return;
    }

    try {
      // Request microphone permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable microphone access to record voice notes."
        );
        return;
      }

      // Stop any currently playing audio and configure audio mode for recording
      // This must be done BEFORE creating the recording to avoid conflicts
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: false,
      });

      // Create recording with HIGH_QUALITY preset
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      if (!recording) {
        throw new Error("Failed to initialize recording");
      }

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      setPostType("VOICE");

      // Start duration timer with 10-minute max limit (600 seconds)
      const MAX_VOICE_DURATION = 600;
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= MAX_VOICE_DURATION - 1) {
            // Auto-stop at 10 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error: any) {
      // Clean up on error
      recordingRef.current = null;
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Provide specific error message based on the error type
      let errorMessage = "Could not start recording";
      
      if (error.message?.includes("Permission denied")) {
        errorMessage = "Microphone permission denied";
      } else if (
        error.message?.includes("already") ||
        error.message?.includes("in use")
      ) {
        errorMessage = "Microphone is currently in use - try closing other apps using the mic";
      } else if (
        error.message?.includes("audio") ||
        error.message?.includes("Audio")
      ) {
        errorMessage = "Audio system error - please try again";
      } else if (error.message?.includes("failed to init")) {
        errorMessage = "Could not initialize recording device";
      }

      Alert.alert("Recording Error", errorMessage);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      // Stop the duration timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsRecording(false);
      
      // Stop and unload the recording
      await recordingRef.current.stopAndUnloadAsync();
      
      const uri = recordingRef.current.getURI();
      if (!uri) {
        recordingRef.current = null;
        Alert.alert("Error", "Recording failed - could not save audio file");
        return;
      }

      const durationMs = recordingDuration * 1000;

      setMedia({
        localUri: uri,
        uploadResult: null,
        isUploading: true,
        duration: durationMs,
        uploadProgress: 0,
      });

      recordingRef.current = null;

      // Upload the recorded audio
      const result = await uploadFileWithDuration(
        uri,
        "posts",
        "audio/m4a",
        durationMs,
        (progress) => {
          setMedia((prev) => prev ? { ...prev, uploadProgress: progress } : null);
        }
      );

      setMedia({
        localUri: uri,
        uploadResult: result,
        isUploading: false,
        duration: result.durationMs || durationMs,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      // Ensure recording ref is cleaned up
      recordingRef.current = null;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = error.message || "Could not upload recording";
      if (error.message?.includes("Network")) {
        errorMessage = "Network error - please check your connection";
      } else if (error.message?.includes("Permission")) {
        errorMessage = "Storage permission denied";
      }
      
      Alert.alert("Upload Failed", errorMessage);
      setMedia(null);
    }
  };

  const handleRemoveMedia = () => {
    if (isRecording && recordingRef.current) {
      // Cleanup - ignore errors: recording may already be stopped
      recordingRef.current.stopAndUnloadAsync().catch((err) => {
        console.warn("Error stopping recording in handleRemoveMedia:", err);
      });
      recordingRef.current = null;
      
      // Clear the duration timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      setIsRecording(false);
      setRecordingDuration(0);
    }
    
    setMedia(null);
    setPostType("TEXT");
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, any> = {
        type: postType,
        visibility: "PUBLIC",
        commentsEnabled: true,
      };

      if (postType === "TEXT") {
        body.content = textContent;
      } else {
        if (!media?.uploadResult) {
          throw new Error("Media not uploaded yet");
        }
        body.mediaUrl = media.uploadResult.url;
        if (caption.trim()) {
          body.caption = caption.trim();
        }
        if (postType === "VIDEO" || postType === "VOICE") {
          body.thumbnailUrl = media.uploadResult.thumbnailUrl;
          body.durationMs = media.duration || media.uploadResult.durationMs;
          if (media.uploadResult.width && media.uploadResult.height) {
            body.aspectRatio = media.uploadResult.width / media.uploadResult.height;
          }
        }
      }

      const res = await apiRequest("POST", "/api/posts", body);
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/posts`] });
      }
      refreshUser();
      navigation.goBack();
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to create post");
    },
  });

  const isPostEnabled = canPost();
  const isPending = createPostMutation.isPending;

  const handlePost = useCallback(() => {
    if (!isPending) {
      createPostMutation.mutate();
    }
  }, [createPostMutation, isPending]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Create Post",
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          style={{ padding: 8 }}
        >
          <Feather name="x" size={24} color={theme.text} />
        </TouchableOpacity>
      ),
      // Only show Share button in header on iOS/Web - Android gets it below the content
      headerRight: Platform.OS === "android" ? undefined : () => (
        <TouchableOpacity
          onPress={isPostEnabled && !isPending ? handlePost : undefined}
          disabled={!isPostEnabled || isPending}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          style={{ marginRight: 8 }}
        >
          <View
            style={[
              styles.shareButton,
              {
                backgroundColor: isPostEnabled ? theme.primary : theme.glassBackground,
                opacity: !isPostEnabled || isPending ? 0.6 : 1,
              },
            ]}
          >
            {isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="send" size={14} color={isPostEnabled ? "#FFF" : theme.textSecondary} />
                <ThemedText
                  style={[
                    styles.shareButtonText,
                    { color: isPostEnabled ? "#FFF" : theme.textSecondary },
                  ]}
                >
                  Share
                </ThemedText>
              </>
            )}
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isPending, isPostEnabled, theme, handlePost]);

  const MediaTypeButton = ({ type, icon, label, onPress }: { type: PostType; icon: string; label: string; onPress: () => void }) => (
    <Pressable
      style={[
        styles.mediaTypeButton,
        {
          backgroundColor: postType === type ? theme.primary + "20" : theme.glassBackground,
          borderColor: postType === type ? theme.primary : theme.glassBorder,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.mediaTypeIcon, { backgroundColor: postType === type ? theme.primary : theme.backgroundSecondary }]}>
        <Feather name={icon as any} size={20} color={postType === type ? "#FFF" : theme.textSecondary} />
      </View>
      <ThemedText
        style={[
          styles.mediaTypeLabel,
          { color: postType === type ? theme.primary : theme.text },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.md,
        paddingBottom: insets.bottom + Spacing.lg,
        paddingHorizontal: Spacing.lg,
        flexGrow: 1,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      extraKeyboardSpace={100}
    >
      <View style={[styles.composerCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.userRow}>
          <Avatar uri={user?.avatarUrl} size={48} />
          <View style={styles.userInfo}>
            <ThemedText style={[styles.userName, { color: theme.text }]}>
              {user?.displayName}
            </ThemedText>
            <View style={[styles.visibilityBadge, { backgroundColor: theme.glassBackground }]}>
              <Feather name="globe" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.visibilityText, { color: theme.textSecondary }]}>
                Public
              </ThemedText>
            </View>
          </View>
        </View>

        {postType === "TEXT" ? (
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.contentInput,
                { color: theme.text },
              ]}
              placeholder="What's happening?"
              placeholderTextColor={theme.textSecondary}
              value={textContent}
              onChangeText={setTextContent}
              multiline
              maxLength={500}
              autoFocus
              testID="input-post-content"
            />
            <View style={[styles.charCountContainer, { backgroundColor: theme.glassBackground }]}>
              <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
                {textContent.length}/500
              </ThemedText>
            </View>
          </View>
        ) : media?.localUri ? (
          <View style={styles.mediaSection}>
            {postType === "VOICE" ? (
              <View style={[styles.voicePreviewCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  style={styles.voicePreviewIcon}
                >
                  <Feather name="mic" size={28} color="#FFF" />
                </LinearGradient>
                <View style={styles.voicePreviewInfo}>
                  <ThemedText style={[styles.voicePreviewTitle, { color: theme.text }]}>
                    Voice Recording
                  </ThemedText>
                  {media.duration ? (
                    <View style={styles.voiceDurationRow}>
                      <Feather name="clock" size={12} color={theme.textSecondary} />
                      <ThemedText style={[styles.voiceDurationText, { color: theme.textSecondary }]}>
                        {formatDuration(Math.round(media.duration / 1000))}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
                {media.isUploading ? (
                  <View style={styles.uploadProgressContainer}>
                    <View style={[styles.uploadStatusBadge, { backgroundColor: theme.primary + "20" }]}>
                      <LoadingIndicator size="small" />
                      <ThemedText style={[styles.uploadStatusText, { color: theme.primary }]}>
                        Uploading... {media.uploadProgress ?? 0}%
                      </ThemedText>
                    </View>
                    <View style={[styles.progressBarBackground, { backgroundColor: theme.glassBackground }]}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { backgroundColor: theme.primary, width: `${media.uploadProgress ?? 0}%` },
                        ]}
                      />
                    </View>
                  </View>
                ) : media.uploadResult ? (
                  <View style={styles.voiceReadyRow}>
                    <View style={[styles.uploadStatusBadge, { backgroundColor: theme.success + "20" }]}>
                      <Feather name="check-circle" size={14} color={theme.success} />
                      <ThemedText style={[styles.uploadStatusText, { color: theme.success }]}>
                        Ready
                      </ThemedText>
                    </View>
                    <Pressable
                      style={[styles.playPreviewButton, { backgroundColor: theme.primary }]}
                      onPress={handlePlayPreview}
                      testID="button-play-preview"
                    >
                      <Feather name={isPlayingPreview ? "pause" : "play"} size={16} color="#FFF" />
                      <ThemedText style={styles.playPreviewText}>
                        {isPlayingPreview ? "Stop" : "Preview"}
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: media.localUri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
                {postType === "VIDEO" && media.duration ? (
                  <View style={styles.videoDurationBadge}>
                    <Feather name="play" size={10} color="#FFF" />
                    <ThemedText style={styles.videoDurationText}>
                      {formatDuration(Math.round(media.duration / 1000))}
                    </ThemedText>
                  </View>
                ) : null}
                {media.isUploading ? (
                  <View style={styles.uploadOverlay}>
                    <View style={styles.uploadProgressContent}>
                      <LoadingIndicator size="large" />
                      <ThemedText style={styles.uploadProgressText}>
                        Uploading... {media.uploadProgress ?? 0}%
                      </ThemedText>
                      <View style={styles.uploadProgressBarContainer}>
                        <View style={styles.uploadProgressBarBackground}>
                          <View
                            style={[
                              styles.uploadProgressBarFill,
                              { width: `${media.uploadProgress ?? 0}%` },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
            <Pressable
              style={[styles.removeButton, { backgroundColor: theme.error }]}
              onPress={handleRemoveMedia}
              testID="button-remove-media"
            >
              <Feather name="trash-2" size={16} color="#fff" />
            </Pressable>

            <View style={styles.captionContainer}>
              <TextInput
                style={[
                  styles.captionInput,
                  {
                    backgroundColor: theme.glassBackground,
                    borderColor: theme.glassBorder,
                    color: theme.text,
                  },
                ]}
                placeholder="Write a caption..."
                placeholderTextColor={theme.textSecondary}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
                testID="input-caption"
              />
              <ThemedText style={[styles.captionCharCount, { color: theme.textSecondary }]}>
                {caption.length}/500
              </ThemedText>
            </View>
          </View>
        ) : postType === "VOICE" && isRecording ? (
          <View style={styles.recordingSection}>
            <View style={[styles.recordingCard, { backgroundColor: theme.error + "15" }]}>
              <View style={styles.recordingIndicator}>
                <View style={[styles.recordingDot, { backgroundColor: theme.error }]} />
                <ThemedText style={[styles.recordingTime, { color: theme.error }]}>
                  {formatDuration(recordingDuration)}
                </ThemedText>
              </View>
              <ThemedText style={[styles.recordingLabel, { color: theme.textSecondary }]}>
                Recording in progress...
              </ThemedText>
              <Pressable
                style={[styles.stopRecordButton, { backgroundColor: theme.error }]}
                onPress={stopRecording}
              >
                <Feather name="square" size={20} color="#FFF" />
                <ThemedText style={styles.stopRecordText}>Stop Recording</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {!media?.localUri && !isRecording && (
        <View style={[styles.mediaOptionsCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText style={[styles.mediaOptionsTitle, { color: theme.text }]}>
            Add to your post
          </ThemedText>
          <View style={styles.mediaOptionsGrid}>
            <MediaTypeButton
              type="TEXT"
              icon="type"
              label="Text"
              onPress={() => setPostType("TEXT")}
            />
            <MediaTypeButton
              type="PHOTO"
              icon="image"
              label="Photo"
              onPress={() => handlePickMedia("image")}
            />
            <MediaTypeButton
              type="VIDEO"
              icon="video"
              label="Video"
              onPress={() => handlePickMedia("video")}
            />
          </View>
          
          <Pressable
            style={[styles.goLiveButton, { backgroundColor: theme.error }]}
            onPress={() => navigation.navigate("GoLive")}
            testID="button-go-live"
          >
            <View style={styles.goLiveIcon}>
              <Feather name="radio" size={22} color="#FFF" />
            </View>
            <View style={styles.goLiveContent}>
              <ThemedText style={styles.goLiveTitle}>Go Live</ThemedText>
              <ThemedText style={styles.goLiveSubtitle}>Start a live broadcast</ThemedText>
            </View>
            <View style={[styles.liveBadge, { backgroundColor: "#FFF" }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.error }]} />
              <ThemedText style={[styles.liveText, { color: theme.error }]}>LIVE</ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.addMusicButton, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
            onPress={() => setShowMusicPicker(true)}
            testID="button-add-music"
          >
            <View style={[styles.musicIcon, { backgroundColor: theme.ambientPurple }]}>
              <Feather name="music" size={20} color={theme.primary} />
            </View>
            <View style={styles.musicContent}>
              <ThemedText style={[styles.musicTitle, { color: theme.text }]}>
                {selectedMusic ? selectedMusic.title : "Add Music"}
              </ThemedText>
              <ThemedText style={[styles.musicSubtitle, { color: theme.textSecondary }]}>
                {selectedMusic ? selectedMusic.artist : "Add background music to your post"}
              </ThemedText>
            </View>
            {selectedMusic ? (
              <Pressable
                style={[styles.removeMusicButton, { backgroundColor: theme.error + "20" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedMusic(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={16} color={theme.error} />
              </Pressable>
            ) : (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
          
          <View style={styles.voiceOptionsSection}>
            <ThemedText style={[styles.voiceOptionsTitle, { color: theme.textSecondary }]}>
              Voice Options
            </ThemedText>
            <View style={styles.voiceOptionsRow}>
              <Pressable
                style={[styles.voiceOptionButton, { backgroundColor: theme.primary }]}
                onPress={startRecording}
                testID="button-record-voice"
              >
                <Feather name="mic" size={20} color="#FFF" />
                <ThemedText style={styles.voiceOptionText}>Record</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.voiceOptionButton, { backgroundColor: theme.glassBackground, borderWidth: 1, borderColor: theme.glassBorder }]}
                onPress={handlePickAudioFile}
                testID="button-pick-audio"
              >
                <Feather name="upload" size={20} color={theme.text} />
                <ThemedText style={[styles.voiceOptionText, { color: theme.text }]}>Upload</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Android-only Share button below content */}
      {Platform.OS === "android" ? (
        <View style={styles.androidShareContainer}>
          <TouchableOpacity
            onPress={isPostEnabled && !isPending ? handlePost : undefined}
            disabled={!isPostEnabled || isPending}
            activeOpacity={0.7}
            style={[
              styles.androidShareButton,
              {
                backgroundColor: isPostEnabled ? theme.primary : theme.glassBackground,
                opacity: !isPostEnabled || isPending ? 0.6 : 1,
              },
            ]}
            testID="button-share-post"
          >
            {isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="send" size={18} color={isPostEnabled ? "#FFF" : theme.textSecondary} />
                <ThemedText
                  style={[
                    styles.androidShareButtonText,
                    { color: isPostEnabled ? "#FFF" : theme.textSecondary },
                  ]}
                >
                  Share Post
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <MusicPickerModal
        visible={showMusicPicker}
        onClose={() => setShowMusicPicker(false)}
        onSelect={(music: MusicTrackData) => {
          setSelectedMusic(music);
          setShowMusicPicker(false);
        }}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    padding: Spacing.sm,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    minWidth: 80,
    minHeight: 40,
    justifyContent: "center",
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  composerCard: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  userInfo: {
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
    gap: 4,
  },
  visibilityText: {
    fontSize: 11,
  },
  textInputContainer: {
    position: "relative",
  },
  contentInput: {
    minHeight: 120,
    fontSize: 18,
    lineHeight: 26,
    textAlignVertical: "top",
    padding: 0,
  },
  charCountContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  charCount: {
    fontSize: 12,
  },
  mediaSection: {
    position: "relative",
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 280,
  },
  videoDurationBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  videoDurationText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadProgressContent: {
    alignItems: "center",
    width: "80%",
  },
  uploadProgressText: {
    color: "#FFF",
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: "500",
  },
  uploadProgressBarContainer: {
    width: "100%",
    marginTop: Spacing.md,
  },
  uploadProgressBarBackground: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
    overflow: "hidden",
  },
  uploadProgressBarFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 3,
  },
  uploadProgressContainer: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  progressBarBackground: {
    width: 100,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  voicePreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  voicePreviewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  voicePreviewInfo: {
    flex: 1,
  },
  voicePreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  voiceDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  voiceDurationText: {
    fontSize: 13,
  },
  uploadStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  uploadStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  voiceReadyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  playPreviewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  playPreviewText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  removeButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  captionContainer: {
    marginTop: Spacing.lg,
  },
  captionInput: {
    minHeight: 80,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    borderWidth: 1,
    textAlignVertical: "top",
  },
  captionCharCount: {
    textAlign: "right",
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  recordingSection: {
    marginVertical: Spacing.md,
  },
  recordingCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: "center",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: "700",
  },
  recordingLabel: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  stopRecordButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  stopRecordText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  mediaOptionsCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  mediaOptionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  mediaOptionsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  mediaTypeButton: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  mediaTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaTypeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  goLiveButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  goLiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  goLiveContent: {
    flex: 1,
  },
  goLiveTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  goLiveSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
  },
  voiceOptionsSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  voiceOptionsTitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.md,
  },
  voiceOptionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  voiceOptionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  voiceOptionText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  androidShareContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  androidShareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    minHeight: 56,
  },
  androidShareButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  addMusicButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  musicIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  musicContent: {
    flex: 1,
  },
  musicTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  musicSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  removeMusicButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
