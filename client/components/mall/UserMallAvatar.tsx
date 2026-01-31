import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface UserMallAvatarProps {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  netWorth: number;
  positionX: number;
  positionY: number;
  isCurrentUser?: boolean;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatNetWorth(value: number): string {
  if (value >= 1_000_000_000) return `R${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R${(value / 1_000).toFixed(1)}K`;
  return `R${value}`;
}

export function UserMallAvatar({
  userId,
  username,
  displayName,
  avatarUrl,
  netWorth,
  positionX,
  positionY,
  isCurrentUser = false,
  onPress,
}: UserMallAvatarProps) {
  const { theme, isDark } = useTheme();
  const bounce = useSharedValue(0);
  const scale = useSharedValue(1);
  const animatedX = useSharedValue(positionX);
  const animatedY = useSharedValue(positionY);

  React.useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    return () => {
      cancelAnimation(bounce);
      cancelAnimation(scale);
      cancelAnimation(animatedX);
      cancelAnimation(animatedY);
    };
  }, []);

  React.useEffect(() => {
    animatedX.value = withSpring(positionX, { damping: 15, stiffness: 100 });
    animatedY.value = withSpring(positionY, { damping: 15, stiffness: 100 });
  }, [positionX, positionY]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    left: `${animatedX.value}%`,
    top: `${animatedY.value}%`,
    transform: [
      { translateY: bounce.value },
      { scale: scale.value },
    ],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle]}
      testID={`mall-avatar-${userId}`}
      accessibilityLabel={`${displayName}'s avatar, net worth ${formatNetWorth(netWorth)}`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.nameTag,
          {
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.75)"
              : "rgba(255, 255, 255, 0.9)",
            borderColor: isCurrentUser ? theme.primary : theme.glassBorder,
          },
        ]}
      >
        <ThemedText
          style={[styles.username, isCurrentUser && { color: theme.primary }]}
          numberOfLines={1}
          weight="semiBold"
        >
          @{username}
        </ThemedText>
      </View>

      <View style={styles.avatarWrapper}>
        <View
          style={[
            styles.avatarBorder,
            {
              borderColor: isCurrentUser ? theme.primary : theme.gold,
              shadowColor: isCurrentUser ? theme.primary : theme.gold,
            },
          ]}
        >
          <Avatar uri={avatarUrl} size={48} />
        </View>

        <View
          style={[
            styles.netWorthBadge,
            { backgroundColor: theme.gold },
          ]}
        >
          <ThemedText style={styles.netWorthText} weight="bold">
            {formatNetWorth(netWorth)}
          </ThemedText>
        </View>
      </View>

      <LinearGradient
        colors={["transparent", isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)"]}
        style={styles.shadow}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -30 }, { translateY: -60 }],
    zIndex: 10,
  },
  nameTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: 4,
    maxWidth: 100,
  },
  username: {
    fontSize: 10,
    textAlign: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarBorder: {
    borderRadius: 28,
    borderWidth: 2,
    padding: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  netWorthBadge: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    transform: [{ translateX: -24 }],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 48,
    alignItems: "center",
  },
  netWorthText: {
    fontSize: 9,
    color: "#000",
  },
  shadow: {
    position: "absolute",
    bottom: -12,
    width: 40,
    height: 8,
    borderRadius: 20,
    opacity: 0.5,
  },
});

export default UserMallAvatar;
