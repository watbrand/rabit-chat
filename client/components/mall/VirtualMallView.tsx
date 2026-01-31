import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Avatar } from "@/components/Avatar";
import { UserMallAvatar } from "./UserMallAvatar";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MALL_WIDTH = SCREEN_WIDTH * 2;
const MALL_HEIGHT = SCREEN_HEIGHT * 1.5;

type Category = {
  id: string;
  name: string;
  icon?: string;
};

type MallUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  netWorth: number;
  positionX: number;
  positionY: number;
  currentShopId: string | null;
};

interface ShopPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SHOP_ICONS: Record<string, string> = {
  "Luxury Cars": "car",
  "Real Estate": "home",
  "Jewelry": "diamond",
  "Art & Collectibles": "image",
  "Watches": "watch",
  "Fashion": "shopping-bag",
  "Tech & Gadgets": "smartphone",
  "Travel & Experiences": "map-pin",
  "Wine & Spirits": "coffee",
  "Yachts & Jets": "navigation",
};

function getShopIcon(name: string): keyof typeof Feather.glyphMap {
  const key = Object.keys(SHOP_ICONS).find(k => 
    name.toLowerCase().includes(k.toLowerCase())
  );
  return (key ? SHOP_ICONS[key] : "shopping-bag") as keyof typeof Feather.glyphMap;
}

function generateShopPositions(categories: Category[]): Record<string, ShopPosition> {
  const positions: Record<string, ShopPosition> = {};
  const cols = 3;
  const shopWidth = 28;
  const shopHeight = 22;
  const startX = 10;
  const startY = 20;
  const gapX = 25;
  const gapY = 28;

  categories.forEach((cat, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    positions[cat.id] = {
      x: startX + col * gapX,
      y: startY + row * gapY,
      width: shopWidth,
      height: shopHeight,
    };
  });

  return positions;
}

interface VirtualMallViewProps {
  categories: Category[];
  onShopEnter: (categoryId: string) => void;
  onUserPress: (userId: string) => void;
}

