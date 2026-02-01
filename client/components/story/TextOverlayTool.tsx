import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import Haptics from "@/lib/safeHaptics";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius, Animation } from '@/constants/theme';

export interface TextOverlayData {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  backgroundColor: string | null;
  position: { x: number; y: number };
}

export interface TextOverlayToolProps {
  visible: boolean;
  onClose: () => void;
  onAddText: (overlay: TextOverlayData) => void;
  initialData?: Partial<TextOverlayData>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FontId = 'poppins' | 'montserrat' | 'playfair' | 'spacemono' | 'dancing';

interface FontOption {
  id: FontId;
  name: string;
  displayFont: string;
}

const FONT_OPTIONS: FontOption[] = [
  { id: 'poppins', name: 'Poppins', displayFont: 'Poppins_400Regular' },
  { id: 'montserrat', name: 'Montserrat', displayFont: 'Montserrat_400Regular' },
  { id: 'playfair', name: 'Playfair', displayFont: 'PlayfairDisplay_400Regular' },
  { id: 'spacemono', name: 'Space Mono', displayFont: 'SpaceMono_400Regular' },
  { id: 'dancing', name: 'Cursive', displayFont: 'DancingScript_400Regular' },
];

const COLOR_PRESETS = [
  { id: 'white', value: '#FFFFFF', name: 'White' },
  { id: 'black', value: '#000000', name: 'Black' },
  { id: 'red', value: '#EF4444', name: 'Red' },
  { id: 'orange', value: '#F97316', name: 'Orange' },
  { id: 'yellow', value: '#EAB308', name: 'Yellow' },
  { id: 'green', value: '#22C55E', name: 'Green' },
  { id: 'blue', value: '#3B82F6', name: 'Blue' },
  { id: 'purple', value: '#8B5CF6', name: 'Purple' },
  { id: 'pink', value: '#EC4899', name: 'Pink' },
];

type BackgroundType = 'none' | 'solid' | 'blur';

const BACKGROUND_OPTIONS: { id: BackgroundType; name: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'none', name: 'None', icon: 'slash' },
  { id: 'solid', name: 'Solid', icon: 'square' },
  { id: 'blur', name: 'Blur', icon: 'droplet' },
];

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function TextOverlayTool({
  visible,
  onClose,
  onAddText,
  initialData,
}: TextOverlayToolProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [text, setText] = useState(initialData?.text || '');
  const [selectedFont, setSelectedFont] = useState<FontId>('poppins');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 32);
  const [textColor, setTextColor] = useState(initialData?.color || '#FFFFFF');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(
    initialData?.alignment || 'center'
  );
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('none');
  const [bgColor, setBgColor] = useState('rgba(0, 0, 0, 0.5)');

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, Animation.springBouncy);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, Animation.spring);
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  useEffect(() => {
    if (initialData) {
      setText(initialData.text || '');
      setFontSize(initialData.fontSize || 32);
      setTextColor(initialData.color || '#FFFFFF');
      setAlignment(initialData.alignment || 'center');
      if (initialData.fontFamily) {
        const font = FONT_OPTIONS.find(f => f.displayFont === initialData.fontFamily);
        if (font) setSelectedFont(font.id);
      }
      if (initialData.backgroundColor) {
        setBackgroundType('solid');
        setBgColor(initialData.backgroundColor);
      }
    }
  }, [initialData]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleClose = useCallback(() => {
    triggerHaptic();
    onClose();
  }, [onClose, triggerHaptic]);

  const handleAddText = useCallback(() => {
    if (!text.trim()) return;

    triggerHaptic();

    const fontOption = FONT_OPTIONS.find(f => f.id === selectedFont);
    
    const overlayData: TextOverlayData = {
      id: initialData?.id || generateId(),
      text: text.trim(),
      fontFamily: fontOption?.displayFont || 'Poppins_400Regular',
      fontSize,
      color: textColor,
      alignment,
      backgroundColor: backgroundType !== 'none' ? bgColor : null,
      position: initialData?.position || { x: 0.5, y: 0.5 },
    };

    onAddText(overlayData);
    handleClose();
  }, [text, selectedFont, fontSize, textColor, alignment, backgroundType, bgColor, initialData, onAddText, handleClose, triggerHaptic]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const getTextBackground = () => {
    if (backgroundType === 'none') return 'transparent';
    if (backgroundType === 'solid') return bgColor;
    return 'rgba(0, 0, 0, 0.4)';
  };

  const selectedFontOption = FONT_OPTIONS.find(f => f.id === selectedFont);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.modalContainer}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <View style={styles.blurOverlay} />
            </BlurView>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBackground]} />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Add Text</Text>
            <Pressable
              onPress={handleAddText}
              style={[styles.headerButton, styles.doneButton]}
              disabled={!text.trim()}
            >
              <Text style={[styles.doneText, !text.trim() && styles.doneTextDisabled]}>
                Done
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.previewContainer}>
              <View
                style={[
                  styles.previewBox,
                  { backgroundColor: getTextBackground() },
                  backgroundType === 'blur' && styles.blurredBackground,
                ]}
              >
                <Text
                  style={[
                    styles.previewText,
                    {
                      fontFamily: selectedFontOption?.displayFont,
                      fontSize: Math.min(fontSize, 36),
                      color: textColor,
                      textAlign: alignment,
                    },
                  ]}
                  numberOfLines={3}
                >
                  {text || 'Your text here'}
                </Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="Enter your text..."
                placeholderTextColor={theme.textTertiary}
                value={text}
                onChangeText={setText}
                multiline
                maxLength={200}
                autoFocus
              />
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Font Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontScroll}>
              {FONT_OPTIONS.map((font) => (
                <Pressable
                  key={font.id}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedFont(font.id);
                  }}
                  style={[
                    styles.fontItem,
                    selectedFont === font.id && styles.selectedFontItem,
                  ]}
                >
                  <View style={styles.fontPreview}>
                    <Text style={[styles.fontPreviewText, { fontFamily: font.displayFont }]}>
                      Aa
                    </Text>
                  </View>
                  <Text style={[styles.fontName, { color: theme.textSecondary }]}>
                    {font.name}
                  </Text>
                  {selectedFont === font.id ? (
                    <View style={styles.checkmark}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Font Size</Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sizeLabel, { color: theme.textSecondary }]}>A</Text>
              <Slider
                style={styles.slider}
                minimumValue={16}
                maximumValue={72}
                value={fontSize}
                onValueChange={setFontSize}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor={theme.primary}
              />
              <Text style={[styles.sizeLabelLarge, { color: theme.textSecondary }]}>A</Text>
              <Text style={[styles.sizeValue, { color: theme.text }]}>{Math.round(fontSize)}px</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Text Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_PRESETS.map((color) => (
                <Pressable
                  key={color.id}
                  onPress={() => {
                    triggerHaptic();
                    setTextColor(color.value);
                  }}
                  style={[
                    styles.colorItem,
                    textColor === color.value && styles.selectedColorItem,
                  ]}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      color.id === 'white' && styles.whiteCircleBorder,
                    ]}
                  >
                    {textColor === color.value ? (
                      <Feather
                        name="check"
                        size={16}
                        color={color.id === 'white' || color.id === 'yellow' ? '#000' : '#fff'}
                      />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Text Alignment</Text>
            <View style={styles.alignmentContainer}>
              {(['left', 'center', 'right'] as const).map((align) => (
                <Pressable
                  key={align}
                  onPress={() => {
                    triggerHaptic();
                    setAlignment(align);
                  }}
                  style={[
                    styles.alignmentButton,
                    alignment === align && styles.selectedAlignmentButton,
                  ]}
                >
                  <Feather
                    name={`align-${align}` as keyof typeof Feather.glyphMap}
                    size={20}
                    color={alignment === align ? '#fff' : theme.textSecondary}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Background</Text>
            <View style={styles.backgroundContainer}>
              {BACKGROUND_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    triggerHaptic();
                    setBackgroundType(option.id);
                  }}
                  style={[
                    styles.backgroundButton,
                    backgroundType === option.id && styles.selectedBackgroundButton,
                  ]}
                >
                  <Feather
                    name={option.icon}
                    size={20}
                    color={backgroundType === option.id ? '#fff' : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.backgroundLabel,
                      { color: backgroundType === option.id ? '#fff' : theme.textSecondary },
                    ]}
                  >
                    {option.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {backgroundType === 'solid' ? (
              <View style={styles.bgColorSection}>
                <Text style={[styles.subSectionTitle, { color: theme.textTertiary }]}>
                  Background Color
                </Text>
                <View style={styles.colorGrid}>
                  {COLOR_PRESETS.slice(0, 5).map((color) => (
                    <Pressable
                      key={`bg-${color.id}`}
                      onPress={() => {
                        triggerHaptic();
                        setBgColor(color.value + '80');
                      }}
                      style={[
                        styles.colorItem,
                        bgColor.startsWith(color.value) && styles.selectedColorItem,
                      ]}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: color.value + '80' },
                        ]}
                      >
                        {bgColor.startsWith(color.value) ? (
                          <Feather name="check" size={16} color="#fff" />
                        ) : null}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 20, 30, 0.85)',
  },
  androidBackground: {
    backgroundColor: 'rgba(20, 20, 30, 0.98)',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    padding: Spacing.xs,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    alignItems: 'flex-end',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  doneTextDisabled: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  previewContainer: {
    marginBottom: Spacing.lg,
  },
  previewBox: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurredBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewText: {
    width: '100%',
  },
  inputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: Spacing.lg,
  },
  textInput: {
    fontSize: 16,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  subSectionTitle: {
    fontSize: 12,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  fontScroll: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
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
    fontSize: 11,
    marginTop: Spacing.xs,
    textAlign: 'center',
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
    paddingHorizontal: Spacing.xs,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sizeLabel: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  sizeLabelLarge: {
    fontSize: 24,
    width: 24,
    textAlign: 'center',
  },
  sizeValue: {
    fontSize: 14,
    marginLeft: Spacing.sm,
    minWidth: 45,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorItem: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  selectedColorItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteCircleBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  alignmentContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  alignmentButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAlignmentButton: {
    backgroundColor: Colors.dark.primary,
  },
  backgroundContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backgroundButton: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  selectedBackgroundButton: {
    backgroundColor: Colors.dark.primary,
  },
  backgroundLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  bgColorSection: {
    marginTop: Spacing.sm,
  },
});
