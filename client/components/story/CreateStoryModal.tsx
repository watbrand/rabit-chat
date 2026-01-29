import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Text, 
  Modal, 
  SafeAreaView,
  FlatList,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { LoadingIndicator } from '@/components/animations';

export type StoryCreationType = 'TEXT' | 'PHOTO' | 'VIDEO' | 'VOICE';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: StoryCreationType, mediaUri?: string) => void;
  draftsCount?: number;
  onOpenDrafts?: () => void;
  onOpenTemplates?: () => void;
}

const CREATION_TYPES = [
  { id: 'TEXT' as StoryCreationType, icon: 'type', name: 'Text', color: '#8B5CF6', description: 'Create with words' },
  { id: 'PHOTO' as StoryCreationType, icon: 'camera', name: 'Camera', color: '#3B82F6', description: 'Take a photo' },
  { id: 'VIDEO' as StoryCreationType, icon: 'video', name: 'Video', color: '#EC4899', description: 'Record video' },
  { id: 'VOICE' as StoryCreationType, icon: 'mic', name: 'Voice', color: '#22C55E', description: 'Record audio' },
];

export default function CreateStoryModal({ 
  visible, 
  onClose, 
  onSelectType, 
  draftsCount = 0,
  onOpenDrafts,
  onOpenTemplates,
}: Props) {
  const [selectedTab, setSelectedTab] = useState<'create' | 'gallery' | 'drafts'>('create');
  const [galleryImages, setGalleryImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsMultipleSelection: false,
          quality: 0.8,
        });
        
        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          const type: StoryCreationType = asset.type === 'video' ? 'VIDEO' : 'PHOTO';
          onSelectType(type, asset.uri);
          onClose();
        }
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleTypeSelect = async (type: StoryCreationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (type === 'PHOTO') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
        if (!result.canceled && result.assets.length > 0) {
          onSelectType('PHOTO', result.assets[0].uri);
          onClose();
        }
      }
    } else if (type === 'VIDEO') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          videoMaxDuration: 600,
        });
        if (!result.canceled && result.assets.length > 0) {
          onSelectType('VIDEO', result.assets[0].uri);
          onClose();
        }
      }
    } else {
      onSelectType(type);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Story</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={Colors.dark.text} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setSelectedTab('create')}
            style={[styles.tab, selectedTab === 'create' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'create' && styles.activeTabText]}>
              Create
            </Text>
          </Pressable>
          <Pressable
            onPress={loadGallery}
            style={[styles.tab, selectedTab === 'gallery' && styles.activeTab]}
          >
            <Text style={[styles.tabText, selectedTab === 'gallery' && styles.activeTabText]}>
              Gallery
            </Text>
          </Pressable>
          {draftsCount > 0 && (
            <Pressable
              onPress={onOpenDrafts}
              style={[styles.tab, selectedTab === 'drafts' && styles.activeTab]}
            >
              <Text style={[styles.tabText, selectedTab === 'drafts' && styles.activeTabText]}>
                Drafts ({draftsCount})
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.typesGrid}>
            {CREATION_TYPES.map((type) => (
              <Pressable
                key={type.id}
                onPress={() => handleTypeSelect(type.id)}
                style={styles.typeCard}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                  <Feather name={type.icon as any} size={32} color={type.color} />
                </View>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDesc}>{type.description}</Text>
              </Pressable>
            ))}
          </View>

          {loadingGallery && (
            <View style={styles.loadingOverlay}>
              <LoadingIndicator size="large" />
            </View>
          )}

          <View style={styles.quickActions}>
            <Pressable onPress={onOpenTemplates} style={styles.quickAction}>
              <Feather name="grid" size={20} color={Colors.dark.primary} />
              <Text style={styles.quickActionText}>Templates</Text>
            </Pressable>
            {draftsCount > 0 && (
              <Pressable onPress={onOpenDrafts} style={styles.quickAction}>
                <Feather name="file-text" size={20} color={Colors.dark.primary} />
                <Text style={styles.quickActionText}>Drafts ({draftsCount})</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.dark.text,
    lineHeight: 28,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginRight: Spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.primary,
  },
  tabText: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
  },
  activeTabText: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  typeCard: {
    width: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  typeIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  typeDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  quickActionText: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
});
