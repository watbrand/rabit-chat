import React, { useState, useCallback, useRef } from "react";
import { StyleSheet, View, TextInput, Pressable, Platform, Keyboard } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Haptics from "@/lib/safeHaptics";
import { Animation, BorderRadius, Spacing } from "@/constants/theme";

interface AnimatedSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function AnimatedSearchBar({
  placeholder = "Search...",
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  autoFocus = false,
}: AnimatedSearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const expandProgress = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleFocus = useCallback(() => {
    triggerHaptic();
    setIsFocused(true);
    expandProgress.value = withSpring(1, Animation.springBouncy);
    iconScale.value = withSpring(0.9, Animation.spring);
    glowOpacity.value = withTiming(1, { duration: 200 });
    onFocus?.();
  }, [onFocus, triggerHaptic]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    expandProgress.value = withSpring(0, Animation.spring);
    iconScale.value = withSpring(1, Animation.spring);
    glowOpacity.value = withTiming(0, { duration: 200 });
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(() => {
    triggerHaptic();
    onChangeText("");
    inputRef.current?.focus();
  }, [onChangeText, triggerHaptic]);

  const handleCancel = useCallback(() => {
    triggerHaptic();
    onChangeText("");
    Keyboard.dismiss();
    handleBlur();
  }, [onChangeText, triggerHaptic, handleBlur]);

  const containerStyle = useAnimatedStyle(() => {
    const borderWidth = interpolate(expandProgress.value, [0, 1], [1, 2]);
    
    return {
      borderWidth,
      borderColor: `rgba(139, 92, 246, ${interpolate(expandProgress.value, [0, 1], [0.2, 0.6])})`,
    };
  });

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cancelButtonStyle = useAnimatedStyle(() => {
    const width = interpolate(expandProgress.value, [0, 1], [0, 60]);
    const opacity = expandProgress.value;
    
    return { width, opacity };
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.glow, glowStyle]} />
        {Platform.OS === "ios" ? (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.content}>
          <Animated.View style={iconStyle}>
            <Ionicons
              name="search"
              size={20}
              color={isFocused ? "#8B5CF6" : "rgba(255, 255, 255, 0.5)"}
            />
          </Animated.View>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={onSubmit}
            autoFocus={autoFocus}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {value.length > 0 ? (
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="rgba(255, 255, 255, 0.5)" />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
      <Animated.View style={[styles.cancelContainer, cancelButtonStyle]}>
        <Pressable onPress={handleCancel}>
          <Animated.Text style={styles.cancelText}>Cancel</Animated.Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "rgba(30, 30, 45, 0.8)",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    height: "100%",
  },
  clearButton: {
    padding: 4,
  },
  cancelContainer: {
    overflow: "hidden",
    marginLeft: Spacing.sm,
  },
  cancelText: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "500",
  },
});
