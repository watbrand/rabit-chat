import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  ScrollView,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
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
  const insets = useSafeAreaInsets();
  const [mallUsers, setMallUsers] = useState<MallUser[]>([]);
  const [myPosition, setMyPosition] = useState({ x: 50, y: 85 });
  const [wsConnected, setWsConnected] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const isMountedRef = useRef(true);
  
  const shopPositions = React.useMemo(
    () => generateShopPositions(categories),
    [categories]
  );

  const positionX = useSharedValue(myPosition.x);
  const positionY = useSharedValue(myPosition.y);
  const isWalking = useSharedValue(false);

  const cleanupWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!user) return;

    enterMall();
    connectWebSocket();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && user) {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connectWebSocket();
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      isMountedRef.current = false;
      leaveMall();
      cleanupWebSocket();
      cancelAnimation(positionX);
      cancelAnimation(positionY);
      subscription.remove();
    };
  }, [user?.id]);

  const enterMall = async () => {
    if (!isMountedRef.current) return;
    setIsEntering(true);
    setError(null);
    try {
      await apiRequest("POST", "/api/mall/presence/enter", {
        positionX: myPosition.x,
        positionY: myPosition.y,
      });
    } catch (err) {
      console.error("Failed to enter mall:", err);
      if (isMountedRef.current) {
        setError("Failed to enter the mall. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsEntering(false);
      }
    }
  };

  const leaveMall = async () => {
    try {
      await apiRequest("POST", "/api/mall/presence/leave", {});
    } catch (err) {
      console.error("Failed to leave mall:", err);
    }
  };

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log("[VirtualMall] Max reconnect attempts reached");
      setError("Connection lost. Please exit and re-enter the mall.");
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    console.log(`[VirtualMall] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        reconnectAttemptsRef.current += 1;
        connectWebSocket();
      }
    }, delay);
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!isMountedRef.current || !user) return;
    
    cleanupWebSocket();
    
    try {
      const baseUrl = getApiUrl();
      const wsUrl = baseUrl.replace("https://", "wss://").replace("http://", "ws://");
      const separator = wsUrl.endsWith("/") ? "" : "/";
      const fullWsUrl = `${wsUrl}${separator}ws?channel=mall&userId=${user.id}`;
      const ws = new WebSocket(fullWsUrl);
      
      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        console.log("[VirtualMall] WebSocket connected");
        setWsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case "mall_presence_update":
              setMallUsers(data.users || []);
              break;
            case "auth_success":
              console.log("[VirtualMall] Auth success");
              break;
            case "auth_error":
              console.error("[VirtualMall] Auth error:", data.message);
              setError("Authentication failed. Please re-enter the mall.");
              break;
            case "pong":
              break;
            default:
              break;
          }
        } catch (e) {
          console.error("[VirtualMall] Failed to parse message:", e);
        }
      };

      ws.onerror = (event) => {
        console.error("[VirtualMall] WebSocket error:", event);
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        console.log("[VirtualMall] WebSocket closed:", event.code, event.reason);
        setWsConnected(false);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect();
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("[VirtualMall] Failed to connect WebSocket:", err);
      scheduleReconnect();
    }
  }, [user, cleanupWebSocket, scheduleReconnect]);

  const lastPositionUpdateRef = useRef<number>(0);
  const positionUpdateDebounceMs = 500;
  
  const updatePosition = useCallback(async (x: number, y: number, shopId?: string) => {
    const now = Date.now();
    if (now - lastPositionUpdateRef.current < positionUpdateDebounceMs) {
      return;
    }
    lastPositionUpdateRef.current = now;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    try {
      await apiRequest("POST", "/api/mall/presence/move", {
        positionX: clampedX,
        positionY: clampedY,
        currentShopId: shopId || null,
      });
    } catch (err) {
      console.error("Failed to update position:", err);
    }
  }, []);

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

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.error }]}>
              <Feather name="alert-circle" size={16} color="#fff" />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <Pressable 
                onPress={() => setError(null)}
                accessibilityLabel="Dismiss error"
                accessibilityRole="button"
              >
                <Feather name="x" size={16} color="#fff" />
              </Pressable>
            </View>
          ) : null}

          {isEntering ? (
            <View style={styles.loadingOverlay}>
              <View style={[styles.loadingBox, { backgroundColor: theme.glassBackground }]}>
                <ThemedText style={{ color: theme.textSecondary }}>
                  Entering mall...
                </ThemedText>
              </View>
            </View>
          ) : null}

          <View style={styles.mallFloor}>
            <View
              style={[
                styles.floorPattern,
                { borderColor: isDark ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.15)" },
              ]}
            />
          </View>

          <View style={[styles.mallTitle, { paddingTop: insets.top + Spacing.md }]}>
            <Feather
              name="award"
              size={24}
              color={theme.gold}
            />
            <ThemedText style={styles.mallTitleText} weight="bold">
              RabitChat Luxury Mall
            </ThemedText>
            {wsConnected ? (
              <View style={[styles.connectionBadge, { backgroundColor: theme.success }]}>
                <ThemedText style={styles.connectionText}>Live</ThemedText>
              </View>
            ) : null}
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
                accessibilityLabel={`Enter ${category.name} shop`}
                accessibilityRole="button"
                accessibilityHint="Double tap to browse items in this shop"
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

          <View style={[styles.instructions, { paddingBottom: insets.bottom + Spacing.md }]}>
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
  errorBanner: {
    position: "absolute",
    top: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 150,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  loadingBox: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  connectionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  connectionText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },
});

export default VirtualMallView;
