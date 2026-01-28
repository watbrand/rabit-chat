import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing } from '@/constants/theme';

export type ReactionType = 'FIRE' | 'HEART' | 'LAUGH' | 'WOW' | 'SAD' | 'CLAP';

interface Props {
  onReaction: (reaction: ReactionType) => void;
  disabled?: boolean;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'FIRE', emoji: '🔥', label: 'Fire' },
  { type: 'HEART', emoji: '❤️', label: 'Love' },
  { type: 'LAUGH', emoji: '😂', label: 'Haha' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Sad' },
  { type: 'CLAP', emoji: '👏', label: 'Clap' },
];

function ReactionButton({ 
  emoji, 
  label, 
  onPress, 
  disabled 
}: { 
  emoji: string; 
  label: string; 
  onPress: () => void; 
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePress = () => {
    if (disabled) return;
    
    scale.value = withSequence(
      withSpring(1.3),
      withSpring(1)
    );
    opacity.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View style={[styles.reactionButton, animatedStyle]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function StoryReactionBar({ onReaction, disabled }: Props) {
  return (
    <View style={styles.container}>
      {REACTIONS.map((reaction) => (
        <ReactionButton
          key={reaction.type}
          emoji={reaction.emoji}
          label={reaction.label}
          onPress={() => onReaction(reaction.type)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    marginHorizontal: Spacing.lg,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});
