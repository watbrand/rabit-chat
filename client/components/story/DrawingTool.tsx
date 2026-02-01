import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { Feather } from '@expo/vector-icons';
import Haptics from "@/lib/safeHaptics";
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  isEraser: boolean;
}

export interface DrawingToolProps {
  visible: boolean;
  onClose: () => void;
  onSave: (strokes: Stroke[]) => void;
  initialStrokes?: Stroke[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLOR_PRESETS = [
  '#FFFFFF',
  '#000000',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

const MIN_BRUSH_SIZE = 2;
const MAX_BRUSH_SIZE = 20;

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    return `M${points[0].x},${points[0].y} L${points[0].x},${points[0].y}`;
  }
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L${points[i].x},${points[i].y}`;
  }
  return path;
}

export default function DrawingTool({
  visible,
  onClose,
  onSave,
  initialStrokes = [],
}: DrawingToolProps) {
  const { theme, isDark } = useTheme();
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [currentColor, setCurrentColor] = useState(COLOR_PRESETS[0]);
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  
  const currentStroke = useRef<Stroke | null>(null);
  const strokeIdCounter = useRef(initialStrokes.length);

  const toolbarOpacity = useSharedValue(1);

  const generateStrokeId = useCallback(() => {
    return `stroke-${Date.now()}-${strokeIdCounter.current++}`;
  }, []);

  const startStroke = useCallback((x: number, y: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    currentStroke.current = {
      id: generateStrokeId(),
      points: [{ x, y }],
      color: isEraser ? 'transparent' : currentColor,
      size: brushSize,
      isEraser,
    };
    setStrokes(prev => [...prev, currentStroke.current!]);
  }, [currentColor, brushSize, isEraser, generateStrokeId]);

  const continueStroke = useCallback((x: number, y: number) => {
    if (!currentStroke.current) return;
    currentStroke.current.points.push({ x, y });
    setStrokes(prev => {
      const updated = [...prev];
      const index = updated.findIndex(s => s.id === currentStroke.current?.id);
      if (index !== -1) {
        updated[index] = { ...currentStroke.current! };
      }
      return updated;
    });
  }, []);

  const endStroke = useCallback(() => {
    currentStroke.current = null;
  }, []);

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      runOnJS(startStroke)(event.x, event.y);
    })
    .onUpdate((event) => {
      runOnJS(continueStroke)(event.x, event.y);
    })
    .onEnd(() => {
      runOnJS(endStroke)();
    })
    .minDistance(0);

  const handleUndo = useCallback(() => {
    if (strokes.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStrokes(prev => prev.slice(0, -1));
  }, [strokes.length]);

  const handleClear = useCallback(() => {
    if (strokes.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setStrokes([]);
  }, [strokes.length]);

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(strokes);
  }, [strokes, onSave]);

  const handleColorSelect = useCallback((color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentColor(color);
    setIsEraser(false);
  }, []);

  const toggleEraser = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsEraser(prev => !prev);
  }, []);

  const toolbarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: toolbarOpacity.value,
  }));

  if (!visible) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          style={styles.headerButton}
        >
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            onPress={handleUndo}
            style={[styles.headerButton, strokes.length === 0 && styles.buttonDisabled]}
            disabled={strokes.length === 0}
          >
            <Feather name="corner-up-left" size={20} color={Colors.dark.text} />
          </Pressable>

          <Pressable
            onPress={handleClear}
            style={[styles.headerButton, strokes.length === 0 && styles.buttonDisabled]}
            disabled={strokes.length === 0}
          >
            <Feather name="trash-2" size={20} color={Colors.dark.error} />
          </Pressable>
        </View>

        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Feather name="check" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <GestureDetector gesture={panGesture}>
        <View style={styles.canvas}>
          <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            <G>
              {strokes.map(stroke => (
                <Path
                  key={stroke.id}
                  d={pointsToPath(stroke.points)}
                  stroke={stroke.isEraser ? 'transparent' : stroke.color}
                  strokeWidth={stroke.size}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={stroke.isEraser ? 0 : 1}
                />
              ))}
            </G>
          </Svg>
        </View>
      </GestureDetector>

      <Animated.View style={[styles.toolbar, toolbarAnimatedStyle]}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.toolbarBlur}
        >
          <View style={styles.toolbarContent}>
            <View style={styles.toolsRow}>
              <Pressable
                onPress={() => setIsEraser(false)}
                style={[
                  styles.toolButton,
                  !isEraser && styles.toolButtonActive,
                ]}
              >
                <Feather
                  name="edit-2"
                  size={22}
                  color={!isEraser ? Colors.dark.primary : Colors.dark.text}
                />
              </Pressable>

              <Pressable
                onPress={toggleEraser}
                style={[
                  styles.toolButton,
                  isEraser && styles.toolButtonActive,
                ]}
              >
                <Feather
                  name="edit-3"
                  size={22}
                  color={isEraser ? Colors.dark.primary : Colors.dark.text}
                />
              </Pressable>
            </View>

            <View style={styles.sliderContainer}>
              <Feather name="minus" size={16} color={theme.textSecondary} />
              <Slider
                style={styles.slider}
                minimumValue={MIN_BRUSH_SIZE}
                maximumValue={MAX_BRUSH_SIZE}
                value={brushSize}
                onValueChange={setBrushSize}
                minimumTrackTintColor={Colors.dark.primary}
                maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                thumbTintColor={Colors.dark.primary}
              />
              <Feather name="plus" size={16} color={theme.textSecondary} />
              <View style={[styles.brushPreview, { width: brushSize, height: brushSize }]} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorPalette}
            >
              {COLOR_PRESETS.map(color => (
                <Pressable
                  key={color}
                  onPress={() => handleColorSelect(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    currentColor === color && !isEraser && styles.colorOptionSelected,
                  ]}
                >
                  {currentColor === color && !isEraser ? (
                    <Feather
                      name="check"
                      size={16}
                      color={color === '#000000' ? '#FFFFFF' : '#000000'}
                    />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </BlurView>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    bottom: 40,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  toolbarBlur: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  toolbarContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  toolButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  toolButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.dark.primary,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  brushPreview: {
    borderRadius: 50,
    backgroundColor: Colors.dark.text,
    marginLeft: Spacing.sm,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
  },
});
