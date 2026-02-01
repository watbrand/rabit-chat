import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Text, TextInput } from 'react-native';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

export type StickerType = 
  | 'POLL' | 'QUESTION' | 'SLIDER' | 'QUIZ' | 'COUNTDOWN' 
  | 'LOCATION' | 'TIME' | 'LINK' | 'MENTION' | 'HASHTAG' 
  | 'GIF' | 'SHOPPING' | 'TIP';

interface StickerOption {
  type: StickerType;
  icon: keyof typeof Feather.glyphMap;
  name: string;
  description: string;
  color: string;
  category: 'interactive' | 'info' | 'media' | 'monetization';
}

interface Props {
  onSelectSticker: (type: StickerType) => void;
  onClose: () => void;
}

const STICKERS: StickerOption[] = [
  { type: 'POLL', icon: 'bar-chart-2', name: 'Poll', description: 'Ask a question', color: '#8B5CF6', category: 'interactive' },
  { type: 'QUESTION', icon: 'help-circle', name: 'Question', description: 'Get answers', color: '#EC4899', category: 'interactive' },
  { type: 'SLIDER', icon: 'sliders', name: 'Slider', description: 'Rate something', color: '#F97316', category: 'interactive' },
  { type: 'QUIZ', icon: 'check-circle', name: 'Quiz', description: 'Test knowledge', color: '#22C55E', category: 'interactive' },
  { type: 'COUNTDOWN', icon: 'clock', name: 'Countdown', description: 'Count to event', color: '#3B82F6', category: 'interactive' },
  { type: 'LOCATION', icon: 'map-pin', name: 'Location', description: 'Add place', color: '#EF4444', category: 'info' },
  { type: 'TIME', icon: 'calendar', name: 'Time', description: 'Show date/time', color: '#14B8A6', category: 'info' },
  { type: 'LINK', icon: 'link', name: 'Link', description: 'Add URL', color: '#6366F1', category: 'info' },
  { type: 'MENTION', icon: 'at-sign', name: 'Mention', description: 'Tag someone', color: '#8B5CF6', category: 'info' },
  { type: 'HASHTAG', icon: 'hash', name: 'Hashtag', description: 'Add tag', color: '#EC4899', category: 'info' },
  { type: 'GIF', icon: 'image', name: 'GIF', description: 'Add animation', color: '#F59E0B', category: 'media' },
  { type: 'SHOPPING', icon: 'shopping-bag', name: 'Shopping', description: 'Link product', color: '#10B981', category: 'monetization' },
  { type: 'TIP', icon: 'dollar-sign', name: 'Tip Jar', description: 'Get tips', color: '#FFD700', category: 'monetization' },
];

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'interactive', name: 'Interactive' },
  { id: 'info', name: 'Info' },
  { id: 'media', name: 'Media' },
  { id: 'monetization', name: 'Earn' },
];

export default function StickerTray({ onSelectSticker, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredStickers = STICKERS.filter(sticker => {
    const matchesSearch = sticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sticker.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sticker.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (type: StickerType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSticker(type);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stickers</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={Colors.dark.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search stickers..."
          placeholderTextColor={Colors.dark.textTertiary}
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categories}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(category => (
          <Pressable
            key={category.id}
            onPress={() => setSelectedCategory(category.id)}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive,
            ]}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.stickerGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredStickers.map(sticker => (
            <Pressable
              key={sticker.type}
              onPress={() => handleSelect(sticker.type)}
              style={styles.stickerItem}
            >
              <View style={[styles.stickerIcon, { backgroundColor: sticker.color + '20' }]}>
                <Feather name={sticker.icon} size={24} color={sticker.color} />
              </View>
              <Text style={styles.stickerName}>{sticker.name}</Text>
              <Text style={styles.stickerDesc}>{sticker.description}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  categories: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: Spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  stickerGrid: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  stickerItem: {
    width: '30%',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  stickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stickerName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  stickerDesc: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
});
