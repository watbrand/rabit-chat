import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.8;

export type MessageType = "TEXT" | "PHOTO" | "VIDEO" | "FILE" | "VOICE" | "LINK";
export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

interface ReplyToMessage {
  id: string;
  content: string;
  senderName: string;
}

interface Message {
  id: string;
  type: MessageType;
  content?: string;
  encryptedContent?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  voiceDuration?: number;
  voiceWaveform?: number[];
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkImage?: string;
  linkDomain?: string;
  status?: MessageStatus;
  senderId: string;
  createdAt: string;
  replyToMessage?: ReplyToMessage;
}

export interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  onPlayVoice?: () => void;
  onDownloadFile?: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getFileIcon(mimeType?: string): keyof typeof Feather.glyphMap {
  if (!mimeType) return "file";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "music";
  if (mimeType.includes("pdf")) return "file-text";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "archive";
  if (mimeType.includes("word") || mimeType.includes("document")) return "file-text";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "grid";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "monitor";
  return "file";
}

interface WaveBarProps {
  index: number;
  isPlaying: boolean;
  height: number;
  baseHeight: number;
  color: string;
}

function WaveBar({ index, isPlaying, height, baseHeight, color }: WaveBarProps) {
  const scaleY = useSharedValue(baseHeight / height);

  useEffect(() => {
    if (isPlaying) {
      scaleY.value = withDelay(
        index * 30,
        withRepeat(
          withSequence(
            withTiming(0.3 + Math.random() * 0.7, {
              duration: 200 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0.2 + Math.random() * 0.5, {
              duration: 200 + Math.random() * 200,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          -1,
          true
        )
      );
    } else {
      scaleY.value = withTiming(baseHeight / height, { duration: 300 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { height, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

interface VoiceMessagePlayerProps {
  duration?: number;
  waveform?: number[];
  isPlaying: boolean;
  progress: number;
  playbackSpeed: number;
  onPlayPause: () => void;
  onSpeedChange: () => void;
  isSent: boolean;
}

function VoiceMessagePlayer({
  duration,
  waveform,
  isPlaying,
  progress,
  playbackSpeed,
  onPlayPause,
  onSpeedChange,
  isSent,
}: VoiceMessagePlayerProps) {
  const { theme } = useTheme();
  const barCount = 24;
  const defaultWaveform = waveform || Array.from({ length: barCount }, () => Math.random());

  const barColor = isSent ? "#FFFFFF" : theme.primary;
  const textColor = isSent ? "#FFFFFF" : theme.textSecondary;
  const buttonBg = isSent ? "#FFFFFF33" : theme.primary + "33";
  const buttonIconColor = isSent ? "#FFFFFF" : theme.primary;

  return (
    <View style={styles.voiceContainer}>
      <Pressable
        style={[styles.voicePlayButton, { backgroundColor: buttonBg }]}
        onPress={onPlayPause}
      >
        <Feather
          name={isPlaying ? "pause" : "play"}
          size={18}
          color={buttonIconColor}
        />
      </Pressable>

      <View style={styles.voiceWaveformContainer}>
        {defaultWaveform.slice(0, barCount).map((value, index) => (
          <WaveBar
            key={index}
            index={index}
            isPlaying={isPlaying}
            height={24}
            baseHeight={6 + value * 18}
            color={barColor}
          />
        ))}
      </View>

      <View style={styles.voiceInfoContainer}>
        <Text style={[styles.voiceDuration, { color: textColor }]}>
          {formatDuration(isPlaying ? duration ? duration * progress : 0 : duration)}
        </Text>
        <Pressable
          style={[styles.speedButton, { backgroundColor: buttonBg }]}
          onPress={onSpeedChange}
        >
          <Text style={[styles.speedText, { color: textColor }]}>
            {playbackSpeed}x
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface FileMessageCardProps {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  onDownload?: () => void;
  isSent: boolean;
}

function FileMessageCard({
  fileName,
  fileSize,
  mimeType,
  onDownload,
  isSent,
}: FileMessageCardProps) {
  const { theme } = useTheme();
  const iconName = getFileIcon(mimeType);

  const iconBg = isSent ? "#FFFFFF33" : theme.primary + "33";
  const iconColor = isSent ? "#FFFFFF" : theme.primary;
  const textColor = isSent ? "#FFFFFF" : theme.text;
  const secondaryColor = isSent ? "#FFFFFF" : theme.textSecondary;

  return (
    <View style={styles.fileContainer}>
      <View style={[styles.fileIconContainer, { backgroundColor: iconBg }]}>
        <Feather name={iconName} size={24} color={iconColor} />
      </View>

      <View style={styles.fileInfoContainer}>
        <Text
          style={[styles.fileName, { color: textColor }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {fileName || "File"}
        </Text>
        <Text style={[styles.fileSize, { color: secondaryColor }]}>
          {formatFileSize(fileSize)}
        </Text>
      </View>

      <Pressable
        style={[styles.downloadButton, { backgroundColor: iconBg }]}
        onPress={onDownload}
      >
        <Feather name="download" size={18} color={iconColor} />
      </Pressable>
    </View>
  );
}

interface LinkPreviewCardProps {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  isSent: boolean;
  onPress?: () => void;
}

function LinkPreviewCard({
  url,
  title,
  description,
  image,
  domain,
  isSent,
  onPress,
}: LinkPreviewCardProps) {
  const { theme, isDark } = useTheme();

  const cardBg = isSent
    ? "#FFFFFF26"
    : isDark
    ? theme.backgroundSecondary
    : theme.backgroundFloating;
  const borderColor = isSent ? "#FFFFFF40" : theme.border;
  const textColor = isSent ? "#FFFFFF" : theme.text;
  const secondaryColor = isSent ? "#FFFFFF" : theme.textSecondary;
  const domainColor = isSent ? "#FFFFFF" : theme.primary;

  return (
    <Pressable
      style={[
        styles.linkPreviewContainer,
        { backgroundColor: cardBg, borderColor },
      ]}
      onPress={onPress}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.linkImage}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.linkContent}>
        <View style={styles.linkDomainRow}>
          <Feather name="link" size={12} color={domainColor} />
          <Text style={[styles.linkDomain, { color: domainColor }]}>
            {domain || new URL(url || "").hostname}
          </Text>
        </View>

        {title ? (
          <Text
            style={[styles.linkTitle, { color: textColor }]}
            numberOfLines={2}
          >
            {title}
          </Text>
        ) : null}

        {description ? (
          <Text
            style={[styles.linkDescription, { color: secondaryColor }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function StatusIcon({ status, isSent }: { status?: MessageStatus; isSent: boolean }) {
  if (!isSent) return null;

  const color = "#FFFFFF";
  const size = 14;

  switch (status) {
    case "SENDING":
      return <Feather name="clock" size={size} color={color} />;
    case "SENT":
      return <Feather name="check" size={size} color={color} />;
    case "DELIVERED":
      return (
        <View style={styles.doubleCheckContainer}>
          <Feather name="check" size={size} color={color} style={styles.checkOverlap} />
          <Feather name="check" size={size} color={color} />
        </View>
      );
    case "READ":
      return (
        <View style={styles.doubleCheckContainer}>
          <Feather name="check" size={size} color="#34D399" style={styles.checkOverlap} />
          <Feather name="check" size={size} color="#34D399" />
        </View>
      );
    case "FAILED":
      return <Feather name="alert-circle" size={size} color="#EF4444" />;
    default:
      return null;
  }
}

function EncryptionBadge({ isSent }: { isSent: boolean }) {
  const color = isSent ? "#FFFFFF" : "#8B5CF6";

  return (
    <View style={styles.encryptionBadge}>
      <Feather name="lock" size={10} color={color} />
    </View>
  );
}

export function MessageBubble({
  message,
  isSent,
  senderName,
  senderAvatar,
  onPress,
  onLongPress,
  onPlayVoice,
  onDownloadFile,
}: MessageBubbleProps) {
  const { theme, isDark } = useTheme();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const soundRef = useRef<Audio.Sound | null>(null);

  const handlePlayVoice = async () => {
    if (!message.mediaUrl) {
      onPlayVoice?.();
      return;
    }

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: true, rate: playbackSpeed },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis && status.positionMillis) {
              setPlaybackProgress(status.positionMillis / status.durationMillis);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackProgress(0);
              soundRef.current = null;
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing voice message:", error);
    }
  };

  const handleSpeedChange = async () => {
    const speeds = [1, 1.5, 2, 0.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);

    if (soundRef.current && isPlaying) {
      await soundRef.current.setRateAsync(nextSpeed, true);
    }
  };

  const renderReplyPreview = () => {
    if (!message.replyToMessage) return null;

    return (
      <View
        style={[
          styles.replyPreview,
          {
            borderLeftColor: theme.primary,
            backgroundColor: isSent
              ? "#FFFFFF1A"
              : theme.backgroundSecondary,
          },
        ]}
      >
        <Text
          style={[
            styles.replyName,
            { color: isSent ? "#FFFFFF" : theme.primary },
          ]}
          numberOfLines={1}
        >
          {message.replyToMessage.senderName}
        </Text>
        <Text
          style={[
            styles.replyContent,
            { color: isSent ? "#FFFFFF" : theme.textSecondary },
          ]}
          numberOfLines={1}
        >
          {message.replyToMessage.content}
        </Text>
      </View>
    );
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case "PHOTO":
        return (
          <Pressable onPress={() => setImageModalVisible(true)}>
            <Image
              source={{ uri: message.mediaUrl || "" }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {message.content ? (
              <Text
                style={[
                  styles.messageText,
                  { color: isSent ? "#FFFFFF" : theme.text, marginTop: Spacing.sm },
                ]}
              >
                {message.content}
              </Text>
            ) : null}
          </Pressable>
        );

      case "VIDEO":
        return (
          <Pressable onPress={onPress}>
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: message.mediaUrl || "" }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
              <View style={styles.videoPlayOverlay}>
                <View
                  style={[
                    styles.videoPlayButton,
                    { backgroundColor: "rgba(0,0,0,0.5)" },
                  ]}
                >
                  <Feather name="play" size={32} color="#FFFFFF" />
                </View>
              </View>
            </View>
            {message.content ? (
              <Text
                style={[
                  styles.messageText,
                  { color: isSent ? "#FFFFFF" : theme.text, marginTop: Spacing.sm },
                ]}
              >
                {message.content}
              </Text>
            ) : null}
          </Pressable>
        );

      case "FILE":
        return (
          <FileMessageCard
            fileName={message.fileName}
            fileSize={message.fileSize}
            mimeType={message.fileMimeType}
            onDownload={onDownloadFile}
            isSent={isSent}
          />
        );

      case "VOICE":
        return (
          <VoiceMessagePlayer
            duration={message.voiceDuration}
            waveform={message.voiceWaveform}
            isPlaying={isPlaying}
            progress={playbackProgress}
            playbackSpeed={playbackSpeed}
            onPlayPause={handlePlayVoice}
            onSpeedChange={handleSpeedChange}
            isSent={isSent}
          />
        );

      case "LINK":
        return (
          <>
            {message.content ? (
              <Text
                style={[
                  styles.messageText,
                  { color: isSent ? "#FFFFFF" : theme.text, marginBottom: Spacing.sm },
                ]}
              >
                {message.content}
              </Text>
            ) : null}
            <LinkPreviewCard
              url={message.linkUrl}
              title={message.linkTitle}
              description={message.linkDescription}
              image={message.linkImage}
              domain={message.linkDomain}
              isSent={isSent}
              onPress={onPress}
            />
          </>
        );

      case "TEXT":
      default:
        const isEncryptedOnly = !message.content && message.encryptedContent;
        return (
          <Text
            style={[
              styles.messageText,
              { color: isSent ? "#FFFFFF" : theme.text },
              isEncryptedOnly && styles.encryptedText,
            ]}
          >
            {message.content || (isEncryptedOnly ? "🔒 Encrypted message" : "")}
          </Text>
        );
    }
  };

  const renderBubble = () => {
    const content = (
      <>
        {renderReplyPreview()}
        {renderMessageContent()}
        <View style={styles.metaRow}>
          {message.encryptedContent && !message.content ? <EncryptionBadge isSent={isSent} /> : null}
          <Text
            style={[
              styles.timestamp,
              { color: isSent ? "#FFFFFF" : theme.textSecondary },
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
          <StatusIcon status={message.status} isSent={isSent} />
        </View>
      </>
    );

    if (isSent) {
      return (
        <View
          style={[
            styles.bubble,
            styles.bubbleSent,
            { backgroundColor: "#8B5CF6" },
          ]}
        >
          {content}
        </View>
      );
    }

    return (
      <View
        style={[
          styles.bubble,
          styles.bubbleReceived,
          {
            backgroundColor: isDark
              ? "#2A2A3A"
              : "#F5F5F5",
            borderColor: isDark ? "#3A3A4A" : "#E0E0E0",
          },
        ]}
      >
        {content}
      </View>
    );
  };

  return (
    <View style={[styles.container, isSent && styles.containerSent]}>
      {!isSent ? (
        <View style={styles.avatarContainer}>
          <Avatar uri={senderAvatar} size={32} />
        </View>
      ) : null}

      <Pressable
        style={styles.bubbleWrapper}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={300}
      >
        {renderBubble()}
      </Pressable>

      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <Pressable
          style={styles.imageModalOverlay}
          onPress={() => setImageModalVisible(false)}
        >
          <Image
            source={{ uri: message.mediaUrl || "" }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  containerSent: {
    flexDirection: "row-reverse",
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  bubbleWrapper: {
    maxWidth: MAX_BUBBLE_WIDTH,
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bubbleSent: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  bubbleReceived: {
    borderWidth: 1,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "left",
  },
  encryptedText: {
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "500",
  },
  encryptionBadge: {
    marginRight: 2,
  },
  doubleCheckContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkOverlap: {
    marginRight: -8,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xs,
    paddingRight: Spacing.sm,
  },
  replyName: {
    fontSize: 12,
    fontWeight: "600",
  },
  replyContent: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "400",
  },
  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minWidth: 200,
  },
  voicePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceWaveformContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 24,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
    transformOrigin: "center",
  },
  voiceInfoContainer: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  voiceDuration: {
    fontSize: 11,
    fontWeight: "400",
  },
  speedButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  speedText: {
    fontSize: 10,
    fontWeight: "600",
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minWidth: 200,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfoContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "400",
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  linkPreviewContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  linkImage: {
    width: "100%",
    height: 120,
  },
  linkContent: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  linkDomainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  linkDomain: {
    fontSize: 11,
    fontWeight: "400",
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  linkDescription: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  mediaImage: {
    width: 220,
    height: 200,
    borderRadius: BorderRadius.md,
  },
  videoContainer: {
    position: "relative",
  },
  videoPlayOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "80%",
  },
});

export default MessageBubble;
