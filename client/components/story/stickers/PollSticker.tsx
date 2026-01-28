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
import { Colors, Spacing } from '@/constants/theme';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Props {
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVote?: string;
  isEditing?: boolean;
  isOwner?: boolean;
  onVote?: (optionId: string) => void;
  onEdit?: (question: string, options: string[]) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PollSticker({ 
  question, 
  options, 
  totalVotes,
  userVote,
  isEditing = false,
  isOwner = false,
  onVote,
  onEdit,
}: Props) {
  const [editQuestion, setEditQuestion] = useState(question);
  const [editOptions, setEditOptions] = useState(options.map(o => o.text));

  const handleVote = (optionId: string) => {
    if (userVote || isOwner) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onVote?.(optionId);
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  if (isEditing) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.questionInput}
          value={editQuestion}
          onChangeText={setEditQuestion}
          placeholder="Ask a question..."
          placeholderTextColor={Colors.dark.textSecondary}
          maxLength={100}
        />
        {editOptions.map((option, index) => (
          <TextInput
            key={index}
            style={styles.optionInput}
            value={option}
            onChangeText={(text) => {
              const newOptions = [...editOptions];
              newOptions[index] = text;
              setEditOptions(newOptions);
            }}
            placeholder={`Option ${index + 1}`}
            placeholderTextColor={Colors.dark.textSecondary}
            maxLength={50}
          />
        ))}
        <Pressable 
          onPress={() => onEdit?.(editQuestion, editOptions.filter(o => o.trim()))}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const hasVoted = Boolean(userVote) || isOwner;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      
      {options.map((option) => {
        const percentage = getPercentage(option.votes);
        const isSelected = userVote === option.id;
        
        return (
          <PollOptionItem
            key={option.id}
            option={option}
            percentage={percentage}
            isSelected={isSelected}
            showResults={hasVoted}
            onPress={() => handleVote(option.id)}
          />
        );
      })}
      
      {hasVoted ? (
        <Text style={styles.totalVotes}>{totalVotes} votes</Text>
      ) : null}
    </View>
  );
}

function PollOptionItem({ 
  option, 
  percentage, 
  isSelected, 
  showResults,
  onPress,
}: { 
  option: PollOption;
  percentage: number;
  isSelected: boolean;
  showResults: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(showResults ? percentage : 0);

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  React.useEffect(() => {
    if (showResults) {
      progressWidth.value = withTiming(percentage, { duration: 500 });
    }
  }, [showResults, percentage, progressWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.optionButton, animatedStyle]}
      disabled={showResults}
    >
      {showResults ? (
        <Animated.View style={[styles.progressBar, progressStyle, isSelected && styles.progressBarSelected]} />
      ) : null}
      <View style={styles.optionContent}>
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {option.text}
        </Text>
        {showResults ? (
          <Text style={[styles.percentageText, isSelected && styles.percentageTextSelected]}>
            {percentage}%
          </Text>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: Spacing.md,
    minWidth: 250,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  questionInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.md,
    textAlign: 'center',
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionInput: {
    fontSize: 14,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.xs,
  },
  optionButton: {
    borderRadius: 8,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
  },
  progressBarSelected: {
    backgroundColor: Colors.dark.primary,
  },
  optionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '700',
  },
  percentageText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  percentageTextSelected: {
    color: '#fff',
  },
  totalVotes: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
