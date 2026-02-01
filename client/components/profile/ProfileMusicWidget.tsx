import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

let Audio: typeof import("expo-av").Audio | null = null;
if (Platform.OS !== "web") {
  Audio = require("expo-av").Audio;
}
type AudioSound = import("expo-av").Audio.Sound;
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useAudioManager } from "@/contexts/AudioManagerContext";

interface ProfileMusicWidgetProps {
  songUrl: string;
  title?: string;
  artist?: string;
}

export function ProfileMusicWidget({ songUrl, title, artist }: ProfileMusicWidgetProps) {
  const { theme } = useTheme();
  const audioManager = useAudioManager();
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<AudioSound | null>(null);
  const soundRef = useRef<AudioSound | null>(null);
  const playerId = useMemo(() => `music-${songUrl}`, [songUrl]);

  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      }
      setIsPlaying(false);
    } catch (err) {
      console.error("Error stopping music:", err);
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
    if (isPlaying && sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    try {
      if (Platform.OS === "web" || !Audio) return;
      
      audioManager.requestPlayback(playerId);
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: songUrl },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
              }
            }
          }
        );
        setSound(newSound);
        soundRef.current = newSound;
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Failed to play song:", error);
    }
  }, [isPlaying, sound, songUrl, audioManager, playerId]);

  return (
    <Pressable 
      style={[styles.container, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
      onPress={handlePlayPause}
      testID="profile-music-widget"
    >
      <LinearGradient
        colors={["#1DB954", "#1aa34a"]}
        style={styles.musicIcon}
      >
        <Feather name="music" size={14} color="#FFF" />
      </LinearGradient>
      
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title || "Featured Song"}
        </ThemedText>
        {artist ? (
          <ThemedText style={[styles.artist, { color: theme.textSecondary }]} numberOfLines={1}>
            {artist}
          </ThemedText>
        ) : null}
      </View>

      <View style={[styles.playButton, { backgroundColor: isPlaying ? theme.primary : theme.glassBackground }]}>
        <Feather 
          name={isPlaying ? "pause" : "play"} 
          size={14} 
          color={isPlaying ? "#FFF" : theme.text} 
        />
      </View>

      {isPlaying ? (
        <View style={styles.visualizer}>
          <View style={[styles.bar, styles.bar1, { backgroundColor: theme.primary }]} />
          <View style={[styles.bar, styles.bar2, { backgroundColor: theme.primary }]} />
          <View style={[styles.bar, styles.bar3, { backgroundColor: theme.primary }]} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  musicIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  artist: {
    fontSize: 11,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  visualizer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginLeft: Spacing.sm,
    height: 16,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  bar1: {
    height: 8,
  },
  bar2: {
    height: 14,
  },
  bar3: {
    height: 10,
  },
});