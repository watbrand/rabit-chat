import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Haptics from "@/lib/safeHaptics";
import * as ImageManipulator from 'expo-image-manipulator';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, GlassStyles, Shadows, Gradients } from '@/constants/theme';

export type PhotoFilterName =
  | 'original'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'noir'
  | 'fade'
  | 'dramatic'
  | 'mono'
  | 'chrome'
  | 'clarendon';

interface ColorMatrix {
  matrix: number[];
  description: string;
}

export const FILTER_COLOR_MATRICES: Record<PhotoFilterName, ColorMatrix> = {
  original: {
    matrix: [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ],
    description: 'Identity matrix - no changes',
  },
  vivid: {
    matrix: [
      1.3, 0, 0, 0, 0,
      0, 1.3, 0, 0, 0,
      0, 0, 1.3, 0, 0,
      0, 0, 0, 1, 0,
    ],
    description: 'Increased saturation and vibrancy',
  },
  warm: {
    matrix: [
      1.2, 0.1, 0, 0, 0.05,
      0, 1.0, 0, 0, 0.02,
      0, 0, 0.9, 0, -0.02,
      0, 0, 0, 1, 0,
    ],
    description: 'Orange/yellow warm tint',
  },
  cool: {
    matrix: [
      0.9, 0, 0.1, 0, -0.02,
      0, 1.0, 0.1, 0, 0,
      0, 0.1, 1.2, 0, 0.05,
      0, 0, 0, 1, 0,
    ],
    description: 'Blue cool tint',
  },
  vintage: {
    matrix: [
      0.9, 0.2, 0.1, 0, 0.05,
      0.1, 0.8, 0.1, 0, 0.03,
      0.1, 0.1, 0.7, 0, 0.02,
      0, 0, 0, 1, 0,
    ],
    description: 'Faded warm sepia-like tones',
  },
  noir: {
    matrix: [
      0.4, 0.4, 0.2, 0, 0,
      0.3, 0.5, 0.2, 0, 0,
      0.2, 0.3, 0.5, 0, 0,
      0, 0, 0, 1, 0,
    ],
    description: 'High contrast black and white',
  },
  fade: {
    matrix: [
      1.0, 0.1, 0.1, 0, 0.08,
      0.1, 1.0, 0.1, 0, 0.08,
      0.1, 0.1, 1.0, 0, 0.08,
      0, 0, 0, 1, 0,
    ],
    description: 'Low contrast with lifted blacks',
  },
  dramatic: {
    matrix: [
      1.4, -0.1, -0.1, 0, -0.05,
      -0.1, 1.4, -0.1, 0, -0.05,
      -0.1, -0.1, 1.4, 0, -0.05,
      0, 0, 0, 1, 0,
    ],
    description: 'High contrast with deep shadows',
  },
  mono: {
    matrix: [
      0.33, 0.33, 0.33, 0, 0,
      0.33, 0.33, 0.33, 0, 0,
      0.33, 0.33, 0.33, 0, 0,
      0, 0, 0, 1, 0,
    ],
    description: 'Grayscale conversion',
  },
  chrome: {
    matrix: [
      1.1, 0, 0.2, 0, 0,
      0, 1.1, 0.1, 0, 0,
      0.1, 0.1, 1.3, 0, 0.03,
      0, 0, 0, 1, 0,
    ],
    description: 'Metallic cool highlights',
  },
  clarendon: {
    matrix: [
      1.3, 0, 0, 0, 0.02,
      0, 1.2, 0, 0, 0.01,
      0, 0, 1.4, 0, 0.03,
      0, 0, 0, 1, 0,
    ],
    description: 'Bright intense colors',
  },
};

interface FilterOption {
  id: PhotoFilterName;
  name: string;
  overlayColor: string;
  overlayOpacity: number;
}

