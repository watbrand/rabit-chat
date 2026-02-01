import React, { useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  ViewStyle,
  Pressable,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Haptics from "@/lib/safeHaptics";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Gradients, Animation, BorderRadius, Spacing, Colors, Shadows } from "@/constants/theme";
import { ThemedText } from "./ThemedText";
import { Image } from "expo-image";
import VerifiedBadge from "./VerifiedBadge";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.2;
const MAX_ROTATION = 15;

interface TiltProfileCardProps {
  user: {
    id: number;
    username: string;
    displayName: string;
    bio?: string;
    avatar?: string;
    coverPhoto?: string;
    netWorth?: number;
    influenceScore?: number;
    isVerified?: boolean;
    followersCount?: number;
    followingCount?: number;
  };
  onPress?: () => void;
  style?: ViewStyle;
}

export default function TiltProfileCard({
  user,
  onPress,
  style,
}: TiltProfileCardProps) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const glareOpacity = useSharedValue(0);

  const cardCenter = useMemo(
    () => ({ x: CARD_WIDTH / 2, y: CARD_HEIGHT / 2 }),
    []
  );

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      scale.value = withSpring(1.02, Animation.spring);
      glareOpacity.value = withSpring(0.3, Animation.spring);
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      const offsetX = event.x - cardCenter.x;
      const offsetY = event.y - cardCenter.y;

      rotateY.value = interpolate(
        offsetX,
        [-cardCenter.x, cardCenter.x],
        [-MAX_ROTATION, MAX_ROTATION]
      );
      rotateX.value = interpolate(
        offsetY,
        [-cardCenter.y, cardCenter.y],
        [MAX_ROTATION, -MAX_ROTATION]
      );
    })
    .onFinalize(() => {
      rotateX.value = withSpring(0, Animation.springGentle);
      rotateY.value = withSpring(0, Animation.springGentle);
      scale.value = withSpring(1, Animation.spring);
      glareOpacity.value = withSpring(0, Animation.spring);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (onPress) {
      runOnJS(onPress)();
    }
    runOnJS(triggerHaptic)();
  });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { scale: scale.value },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const glareAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glareOpacity.value,
    transform: [
      { translateX: rotateY.value * 10 },
      { translateY: -rotateX.value * 10 },
    ],
  }));

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `R${(num / 1000000000).toFixed(1)}B`;
    }
    if (num >= 1000000) {
      return `R${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `R${(num / 1000).toFixed(0)}K`;
    }
    return `R${num}`;
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, cardAnimatedStyle, style]}>
        <View style={styles.card}>
          <Image
            source={{
              uri:
                user.coverPhoto ||
                "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600",
            }}
            style={styles.coverImage}
            contentFit="cover"
          />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)", "#0A0A0F"]}
            style={styles.coverGradient}
          />

          <Animated.View style={[styles.glareOverlay, glareAnimatedStyle]}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.4)",
                "rgba(255,255,255,0.1)",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <View style={styles.content}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[...Gradients.primary]}
                style={styles.avatarBorder}
              >
                <View style={styles.avatarInner}>
                  <Image
                    source={{
                      uri:
                        user.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/png?seed=${user.username}`,
                    }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                </View>
              </LinearGradient>
              {user.isVerified ? (
                <View style={styles.verifiedBadge}>
                  <VerifiedBadge size={18} />
                </View>
              ) : null}
            </View>

            <View style={styles.displayNameRow}>
              <ThemedText style={styles.displayName}>
                {user.displayName}
              </ThemedText>
              {user.isVerified ? <VerifiedBadge size={16} /> : null}
            </View>
            <ThemedText style={styles.username}>@{user.username}</ThemedText>

            {user.bio && (
              <ThemedText style={styles.bio} numberOfLines={2}>
                {user.bio}
              </ThemedText>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <LinearGradient
                  colors={[...Gradients.gold]}
                  style={styles.statBadge}
                >
                  <Ionicons name="diamond" size={14} color="#0A0A0F" />
                  <ThemedText style={styles.statValue}>
                    {formatNumber(user.netWorth || 0)}
                  </ThemedText>
                </LinearGradient>
              </View>

              <View style={styles.statItem}>
                <BlurView intensity={20} style={styles.statBadge}>
                  <Ionicons name="star" size={14} color="#FFFFFF" />
                  <ThemedText style={styles.statValue}>
                    {user.influenceScore || 0}
                  </ThemedText>
                </BlurView>
              </View>
            </View>

            <View style={styles.followStats}>
              <View style={styles.followItem}>
                <ThemedText style={styles.followCount}>
                  {user.followersCount?.toLocaleString() || "0"}
                </ThemedText>
                <ThemedText style={styles.followLabel}>Followers</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.followItem}>
                <ThemedText style={styles.followCount}>
                  {user.followingCount?.toLocaleString() || "0"}
                </ThemedText>
                <ThemedText style={styles.followLabel}>Following</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: "center",
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundDefault,
    ...Shadows.lg,
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  coverGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glareOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    alignItems: "center",
  },
  avatarContainer: {
    marginTop: -50,
    marginBottom: Spacing.sm,
  },
  avatarBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 48,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundDefault,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Colors.dark.backgroundDefault,
    overflow: "hidden",
  },
  verifiedGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  displayNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  username: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  bio: {
    fontSize: 13,
    color: Colors.dark.textTertiary,
    textAlign: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statItem: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  followStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  followItem: {
    alignItems: "center",
  },
  followCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  followLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.dark.border,
  },
});
