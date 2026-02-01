import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

export interface ColorOption {
  id: string;
  type: 'solid' | 'gradient' | 'luxury';
  value: string;
  gradient?: string[];
  name: string;
}

interface Props {
  selectedColor: string;
  onColorSelect: (color: ColorOption) => void;
}

const SOLID_COLORS: ColorOption[] = [
  { id: 'black', type: 'solid', value: '#000000', name: 'Midnight' },
  { id: 'purple', type: 'solid', value: '#8B5CF6', name: 'Royal Purple' },
  { id: 'blue', type: 'solid', value: '#3B82F6', name: 'Ocean Blue' },
  { id: 'teal', type: 'solid', value: '#14B8A6', name: 'Teal Wave' },
  { id: 'green', type: 'solid', value: '#22C55E', name: 'Emerald' },
  { id: 'yellow', type: 'solid', value: '#EAB308', name: 'Gold Rush' },
  { id: 'orange', type: 'solid', value: '#F97316', name: 'Sunset' },
  { id: 'red', type: 'solid', value: '#EF4444', name: 'Crimson' },
];

const GRADIENT_COLORS: ColorOption[] = [
  { id: 'purple-blue', type: 'gradient', value: 'gradient', gradient: ['#8B5CF6', '#3B82F6'], name: 'Royal Skies' },
  { id: 'pink-purple', type: 'gradient', value: 'gradient', gradient: ['#EC4899', '#8B5CF6'], name: 'Berry Dream' },
  { id: 'orange-red', type: 'gradient', value: 'gradient', gradient: ['#F97316', '#EF4444'], name: 'Fire' },
  { id: 'teal-blue', type: 'gradient', value: 'gradient', gradient: ['#14B8A6', '#3B82F6'], name: 'Ocean Depth' },
  { id: 'purple-pink', type: 'gradient', value: 'gradient', gradient: ['#8B5CF6', '#EC4899'], name: 'Twilight' },
  { id: 'yellow-orange', type: 'gradient', value: 'gradient', gradient: ['#EAB308', '#F97316'], name: 'Sunrise' },
  { id: 'green-teal', type: 'gradient', value: 'gradient', gradient: ['#22C55E', '#14B8A6'], name: 'Forest' },
  { id: 'blue-purple', type: 'gradient', value: 'gradient', gradient: ['#3B82F6', '#8B5CF6'], name: 'Nebula' },
];

const LUXURY_COLORS: ColorOption[] = [
  { id: 'gold', type: 'luxury', value: 'luxury', gradient: ['#FFD700', '#D4AF37', '#B8860B'], name: 'Gold' },
  { id: 'diamond', type: 'luxury', value: 'luxury', gradient: ['#E0E8FF', '#A8C0FF', '#87CEEB'], name: 'Diamond' },
  { id: 'platinum', type: 'luxury', value: 'luxury', gradient: ['#E5E4E2', '#C0C0C0', '#A0A0A0'], name: 'Platinum' },
  { id: 'rose-gold', type: 'luxury', value: 'luxury', gradient: ['#F4C2C2', '#EAA9A9', '#B76E79'], name: 'Rose Gold' },
];

export default function StoryColorPicker({ selectedColor, onColorSelect }: Props) {
  const handleSelect = (color: ColorOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onColorSelect(color);
  };

  const isSelected = (color: ColorOption) => {
    if (color.type === 'solid') {
      return selectedColor === color.value;
    }
    return selectedColor === color.id;
  };

  const renderColorItem = (color: ColorOption) => {
    const selected = isSelected(color);
    
    return (
      <Pressable
        key={color.id}
        onPress={() => handleSelect(color)}
        style={[styles.colorItem, selected && styles.selectedItem]}
      >
        {color.type === 'solid' ? (
          <View style={[styles.colorCircle, { backgroundColor: color.value }]}>
            {selected && <Feather name="check" size={16} color="#fff" />}
          </View>
        ) : (
          <LinearGradient
            colors={color.gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.colorCircle}
          >
            {selected && <Feather name="check" size={16} color="#fff" />}
          </LinearGradient>
        )}
        <Text style={styles.colorName}>{color.name}</Text>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Solid Colors</Text>
      <View style={styles.colorGrid}>
        {SOLID_COLORS.map(renderColorItem)}
      </View>
      
      <Text style={styles.sectionTitle}>Gradients</Text>
      <View style={styles.colorGrid}>
        {GRADIENT_COLORS.map(renderColorItem)}
      </View>
      
      <Text style={styles.sectionTitle}>Luxury</Text>
      <View style={styles.colorGrid}>
        {LUXURY_COLORS.map(renderColorItem)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorItem: {
    alignItems: 'center',
    width: 70,
    padding: Spacing.xs,
    borderRadius: 12,
  },
  selectedItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  colorName: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