const FILTERS: FilterOption[] = [
  { id: 'original', name: 'Original', overlayColor: 'transparent', overlayOpacity: 0 },
  { id: 'vivid', name: 'Vivid', overlayColor: 'rgba(139, 92, 246, 0.1)', overlayOpacity: 0.1 },
  { id: 'warm', name: 'Warm', overlayColor: 'rgba(255, 150, 80, 0.2)', overlayOpacity: 0.2 },
  { id: 'cool', name: 'Cool', overlayColor: 'rgba(80, 150, 255, 0.2)', overlayOpacity: 0.2 },
  { id: 'vintage', name: 'Vintage', overlayColor: 'rgba(200, 160, 100, 0.25)', overlayOpacity: 0.25 },
  { id: 'noir', name: 'Noir', overlayColor: 'rgba(0, 0, 0, 0.35)', overlayOpacity: 0.35 },
  { id: 'fade', name: 'Fade', overlayColor: 'rgba(255, 255, 255, 0.2)', overlayOpacity: 0.2 },
  { id: 'dramatic', name: 'Dramatic', overlayColor: 'rgba(20, 20, 40, 0.25)', overlayOpacity: 0.25 },
  { id: 'mono', name: 'Mono', overlayColor: 'rgba(128, 128, 128, 0.4)', overlayOpacity: 0.4 },
  { id: 'chrome', name: 'Chrome', overlayColor: 'rgba(180, 200, 220, 0.15)', overlayOpacity: 0.15 },
  { id: 'clarendon', name: 'Clarendon', overlayColor: 'rgba(100, 120, 200, 0.12)', overlayOpacity: 0.12 },
];

interface PhotoFilterPickerProps {
  imageUri: string;
  selectedFilter: string;
  onFilterSelect: (filterName: string) => void;
}

export async function applyFilter(uri: string, filterName: string): Promise<string> {
  if (filterName === 'original' || !uri) {
    return uri;
  }

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.warn('Failed to apply filter:', error);
    return uri;
  }
}

export function getFilterOverlay(filterName: string): { color: string; opacity: number } {
  const filter = FILTERS.find(f => f.id === filterName);
  return {
    color: filter?.overlayColor || 'transparent',
    opacity: filter?.overlayOpacity || 0,
  };
}

export function PhotoFilterPicker({
  imageUri,
  selectedFilter,
  onFilterSelect,
}: PhotoFilterPickerProps) {
  const { theme, isDark } = useTheme();

  const handleSelect = (filterId: PhotoFilterName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFilterSelect(filterId);
  };

  const glassStyle = isDark ? GlassStyles.dark.card : GlassStyles.light.card;

  const renderFilterItem = (filter: FilterOption) => {
    const isSelected = selectedFilter === filter.id;

    return (
      <Pressable
        key={filter.id}
        onPress={() => handleSelect(filter.id)}
        style={styles.filterItem}
      >
        <View
          style={[
            styles.thumbnailWrapper,
            isSelected && styles.selectedWrapper,
            isSelected && { borderColor: theme.primary },
          ]}
        >
          {isSelected ? (
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectedRing}
            >
              <View style={[styles.thumbnailInner, { backgroundColor: theme.backgroundRoot }]}>
                <View style={styles.thumbnailContainer}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: theme.backgroundSecondary }]}>
                      <Feather name="image" size={20} color={theme.textTertiary} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.filterOverlay,
                      { backgroundColor: filter.overlayColor },
                    ]}
                  />
                </View>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.thumbnailContainer}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="image" size={20} color={theme.textTertiary} />
                </View>
              )}
              <View
                style={[
                  styles.filterOverlay,
                  { backgroundColor: filter.overlayColor },
                ]}
              />
            </View>
          )}
          {isSelected ? (
            <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={10} color="#FFFFFF" />
            </View>
          ) : null}
        </View>
        <ThemedText
          type="caption1"
          style={[
            styles.filterName,
            { color: isSelected ? theme.primary : theme.textSecondary },
            isSelected && styles.selectedName,
          ]}
        >
          {filter.name}
        </ThemedText>
      </Pressable>
    );
  };

  const containerContent = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {FILTERS.map(renderFilterItem)}
    </ScrollView>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={isDark ? 45 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.container, glassStyle]}
      >
        {containerContent}
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, glassStyle]}>
      {containerContent}
    </View>
  );
}

const THUMBNAIL_SIZE = 72;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterItem: {
    alignItems: 'center',
    width: THUMBNAIL_SIZE + 8,
  },
  thumbnailWrapper: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWrapper: {
    borderWidth: 0,
  },
  selectedRing: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  thumbnailInner: {
    flex: 1,
    borderRadius: BorderRadius.md - 2,
    overflow: 'hidden',
    padding: 1,
  },
  thumbnailContainer: {
    flex: 1,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterName: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  selectedName: {
    fontWeight: '600',
  },
});

export default PhotoFilterPicker;
