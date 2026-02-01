import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Text, 
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { InlineLoader } from '@/components/animations';

interface StoryData {
  type: 'TEXT' | 'PHOTO' | 'VIDEO' | 'VOICE';
  mediaUrl?: string;
  textContent?: string;
  backgroundColor?: string;
  isGradient?: boolean;
  gradientColors?: string[];
  fontFamily?: string;
  fontSize?: number;
  textAlignment?: 'left' | 'center' | 'right';
  textAnimation?: string;
  audioUrl?: string;
  audioDuration?: number;
}

interface Props {
  storyData: StoryData;
  onPublish: (settings: {
    visibility: 'ALL' | 'FOLLOWERS' | 'CLOSE_FRIENDS';
    replySetting: 'ALL' | 'FOLLOWERS' | 'CLOSE_FRIENDS' | 'OFF';
  }) => Promise<void>;
  onSaveDraft: () => void;
  onBack: () => void;
}

export default function StoryPreviewScreen({ storyData, onPublish, onSaveDraft, onBack }: Props) {
  const [visibility, setVisibility] = useState<'ALL' | 'FOLLOWERS' | 'CLOSE_FRIENDS'>('ALL');
  const [replySetting, setReplySetting] = useState<'ALL' | 'FOLLOWERS' | 'CLOSE_FRIENDS' | 'OFF'>('ALL');
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPublishing(true);
    try {
      await onPublish({
        visibility: closeFriendsOnly ? 'CLOSE_FRIENDS' : visibility,
        replySetting,
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSaveDraft();
  };

  const renderPreview = () => {
    if (storyData.type === 'TEXT') {
      if (storyData.isGradient && storyData.gradientColors) {
        return (
          <LinearGradient
            colors={storyData.gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.previewContent}
          >
            <Text style={[
              styles.previewText,
              {
                fontSize: storyData.fontSize || 24,
                textAlign: storyData.textAlignment || 'center',
              },
            ]}>
              {storyData.textContent}
            </Text>
          </LinearGradient>
        );
      }
      return (
        <View style={[styles.previewContent, { backgroundColor: storyData.backgroundColor || '#8B5CF6' }]}>
          <Text style={[
            styles.previewText,
            {
              fontSize: storyData.fontSize || 24,
              textAlign: storyData.textAlignment || 'center',
            },
          ]}>
            {storyData.textContent}
          </Text>
        </View>
      );
    }

    if (storyData.type === 'PHOTO' || storyData.type === 'VIDEO') {
      return (
        <View style={styles.previewContent}>
          <Image
            source={{ uri: storyData.mediaUrl }}
            style={styles.mediaPreview}
            contentFit="cover"
          />
          {storyData.type === 'VIDEO' && (
            <View style={styles.videoIndicator}>
              <Feather name="play-circle" size={48} color="#fff" />
            </View>
          )}
        </View>
      );
    }

    if (storyData.type === 'VOICE') {
      return (
        <View style={[styles.previewContent, styles.voicePreview]}>
          <Feather name="mic" size={48} color={Colors.dark.primary} />
          <Text style={styles.voiceDuration}>
            {Math.floor((storyData.audioDuration || 0) / 60)}:{((storyData.audioDuration || 0) % 60).toString().padStart(2, '0')}
          </Text>
          <Text style={styles.voiceLabel}>Voice Story</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Preview</Text>
        <Pressable onPress={handleSaveDraft} style={styles.headerButton}>
          <Feather name="save" size={20} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.previewContainer}>
          {renderPreview()}
        </View>

        <View style={styles.settings}>
          <Text style={styles.settingsTitle}>Story Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#22C55E20' }]}>
                <Feather name="users" size={18} color="#22C55E" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Close Friends Only</Text>
                <Text style={styles.settingDescription}>Only visible to close friends</Text>
              </View>
            </View>
            <Switch
              value={closeFriendsOnly}
              onValueChange={setCloseFriendsOnly}
              trackColor={{ false: 'rgba(255,255,255,0.2)', true: Colors.dark.primary }}
            />
          </View>

          {!closeFriendsOnly && (
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#3B82F620' }]}>
                  <Feather name="eye" size={18} color="#3B82F6" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Who can see</Text>
                  <Text style={styles.settingDescription}>
                    {visibility === 'ALL' ? 'Everyone' : visibility === 'FOLLOWERS' ? 'Followers only' : 'Close friends'}
                  </Text>
                </View>
              </View>
              <Pressable 
                style={styles.settingAction}
                onPress={() => {
                  const options: typeof visibility[] = ['ALL', 'FOLLOWERS', 'CLOSE_FRIENDS'];
                  const currentIndex = options.indexOf(visibility);
                  setVisibility(options[(currentIndex + 1) % options.length]);
                }}
              >
                <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>
          )}

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#8B5CF620' }]}>
                <Feather name="message-circle" size={18} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Who can reply</Text>
                <Text style={styles.settingDescription}>
                  {replySetting === 'ALL' ? 'Everyone' : 
                   replySetting === 'FOLLOWERS' ? 'Followers only' : 
                   replySetting === 'CLOSE_FRIENDS' ? 'Close friends' : 'No one'}
                </Text>
              </View>
            </View>
            <Pressable 
              style={styles.settingAction}
              onPress={() => {
                const options: typeof replySetting[] = ['ALL', 'FOLLOWERS', 'CLOSE_FRIENDS', 'OFF'];
                const currentIndex = options.indexOf(replySetting);
                setReplySetting(options[(currentIndex + 1) % options.length]);
              }}
            >
              <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handlePublish}
          style={styles.publishButton}
          disabled={publishing}
        >
          {publishing ? (
            <InlineLoader size={20} />
          ) : (
            <>
              <Feather name="send" size={20} color="#fff" />
              <Text style={styles.publishText}>Share Story</Text>
            </>
          )}
        </Pressable>
      </View>
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
  headerButton: {
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
  content: {
    flex: 1,
  },
  previewContainer: {
    aspectRatio: 9 / 16,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  previewText: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  mediaPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
    opacity: 0.8,
  },
  voicePreview: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  voiceDuration: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  voiceLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  settings: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.dark.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  settingAction: {
    padding: Spacing.xs,
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  publishText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
