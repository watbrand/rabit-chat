import React from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  SafeAreaView,
  Pressable,
  FlatList,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/query-client';

interface StoryDraft {
  id: number;
  storyType: string;
  content?: string;
  mediaUrl?: string;
  colors?: { background: string };
  createdAt: string;
  updatedAt: string;
}

interface Props {
  onClose: () => void;
  onEditDraft: (draft: StoryDraft) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 3) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

export default function StoryDraftsScreen({ onClose, onEditDraft }: Props) {
  const queryClient = useQueryClient();

  const { data: drafts = [], isLoading } = useQuery<StoryDraft[]>({
    queryKey: ['/api/stories/drafts'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (draftId: number) => {
      await apiRequest('DELETE', `/api/stories/drafts/${draftId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/drafts'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleDelete = (draft: StoryDraft) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(draft.id),
        },
      ]
    );
  };

  const handleEdit = (draft: StoryDraft) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEditDraft(draft);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStoryTypeIcon = (type: string) => {
    switch (type) {
      case 'TEXT': return 'type';
      case 'PHOTO': return 'image';
      case 'VIDEO': return 'video';
      case 'VOICE': return 'mic';
      default: return 'file';
    }
  };

  const renderDraft = ({ item }: { item: StoryDraft }) => {
    const bgColor = item.colors?.background || Colors.dark.primary;
    
    return (
      <Pressable 
        onPress={() => handleEdit(item)}
        onLongPress={() => handleDelete(item)}
        style={styles.draftCard}
      >
        <View style={[styles.draftPreview, { backgroundColor: bgColor }]}>
          {item.mediaUrl ? (
            <Image 
              source={{ uri: item.mediaUrl }} 
              style={styles.draftImage}
              resizeMode="cover"
            />
          ) : item.storyType === 'TEXT' && item.content ? (
            <Text style={styles.draftContent} numberOfLines={5}>
              {item.content}
            </Text>
          ) : (
            <Feather 
              name={getStoryTypeIcon(item.storyType)} 
              size={32} 
              color="rgba(255, 255, 255, 0.5)" 
            />
          )}
          
          <View style={styles.draftTypeIcon}>
            <Feather 
              name={getStoryTypeIcon(item.storyType)} 
              size={14} 
              color="#fff" 
            />
          </View>
        </View>
        
        <View style={styles.draftInfo}>
          <Text style={styles.draftType}>{item.storyType}</Text>
          <Text style={styles.draftDate}>{formatDate(item.updatedAt)}</Text>
        </View>
        
        <Pressable 
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={16} color={Colors.dark.error} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Drafts</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading drafts...</Text>
        </View>
      ) : drafts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color={Colors.dark.textSecondary} />
          <Text style={styles.emptyTitle}>No Drafts</Text>
          <Text style={styles.emptyText}>
            Stories you save as drafts will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.draftGrid}
          columnWrapperStyle={styles.draftRow}
          renderItem={renderDraft}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  draftGrid: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  draftRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  draftCard: {
    width: CARD_WIDTH,
    position: 'relative',
  },
  draftPreview: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  draftImage: {
    width: '100%',
    height: '100%',
  },
  draftContent: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  draftTypeIcon: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftInfo: {
    paddingVertical: Spacing.xs,
  },
  draftType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  draftDate: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
