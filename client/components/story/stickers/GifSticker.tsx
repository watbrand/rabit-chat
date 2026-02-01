import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, FlatList, Image, Dimensions } from 'react-native';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GifItem {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

interface Props {
  gifUrl?: string;
  isEditing?: boolean;
  onSelect?: (gif: GifItem) => void;
  onPress?: () => void;
}

const TRENDING_TERMS = ['reaction', 'happy', 'love', 'funny', 'celebrate', 'wow'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GIF_SIZE = (SCREEN_WIDTH - Spacing.md * 3) / 2;

const MOCK_GIFS: GifItem[] = [
  { id: '1', url: '', previewUrl: '', width: 200, height: 150 },
  { id: '2', url: '', previewUrl: '', width: 200, height: 200 },
  { id: '3', url: '', previewUrl: '', width: 200, height: 180 },
  { id: '4', url: '', previewUrl: '', width: 200, height: 160 },
];

export default function GifSticker({
  gifUrl,
  isEditing = false,
  onSelect,
  onPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifItem[]>(MOCK_GIFS);
  const [isLoading, setIsLoading] = useState(false);

  const searchGifs = async (query: string) => {
    setIsLoading(true);
    setGifs(MOCK_GIFS);
    setIsLoading(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      searchGifs(query);
    }
  };

  const handleSelect = (gif: GifItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect?.(gif);
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Add GIF</Text>
          <Text style={styles.poweredBy}>Powered by GIPHY</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={Colors.dark.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search GIFs..."
            placeholderTextColor={Colors.dark.textSecondary}
            autoFocus
          />
          {searchQuery ? (
            <Pressable onPress={() => handleSearch('')}>
              <Feather name="x" size={18} color={Colors.dark.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        
        {!searchQuery ? (
          <View style={styles.trendingContainer}>
            <Text style={styles.trendingLabel}>Trending searches</Text>
            <View style={styles.trendingChips}>
              {TRENDING_TERMS.map((term) => (
                <Pressable 
                  key={term}
                  onPress={() => handleSearch(term)}
                  style={styles.trendingChip}
                >
                  <Text style={styles.trendingText}>{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        
        <FlatList
          data={gifs}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.gifGrid}
          columnWrapperStyle={styles.gifRow}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => handleSelect(item)}
              style={styles.gifItem}
            >
              {item.previewUrl ? (
                <Image 
                  source={{ uri: item.previewUrl }} 
                  style={styles.gifImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.gifPlaceholder}>
                  <Feather name="image" size={24} color={Colors.dark.textSecondary} />
                  <Text style={styles.placeholderText}>GIF</Text>
                </View>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            isLoading ? null : (
              <View style={styles.emptyState}>
                <Feather name="image" size={48} color={Colors.dark.textSecondary} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No GIFs found' : 'Search for GIFs'}
                </Text>
              </View>
            )
          }
        />
      </View>
    );
  }

  if (!gifUrl) return null;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Image 
        source={{ uri: gifUrl }} 
        style={styles.displayGif}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  displayGif: {
    width: 150,
    height: 150,
    borderRadius: 12,
  },
  editContainer: {
    backgroundColor: Colors.dark.backgroundRoot,
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  poweredBy: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  trendingContainer: {
    marginBottom: Spacing.md,
  },
  trendingLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  trendingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  trendingChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trendingText: {
    fontSize: 13,
    color: '#fff',
  },
  gifGrid: {
    paddingBottom: 100,
  },
  gifRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  gifItem: {
    width: GIF_SIZE,
    height: GIF_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  gifPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
});
