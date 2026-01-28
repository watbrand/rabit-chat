import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/theme';

interface ShimmerSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerSkeleton({ 
  width = '100%', 
  height = 16, 
  borderRadius = BorderRadius.sm,
  style 
}: ShimmerSkeletonProps) {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.backgroundSecondary,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

export function PostCardSkeleton() {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <ShimmerSkeleton width={40} height={40} borderRadius={20} />
        <View style={styles.postHeaderText}>
          <ShimmerSkeleton width={120} height={14} />
          <ShimmerSkeleton width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <ShimmerSkeleton width="100%" height={16} style={{ marginTop: 12 }} />
      <ShimmerSkeleton width="90%" height={16} style={{ marginTop: 8 }} />
      <ShimmerSkeleton width="60%" height={16} style={{ marginTop: 8 }} />
      <ShimmerSkeleton width="100%" height={200} borderRadius={BorderRadius.md} style={{ marginTop: 12 }} />
      <View style={styles.postActions}>
        <ShimmerSkeleton width={60} height={24} />
        <ShimmerSkeleton width={60} height={24} />
        <ShimmerSkeleton width={60} height={24} />
      </View>
    </View>
  );
}

export function ConversationCardSkeleton() {
  return (
    <View style={styles.conversationCard}>
      <ShimmerSkeleton width={50} height={50} borderRadius={25} />
      <View style={styles.conversationText}>
        <ShimmerSkeleton width={140} height={16} />
        <ShimmerSkeleton width={200} height={14} style={{ marginTop: 6 }} />
      </View>
      <ShimmerSkeleton width={40} height={12} />
    </View>
  );
}

export function NotificationCardSkeleton() {
  return (
    <View style={styles.notificationCard}>
      <ShimmerSkeleton width={44} height={44} borderRadius={22} />
      <View style={styles.notificationText}>
        <ShimmerSkeleton width={180} height={14} />
        <ShimmerSkeleton width={100} height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function UserCardSkeleton() {
  return (
    <View style={styles.userCard}>
      <ShimmerSkeleton width={56} height={56} borderRadius={28} />
      <ShimmerSkeleton width={80} height={14} style={{ marginTop: 8 }} />
      <ShimmerSkeleton width={60} height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

export function FeedSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.feedContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function MessagesSkeletonLoader({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <ConversationCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function NotificationsSkeletonLoader({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <NotificationCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    width: 200,
  },
  postCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  conversationText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  notificationText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  userCard: {
    alignItems: 'center',
    padding: Spacing.md,
    width: 100,
  },
  feedContainer: {
    padding: Spacing.sm,
  },
  listContainer: {
    padding: Spacing.sm,
  },
});
