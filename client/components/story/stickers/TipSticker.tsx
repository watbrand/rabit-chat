import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  recipientName?: string;
  totalTips?: number;
  tipCount?: number;
  isOwner?: boolean;
  onTip?: (amount: number) => void;
}

const TIP_AMOUNTS = [10, 25, 50, 100, 250, 500];

const AnimatedView = Animated.View;

export default function TipSticker({
  recipientName,
  totalTips = 0,
  tipCount = 0,
  isOwner = false,
  onTip,
}: Props) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const coinRotation = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setShowConfirm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSendTip = async () => {
    const amount = selectedAmount || parseInt(customAmount) || 0;
    if (amount <= 0) return;
    
    setIsSending(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    coinRotation.value = withRepeat(
      withTiming(360, { duration: 500, easing: Easing.linear }),
      3
    );
    sparkleOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 })
    );
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onTip?.(amount);
    setIsSending(false);
    setShowConfirm(false);
    setSelectedAmount(null);
    setCustomAmount('');
  };

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${coinRotation.value}deg` }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString()}`;
  };

  if (isOwner) {
    return (
      <View style={styles.container}>
        <View style={styles.ownerHeader}>
          <AnimatedView style={[styles.coinIcon, coinStyle]}>
            <Text style={styles.coinEmoji}>💰</Text>
          </AnimatedView>
          <Text style={styles.ownerTitle}>Tips Received</Text>
        </View>
        
        <Text style={styles.totalAmount}>{formatCurrency(totalTips)}</Text>
        <Text style={styles.tipCount}>
          from {tipCount} {tipCount === 1 ? 'supporter' : 'supporters'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AnimatedView style={[styles.coinIcon, coinStyle]}>
          <Text style={styles.coinEmoji}>💰</Text>
        </AnimatedView>
        <Text style={styles.title}>Send a Tip</Text>
      </View>
      
      {recipientName ? (
        <Text style={styles.recipientText}>
          Support {recipientName}
        </Text>
      ) : null}

      {!showConfirm ? (
        <>
          <View style={styles.amountsGrid}>
            {TIP_AMOUNTS.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handleSelectAmount(amount)}
                style={styles.amountButton}
              >
                <Text style={styles.amountText}>{formatCurrency(amount)}</Text>
              </Pressable>
            ))}
          </View>
          
          <View style={styles.customRow}>
            <Text style={styles.currencyPrefix}>R</Text>
            <TextInput
              style={styles.customInput}
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text.replace(/[^0-9]/g, ''));
                setSelectedAmount(null);
              }}
              placeholder="Custom"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
            />
            {customAmount ? (
              <Pressable 
                onPress={() => setShowConfirm(true)}
                style={styles.goButton}
              >
                <Feather name="arrow-right" size={18} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        </>
      ) : (
        <View style={styles.confirmContainer}>
          <AnimatedView style={[styles.sparkles, sparkleStyle]}>
            <Text style={styles.sparkleEmoji}>✨</Text>
          </AnimatedView>
          
          <Text style={styles.confirmAmount}>
            {formatCurrency(selectedAmount || parseInt(customAmount) || 0)}
          </Text>
          
          <View style={styles.confirmButtons}>
            <Pressable 
              onPress={() => {
                setShowConfirm(false);
                setSelectedAmount(null);
              }}
              style={styles.cancelButton}
              disabled={isSending}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            
            <Pressable 
              onPress={handleSendTip}
              style={[styles.sendButton, isSending && styles.sendingButton]}
              disabled={isSending}
            >
              {isSending ? (
                <Text style={styles.sendText}>Sending...</Text>
              ) : (
                <>
                  <Feather name="gift" size={16} color="#fff" />
                  <Text style={styles.sendText}>Send Tip</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}
      
      {tipCount > 0 ? (
        <Text style={styles.tipStats}>
          {formatCurrency(totalTips)} from {tipCount} tips
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 20,
    padding: Spacing.md,
    minWidth: 260,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  ownerHeader: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  coinIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
  },
  ownerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: Spacing.xs,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  tipCount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  recipientText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  amountButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    height: 44,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginRight: 4,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  goButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  sparkles: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  sparkleEmoji: {
    fontSize: 24,
  },
  confirmAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: Spacing.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: '#FFD700',
  },
  sendingButton: {
    opacity: 0.7,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  tipStats: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
});
