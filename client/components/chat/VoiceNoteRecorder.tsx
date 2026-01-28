import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CANCEL_THRESHOLD = -100;
const MAX_DURATION = 180;
const WAVEFORM_BARS = 50;

interface VoiceNoteRecorderProps {
  onRecordComplete: (uri: string, duration: number, waveform: number[]) => void;
  onCancel: () => void;
  disabled?: boolean;
}

function WaveformBar({ index, isActive }: { index: number; isActive: boolean }) {
  const height = useSharedValue(4);

  useEffect(() => {
    if (isActive) {
      const baseDelay = index * 30;
      height.value = withRepeat(
        withSequence(
          withTiming(8 + Math.random() * 24, {
            duration: 150 + Math.random() * 150,
            easing: Easing.ease,
          }),
          withTiming(4 + Math.random() * 8, {
            duration: 150 + Math.random() * 150,
            easing: Easing.ease,
          })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(4, { duration: 200 });
    }
  }, [isActive, height, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.waveBar,
        animatedStyle,
        { backgroundColor: isActive ? Colors.dark.error : Colors.dark.textTertiary },
      ]}
    />
  );
}

function WaveformVisualizer({ isRecording }: { isRecording: boolean }) {
  const bars = Array(20).fill(0);

  return (
    <View style={styles.waveformContainer}>
      {bars.map((_, index) => (
        <WaveformBar key={index} index={index} isActive={isRecording} />
      ))}
    </View>
  );
}

export default function VoiceNoteRecorder({
  onRecordComplete,
  onCancel,
  disabled = false,
}: VoiceNoteRecorderProps) {
  const { theme, isDark } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformDataRef = useRef<number[]>([]);
  const waveformIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const micScale = useSharedValue(1);

  useEffect(() => {
    checkPermissions();
    return () => {
      cleanup();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      setHasPermission(false);
    }
  };

  const cleanup = useCallback(async () => {
    stopTimer();
    stopWaveformGeneration();
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (e) {
      // Cleanup error - ignore
    }
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => {
        if (prev >= MAX_DURATION) {
          stopRecording(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startWaveformGeneration = () => {
    waveformDataRef.current = [];
    waveformIntervalRef.current = setInterval(() => {
      if (waveformDataRef.current.length < WAVEFORM_BARS) {
        waveformDataRef.current.push(Math.random());
      }
    }, (MAX_DURATION * 1000) / WAVEFORM_BARS);
  };

  const stopWaveformGeneration = () => {
    if (waveformIntervalRef.current) {
      clearInterval(waveformIntervalRef.current);
      waveformIntervalRef.current = null;
    }
  };

  const generateFinalWaveform = (duration: number): number[] => {
    const waveform: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      waveform.push(Math.random() * 0.7 + 0.3);
    }
    return waveform;
  };

  const startRecording = async () => {
    if (disabled || hasPermission === false) return;

    try {
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
      setIsCancelling(false);
      waveformDataRef.current = [];

      startTimer();
      startWaveformGeneration();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(0.2, { duration: 600 })
        ),
        -1
      );

      micScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1.0, { duration: 500 })
        ),
        -1
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const stopRecording = async (shouldSend: boolean = true) => {
    if (!recordingRef.current) return;

    try {
      stopTimer();
      stopWaveformGeneration();

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const duration = recordingDuration;

      recordingRef.current = null;
      setIsRecording(false);

      pulseOpacity.value = withTiming(0, { duration: 200 });
      micScale.value = withTiming(1, { duration: 200 });
      translateX.value = withSpring(0);

      if (shouldSend && uri && duration > 0) {
        const waveform = generateFinalWaveform(duration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onRecordComplete(uri, duration, waveform);
      }

      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const cancelRecording = async () => {
    if (!recordingRef.current) return;

    try {
      stopTimer();
      stopWaveformGeneration();

      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;

      setIsRecording(false);
      setIsCancelling(false);
      setRecordingDuration(0);

      pulseOpacity.value = withTiming(0, { duration: 200 });
      micScale.value = withTiming(1, { duration: 200 });
      translateX.value = withSpring(0);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onCancel();
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  const handleRecordStart = useCallback(() => {
    startRecording();
  }, [disabled, hasPermission]);

  const handleRecordEnd = useCallback(
    (cancelled: boolean) => {
      if (cancelled) {
        cancelRecording();
      } else {
        stopRecording(true);
      }
    },
    [recordingDuration]
  );

  const handleSlideUpdate = useCallback((x: number) => {
    setIsCancelling(x < CANCEL_THRESHOLD);
  }, []);

  const longPressGesture = Gesture.LongPress()
    .minDuration(150)
    .onStart(() => {
      runOnJS(handleRecordStart)();
    });

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onUpdate((event) => {
      if (isRecording) {
        const clampedX = Math.min(0, Math.max(-SCREEN_WIDTH * 0.4, event.translationX));
        translateX.value = clampedX;
        runOnJS(handleSlideUpdate)(clampedX);
      }
    })
    .onEnd((event) => {
      if (isRecording) {
        const cancelled = event.translationX < CANCEL_THRESHOLD;
        translateX.value = withSpring(0);
        runOnJS(handleRecordEnd)(cancelled);
      }
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (!isRecording) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    });

  const composedGesture = Gesture.Simultaneous(
    longPressGesture,
    panGesture,
    tapGesture
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: interpolate(pulseOpacity.value, [0.2, 0.6], [1, 1.5], Extrapolation.CLAMP) }],
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const slideHintOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, CANCEL_THRESHOLD], [1, 0], Extrapolation.CLAMP),
  }));

  const cancelIndicatorOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [CANCEL_THRESHOLD + 30, CANCEL_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Feather name="mic-off" size={20} color={theme.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {isRecording ? (
        <Animated.View style={[styles.recordingContainer, containerAnimatedStyle]}>
          <Animated.View style={[styles.slideHint, slideHintOpacity]}>
            <Feather name="chevron-left" size={16} color={theme.textSecondary} />
            <Text style={[styles.slideHintText, { color: theme.textSecondary }]}>
              Slide to cancel
            </Text>
          </Animated.View>

          <Animated.View style={[styles.cancelIndicator, cancelIndicatorOpacity]}>
            <Feather name="x" size={20} color={theme.error} />
            <Text style={[styles.cancelText, { color: theme.error }]}>
              Release to cancel
            </Text>
          </Animated.View>

          <WaveformVisualizer isRecording={isRecording} />

          <View style={styles.timerContainer}>
            <View style={styles.recordingIndicator} />
            <Text style={[styles.timerText, { color: theme.text }]}>
              {formatTime(recordingDuration)}
            </Text>
          </View>

          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.micButtonRecording, micAnimatedStyle]}>
              <Animated.View style={[styles.pulseRing, pulseStyle]} />
              <View style={[styles.micButtonInner, { backgroundColor: theme.error }]}>
                <Feather name="mic" size={24} color="#FFFFFF" />
              </View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      ) : (
        <GestureDetector gesture={composedGesture}>
          <Animated.View
            style={[
              styles.micButton,
              {
                backgroundColor: isDark
                  ? 'rgba(139, 92, 246, 0.15)'
                  : 'rgba(139, 92, 246, 0.12)',
                borderColor: isDark
                  ? 'rgba(139, 92, 246, 0.25)'
                  : 'rgba(139, 92, 246, 0.20)',
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <Feather name="mic" size={22} color={theme.primary} />
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 36, 0.85)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: Spacing.sm,
  },
  slideHint: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: Spacing.md,
  },
  slideHintText: {
    ...Typography.caption1,
    marginLeft: 4,
  },
  cancelIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: Spacing.md,
  },
  cancelText: {
    ...Typography.caption1,
    fontWeight: '600',
    marginLeft: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    gap: 2,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 100,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.error,
  },
  timerText: {
    ...Typography.subhead,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 40,
  },
  micButtonRecording: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.error,
  },
});
