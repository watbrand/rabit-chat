import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from "react-native";
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
const ITEM_CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

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
      console.log("[Mall] Fetching items from:", url.toString());
      const res = await fetch(url, { credentials: "include" });
      console.log("[Mall] Items response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Mall] Items fetch error:", res.status, errorText);
        throw new Error(`Failed to fetch items: ${res.status}`);
      }
      const data = await res.json();
      console.log("[Mall] Items fetched:", data.length);
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
    <View style={styles.top50Container}>
      <View style={styles.sectionHeader}>
        <Feather name="award" size={20} color={theme.gold} />
        <ThemedText type="headline" style={styles.sectionTitle}>
          Top 50 Wealthy Users
        </ThemedText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.top50Scroll}
      >
        {top50Loading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : top50 && top50.length > 0 ? (
          top50.map((wealthyUser, index) => (
            <Pressable 
              key={wealthyUser.id} 
              style={styles.top50Item}
              onPress={() => handleUserPress(wealthyUser.id)}
              testID={`wealthy-user-${wealthyUser.id}`}
            >
              <View style={styles.rankBadge}>
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
                  style={styles.rankGradient}
                >
                  <ThemedText style={styles.rankText} weight="bold">
                    {index + 1}
                  </ThemedText>
                </LinearGradient>
              </View>
              <LinearGradient
                colors={[theme.gold, theme.goldShimmer]}
                style={styles.top50Ring}
              >
                <View style={[styles.top50AvatarInner, { backgroundColor: theme.backgroundRoot }]}>
                  <Avatar uri={wealthyUser.avatarUrl} size={52} />
                </View>
              </LinearGradient>
              <ThemedText
                style={[styles.top50Username, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {wealthyUser.username}
              </ThemedText>
              <View style={[styles.netWorthBadge, { backgroundColor: theme.goldLight }]}>
                <ThemedText style={[styles.netWorthText, { color: theme.gold }]} weight="semiBold">
                  {formatNetWorth(wealthyUser.netWorth)}
                </ThemedText>
              </View>
            </Pressable>
          ))
        ) : (
          <ThemedText style={{ color: theme.textSecondary }}>No wealthy users yet</ThemedText>
        )}
      </ScrollView>
    </View>
  );

  const renderCategoryPills = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        <Pressable
          style={[
            styles.categoryPill,
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
              styles.categoryText,
              { color: selectedCategory === null ? "#FFFFFF" : theme.text },
            ]}
            weight="medium"
          >
            All
          </ThemedText>
        </Pressable>
        {categoriesLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : categories && categories.length > 0 ? (
          categories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryPill,
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
                  styles.categoryText,
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

  const renderItemCard = ({ item }: { item: MallItem }) => (
    <Pressable
      onPress={() => handleItemPress(item)}
      testID={`item-card-${item.id}`}
    >
      <Card
        style={{ ...styles.itemCard, width: ITEM_CARD_WIDTH }}
        variant="glass"
        elevation={2}
      >
        {item.imageUrl ? (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name={getCategoryIcon(item.name)} size={32} color={theme.primary} />
          </View>
        )}
        <ThemedText type="headline" numberOfLines={1} style={styles.itemName}>
          {item.name}
        </ThemedText>
        <ThemedText
          type="caption1"
          style={[styles.itemDescription, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </ThemedText>
        <View style={[styles.itemValueContainer, { backgroundColor: theme.goldLight }]}>
          <ThemedText style={[styles.itemValue, { color: theme.gold }]} weight="bold">
            {getItemCoinPrice(item).toLocaleString()} coins
          </ThemedText>
        </View>
        <Pressable
          style={[styles.buyButton, { backgroundColor: theme.primary }]}
          onPress={(e) => {
            e.stopPropagation();
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            handleBuyPress(item);
          }}
          testID={`buy-button-${item.id}`}
        >
          <Feather name="shopping-cart" size={14} color="#FFFFFF" />
          <ThemedText style={styles.buyButtonText} weight="semiBold">
            Buy
          </ThemedText>
        </Pressable>
      </Card>
    </Pressable>
  );

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
            <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
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
          paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        data={items || []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderItemCard}
        ListHeaderComponent={
          <>
            <View style={[styles.walletHeader, { backgroundColor: theme.backgroundElevated, borderColor: theme.glassBorder }]}>
              <View style={styles.walletHeaderLeft}>
                <Feather name="credit-card" size={20} color={theme.gold} />
                <View>
                  <ThemedText style={[styles.walletHeaderLabel, { color: theme.textSecondary }]}>Your Balance</ThemedText>
                  <ThemedText type="title2" style={[styles.walletHeaderBalance, { color: theme.gold }]}>{wallet?.coinBalance?.toLocaleString() || 0}</ThemedText>
                </View>
              </View>
              <GlassButton
                title="Get Coins"
                icon="plus"
                variant="primary"
                size="sm"
                onPress={() => navigation.navigate("Wallet" as never)}
                testID="get-coins-mall"
              />
            </View>
            {renderTop50Carousel()}
            {renderCategoryPills()}
            <ThemedText type="headline" style={styles.itemsHeader}>
              Mall Items
            </ThemedText>
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
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.lg,
  },
  detailScrollView: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 0,
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
});
