import React from "react";
import { View, StyleSheet, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Gradients } from "@/constants/theme";

interface AvatarProps {
  uri?: string | null;
  size?: number;
  showStoryRing?: boolean;
  storyViewed?: boolean;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  glowEffect?: boolean;
}

export function Avatar({ 
  uri, 
  size = 48, 
  showStoryRing = false,
  storyViewed = false,
  showOnlineIndicator = false,
  isOnline = false,
  glowEffect = false,
}: AvatarProps) {
  const { theme, isDark } = useTheme();
  
  const ringWidth = size > 64 ? 3 : 2;
  const gapWidth = size > 64 ? 3 : 2;
  const outerSize = showStoryRing ? size + (ringWidth + gapWidth) * 2 : size;
  
  const onlineIndicatorSize = Math.max(12, size * 0.25);

  const renderAvatar = () => (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isDark ? theme.backgroundSecondary : theme.backgroundDefault,
        },
      ]}
    >
      <Image
        source={
          uri
            ? { uri }
            : require("../../assets/images/default-avatar.png")
        }
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        resizeMode="cover"
      />
    </View>
  );

  if (showStoryRing) {
    return (
      <View style={[styles.storyRingWrapper, { width: outerSize, height: outerSize }]}>
        {storyViewed ? (
          <View
            style={[
              styles.storyRingViewed,
              {
                width: outerSize,
                height: outerSize,
                borderRadius: outerSize / 2,
                borderWidth: ringWidth,
                borderColor: theme.textTertiary,
              },
            ]}
          >
            <View style={{ width: gapWidth }} />
            {renderAvatar()}
          </View>
        ) : (
          <LinearGradient
            colors={Gradients.story}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.storyRingGradient,
              {
                width: outerSize,
                height: outerSize,
                borderRadius: outerSize / 2,
                padding: ringWidth,
              },
            ]}
          >
            <View
              style={[
                styles.storyRingInner,
                {
                  width: outerSize - ringWidth * 2,
                  height: outerSize - ringWidth * 2,
                  borderRadius: (outerSize - ringWidth * 2) / 2,
                  backgroundColor: theme.backgroundRoot,
                  padding: gapWidth,
                },
              ]}
            >
              {renderAvatar()}
            </View>
          </LinearGradient>
        )}
        
        {showOnlineIndicator ? (
          <View
            style={[
              styles.onlineIndicator,
              {
                width: onlineIndicatorSize,
                height: onlineIndicatorSize,
                borderRadius: onlineIndicatorSize / 2,
                backgroundColor: isOnline ? theme.success : theme.textTertiary,
                borderColor: theme.backgroundRoot,
                borderWidth: 2,
                right: 0,
                bottom: 0,
              },
            ]}
          />
        ) : null}
      </View>
    );
  }

  const glowShadow = glowEffect ? {
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 0,
  } : {};

  return (
    <View style={[styles.container, { width: size, height: size }, glowShadow]}>
      <View
        style={[
          styles.borderWrapper,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: isDark ? theme.glassBorder : theme.border,
          },
        ]}
      >
        {renderAvatar()}
      </View>
      
      {showOnlineIndicator ? (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineIndicatorSize,
              height: onlineIndicatorSize,
              borderRadius: onlineIndicatorSize / 2,
              backgroundColor: isOnline ? theme.success : theme.textTertiary,
              borderColor: theme.backgroundRoot,
              borderWidth: 2,
              right: -2,
              bottom: -2,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export function GradientAvatar({ 
  uri, 
  size = 48,
  glowEffect = false,
}: { 
  uri?: string | null; 
  size?: number;
  glowEffect?: boolean;
}) {
  const { theme, isDark } = useTheme();
  
  const borderWidth = size > 64 ? 3 : 2;
  const outerSize = size + borderWidth * 2;

  const glowShadow = glowEffect ? {
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  } : {};

  return (
    <View style={[styles.gradientWrapper, glowShadow]}>
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientBorder,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            padding: borderWidth,
          },
        ]}
      >
        <View
          style={[
            styles.avatarContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isDark ? theme.backgroundSecondary : theme.backgroundDefault,
            },
          ]}
        >
          <Image
            source={
              uri
                ? { uri }
                : require("../../assets/images/default-avatar.png")
            }
            style={[
              styles.image,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            resizeMode="cover"
          />
        </View>
      </LinearGradient>
    </View>
  );
}

export function AnimatedStoryAvatar({ 
  uri, 
  size = 64,
}: { 
  uri?: string | null; 
  size?: number;
}) {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const borderWidth = 3;
  const gapWidth = 3;
  const outerSize = size + (borderWidth + gapWidth) * 2;

  return (
    <View style={[styles.animatedWrapper, { width: outerSize, height: outerSize }]}>
      <Animated.View style={[styles.animatedGradientContainer, { width: outerSize, height: outerSize }, animatedStyle]}>
        <LinearGradient
          colors={[...Gradients.story, Gradients.story[0]]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.animatedGradient,
            {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
            },
          ]}
        />
      </Animated.View>
      
      <View
        style={[
          styles.animatedInner,
          {
            width: outerSize - borderWidth * 2,
            height: outerSize - borderWidth * 2,
            borderRadius: (outerSize - borderWidth * 2) / 2,
            backgroundColor: theme.backgroundRoot,
            padding: gapWidth,
          },
        ]}
      >
        <View
          style={[
            styles.avatarContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.backgroundSecondary,
            },
          ]}
        >
          <Image
            source={
              uri
                ? { uri }
                : require("../../assets/images/default-avatar.png")
            }
            style={[
              styles.image,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            resizeMode="cover"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  borderWrapper: {
    overflow: "hidden",
  },
  avatarContainer: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  storyRingWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  storyRingGradient: {
    alignItems: "center",
    justifyContent: "center",
  },
  storyRingInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  storyRingViewed: {
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
  },
  gradientWrapper: {},
  gradientBorder: {
    alignItems: "center",
    justifyContent: "center",
  },
  animatedWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  animatedGradientContainer: {
    position: "absolute",
  },
  animatedGradient: {},
  animatedInner: {
    alignItems: "center",
    justifyContent: "center",
  },
});
