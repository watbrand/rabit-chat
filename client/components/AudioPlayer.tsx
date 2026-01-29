import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { InlineLoader } from "@/components/animations";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { createWatchTracker, TrafficSource } from "@/lib/analytics";
import { useAudioManager } from "@/contexts/AudioManagerContext";

interface AudioPlayerProps {
  uri: string;
  durationMs?: number | null;
  thumbnailUrl?: string | null;
  compact?: boolean;
  postId?: string;
  source?: TrafficSource;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ uri, durationMs, compact = false, postId, source = "FEED" }: AudioPlayerProps) {
  const { theme } = useTheme();
  const audioManager = useAudioManager();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationMs || 0);
  const [error, setError] = useState<string | null>(null);
  const positionRef = useRef(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playerId = useMemo(() => postId || `audio-${uri}-${Date.now()}`, [postId, uri]);
  
  const watchTracker = useMemo(() => {
    if (postId) {
      return createWatchTracker(postId, source);
    }
    return null;
  }, [postId, source]);

  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } catch (err) {
      console.error("Error stopping audio:", err);
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
    if (watchTracker) {
      if (isPlaying) {
        watchTracker.start();
      } else {
        watchTracker.pause();
      }
    }
  }, [isPlaying, watchTracker]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (watchTracker) {
        watchTracker.stop();
      }
    };
  }, [sound, watchTracker]);

  const handlePlayPause = async () => {
    try {
      setError(null);
      
      if (!sound) {
        audioManager.requestPlayback(playerId);
        setIsLoading(true);
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );

        if (status.isLoaded && status.durationMillis) {
          setDuration(status.durationMillis);
        }

        setSound(newSound);
        soundRef.current = newSound;
        setIsPlaying(true);
        setIsLoading(false);
      } else {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          audioManager.requestPlayback(playerId);
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error("Audio playback error:", err);
      setError("Failed to play audio");
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      positionRef.current = status.positionMillis;
      setPosition(status.positionMillis);
      
      if (status.durationMillis) {
        setDuration(status.durationMillis);
      }
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        sound?.setPositionAsync(0);
        if (watchTracker) {
          watchTracker.complete();
        }
      }
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  if (compact) {
    return (
      <Pressable
        style={[styles.compactContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
        onPress={handlePlayPause}
        disabled={isLoading}
      >
        <View style={[styles.playButtonSmall, { backgroundColor: theme.primary }]}>
          {isLoading ? (
            <InlineLoader size={16} />
          ) : (
            <Feather name={isPlaying ? "pause" : "play"} size={16} color="#FFFFFF" />
          )}
        </View>
        <View style={styles.compactInfo}>
          <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]} />
          </View>
          <ThemedText style={[styles.durationText, { color: theme.textSecondary }]}>
            {formatDuration(position)} / {formatDuration(duration)}
          </ThemedText>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
      <View style={styles.content}>
        <Pressable
          style={[styles.playButton, { backgroundColor: theme.primary }]}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <InlineLoader size={24} />
          ) : (
            <Feather name={isPlaying ? "pause" : "play"} size={24} color="#FFFFFF" />
          )}
        </Pressable>

        <View style={styles.info}>
          <View style={[styles.waveform, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={[styles.waveformFill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
              {formatDuration(position)}
            </ThemedText>
            <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
              {formatDuration(duration)}
            </ThemedText>
          </View>
        </View>
      </View>

      {error ? (
        <ThemedText style={[styles.errorText, { color: theme.error }]}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  playButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  waveform: {
    height: 24,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  waveformFill: {
    height: "100%",
    borderRadius: BorderRadius.xs,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  time: {
    fontSize: 12,
  },
  errorText: {
    marginTop: Spacing.sm,
    fontSize: 12,
    textAlign: "center",
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  compactInfo: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  durationText: {
    fontSize: 11,
  },
});
