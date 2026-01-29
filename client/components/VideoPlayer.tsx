import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Pressable, Dimensions, Image } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEvent } from "expo";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { createWatchTracker, TrafficSource } from "@/lib/analytics";

interface VideoPlayerProps {
  uri: string;
  thumbnailUrl?: string | null;
  durationMs?: number | null;
  aspectRatio?: number | null;
  postId?: string;
  source?: TrafficSource;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VideoPlayer({ uri, thumbnailUrl, durationMs, aspectRatio, postId, source = "FEED" }: VideoPlayerProps) {
  const { theme } = useTheme();
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<VideoView>(null);
  
  const watchTracker = useMemo(() => {
    if (postId) {
      return createWatchTracker(postId, source);
    }
    return null;
  }, [postId, source]);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
  });

  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const { status } = useEvent(player, "statusChange", { status: player.status });

  useEffect(() => {
    if (status === "error") {
      setError("Failed to load video");
    }
  }, [status]);

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
    if (status === "idle" && hasStarted && watchTracker) {
      watchTracker.complete();
    }
  }, [status, hasStarted, watchTracker]);

  useEffect(() => {
    return () => {
      if (watchTracker) {
        watchTracker.stop();
      }
    };
  }, [watchTracker]);

  const handlePlayFullscreen = useCallback(() => {
    setHasStarted(true);
    player.play();
    videoRef.current?.enterFullscreen();
  }, [player]);

  const videoAspectRatio = aspectRatio || 4 / 5;
  const screenWidth = Dimensions.get("window").width - Spacing.lg * 2;
  const videoHeight = screenWidth / videoAspectRatio;

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePlayFullscreen} style={[styles.videoWrapper, { height: Math.min(videoHeight, 400) }]}>
        {!hasStarted && thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <VideoView
            ref={videoRef}
            style={styles.video}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
          />
        )}
        
        {!hasStarted ? (
          <View style={styles.overlay}>
            <View style={[styles.playButton, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
              <Feather name="play" size={32} color="#FFFFFF" />
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
            <Feather name="alert-circle" size={32} color="#FF6B6B" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}
      </Pressable>

      {durationMs ? (
        <View style={[styles.durationBadge, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <ThemedText style={styles.durationText}>{formatDuration(durationMs)}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  videoWrapper: {
    width: "100%",
    backgroundColor: "#000000",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  errorText: {
    color: "#FFFFFF",
    marginTop: Spacing.sm,
    fontSize: 14,
  },
});
