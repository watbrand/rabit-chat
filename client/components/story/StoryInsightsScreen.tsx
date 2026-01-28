import React from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView,
  SafeAreaView,
  Pressable,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { useQuery } from '@tanstack/react-query';

interface StoryInsight {
  views: number;
  uniqueViewers: number;
  shares: number;
  replies: number;
  reactions: { [key: string]: number };
  tapsForward: number;
  tapsBack: number;
  exits: number;
  completionRate: number;
  averageViewDuration: number;
  stickerInteractions: number;
}

interface Viewer {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  viewedAt: string;
}

interface Props {
  storyId: number;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StoryInsightsScreen({ storyId, onClose }: Props) {
  const { data: insights } = useQuery<StoryInsight>({
    queryKey: ['/api/stories', storyId, 'analytics'],
  });

  const { data: viewers = [] } = useQuery<Viewer[]>({
    queryKey: ['/api/stories', storyId, 'viewers'],
  });

  const metrics = [
    { 
      label: 'Views', 
      value: insights?.views || 0, 
      icon: 'eye' as const,
      color: Colors.dark.primary,
    },
    { 
      label: 'Shares', 
      value: insights?.shares || 0, 
      icon: 'share-2' as const,
      color: '#22c55e',
    },
    { 
      label: 'Replies', 
      value: insights?.replies || 0, 
      icon: 'message-circle' as const,
      color: '#3b82f6',
    },
    { 
      label: 'Sticker Taps', 
      value: insights?.stickerInteractions || 0, 
      icon: 'star' as const,
      color: '#f59e0b',
    },
  ];

  const navigationMetrics = [
    { 
      label: 'Taps Forward', 
      value: insights?.tapsForward || 0,
      icon: 'chevron-right' as const,
    },
    { 
      label: 'Taps Back', 
      value: insights?.tapsBack || 0,
      icon: 'chevron-left' as const,
    },
    { 
      label: 'Exits', 
      value: insights?.exits || 0,
      icon: 'x' as const,
    },
  ];

  const reactions = insights?.reactions || {};
  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Story Insights</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainMetrics}>
          {metrics.map((metric) => (
            <View key={metric.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
                <Feather name={metric.icon} size={20} color={metric.color} />
              </View>
              <Text style={styles.metricValue}>{metric.value.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement</Text>
          <View style={styles.engagementCard}>
            <View style={styles.completionRow}>
              <Text style={styles.completionLabel}>Completion Rate</Text>
              <Text style={styles.completionValue}>
                {Math.round(insights?.completionRate || 0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${insights?.completionRate || 0}%` }
                ]} 
              />
            </View>
            <Text style={styles.completionHint}>
              Average view: {Math.round(insights?.averageViewDuration || 0)}s
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          <View style={styles.navigationRow}>
            {navigationMetrics.map((metric) => (
              <View key={metric.label} style={styles.navMetric}>
                <Feather name={metric.icon} size={18} color={Colors.dark.textSecondary} />
                <Text style={styles.navValue}>{metric.value}</Text>
                <Text style={styles.navLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {totalReactions > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reactions ({totalReactions})</Text>
            <View style={styles.reactionsRow}>
              {Object.entries(reactions).map(([emoji, count]) => (
                <View key={emoji} style={styles.reactionItem}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  <Text style={styles.reactionCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Viewers ({insights?.uniqueViewers || 0})
            </Text>
          </View>
          
          {viewers.length > 0 ? (
            <FlatList
              data={viewers}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.viewerItem}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.viewerAvatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Feather name="user" size={16} color={Colors.dark.textSecondary} />
                    </View>
                  )}
                  <View style={styles.viewerInfo}>
                    <Text style={styles.viewerName}>
                      {item.displayName || item.username}
                    </Text>
                    <Text style={styles.viewerUsername}>@{item.username}</Text>
                  </View>
                  <Text style={styles.viewedAt}>
                    {formatTimeAgo(item.viewedAt)}
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyViewers}>
              <Feather name="eye-off" size={32} color={Colors.dark.textSecondary} />
              <Text style={styles.emptyText}>No viewers yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
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
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  mainMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    width: (SCREEN_WIDTH - Spacing.md * 3) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.sm,
  },
  engagementCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: Spacing.md,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  completionLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  completionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
  },
  completionHint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: Spacing.md,
  },
  navMetric: {
    alignItems: 'center',
  },
  navValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: Spacing.xs,
  },
  navLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  viewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  viewerUsername: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  viewedAt: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  emptyViewers: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
});
