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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function StoryTemplatesScreen({ onClose, onSelectTemplate }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: templates = [], isLoading } = useQuery<StoryTemplate[]>({
    queryKey: ['/api/stories/templates', selectedCategory !== 'All' ? selectedCategory : undefined],
  });

  const handleSelect = (template: StoryTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectTemplate(template);
  };

  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const renderTemplate = ({ item }: { item: StoryTemplate }) => {
    const bgColor = item.data?.colors?.background || Colors.dark.primary;
    const isGradient = bgColor.includes(',');
    const gradientColors = isGradient ? bgColor.split(',') : [bgColor, bgColor];

    return (
      <Pressable 
        onPress={() => handleSelect(item)}
        style={styles.templateCard}
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
            
            {item.data?.stickers && item.data.stickers.length > 0 ? (
              <View style={styles.stickerIndicator}>
                <Feather name="layers" size={12} color="#fff" />
                <Text style={styles.stickerCount}>{item.data.stickers.length}</Text>
              </View>
            ) : null}
          </LinearGradient>
        )}
        
        <View style={styles.templateInfo}>
          <Text style={styles.templateName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.templateUsage}>
            {item.usageCount > 0 ? `${item.usageCount.toLocaleString()} uses` : 'New'}
          </Text>
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
        <Text style={styles.headerTitle}>Templates</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={item => item}
        contentContainerStyle={styles.categoryList}
        style={styles.categoryContainer}
        renderItem={({ item }) => (
          <Pressable 
            onPress={() => {
              setSelectedCategory(item);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive,
            ]}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === item && styles.categoryTextActive,
            ]}>
              {item}
            </Text>
          </Pressable>
        )}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      ) : filteredTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="layout" size={48} color={Colors.dark.textSecondary} />
          <Text style={styles.emptyTitle}>No Templates</Text>
          <Text style={styles.emptyText}>
            Templates for this category coming soon
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTemplates}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.templateGrid}
          columnWrapperStyle={styles.templateRow}
          renderItem={renderTemplate}
        />
      )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  templateGrid: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  templateRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  templateCard: {
    width: CARD_WIDTH,
  },
  templateImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
  },
  templatePreview: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    borderRadius: 12,
  },
  stickerCount: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  templateInfo: {
    paddingVertical: Spacing.xs,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  templateUsage: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
});
