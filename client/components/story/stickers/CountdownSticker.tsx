import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  title: string;
  endTime: Date;
  subscriberCount?: number;
  isSubscribed?: boolean;
  isEditing?: boolean;
  onSubscribe?: () => void;
  onEdit?: (title: string, endTime: Date) => void;
}

export default function CountdownSticker({
  title,
  endTime,
  subscriberCount = 0,
  isSubscribed = false,
  isEditing = false,
  onSubscribe,
  onEdit,
}: Props) {
  const [editTitle, setEditTitle] = useState(title);
  const [editDate, setEditDate] = useState(endTime.toISOString().split('T')[0]);
  const [editTime, setEditTime] = useState(
    endTime.toTimeString().split(' ')[0].substring(0, 5)
  );
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());
  
  const pulseOpacity = useSharedValue(1);
  const bellScale = useSharedValue(1);

  function calculateTimeRemaining() {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }
    
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [endTime]);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000, easing: Easing.ease }),
        withTiming(1, { duration: 1000, easing: Easing.ease })
      ),
      -1
    );
  }, [pulseOpacity]);

  const handleSubscribe = () => {
    bellScale.value = withSequence(
      withSpring(1.3),
      withSpring(0.9),
      withSpring(1.1),
      withSpring(1)
    );
    Haptics.notificationAsync(
      isSubscribed 
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success
    );
    onSubscribe?.();
  };

  const handleSave = () => {
    const [year, month, day] = editDate.split('-').map(Number);
    const [hours, minutes] = editTime.split(':').map(Number);
    const newDate = new Date(year, month - 1, day, hours, minutes);
    onEdit?.(editTitle, newDate);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const bellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bellScale.value }],
  }));

  if (isEditing) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.titleInput}
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Event name..."
          placeholderTextColor={Colors.dark.textSecondary}
          maxLength={50}
        />
        
        <View style={styles.dateTimeRow}>
          <TextInput
            style={styles.dateInput}
            value={editDate}
            onChangeText={setEditDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.dark.textSecondary}
          />
          <TextInput
            style={styles.timeInput}
            value={editTime}
            onChangeText={setEditTime}
            placeholder="HH:MM"
            placeholderTextColor={Colors.dark.textSecondary}
          />
        </View>
        
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const { days, hours, minutes, seconds, expired } = timeRemaining;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="clock" size={16} color={Colors.dark.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      {expired ? (
        <View style={styles.expiredContainer}>
          <Animated.Text style={[styles.expiredText, pulseStyle]}>
            Event Started!
          </Animated.Text>
        </View>
      ) : (
        <View style={styles.countdown}>
          <TimeUnit value={days} label="days" />
          <Text style={styles.separator}>:</Text>
          <TimeUnit value={hours} label="hrs" />
          <Text style={styles.separator}>:</Text>
          <TimeUnit value={minutes} label="min" />
          <Text style={styles.separator}>:</Text>
          <TimeUnit value={seconds} label="sec" />
        </View>
      )}
      
      <Pressable 
        onPress={handleSubscribe}
        style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
      >
        <Animated.View style={bellStyle}>
          <Feather 
            name={isSubscribed ? 'bell-off' : 'bell'} 
            size={16} 
            color={isSubscribed ? Colors.dark.textSecondary : '#fff'} 
          />
        </Animated.View>
        <Text style={[styles.subscribeText, isSubscribed && styles.subscribedText]}>
          {isSubscribed ? 'Reminder set' : 'Remind me'}
        </Text>
      </Pressable>
      
      {subscriberCount > 0 ? (
        <Text style={styles.subscriberCount}>
          {subscriberCount} {subscriberCount === 1 ? 'person' : 'people'} subscribed
        </Text>
      ) : null}
    </View>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.timeUnit}>
      <Text style={styles.timeValue}>{value.toString().padStart(2, '0')}</Text>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: Spacing.md,
    minWidth: 240,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  titleInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dateInput: {
    flex: 2,
    fontSize: 14,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  timeInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 40,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
  },
  separator: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.primary,
    marginHorizontal: 2,
  },
  expiredContainer: {
    paddingVertical: Spacing.md,
  },
  expiredText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.primary,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  subscribedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  subscribeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  subscribedText: {
    color: Colors.dark.textSecondary,
  },
  subscriberCount: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
