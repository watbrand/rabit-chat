import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Props {
  question: string;
  options: QuizOption[];
  userAnswer?: string;
  correctPercentage?: number;
  isEditing?: boolean;
  onAnswer?: (optionId: string) => void;
  onEdit?: (question: string, options: { text: string; isCorrect: boolean }[]) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function QuizSticker({
  question,
  options,
  userAnswer,
  correctPercentage = 0,
  isEditing = false,
  onAnswer,
  onEdit,
}: Props) {
  const [editQuestion, setEditQuestion] = useState(question);
  const [editOptions, setEditOptions] = useState(
    options.length > 0 
      ? options.map(o => ({ text: o.text, isCorrect: o.isCorrect }))
      : [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]
  );

  const handleAnswer = (optionId: string) => {
    if (userAnswer) return;
    onAnswer?.(optionId);
    
    const option = options.find(o => o.id === optionId);
    if (option?.isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const toggleCorrect = (index: number) => {
    setEditOptions(prev => prev.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Feather name="help-circle" size={18} color={Colors.dark.primary} />
          <Text style={styles.label}>Quiz</Text>
        </View>
        
        <TextInput
          style={styles.questionInput}
          value={editQuestion}
          onChangeText={setEditQuestion}
          placeholder="Ask a trivia question..."
          placeholderTextColor={Colors.dark.textSecondary}
          maxLength={120}
        />
        
        <Text style={styles.optionsLabel}>Tap checkmark to set correct answer:</Text>
        
        {editOptions.map((option, index) => (
          <View key={index} style={styles.editOptionRow}>
            <TextInput
              style={styles.optionInput}
              value={option.text}
              onChangeText={(text) => {
                const newOptions = [...editOptions];
                newOptions[index].text = text;
                setEditOptions(newOptions);
              }}
              placeholder={`Option ${index + 1}`}
              placeholderTextColor={Colors.dark.textSecondary}
              maxLength={50}
            />
            <Pressable 
              onPress={() => toggleCorrect(index)}
              style={[styles.correctToggle, option.isCorrect && styles.correctToggleActive]}
            >
              <Feather 
                name="check" 
                size={18} 
                color={option.isCorrect ? '#fff' : Colors.dark.textSecondary} 
              />
            </Pressable>
          </View>
        ))}
        
        {editOptions.length < 4 ? (
          <Pressable 
            onPress={() => setEditOptions([...editOptions, { text: '', isCorrect: false }])}
            style={styles.addOptionButton}
          >
            <Feather name="plus" size={16} color={Colors.dark.primary} />
            <Text style={styles.addOptionText}>Add option</Text>
          </Pressable>
        ) : null}
        
        <Pressable 
          onPress={() => onEdit?.(editQuestion, editOptions.filter(o => o.text.trim()))}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const hasAnswered = !!userAnswer;
  const correctOption = options.find(o => o.isCorrect);
  const wasCorrect = userAnswer ? options.find(o => o.id === userAnswer)?.isCorrect : false;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Feather name="help-circle" size={18} color={Colors.dark.primary} />
        <Text style={styles.label}>Quiz</Text>
      </View>
      
      <Text style={styles.question}>{question}</Text>
      
      {options.map((option) => {
        const isUserAnswer = userAnswer === option.id;
        const showCorrect = hasAnswered && option.isCorrect;
        const showWrong = hasAnswered && isUserAnswer && !option.isCorrect;
        
        return (
          <QuizOption
            key={option.id}
            text={option.text}
            onPress={() => handleAnswer(option.id)}
            disabled={hasAnswered}
            isCorrect={showCorrect}
            isWrong={showWrong}
            isSelected={isUserAnswer}
          />
        );
      })}
      
      {hasAnswered ? (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, wasCorrect ? styles.correctText : styles.wrongText]}>
            {wasCorrect ? '🎉 Correct!' : `❌ Wrong! It was: ${correctOption?.text}`}
          </Text>
          <Text style={styles.percentageText}>
            {correctPercentage}% got it right
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function QuizOption({
  text,
  onPress,
  disabled,
  isCorrect,
  isWrong,
  isSelected,
}: {
  text: string;
  onPress: () => void;
  disabled: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isSelected: boolean;
}) {
  const scale = useSharedValue(1);
  const bgColor = useSharedValue('rgba(255, 255, 255, 0.15)');

  React.useEffect(() => {
    if (isCorrect) {
      bgColor.value = withTiming('rgba(34, 197, 94, 0.4)');
      if (isSelected) {
        scale.value = withSequence(
          withSpring(1.05),
          withSpring(1)
        );
      }
    } else if (isWrong) {
      bgColor.value = withTiming('rgba(239, 68, 68, 0.4)');
      scale.value = withSequence(
        withTiming(0.95, { duration: 50 }),
        withTiming(1.02, { duration: 50 }),
        withSpring(1)
      );
    }
  }, [isCorrect, isWrong, isSelected, scale, bgColor]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bgColor.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.optionButton, animatedStyle]}
    >
      <Text style={styles.optionText}>{text}</Text>
      {isCorrect ? <Feather name="check-circle" size={18} color="#22c55e" /> : null}
      {isWrong ? <Feather name="x-circle" size={18} color="#ef4444" /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: Spacing.md,
    minWidth: 260,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.md,
  },
  questionInput: {
    fontSize: 15,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.md,
  },
  optionsLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  editOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  optionInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  correctToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctToggleActive: {
    backgroundColor: '#22c55e',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addOptionText: {
    fontSize: 13,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 10,
    marginBottom: Spacing.xs,
  },
  optionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  correctText: {
    color: '#22c55e',
  },
  wrongText: {
    color: '#ef4444',
  },
  percentageText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
