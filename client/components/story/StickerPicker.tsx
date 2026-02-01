import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius, Animation } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

export interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
  category: 'emotes' | 'reactions' | 'decorative' | 'text';
}

export interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: Sticker) => void;
}

const STICKER_DATA: Sticker[] = [
  { id: 'emote-1', name: 'Happy', imageUrl: '', category: 'emotes' },
  { id: 'emote-2', name: 'Sad', imageUrl: '', category: 'emotes' },
  { id: 'emote-3', name: 'Laughing', imageUrl: '', category: 'emotes' },
  { id: 'emote-4', name: 'Wink', imageUrl: '', category: 'emotes' },
  { id: 'emote-5', name: 'Cool', imageUrl: '', category: 'emotes' },
  { id: 'react-1', name: 'Like', imageUrl: '', category: 'reactions' },
  { id: 'react-2', name: 'Love', imageUrl: '', category: 'reactions' },
  { id: 'react-3', name: 'Wow', imageUrl: '', category: 'reactions' },
  { id: 'react-4', name: 'Fire', imageUrl: '', category: 'reactions' },
  { id: 'react-5', name: 'Clap', imageUrl: '', category: 'reactions' },
  { id: 'decor-1', name: 'Star', imageUrl: '', category: 'decorative' },
  { id: 'decor-2', name: 'Heart', imageUrl: '', category: 'decorative' },
  { id: 'decor-3', name: 'Sparkles', imageUrl: '', category: 'decorative' },
  { id: 'decor-4', name: 'Rainbow', imageUrl: '', category: 'decorative' },
  { id: 'decor-5', name: 'Crown', imageUrl: '', category: 'decorative' },
  { id: 'text-1', name: 'LOL', imageUrl: '', category: 'text' },
  { id: 'text-2', name: 'OMG', imageUrl: '', category: 'text' },
  { id: 'text-3', name: 'WOW', imageUrl: '', category: 'text' },
  { id: 'text-4', name: 'YOLO', imageUrl: '', category: 'text' },
  { id: 'text-5', name: 'BRB', imageUrl: '', category: 'text' },
];

const STICKER_ICONS: Record<string, string> = {
  'emote-1': '😊',
  'emote-2': '😢',
  'emote-3': '😂',
  'emote-4': '😉',
  'emote-5': '😎',
  'react-1': '👍',
  'react-2': '❤️',
  'react-3': '😮',
  'react-4': '🔥',
  'react-5': '👏',
  'decor-1': '⭐',
  'decor-2': '💖',
  'decor-3': '✨',
  'decor-4': '🌈',
  'decor-5': '👑',
  'text-1': 'LOL',
  'text-2': 'OMG',
  'text-3': 'WOW',
  'text-4': 'YOLO',
  'text-5': 'BRB',
};

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'emotes', name: 'Emotes' },
  { id: 'reactions', name: 'Reactions' },
  { id: 'decorative', name: 'Decorative' },
  { id: 'text', name: 'Text' },
];

export default function StickerPicker({
  visible,
  onClose,
  onSelectSticker,
}: StickerPickerProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, Animation.springBouncy);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(SCREEN_HEIGHT, Animation.spring);
    }
  }, [visible]);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SCREEN_HEIGHT, Animation.spring, () => {
      runOnJS(onClose)();
    });
  };

  const handleSelectSticker = (sticker: Sticker) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelectSticker(sticker);
    handleClose();
  };

  const filteredStickers = STICKER_DATA.filter((sticker) => {
    const matchesSearch = sticker.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || sticker.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const isTextSticker = (id: string) => id.startsWith('text-');

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            { height: SHEET_HEIGHT + insets.bottom },
            sheetStyle,
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <View
                style={[
                  styles.blurOverlay,
                  { backgroundColor: isDark ? 'rgba(20, 20, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)' },
                ]}
              />
            </BlurView>
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(20, 20, 30, 0.98)'
                    : 'rgba(255, 255, 255, 0.98)',
                },
              ]}
            />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Stickers</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark
                  ? 'rgba(139, 92, 246, 0.20)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Feather name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search stickers..."
              placeholderTextColor={theme.textTertiary}
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categories}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedCategory(category.id);
                }}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor:
                      selectedCategory === category.id
                        ? theme.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color:
                        selectedCategory === category.id
                          ? '#FFFFFF'
                          : theme.textSecondary,
                      fontWeight: selectedCategory === category.id ? '600' : '400',
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.stickerGrid}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: insets.bottom + Spacing.xl },
            ]}
          >
            <View style={styles.grid}>
              {filteredStickers.map((sticker) => (
                <Pressable
                  key={sticker.id}
                  onPress={() => handleSelectSticker(sticker)}
                  style={({ pressed }) => [
                    styles.stickerItem,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark
                        ? 'rgba(139, 92, 246, 0.15)'
                        : 'rgba(0, 0, 0, 0.05)',
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.stickerIconContainer,
                      {
                        backgroundColor: isTextSticker(sticker.id)
                          ? theme.primary + '20'
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        isTextSticker(sticker.id)
                          ? styles.textStickerIcon
                          : styles.emojiIcon,
                        isTextSticker(sticker.id) && { color: theme.primary },
                      ]}
                    >
                      {STICKER_ICONS[sticker.id]}
                    </Text>
                  </View>
                  <Text
                    style={[styles.stickerName, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {sticker.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {filteredStickers.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="search" size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No stickers found
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
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
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  categories: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: 14,
  },
  stickerGrid: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  gridContent: {
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  stickerItem: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  stickerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emojiIcon: {
    fontSize: 36,
  },
  textStickerIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  stickerName: {
    fontSize: 11,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyText: {
    fontSize: 16,
    marginTop: Spacing.md,
  },
});
