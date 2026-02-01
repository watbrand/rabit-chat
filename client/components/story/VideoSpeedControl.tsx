import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Colors } from '@/constants/theme';

export interface VideoSpeedControlProps {
  visible: boolean;
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.5, 1, 1.5, 2, 3];

function SpeedButton({
  speed,
  isSelected,
  onPress,
}: {
  speed: number;
  isSelected: boolean;
  onPress: (speed: number) => void;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) }, () => {
      scale.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.ease) });
    });

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    runOnJS(onPress)(speed);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.speedButton,
          isSelected && styles.speedButtonSelected,
        ]}
      >
        <ThemedText
          style={[
            styles.speedText,
            isSelected && styles.speedTextSelected,
          ]}
        >
          {speed === 1 ? 'Normal' : `${speed}x`}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function VideoSpeedControl({
  visible,
  currentSpeed,
  onSpeedChange,
  onClose,
}: VideoSpeedControlProps) {
  const { theme, isDark } = useTheme();
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [visible]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  const handleSpeedChange = (speed: number) => {
    onSpeedChange(speed);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        containerAnimatedStyle,
        {
          pointerEvents: visible ? 'auto' : 'none',
        },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.controlContainer}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.blurOverlay} />
          </BlurView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Playback Speed</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeText}>×</ThemedText>
            </Pressable>
          </View>

          <View style={styles.buttonRow}>
            {SPEED_OPTIONS.map((speed) => (
              <SpeedButton
                key={speed}
                speed={speed}
                isSelected={currentSpeed === speed}
                onPress={handleSpeedChange}
              />
            ))}
          </View>

          <View style={styles.currentSpeedDisplay}>
            <ThemedText style={styles.currentSpeedLabel}>Current:</ThemedText>
            <ThemedText style={styles.currentSpeedValue}>
              {currentSpeed === 1 ? 'Normal' : `${currentSpeed}x`}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  controlContainer: {
    backgroundColor: 'rgba(26, 26, 36, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    minWidth: 280,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.2)',
  },
  androidBackground: {
    backgroundColor: 'rgba(20, 15, 30, 0.70)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    fontWeight: '400',
    color: Colors.dark.text,
    lineHeight: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    width: '100%',
  },
  speedButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(139, 92, 246, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.20)',
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButtonSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.40)',
    borderColor: 'rgba(139, 92, 246, 0.60)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  speedTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  currentSpeedDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.15)',
    width: '100%',
    justifyContent: 'center',
  },
  currentSpeedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  currentSpeedValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
