import React, { useState, useRef } from "react";
import { View, StyleSheet, Platform, Text, Pressable, Image, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";

import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "@/constants/theme";

export type MessageType = "TEXT" | "PHOTO" | "VIDEO" | "VOICE" | "FILE" | "GIF" | "STICKER";

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user?: {
    username: string;
    displayName: string;
  };
}

interface ReplyTo {
  id: string;
  content: string;
  senderId: string;
  sender?: {
    username: string;
    displayName: string;
  };
}

interface ChatBubbleProps {
  message: {
    id: string;
    content: string;
    createdAt: string;
    read?: boolean;
    readAt?: string | null;
    messageType?: MessageType;
    mediaUrl?: string | null;
    replyTo?: ReplyTo | null;
    reactions?: Reaction[];
    deletedAt?: string | null;
    sender?: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
    };
  };
  isOwn: boolean;
  showAvatar?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onReply?: (message: any) => void;
  onDelete?: (messageId: string) => void;
  onLongPress?: (message: any) => void;
}

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatBubble({ 
  message, 
  isOwn, 
  showAvatar = true,
  onReact,
  onReply,
  onDelete,
  onLongPress 
}: ChatBubbleProps) {
  const { theme } = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Handle deleted messages
  if (message.deletedAt) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
        {!isOwn && showAvatar ? (
          <View style={styles.avatarContainer}>
            <Avatar uri={message.sender?.avatarUrl} size={32} />
          </View>
        ) : null}
        {!isOwn && !showAvatar ? <View style={styles.avatarSpacer} /> : null}
        <View style={styles.bubbleWrapper}>
          <View
            style={[
              styles.bubble,
              styles.deletedBubble,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.glassBorder },
            ]}
          >
            <View style={styles.deletedContent}>
              <Feather name="slash" size={14} color={theme.textSecondary} />
              <Text style={[styles.deletedText, { color: theme.textSecondary }]}>
                Message deleted
              </Text>
            </View>
          </View>
        </View>
        {isOwn && showAvatar ? <View style={styles.avatarSpacer} /> : null}
      </View>
    );
  }

  const handleLongPress = () => {
    setShowReactions(true);
    onLongPress?.(message);
  };

  const handleReaction = (emoji: string) => {
    setShowReactions(false);
    onReact?.(message.id, emoji);
  };

  const handlePlayVoice = async () => {
    if (!message.mediaUrl) return;
    
    try {
      if (isPlaying) {
        setIsPlaying(false);
        return;
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: message.mediaUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPlaybackPosition(status.positionMillis || 0);
            setPlaybackDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPlaybackPosition(0);
            }
          }
        }
      );
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing voice message:", error);
    }
  };

  const renderReplyPreview = () => {
    if (!message.replyTo) return null;
    
    return (
      <View style={[styles.replyPreview, { borderLeftColor: theme.primary }]}>
        <Text style={[styles.replyName, { color: theme.primary }]} numberOfLines={1}>
          {message.replyTo.sender?.displayName || "Unknown"}
        </Text>
        <Text style={[styles.replyText, { color: theme.textSecondary }]} numberOfLines={1}>
          {message.replyTo.content}
        </Text>
      </View>
    );
  };

  const renderMessageContent = () => {
    const messageType = message.messageType || "TEXT";

    switch (messageType) {
      case "VOICE":
        return (
          <Pressable onPress={handlePlayVoice} style={styles.voiceContainer}>
            <View style={[styles.voicePlayButton, { backgroundColor: isOwn ? "rgba(255,255,255,0.2)" : theme.primary }]}>
              <Feather 
                name={isPlaying ? "pause" : "play"} 
                size={16} 
                color={isOwn ? "#FFFFFF" : "#FFFFFF"} 
              />
            </View>
            <View style={styles.voiceWaveform}>
              {[...Array(12)].map((_, i) => (
                <View 
                  key={i}
                  style={[
                    styles.voiceBar,
                    { 
                      backgroundColor: isOwn ? "rgba(255,255,255,0.6)" : theme.primary,
                      height: 8 + Math.random() * 16,
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.voiceDuration, { color: isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary }]}>
              {playbackDuration > 0 ? 
                `${Math.floor(playbackPosition / 1000)}:${String(Math.floor((playbackPosition % 1000) / 10)).padStart(2, "0")} / ${Math.floor(playbackDuration / 1000)}:${String(Math.floor((playbackDuration % 1000) / 10)).padStart(2, "0")}` : 
                "0:00"}
            </Text>
          </Pressable>
        );

      case "PHOTO":
      case "VIDEO":
        return (
          <Pressable onPress={() => setImageModalVisible(true)}>
            <Image 
              source={{ uri: message.mediaUrl || "" }} 
              style={styles.mediaImage}
              resizeMode="cover"
            />
            {messageType === "VIDEO" && (
              <View style={styles.videoPlayOverlay}>
                <Feather name="play-circle" size={40} color="#FFFFFF" />
              </View>
            )}
            {message.content ? (
              <Text style={[styles.content, { color: isOwn ? "#FFFFFF" : theme.text, marginTop: Spacing.sm }]}>
                {message.content}
              </Text>
            ) : null}
          </Pressable>
        );

      case "FILE":
        return (
          <View style={styles.fileContainer}>
            <View style={[styles.fileIcon, { backgroundColor: isOwn ? "rgba(255,255,255,0.2)" : theme.primary + "20" }]}>
              <Feather name="file" size={24} color={isOwn ? "#FFFFFF" : theme.primary} />
            </View>
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, { color: isOwn ? "#FFFFFF" : theme.text }]} numberOfLines={1}>
                {message.content || "File"}
              </Text>
              <Text style={[styles.fileSize, { color: isOwn ? "rgba(255,255,255,0.7)" : theme.textSecondary }]}>
                Tap to download
              </Text>
            </View>
          </View>
        );

      case "GIF":
      case "STICKER":
        return (
          <Image 
            source={{ uri: message.mediaUrl || "" }} 
            style={messageType === "STICKER" ? styles.sticker : styles.gif}
            resizeMode="contain"
          />
        );

      default:
        return (
          <Text style={[styles.content, { color: isOwn ? "#FFFFFF" : theme.text }]}>
            {message.content}
          </Text>
        );
    }
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionCounts = message.reactions.reduce((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <View style={[styles.reactionsContainer, isOwn && styles.reactionsContainerOwn]}>
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <View 
            key={emoji} 
            style={[styles.reactionBadge, { backgroundColor: theme.backgroundSecondary, borderColor: theme.glassBorder }]}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {count > 1 ? (
              <Text style={[styles.reactionCount, { color: theme.text }]}>{count}</Text>
            ) : null}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, isOwn && styles.containerOwn]}>
      {!isOwn && showAvatar ? (
        <View style={styles.avatarContainer}>
          <Avatar uri={message.sender?.avatarUrl} size={32} />
        </View>
      ) : null}
      
      {!isOwn && !showAvatar ? <View style={styles.avatarSpacer} /> : null}
      
      <Pressable 
        style={styles.bubbleWrapper}
        onLongPress={handleLongPress}
        delayLongPress={300}
      >
        {renderReplyPreview()}
        
        {isOwn ? (
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleOwn]}
          >
            {renderMessageContent()}
            <View style={styles.metaRow}>
              <Text style={[styles.time, { color: "rgba(255,255,255,0.7)" }]}>
                {formatTime(message.createdAt)}
              </Text>
              <View style={styles.statusContainer}>
                {message.readAt ? (
                  <Feather name="check-circle" size={12} color="rgba(255,255,255,0.8)" />
                ) : message.read ? (
                  <Feather name="check-circle" size={12} color="rgba(255,255,255,0.6)" />
                ) : (
                  <Feather name="check" size={12} color="rgba(255,255,255,0.6)" />
                )}
              </View>
            </View>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.bubble,
              styles.bubbleReceived,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.glassBorder,
              },
            ]}
          >
            {renderMessageContent()}
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {formatTime(message.createdAt)}
            </Text>
          </View>
        )}
        
        {renderReactions()}
      </Pressable>
      
      {isOwn && showAvatar ? <View style={styles.avatarSpacer} /> : null}

      {/* Reactions Modal */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <Pressable 
          style={styles.reactionModalOverlay}
          onPress={() => setShowReactions(false)}
        >
          <View style={[styles.reactionPicker, { backgroundColor: theme.backgroundSecondary }]}>
            {REACTION_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.reactionPickerItem}
                onPress={() => handleReaction(emoji)}
              >
                <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.messageActions, { backgroundColor: theme.backgroundSecondary }]}>
            <Pressable 
              style={styles.actionButton}
              onPress={() => {
                setShowReactions(false);
                onReply?.(message);
              }}
            >
              <Feather name="corner-up-left" size={20} color={theme.text} />
              <Text style={[styles.actionText, { color: theme.text }]}>Reply</Text>
            </Pressable>
            {isOwn ? (
              <Pressable 
                style={styles.actionButton}
                onPress={() => {
                  setShowReactions(false);
                  onDelete?.(message.id);
                }}
              >
                <Feather name="trash-2" size={20} color="#EF4444" />
                <Text style={[styles.actionText, { color: "#EF4444" }]}>Unsend</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>

      {/* Image Modal */}
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
            style={styles.fullImage}
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
    marginBottom: Spacing.xs,
  },
  containerOwn: {
    flexDirection: "row-reverse",
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  avatarSpacer: {
    width: 40,
  },
  bubbleWrapper: {
    maxWidth: "75%",
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bubbleOwn: {
    borderBottomRightRadius: BorderRadius.xs,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  bubbleReceived: {
    borderWidth: 1,
    borderBottomLeftRadius: BorderRadius.xs,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  deletedBubble: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  deletedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  deletedText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    ...Platform.select({
      ios: {
        fontFamily: "System",
        fontWeight: "400" as const,
      },
      android: {
        fontFamily: Fonts?.regular,
        fontWeight: "400" as const,
      },
      default: {
        fontWeight: "400" as const,
      },
    }),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  time: {
    fontSize: 11,
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
    ...Platform.select({
      ios: {
        fontFamily: "System",
        fontWeight: "400" as const,
      },
      android: {
        fontFamily: Fonts?.regular,
      },
      default: {},
    }),
  },
  statusContainer: {
    marginLeft: Spacing.xs,
  },
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  replyName: {
    fontSize: 12,
    fontWeight: "600",
  },
  replyText: {
    fontSize: 12,
    marginTop: 2,
  },
  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    minWidth: 180,
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 32,
  },
  voiceBar: {
    width: 3,
    borderRadius: 1.5,
  },
  voiceDuration: {
    fontSize: 11,
    minWidth: 70,
    textAlign: "right",
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
  },
  videoPlayOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: BorderRadius.md,
  },
  fileContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minWidth: 180,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  sticker: {
    width: 120,
    height: 120,
  },
  gif: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.md,
  },
  reactionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: -8,
    marginLeft: Spacing.sm,
  },
  reactionsContainerOwn: {
    marginLeft: 0,
    marginRight: Spacing.sm,
    justifyContent: "flex-end",
  },
  reactionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: "500",
  },
  reactionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  reactionPicker: {
    flexDirection: "row",
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  reactionPickerItem: {
    padding: Spacing.sm,
  },
  reactionPickerEmoji: {
    fontSize: 24,
  },
  messageActions: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  actionButton: {
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
});
