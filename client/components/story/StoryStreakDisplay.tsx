import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface Milestone {
  days: number;
  reward: string;
  claimed: boolean;
}

interface Props {
  currentStreak: number;
  longestStreak: number;
  milestones: Milestone[];
  onClaimMilestone: (days: number) => void;
}

function FlameIcon({ size = 24 }: { size?: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500, easing: Easing.ease }),
        withTiming(1, { duration: 500, easing: Easing.ease })
      ),
      -1
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 300 }),
        withTiming(1, { duration: 300 })
      ),
      -1
    );
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ fontSize: size }, animatedStyle]}>
      🔥
    </Animated.Text>
  );
}

export default function StoryStreakDisplay({ 
  currentStreak, 
  longestStreak, 
  milestones, 
  onClaimMilestone 
}: Props) {
  const handleClaim = (days: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClaimMilestone(days);
  };

  const nextMilestone = milestones.find(m => m.days > currentStreak && !m.claimed);
  const claimableMilestones = milestones.filter(m => m.days <= currentStreak && !m.claimed);

  return (
    <View style={styles.container}>
      <View style={styles.streakHeader}>
        <FlameIcon size={40} />
        <View style={styles.streakInfo}>
          <Text style={styles.streakCount}>{currentStreak} day streak</Text>
          <Text style={styles.longestStreak}>Best: {longestStreak} days</Text>
        </View>
      </View>

      {nextMilestone && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {nextMilestone.days - currentStreak} days until next reward
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentStreak / nextMilestone.days) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.rewardPreview}>
            <Feather name="gift" size={12} color={Colors.dark.primary} /> {nextMilestone.reward}
          </Text>
        </View>
      )}

      {claimableMilestones.length > 0 && (
        <View style={styles.claimableSection}>
          <Text style={styles.sectionTitle}>Claim Your Rewards!</Text>
          {claimableMilestones.map(milestone => (
            <Pressable
              key={milestone.days}
              onPress={() => handleClaim(milestone.days)}
              style={styles.claimButton}
            >
              <View style={styles.claimLeft}>
                <Text style={styles.milestoneDays}>{milestone.days} Days</Text>
                <Text style={styles.milestoneReward}>{milestone.reward}</Text>
              </View>
              <View style={styles.claimAction}>
                <Feather name="gift" size={20} color="#fff" />
                <Text style={styles.claimText}>Claim</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.milestonesSection}>
        <Text style={styles.sectionTitle}>Milestones</Text>
        <View style={styles.milestonesGrid}>
          {milestones.map(milestone => {
            const isAchieved = currentStreak >= milestone.days;
            const isClaimed = milestone.claimed;
            
            return (
              <View 
                key={milestone.days}
                style={[
                  styles.milestoneItem,
                  isAchieved && styles.milestoneAchieved,
                  isClaimed && styles.milestoneClaimed,
                ]}
              >
                <Text style={styles.milestoneDaysSmall}>{milestone.days}</Text>
                <Text style={styles.milestoneDaysLabel}>days</Text>
                {isClaimed && (
                  <View style={styles.claimedBadge}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  streakInfo: {
    marginLeft: Spacing.md,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  longestStreak: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  progressLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
  },
  rewardPreview: {
    fontSize: 13,
    color: Colors.dark.primary,
  },
  claimableSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  claimButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  claimLeft: {
    flex: 1,
  },
  milestoneDays: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  milestoneReward: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  claimAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: 6,
  },
  claimText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  milestonesSection: {},
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  milestoneItem: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  milestoneAchieved: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  milestoneClaimed: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  milestoneDaysSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  milestoneDaysLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  claimedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
