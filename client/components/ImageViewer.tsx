import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal, Dimensions, StatusBar, Platform } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

interface ImageViewerProps {
  uri: string;
  style?: any;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ImageViewer({ uri, style }: ImageViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const insets = useSafeAreaInsets();

  const handleOpen = () => setIsFullscreen(true);
  const handleClose = () => setIsFullscreen(false);

  return (
    <>
      <Pressable onPress={handleOpen}>
        <Image
          source={{ uri }}
          style={style}
          contentFit="cover"
        />
      </Pressable>

      <Modal
        visible={isFullscreen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <StatusBar backgroundColor="#000000" barStyle="light-content" />
        <View style={styles.modalContainer}>
          <Pressable 
            style={[styles.closeButton, { top: insets.top + Spacing.md }]} 
            onPress={handleClose}
          >
            <View style={styles.closeButtonInner}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </View>
          </Pressable>

          <Image
            source={{ uri }}
            style={styles.fullscreenImage}
            contentFit="contain"
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeButton: {
    position: "absolute",
    right: Spacing.md,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
