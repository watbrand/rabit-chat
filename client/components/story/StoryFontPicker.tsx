import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

export type FontFamily = 'POPPINS' | 'PLAYFAIR' | 'SPACE_MONO' | 'DANCING_SCRIPT' | 'BEBAS_NEUE';

export interface FontOption {
  id: FontFamily;
  name: string;
  displayFont: string;
  preview: string;
}

interface Props {
  selectedFont: FontFamily;
  fontSize: number;
  onFontSelect: (font: FontFamily) => void;
  onFontSizeChange: (size: number) => void;
}

const FONT_OPTIONS: FontOption[] = [
  { id: 'POPPINS', name: 'Modern', displayFont: 'Poppins_400Regular', preview: 'Aa' },
  { id: 'PLAYFAIR', name: 'Elegant', displayFont: 'PlayfairDisplay_400Regular', preview: 'Aa' },
  { id: 'SPACE_MONO', name: 'Tech', displayFont: 'SpaceMono_400Regular', preview: 'Aa' },
  { id: 'DANCING_SCRIPT', name: 'Script', displayFont: 'DancingScript_400Regular', preview: 'Aa' },
  { id: 'BEBAS_NEUE', name: 'Bold', displayFont: 'BebasNeue_400Regular', preview: 'AA' },
];

const getFontFamily = (font: FontFamily): string => {
  switch (font) {
    case 'POPPINS': return 'Poppins_400Regular';
    case 'PLAYFAIR': return 'PlayfairDisplay_400Regular';
    case 'SPACE_MONO': return 'SpaceMono_400Regular';
    case 'DANCING_SCRIPT': return 'DancingScript_400Regular';
    case 'BEBAS_NEUE': return 'BebasNeue_400Regular';
    default: return 'Poppins_400Regular';
  }
};

export default function StoryFontPicker({ selectedFont, fontSize, onFontSelect, onFontSizeChange }: Props) {
  const handleSelect = (font: FontFamily) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFontSelect(font);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Font Style</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontScroll}>
        {FONT_OPTIONS.map((font) => (
          <Pressable
            key={font.id}
            onPress={() => handleSelect(font.id)}
            style={[
              styles.fontItem,
              selectedFont === font.id && styles.selectedFontItem,
            ]}
          >
            <View style={styles.fontPreview}>
              <Text style={[styles.fontPreviewText, { fontFamily: getFontFamily(font.id) }]}>
                {font.preview}
              </Text>
            </View>
            <Text style={styles.fontName}>{font.name}</Text>
            {selectedFont === font.id && (
              <View style={styles.checkmark}>
                <Feather name="check" size={12} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Font Size</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sizeLabel}>A</Text>
        <Slider
          style={styles.slider}
          minimumValue={16}
          maximumValue={48}
          value={fontSize}
          onValueChange={onFontSizeChange}
          minimumTrackTintColor={Colors.dark.primary}
          maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
          thumbTintColor={Colors.dark.primary}
        />
        <Text style={[styles.sizeLabel, styles.sizeLabelLarge]}>A</Text>
      </View>

      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Preview</Text>
        <View style={styles.previewBox}>
          <Text
            style={[
              styles.previewText,
              {
                fontFamily: getFontFamily(selectedFont),
                fontSize: fontSize,
              },
            ]}
          >
            Your Story Text
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  fontScroll: {
    flexGrow: 0,
  },
  fontItem: {
    alignItems: 'center',
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 80,
  },
  selectedFontItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  fontPreview: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontPreviewText: {
    fontSize: 20,
    color: Colors.dark.text,
  },
  fontName: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sizeLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    width: 24,
    textAlign: 'center',
  },
  sizeLabelLarge: {
    fontSize: 24,
  },
  previewContainer: {
    marginTop: Spacing.lg,
  },
  previewLabel: {
    fontSize: 12,
    color: Colors.dark.textTertiary,
    marginBottom: Spacing.xs,
  },
  previewBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  previewText: {
    color: Colors.dark.text,
    textAlign: 'center',
  },
});
