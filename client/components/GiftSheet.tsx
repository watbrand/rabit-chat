import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import Haptics from "@/lib/safeHaptics";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { GlassButton } from "@/components/GlassButton";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface GiftType {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  coinCost: number;
  netWorthValue: number;
  category: string;
}

interface Wallet {
  id: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

interface GiftSheetProps {
  visible: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string | null;
  postId?: string;
  commentId?: string;
}

export function GiftSheet({
  visible,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  postId,
  commentId,
}: GiftSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: giftTypes, isLoading: loadingGifts } = useQuery<GiftType[]>({
    queryKey: ["/api/gifts/types"],
    enabled: visible,
  });

  const { data: wallet } = useQuery<Wallet>({
    queryKey: ["/api/my/wallet"],
    enabled: visible,
  });

  const sendGiftMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGift) throw new Error("No gift selected");
      const response = await apiRequest("POST", "/api/gifts/send", {
        recipientId,
        giftTypeId: selectedGift.id,
        quantity,
        postId,
        commentId,
      });
      return response.json();
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/my/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my/transactions"] });
      Alert.alert(
        "Gift Sent!",
        `You sent ${quantity}x ${selectedGift?.name} to ${recipientName}!`,
        [{ text: "OK", onPress: onClose }]
      );
    },
    onError: (error: any) => {
      Alert.alert("Failed to Send Gift", error.message || "Please try again");
    },
  });

  useEffect(() => {
    if (!visible) {
      setSelectedGift(null);
      setQuantity(1);
    }
  }, [visible]);

  const totalCost = selectedGift ? selectedGift.coinCost * quantity : 0;
  const canAfford = wallet ? wallet.balance >= totalCost : false;

  const handleSend = () => {
    if (!selectedGift) {
      Alert.alert("Select a Gift", "Please select a gift to send");
      return;
    }
    if (quantity < 1) {
      Alert.alert("Invalid Quantity", "Please select at least 1 gift to send");
      return;
    }
    if (!canAfford) {
      Alert.alert("Insufficient Coins", "You don't have enough Rabit Coins for this gift");
      return;
    }
    Alert.alert(
      "Confirm Gift",
      `Are you sure you want to send ${quantity}x ${selectedGift.name} to ${recipientName}?\n\nTotal Cost: ${totalCost.toLocaleString()} Rabit Coins`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Gift",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            sendGiftMutation.mutate();
          },
        },
      ]
    );
  };

  const renderGiftItem = ({ item }: { item: GiftType }) => {
    const isSelected = selectedGift?.id === item.id;
    return (
      <Pressable
        style={[
          styles.giftItem,
          {
            backgroundColor: isSelected
              ? "rgba(139, 92, 246, 0.3)"
              : "rgba(255, 255, 255, 0.05)",
            borderColor: isSelected ? theme.primary : "rgba(255, 255, 255, 0.1)",
          },
        ]}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setSelectedGift(item);
        }}
      >
        <Image
          source={{ uri: item.iconUrl }}
          style={styles.giftIcon}
          contentFit="contain"
        />
        <ThemedText style={styles.giftName} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <View style={styles.giftCostRow}>
          <Feather name="circle" size={12} color="#FFD700" />
          <ThemedText style={styles.giftCost}>{item.coinCost.toLocaleString()}</ThemedText>
        </View>
      </Pressable>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          {Platform.OS === "ios" ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.blurOverlay} />
            </BlurView>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.recipientInfo}>
              <Avatar uri={recipientAvatar} size={40} />
              <View style={styles.recipientText}>
                <ThemedText style={styles.sendingTo}>Sending gift to</ThemedText>
                <ThemedText style={styles.recipientName}>{recipientName}</ThemedText>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.walletInfo}>
            <Feather name="circle" size={16} color="#FFD700" />
            <ThemedText style={styles.walletBalance}>
              {wallet?.balance?.toLocaleString() || 0} Rabit Coins
            </ThemedText>
          </View>

          {loadingGifts ? (
            <View style={styles.loading}>
              <LoadingIndicator size="large" />
            </View>
          ) : (
            <FlatList
              data={giftTypes}
              keyExtractor={(item) => item.id}
              numColumns={4}
              renderItem={renderGiftItem}
              contentContainerStyle={styles.giftGrid}
              showsVerticalScrollIndicator={false}
              scrollIndicatorInsets={{ bottom: insets.bottom }}
            />
          )}

          {selectedGift ? (
            <View style={styles.selectionDetails}>
              <View style={styles.quantityRow}>
                <ThemedText style={styles.quantityLabel}>Quantity:</ThemedText>
                <View style={styles.quantityControls}>
                  <Pressable
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Feather name="minus" size={18} color="#fff" />
                  </Pressable>
                  <ThemedText style={styles.quantityValue}>{quantity}</ThemedText>
                  <Pressable
                    style={styles.quantityBtn}
                    onPress={() => setQuantity(Math.min(100, quantity + 1))}
                  >
                    <Feather name="plus" size={18} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total:</ThemedText>
                <View style={styles.totalValue}>
                  <Feather name="circle" size={16} color="#FFD700" />
                  <ThemedText style={styles.totalCoins}>
                    {totalCost.toLocaleString()}
                  </ThemedText>
                </View>
              </View>

              <GlassButton
                title={sendGiftMutation.isPending ? "Sending..." : `Send ${selectedGift.name}`}
                onPress={handleSend}
                disabled={!canAfford || sendGiftMutation.isPending}
                style={!canAfford ? { ...styles.sendButton, opacity: 0.5 } : styles.sendButton}
              />
              {!canAfford && (
                <ThemedText style={styles.insufficientText}>
                  Insufficient coins
                </ThemedText>
              )}
            </View>
          ) : (
            <View style={styles.selectPrompt}>
              <ThemedText style={styles.selectPromptText}>
                Select a gift to send
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 20, 30, 0.85)",
  },
  androidBackground: {
    backgroundColor: "rgba(20, 20, 30, 0.98)",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  recipientText: {
    gap: 2,
  },
  sendingTo: {
    fontSize: 12,
    opacity: 0.6,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  walletInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  walletBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFD700",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  giftGrid: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  giftItem: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.sm,
    margin: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    minWidth: (SCREEN_WIDTH - Spacing.lg * 2 - 32) / 4,
    maxWidth: (SCREEN_WIDTH - Spacing.lg * 2 - 32) / 4,
  },
  giftIcon: {
    width: 40,
    height: 40,
    marginBottom: Spacing.xs,
  },
  giftName: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 2,
  },
  giftCostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  giftCost: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFD700",
  },
  selectionDetails: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quantityBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: "700",
    minWidth: 40,
    textAlign: "center",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  totalCoins: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFD700",
  },
  sendButton: {
    marginBottom: Spacing.xs,
  },
  insufficientText: {
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
  },
  selectPrompt: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  selectPromptText: {
    fontSize: 14,
    opacity: 0.6,
  },
});
