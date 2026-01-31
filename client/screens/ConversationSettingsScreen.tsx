import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Switch,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import BottomSheet, { BottomSheetRef } from "@/components/BottomSheet";
import { ReportModal } from "@/components/ReportModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MEDIA_ITEM_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3;

type ConversationSettingsParams = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
};

interface ConversationSettings {
  isMuted: boolean;
  mutedUntil: string | null;
  isPinned: boolean;
  isArchived: boolean;
  notificationSound: string;
  customName: string | null;
}

interface MediaItem {
  id: string;
  url: string;
  type: "photo" | "video" | "file";
  createdAt: string;
}

const MUTE_DURATIONS = [
  { label: "1 hour", value: "1hour" },
  { label: "8 hours", value: "8hours" },
  { label: "1 day", value: "1day" },
  { label: "1 week", value: "1week" },
  { label: "Forever", value: "forever" },
];

const NOTIFICATION_SOUNDS = [
  { label: "Default", value: "default" },
  { label: "Chime", value: "chime" },
  { label: "Bell", value: "bell" },
  { label: "Ping", value: "ping" },
  { label: "Silent", value: "silent" },
];

export default function ConversationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ ConversationSettings: ConversationSettingsParams }, "ConversationSettings">>();
  const queryClient = useQueryClient();

  const { conversationId, otherUserId, otherUserName, otherUserAvatar } = route.params;

  const [customName, setCustomName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const muteDurationSheetRef = useRef<BottomSheetRef>(null);
  const notificationSoundSheetRef = useRef<BottomSheetRef>(null);

  const { data: settings, isLoading: settingsLoading } = useQuery<ConversationSettings>({
    queryKey: [`/api/conversations/${conversationId}/settings`],
  });

  const { data: otherUser } = useQuery<any>({
    queryKey: [`/api/users/${otherUserId}`],
    enabled: !!otherUserId,
  });

  const { data: sharedMedia } = useQuery<MediaItem[]>({
    queryKey: [`/api/conversations/${conversationId}/media`],
    queryFn: async () => {
      const res = await fetch(
        new URL(`/api/conversations/${conversationId}/media`, getApiUrl()),
        { credentials: "include" }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  React.useEffect(() => {
    if (settings?.customName) {
      setCustomName(settings.customName);
    }
  }, [settings?.customName]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<ConversationSettings>) => {
      const res = await apiRequest("PATCH", `/api/conversations/${conversationId}/settings`, updates);
      return res.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/settings`] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update settings");
    },
  });

  const muteMutation = useMutation({
    mutationFn: async (duration: string) => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/mute`, { duration });
      return res.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/settings`] });
      muteDurationSheetRef.current?.close();
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to mute conversation");
    },
  });

  const unmuteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/unmute`, {});
      return res.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/settings`] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to unmute conversation");
    },
  });

  const pinMutation = useMutation({
    mutationFn: async (isPinned: boolean) => {
      const endpoint = isPinned
        ? `/api/conversations/${conversationId}/pin`
        : `/api/conversations/${conversationId}/unpin`;
      const res = await apiRequest("POST", endpoint, {});
      return res.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/settings`] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update pin status");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (isArchived: boolean) => {
      const endpoint = isArchived
        ? `/api/conversations/${conversationId}/archive`
        : `/api/conversations/${conversationId}/unarchive`;
      const res = await apiRequest("POST", endpoint, {});
      return res.json();
    },
    onSuccess: (_, isArchived) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/settings`] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (isArchived) {
        Alert.alert("Archived", "Conversation has been archived");
        navigation.goBack();
      }
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to archive conversation");
    },
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/users/${otherUserId}/block`, {});
      return res.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Blocked", "User has been blocked");
      navigation.goBack();
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to block user");
    },
  });

  const handleMuteToggle = useCallback((value: boolean) => {
    if (value) {
      muteDurationSheetRef.current?.open();
    } else {
      unmuteMutation.mutate();
    }
  }, []);

  const handleMuteDurationSelect = useCallback((duration: string) => {
    muteMutation.mutate(duration);
  }, []);

  const handleNotificationSoundSelect = useCallback((sound: string) => {
    updateSettingsMutation.mutate({ notificationSound: sound });
    notificationSoundSheetRef.current?.close();
  }, []);

  const handleSaveCustomName = useCallback(() => {
    updateSettingsMutation.mutate({ customName: customName.trim() || null });
    setIsEditingName(false);
  }, [customName]);

  const handlePinToggle = useCallback((value: boolean) => {
    pinMutation.mutate(value);
  }, []);

  const handleArchive = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Archive Conversation",
      "This will move the conversation to your archives. You can unarchive it later from archived messages.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            archiveMutation.mutate(true);
          },
        },
      ]
    );
  }, []);

  const handleBlock = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${otherUserName}?\n\nThey will:\n• Not be able to message you\n• Not see your profile or posts\n• Not be notified that they are blocked\n\nYou can unblock them later from settings.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            blockMutation.mutate();
          },
        },
      ]
    );
  }, [otherUserName]);

  const formatMutedUntil = (dateString: string | null) => {
    if (!dateString) return "Forever";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours}h remaining`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d remaining`;
  };

  const displayName = settings?.customName || otherUserName || otherUser?.displayName || "User";

  const SettingsRow = ({
    icon,
    label,
    description,
    onPress,
    isDestructive,
    rightElement,
    showChevron = true,
    disabled = false,
  }: {
    icon: string;
    label: string;
    description?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
    disabled?: boolean;
  }) => (
    <Pressable
      style={[
        styles.settingsRow,
        { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
        disabled && { opacity: 0.5 },
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isDestructive ? theme.error + "20" : theme.primary + "20" },
        ]}
      >
        <Feather
          name={icon as any}
          size={18}
          color={isDestructive ? theme.error : theme.primary}
        />
      </View>
      <View style={styles.labelContainer}>
        <ThemedText
          style={[
            styles.settingsLabel,
            isDestructive && { color: theme.error },
          ]}
        >
          {label}
        </ThemedText>
        {description ? (
          <ThemedText style={[styles.settingsDescription, { color: theme.textSecondary }]}>
            {description}
          </ThemedText>
        ) : null}
      </View>
      {rightElement ? rightElement : showChevron && onPress ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <Pressable
      style={[styles.mediaItem, { backgroundColor: theme.backgroundSecondary }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.mediaImage}
        contentFit="cover"
      />
      {item.type === "video" ? (
        <View style={styles.videoOverlay}>
          <Feather name="play" size={24} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );

  if (settingsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <View style={styles.headerSection}>
          <Avatar
            uri={otherUserAvatar || otherUser?.avatarUrl}
            size={80}
            glowEffect
          />
          <ThemedText style={styles.displayName}>{displayName}</ThemedText>
          {otherUser?.username ? (
            <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
              @{otherUser.username}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Notifications
          </ThemedText>
          <View style={styles.sectionContent}>
            <SettingsRow
              icon="bell-off"
              label="Mute Notifications"
              description={settings?.isMuted ? formatMutedUntil(settings.mutedUntil) : "Off"}
              showChevron={false}
              rightElement={
                <Switch
                  value={settings?.isMuted ?? false}
                  onValueChange={handleMuteToggle}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={settings?.isMuted ? theme.primaryLight : "#FFFFFF"}
                />
              }
            />
            <View style={{ height: Spacing.sm }} />
            <SettingsRow
              icon="volume-2"
              label="Notification Sound"
              description={NOTIFICATION_SOUNDS.find(s => s.value === settings?.notificationSound)?.label || "Default"}
              onPress={() => notificationSoundSheetRef.current?.open()}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Customization
          </ThemedText>
          <View style={styles.sectionContent}>
            <View
              style={[
                styles.settingsRow,
                { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Feather name="edit-2" size={18} color={theme.primary} />
              </View>
              <View style={styles.labelContainer}>
                <ThemedText style={styles.settingsLabel}>
                  Custom Name
                </ThemedText>
                {isEditingName ? (
                  <TextInput
                    style={[styles.customNameInput, { color: theme.text, borderColor: theme.glassBorder }]}
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder="Enter custom name..."
                    placeholderTextColor={theme.textSecondary}
                    autoFocus
                    onBlur={handleSaveCustomName}
                    onSubmitEditing={handleSaveCustomName}
                  />
                ) : (
                  <ThemedText style={[styles.settingsDescription, { color: theme.textSecondary }]}>
                    {settings?.customName || "Set a nickname for this chat"}
                  </ThemedText>
                )}
              </View>
              {!isEditingName ? (
                <Pressable
                  onPress={() => setIsEditingName(true)}
                  hitSlop={8}
                >
                  <Feather name="edit" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : (
                <Pressable onPress={handleSaveCustomName} hitSlop={8}>
                  <Feather name="check" size={18} color={theme.success} />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Actions
          </ThemedText>
          <View style={styles.sectionContent}>
            <SettingsRow
              icon="pin"
              label={settings?.isPinned ? "Unpin Conversation" : "Pin Conversation"}
              description={settings?.isPinned ? "Pinned to top" : "Keep at top of your chats"}
              showChevron={false}
              rightElement={
                <Switch
                  value={settings?.isPinned ?? false}
                  onValueChange={handlePinToggle}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={settings?.isPinned ? theme.primaryLight : "#FFFFFF"}
                />
              }
            />
            <View style={{ height: Spacing.sm }} />
            <SettingsRow
              icon="archive"
              label="Archive Conversation"
              description="Move to archived chats"
              onPress={handleArchive}
            />
            <View style={{ height: Spacing.sm }} />
            <SettingsRow
              icon="user-x"
              label="Block User"
              description={`Block ${otherUserName}`}
              onPress={handleBlock}
              isDestructive
            />
            <View style={{ height: Spacing.sm }} />
            <SettingsRow
              icon="flag"
              label="Report Conversation"
              description="Report inappropriate content"
              onPress={() => setShowReportModal(true)}
              isDestructive
            />
          </View>
        </View>

        {sharedMedia && sharedMedia.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.mediaSectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Shared Media
              </ThemedText>
              <ThemedText style={[styles.mediaCount, { color: theme.textSecondary }]}>
                {sharedMedia.length} items
              </ThemedText>
            </View>
            <View style={styles.mediaGrid}>
              {sharedMedia.slice(0, 9).map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.mediaItem, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={styles.mediaImage}
                    contentFit="cover"
                  />
                  {item.type === "video" ? (
                    <View style={styles.videoOverlay}>
                      <Feather name="play" size={24} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
            {sharedMedia.length > 9 ? (
              <Pressable
                style={[styles.viewAllButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <ThemedText style={[styles.viewAllText, { color: theme.primary }]}>
                  View All Media ({sharedMedia.length})
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </KeyboardAwareScrollViewCompat>

      <BottomSheet
        ref={muteDurationSheetRef}
        title="Mute Duration"
        snapPoints={[0.4]}
      >
        <View style={styles.sheetContent}>
          {MUTE_DURATIONS.map((duration) => (
            <Pressable
              key={duration.value}
              style={[
                styles.sheetOption,
                { backgroundColor: theme.backgroundSecondary },
              ]}
              onPress={() => handleMuteDurationSelect(duration.value)}
            >
              <ThemedText style={styles.sheetOptionText}>
                {duration.label}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        ref={notificationSoundSheetRef}
        title="Notification Sound"
        snapPoints={[0.45]}
      >
        <View style={styles.sheetContent}>
          {NOTIFICATION_SOUNDS.map((sound) => (
            <Pressable
              key={sound.value}
              style={[
                styles.sheetOption,
                { backgroundColor: theme.backgroundSecondary },
                settings?.notificationSound === sound.value && {
                  borderColor: theme.primary,
                  borderWidth: 1,
                },
              ]}
              onPress={() => handleNotificationSoundSelect(sound.value)}
            >
              <ThemedText style={styles.sheetOptionText}>
                {sound.label}
              </ThemedText>
              {settings?.notificationSound === sound.value ? (
                <Feather name="check" size={20} color={theme.primary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      <ReportModal
        isVisible={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportType="user"
        targetId={otherUserId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  displayName: {
    fontSize: Typography.title2.fontSize,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  username: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  labelContainer: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
  settingsDescription: {
    fontSize: Typography.footnote.fontSize,
    marginTop: 2,
  },
  customNameInput: {
    fontSize: Typography.footnote.fontSize,
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
  },
  mediaSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  mediaCount: {
    fontSize: Typography.footnote.fontSize,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  mediaItem: {
    width: MEDIA_ITEM_SIZE,
    height: MEDIA_ITEM_SIZE,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  viewAllText: {
    fontWeight: "600",
  },
  sheetContent: {
    gap: Spacing.sm,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  sheetOptionText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
});
