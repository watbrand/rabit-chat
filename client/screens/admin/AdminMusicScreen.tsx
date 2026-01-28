import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  duration: number;
  previewUrl?: string;
  fullUrl?: string;
  coverUrl?: string;
  isFeatured: boolean;
  usageCount: number;
  createdAt: string;
}

interface TrackFormData {
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: string;
  previewUrl: string;
  fullUrl: string;
  coverUrl: string;
  isFeatured: boolean;
}

const GENRE_OPTIONS = ["Pop", "Hip-Hop", "R&B", "Rock", "Electronic", "Jazz", "Classical", "Country", "Latin", "Afrobeats", "Other"];

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const parseDuration = (str: string): number => {
  const parts = str.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return (minutes * 60 + seconds) * 1000;
  }
  return parseInt(str) || 0;
};

export default function AdminMusicScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [genrePickerVisible, setGenrePickerVisible] = useState(false);
  
  const [formData, setFormData] = useState<TrackFormData>({
    title: "",
    artist: "",
    album: "",
    genre: "Pop",
    duration: "3:00",
    previewUrl: "",
    fullUrl: "",
    coverUrl: "",
    isFeatured: false,
  });

  const {
    data: tracks,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<MusicTrack[]>({
    queryKey: ["/api/stories/music"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/stories/music", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch music");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TrackFormData) => {
      return apiRequest("POST", "/api/admin/story-music", {
        title: data.title,
        artist: data.artist,
        album: data.album || undefined,
        genre: data.genre,
        duration: parseDuration(data.duration),
        previewUrl: data.previewUrl || undefined,
        audioUrl: data.fullUrl || data.previewUrl,
        albumArt: data.coverUrl || undefined,
        isFeatured: data.isFeatured,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/music"] });
      setModalVisible(false);
      resetForm();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Music track created successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to create music track");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TrackFormData }) => {
      return apiRequest("PATCH", `/api/admin/story-music/${id}`, {
        title: data.title,
        artist: data.artist,
        album: data.album || undefined,
        genre: data.genre,
        duration: parseDuration(data.duration),
        previewUrl: data.previewUrl || undefined,
        coverUrl: data.coverUrl || undefined,
        isFeatured: data.isFeatured,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/music"] });
      setModalVisible(false);
      resetForm();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Music track updated successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update music track");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/story-music/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/music"] });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Music track deleted successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to delete music track");
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      return apiRequest("POST", `/api/admin/story-music/${id}/feature`, { featured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories/music"] });
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onError: () => {
      Alert.alert("Error", "Failed to update featured status");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      artist: "",
      album: "",
      genre: "Pop",
      duration: "3:00",
      previewUrl: "",
      fullUrl: "",
      coverUrl: "",
      isFeatured: false,
    });
    setSelectedTrack(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = useCallback((track: MusicTrack) => {
    setSelectedTrack(track);
    setFormData({
      title: track.title,
      artist: track.artist,
      album: track.album || "",
      genre: track.genre,
      duration: formatDuration(track.duration),
      previewUrl: track.previewUrl || "",
      fullUrl: track.fullUrl || "",
      coverUrl: track.coverUrl || "",
      isFeatured: track.isFeatured,
    });
    setModalVisible(true);
  }, []);

  const handleSave = () => {
    if (!formData.title || !formData.artist) {
      Alert.alert("Error", "Title and artist are required");
      return;
    }

    if (selectedTrack) {
      updateMutation.mutate({ id: selectedTrack.id, data: formData });
    } else {
      if (!formData.fullUrl && !formData.previewUrl) {
        Alert.alert("Error", "Audio URL is required");
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (track: MusicTrack) => {
    Alert.alert(
      "Delete Track",
      `Are you sure you want to delete "${track.title}" by ${track.artist}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => deleteMutation.mutate(track.id) 
        },
      ]
    );
  };

  const handleToggleFeatured = (track: MusicTrack) => {
    toggleFeatureMutation.mutate({ id: track.id, featured: !track.isFeatured });
  };

  const filteredTracks = tracks?.filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTrackItem = ({ item }: { item: MusicTrack }) => (
    <Card elevation={1} style={styles.trackCard}>
      <Pressable 
        style={styles.trackContent}
        onPress={() => openEditModal(item)}
        testID={`track-row-${item.id}`}
      >
        <View style={[styles.coverContainer, { backgroundColor: theme.backgroundSecondary }]}>
          {item.coverUrl ? (
            <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
          ) : (
            <Feather name="music" size={24} color={theme.textSecondary} />
          )}
        </View>
        <View style={styles.trackInfo}>
          <View style={styles.trackHeader}>
            <ThemedText type="body" style={styles.trackTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            {item.isFeatured ? (
              <View style={[styles.featuredBadge, { backgroundColor: theme.goldLight }]}>
                <Feather name="star" size={10} color={theme.gold} />
                <ThemedText style={[styles.badgeText, { color: theme.gold }]}>Featured</ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={[styles.trackArtist, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.artist}
          </ThemedText>
          <View style={styles.trackMeta}>
            <View style={[styles.metaPill, { backgroundColor: theme.backgroundTertiary }]}>
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {item.genre}
              </ThemedText>
            </View>
            <ThemedText style={[styles.trackDuration, { color: theme.textSecondary }]}>
              {formatDuration(item.duration)}
            </ThemedText>
            <ThemedText style={[styles.usageCount, { color: theme.textTertiary }]}>
              {item.usageCount} uses
            </ThemedText>
          </View>
        </View>
      </Pressable>
      <View style={styles.trackActions}>
        <Pressable
          style={[styles.actionButton, { backgroundColor: item.isFeatured ? theme.goldLight : theme.backgroundSecondary }]}
          onPress={() => handleToggleFeatured(item)}
          testID={`toggle-featured-${item.id}`}
        >
          <Feather name="star" size={16} color={item.isFeatured ? theme.gold : theme.textSecondary} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => openEditModal(item)}
          testID={`edit-track-${item.id}`}
        >
          <Feather name="edit-2" size={16} color={theme.primary} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: theme.errorLight }]}
          onPress={() => handleDelete(item)}
          testID={`delete-track-${item.id}`}
        >
          <Feather name="trash-2" size={16} color={theme.error} />
        </Pressable>
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <View style={[styles.header, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.searchContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search tracks..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="search-input"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openCreateModal}
          testID="add-track-button"
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        renderItem={renderTrackItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="music" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText type="h4" style={styles.emptyTitle}>No music tracks</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Add your first track to the library
            </ThemedText>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={openCreateModal}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.emptyButtonText}>Add Track</ThemedText>
            </Pressable>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)}>
                <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
              </Pressable>
              <ThemedText type="h4">{selectedTrack ? "Edit Track" : "Add Track"}</ThemedText>
              <Pressable 
                onPress={handleSave} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <ThemedText style={{ color: theme.primary }}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
              <ThemedText style={styles.fieldLabel}>Title *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Track title"
                placeholderTextColor={theme.textSecondary}
                testID="input-title"
              />

              <ThemedText style={styles.fieldLabel}>Artist *</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={formData.artist}
                onChangeText={(text) => setFormData({ ...formData, artist: text })}
                placeholder="Artist name"
                placeholderTextColor={theme.textSecondary}
                testID="input-artist"
              />

              <ThemedText style={styles.fieldLabel}>Album</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={formData.album}
                onChangeText={(text) => setFormData({ ...formData, album: text })}
                placeholder="Album name"
                placeholderTextColor={theme.textSecondary}
                testID="input-album"
              />

              <ThemedText style={styles.fieldLabel}>Genre</ThemedText>
              <Pressable
                style={[styles.input, styles.pickerButton, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
                onPress={() => setGenrePickerVisible(true)}
              >
                <ThemedText style={{ color: theme.text }}>{formData.genre}</ThemedText>
                <Feather name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              <ThemedText style={styles.fieldLabel}>Duration (mm:ss)</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={formData.duration}
                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                placeholder="3:30"
                placeholderTextColor={theme.textSecondary}
                testID="input-duration"
              />

              <ThemedText style={styles.fieldLabel}>Preview URL</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={formData.previewUrl}
                onChangeText={(text) => setFormData({ ...formData, previewUrl: text })}
                placeholder="https://..."
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                testID="input-preview-url"
              />

              <ThemedText style={styles.fieldLabel}>Full Audio URL {selectedTrack ? "" : "*"}</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={formData.fullUrl}
                onChangeText={(text) => setFormData({ ...formData, fullUrl: text })}
                placeholder="https://..."
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                testID="input-full-url"
              />

              <ThemedText style={styles.fieldLabel}>Cover Image URL</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={formData.coverUrl}
                onChangeText={(text) => setFormData({ ...formData, coverUrl: text })}
                placeholder="https://..."
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
                testID="input-cover-url"
              />

              {formData.coverUrl ? (
                <View style={[styles.coverPreview, { backgroundColor: theme.backgroundSecondary }]}>
                  <Image source={{ uri: formData.coverUrl }} style={styles.coverPreviewImage} />
                </View>
              ) : null}

              <View style={styles.switchRow}>
                <ThemedText style={styles.switchLabel}>Featured Track</ThemedText>
                <Switch
                  value={formData.isFeatured}
                  onValueChange={(value) => setFormData({ ...formData, isFeatured: value })}
                  trackColor={{ false: theme.backgroundTertiary, true: theme.primaryLight }}
                  thumbColor={formData.isFeatured ? theme.primary : theme.textSecondary}
                  testID="switch-featured"
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={genrePickerVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setGenrePickerVisible(false)}
      >
        <Pressable 
          style={styles.pickerOverlay} 
          onPress={() => setGenrePickerVisible(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundElevated }]}>
            <ThemedText type="h4" style={styles.pickerTitle}>Select Genre</ThemedText>
            <ScrollView style={styles.pickerList}>
              {GENRE_OPTIONS.map((genre) => (
                <Pressable
                  key={genre}
                  style={[
                    styles.pickerOption,
                    formData.genre === genre && { backgroundColor: theme.primaryLight },
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, genre });
                    setGenrePickerVisible(false);
                  }}
                >
                  <ThemedText style={formData.genre === genre ? { color: theme.primary, fontWeight: "600" } : undefined}>
                    {genre}
                  </ThemedText>
                  {formData.genre === genre ? (
                    <Feather name="check" size={20} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  trackCard: {
    padding: Spacing.md,
  },
  trackContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  coverContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  trackInfo: {
    flex: 1,
  },
  trackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  trackTitle: {
    fontWeight: "600",
    flex: 1,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  trackArtist: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  trackMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  metaText: {
    fontSize: 11,
  },
  trackDuration: {
    fontSize: 12,
  },
  usageCount: {
    fontSize: 11,
  },
  trackActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  coverPreview: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    alignSelf: "center",
  },
  coverPreviewImage: {
    width: 120,
    height: 120,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  pickerContainer: {
    width: "100%",
    maxHeight: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  pickerTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
});
