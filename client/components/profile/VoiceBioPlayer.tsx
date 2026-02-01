import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";

let Audio: typeof import("expo-av").Audio | null = null;
if (Platform.OS !== "web") {
  Audio = require("expo-av").Audio;
}
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAudioManager } from "@/contexts/AudioManagerContext";

interface VoiceBioPlayerProps {
  voiceBioUrl: string;
  durationMs?: number;
  label?: string;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VoiceBioPlayer({ voiceBioUrl, durationMs, label = "Voice Bio" }: VoiceBioPlayerProps) {
  const { theme } = useTheme();
  const audioManager = useAudioManager();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<import("expo-av").Audio.Sound | null>(null);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef<import("expo-av").Audio.Sound | null>(null);
  const playerId = useMemo(() => `voice-bio-${voiceBioUrl}`, [voiceBioUrl]);

  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } catch (err) {
      console.error("Error stopping voice bio:", err);
    }
  }, []);

  useEffect(() => {
    audioManager.registerPlayer(playerId, stopPlayback);
    return () => {
      audioManager.unregisterPlayer(playerId);
    };
  }, [playerId, audioManager, stopPlayback]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handlePlayPause = useCallback(async () => {
    if (Platform.OS === "web" || !Audio) {
      console.warn("Audio playback is not available on web");
      return;
    }

    if (isPlaying && sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    try {
      audioManager.requestPlayback(playerId);
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: voiceBioUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              if (status.durationMillis) {
                setProgress((status.positionMillis / status.durationMillis) * 100);
              }
              if (status.didJustFinish) {
                setIsPlaying(false);
                setProgress(0);
              }
            }
          }
        );
        setSound(newSound);
        soundRef.current = newSound;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Failed to play voice bio:", error);
    }
  }, [isPlaying, sound, voiceBioUrl, audioManager, playerId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
      <Pressable
        onPress={handlePlayPause}
        style={[styles.playButton]}
        testID="button-play-voice-bio"
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          style={styles.playButtonGradient}
        >
          <Feather 
            name={isPlaying ? "pause" : "play"} 
            size={16} 
            color="#FFF" 
          />
        </LinearGradient>
      </Pressable>
      
      <View style={styles.content}>
        <ThemedText style={[styles.label, { color: theme.text }]}>
          {label}
        </ThemedText>
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.glassBorder }]}>
            <View 
              style={[styles.progressFill, { backgroundColor: theme.primary, width: `${progress}%` }]} 
            />
          </View>
          {durationMs ? (
            <ThemedText style={[styles.duration, { color: theme.textSecondary }]}>
              {formatDuration(durationMs)}
            </ThemedText>
          ) : null}
        </View>
      </View>
      
      <Feather name="mic" size={16} color={theme.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  playButton: {
    marginRight: Spacing.sm,
  },
  playButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  duration: {
    fontSize: 11,
    minWidth: 32,
  },
});