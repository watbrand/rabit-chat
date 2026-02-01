import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  question: string;
  emoji: string;
  averageValue?: number;
  responseCount?: number;
  userValue?: number;
  isEditing?: boolean;
  isOwner?: boolean;
  onSubmit?: (value: number) => void;
  onEdit?: (question: string, emoji: string) => void;
}

const EMOJIS = ['😍', '🔥', '💯', '😢', '😂', '🤔', '💪', '✨'];
const SLIDER_WIDTH = 220;

export default function SliderSticker({
  question,
  emoji,
  averageValue = 50,
  responseCount = 0,
  userValue,
  isEditing = false,
  isOwner = false,
  onSubmit,
  onEdit,
}: Props) {
  const [editQuestion, setEditQuestion] = useState(question);
  const [selectedEmoji, setSelectedEmoji] = useState(emoji);
  const [hasSubmitted, setHasSubmitted] = useState(!!userValue);
  
  const sliderPosition = useSharedValue(userValue ?? 50);
  const thumbScale = useSharedValue(1);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = (value: number) => {
    if (hasSubmitted || isOwner) return;
    setHasSubmitted(true);
    onSubmit?.(Math.round(value));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const panGesture = Gesture.Pan()
    .enabled(!hasSubmitted && !isOwner)
    .onStart(() => {
      thumbScale.value = withSpring(1.3);
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      const newPosition = Math.max(0, Math.min(100, (event.x / SLIDER_WIDTH) * 100));
      sliderPosition.value = newPosition;
    })
    .onEnd(() => {
      thumbScale.value = withSpring(1);
      runOnJS(handleSubmit)(sliderPosition.value);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${sliderPosition.value}%`,
    transform: [
      { translateX: -15 },
      { scale: thumbScale.value },
    ],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${sliderPosition.value}%`,
  }));

  if (isEditing) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.editInput}
          value={editQuestion}
          onChangeText={setEditQuestion}
          placeholder="Ask something..."
          placeholderTextColor={Colors.dark.textSecondary}
          maxLength={80}
        />
        
        <Text style={styles.emojiLabel}>Choose emoji:</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((e) => (
            <Text
              key={e}
              style={[styles.emojiOption, selectedEmoji === e && styles.emojiSelected]}
              onPress={() => setSelectedEmoji(e)}
            >
              {e}
            </Text>
          ))}
        </View>
        
        <Text 
          style={styles.saveButton} 
          onPress={() => onEdit?.(editQuestion, selectedEmoji)}
        >
          Done
        </Text>
      </View>
    );
  }

  const showResults = hasSubmitted || isOwner;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      
      <GestureDetector gesture={panGesture}>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack}>
            <Animated.View style={[styles.sliderFill, fillStyle]} />
            {showResults ? (
              <View style={[styles.averageMarker, { left: `${averageValue}%` }]} />
            ) : null}
          </View>
          
          <Animated.View style={[styles.thumb, thumbStyle]}>
            <Text style={styles.thumbEmoji}>{emoji}</Text>
          </Animated.View>
        </View>
      </GestureDetector>
      
      {showResults ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultText}>
            Average: {Math.round(averageValue)}%
          </Text>
          <Text style={styles.responseCount}>
            {responseCount} response{responseCount !== 1 ? 's' : ''}
          </Text>
        </View>
      ) : (
        <Text style={styles.hintText}>Slide to respond</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 16,
    padding: Spacing.md,
    minWidth: 260,
  },
  question: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  editInput: {
    fontSize: 15,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  emojiLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emojiOption: {
    fontSize: 24,
    padding: Spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emojiSelected: {
    backgroundColor: Colors.dark.primary,
  },
  sliderContainer: {
    height: 50,
    justifyContent: 'center',
    width: SLIDER_WIDTH,
    alignSelf: 'center',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
  },
  averageMarker: {
    position: 'absolute',
    width: 2,
    height: 16,
    top: -4,
    backgroundColor: '#fff',
    borderRadius: 1,
    transform: [{ translateX: -1 }],
  },
  thumb: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbEmoji: {
    fontSize: 18,
  },
  resultsContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  responseCount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  saveButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
