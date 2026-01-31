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
} from 'react-native';
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
import { Colors, Spacing } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { LoadingIndicator } from '@/components/animations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  previewUrl?: string;
  albumArt?: string;
  usageCount: number;
}

interface Props {
  onSelect: (track: MusicTrack, startTime: number, endTime: number) => void;
  onClose: () => void;
  maxClipDuration?: number;
}

const GENRES = ['Popular', 'Hip Hop', 'Pop', 'R&B', 'Electronic', 'Afrobeats', 'Jazz'];

export default function StoryMusicPicker({ onSelect, onClose, maxClipDuration = 15 }: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Popular');
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [clipStart, setClipStart] = useState(0);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackRotation = useSharedValue(0);

  const { data: tracks = [], isLoading } = useQuery<MusicTrack[]>({
    queryKey: ['/api/stories/music', selectedGenre, searchQuery],
    enabled: true,
  });

  const { data: featuredTracks = [] } = useQuery<MusicTrack[]>({
    queryKey: ['/api/stories/music/featured'],
  });

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

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

  const playPreview = async (track: MusicTrack) => {
    try {
      await stopPlayback();
      
      if (!track.previewUrl) return;
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.previewUrl },
        { shouldPlay: true, positionMillis: clipStart * 1000 }
      );
      
      soundRef.current = sound;
      setPlayingTrackId(track.id);
      
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingTrackId(null);
        }
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to play preview:', error);
    }
  };

  const handleTrackPress = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      stopPlayback();
    } else {
      playPreview(track);
    }
    setSelectedTrack(track);
    setClipStart(0);
  };

  const handleConfirm = () => {
    if (!selectedTrack) return;
    
    stopPlayback();
    onSelect(selectedTrack, clipStart, clipStart + maxClipDuration);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${playbackRotation.value}deg` }],
  }));

  const renderTrack = ({ item }: { item: MusicTrack }) => {
    const isPlaying = playingTrackId === item.id;
    const isSelected = selectedTrack?.id === item.id;
    
    return (
      <Pressable 
        onPress={() => handleTrackPress(item)}
        style={[styles.trackItem, isSelected && styles.trackItemSelected]}
      >
        <View style={styles.trackArt}>
          {item.albumArt ? (
            <Image source={{ uri: item.albumArt }} style={styles.albumArt} />
          ) : (
            <View style={styles.albumArtPlaceholder}>
              <Feather name="music" size={20} color={Colors.dark.textSecondary} />
            </View>
          )}
          {isPlaying ? (
            <Animated.View style={[styles.playingIndicator, discStyle]}>
              <View style={styles.playingDisc} />
            </Animated.View>
          ) : null}
        </View>
        
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
        </View>
        
        <View style={styles.trackMeta}>
          <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
          <Feather 
            name={isPlaying ? 'pause' : 'play'} 
            size={18} 
            color={Colors.dark.primary}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Music</Text>
        <Pressable 
          onPress={handleConfirm}
          style={[styles.confirmButton, !selectedTrack && styles.buttonDisabled]}
          disabled={!selectedTrack}
        >
          <Text style={styles.confirmText}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={Colors.dark.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs or artists..."
          placeholderTextColor={Colors.dark.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Feather name="x" size={18} color={Colors.dark.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.genreContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={GENRES}
          keyExtractor={item => item}
          contentContainerStyle={styles.genreList}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => setSelectedGenre(item)}
              style={[
                styles.genreChip,
                selectedGenre === item && styles.genreChipActive,
              ]}
            >
              <Text style={[
                styles.genreText,
                selectedGenre === item && styles.genreTextActive,
              ]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {featuredTracks.length > 0 && !searchQuery ? (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Trending</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={featuredTracks}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.featuredList}
            scrollIndicatorInsets={{ bottom: insets.bottom }}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => handleTrackPress(item)}
                style={styles.featuredItem}
              >
                <View style={styles.featuredArt}>
                  {item.albumArt ? (
                    <Image source={{ uri: item.albumArt }} style={styles.featuredAlbumArt} />
                  ) : (
                    <View style={[styles.albumArtPlaceholder, styles.featuredAlbumArt]}>
                      <Feather name="music" size={24} color={Colors.dark.textSecondary} />
                    </View>
                  )}
                </View>
                <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.featuredArtist} numberOfLines={1}>{item.artist}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      <View style={styles.trackListContainer}>
        <Text style={styles.sectionTitle}>Browse</Text>
        {isLoading ? (
          <LoadingIndicator size="large" style={styles.loader} />
        ) : (
          <FlatList
            data={tracks}
            keyExtractor={item => item.id.toString()}
            renderItem={renderTrack}
            contentContainerStyle={styles.trackList}
            showsVerticalScrollIndicator={false}
            scrollIndicatorInsets={{ bottom: insets.bottom }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="music" size={48} color={Colors.dark.textSecondary} />
                <Text style={styles.emptyText}>No music found</Text>
              </View>
            }
          />
        )}
      </View>

      {selectedTrack ? (
        <View style={styles.clipSelector}>
          <Text style={styles.clipLabel}>
            Clip: {formatDuration(clipStart)} - {formatDuration(clipStart + maxClipDuration)}
          </Text>
          <View style={styles.clipSlider}>
            <View style={styles.clipTrack}>
              <View 
                style={[
                  styles.clipRange,
                  { 
                    left: `${(clipStart / selectedTrack.duration) * 100}%`,
                    width: `${(maxClipDuration / selectedTrack.duration) * 100}%`,
                  },
                ]} 
              />
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  confirmButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark.text,
  },
  genreContainer: {
    marginTop: Spacing.md,
  },
  genreList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  genreChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: Spacing.xs,
  },
  genreChipActive: {
    backgroundColor: Colors.dark.primary,
  },
  genreText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  genreTextActive: {
    color: '#fff',
  },
  featuredSection: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  featuredList: {
    paddingHorizontal: Spacing.md,
  },
  featuredItem: {
    width: 120,
    marginRight: Spacing.md,
  },
  featuredArt: {
    marginBottom: Spacing.xs,
  },
  featuredAlbumArt: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  albumArtPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  featuredArtist: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  trackListContainer: {
    flex: 1,
    marginTop: Spacing.lg,
  },
  trackList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    marginBottom: Spacing.xs,
  },
  trackItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  trackArt: {
    position: 'relative',
    width: 50,
    height: 50,
    marginRight: Spacing.sm,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  playingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingDisc: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  trackMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  trackDuration: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  clipSelector: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  clipLabel: {
    fontSize: 14,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  clipSlider: {
    paddingHorizontal: Spacing.md,
  },
  clipTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  clipRange: {
    position: 'absolute',
    height: 4,
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
});
