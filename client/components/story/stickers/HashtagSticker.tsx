import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';

interface Hashtag {
  tag: string;
  postCount: number;
}

interface Props {
  hashtag?: string;
  isEditing?: boolean;
  onSelect?: (tag: string) => void;
  onPress?: () => void;
}

export default function HashtagSticker({
  hashtag,
  isEditing = false,
  onSelect,
  onPress,
}: Props) {
  const [inputTag, setInputTag] = useState('');

  const { data: suggestions = [] } = useQuery<Hashtag[]>({
    queryKey: ['/api/hashtags/trending'],
    enabled: isEditing,
  });

  const handleSubmit = () => {
    const cleanTag = inputTag.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanTag) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect?.(cleanTag);
  };

  const handleSelectSuggestion = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect?.(tag);
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.header}>
          <Text style={styles.hashSymbol}>#</Text>
          <Text style={styles.headerText}>Add Hashtag</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputPrefix}>#</Text>
          <TextInput
            style={styles.input}
            value={inputTag}
            onChangeText={(text) => setInputTag(text.replace(/[^a-zA-Z0-9]/g, ''))}
            placeholder="hashtag"
            placeholderTextColor={Colors.dark.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            autoFocus
            onSubmitEditing={handleSubmit}
          />
          {inputTag ? (
            <Pressable onPress={handleSubmit} style={styles.addButton}>
              <Feather name="plus" size={18} color="#fff" />
            </Pressable>
          ) : null}
        </View>
        
        {suggestions.length > 0 ? (
          <>
            <Text style={styles.suggestionsLabel}>Trending</Text>
            <FlatList
              data={suggestions}
              keyExtractor={item => item.tag}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsList}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => handleSelectSuggestion(item.tag)}
                  style={styles.suggestionChip}
                >
                  <Text style={styles.suggestionTag}>#{item.tag}</Text>
                  <Text style={styles.suggestionCount}>
                    {item.postCount > 1000 
                      ? `${(item.postCount / 1000).toFixed(1)}k` 
                      : item.postCount
                    }
                  </Text>
                </Pressable>
              )}
            />
          </>
        ) : null}
      </View>
    );
  }

  if (!hashtag) return null;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text style={styles.hashtagText}>#{hashtag}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  hashtagText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
  hashSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: Spacing.sm,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  suggestionsList: {
    gap: Spacing.xs,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: Spacing.xs,
  },
  suggestionTag: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  suggestionCount: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
});
