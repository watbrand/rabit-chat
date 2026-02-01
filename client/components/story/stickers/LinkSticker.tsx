import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, Linking } from 'react-native';
import Haptics from "@/lib/safeHaptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  url?: string;
  label?: string;
  isEditing?: boolean;
  onEdit?: (url: string, label: string) => void;
  onPress?: () => void;
}

export default function LinkSticker({
  url,
  label,
  isEditing = false,
  onEdit,
  onPress,
}: Props) {
  const [editUrl, setEditUrl] = useState(url || '');
  const [editLabel, setEditLabel] = useState(label || '');
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const scale = useSharedValue(1);

  const validateUrl = (input: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return urlPattern.test(input);
  };

  const handleSave = () => {
    if (!editUrl.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    
    let finalUrl = editUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    if (!validateUrl(finalUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }
    
    const displayLabel = editLabel.trim() || new URL(finalUrl).hostname;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEdit?.(finalUrl, displayLabel);
  };

  const handlePress = async () => {
    if (!url) return;
    
    scale.value = withSpring(0.95);
    setTimeout(() => {
      scale.value = withSpring(1);
    }, 100);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
    
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.header}>
          <Feather name="link" size={18} color={Colors.dark.primary} />
          <Text style={styles.headerText}>Add Link</Text>
        </View>
        
        <TextInput
          style={[styles.input, urlError && styles.inputError]}
          value={editUrl}
          onChangeText={(text) => {
            setEditUrl(text);
            setUrlError(null);
          }}
          placeholder="https://example.com"
          placeholderTextColor={Colors.dark.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {urlError ? (
          <Text style={styles.errorText}>{urlError}</Text>
        ) : null}
        
        <TextInput
          style={styles.input}
          value={editLabel}
          onChangeText={setEditLabel}
          placeholder="Label (optional)"
          placeholderTextColor={Colors.dark.textSecondary}
          maxLength={30}
        />
        
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Add Link</Text>
        </Pressable>
      </View>
    );
  }

  if (!url) return null;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress} style={styles.container}>
        <Feather name="link" size={14} color="#fff" />
        <Text style={styles.labelText} numberOfLines={1}>
          {label || url}
        </Text>
        <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.6)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    maxWidth: 250,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  editContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: Spacing.md,
    width: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    fontSize: 15,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.sm,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.dark.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.dark.error,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginTop: Spacing.xs,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
