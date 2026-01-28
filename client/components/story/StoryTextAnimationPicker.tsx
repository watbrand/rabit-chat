import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

export type TextAnimation = 'NONE' | 'TYPEWRITER' | 'FADE' | 'BOUNCE' | 'GLOW' | 'SPARKLE' | 'RAINBOW';

interface AnimationOption {
  id: TextAnimation;
  name: string;
  icon: keyof typeof Feather.glyphMap;
}

interface Props {
  selectedAnimation: TextAnimation;
  onAnimationSelect: (animation: TextAnimation) => void;
}

const ANIMATION_OPTIONS: AnimationOption[] = [
  { id: 'NONE', name: 'None', icon: 'minus' },
  { id: 'TYPEWRITER', name: 'Typewriter', icon: 'type' },
  { id: 'FADE', name: 'Fade In', icon: 'eye' },
  { id: 'BOUNCE', name: 'Bounce', icon: 'arrow-up' },
  { id: 'GLOW', name: 'Glow', icon: 'sun' },
  { id: 'SPARKLE', name: 'Sparkle', icon: 'star' },
  { id: 'RAINBOW', name: 'Rainbow', icon: 'layers' },
];

function AnimationPreview({ animation }: { animation: TextAnimation }) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    switch (animation) {
      case 'FADE':
        opacity.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1
        );
        break;
      case 'BOUNCE':
        translateY.value = withRepeat(
          withSequence(
            withSpring(-5),
            withSpring(0)
          ),
          -1
        );
        break;
      case 'GLOW':
        opacity.value = withRepeat(
          withSequence(
            withTiming(0.5, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1
        );
        break;
      case 'SPARKLE':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 300, easing: Easing.ease }),
            withTiming(1, { duration: 300, easing: Easing.ease })
          ),
          -1
        );
        break;
      default:
        opacity.value = 1;
        scale.value = 1;
        translateY.value = 0;
    }
  }, [animation, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.Text style={[styles.previewText, animatedStyle]}>
      Aa
    </Animated.Text>
  );
}

export default function StoryTextAnimationPicker({ selectedAnimation, onAnimationSelect }: Props) {
  const handleSelect = (animation: TextAnimation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAnimationSelect(animation);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Text Animation</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.animationScroll}>
        {ANIMATION_OPTIONS.map((anim) => (
          <Pressable
            key={anim.id}
            onPress={() => handleSelect(anim.id)}
            style={[
              styles.animationItem,
              selectedAnimation === anim.id && styles.selectedItem,
            ]}
          >
            <View style={styles.previewContainer}>
              {anim.id === 'RAINBOW' ? (
                <Text style={[styles.previewText, styles.rainbowText]}>Aa</Text>
              ) : (
                <AnimationPreview animation={anim.id} />
              )}
            </View>
            <View style={styles.labelRow}>
              <Feather 
                name={anim.icon} 
                size={12} 
                color={selectedAnimation === anim.id ? Colors.dark.primary : Colors.dark.textSecondary} 
              />
              <Text style={[
                styles.animationName,
                selectedAnimation === anim.id && styles.selectedName,
              ]}>
                {anim.name}
              </Text>
            </View>
            {selectedAnimation === anim.id && (
              <View style={styles.checkmark}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.livePreview}>
        <Text style={styles.livePreviewLabel}>Live Preview</Text>
        <View style={styles.livePreviewBox}>
          <AnimationPreview animation={selectedAnimation} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  animationScroll: {
    flexGrow: 0,
  },
  animationItem: {
    alignItems: 'center',
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 85,
    position: 'relative',
  },
  selectedItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  previewContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  previewText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  rainbowText: {
    color: '#FF0080',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  animationName: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  selectedName: {
    color: Colors.dark.primary,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  livePreview: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  livePreviewLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginBottom: Spacing.sm,
  },
  livePreviewBox: {
    width: '100%',
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
