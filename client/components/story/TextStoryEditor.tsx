import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Text, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import StoryColorPicker, { ColorOption } from './StoryColorPicker';
import StoryFontPicker, { FontFamily } from './StoryFontPicker';
import StoryTextAnimationPicker, { TextAnimation } from './StoryTextAnimationPicker';

interface Props {
  onSave: (data: {
    textContent: string;
    backgroundColor: string;
    isGradient: boolean;
    gradientColors?: string[];
    fontFamily: FontFamily;
    fontSize: number;
    textAlignment: 'left' | 'center' | 'right';
    textAnimation: TextAnimation;
  }) => void;
  onCancel: () => void;
  initialData?: {
    textContent?: string;
    backgroundColor?: string;
    fontFamily?: FontFamily;
    fontSize?: number;
    textAlignment?: 'left' | 'center' | 'right';
    textAnimation?: TextAnimation;
  };
}

type EditorTab = 'text' | 'color' | 'font' | 'animation';

export default function TextStoryEditor({ onSave, onCancel, initialData }: Props) {
  const [text, setText] = useState(initialData?.textContent || '');
  const [selectedColor, setSelectedColor] = useState<ColorOption>({
    id: 'purple',
    type: 'solid',
    value: initialData?.backgroundColor || '#8B5CF6',
    name: 'Royal Purple',
  });
  const [fontFamily, setFontFamily] = useState<FontFamily>(initialData?.fontFamily || 'POPPINS');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 28);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>(
    initialData?.textAlignment || 'center'
  );
  const [textAnimation, setTextAnimation] = useState<TextAnimation>(
    initialData?.textAnimation || 'NONE'
  );
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  
  const textInputRef = useRef<TextInput>(null);

  const handleColorSelect = (color: ColorOption) => {
    setSelectedColor(color);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAlignmentToggle = () => {
    const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const currentIndex = alignments.indexOf(textAlignment);
    setTextAlignment(alignments[(currentIndex + 1) % 3]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    if (!text.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    onSave({
      textContent: text.trim(),
      backgroundColor: selectedColor.type === 'solid' ? selectedColor.value : selectedColor.id,
      isGradient: selectedColor.type !== 'solid',
      gradientColors: selectedColor.gradient,
      fontFamily,
      fontSize,
      textAlignment,
      textAnimation,
    });
  };

  const getBackgroundStyle = () => {
    if (selectedColor.type === 'solid') {
      return { backgroundColor: selectedColor.value };
    }
    return {};
  };

  const renderBackground = () => {
    if (selectedColor.type === 'solid') {
      return <View style={[styles.preview, { backgroundColor: selectedColor.value }]} />;
    }
    return (
      <LinearGradient
        colors={selectedColor.gradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.preview}
      />
    );
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={styles.headerButton}>
            <Feather name="x" size={24} color={Colors.dark.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Text Story</Text>
          <Pressable 
            onPress={handleSave} 
            style={[styles.headerButton, styles.saveButton]}
            disabled={!text.trim()}
          >
            <Text style={[styles.saveText, !text.trim() && styles.saveTextDisabled]}>
              Next
            </Text>
          </Pressable>
        </View>

        <View style={styles.previewContainer}>
          {renderBackground()}
          <View style={styles.previewOverlay}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  fontFamily: getFontFamily(fontFamily),
                  fontSize: fontSize,
                  textAlign: textAlignment,
                },
              ]}
              value={text}
              onChangeText={setText}
              placeholder="Type something..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              maxLength={300}
              autoFocus
            />
          </View>
        </View>

        <View style={styles.toolsContainer}>
          <View style={styles.toolTabs}>
            {(['text', 'color', 'font', 'animation'] as EditorTab[]).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.toolTab, activeTab === tab && styles.activeToolTab]}
              >
                <Feather
                  name={
                    tab === 'text' ? 'align-center' :
                    tab === 'color' ? 'droplet' :
                    tab === 'font' ? 'type' : 'zap'
                  }
                  size={20}
                  color={activeTab === tab ? Colors.dark.primary : Colors.dark.textSecondary}
                />
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.toolContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'text' && (
              <View style={styles.textTools}>
                <Pressable onPress={handleAlignmentToggle} style={styles.alignButton}>
                  <Feather 
                    name={`align-${textAlignment}` as any} 
                    size={24} 
                    color={Colors.dark.text} 
                  />
                  <Text style={styles.alignLabel}>
                    {textAlignment.charAt(0).toUpperCase() + textAlignment.slice(1)}
                  </Text>
                </Pressable>
                <Text style={styles.charCount}>{text.length}/300</Text>
              </View>
            )}
            {activeTab === 'color' && (
              <StoryColorPicker
                selectedColor={selectedColor.type === 'solid' ? selectedColor.value : selectedColor.id}
                onColorSelect={handleColorSelect}
              />
            )}
            {activeTab === 'font' && (
              <StoryFontPicker
                selectedFont={fontFamily}
                fontSize={fontSize}
                onFontSelect={setFontFamily}
                onFontSizeChange={setFontSize}
              />
            )}
            {activeTab === 'animation' && (
              <StoryTextAnimationPicker
                selectedAnimation={textAnimation}
                onAnimationSelect={setTextAnimation}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    width: 'auto',
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    flex: 1,
    margin: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  textInput: {
    width: '100%',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  toolsContainer: {
    maxHeight: 280,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  toolTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolTab: {
    width: 50,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeToolTab: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  toolContent: {
    maxHeight: 220,
  },
  textTools: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  alignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  alignLabel: {
    fontSize: 14,
    color: Colors.dark.text,
  },
  charCount: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});
