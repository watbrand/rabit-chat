import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  TextInputProps,
  Pressable,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation, Gradients } from "@/constants/theme";

interface GlassInputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: "default" | "premium";
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function GlassInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  variant = "default",
  ...textInputProps
}: GlassInputProps) {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withSpring(1, Animation.spring);
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withSpring(0, Animation.spring);
    textInputProps.onBlur?.(e);
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        isDark ? "rgba(139, 92, 246, 0.20)" : "rgba(255, 255, 255, 0.6)",
        theme.primary,
      ]
    );
    
    const shadowOpacity = interpolate(focusProgress.value, [0, 1], [0, 0.35]);
    const scale = interpolate(focusProgress.value, [0, 1], [1, 1.01]);

    return {
      borderColor,
      shadowOpacity,
      transform: [{ scale }],
    };
  });

  const hasError = !!error;

  const isPremium = variant === "premium";

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <ThemedText style={[styles.label, { color: isFocused ? theme.primary : theme.textSecondary }]} weight="medium">
          {label}
        </ThemedText>
      ) : null}

      <AnimatedView
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? isPremium ? "rgba(26, 26, 36, 0.80)" : "rgba(255, 255, 255, 0.06)"
              : isPremium ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.85)",
            shadowColor: theme.primary,
          },
          animatedBorderStyle,
          hasError && {
            borderColor: theme.error,
          },
        ]}
      >
        {leftIcon ? (
          <Feather
            name={leftIcon as any}
            size={20}
            color={isFocused ? theme.primary : theme.textSecondary}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            {
              color: theme.text,
              paddingLeft: leftIcon ? 0 : Spacing.lg,
              paddingRight: rightIcon ? 0 : Spacing.lg,
            },
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.primary}
        />

        {rightIcon ? (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather
              name={rightIcon as any}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </AnimatedView>

      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export function GlassTextArea({
  label,
  error,
  containerStyle,
  variant = "default",
  ...textInputProps
}: GlassInputProps) {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withSpring(1, Animation.spring);
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withSpring(0, Animation.spring);
    textInputProps.onBlur?.(e);
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        isDark ? "rgba(139, 92, 246, 0.20)" : "rgba(0, 0, 0, 0.1)",
        theme.primary,
      ]
    );
    
    const shadowOpacity = interpolate(focusProgress.value, [0, 1], [0, 0.3]);

    return {
      borderColor,
      shadowOpacity,
    };
  });

  const isPremium = variant === "premium";

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <ThemedText style={[styles.label, { color: isFocused ? theme.primary : theme.textSecondary }]} weight="medium">
          {label}
        </ThemedText>
      ) : null}

      <AnimatedView
        style={[
          styles.textAreaContainer,
          {
            backgroundColor: isDark
              ? isPremium ? "rgba(26, 26, 36, 0.80)" : "rgba(255, 255, 255, 0.06)"
              : isPremium ? "rgba(255, 255, 255, 0.92)" : "rgba(255, 255, 255, 0.85)",
            shadowColor: theme.primary,
          },
          animatedBorderStyle,
          error && { borderColor: theme.error },
        ]}
      >
        <TextInput
          {...textInputProps}
          multiline
          textAlignVertical="top"
          style={[
            styles.textArea,
            {
              color: theme.text,
            },
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.primary}
        />
      </AnimatedView>

      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export function GradientBorderInput({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...textInputProps
}: GlassInputProps) {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withSpring(1, Animation.spring);
    textInputProps.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withSpring(0, Animation.spring);
    textInputProps.onBlur?.(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(focusProgress.value, [0, 1], [0.4, 1]);
    return { opacity };
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <ThemedText style={[styles.label, { color: isFocused ? theme.primary : theme.textSecondary }]} weight="medium">
          {label}
        </ThemedText>
      ) : null}

      <View style={styles.gradientInputWrapper}>
        <Animated.View style={[styles.gradientBorderContainer, animatedStyle]}>
          <LinearGradient
            colors={error ? [theme.error, theme.error] : Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          />
        </Animated.View>
        
        <View
          style={[
            styles.gradientInputInner,
            {
              backgroundColor: isDark ? "#121218" : "#FFFFFF",
            },
          ]}
        >
          {leftIcon ? (
            <Feather
              name={leftIcon as any}
              size={20}
              color={isFocused ? theme.primary : theme.textSecondary}
              style={styles.leftIcon}
            />
          ) : null}

          <TextInput
            {...textInputProps}
            style={[
              styles.input,
              {
                color: theme.text,
                paddingLeft: leftIcon ? 0 : Spacing.lg,
                paddingRight: rightIcon ? 0 : Spacing.lg,
              },
            ]}
            placeholderTextColor={theme.textTertiary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor={theme.primary}
          />

          {rightIcon ? (
            <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
              <Feather
                name={rightIcon as any}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
      },
    }),
  },
  leftIcon: {
    marginLeft: Spacing.lg,
  },
  rightIcon: {
    padding: Spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  textAreaContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    minHeight: 140,
    padding: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
      },
    }),
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  errorText: {
    fontSize: 13,
  },
  gradientInputWrapper: {
    position: "relative",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  gradientBorderContainer: {
    ...StyleSheet.absoluteFillObject,
    padding: 2,
  },
  gradientBorder: {
    flex: 1,
    borderRadius: BorderRadius.lg,
  },
  gradientInputInner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg - 2,
    minHeight: 50,
    margin: 2,
  },
});
