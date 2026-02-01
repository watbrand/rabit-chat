import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, Platform, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Haptics from "@/lib/safeHaptics";
import { Gradients, BorderRadius, Animation } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FloatingFABProps {
  actions?: FABAction[];
  onMainPress?: () => void;
  bottomOffset?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FloatingFAB({
  actions = [],
  onMainPress,
  bottomOffset = 100,
}: FloatingFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const expandProgress = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const toggleMenu = useCallback(() => {
    triggerHaptic();
    const newState = !isOpen;
    setIsOpen(newState);
    
    rotation.value = withSpring(newState ? 45 : 0, Animation.springBouncy);
    expandProgress.value = withSpring(newState ? 1 : 0, Animation.spring);
  }, [isOpen, triggerHaptic]);

  const handleMainPress = useCallback(() => {
    if (actions.length > 0) {
      toggleMenu();
    } else {
      triggerHaptic();
      onMainPress?.();
    }
  }, [actions.length, toggleMenu, onMainPress, triggerHaptic]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, Animation.springBouncy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Animation.springBouncy);
  }, []);

  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value * 0.5,
    pointerEvents: expandProgress.value > 0 ? "auto" : "none",
  }));

  return (
    <>
      <Animated.View 
        style={[styles.backdrop, backdropStyle]} 
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleMenu} />
      </Animated.View>
      
      <View style={[styles.container, { bottom: bottomOffset }]} pointerEvents="box-none">
        {actions.map((action, index) => {
          const actionStyle = useAnimatedStyle(() => {
            const translateY = interpolate(
              expandProgress.value,
              [0, 1],
              [0, -(60 + index * 60)]
            );
            const opacity = expandProgress.value;
            const actionScale = interpolate(expandProgress.value, [0, 0.5, 1], [0, 0.5, 1]);
            
            return {
              transform: [{ translateY }, { scale: actionScale }],
              opacity,
            };
          });

          return (
            <Animated.View key={index} style={[styles.actionButton, actionStyle]}>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  action.onPress();
                  toggleMenu();
                }}
                style={styles.actionPressable}
              >
                <LinearGradient
                  colors={action.color ? [action.color, action.color] : [...Gradients.accent]}
                  style={styles.actionGradient}
                >
                  <Ionicons name={action.icon as any} size={22} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
        
        <AnimatedPressable
          onPress={handleMainPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.mainButton, mainButtonStyle]}
        >
          <LinearGradient
            colors={[...Gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    zIndex: 998,
  },
  container: {
    position: "absolute",
    right: 20,
    alignItems: "center",
    zIndex: 999,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    position: "absolute",
    bottom: 0,
  },
  actionPressable: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  actionGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
