import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
  Modal,
  Image,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Avatar } from "@/components/Avatar";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PRODUCT_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm * 2) / 3;

type MallItem = {
  id: string;
  name: string;
  description: string;
  value: number;
  coinPrice?: number;
  categoryId: string;
  imageUrl?: string;
};

type MallUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  netWorth: number;
};

interface ShopInteriorViewProps {
  categoryId: string;
  categoryName: string;
  items: MallItem[];
  usersInShop: MallUser[];
  walletBalance: number;
  onPurchase: (itemId: string, quantity: number) => void;
  onBack: () => void;
  onUserPress: (userId: string) => void;
  isPurchasing?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R${(value / 1_000).toFixed(0)}K`;
  return `R${value.toLocaleString()}`;
}

function ProductCard({
  item,
  onPress,
  theme,
  isDark,
}: {
  item: MallItem;
  onPress: () => void;
  theme: any;
  isDark: boolean;
}) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const price = item.coinPrice || item.value || 0;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.productCard, animatedStyle]}
      testID={`product-${item.id}`}
    >
      <View
        style={[
          styles.productInner,
          {
            backgroundColor: isDark
              ? "rgba(139, 92, 246, 0.15)"
              : "rgba(255, 255, 255, 0.9)",
            borderColor: theme.glassBorder,
          },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
        ) : (
          <View
            style={[
              styles.productImagePlaceholder,
              { backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "rgba(139, 92, 246, 0.1)" },
            ]}
          >
            <Feather
              name="hexagon"
              size={28}
              color={theme.primary}
            />
          </View>
        )}

        <View style={styles.productInfo}>
          <ThemedText style={styles.productName} numberOfLines={2} weight="semiBold">
            {item.name}
          </ThemedText>

          <View style={styles.priceRow}>
            <Feather
              name="circle"
              size={12}
              color={theme.gold}
            />
            <ThemedText style={[styles.priceText, { color: theme.gold }]} weight="bold">
              {formatPrice(price)}
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function ShopInteriorView({
  categoryId,
  categoryName,
  items,
  usersInShop,
  walletBalance,
  onPurchase,
  onBack,
  onUserPress,
  isPurchasing = false,
}: ShopInteriorViewProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<MallItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleProductPress = (item: MallItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedItem(item);
    setQuantity(1);
  };

  const handlePurchase = () => {
    if (selectedItem) {
      onPurchase(selectedItem.id, quantity);
      setSelectedItem(null);
    }
  };

  const totalPrice = selectedItem ? (selectedItem.coinPrice || selectedItem.value) * quantity : 0;
  const canAfford = totalPrice <= walletBalance;

  return (
    <Animated.View 
      entering={SlideInDown.duration(300)}
      style={styles.container}
    >
      <LinearGradient
        colors={isDark
          ? ["#1a1625", "#2d1b4e", "#1a1625"]
          : ["#f0e6ff", "#e8d5ff", "#fff5ff"]
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={[styles.backButton, { backgroundColor: theme.glassBackground }]}
          testID="shop-back-button"
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <ThemedText style={styles.shopTitle} weight="bold">
            {categoryName}
          </ThemedText>
          <ThemedText style={[styles.shopSubtitle, { color: theme.textSecondary }]}>
            {items.length} luxury items
          </ThemedText>
        </View>

        <View style={[styles.walletBadge, { backgroundColor: theme.glassBackground }]}>
          <Feather name="credit-card" size={16} color={theme.gold} />
          <ThemedText style={[styles.walletText, { color: theme.gold }]} weight="bold">
            {formatPrice(walletBalance)}
          </ThemedText>
        </View>
      </View>

      {usersInShop.length > 0 ? (
        <View style={styles.usersInShop}>
          <ThemedText style={[styles.usersLabel, { color: theme.textSecondary }]}>
            Shopping now:
          </ThemedText>
          <FlatList
            horizontal
            data={usersInShop}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.usersList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onUserPress(item.id)}
                style={styles.userInShop}
              >
                <Avatar uri={item.avatarUrl} size={32} />
                <ThemedText style={styles.userInShopName} numberOfLines={1}>
                  @{item.username}
                </ThemedText>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      <FlatList
        data={items}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productGrid}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => handleProductPress(item)}
            theme={theme}
            isDark={isDark}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather
              name="shopping-bag"
              size={40}
              color={theme.textTertiary}
            />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No items available in this shop
            </ThemedText>
          </View>
        }
      />

      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedItem(null)}
        >
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            style={[
              styles.purchaseModal,
              {
                backgroundColor: isDark ? "#1a1625" : "#fff",
                borderColor: theme.glassBorder,
              },
            ]}
          >
            {selectedItem ? (
              <>
                {selectedItem.imageUrl ? (
                  <Image
                    source={{ uri: selectedItem.imageUrl }}
                    style={styles.modalImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.modalImagePlaceholder,
                      { backgroundColor: isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)" },
                    ]}
                  >
                    <Feather
                      name="hexagon"
                      size={56}
                      color={theme.primary}
                    />
                  </View>
                )}

                <ThemedText style={styles.modalTitle} weight="bold">
                  {selectedItem.name}
                </ThemedText>

                <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
                  {selectedItem.description}
                </ThemedText>

                <View style={styles.quantityRow}>
                  <ThemedText style={{ color: theme.textSecondary }}>
                    Quantity:
                  </ThemedText>
                  <View style={styles.quantityControls}>
                    <Pressable
                      onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      style={[
                        styles.quantityButton, 
                        { backgroundColor: theme.glassBackground },
                        quantity <= 1 && { opacity: 0.5 }
                      ]}
                      disabled={quantity <= 1}
                      accessibilityLabel="Decrease quantity"
                      accessibilityRole="button"
                    >
                      <Feather name="minus" size={18} color={quantity <= 1 ? theme.textSecondary : theme.text} />
                    </Pressable>
                    <ThemedText 
                      style={styles.quantityText} 
                      weight="bold"
                      accessibilityLabel={`Quantity: ${quantity}`}
                    >
                      {quantity}
                    </ThemedText>
                    <Pressable
                      onPress={() => setQuantity(Math.min(99, quantity + 1))}
                      style={[
                        styles.quantityButton, 
                        { backgroundColor: theme.glassBackground },
                        quantity >= 99 && { opacity: 0.5 }
                      ]}
                      disabled={quantity >= 99}
                      accessibilityLabel="Increase quantity"
                      accessibilityRole="button"
                    >
                      <Feather name="plus" size={18} color={quantity >= 99 ? theme.textSecondary : theme.text} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.modalPriceRow}>
                  <ThemedText style={{ color: theme.textSecondary }}>
                    Total:
                  </ThemedText>
                  <ThemedText style={[styles.modalPrice, { color: theme.gold }]} weight="bold">
                    {formatPrice(totalPrice)} Rabit Coins
                  </ThemedText>
                </View>

                <View style={styles.netWorthGain}>
                  <Feather name="trending-up" size={16} color={theme.success} />
                  <ThemedText style={[styles.netWorthGainText, { color: theme.success }]}>
                    +{formatPrice(selectedItem.value * quantity)} Net Worth
                  </ThemedText>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    onPress={() => setSelectedItem(null)}
                    style={[styles.cancelButton, { borderColor: theme.glassBorder }]}
                  >
                    <ThemedText>Cancel</ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handlePurchase}
                    disabled={!canAfford || isPurchasing}
                    style={[
                      styles.purchaseButton,
                      { backgroundColor: canAfford ? theme.primary : theme.textTertiary },
                    ]}
                  >
                    <ThemedText style={styles.purchaseButtonText} weight="bold">
                      {isPurchasing ? "Purchasing..." : canAfford ? "Purchase" : "Insufficient Coins"}
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Animated.View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
  },
  shopTitle: {
    fontSize: 20,
  },
  shopSubtitle: {
    fontSize: 12,
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  walletText: {
    fontSize: 13,
  },
  usersInShop: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  usersLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  usersList: {
    gap: Spacing.sm,
  },
  userInShop: {
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  userInShopName: {
    fontSize: 10,
    marginTop: 2,
  },
  productGrid: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  productRow: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  productCard: {
    width: PRODUCT_WIDTH,
  },
  productInner: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.sm,
  },
  productImage: {
    width: "100%",
    aspectRatio: 1,
    resizeMode: "cover",
  },
  productImagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    padding: Spacing.sm,
  },
  productName: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  purchaseModal: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalImage: {
    width: "100%",
    height: 160,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    resizeMode: "cover",
  },
  modalImagePlaceholder: {
    width: "100%",
    height: 160,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 18,
    minWidth: 30,
    textAlign: "center",
  },
  modalPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalPrice: {
    fontSize: 18,
  },
  netWorthGain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.lg,
  },
  netWorthGainText: {
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  purchaseButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  purchaseButtonText: {
    color: "#fff",
    fontSize: 15,
  },
});

export default ShopInteriorView;
