import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Typography, Animation } from '@/constants/theme';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface MessageAttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectMedia: (uri: string, type: 'photo' | 'video', thumbnail?: string) => void;
  onSelectDocument: (uri: string, name: string, size: number, mimeType: string) => void;
  onOpenCamera: () => void;
}

interface AttachmentOption {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageAttachmentPicker({
  visible,
  onClose,
  onSelectMedia,
  onSelectDocument,
  onOpenCamera,
}: MessageAttachmentPickerProps) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to select media.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const generateVideoThumbnail = async (videoUri: string): Promise<string | undefined> => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 0.7,
      });
      return uri;
    } catch (error) {
      console.error('Failed to generate video thumbnail:', error);
      return undefined;
    }
  };

  const handleSelectPhoto = async () => {
    triggerHaptic();
    
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onClose();
        onSelectMedia(asset.uri, 'photo');
      }
    } catch (error) {
      console.error('Error picking photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleSelectVideo = async () => {
    triggerHaptic();
    
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const thumbnail = await generateVideoThumbnail(asset.uri);
        onClose();
        onSelectMedia(asset.uri, 'video', thumbnail);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };

  const handleOpenCamera = () => {
    triggerHaptic();
    onClose();
    onOpenCamera();
  };

  const handleSelectDocument = async () => {
    triggerHaptic();

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const fileSize = asset.size ?? 0;

      if (fileSize > MAX_FILE_SIZE) {
        Alert.alert(
          'File Too Large',
          `This file is ${formatFileSize(fileSize)}. Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE)}.`,
          [{ text: 'OK' }]
        );
        return;
      }

      onClose();
      onSelectDocument(
        asset.uri,
        asset.name,
        fileSize,
        asset.mimeType ?? 'application/octet-stream'
      );
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const attachmentOptions: AttachmentOption[] = [
    {
      id: 'camera',
      icon: 'camera',
      label: 'Camera',
      onPress: handleOpenCamera,
    },
    {
      id: 'photo',
      icon: 'image',
      label: 'Photo',
      onPress: handleSelectPhoto,
    },
    {
      id: 'video',
      icon: 'video',
      label: 'Video',
      onPress: handleSelectVideo,
    },
    {
      id: 'document',
      icon: 'file-text',
      label: 'Document',
      onPress: handleSelectDocument,
    },
  ];

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, Animation.springBouncy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Animation.springBouncy);
  }, [scale]);

  const cancelButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        
        <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
              <View style={[styles.blurOverlay, { backgroundColor: isDark ? 'rgba(20, 15, 30, 0.85)' : 'rgba(255, 255, 255, 0.9)' }]} />
            </BlurView>
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(20, 15, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)' }]} />
          )}
          
          <View style={styles.handle} />
          
          <View style={styles.content}>
            <ThemedText style={styles.title}>Share</ThemedText>
            
            <View style={styles.optionsGrid}>
              {attachmentOptions.map((option) => (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.optionButton,
                    {
                      backgroundColor: isDark
                        ? pressed
                          ? 'rgba(139, 92, 246, 0.25)'
                          : 'rgba(139, 92, 246, 0.15)'
                        : pressed
                          ? 'rgba(139, 92, 246, 0.20)'
                          : 'rgba(139, 92, 246, 0.10)',
                      borderColor: isDark
                        ? 'rgba(139, 92, 246, 0.30)'
                        : 'rgba(139, 92, 246, 0.20)',
                    },
                  ]}
                  onPress={option.onPress}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: isDark
                          ? 'rgba(139, 92, 246, 0.25)'
                          : 'rgba(139, 92, 246, 0.15)',
                      },
                    ]}
                  >
                    <Feather name={option.icon} size={24} color={theme.primary} />
                  </View>
                  <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
                </Pressable>
              ))}
            </View>
            
            <Pressable
              onPress={() => {
                triggerHaptic();
                onClose();
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View
                style={[
                  styles.cancelButton,
                  cancelButtonStyle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <ThemedText style={[styles.cancelText, { color: theme.textSecondary }]}>
                  Cancel
                </ThemedText>
              </Animated.View>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.headline,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionButton: {
    width: '48%',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    ...Typography.subhead,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
