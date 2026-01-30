import React, { useState } from "react";
import { View, Pressable, StyleSheet, Modal, FlatList, TextInput } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { type Country, type ZaLocation, getCountryFlag } from "./AnonGossipTypes";
import { LoadingIndicator } from "@/components/animations";
import { getApiUrl } from "@/lib/query-client";

interface LocationSelectorProps {
  selectedCountry: string | null;
  selectedLocation: ZaLocation | null;
  onSelect: (country: string | null, location: ZaLocation | null, displayText: string) => void;
}

interface Province {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
}

interface Hood {
  id: string;
  name: string;
  slug: string;
}

export function LocationSelector({ selectedCountry, selectedLocation, onSelect }: LocationSelectorProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<"country" | "province" | "city" | "kasi">("country");
  const [selectedProvince, setSelectedProvince] = useState<{ name: string; slug: string } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{ name: string; slug: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const countries: Country[] = [{ id: "za", code: "ZA", name: "South Africa", isSouthAfrica: true, isActive: true, sortOrder: 0 }];

  const { data: provincesData, isLoading: loadingProvinces } = useQuery<{ provinces: Province[] }>({
    queryKey: ["/api/gossip/v2/locations/provinces"],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/locations/provinces`);
      if (!response.ok) return { provinces: [] };
      return response.json();
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: citiesData, isLoading: loadingCities } = useQuery<{ cities: City[] }>({
    queryKey: ["/api/gossip/v2/locations/provinces", selectedProvince?.slug, "cities"],
    queryFn: async () => {
      if (!selectedProvince?.slug) return { cities: [] };
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/locations/provinces/${selectedProvince.slug}/cities`);
      if (!response.ok) return { cities: [] };
      return response.json();
    },
    enabled: !!selectedProvince?.slug && step === "city",
    staleTime: 1000 * 60 * 30,
  });

  const { data: hoodsData, isLoading: loadingHoods } = useQuery<{ hoods: Hood[] }>({
    queryKey: ["/api/gossip/v2/locations/provinces", selectedProvince?.slug, "cities", selectedCity?.slug, "hoods"],
    queryFn: async () => {
      if (!selectedProvince?.slug || !selectedCity?.slug) return { hoods: [] };
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/locations/provinces/${selectedProvince.slug}/cities/${selectedCity.slug}/hoods`);
      if (!response.ok) return { hoods: [] };
      return response.json();
    },
    enabled: !!selectedProvince?.slug && !!selectedCity?.slug && step === "kasi",
    staleTime: 1000 * 60 * 30,
  });

  const getDisplayText = () => {
    if (selectedLocation) {
      const parts = [selectedLocation.province];
      if (selectedLocation.city) parts.push(selectedLocation.city);
      if (selectedLocation.kasi) parts.push(selectedLocation.kasi);
      return parts.join(" > ");
    }
    if (selectedCountry) {
      const country = countries.find(c => c.code === selectedCountry);
      return country ? `${getCountryFlag(country.code)} ${country.name}` : selectedCountry;
    }
    return "Select Location";
  };

  const handleCountrySelect = (code: string) => {
    if (code === "ZA") {
      setStep("province");
    } else {
      const country = countries.find(c => c.code === code);
      onSelect(code, null, country ? `${getCountryFlag(country.code)} ${country.name}` : code);
      setShowModal(false);
      resetSelection();
    }
  };

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince({ name: province.name, slug: province.slug });
    setStep("city");
  };

  const handleCitySelect = (city: City) => {
    setSelectedCity({ name: city.name, slug: city.slug });
    setStep("kasi");
  };

  const handleKasiSelect = (hood: Hood) => {
    const location: ZaLocation = {
      id: hood.id,
      province: selectedProvince!.name,
      city: selectedCity!.name,
      kasi: hood.name,
      level: 3,
      population: null,
      isActive: true,
    };
    const displayText = `${selectedProvince!.name} > ${selectedCity!.name} > ${hood.name}`;
    onSelect("ZA", location, displayText);
    setShowModal(false);
    resetSelection();
  };

  const resetSelection = () => {
    setStep("country");
    setSelectedProvince(null);
    setSelectedCity(null);
    setSearchQuery("");
  };

  const handleBack = () => {
    if (step === "kasi") {
      setSelectedCity(null);
      setStep("city");
    } else if (step === "city") {
      setSelectedProvince(null);
      setStep("province");
    } else if (step === "province") {
      setStep("country");
    }
  };

  const provinces = provincesData?.provinces || [];
  const cities = citiesData?.cities || [];
  const hoods = hoodsData?.hoods || [];

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = (step === "province" && loadingProvinces) || 
                    (step === "city" && loadingCities) || 
                    (step === "kasi" && loadingHoods);

  return (
    <>
      <Pressable
        style={[styles.selector, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
        onPress={() => setShowModal(true)}
      >
        <Feather name="map-pin" size={16} color={theme.primary} />
        <ThemedText style={[styles.selectorText, { color: selectedCountry ? theme.text : theme.textSecondary }]} numberOfLines={1}>
          {getDisplayText()}
        </ThemedText>
        <Feather name="chevron-down" size={16} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => { setShowModal(false); resetSelection(); }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
          <View style={styles.modalOverlay}>
            <Pressable style={styles.modalDismiss} onPress={() => { setShowModal(false); resetSelection(); }} />
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot, paddingBottom: Math.max(insets.bottom, 24) + 40 }]}>
              <View style={styles.modalHeader}>
              {step !== "country" ? (
                <Pressable onPress={handleBack} style={styles.backButton}>
                  <Feather name="arrow-left" size={20} color={theme.text} />
                </Pressable>
              ) : null}
              <ThemedText type="headline" style={styles.modalTitle}>
                {step === "country" ? "Select Country" : step === "province" ? "Select Province" : step === "city" ? "Select City" : "Select Kasi/Township"}
              </ThemedText>
              <Pressable onPress={() => { setShowModal(false); resetSelection(); }}>
                <Feather name="x" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            {step === "country" ? (
              <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="search" size={16} color={theme.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search countries..."
                  placeholderTextColor={theme.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            ) : null}

            {isLoading ? (
              <LoadingIndicator size="large" style={styles.loader} />
            ) : null}

            {step === "country" ? (
              <FlatList
                data={filteredCountries}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.listItem, { borderBottomColor: theme.glassBorder }]}
                    onPress={() => handleCountrySelect(item.code)}
                  >
                    <ThemedText style={styles.flagEmoji}>{getCountryFlag(item.code)}</ThemedText>
                    <View style={styles.itemContent}>
                      <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                      {item.isSouthAfrica ? (
                        <ThemedText style={[styles.itemMeta, { color: theme.primary }]}>Province/City/Kasi selection</ThemedText>
                      ) : (
                        <ThemedText style={[styles.itemMeta, { color: theme.textTertiary }]}>Southern Africa</ThemedText>
                      )}
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.textTertiary} />
                  </Pressable>
                )}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No countries found</ThemedText>}
              />
            ) : step === "province" && !isLoading ? (
              <FlatList
                data={provinces}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.listItem, { borderBottomColor: theme.glassBorder }]}
                    onPress={() => handleProvinceSelect(item)}
                  >
                    <ThemedText style={styles.flagEmoji}>{item.emoji || "🗺️"}</ThemedText>
                    <ThemedText style={[styles.itemName, { flex: 1 }]}>{item.name}</ThemedText>
                    <Feather name="chevron-right" size={18} color={theme.textTertiary} />
                  </Pressable>
                )}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No provinces available</ThemedText>}
              />
            ) : step === "city" && !isLoading ? (
              <FlatList
                data={cities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.listItem, { borderBottomColor: theme.glassBorder }]}
                    onPress={() => handleCitySelect(item)}
                  >
                    <Feather name="home" size={18} color={theme.primary} />
                    <ThemedText style={[styles.itemName, { flex: 1 }]}>{item.name}</ThemedText>
                    <Feather name="chevron-right" size={18} color={theme.textTertiary} />
                  </Pressable>
                )}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No cities in {selectedProvince?.name}</ThemedText>}
              />
            ) : step === "kasi" && !isLoading ? (
              <FlatList
                data={hoods}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.listItem, { borderBottomColor: theme.glassBorder }]}
                    onPress={() => handleKasiSelect(item)}
                  >
                    <Feather name="map-pin" size={18} color={theme.primary} />
                    <ThemedText style={[styles.itemName, { flex: 1 }]}>{item.name}</ThemedText>
                    <Feather name="check" size={18} color={theme.primary} />
                  </Pressable>
                )}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No kasis in {selectedCity?.name}</ThemedText>}
              />
            ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    maxHeight: "80%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: 4,
    marginRight: Spacing.sm,
  },
  modalTitle: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  flagEmoji: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
  },
  itemMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    padding: Spacing.xl,
    opacity: 0.6,
  },
});
