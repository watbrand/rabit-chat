import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions, FlashMode } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { ThemedText } from "@/components/ThemedText";
import { GlassButton } from "@/components/GlassButton";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Gradients } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CAPTURE_BUTTON_SIZE = 80;
const CAPTURE_BUTTON_INNER_SIZE = 64;

type CameraMode = "photo" | "video";
type FlashState = "off" | "on" | "auto";

interface CameraScreenParams {
  mode: "post" | "story" | "message";
  onCapture?: (uri: string, type: "photo" | "video") => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const params = route.params as CameraScreenParams | undefined;
  const captureMode = params?.mode || "post";
  const onCaptureCallback = params?.onCapture;

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraMode, setCameraMode] = useState<CameraMode>("photo");
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [flash, setFlash] = useState<FlashState>("off");
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{
    uri: string;
    type: "photo" | "video";
  } | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const captureButtonScale = useSharedValue(1);
  const recordingProgress = useSharedValue(0);
  const zoomValue = useSharedValue(0);

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => {
      StatusBar.setHidden(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFlashToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFlash((prev) => {
      if (prev === "off") return "on";
      if (prev === "on") return "auto";
      return "off";
    });
  };

  const getFlashIcon = (): "zap" | "zap-off" => {
    switch (flash) {
      case "on":
      case "auto":
        return "zap";
      case "off":
      default:
        return "zap-off";
    }
  };

  const handleFlipCamera = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setFacing((prev) => (prev === "front" ? "back" : "front"));
  };

  const handleModeToggle = (mode: CameraMode) => {
    if (mode === cameraMode) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCameraMode(mode);
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      recordingProgress.value = withTiming(1, { duration: 60000 });

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      const video = await cameraRef.current.recordAsync();
      if (video?.uri) {
        setCapturedMedia({ uri: video.uri, type: "video" });
      }
    } catch (error) {
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
    } finally {
      setIsRecording(false);
      recordingProgress.value = 0;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedMedia({ uri: photo.uri, type: "photo" });
      }
    } catch (error) {
    }
  };

  const handleCapturePress = () => {
    if (cameraMode === "photo") {
      takePicture();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const handleCapturePressIn = () => {
    captureButtonScale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
    
    if (cameraMode === "photo") {
      isLongPressRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        setCameraMode("video");
        startRecording();
      }, 500);
    }
  };

  const handleCapturePressOut = () => {
    captureButtonScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isLongPressRef.current && isRecording) {
      stopRecording();
      isLongPressRef.current = false;
    }
  };

  const handleGalleryPick = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setCapturedMedia({
          uri: asset.uri,
          type: asset.type === "video" ? "video" : "photo",
        });
      }
    } catch (error) {
    }
  };

  const handleRetake = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCapturedMedia(null);
  };

  const handleUseMedia = () => {
    if (!capturedMedia) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (onCaptureCallback) {
      onCaptureCallback(capturedMedia.uri, capturedMedia.type);
    }

    navigation.goBack();
  };

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const getUseButtonText = () => {
    switch (captureMode) {
      case "story":
        return "Add to Story";
      case "message":
        return "Send";
      case "post":
      default:
        return "Use Photo";
    }
  };

  const handleZoomChange = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    setZoom(clampedValue);
    zoomValue.value = clampedValue;
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newZoom = Math.max(0, Math.min(1, zoom + (event.scale - 1) * 0.5));
      runOnJS(handleZoomChange)(newZoom);
    });

  const captureButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureButtonScale.value }],
  }));

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          styles.permissionContainer,
          { backgroundColor: "#000", paddingTop: insets.top },
        ]}
      >
        <View style={styles.permissionContent}>
          <View style={styles.permissionIconContainer}>
            <Feather name="camera-off" size={64} color={theme.textSecondary} />
          </View>
          <ThemedText style={styles.permissionTitle}>
            Camera Access Required
          </ThemedText>
          <ThemedText style={styles.permissionText}>
            To take photos and videos, please allow camera access.
          </ThemedText>

          {permission.status === "denied" && !permission.canAskAgain ? (
            <>
              <ThemedText style={styles.permissionSubtext}>
                Camera access was denied. Please enable it in your device settings.
              </ThemedText>
              {Platform.OS !== "web" && (
                <GlassButton
                  title="Open Settings"
                  icon="settings"
                  variant="primary"
                  onPress={async () => {
                    try {
                      await Linking.openSettings();
                    } catch (error) {
                    }
                  }}
                  style={styles.permissionButton}
                />
              )}
            </>
          ) : (
            <GlassButton
              title="Enable Camera"
              icon="camera"
              variant="gradient"
              onPress={requestPermission}
              style={styles.permissionButton}
            />
          )}

          <Pressable onPress={handleClose} style={styles.goBackButton}>
            <ThemedText style={styles.goBackText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (capturedMedia) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <StatusBar hidden />

        {capturedMedia.type === "photo" ? (
          <Image
            source={{ uri: capturedMedia.uri }}
            style={styles.previewMedia}
            contentFit="contain"
          />
        ) : (
          <Video
            source={{ uri: capturedMedia.uri }}
            style={styles.previewMedia}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            useNativeControls={false}
          />
        )}

        <View style={[styles.previewTopBar, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable onPress={handleClose} style={styles.glassButton}>
            <Feather name="x" size={24} color="#FFF" />
          </Pressable>
        </View>

        <View style={[styles.previewBottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <GlassButton
            title="Retake"
            icon="refresh-cw"
            variant="secondary"
            onPress={handleRetake}
            style={styles.previewActionButton}
          />
          <GlassButton
            title={getUseButtonText()}
            icon="check"
            variant="gradient"
            onPress={handleUseMedia}
            style={styles.previewActionButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <StatusBar hidden />

      <GestureDetector gesture={pinchGesture}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash as FlashMode}
          zoom={zoom}
          mode={cameraMode === "photo" ? "picture" : "video"}
        />
      </GestureDetector>

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleClose} style={styles.glassButton}>
          <Feather name="x" size={24} color="#FFF" />
        </Pressable>

        <View style={styles.topBarRight}>
          <Pressable onPress={handleFlashToggle} style={styles.glassButton}>
            <Feather name={getFlashIcon()} size={22} color="#FFF" />
            {flash === "auto" && (
              <ThemedText style={styles.flashAutoText}>A</ThemedText>
            )}
          </Pressable>
        </View>
      </View>

      {isRecording ? (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <ThemedText style={styles.recordingText}>
            {formatDuration(recordingDuration)}
          </ThemedText>
        </View>
      ) : null}

      {zoom > 0 && (
        <View style={styles.zoomIndicator}>
          <ThemedText style={styles.zoomText}>
            {(1 + zoom * 7).toFixed(1)}x
          </ThemedText>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => handleModeToggle("photo")}
            style={[
              styles.modeButton,
              cameraMode === "photo" && styles.modeButtonActive,
            ]}
          >
            <ThemedText
              style={[
                styles.modeText,
                cameraMode === "photo" && styles.modeTextActive,
              ]}
            >
              Photo
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleModeToggle("video")}
            style={[
              styles.modeButton,
              cameraMode === "video" && styles.modeButtonActive,
            ]}
          >
            <ThemedText
              style={[
                styles.modeText,
                cameraMode === "video" && styles.modeTextActive,
              ]}
            >
              Video
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.captureRow}>
          <Pressable onPress={handleGalleryPick} style={styles.glassButton}>
            <Feather name="image" size={24} color="#FFF" />
          </Pressable>

          <AnimatedPressable
            onPress={handleCapturePress}
            onPressIn={handleCapturePressIn}
            onPressOut={handleCapturePressOut}
            style={[styles.captureButton, captureButtonAnimatedStyle]}
          >
            {cameraMode === "video" ? (
              <View style={styles.captureButtonOuter}>
                {isRecording ? (
                  <View style={styles.stopButton} />
                ) : (
                  <LinearGradient
                    colors={["#EF4444", "#DC2626"]}
                    style={styles.captureButtonInnerVideo}
                  />
                )}
              </View>
            ) : (
              <View style={styles.captureButtonOuter}>
                <View style={styles.captureButtonInner} />
              </View>
            )}
          </AnimatedPressable>

          <Pressable onPress={handleFlipCamera} style={styles.glassButton}>
            <Feather name="refresh-cw" size={24} color="#FFF" />
          </Pressable>
        </View>
      </View>
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
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  permissionContent: {
    alignItems: "center",
    maxWidth: 320,
  },
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  permissionText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  permissionSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: Spacing.md,
    minWidth: 200,
  },
  goBackButton: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
  },
  goBackText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  glassButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  flashAutoText: {
    position: "absolute",
    bottom: 4,
    right: 8,
    fontSize: 10,
    fontWeight: "700",
    color: Colors.dark.warning,
  },
  recordingIndicator: {
    position: "absolute",
    top: 100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  recordingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  zoomIndicator: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  modeToggle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  modeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  modeButtonActive: {
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
  modeText: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
  },
  modeTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  captureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  captureButton: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonOuter: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  captureButtonInner: {
    width: CAPTURE_BUTTON_INNER_SIZE,
    height: CAPTURE_BUTTON_INNER_SIZE,
    borderRadius: CAPTURE_BUTTON_INNER_SIZE / 2,
    backgroundColor: "#FFF",
  },
  captureButtonInnerVideo: {
    width: CAPTURE_BUTTON_INNER_SIZE - 4,
    height: CAPTURE_BUTTON_INNER_SIZE - 4,
    borderRadius: (CAPTURE_BUTTON_INNER_SIZE - 4) / 2,
  },
  stopButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  previewMedia: {
    flex: 1,
    width: "100%",
  },
  previewTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  previewBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    zIndex: 10,
  },
  previewActionButton: {
    flex: 1,
    maxWidth: 160,
  },
});
