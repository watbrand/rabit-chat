import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Image, FlatList, TextInput } from 'react-native';
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MallItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
}

interface Props {
  product?: MallItem;
  isEditing?: boolean;
  onSelect?: (item: MallItem) => void;
  onPress?: () => void;
}

export default function ShoppingSticker({
  product,
  isEditing = false,
  onSelect,
  onPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const scale = useSharedValue(1);

  const { data: products = [], isLoading } = useQuery<MallItem[]>({
    queryKey: ['/api/mall/items', searchQuery],
    enabled: isEditing,
  });

  const handleSelect = (item: MallItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect?.(item);
  };

  const handlePress = () => {
    scale.value = withSpring(0.95);
    setTimeout(() => {
      scale.value = withSpring(1);
    }, 100);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const formatPrice = (price: number) => {
    return `R${price.toLocaleString()}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.header}>
          <Feather name="shopping-bag" size={18} color={Colors.dark.primary} />
          <Text style={styles.headerText}>Tag a Product</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={Colors.dark.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search mall items..."
            placeholderTextColor={Colors.dark.textSecondary}
          />
        </View>
        
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          style={styles.productList}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          renderItem={({ item }) => (
            <Pressable 
              onPress={() => handleSelect(item)}
              style={styles.productItem}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="package" size={20} color={Colors.dark.textSecondary} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
              </View>
              <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            isLoading ? null : (
              <View style={styles.emptyState}>
                <Feather name="shopping-bag" size={40} color={Colors.dark.textSecondary} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No products found' : 'Search for products'}
                </Text>
              </View>
            )
          }
        />
      </View>
    );
  }

  if (!product) return null;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress} style={styles.container}>
        <View style={styles.tagIcon}>
          <Feather name="shopping-bag" size={12} color="#fff" />
        </View>
        
        <View style={styles.productContent}>
          <Text style={styles.tagName} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.tagPrice}>{formatPrice(product.price)}</Text>
        </View>
        
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    maxWidth: 220,
  },
  tagIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContent: {
    flex: 1,
  },
  tagName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  tagPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  editContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 16,
    padding: Spacing.md,
    width: 300,
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    paddingVertical: Spacing.sm,
  },
  productList: {
    maxHeight: 250,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  productImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  productCategory: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
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
