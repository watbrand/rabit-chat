import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  TextInput,
  FlatList,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl } from '@/lib/query-client';

export interface MusicTrackData {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  previewUrl: string;
  fullUrl: string;
  coverUrl: string;
  isFeatured: boolean;
}

interface Props {
  visible: boolean;
  onSelect: (track: MusicTrackData, clipStart: number, clipEnd: number) => void;
  onClose: () => void;
}

const MAX_CLIP_DURATION = 15; // Maximum clip length in seconds

export default function MusicPickerModal({ visible, onSelect, onClose }: Props) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrackData | null>(null);
  const [clipStartTime, setClipStartTime] = useState(0);
  const [clipEndTime, setClipEndTime] = useState(MAX_CLIP_DURATION);

  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackRotation = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: musicTracks = [], isLoading: isLoadingMusic } = useQuery<MusicTrackData[]>({
    queryKey: ['/api/stories/music'],
    enabled: visible,
  });

  const { data: featuredTracks = [], isLoading: isLoadingFeatured } = useQuery<MusicTrackData[]>({
    queryKey: ['/api/stories/music/featured'],
    enabled: visible,
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery<MusicTrackData[]>({
    queryKey: ['/api/stories/music/search', { q: debouncedSearch }],
    enabled: visible && debouncedSearch.length > 0,
  });

  const displayTracks = debouncedSearch.length > 0 ? searchResults : musicTracks;

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      stopPlayback();
      setSelectedTrack(null);
      setSearchQuery('');
      setDebouncedSearch('');
      setClipStartTime(0);
      setClipEndTime(MAX_CLIP_DURATION);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedTrack) {
      const maxEnd = Math.min(selectedTrack.duration, MAX_CLIP_DURATION);
      setClipStartTime(0);
      setClipEndTime(maxEnd);
    }
  }, [selectedTrack?.id]);

  useEffect(() => {
    if (playingTrackId) {
      playbackRotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1
      );
    } else {
      playbackRotation.value = 0;
    }
  }, [playingTrackId, playbackRotation]);

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingTrackId(null);
  };

  const playPreview = async (track: MusicTrackData, startAtClip: boolean = false) => {
    try {
      await stopPlayback();

      if (!track.previewUrl) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        { shouldPlay: true, positionMillis: startAtClip ? clipStartTime * 1000 : 0 }
      );

      soundRef.current = sound;
      setPlayingTrackId(track.id);

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            setPlayingTrackId(null);
          }
          if (startAtClip && status.positionMillis >= clipEndTime * 1000) {
            sound.pauseAsync();
            setPlayingTrackId(null);
          }
        }
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to play preview:', error);
    }
  };

  const handleTrackPress = (track: MusicTrackData) => {
    if (playingTrackId === track.id) {
      stopPlayback();
    } else {
      playPreview(track);
    }
    setSelectedTrack(track);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirm = () => {
    if (!selectedTrack) return;

    console.log('[MusicPickerModal] Confirming selection:', selectedTrack.title, 'clip:', clipStartTime, '-', clipEndTime);
    stopPlayback();
    onSelect(selectedTrack, clipStartTime, clipEndTime);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClipStartChange = (value: number) => {
    const newStart = Math.max(0, Math.min(value, (selectedTrack?.duration || MAX_CLIP_DURATION) - 1));
    setClipStartTime(newStart);
    if (clipEndTime - newStart > MAX_CLIP_DURATION) {
      setClipEndTime(newStart + MAX_CLIP_DURATION);
    }
    if (clipEndTime <= newStart) {
      setClipEndTime(Math.min(newStart + MAX_CLIP_DURATION, selectedTrack?.duration || MAX_CLIP_DURATION));
    }
  };

  const handleClipEndChange = (value: number) => {
    const maxDuration = selectedTrack?.duration || MAX_CLIP_DURATION;
    const newEnd = Math.max(clipStartTime + 1, Math.min(value, maxDuration));
    if (newEnd - clipStartTime > MAX_CLIP_DURATION) {
      setClipStartTime(newEnd - MAX_CLIP_DURATION);
    }
    setClipEndTime(newEnd);
  };

  const playClipPreview = () => {
    if (selectedTrack) {
      playPreview(selectedTrack, true);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${playbackRotation.value}deg` }],
  }));

  const renderFeaturedTrack = ({ item }: { item: MusicTrackData }) => {
    const isPlaying = playingTrackId === item.id;
    const isSelected = selectedTrack?.id === item.id;

    return (
      <Pressable
        onPress={() => handleTrackPress(item)}
        style={[styles.featuredItem, isSelected && styles.featuredItemSelected]}
      >
        <View style={styles.featuredCover}>
          {item.coverUrl ? (
            <Image source={{ uri: item.coverUrl }} style={styles.featuredCoverImage} />
          ) : (
            <View style={[styles.coverPlaceholder, styles.featuredCoverImage]}>
              <Feather name="music" size={28} color={theme.textSecondary} />
            </View>
          )}
          {isPlaying ? (
            <Animated.View style={[styles.playingOverlay, discStyle]}>
              <View style={styles.playingDisc} />
            </Animated.View>
          ) : null}
        </View>
        <Text style={[styles.featuredTitle, { color: theme.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.featuredArtist, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
      </Pressable>
    );
  };

  const renderTrack = ({ item }: { item: MusicTrackData }) => {
    const isPlaying = playingTrackId === item.id;
    const isSelected = selectedTrack?.id === item.id;

    return (
      <Pressable
        onPress={() => handleTrackPress(item)}
        style={[
          styles.trackItem,
          { backgroundColor: isSelected ? theme.ambientPurple : 'transparent' },
        ]}
      >
        <View style={styles.trackCover}>
          {item.coverUrl ? (
            <Image source={{ uri: item.coverUrl }} style={styles.trackCoverImage} />
          ) : (
            <View style={[styles.coverPlaceholder, styles.trackCoverImage]}>
              <Feather name="music" size={18} color={theme.textSecondary} />
            </View>
          )}
          {isPlaying ? (
            <Animated.View style={[styles.playingOverlaySmall, discStyle]}>
              <View style={styles.playingDiscSmall} />
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.trackMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.artist} {item.album ? `• ${item.album}` : ''}
          </Text>
        </View>

        <View style={styles.trackActions}>
          <Text style={[styles.trackDuration, { color: theme.textSecondary }]}>
            {formatDuration(item.duration)}
          </Text>
          <Feather
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={24}
            color={isPlaying ? theme.primary : theme.textSecondary}
          />
        </View>
      </Pressable>
    );
  };

  const isLoading = isLoadingMusic || isLoadingFeatured || isSearching;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={onClose} style={[styles.headerButton, { backgroundColor: theme.glassBackground }]}>
            <Feather name="x" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Music</Text>
          <Pressable
            onPress={handleConfirm}
            style={[
              styles.confirmButton,
              { backgroundColor: theme.primary },
              !selectedTrack && styles.buttonDisabled,
            ]}
            disabled={!selectedTrack}
          >
            <Text style={styles.confirmText}>Add</Text>
          </Pressable>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search songs, artists, or albums..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {featuredTracks.length > 0 && debouncedSearch.length === 0 ? (
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredTracks}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.featuredList}
              renderItem={renderFeaturedTrack}
            />
          </View>
        ) : null}

        <View style={styles.tracksSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {debouncedSearch.length > 0 ? 'Search Results' : 'All Music'}
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : (
            <FlatList
              data={displayTracks}
              keyExtractor={(item) => item.id}
              renderItem={renderTrack}
              contentContainerStyle={styles.trackList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Feather name="music" size={48} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    {debouncedSearch.length > 0 ? 'No results found' : 'No music available'}
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {selectedTrack ? (
          <View style={[styles.selectionBar, { backgroundColor: theme.glassBackground, borderTopColor: theme.border }]}>
            <View style={styles.selectionBarRow}>
              <View style={styles.selectedTrackInfo}>
                {selectedTrack.coverUrl ? (
                  <Image source={{ uri: selectedTrack.coverUrl }} style={styles.selectedCover} />
                ) : (
                  <View style={[styles.coverPlaceholder, styles.selectedCover]}>
                    <Feather name="music" size={14} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.selectedTextContainer}>
                  <Text style={[styles.selectedTitle, { color: theme.text }]} numberOfLines={1}>
                    {selectedTrack.title}
                  </Text>
                  <Text style={[styles.selectedArtist, { color: theme.textSecondary }]} numberOfLines={1}>
                    {selectedTrack.artist}
                  </Text>
                </View>
              </View>
              <Text style={[styles.selectedDuration, { color: theme.primary }]}>
                {formatDuration(selectedTrack.duration)}
              </Text>
            </View>

            <View style={styles.clipSelectorContainer}>
              <View style={styles.clipSelectorHeader}>
                <Text style={[styles.clipSelectorLabel, { color: theme.text }]}>
                  Select clip ({formatDuration(clipEndTime - clipStartTime)})
                </Text>
                <Pressable onPress={playClipPreview} style={styles.clipPreviewButton}>
                  <Feather 
                    name={playingTrackId === selectedTrack.id ? "pause" : "play"} 
                    size={14} 
                    color={theme.primary} 
                  />
                  <Text style={[styles.clipPreviewText, { color: theme.primary }]}>Preview</Text>
                </Pressable>
              </View>
              
              <View style={styles.clipSliderContainer}>
                <View style={styles.clipTimesRow}>
                  <Text style={[styles.clipTimeText, { color: theme.textSecondary }]}>
                    {formatDuration(clipStartTime)}
                  </Text>
                  <Text style={[styles.clipTimeText, { color: theme.textSecondary }]}>
                    {formatDuration(clipEndTime)}
                  </Text>
                </View>
                <View style={[styles.clipTrack, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <View 
                    style={[
                      styles.clipRange, 
                      { 
                        backgroundColor: theme.primary,
                        left: `${(clipStartTime / selectedTrack.duration) * 100}%`,
                        right: `${100 - (clipEndTime / selectedTrack.duration) * 100}%`,
                      }
                    ]} 
                  />
                </View>
                <View style={styles.clipButtonsRow}>
                  <Pressable 
                    onPress={() => handleClipStartChange(Math.max(0, clipStartTime - 1))}
                    style={[styles.clipAdjustButton, { backgroundColor: theme.glassBackground }]}
                  >
                    <Feather name="minus" size={16} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.clipRangeLabel, { color: theme.text }]}>
                    Start: {formatDuration(clipStartTime)}
                  </Text>
                  <Pressable 
                    onPress={() => handleClipStartChange(clipStartTime + 1)}
                    style={[styles.clipAdjustButton, { backgroundColor: theme.glassBackground }]}
                  >
                    <Feather name="plus" size={16} color={theme.text} />
                  </Pressable>
                  
                  <View style={styles.clipSpacer} />
                  
                  <Pressable 
                    onPress={() => handleClipEndChange(clipEndTime - 1)}
                    style={[styles.clipAdjustButton, { backgroundColor: theme.glassBackground }]}
                  >
                    <Feather name="minus" size={16} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.clipRangeLabel, { color: theme.text }]}>
                    End: {formatDuration(clipEndTime)}
                  </Text>
                  <Pressable 
                    onPress={() => handleClipEndChange(Math.min(selectedTrack.duration, clipEndTime + 1))}
                    style={[styles.clipAdjustButton, { backgroundColor: theme.glassBackground }]}
                  >
                    <Feather name="plus" size={16} color={theme.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  confirmButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  featuredSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  featuredList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  featuredItem: {
    width: 140,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  featuredItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  featuredCover: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  featuredCoverImage: {
    width: 130,
    height: 130,
    borderRadius: BorderRadius.sm,
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: BorderRadius.sm,
  },
  playingDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    borderWidth: 3,
    borderColor: '#fff',
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuredArtist: {
    fontSize: 12,
    marginTop: 2,
  },
  tracksSection: {
    flex: 1,
    marginTop: Spacing.lg,
  },
  trackList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  trackCover: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  trackCoverImage: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xs,
  },
  playingOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: BorderRadius.xs,
  },
  playingDiscSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackMeta: {
    fontSize: 13,
  },
  trackActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  trackDuration: {
    fontSize: 12,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
  },
  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  selectionBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTrackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  selectedCover: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xs,
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedArtist: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  clipSelectorContainer: {
    width: '100%',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  clipSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clipSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  clipPreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clipPreviewText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clipSliderContainer: {
    width: '100%',
  },
  clipTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clipTimeText: {
    fontSize: 11,
  },
  clipTrack: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  clipRange: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  clipButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clipAdjustButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clipRangeLabel: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'center',
  },
  clipSpacer: {
    width: Spacing.md,
  },
});
