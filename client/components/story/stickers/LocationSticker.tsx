import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, TextInput } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { InlineLoader } from '@/components/animations';

interface Props {
  locationName?: string;
  coordinates?: { latitude: number; longitude: number };
  isEditing?: boolean;
  onEdit?: (name: string, coords: { latitude: number; longitude: number }) => void;
  onPress?: () => void;
}

export default function LocationSticker({
  locationName,
  coordinates,
  isEditing = false,
  onEdit,
  onPress,
}: Props) {
  const [editName, setEditName] = useState(locationName || '');
  const [currentCoords, setCurrentCoords] = useState(coordinates);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pinBounce = useSharedValue(0);

  useEffect(() => {
    if (isEditing && !currentCoords) {
      getCurrentLocation();
    }
  }, [isEditing]);

  useEffect(() => {
    pinBounce.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1
    );
  }, [pinBounce]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setIsLoading(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setCurrentCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (reverseGeocode[0]) {
        const place = reverseGeocode[0];
        const name = place.name || place.street || place.city || 'Current Location';
        setEditName(name);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('Failed to get location');
    }
    
    setIsLoading(false);
  };

  const handleSave = () => {
    if (!editName.trim() || !currentCoords) return;
    onEdit?.(editName.trim(), currentCoords);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinBounce.value }],
  }));

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <View style={styles.header}>
          <Feather name="map-pin" size={18} color={Colors.dark.primary} />
          <Text style={styles.headerText}>Add Location</Text>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <InlineLoader size={20} />
            <Text style={styles.loadingText}>Finding your location...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={getCurrentLocation} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.nameInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Location name..."
              placeholderTextColor={Colors.dark.textSecondary}
              maxLength={50}
            />
            
            {currentCoords ? (
              <Text style={styles.coordsText}>
                {currentCoords.latitude.toFixed(4)}, {currentCoords.longitude.toFixed(4)}
              </Text>
            ) : null}
            
            <View style={styles.buttonRow}>
              <Pressable onPress={getCurrentLocation} style={styles.refreshButton}>
                <Feather name="refresh-cw" size={16} color={Colors.dark.text} />
              </Pressable>
              <Pressable 
                onPress={handleSave}
                style={[styles.saveButton, (!editName.trim() || !currentCoords) && styles.saveButtonDisabled]}
                disabled={!editName.trim() || !currentCoords}
              >
                <Text style={styles.saveText}>Add</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.View style={pinStyle}>
        <Feather name="map-pin" size={16} color={Colors.dark.primary} />
      </Animated.View>
      <Text style={styles.locationName}>{locationName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  editContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: Spacing.md,
    minWidth: 240,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    color: Colors.dark.error,
    marginBottom: Spacing.sm,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryText: {
    fontSize: 13,
    color: Colors.dark.text,
  },
  nameInput: {
    fontSize: 15,
    color: '#fff',
    padding: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: Spacing.sm,
  },
  coordsText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
