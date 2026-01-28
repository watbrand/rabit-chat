import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Text, 
  Dimensions,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface DrawPath {
  id: string;
  d: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

interface Props {
  onSave: (paths: DrawPath[]) => void;
  onClose: () => void;
  initialPaths?: DrawPath[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#FF6B00', '#FFFF00',
  '#00FF00', '#00FFFF', '#0066FF', '#6600FF', '#FF00FF',
  Colors.dark.primary, '#FFD700', '#C0C0C0', '#FF69B4',
];

const BRUSH_SIZES = [
  { size: 3, label: 'XS' },
  { size: 6, label: 'S' },
  { size: 12, label: 'M' },
  { size: 20, label: 'L' },
  { size: 32, label: 'XL' },
];

export default function StoryDrawingTool({ onSave, onClose, initialPaths = [] }: Props) {
  const [paths, setPaths] = useState<DrawPath[]>(initialPaths);
  const [undoStack, setUndoStack] = useState<DrawPath[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawPath[][]>([]);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [currentBrushSize, setCurrentBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBrushPicker, setShowBrushPicker] = useState(false);
  
  const currentPath = useRef<string>('');
  const pathId = useRef(0);

  const colorPickerScale = useSharedValue(0);
  const brushPickerScale = useSharedValue(0);

  const handleTouchStart = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    currentPath.current = `M${locationX},${locationY}`;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleTouchMove = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    currentPath.current += ` L${locationX},${locationY}`;
    
    const newPath: DrawPath = {
      id: `temp-${pathId.current}`,
      d: currentPath.current,
      color: isEraser ? 'transparent' : currentColor,
      strokeWidth: currentBrushSize,
      opacity: isEraser ? 0 : 1,
    };
    
    setPaths(prev => {
      const filtered = prev.filter(p => !p.id.startsWith('temp-'));
      return [...filtered, newPath];
    });
  }, [currentColor, currentBrushSize, isEraser]);

  const handleTouchEnd = useCallback(() => {
    if (!currentPath.current) return;
    
    setUndoStack(prev => [...prev, paths.filter(p => !p.id.startsWith('temp-'))]);
    setRedoStack([]);
    
    const finalPath: DrawPath = {
      id: `path-${pathId.current++}`,
      d: currentPath.current,
      color: isEraser ? 'transparent' : currentColor,
      strokeWidth: currentBrushSize,
      opacity: isEraser ? 0 : 1,
    };
    
    setPaths(prev => {
      const filtered = prev.filter(p => !p.id.startsWith('temp-'));
      return [...filtered, finalPath];
    });
    
    currentPath.current = '';
  }, [paths, currentColor, currentBrushSize, isEraser]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouchStart,
      onPanResponderMove: handleTouchMove,
      onPanResponderRelease: handleTouchEnd,
    })
  ).current;

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousPaths = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, paths]);
    setUndoStack(prev => prev.slice(0, -1));
    setPaths(previousPaths);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextPaths = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, paths]);
    setRedoStack(prev => prev.slice(0, -1));
    setPaths(nextPaths);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleClear = () => {
    if (paths.length === 0) return;
    setUndoStack(prev => [...prev, paths]);
    setRedoStack([]);
    setPaths([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleColorPicker = () => {
    setShowBrushPicker(false);
    setShowColorPicker(!showColorPicker);
    colorPickerScale.value = withSpring(showColorPicker ? 0 : 1);
    brushPickerScale.value = withSpring(0);
  };

  const toggleBrushPicker = () => {
    setShowColorPicker(false);
    setShowBrushPicker(!showBrushPicker);
    brushPickerScale.value = withSpring(showBrushPicker ? 0 : 1);
    colorPickerScale.value = withSpring(0);
  };

  const selectColor = (color: string) => {
    setCurrentColor(color);
    setIsEraser(false);
    setShowColorPicker(false);
    colorPickerScale.value = withSpring(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectBrushSize = (size: number) => {
    setCurrentBrushSize(size);
    setShowBrushPicker(false);
    brushPickerScale.value = withSpring(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSave = () => {
    const finalPaths = paths.filter(p => !p.id.startsWith('temp-'));
    onSave(finalPaths);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const colorPickerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: colorPickerScale.value }],
    opacity: colorPickerScale.value,
  }));

  const brushPickerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: brushPickerScale.value }],
    opacity: brushPickerScale.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.headerButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        
        <View style={styles.headerActions}>
          <Pressable 
            onPress={handleUndo} 
            style={[styles.headerButton, undoStack.length === 0 && styles.buttonDisabled]}
            disabled={undoStack.length === 0}
          >
            <Feather name="rotate-ccw" size={20} color={Colors.dark.text} />
          </Pressable>
          
          <Pressable 
            onPress={handleRedo}
            style={[styles.headerButton, redoStack.length === 0 && styles.buttonDisabled]}
            disabled={redoStack.length === 0}
          >
            <Feather name="rotate-cw" size={20} color={Colors.dark.text} />
          </Pressable>
          
          <Pressable onPress={handleClear} style={styles.headerButton}>
            <Feather name="trash-2" size={20} color={Colors.dark.error} />
          </Pressable>
        </View>
        
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT - 180}>
          <G>
            {paths.map(path => (
              <Path
                key={path.id}
                d={path.d}
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={path.opacity}
              />
            ))}
          </G>
        </Svg>
      </View>

      <View style={styles.toolbar}>
        <Pressable 
          onPress={toggleColorPicker} 
          style={[styles.toolButton, { backgroundColor: currentColor }]}
        >
          {isEraser ? null : <View style={[styles.colorPreview, { backgroundColor: currentColor }]} />}
        </Pressable>
        
        <Pressable 
          onPress={toggleBrushPicker} 
          style={styles.toolButton}
        >
          <View style={[styles.brushPreview, { width: currentBrushSize, height: currentBrushSize }]} />
        </Pressable>
        
        <Pressable 
          onPress={toggleEraser}
          style={[styles.toolButton, isEraser && styles.toolButtonActive]}
        >
          <Feather name="edit-3" size={24} color={isEraser ? Colors.dark.primary : Colors.dark.text} />
        </Pressable>
      </View>

      {showColorPicker ? (
        <Animated.View style={[styles.colorPicker, colorPickerStyle]}>
          {COLORS.map(color => (
            <Pressable
              key={color}
              onPress={() => selectColor(color)}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                currentColor === color && styles.colorOptionSelected,
              ]}
            />
          ))}
        </Animated.View>
      ) : null}

      {showBrushPicker ? (
        <Animated.View style={[styles.brushPicker, brushPickerStyle]}>
          {BRUSH_SIZES.map(({ size, label }) => (
            <Pressable
              key={size}
              onPress={() => selectBrushSize(size)}
              style={[
                styles.brushOption,
                currentBrushSize === size && styles.brushOptionSelected,
              ]}
            >
              <View style={[styles.brushDot, { width: size, height: size }]} />
              <Text style={styles.brushLabel}>{label}</Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  toolButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toolButtonActive: {
    borderColor: Colors.dark.primary,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  brushPreview: {
    borderRadius: 50,
    backgroundColor: Colors.dark.text,
  },
  colorPicker: {
    position: 'absolute',
    bottom: 160,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  brushPicker: {
    position: 'absolute',
    bottom: 160,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  brushOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: 12,
  },
  brushOptionSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  brushDot: {
    backgroundColor: '#fff',
    borderRadius: 50,
    marginBottom: Spacing.xs,
  },
  brushLabel: {
    fontSize: 11,
    color: Colors.dark.text,
    fontWeight: '500',
  },
});
