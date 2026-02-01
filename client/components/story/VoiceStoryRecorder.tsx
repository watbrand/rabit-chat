import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Text, 
  SafeAreaView,
  Platform,
} from 'react-native';

let Audio: typeof import("expo-av").Audio | null = null;
if (Platform.OS !== "web") {
  Audio = require("expo-av").Audio;
}
type AudioSound = import("expo-av").Audio.Sound;
type AudioRecording = import("expo-av").Audio.Recording;
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { LoadingIndicator } from '@/components/animations';

interface Props {
  onSave: (audioUri: string, duration: number) => void;
  onCancel: () => void;
  maxDuration?: number;
}

function WaveformVisualizer({ isRecording }: { isRecording: boolean }) {
  const bars = Array(12).fill(0);
  
  return (
    <View style={styles.waveform}>
      {bars.map((_, index) => (
        <WaveBar key={index} index={index} isActive={isRecording} />
      ))}
    </View>
  );
}

function WaveBar({ index, isActive }: { index: number; isActive: boolean }) {
  const height = useSharedValue(10);
  
  useEffect(() => {
    if (isActive) {
      height.value = withRepeat(
        withSequence(
          withTiming(20 + Math.random() * 30, { 
            duration: 200 + Math.random() * 200,
            easing: Easing.ease,
          }),
          withTiming(10 + Math.random() * 15, { 
            duration: 200 + Math.random() * 200,
            easing: Easing.ease,
          })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(10, { duration: 300 });
    }
  }, [isActive, height]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.waveBar,
        animatedStyle,
        { backgroundColor: isActive ? Colors.dark.primary : Colors.dark.textSecondary },
      ]}
    />
  );
}

export default function VoiceStoryRecorder({ onSave, onCancel, maxDuration = 600 }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  
  const recordingRef = useRef<AudioRecording | null>(null);
  const soundRef = useRef<AudioSound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const recordButtonScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    checkPermissions();
    return () => {
      stopTimer();
      cleanup();
    };
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === "web" || !Audio) {
      setHasPermission(false);
      return;
    }
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      setHasPermission(false);
    }
  };

  const cleanup = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
    } catch (e) {
      // Cleanup error - ignore
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingDuration(prev => {
        if (prev >= maxDuration) {
          stopRecording();
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

  const startRecording = async () => {
    if (Platform.OS === "web" || !Audio) return;
    
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
      startTimer();
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    
    try {
      stopTimer();
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      recordingRef.current = null;
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      pulseOpacity.value = 0;
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playRecording = async () => {
    if (Platform.OS === "web" || !Audio) return;
    if (!recordingUri) return;
    
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsPlaying(true);
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackPosition(0);
          } else if (status.positionMillis) {
            setPlaybackPosition(status.positionMillis / 1000);
          }
        }
      });
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
    setPlaybackPosition(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (recordingUri) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSave(recordingUri, recordingDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const recordButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordButtonScale.value }],
  }));

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Feather name="mic-off" size={48} color={Colors.dark.textSecondary} />
          <Text style={styles.permissionText}>
            Microphone permission is required to record voice stories.
          </Text>
          <Pressable onPress={checkPermissions} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.headerButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Voice Story</Text>
        <Pressable 
          onPress={handleSave} 
          style={[styles.headerButton, styles.saveButton]}
          disabled={!recordingUri}
        >
          <Text style={[styles.saveText, !recordingUri && styles.saveTextDisabled]}>
            Next
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <WaveformVisualizer isRecording={isRecording} />
        
        <Text style={styles.timer}>
          {formatTime(isRecording ? recordingDuration : (isPlaying ? playbackPosition : recordingDuration))}
        </Text>
        <Text style={styles.maxDuration}>
          {isRecording ? `Max ${formatTime(maxDuration)}` : (recordingUri ? 'Recording complete' : 'Tap to record')}
        </Text>

        <View style={styles.controls}>
          {recordingUri ? (
            <>
              <Pressable onPress={deleteRecording} style={styles.controlButton}>
                <Feather name="trash-2" size={24} color={Colors.dark.error} />
              </Pressable>
              
              <Pressable 
                onPress={isPlaying ? stopPlayback : playRecording} 
                style={styles.playButton}
              >
                <Feather name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
              </Pressable>
              
              <Pressable onPress={() => setRecordingUri(null)} style={styles.controlButton}>
                <Feather name="refresh-cw" size={24} color={Colors.dark.textSecondary} />
              </Pressable>
            </>
          ) : (
            <Pressable 
              onPressIn={() => {
                recordButtonScale.value = withSpring(0.9);
              }}
              onPressOut={() => {
                recordButtonScale.value = withSpring(1);
              }}
              onPress={isRecording ? stopRecording : startRecording} 
              style={styles.recordButtonContainer}
            >
              <Animated.View style={[styles.recordPulse, pulseStyle]} />
              <Animated.View style={[styles.recordButton, recordButtonStyle]}>
                {isRecording ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <Feather name="mic" size={36} color="#fff" />
                )}
              </Animated.View>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    width: 'auto',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
    marginBottom: Spacing.xl,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  timer: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  maxDuration: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  recordButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordPulse: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dark.primary,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  permissionButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  cancelLink: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  cancelLinkText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});
