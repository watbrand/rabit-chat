import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  ViewStyle,
  Modal,
  Pressable,
} from "react-native";
import { InlineLoader } from "@/components/animations";
import { BlurView } from "expo-blur";
import { Picker } from "@react-native-picker/picker";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

interface LocationData {
  country: string;
  province: string;
  city: string;
}

interface Province {
  code: string;
  name: string;
  cities: string[];
}

interface Country {
  code: string;
  name: string;
  provinces: Province[];
}

interface LocationApiResponse {
  countries: Country[];
}

interface LocationPickerProps {
  onLocationChange: (location: LocationData) => void;
  initialLocation?: LocationData;
  containerStyle?: ViewStyle;
  label?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function LocationPicker({
  onLocationChange,
  initialLocation,
  containerStyle,
  label,
}: LocationPickerProps) {
  const { theme, isDark } = useTheme();
  
  const [selectedCountry, setSelectedCountry] = useState(initialLocation?.country || "");
  const [selectedProvince, setSelectedProvince] = useState(initialLocation?.province || "");
  const [selectedCity, setSelectedCity] = useState(initialLocation?.city || "");
  
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const focusProgress = useSharedValue(0);

  const { data: locationData, isLoading, isError, error } = useQuery<LocationApiResponse>({
    queryKey: ["/api/locations"],
    staleTime: 1000 * 60 * 60,
  });

  const countries = locationData?.countries || [];
  
  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const provinces = selectedCountryData?.provinces || [];
  
  const selectedProvinceData = provinces.find(p => p.code === selectedProvince || p.name === selectedProvince);
  const cities = selectedProvinceData?.cities || [];

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  useEffect(() => {
    if (selectedCountry && selectedProvince && selectedCity) {
      onLocationChange({
        country: selectedCountry,
        province: selectedProvince,
        city: selectedCity,
      });
    }
  }, [selectedCountry, selectedProvince, selectedCity, onLocationChange]);

  useEffect(() => {
    if (initialLocation) {
      setSelectedCountry(initialLocation.country);
      setSelectedProvince(initialLocation.province);
      setSelectedCity(initialLocation.city);
    }
  }, [initialLocation?.country, initialLocation?.province, initialLocation?.city]);

  const handleCountryChange = (value: string) => {
    if (value !== selectedCountry) {
      triggerHaptic();
      setSelectedCountry(value);
      setSelectedProvince("");
      setSelectedCity("");
    }
  };

  const handleProvinceChange = (value: string) => {
    if (value !== selectedProvince) {
      triggerHaptic();
      setSelectedProvince(value);
      setSelectedCity("");
    }
  };

  const handleCityChange = (value: string) => {
    if (value !== selectedCity) {
      triggerHaptic();
      setSelectedCity(value);
    }
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      [
        isDark ? "rgba(139, 92, 246, 0.20)" : "rgba(255, 255, 255, 0.6)",
        theme.primary,
      ]
    );

    return {
      borderColor,
    };
  });

  const getDisplayText = (value: string, items: { code?: string; name: string }[], placeholder: string) => {
    if (!value) return placeholder;
    const item = items.find(i => i.code === value || i.name === value);
    return item?.name || value;
  };

  const renderPickerButton = (
    value: string,
    displayItems: { code?: string; name: string }[],
    placeholder: string,
    onPress: () => void,
    disabled: boolean,
    testID: string,
    icon: string
  ) => {
    const displayText = getDisplayText(value, displayItems, placeholder);
    const hasValue = !!value;

    return (
      <Pressable
        testID={testID}
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          styles.pickerButton,
          {
            backgroundColor: isDark
              ? "rgba(26, 26, 36, 0.80)"
              : "rgba(255, 255, 255, 0.85)",
            borderColor: isDark ? "rgba(139, 92, 246, 0.20)" : "rgba(255, 255, 255, 0.6)",
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}
        disabled={disabled}
      >
        <Feather
          name={icon as any}
          size={18}
          color={hasValue ? theme.primary : theme.textTertiary}
          style={styles.pickerIcon}
        />
        <ThemedText
          style={[
            styles.pickerText,
            { color: hasValue ? theme.text : theme.textTertiary },
          ]}
          numberOfLines={1}
        >
          {displayText}
        </ThemedText>
        <Feather
          name="chevron-down"
          size={18}
          color={theme.textSecondary}
        />
      </Pressable>
    );
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    value: string,
    onValueChange: (value: string) => void,
    items: { code?: string; name: string }[],
    title: string,
    testIDPrefix: string
  ) => {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={onClose} />
          {Platform.OS === "ios" ? (
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? "dark" : "light"}
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "rgba(26, 26, 36, 0.85)" : "rgba(255, 255, 255, 0.92)" },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="headline" style={styles.modalTitle}>
                  {title}
                </ThemedText>
                <Pressable
                  testID={`${testIDPrefix}-close-button`}
                  onPress={onClose}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Picker
                testID={`${testIDPrefix}-picker`}
                selectedValue={value}
                onValueChange={(itemValue: string) => {
                  onValueChange(itemValue);
                }}
                style={styles.picker}
                itemStyle={{ color: theme.text, fontSize: 18 }}
              >
                <Picker.Item
                  label={`Select ${title.replace("Select ", "")}`}
                  value=""
                  color={theme.textTertiary}
                />
                {items.map((item) => (
                  <Picker.Item
                    key={item.code || item.name}
                    label={item.name}
                    value={item.code || item.name}
                    color={theme.text}
                  />
                ))}
              </Picker>
              <Pressable
                testID={`${testIDPrefix}-done-button`}
                style={[styles.doneButton, { backgroundColor: theme.primary }]}
                onPress={onClose}
              >
                <ThemedText style={styles.doneButtonText}>Done</ThemedText>
              </Pressable>
            </BlurView>
          ) : (
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? "#1A1A24" : "#FFFFFF" },
              ]}
            >
              <View style={styles.modalHeader}>
                <ThemedText type="headline" style={styles.modalTitle}>
                  {title}
                </ThemedText>
                <Pressable
                  testID={`${testIDPrefix}-close-button`}
                  onPress={onClose}
                  hitSlop={12}
                >
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>
              <Picker
                testID={`${testIDPrefix}-picker`}
                selectedValue={value}
                onValueChange={(itemValue: string) => {
                  onValueChange(itemValue);
                }}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.primary}
                mode="dropdown"
              >
                <Picker.Item
                  label={`Select ${title.replace("Select ", "")}`}
                  value=""
                  color={theme.textTertiary}
                />
                {items.map((item) => (
                  <Picker.Item
                    key={item.code || item.name}
                    label={item.name}
                    value={item.code || item.name}
                    color={isDark ? "#FFFFFF" : "#1D1D1F"}
                  />
                ))}
              </Picker>
              <Pressable
                testID={`${testIDPrefix}-done-button`}
                style={[styles.doneButton, { backgroundColor: theme.primary }]}
                onPress={onClose}
              >
                <ThemedText style={styles.doneButtonText}>Done</ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.wrapper, containerStyle]} testID="location-picker-loading">
        {label ? (
          <ThemedText style={[styles.label, { color: theme.textSecondary }]} weight="medium">
            {label}
          </ThemedText>
        ) : null}
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? "rgba(26, 26, 36, 0.80)" : "rgba(255, 255, 255, 0.85)" }]}>
          <InlineLoader size={20} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading locations...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.wrapper, containerStyle]} testID="location-picker-error">
        {label ? (
          <ThemedText style={[styles.label, { color: theme.textSecondary }]} weight="medium">
            {label}
          </ThemedText>
        ) : null}
        <View style={[styles.errorContainer, { backgroundColor: theme.errorLight, borderColor: theme.error }]}>
          <Feather name="alert-circle" size={18} color={theme.error} />
          <ThemedText style={[styles.errorText, { color: theme.error }]}>
            Failed to load locations
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, containerStyle]} testID="location-picker-container">
      {label ? (
        <ThemedText style={[styles.label, { color: theme.textSecondary }]} weight="medium">
          {label}
        </ThemedText>
      ) : null}

      <View style={styles.pickersContainer}>
        {renderPickerButton(
          selectedCountry,
          countries,
          "Select Country",
          () => setCountryModalVisible(true),
          false,
          "location-picker-country-button",
          "globe"
        )}

        {renderPickerButton(
          selectedProvince,
          provinces,
          "Select Province",
          () => setProvinceModalVisible(true),
          !selectedCountry,
          "location-picker-province-button",
          "map"
        )}

        {renderPickerButton(
          selectedCity,
          cities.map(c => ({ name: c })),
          "Select City",
          () => setCityModalVisible(true),
          !selectedProvince,
          "location-picker-city-button",
          "map-pin"
        )}
      </View>

      {renderPickerModal(
        countryModalVisible,
        () => setCountryModalVisible(false),
        selectedCountry,
        handleCountryChange,
        countries,
        "Select Country",
        "location-picker-country"
      )}

      {renderPickerModal(
        provinceModalVisible,
        () => setProvinceModalVisible(false),
        selectedProvince,
        handleProvinceChange,
        provinces,
        "Select Province",
        "location-picker-province"
      )}

      {renderPickerModal(
        cityModalVisible,
        () => setCityModalVisible(false),
        selectedCity,
        handleCityChange,
        cities.map(c => ({ name: c })),
        "Select City",
        "location-picker-city"
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  pickersContainer: {
    gap: Spacing.sm,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pickerIcon: {
    marginRight: Spacing.md,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(139, 92, 246, 0.20)",
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  modalTitle: {
    flex: 1,
  },
  picker: {
    width: "100%",
    height: 200,
  },
  doneButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LocationPicker;
