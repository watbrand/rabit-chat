import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Platform,
  Pressable,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { MallGridSkeleton } from "@/components/ShimmerPlaceholder";
import { GradientBackground } from "@/components/GradientBackground";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// 3-column compact grid for Instagram/TikTok shop style
const GRID_GAP = 8;
const ITEM_CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - GRID_GAP * 2) / 3;
const ITEM_CARD_HEIGHT = ITEM_CARD_WIDTH * 1.4; // Taller cards for image-first design

type WealthyUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  netWorth: number;
};

type Category = {
  id: string;
  name: string;
  icon?: string;
};

type MallItem = {
  id: string;
  name: string;
  description: string;
  value: number;
  coinPrice?: number;
  categoryId: string;
  imageUrl?: string;
};

const getItemCoinPrice = (item: MallItem): number => {
  return item.coinPrice || item.value || 0;
};

export default function MallScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mall/top50"] });
      refreshUser();
    }, [queryClient, refreshUser])
  );

  const handleUserPress = (userId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("UserProfile", { userId });
  };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MallItem | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  const { data: top50, isLoading: top50Loading } = useQuery<WealthyUser[]>({
    queryKey: ["/api/mall/top50"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/mall/categories"],
  });

  const { data: items, isLoading: itemsLoading, refetch: refetchItems, isRefetching, error: itemsError } = useQuery<MallItem[]>({
    queryKey: selectedCategory
      ? ["/api/mall/items", { categoryId: selectedCategory }]
      : ["/api/mall/items"],
    queryFn: async () => {
      const url = selectedCategory
        ? new URL(`/api/mall/items?categoryId=${selectedCategory}`, getApiUrl())
        : new URL("/api/mall/items", getApiUrl());
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Mall] Items fetch error:", res.status, errorText);
        throw new Error(`Failed to fetch items: ${res.status}`);
      }
      const data = await res.json();
      return data;
    },
    retry: 1,
  });

  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<{ netWorthGained: number; itemName: string } | null>(null);

  type Wallet = {
    id: string;
    coinBalance: number;
    isFrozen: boolean;
  };

  const { data: wallet, refetch: refetchWallet } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const purchaseMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const url = new URL("/api/mall/purchase", getApiUrl());
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Purchase failed" }));
        throw new Error(error.message || "Purchase failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/mall/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mall/top50"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mall/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/portfolio`] });
      }
      refreshUser();
      refetchWallet();
      setPurchaseModalVisible(false);
      setPurchaseSuccess({
        netWorthGained: selectedItem ? selectedItem.value * 10 * purchaseQuantity : 0,
        itemName: selectedItem?.name || "Item",
      });
      setSelectedItem(null);
      setPurchaseQuantity(1);
      setPurchaseError(null);
    },
    onError: (error: Error) => {
      setPurchaseError(error.message);
    },
  });

  const handleItemPress = (item: MallItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const handleBuyPress = (item: MallItem) => {
    setSelectedItem(item);
    setPurchaseQuantity(1);
    setPurchaseError(null);
    setPurchaseModalVisible(true);
  };

  const handleBuyFromDetail = () => {
    setDetailModalVisible(false);
    setPurchaseQuantity(1);
    setPurchaseError(null);
    setPurchaseModalVisible(true);
  };

  const handleConfirmPurchase = () => {
    if (selectedItem) {
      const totalCost = getItemCoinPrice(selectedItem) * purchaseQuantity;
      if (wallet && wallet.coinBalance < totalCost) {
        setPurchaseError("Insufficient coins. Please top up your wallet.");
        return;
      }
      if (wallet?.isFrozen) {
        setPurchaseError("Your wallet is frozen. Please contact support.");
        return;
      }
      purchaseMutation.mutate({ itemId: selectedItem.id, quantity: purchaseQuantity });
    }
  };

  const dismissSuccessAlert = () => {
    setPurchaseSuccess(null);
  };

  const formatNetWorth = (value: number) => {
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R${(value / 1000).toFixed(1)}K`;
    }
    return `R${value}`;
  };

  const renderTop50Carousel = () => (
    <View style={styles.compactTop50Container}>
      <View style={styles.compactSectionHeader}>
        <Feather name="award" size={14} color={theme.gold} />
        <ThemedText style={[styles.compactSectionTitle, { color: theme.text }]} weight="semiBold">
          Top Wealthy
        </ThemedText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactTop50Scroll}
      >
        {top50Loading ? (
          <LoadingIndicator size="small" />
        ) : top50 && top50.length > 0 ? (
          top50.map((wealthyUser, index) => (
            <Pressable 
              key={wealthyUser.id} 
              style={styles.compactTop50Item}
              onPress={() => handleUserPress(wealthyUser.id)}
              testID={`wealthy-user-${wealthyUser.id}`}
            >
              <View style={styles.compactRankBadge}>
                <LinearGradient
                  colors={
                    index === 0
                      ? [theme.gold, "#FFB800"]
                      : index === 1
                      ? [theme.silver, "#E0E0E0"]
                      : index === 2
                      ? ["#CD7F32", "#A0522D"]
                      : [theme.primary, theme.primaryLight]
                  }
                  style={styles.compactRankGradient}
                >
                  <ThemedText style={styles.compactRankText} weight="bold">
                    {index + 1}
                  </ThemedText>
                </LinearGradient>
              </View>
              <LinearGradient
                colors={[theme.gold, theme.goldShimmer]}
                style={styles.compactTop50Ring}
              >
                <View style={[styles.compactTop50AvatarInner, { backgroundColor: theme.backgroundRoot }]}>
                  <Avatar uri={wealthyUser.avatarUrl} size={40} />
                </View>
              </LinearGradient>
              <ThemedText
                style={[styles.compactTop50Username, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {wealthyUser.username}
              </ThemedText>
              <View style={[styles.compactNetWorthBadge, { backgroundColor: theme.goldLight }]}>
                <ThemedText style={[styles.compactNetWorthText, { color: theme.gold }]} weight="semiBold">
                  {formatNetWorth(wealthyUser.netWorth)}
                </ThemedText>
              </View>
            </Pressable>
          ))
        ) : (
          <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }}>No wealthy users yet</ThemedText>
        )}
      </ScrollView>
    </View>
  );

  const renderCategoryPills = () => (
    <View style={styles.compactCategoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactCategoriesScroll}
      >
        <Pressable
          style={[
            styles.compactCategoryPill,
            {
              backgroundColor: selectedCategory === null ? theme.primary : theme.glassBackground,
              borderColor: selectedCategory === null ? theme.primary : theme.glassBorder,
            },
          ]}
          onPress={() => setSelectedCategory(null)}
          testID="category-all"
        >
          <ThemedText
            style={[
              styles.compactCategoryText,
              { color: selectedCategory === null ? "#FFFFFF" : theme.text },
            ]}
            weight="medium"
          >
            All
          </ThemedText>
        </Pressable>
        {categoriesLoading ? (
          <LoadingIndicator size="small" />
        ) : categories && categories.length > 0 ? (
          categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.compactCategoryPill,
                {
                  backgroundColor:
                    selectedCategory === category.id ? theme.primary : theme.glassBackground,
                  borderColor:
                    selectedCategory === category.id ? theme.primary : theme.glassBorder,
                },
              ]}
              onPress={() => setSelectedCategory(category.id)}
              testID={`category-${category.id}`}
            >
              <ThemedText
                style={[
                  styles.compactCategoryText,
                  { color: selectedCategory === category.id ? "#FFFFFF" : theme.text },
                ]}
                weight="medium"
              >
                {category.name}
              </ThemedText>
            </Pressable>
          ))
        ) : null}
      </ScrollView>
    </View>
  );

  const getCategoryIcon = (itemName: string): keyof typeof Feather.glyphMap => {
    const name = itemName.toLowerCase();
    if (name.includes("watch") || name.includes("rolex") || name.includes("patek") || name.includes("omega")) return "watch";
    if (name.includes("ferrari") || name.includes("lamborghini") || name.includes("bugatti") || name.includes("mclaren") || name.includes("porsche") || name.includes("car")) return "truck";
    if (name.includes("jet") || name.includes("gulfstream") || name.includes("bombardier") || name.includes("falcon") || name.includes("embraer") || name.includes("flight")) return "navigation";
    if (name.includes("yacht") || name.includes("superyacht") || name.includes("boat")) return "anchor";
    if (name.includes("penthouse") || name.includes("estate") || name.includes("mansion") || name.includes("island") || name.includes("apartment")) return "home";
    if (name.includes("picasso") || name.includes("warhol") || name.includes("basquiat") || name.includes("monet") || name.includes("art")) return "image";
    if (name.includes("diamond") || name.includes("emerald") || name.includes("ruby") || name.includes("tiara") || name.includes("bracelet") || name.includes("necklace")) return "award";
    if (name.includes("badge") || name.includes("membership") || name.includes("vip") || name.includes("elite") || name.includes("founder") || name.includes("tier")) return "star";
    if (name.includes("theme") || name.includes("emoji") || name.includes("avatar") || name.includes("color")) return "gift";
    if (name.includes("space") || name.includes("expedition") || name.includes("everest") || name.includes("racing") || name.includes("experience")) return "compass";
    return "shopping-bag";
  };

  // Premium badge logic based on item properties
  const getItemBadge = (item: MallItem): { text: string; color: string } | null => {
    const price = getItemCoinPrice(item);
    const name = item.name.toLowerCase();
    if (name.includes("limited") || name.includes("exclusive")) return { text: "LIMITED", color: theme.error };
    if (price >= 10000) return { text: "PREMIUM", color: theme.gold };
    if (name.includes("new") || name.includes("vip")) return { text: "HOT", color: "#FF6B35" };
    // Random "NEW" badge for variety (based on item id hash)
    if (item.id.charCodeAt(0) % 5 === 0) return { text: "NEW", color: theme.success };
    return null;
  };

  const renderItemCard = ({ item, index }: { item: MallItem; index: number }) => {
    const badge = getItemBadge(item);
    const isLastInRow = (index + 1) % 3 === 0;
    
    return (
      <Pressable
        onPress={() => handleItemPress(item)}
        testID={`item-card-${item.id}`}
        style={[
          styles.compactCard,
          { 
            width: ITEM_CARD_WIDTH,
            marginRight: isLastInRow ? 0 : GRID_GAP,
          }
        ]}
      >
        {/* Image Container - Takes most of the card */}
        <View style={[styles.compactImageContainer, { backgroundColor: theme.backgroundSecondary }]}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.compactImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.compactImagePlaceholder}>
              <Feather name={getCategoryIcon(item.name)} size={28} color={theme.primary} />
            </View>
          )}
          
          {/* Floating Price Badge */}
          <View style={[styles.floatingPriceBadge, { backgroundColor: theme.gold }]}>
            <ThemedText style={styles.floatingPriceText} weight="bold">
              {getItemCoinPrice(item) >= 1000 
                ? `${(getItemCoinPrice(item) / 1000).toFixed(getItemCoinPrice(item) >= 10000 ? 0 : 1)}K` 
                : getItemCoinPrice(item)}
            </ThemedText>
          </View>
          
          {/* Premium Badge (if applicable) */}
          {badge ? (
            <View style={[styles.premiumBadge, { backgroundColor: badge.color }]}>
              <ThemedText style={styles.premiumBadgeText} weight="bold">
                {badge.text}
              </ThemedText>
            </View>
          ) : null}
          
          {/* Quick Buy Button - floating at bottom right */}
          <Pressable
            style={[styles.quickBuyButton, { backgroundColor: theme.primary }]}
            onPress={(e) => {
              e.stopPropagation();
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              handleBuyPress(item);
            }}
            testID={`buy-button-${item.id}`}
          >
            <Feather name="plus" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
        
        {/* Minimal Text Info at Bottom */}
        <View style={styles.compactCardInfo}>
          <ThemedText 
            style={[styles.compactItemName, { color: theme.text }]} 
            numberOfLines={1}
          >
            {item.name}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name={itemsError ? "alert-circle" : "shopping-bag"} size={64} color={itemsError ? theme.error : theme.textTertiary} />
      <ThemedText type="h4" style={styles.emptyTitle}>
        {itemsError ? "Failed to load items" : "No items available"}
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        {itemsError ? "Pull down to retry" : "Check back later for new items"}
      </ThemedText>
      {itemsError ? (
        <GlassButton
          title="Retry"
          icon="refresh-cw"
          variant="primary"
          onPress={() => refetchItems()}
          style={{ marginTop: Spacing.lg }}
          testID="retry-items"
        />
      ) : null}
    </View>
  );

  const renderPurchaseModal = () => (
    <Modal
      visible={purchaseModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setPurchaseModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.backgroundElevated,
              borderColor: theme.glassBorder,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="title3">Confirm Purchase</ThemedText>
            <Pressable
              onPress={() => setPurchaseModalVisible(false)}
              testID="close-purchase-modal"
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {selectedItem ? (
            <>
              <View style={styles.modalItemInfo}>
                <View
                  style={[
                    styles.modalItemImage,
                    { backgroundColor: theme.backgroundSecondary },
                  ]}
                >
                  <Feather name="shopping-bag" size={40} color={theme.primary} />
                </View>
                <View style={styles.modalItemDetails}>
                  <ThemedText type="headline">{selectedItem.name}</ThemedText>
                  <ThemedText
                    type="subhead"
                    style={{ color: theme.textSecondary }}
                  >
                    {selectedItem.description}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.quantityContainer}>
                <ThemedText type="subhead">Quantity:</ThemedText>
                <View style={styles.quantityControls}>
                  <Pressable
                    style={[styles.quantityButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                    testID="quantity-decrease"
                  >
                    <Feather name="minus" size={18} color={theme.text} />
                  </Pressable>
                  <ThemedText type="headline" style={styles.quantityValue}>
                    {purchaseQuantity}
                  </ThemedText>
                  <Pressable
                    style={[styles.quantityButton, { backgroundColor: theme.backgroundSecondary }]}
                    onPress={() => setPurchaseQuantity(purchaseQuantity + 1)}
                    testID="quantity-increase"
                  >
                    <Feather name="plus" size={18} color={theme.text} />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.totalContainer, { borderTopColor: theme.border }]}>
                <ThemedText type="subhead">Total:</ThemedText>
                <View style={[styles.totalBadge, { backgroundColor: theme.goldLight }]}>
                  <ThemedText style={[styles.totalValue, { color: theme.gold }]} weight="bold">
                    {(getItemCoinPrice(selectedItem) * purchaseQuantity).toLocaleString()} coins
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.walletBalanceInfo, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={styles.walletBalanceRow}>
                  <Feather name="credit-card" size={16} color={theme.primary} />
                  <ThemedText style={[styles.walletBalanceLabel, { color: theme.textSecondary }]}>
                    Your Balance:
                  </ThemedText>
                  <ThemedText style={[styles.walletBalanceValue, { color: wallet && wallet.coinBalance >= getItemCoinPrice(selectedItem) * purchaseQuantity ? theme.success : theme.error }]} weight="bold">
                    {wallet?.coinBalance?.toLocaleString() || 0} coins
                  </ThemedText>
                </View>
                <View style={styles.netWorthGainRow}>
                  <Feather name="trending-up" size={16} color={theme.gold} />
                  <ThemedText style={[styles.netWorthGainLabel, { color: theme.textSecondary }]}>
                    Net Worth Gain:
                  </ThemedText>
                  <ThemedText style={[styles.netWorthGainValue, { color: theme.gold }]} weight="bold">
                    +{((selectedItem?.value || 0) * 10 * purchaseQuantity).toLocaleString()} (10x multiplier)
                  </ThemedText>
                </View>
              </View>

              <View style={styles.modalActions}>
                <GlassButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setPurchaseModalVisible(false)}
                  style={styles.modalButton}
                  testID="cancel-purchase"
                  disabled={purchaseMutation.isPending}
                />
                <GlassButton
                  title="Buy Now"
                  icon="shopping-cart"
                  variant="primary"
                  onPress={handleConfirmPurchase}
                  loading={purchaseMutation.isPending}
                  style={styles.modalButton}
                  testID="confirm-purchase"
                />
              </View>

              {purchaseError ? (
                <ThemedText style={[styles.errorText, { color: theme.error }]}>
                  {purchaseError}
                </ThemedText>
              ) : null}
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  const renderDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.detailModalContent,
            {
              backgroundColor: theme.backgroundElevated,
              borderColor: theme.glassBorder,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText type="title3">Product Details</ThemedText>
            <Pressable
              onPress={() => setDetailModalVisible(false)}
              testID="close-detail-modal"
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          {selectedItem ? (
            <ScrollView 
              style={styles.detailScrollView} 
              contentContainerStyle={styles.detailScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedItem.imageUrl ? (
                <Image 
                  source={{ uri: selectedItem.imageUrl }} 
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.detailImagePlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name={getCategoryIcon(selectedItem.name)} size={64} color={theme.primary} />
                </View>
              )}

              <ThemedText type="title2" style={styles.detailName}>
                {selectedItem.name}
              </ThemedText>

              <View style={[styles.detailValueContainer, { backgroundColor: theme.goldLight }]}>
                <ThemedText style={[styles.detailValue, { color: theme.gold }]} weight="bold">
                  {getItemCoinPrice(selectedItem).toLocaleString()} coins
                </ThemedText>
              </View>

              <View style={styles.detailDescriptionContainer}>
                <ThemedText type="headline" style={styles.detailDescriptionLabel}>
                  Description
                </ThemedText>
                <ThemedText 
                  type="body" 
                  style={[styles.detailDescription, { color: theme.textSecondary }]}
                >
                  {selectedItem.description || "No description available for this luxury item."}
                </ThemedText>
              </View>

              <View style={styles.detailActions}>
                <GlassButton
                  title="Buy Now"
                  icon="shopping-cart"
                  variant="primary"
                  onPress={handleBuyFromDetail}
                  fullWidth
                  testID="buy-from-detail"
                />
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  if (itemsLoading && !items) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
        <MallGridSkeleton />
      </View>
    );
  }

  return (
    <GradientBackground variant="subtle">
      <FlatList
        style={styles.list}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.lg,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={items || []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.compactRow}
        renderItem={renderItemCard}
        ListHeaderComponent={
          <>
            <View style={[styles.compactWalletHeader, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
              <View style={styles.compactWalletLeft}>
                <Feather name="credit-card" size={16} color={theme.gold} />
                <ThemedText style={[styles.compactWalletLabel, { color: theme.textSecondary }]}>Balance</ThemedText>
                <ThemedText style={[styles.compactWalletBalance, { color: theme.gold }]} weight="bold">{wallet?.coinBalance?.toLocaleString() || 0}</ThemedText>
              </View>
              <Pressable
                style={[styles.compactGetCoinsBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate("Wallet" as never)}
                testID="get-coins-mall"
              >
                <Feather name="plus" size={14} color="#FFFFFF" />
                <ThemedText style={styles.compactGetCoinsBtnText} weight="semiBold">Get Coins</ThemedText>
              </Pressable>
            </View>
            {renderTop50Carousel()}
            {renderCategoryPills()}
            <View style={styles.shopSectionHeader}>
              <ThemedText type="subhead" style={styles.shopSectionTitle}>
                Shop
              </ThemedText>
              <ThemedText style={[styles.shopItemCount, { color: theme.textSecondary }]}>
                {items?.length || 0} items
              </ThemedText>
            </View>
          </>
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchItems}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
      {renderPurchaseModal()}
      {renderDetailModal()}
      
      <Modal
        visible={purchaseSuccess !== null}
        transparent
        animationType="fade"
        onRequestClose={dismissSuccessAlert}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.successModalContent, { backgroundColor: theme.backgroundElevated, borderColor: theme.glassBorder }]}>
            <View style={[styles.successIcon, { backgroundColor: theme.gold + "20" }]}>
              <Feather name="check-circle" size={48} color={theme.gold} />
            </View>
            <ThemedText type="title2" style={styles.successTitle}>Purchase Complete!</ThemedText>
            <ThemedText style={[styles.successItem, { color: theme.textSecondary }]}>
              {purchaseSuccess?.itemName}
            </ThemedText>
            <View style={[styles.successNetWorthGain, { backgroundColor: theme.gold + "20" }]}>
              <Feather name="trending-up" size={20} color={theme.gold} />
              <ThemedText style={[styles.successNetWorthText, { color: theme.gold }]} weight="bold">
                +{purchaseSuccess?.netWorthGained?.toLocaleString()} Net Worth
              </ThemedText>
            </View>
            <ThemedText style={[styles.successMultiplier, { color: theme.textSecondary }]}>
              10x multiplier applied!
            </ThemedText>
            <GlassButton
              title="Continue Shopping"
              variant="primary"
              onPress={dismissSuccessAlert}
              style={styles.successButton}
              testID="dismiss-success"
            />
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  top50Container: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  top50Scroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  top50Item: {
    alignItems: "center",
    width: 80,
  },
  rankBadge: {
    position: "absolute",
    top: -4,
    right: 8,
    zIndex: 1,
  },
  rankGradient: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  top50Ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  top50AvatarInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  top50Username: {
    fontSize: 11,
    textAlign: "center",
    width: 80,
    marginBottom: Spacing.xs,
  },
  netWorthBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  netWorthText: {
    fontSize: 10,
  },
  categoriesContainer: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
  },
  itemsHeader: {
    marginBottom: Spacing.md,
  },
  columnWrapper: {
    gap: Spacing.md,
  },
  itemCard: {
    padding: Spacing.md,
  },
  itemImage: {
    width: "100%",
    height: 100,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  itemImagePlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  itemName: {
    marginBottom: Spacing.xs,
  },
  itemDescription: {
    marginBottom: Spacing.sm,
    minHeight: 32,
  },
  itemValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: 2,
  },
  itemValue: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  modalItemInfo: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  modalItemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalItemDetails: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.xs,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    minWidth: 32,
    textAlign: "center",
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    marginBottom: Spacing.xl,
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  totalValue: {
    fontSize: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
  },
  errorText: {
    marginTop: Spacing.md,
    textAlign: "center",
    fontSize: 14,
  },
  tapHint: {
    alignItems: "center",
    paddingTop: Spacing.xs,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  detailModalContent: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    minHeight: 400,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.lg,
  },
  detailScrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  detailScrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  detailImagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  detailName: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: 4,
    alignSelf: "center",
  },
  detailValue: {
    fontSize: 20,
  },
  detailDescriptionContainer: {
    marginBottom: Spacing.xl,
  },
  detailDescriptionLabel: {
    marginBottom: Spacing.sm,
  },
  detailDescription: {
    lineHeight: 24,
  },
  detailActions: {
    marginTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  walletBalanceInfo: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  walletBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  walletBalanceLabel: {
    fontSize: 14,
    flex: 1,
  },
  walletBalanceValue: {
    fontSize: 14,
  },
  netWorthGainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  netWorthGainLabel: {
    fontSize: 14,
    flex: 1,
  },
  netWorthGainValue: {
    fontSize: 14,
  },
  successModalContent: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  successTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  successItem: {
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontSize: 16,
  },
  successNetWorthGain: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  successNetWorthText: {
    fontSize: 18,
  },
  successMultiplier: {
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontSize: 14,
  },
  successButton: {
    width: "100%",
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  walletHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  walletHeaderLabel: {
    fontSize: 12,
  },
  walletHeaderBalance: {
    fontSize: 18,
  },
  // Compact 3-column grid styles for premium mall look
  compactRow: {
    justifyContent: "flex-start",
    marginBottom: GRID_GAP,
  },
  compactCard: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  compactImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  compactImage: {
    width: "100%",
    height: "100%",
  },
  compactImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingPriceBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  floatingPriceText: {
    fontSize: 10,
    color: "#FFFFFF",
  },
  premiumBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  premiumBadgeText: {
    fontSize: 8,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  quickBuyButton: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  compactCardInfo: {
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  compactItemName: {
    fontSize: 11,
    lineHeight: 14,
  },
  shopSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  shopSectionTitle: {
    fontWeight: "600",
  },
  shopItemCount: {
    fontSize: 11,
  },
  compactWalletHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  compactWalletLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  compactWalletLabel: {
    fontSize: 11,
  },
  compactWalletBalance: {
    fontSize: 14,
  },
  compactGetCoinsBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  compactGetCoinsBtnText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
  // Compact Top 50 styles
  compactTop50Container: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  compactSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: 6,
  },
  compactSectionTitle: {
    fontSize: 12,
  },
  compactTop50Scroll: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  compactTop50Item: {
    alignItems: "center",
    width: 60,
  },
  compactRankBadge: {
    position: "absolute",
    top: -2,
    right: 4,
    zIndex: 1,
  },
  compactRankGradient: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  compactRankText: {
    fontSize: 9,
    color: "#FFFFFF",
  },
  compactTop50Ring: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  compactTop50AvatarInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  compactTop50Username: {
    fontSize: 9,
    textAlign: "center",
    width: 60,
    marginBottom: 2,
  },
  compactNetWorthBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  compactNetWorthText: {
    fontSize: 8,
  },
  // Compact category pills
  compactCategoriesContainer: {
    marginBottom: Spacing.sm,
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  compactCategoriesScroll: {
    gap: 6,
  },
  compactCategoryPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  compactCategoryText: {
    fontSize: 11,
  },
});
