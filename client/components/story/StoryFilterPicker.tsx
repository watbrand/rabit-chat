import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Text, Image } from 'react-native';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

export type FilterType = 
  | 'NONE' | 'VIVID' | 'DRAMATIC' | 'MONO' | 'NOIR' | 'VINTAGE' | 'WARM' | 'COOL' 
  | 'FADE' | 'CHROME' | 'PROCESS' | 'TRANSFER' | 'INSTANT' | 'GOLD' | 'DIAMOND' | 'PLATINUM';

interface FilterOption {
  id: FilterType;
  name: string;
  style: object;
  premium?: boolean;
}

interface Props {
  selectedFilter: FilterType;
  onFilterSelect: (filter: FilterType) => void;
  previewImage?: string;
}

const FILTERS: FilterOption[] = [
  { id: 'NONE', name: 'Original', style: {} },
  { id: 'VIVID', name: 'Vivid', style: { saturate: 1.4, contrast: 1.1 } },
  { id: 'DRAMATIC', name: 'Dramatic', style: { contrast: 1.3, saturate: 0.8 } },
  { id: 'MONO', name: 'Mono', style: { grayscale: 1 } },
  { id: 'NOIR', name: 'Noir', style: { grayscale: 1, contrast: 1.3 } },
  { id: 'VINTAGE', name: 'Vintage', style: { sepia: 0.5, contrast: 0.9 } },
  { id: 'WARM', name: 'Warm', style: { hueRotate: -15 } },
  { id: 'COOL', name: 'Cool', style: { hueRotate: 15 } },
  { id: 'FADE', name: 'Fade', style: { contrast: 0.85, brightness: 1.1 } },
  { id: 'CHROME', name: 'Chrome', style: { contrast: 1.2, saturate: 1.3 } },
  { id: 'PROCESS', name: 'Process', style: { hueRotate: 30, saturate: 0.9 } },
  { id: 'TRANSFER', name: 'Transfer', style: { sepia: 0.3, contrast: 1.1 } },
  { id: 'INSTANT', name: 'Instant', style: { contrast: 0.9, saturate: 1.1 } },
  { id: 'GOLD', name: 'Gold', style: { sepia: 0.4 }, premium: true },
  { id: 'DIAMOND', name: 'Diamond', style: { brightness: 1.2, contrast: 1.1 }, premium: true },
  { id: 'PLATINUM', name: 'Platinum', style: { grayscale: 0.3, contrast: 1.15 }, premium: true },
];

export function getFilterStyle(filter: FilterType): object {
  const filterOption = FILTERS.find(f => f.id === filter);
  return filterOption?.style || {};
}

export default function StoryFilterPicker({ selectedFilter, onFilterSelect, previewImage }: Props) {
  const handleSelect = (filter: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFilterSelect(filter);
  };

  const getOverlayColor = (filter: FilterOption): string => {
    if (filter.id === 'MONO' || filter.id === 'NOIR') return 'rgba(0, 0, 0, 0.3)';
    if (filter.id === 'VINTAGE') return 'rgba(255, 200, 150, 0.2)';
    if (filter.id === 'WARM') return 'rgba(255, 150, 100, 0.15)';
    if (filter.id === 'COOL') return 'rgba(100, 150, 255, 0.15)';
    if (filter.id === 'GOLD') return 'rgba(255, 215, 0, 0.25)';
    if (filter.id === 'DIAMOND') return 'rgba(200, 220, 255, 0.2)';
    if (filter.id === 'PLATINUM') return 'rgba(200, 200, 200, 0.2)';
    return 'transparent';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Filters</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => handleSelect(filter.id)}
            style={[
              styles.filterItem,
              selectedFilter === filter.id && styles.selectedItem,
            ]}
          >
            <View style={styles.filterPreview}>
              {previewImage ? (
                <Image 
                  source={{ uri: previewImage }} 
                  style={styles.previewImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage} />
              )}
              <View style={[styles.filterOverlay, { backgroundColor: getOverlayColor(filter) }]} />
              {filter.premium && (
                <View style={styles.premiumBadge}>
                  <Feather name="star" size={8} color="#FFD700" />
                </View>
              )}
            </View>
            <Text style={[
              styles.filterName,
              selectedFilter === filter.id && styles.selectedName,
            ]}>
              {filter.name}
            </Text>
            {selectedFilter === filter.id && (
              <View style={styles.checkmark}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterItem: {
    alignItems: 'center',
    marginRight: Spacing.sm,
    position: 'relative',
  },
  selectedItem: {
    transform: [{ scale: 1.05 }],
  },
  filterPreview: {
    width: 70,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 2,
  },
  filterName: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  selectedName: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
