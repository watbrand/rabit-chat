import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  SafeAreaView,
  Pressable,
  FlatList,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Gradients } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';

interface StoryTemplate {
  id: number;
  name: string;
  category: string;
  thumbnailUrl?: string;
  data: {
    colors?: { background: string; textColor?: string };
    font?: string;
    animation?: string;
    stickers?: any[];
  };
  usageCount: number;
}

interface Props {
  onClose: () => void;
  onSelectTemplate: (template: StoryTemplate) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 3) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

const CATEGORIES = ['All', 'Celebration', 'Question', 'Quote', 'Countdown', 'Promo', 'Minimal'];

const DEFAULT_TEMPLATES: StoryTemplate[] = [
  {
    id: 1,
    name: 'Birthday Celebration',
    category: 'Celebration',
    data: {
      colors: { background: '#EC4899,#8B5CF6', textColor: '#FFFFFF' },
      font: 'bold',
      animation: 'confetti',
      stickers: [{ type: 'emoji', value: 'party' }],
    },
    usageCount: 2458,
  },
  {
    id: 2,
    name: 'Ask Me Anything',
    category: 'Question',
    data: {
      colors: { background: '#8B5CF6,#6366F1', textColor: '#FFFFFF' },
      font: 'modern',
      animation: 'pulse',
      stickers: [{ type: 'question', value: 'Ask me a question...' }],
    },
    usageCount: 1892,
  },
  {
    id: 3,
    name: 'Daily Poll',
    category: 'Question',
    data: {
      colors: { background: '#14B8A6,#06B6D4', textColor: '#FFFFFF' },
      font: 'clean',
      animation: 'slide',
      stickers: [{ type: 'poll', value: { question: 'Which one?', options: ['Option A', 'Option B'] } }],
    },
    usageCount: 1567,
  },
  {
    id: 4,
    name: 'Inspirational Quote',
    category: 'Quote',
    data: {
      colors: { background: '#1E1B4B,#312E81', textColor: '#FFFFFF' },
      font: 'serif',
      animation: 'fade',
    },
    usageCount: 3241,
  },
  {
    id: 5,
    name: 'Motivational',
    category: 'Quote',
    data: {
      colors: { background: '#F59E0B,#D97706', textColor: '#000000' },
      font: 'bold',
      animation: 'scale',
    },
    usageCount: 2156,
  },
  {
    id: 6,
    name: 'Event Countdown',
    category: 'Countdown',
    data: {
      colors: { background: '#7C3AED,#C026D3', textColor: '#FFFFFF' },
      font: 'digital',
      animation: 'pulse',
      stickers: [{ type: 'countdown', value: { targetDate: null, label: 'Countdown to...' } }],
    },
    usageCount: 987,
  },
  {
    id: 7,
    name: 'New Year Countdown',
    category: 'Countdown',
    data: {
      colors: { background: '#FFD700,#FFA500', textColor: '#000000' },
      font: 'bold',
      animation: 'sparkle',
      stickers: [{ type: 'countdown', value: { targetDate: null, label: 'Happy New Year!' } }],
    },
    usageCount: 756,
  },
  {
    id: 8,
    name: 'Flash Sale',
    category: 'Promo',
    data: {
      colors: { background: '#EF4444,#DC2626', textColor: '#FFFFFF' },
      font: 'impact',
      animation: 'shake',
      stickers: [{ type: 'text', value: 'SALE!' }],
    },
    usageCount: 1423,
  },
  {
    id: 9,
    name: 'New Arrival',
    category: 'Promo',
    data: {
      colors: { background: '#10B981,#059669', textColor: '#FFFFFF' },
      font: 'modern',
      animation: 'slide',
    },
    usageCount: 1089,
  },
  {
    id: 10,
    name: 'Clean White',
    category: 'Minimal',
    data: {
      colors: { background: '#FFFFFF', textColor: '#000000' },
      font: 'clean',
      animation: 'none',
    },
    usageCount: 4567,
  },
  {
    id: 11,
    name: 'Dark Mode',
    category: 'Minimal',
    data: {
      colors: { background: '#0A0A0F', textColor: '#FFFFFF' },
      font: 'clean',
      animation: 'none',
    },
    usageCount: 3892,
  },
  {
    id: 12,
    name: 'Gradient Minimal',
    category: 'Minimal',
    data: {
      colors: { background: '#6366F1,#8B5CF6', textColor: '#FFFFFF' },
      font: 'light',
      animation: 'fade',
    },
    usageCount: 2134,
  },
  {
    id: 13,
    name: 'This or That',
    category: 'Question',
    data: {
      colors: { background: '#F472B6,#EC4899', textColor: '#FFFFFF' },
      font: 'bold',
      animation: 'bounce',
      stickers: [{ type: 'slider', value: { question: 'This or That?', emoji: 'fire' } }],
    },
    usageCount: 1876,
  },
  {
    id: 14,
    name: 'Quiz Time',
    category: 'Question',
    data: {
      colors: { background: '#3B82F6,#1D4ED8', textColor: '#FFFFFF' },
      font: 'modern',
      animation: 'slide',
      stickers: [{ type: 'quiz', value: { question: 'Quiz Question?', options: ['A', 'B', 'C', 'D'], correctIndex: 0 } }],
    },
    usageCount: 1543,
  },
  {
    id: 15,
    name: 'Anniversary',
    category: 'Celebration',
    data: {
      colors: { background: '#F59E0B,#EAB308', textColor: '#000000' },
      font: 'elegant',
      animation: 'sparkle',
    },
    usageCount: 892,
  },
  {
    id: 16,
    name: 'Graduation',
    category: 'Celebration',
    data: {
      colors: { background: '#1E3A8A,#1E40AF', textColor: '#FFD700' },
      font: 'serif',
      animation: 'confetti',
    },
    usageCount: 678,
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  'All': 'grid',
  'Celebration': 'gift',
  'Question': 'help-circle',
  'Quote': 'message-circle',
  'Countdown': 'clock',
  'Promo': 'tag',
  'Minimal': 'square',
};

export default function StoryTemplatesScreen({ onClose, onSelectTemplate }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: apiTemplates = [] } = useQuery<StoryTemplate[]>({
    queryKey: ['/api/stories/templates', selectedCategory !== 'All' ? selectedCategory : undefined],
  });

  const templates = apiTemplates.length > 0 ? apiTemplates : DEFAULT_TEMPLATES;

  const handleSelect = (template: StoryTemplate) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelectTemplate(template);
  };

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const renderTemplate = ({ item, index }: { item: StoryTemplate; index: number }) => {
    const bgColor = item.data?.colors?.background || Colors.dark.primary;
    const isGradient = bgColor.includes(',');
    const gradientColors = isGradient ? bgColor.split(',') : [bgColor, bgColor];

    const hasStickers = item.data?.stickers && item.data.stickers.length > 0;
    const stickerType = hasStickers ? item.data.stickers[0].type : null;

    const getStickerIcon = () => {
      switch (stickerType) {
        case 'poll': return 'bar-chart-2';
        case 'question': return 'help-circle';
        case 'countdown': return 'clock';
        case 'quiz': return 'check-circle';
        case 'slider': return 'sliders';
        default: return 'layers';
      }
    };

    return (
      <Animated.View entering={FadeInUp.delay(50 * Math.min(index, 8)).springify()}>
        <Pressable 
          onPress={() => handleSelect(item)}
          style={({ pressed }) => [
            styles.templateCard,
            pressed && styles.templateCardPressed,
          ]}
          testID={`template-${item.id}`}
        >
          {item.thumbnailUrl ? (
            <Image 
              source={{ uri: item.thumbnailUrl }} 
              style={styles.templateImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={gradientColors as [string, string]}
              style={styles.templatePreview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[
                styles.templateSample,
                { color: item.data?.colors?.textColor || '#fff' }
              ]}>
                Aa
              </Text>
              
              {hasStickers ? (
                <View style={styles.stickerIndicator}>
                  <Feather name={getStickerIcon() as any} size={12} color="#fff" />
                  <Text style={styles.stickerLabel}>
                    {stickerType === 'poll' ? 'Poll' : 
                     stickerType === 'question' ? 'Q&A' :
                     stickerType === 'countdown' ? 'Timer' :
                     stickerType === 'quiz' ? 'Quiz' :
                     stickerType === 'slider' ? 'Slider' : 'Sticker'}
                  </Text>
                </View>
              ) : null}

              {item.data?.animation && item.data.animation !== 'none' ? (
                <View style={styles.animationBadge}>
                  <Feather name="zap" size={10} color="#fff" />
                </View>
              ) : null}
            </LinearGradient>
          )}
          
          <View style={styles.templateInfo}>
            <Text style={styles.templateName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.templateMeta}>
              <View style={styles.categoryTag}>
                <Feather 
                  name={CATEGORY_ICONS[item.category] as any || 'tag'} 
                  size={10} 
                  color={Colors.dark.textSecondary} 
                />
                <Text style={styles.categoryTagText}>{item.category}</Text>
              </View>
              <Text style={styles.templateUsage}>
                {item.usageCount > 0 ? `${item.usageCount.toLocaleString()} uses` : 'New'}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn} style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Story Templates</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={item => item}
        contentContainerStyle={styles.categoryList}
        style={styles.categoryContainer}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => {
              setSelectedCategory(item);
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive,
            ]}
          >
            <Feather 
              name={CATEGORY_ICONS[item] as any || 'tag'} 
              size={14} 
              color={selectedCategory === item ? '#fff' : Colors.dark.textSecondary} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === item && styles.categoryTextActive,
            ]}>
              {item}
            </Text>
          </Pressable>
        )}
      />

      {filteredTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={Gradients.primary}
            style={styles.emptyIconContainer}
          >
            <Feather name="layout" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No Templates Found</Text>
          <Text style={styles.emptyText}>
            Templates for this category will be added soon
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={[
            styles.templateGrid,
            { paddingBottom: insets.bottom + 20 }
          ]}
          columnWrapperStyle={styles.templateRow}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          renderItem={renderTemplate}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <View style={styles.footerInfo}>
          <Feather name="info" size={14} color={Colors.dark.textSecondary} />
          <Text style={styles.footerText}>
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      </View>
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
  placeholder: {
    width: 40,
  },
  categoryContainer: {
    flexGrow: 0,
    marginVertical: Spacing.md,
  },
  categoryList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: Spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: Colors.dark.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  templateGrid: {
    padding: Spacing.md,
  },
  templateRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  templateCard: {
    width: CARD_WIDTH,
  },
  templateCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  templateImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
  },
  templatePreview: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  templateSample: {
    fontSize: 36,
    fontWeight: '700',
  },
  stickerIndicator: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stickerLabel: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  animationBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateInfo: {
    paddingVertical: Spacing.sm,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryTagText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  templateUsage: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
});
