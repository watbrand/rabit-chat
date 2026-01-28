import React from "react";
import { View, StyleSheet, Modal, Pressable, Share, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  qrData: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export function QRCodeModal({ visible, onClose, qrData, username, displayName, avatarUrl }: QRCodeModalProps) {
  const { theme } = useTheme();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my RabitChat profile: ${qrData}`,
        url: qrData,
      });
    } catch (error) {
      // Share cancelled or failed - no action needed
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(qrData);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable 
          style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <ThemedText type="h3" style={{ color: theme.text }}>
              Share Profile
            </ThemedText>
            <Pressable onPress={onClose} testID="button-close-qr">
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.profileSection}>
            <Avatar uri={avatarUrl} size={64} />
            <ThemedText type="h4" style={{ color: theme.text, marginTop: Spacing.sm }}>
              {displayName}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              @{username}
            </ThemedText>
          </View>

          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.qrContainer}
          >
            <View style={styles.qrPlaceholder}>
              <Feather name="grid" size={120} color="#FFF" />
              <ThemedText style={styles.qrHint}>
                QR Code
              </ThemedText>
            </View>
          </LinearGradient>

          <ThemedText style={[styles.urlText, { color: theme.textSecondary }]} numberOfLines={1}>
            {qrData}
          </ThemedText>

          <View style={styles.actions}>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
              onPress={handleCopy}
              testID="button-copy-link"
            >
              <Feather name="copy" size={18} color={theme.text} />
              <ThemedText style={{ color: theme.text, marginLeft: Spacing.xs }}>Copy Link</ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleShare}
              testID="button-share-qr"
            >
              <Feather name="share" size={18} color="#FFF" />
              <ThemedText style={{ color: "#FFF", marginLeft: Spacing.xs }}>Share</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: Spacing.lg,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  qrContainer: {
    width: 180,
    height: 180,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  qrPlaceholder: {
    alignItems: "center",
  },
  qrHint: {
    color: "#FFF",
    fontSize: 12,
    marginTop: Spacing.xs,
    opacity: 0.8,
  },
  urlText: {
    fontSize: 12,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
});