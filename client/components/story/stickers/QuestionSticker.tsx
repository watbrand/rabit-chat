import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  question: string;
  responseCount?: number;
  isEditing?: boolean;
  isOwner?: boolean;
  onSubmit?: (answer: string) => void;
  onEdit?: (question: string) => void;
  onViewResponses?: () => void;
}

export default function QuestionSticker({
  question,
  responseCount = 0,
  isEditing = false,
  isOwner = false,
  onSubmit,
  onEdit,
  onViewResponses,
}: Props) {
  const [editQuestion, setEditQuestion] = useState(question);
  const [answer, setAnswer] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const inputScale = useSharedValue(1);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit?.(answer.trim());
    setAnswer('');
    setIsExpanded(false);
  };

  const handleExpand = () => {
    if (isOwner) {
      onViewResponses?.();
      return;
    }
    setIsExpanded(true);
    inputScale.value = withSpring(1.02);
  };

  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  if (isEditing) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.editInput}
          value={editQuestion}
          onChangeText={setEditQuestion}
          placeholder="Ask me anything..."
          placeholderTextColor={Colors.dark.textSecondary}
          multiline
          maxLength={150}
        />
        <Pressable 
          onPress={() => onEdit?.(editQuestion)}
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={handleExpand} style={styles.container}>
      <View style={styles.header}>
        <Feather name="help-circle" size={18} color={Colors.dark.primary} />
        <Text style={styles.label}>Ask me</Text>
      </View>
      
      <Text style={styles.question}>{question}</Text>
      
      {isExpanded && !isOwner ? (
        <Animated.View style={[styles.inputContainer, inputStyle]}>
          <TextInput
            style={styles.answerInput}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type your response..."
            placeholderTextColor={Colors.dark.textSecondary}
            multiline
            maxLength={300}
            autoFocus
          />
          <View style={styles.inputActions}>
            <Pressable onPress={() => setIsExpanded(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={handleSubmit}
              style={[styles.sendButton, !answer.trim() && styles.sendButtonDisabled]}
              disabled={!answer.trim()}
            >
              <Feather name="send" size={16} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.tapHint}>
          <Text style={styles.hintText}>
            {isOwner 
              ? `${responseCount} response${responseCount !== 1 ? 's' : ''} • Tap to view`
              : 'Tap to respond'
            }
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 16,
    padding: Spacing.md,
    minWidth: 240,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  header: {
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
    marginBottom: Spacing.sm,
  },
  editInput: {
    fontSize: 16,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputContainer: {
    marginTop: Spacing.xs,
  },
  answerInput: {
    fontSize: 14,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cancelButton: {
    padding: Spacing.xs,
  },
  cancelText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  tapHint: {
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  hintText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
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
