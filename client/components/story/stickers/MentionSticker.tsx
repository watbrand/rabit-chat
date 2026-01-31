import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput, FlatList, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  isVerified?: boolean;
}

interface Props {
  mentionedUser?: User;
  isEditing?: boolean;
  onSelect?: (user: User) => void;
  onPress?: () => void;
}

export default function MentionSticker({
  mentionedUser,
  isEditing = false,
  onSelect,
  onPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users/search', searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const handleSelect = (user: User) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect?.(user);
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.header}>
          <Feather name="at-sign" size={18} color={Colors.dark.primary} />
          <Text style={styles.headerText}>Mention Someone</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={Colors.dark.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users..."
            placeholderTextColor={Colors.dark.textSecondary}
            autoFocus
          />
        </View>
        
        {searchQuery.length >= 2 ? (
          <FlatList
            data={users}
            keyExtractor={item => item.id.toString()}
            style={styles.userList}
            scrollIndicatorInsets={{ bottom: insets.bottom }}
            renderItem={({ item }) => (
              <Pressable 
                onPress={() => handleSelect(item)}
                style={styles.userItem}
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Feather name="user" size={16} color={Colors.dark.textSecondary} />
                  </View>
                )}
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.displayName}>
                      {item.displayName || item.username}
                    </Text>
                    {item.isVerified ? (
                      <Feather name="check-circle" size={14} color={Colors.dark.primary} />
                    ) : null}
                  </View>
                  <Text style={styles.username}>@{item.username}</Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              isLoading ? null : (
                <Text style={styles.emptyText}>No users found</Text>
              )
            }
          />
        ) : (
          <Text style={styles.hintText}>Type at least 2 characters to search</Text>
        )}
      </View>
    );
  }

  if (!mentionedUser) return null;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text style={styles.atSymbol}>@</Text>
      <Text style={styles.mentionText}>{mentionedUser.username}</Text>
      {mentionedUser.isVerified ? (
        <Feather name="check-circle" size={12} color={Colors.dark.primary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
  },
  atSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  mentionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  editContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: Spacing.md,
    width: 280,
    maxHeight: 350,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    paddingVertical: Spacing.sm,
  },
  userList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  username: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  hintText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
});
