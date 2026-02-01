import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Haptics from "@/lib/safeHaptics";
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

interface Props {
  format?: 'time' | 'date' | 'datetime';
  style?: 'minimal' | 'clock' | 'digital';
  isEditing?: boolean;
  onSelect?: (format: string, style: string) => void;
}

type FormatType = 'time' | 'date' | 'datetime';
type StyleType = 'minimal' | 'clock' | 'digital';

const FORMATS: { id: FormatType; label: string; example: string }[] = [
  { id: 'time', label: 'Time Only', example: '2:30 PM' },
  { id: 'date', label: 'Date Only', example: 'Jan 20' },
  { id: 'datetime', label: 'Date & Time', example: 'Jan 20, 2:30 PM' },
];

const STYLES: { id: StyleType; label: string }[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'clock', label: 'Clock' },
  { id: 'digital', label: 'Digital' },
];

export default function TimeSticker({
  format = 'time',
  style = 'minimal',
  isEditing = false,
  onSelect,
}: Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedFormat, setSelectedFormat] = useState(format);
  const [selectedStyle, setSelectedStyle] = useState(style);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    switch (selectedFormat) {
      case 'time':
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      case 'date':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'datetime':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      default:
        return date.toLocaleTimeString();
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect?.(selectedFormat, selectedStyle);
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.header}>
          <Feather name="clock" size={18} color={Colors.dark.primary} />
          <Text style={styles.headerText}>Add Time</Text>
        </View>
        
        <View style={styles.previewContainer}>
          <TimeStickerDisplay 
            time={currentTime}
            format={selectedFormat}
            displayStyle={selectedStyle}
          />
        </View>
        
        <Text style={styles.sectionLabel}>Format</Text>
        <View style={styles.optionGroup}>
          {FORMATS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => setSelectedFormat(f.id)}
              style={[
                styles.optionButton,
                selectedFormat === f.id && styles.optionButtonActive,
              ]}
            >
              <Text style={[
                styles.optionLabel,
                selectedFormat === f.id && styles.optionLabelActive,
              ]}>
                {f.label}
              </Text>
              <Text style={styles.optionExample}>{f.example}</Text>
            </Pressable>
          ))}
        </View>
        
        <Text style={styles.sectionLabel}>Style</Text>
        <View style={styles.styleGroup}>
          {STYLES.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSelectedStyle(s.id)}
              style={[
                styles.styleButton,
                selectedStyle === s.id && styles.styleButtonActive,
              ]}
            >
              <Text style={[
                styles.styleLabel,
                selectedStyle === s.id && styles.styleLabelActive,
              ]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
        
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Add</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <TimeStickerDisplay 
      time={currentTime}
      format={format}
      displayStyle={style}
    />
  );
}

function TimeStickerDisplay({ 
  time, 
  format, 
  displayStyle 
}: { 
  time: Date; 
  format: string; 
  displayStyle: string; 
}) {
  const formatTimeDisplay = () => {
    switch (format) {
      case 'time':
        return time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      case 'date':
        return time.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'datetime':
        return time.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      default:
        return time.toLocaleTimeString();
    }
  };

  if (displayStyle === 'clock') {
    return (
      <View style={styles.clockContainer}>
        <Feather name="clock" size={16} color={Colors.dark.primary} />
        <Text style={styles.clockText}>{formatTimeDisplay()}</Text>
      </View>
    );
  }

  if (displayStyle === 'digital') {
    return (
      <View style={styles.digitalContainer}>
        <Text style={styles.digitalText}>{formatTimeDisplay()}</Text>
      </View>
    );
  }

  return (
    <View style={styles.minimalContainer}>
      <Text style={styles.minimalText}>{formatTimeDisplay()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  minimalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  minimalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  clockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  digitalContainer: {
    backgroundColor: '#000',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  digitalText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.primary,
    fontFamily: 'monospace',
  },
  editContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 16,
    padding: Spacing.md,
    width: 280,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  optionGroup: {
    marginBottom: Spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.dark.primary,
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 14,
    color: '#fff',
  },
  optionLabelActive: {
    fontWeight: '600',
  },
  optionExample: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  styleGroup: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  styleButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  styleButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  styleLabel: {
    fontSize: 13,
    color: '#fff',
  },
  styleLabelActive: {
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});