export function VirtualMallView({
  categories,
  onShopEnter,
  onUserPress,
}: VirtualMallViewProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [mallUsers, setMallUsers] = useState<MallUser[]>([]);
  const [myPosition, setMyPosition] = useState({ x: 50, y: 85 });
  const wsRef = useRef<WebSocket | null>(null);
  
  const shopPositions = React.useMemo(
    () => generateShopPositions(categories),
    [categories]
  );

  const positionX = useSharedValue(myPosition.x);
  const positionY = useSharedValue(myPosition.y);
  const isWalking = useSharedValue(false);

  useEffect(() => {
    if (!user) return;

    enterMall();
    connectWebSocket();

    return () => {
      leaveMall();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.id]);

  const enterMall = async () => {
    try {
      await apiRequest("POST", "/api/mall/presence/enter", {
        positionX: myPosition.x,
        positionY: myPosition.y,
      });
    } catch (error) {
      console.error("Failed to enter mall:", error);
    }
  };

  const leaveMall = async () => {
    try {
      await apiRequest("POST", "/api/mall/presence/leave", {});
    } catch (error) {
      console.error("Failed to leave mall:", error);
    }
  };

  const connectWebSocket = () => {
    try {
      const baseUrl = getApiUrl();
      const wsUrl = baseUrl.replace("https://", "wss://").replace("http://", "ws://");
      // Ensure proper URL construction with /ws path
      const separator = wsUrl.endsWith("/") ? "" : "/";
      const fullWsUrl = `${wsUrl}${separator}ws?channel=mall${user?.id ? `&userId=${user.id}` : ""}`;
      const ws = new WebSocket(fullWsUrl);
      
      ws.onopen = () => {
        console.log("[VirtualMall] WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "mall_presence_update") {
            setMallUsers(data.users || []);
          }
        } catch (e) {
          console.error("[VirtualMall] Failed to parse message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[VirtualMall] WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("[VirtualMall] WebSocket closed");
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[VirtualMall] Failed to connect WebSocket:", error);
    }
  };

  const updatePosition = async (x: number, y: number, shopId?: string) => {
    try {
      await apiRequest("POST", "/api/mall/presence/move", {
        positionX: x,
        positionY: y,
        currentShopId: shopId || null,
      });
    } catch (error) {
      console.error("Failed to update position:", error);
    }
  };

  const handleMallTap = useCallback((x: number, y: number) => {
    const mallX = (x / SCREEN_WIDTH) * 100;
    const mallY = (y / MALL_HEIGHT) * 100;

    const clampedX = Math.max(5, Math.min(95, mallX));
    const clampedY = Math.max(15, Math.min(90, mallY));

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    isWalking.value = true;
    const duration = Math.sqrt(
      Math.pow(clampedX - positionX.value, 2) + 
      Math.pow(clampedY - positionY.value, 2)
    ) * 20;

    positionX.value = withTiming(clampedX, { 
      duration: Math.min(duration, 1500),
      easing: Easing.out(Easing.quad),
    });
    positionY.value = withTiming(clampedY, { 
      duration: Math.min(duration, 1500),
      easing: Easing.out(Easing.quad),
    }, () => {
      isWalking.value = false;
      runOnJS(setMyPosition)({ x: clampedX, y: clampedY });
      runOnJS(updatePosition)(clampedX, clampedY);
    });

    let enteredShop: string | null = null;
    Object.entries(shopPositions).forEach(([shopId, pos]) => {
      if (
        clampedX >= pos.x &&
        clampedX <= pos.x + pos.width &&
        clampedY >= pos.y &&
        clampedY <= pos.y + pos.height
      ) {
        enteredShop = shopId;
      }
    });

    if (enteredShop) {
      setTimeout(() => {
        onShopEnter(enteredShop!);
      }, Math.min(duration, 1500) + 200);
    }
  }, [shopPositions, onShopEnter]);

  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      runOnJS(handleMallTap)(event.x, event.y);
    });

  const myAvatarStyle = useAnimatedStyle(() => ({
    left: `${positionX.value}%`,
    top: `${positionY.value}%`,
  }));

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <GestureDetector gesture={tapGesture}>
        <ThemedView
          style={[
            styles.mallContainer,
            { backgroundColor: isDark ? "#1a1625" : "#f0e6ff" },
          ]}
        >
          <LinearGradient
            colors={isDark 
              ? ["#2d1b4e", "#1a1625", "#1f1a2e"]
              : ["#e8d5ff", "#f0e6ff", "#fff5ff"]
            }
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.mallFloor}>
            <View
              style={[
                styles.floorPattern,
                { borderColor: isDark ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.15)" },
              ]}
            />
          </View>

          <View style={styles.mallTitle}>
            <Feather
              name="award"
              size={24}
              color={theme.gold}
            />
            <ThemedText style={styles.mallTitleText} weight="bold">
              RabitChat Luxury Mall
            </ThemedText>
          </View>

          {categories.map((category) => {
            const pos = shopPositions[category.id];
            if (!pos) return null;

            return (
              <Pressable
                key={category.id}
                style={[
                  styles.shop,
                  {
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    width: `${pos.width}%`,
                  },
                ]}
                onPress={() => onShopEnter(category.id)}
                testID={`shop-${category.id}`}
              >
                <LinearGradient
                  colors={isDark
                    ? ["rgba(139, 92, 246, 0.3)", "rgba(88, 28, 135, 0.4)"]
                    : ["rgba(255, 255, 255, 0.9)", "rgba(233, 213, 255, 0.8)"]
                  }
                  style={styles.shopBuilding}
                >
                  <View style={styles.shopRoof}>
                    <LinearGradient
                      colors={[theme.primary, theme.primaryDark || "#6d28d9"]}
                      style={styles.roofGradient}
                    />
                  </View>

                  <View style={styles.shopFront}>
                    <View
                      style={[
                        styles.shopIcon,
                        { backgroundColor: isDark ? "rgba(0,0,0,0.3)" : "rgba(139, 92, 246, 0.15)" },
                      ]}
                    >
                      <Feather
                        name={getShopIcon(category.name)}
                        size={24}
                        color={theme.primary}
                      />
                    </View>
                    <ThemedText style={styles.shopName} numberOfLines={2} weight="semiBold">
                      {category.name}
                    </ThemedText>
                  </View>

                  <View style={[styles.shopDoor, { backgroundColor: theme.primary }]}>
                    <Feather name="chevron-up" size={16} color="#fff" />
                    <ThemedText style={styles.enterText}>ENTER</ThemedText>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}

          {mallUsers
            .filter((u) => u.id !== user?.id)
            .map((mallUser) => (
              <UserMallAvatar
                key={mallUser.id}
                userId={mallUser.id}
                username={mallUser.username}
                displayName={mallUser.displayName}
                avatarUrl={mallUser.avatarUrl}
                netWorth={mallUser.netWorth}
                positionX={mallUser.positionX}
                positionY={mallUser.positionY}
                onPress={() => onUserPress(mallUser.id)}
              />
            ))}

          {user ? (
            <Animated.View style={[styles.myAvatar, myAvatarStyle]}>
              <UserMallAvatar
                userId={user.id}
                username={user.username}
                displayName={user.displayName || user.username}
                avatarUrl={user.avatarUrl}
                netWorth={user.netWorth || 0}
                positionX={0}
                positionY={0}
                isCurrentUser
              />
            </Animated.View>
          ) : null}

          <View style={styles.instructions}>
            <View style={[styles.instructionBadge, { backgroundColor: theme.glassBackground }]}>
              <Feather name="navigation" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.instructionText, { color: theme.textSecondary }]}>
                Tap to walk • Enter shops to browse
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </GestureDetector>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    minHeight: MALL_HEIGHT,
  },
  mallContainer: {
    width: SCREEN_WIDTH,
    minHeight: MALL_HEIGHT,
    position: "relative",
  },
  mallFloor: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  floorPattern: {
    position: "absolute",
    width: "200%",
    height: "200%",
    borderWidth: 1,
    transform: [{ rotate: "45deg" }, { translateX: -100 }, { translateY: -100 }],
  },
  mallTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  mallTitleText: {
    fontSize: 22,
    letterSpacing: 1,
  },
  shop: {
    position: "absolute",
    aspectRatio: 0.9,
  },
  shopBuilding: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.md,
  },
  shopRoof: {
    height: 16,
    overflow: "hidden",
  },
  roofGradient: {
    flex: 1,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  shopFront: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
  },
  shopIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  shopName: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  shopDoor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 4,
  },
  enterText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  myAvatar: {
    position: "absolute",
    zIndex: 100,
  },
  instructions: {
    position: "absolute",
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  instructionText: {
    fontSize: 12,
  },
});

export default VirtualMallView;
