import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  onSendReply: (text: string, mediaUrl?: string) => Promise<void>;
  onAttachMedia?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function StoryReplyInput({ 
  onSendReply, 
  onAttachMedia, 
  placeholder = 'Send a message...', 
  disabled 
}: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const sendScale = useSharedValue(1);

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;

    sendScale.value = withSequence(
      withSpring(0.8),
      withSpring(1)
    );
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setSending(true);
    try {
      await onSendReply(text.trim());
      setText('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSending(false);
    }
  };

  const sendAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {onAttachMedia && (
          <Pressable 
            onPress={onAttachMedia} 
            style={styles.attachButton}
            disabled={disabled}
          >
            <Feather name="image" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        )}
        
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.textTertiary}
          multiline
          maxLength={500}
          editable={!disabled}
        />
        
        <Animated.View style={sendAnimatedStyle}>
          <Pressable 
            onPress={handleSend} 
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            disabled={!canSend}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={18} color={canSend ? '#fff' : Colors.dark.textTertiary} />
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
});
