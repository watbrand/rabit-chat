import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { InlineLoader } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ImageViewerModalProps {
  isVisible: boolean;
  imageUrl: string;
  onClose: () => void;
  title?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ImageViewerModal({
  isVisible,
  imageUrl,
  onClose,
  title = "Image",
}: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransforms = () => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handleClose = () => {
    resetTransforms();
    onClose();
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleSaveToGallery = async () => {
    if (!imageUrl) return;

    try {
      setIsSaving(true);

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `rabitchat_${Date.now()}.jpg`;
        link.target = "_blank";
        link.click();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Image download started");
        setIsSaving(false);
        return;
      }

      await WebBrowser.openBrowserAsync(imageUrl);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Save error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to open image");
    } finally {
      setIsSaving(false);
    }
  };

  if (!imageUrl) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.container}>
        <View style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.95)" }]}>
          <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
            <Pressable
              style={[styles.headerButton, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={handleClose}
              hitSlop={12}
            >
              <Feather name="x" size={22} color="#FFF" />
            </Pressable>

            <ThemedText style={styles.title}>{title}</ThemedText>

            <Pressable
              style={[styles.headerButton, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={handleSaveToGallery}
              disabled={isSaving}
              hitSlop={12}
            >
              {isSaving ? (
                <InlineLoader size={20} />
              ) : (
                <Feather name="download" size={20} color="#FFF" />
              )}
            </Pressable>
          </View>

          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="contain"
              />
            </Animated.View>
          </GestureDetector>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={[styles.actionButton, { backgroundColor: theme.primary }]}>
              <Pressable
                style={styles.actionButtonInner}
                onPress={handleSaveToGallery}
                disabled={isSaving}
              >
                {isSaving ? (
                  <InlineLoader size={20} />
                ) : (
                  <>
                    <Feather name="download" size={18} color="#FFF" />
                    <ThemedText style={styles.actionButtonText}>Save to Gallery</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
            <ThemedText style={styles.hint}>Pinch to zoom, double-tap to toggle zoom</ThemedText>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  actionButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  actionButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
});
