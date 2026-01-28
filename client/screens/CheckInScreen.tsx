import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Platform,
  Linking,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";

interface Venue {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  checkInCount: number;
  isVerified: boolean;
}

interface CheckIn {
  id: string;
  userId: string;
  venueId: string | null;
  postId: string | null;
  customLocationName: string | null;
  latitude: number | null;
  longitude: number | null;
  caption: string | null;
  createdAt: string;
  venue?: Venue;
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface NearbyUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  distance: number;
  locationName?: string;
}

export function CheckInScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"checkin" | "nearby" | "history">("checkin");
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [caption, setCaption] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status);
  };

  const requestLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const [reverseGeocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode) {
          const parts = [reverseGeocode.name, reverseGeocode.city, reverseGeocode.country].filter(Boolean);
          setLocationName(parts.join(", "));
        }
      }
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Could not get your location. Please try again.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const { data: myCheckIns, isLoading: loadingCheckIns } = useQuery<CheckIn[]>({
    queryKey: ["/api/check-ins/my"],
    enabled: !!user,
  });

  const { data: nearbyUsers, isLoading: loadingNearby } = useQuery<NearbyUser[]>({
    queryKey: ["/api/location/nearby", currentLocation?.latitude, currentLocation?.longitude],
    enabled: !!user && !!currentLocation,
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) throw new Error("No location");
      return apiRequest("PUT", "/api/location", {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        locationName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location/nearby"] });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!currentLocation) throw new Error("No location");
      return apiRequest("POST", "/api/check-ins", {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        customLocationName: locationName,
        caption,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/check-ins/my"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Checked In!", `You checked in at ${locationName}`);
      setCaption("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to check in");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/check-ins/my"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/location/nearby"] });
    setRefreshing(false);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  const renderLocationRequest = () => (
    <View style={styles.permissionContainer}>
      <View style={[styles.permissionIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name="map-pin" size={48} color={theme.primary} />
      </View>
      <ThemedText style={[styles.permissionTitle, { color: theme.text }]}>
        Enable Location
      </ThemedText>
      <ThemedText style={[styles.permissionText, { color: theme.textSecondary }]}>
        Allow RabitChat to access your location to check in at venues and find nearby friends
      </ThemedText>
      
      {locationPermission === "denied" ? (
        <Pressable
          style={[styles.enableButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            if (Platform.OS !== "web") {
              try {
                Linking.openSettings();
              } catch (error) {
                Alert.alert("Error", "Could not open settings");
              }
            }
          }}
        >
          <ThemedText style={styles.enableButtonText}>Open Settings</ThemedText>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.enableButton, { backgroundColor: theme.primary }]}
          onPress={requestLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.enableButtonText}>Enable Location</ThemedText>
          )}
        </Pressable>
      )}
    </View>
  );

  const renderCheckInForm = () => (
    <Animated.View entering={FadeInUp.delay(100)}>
      <Card style={styles.checkInCard}>
        <View style={styles.locationHeader}>
          <View style={[styles.locationIcon, { backgroundColor: theme.success + "20" }]}>
            <Feather name="map-pin" size={20} color={theme.success} />
          </View>
          <View style={styles.locationInfo}>
            <ThemedText style={[styles.locationLabel, { color: theme.textSecondary }]}>
              Your Location
            </ThemedText>
            <ThemedText style={[styles.locationName, { color: theme.text }]}>
              {locationName || "Getting location..."}
            </ThemedText>
          </View>
          <Pressable onPress={requestLocation} style={styles.refreshButton}>
            <Feather
              name="refresh-cw"
              size={20}
              color={theme.primary}
              style={isGettingLocation ? { opacity: 0.5 } : undefined}
            />
          </Pressable>
        </View>

        <TextInput
          style={[
            styles.captionInput,
            {
              backgroundColor: theme.glassBackground,
              borderColor: theme.glassBorder,
              color: theme.text,
            },
          ]}
          placeholder="What are you up to?"
          placeholderTextColor={theme.textSecondary}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />

        <Pressable
          style={[
            styles.checkInButton,
            { backgroundColor: theme.primary },
            (!currentLocation || checkInMutation.isPending) && styles.buttonDisabled,
          ]}
          onPress={() => checkInMutation.mutate()}
          disabled={!currentLocation || checkInMutation.isPending}
        >
          {checkInMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={20} color="#FFFFFF" />
              <ThemedText style={styles.checkInButtonText}>Check In</ThemedText>
            </>
          )}
        </Pressable>
      </Card>
    </Animated.View>
  );

  const renderNearbyUsers = () => {
    if (!currentLocation) {
      return renderLocationRequest();
    }

    if (loadingNearby) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (!nearbyUsers?.length) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="users" size={48} color={theme.primary} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            No Nearby Friends
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            No one is sharing their location nearby right now
          </ThemedText>
        </View>
      );
    }

    return nearbyUsers.map((nearbyUser, index) => (
      <Animated.View entering={FadeInUp.delay(100 * index)} key={nearbyUser.id}>
        <Card style={styles.nearbyCard}>
          <Avatar uri={nearbyUser.avatarUrl} size={48} />
          <View style={styles.nearbyInfo}>
            <ThemedText style={[styles.nearbyName, { color: theme.text }]}>
              {nearbyUser.displayName}
            </ThemedText>
            <ThemedText style={[styles.nearbyDistance, { color: theme.textSecondary }]}>
              {formatDistance(nearbyUser.distance)}
            </ThemedText>
            {nearbyUser.locationName ? (
              <ThemedText style={[styles.nearbyLocation, { color: theme.primary }]}>
                {nearbyUser.locationName}
              </ThemedText>
            ) : null}
          </View>
          <Pressable style={[styles.waveButton, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="send" size={20} color={theme.primary} />
          </Pressable>
        </Card>
      </Animated.View>
    ));
  };

  const renderHistory = () => {
    if (loadingCheckIns) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (!myCheckIns?.length) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.pink + "20" }]}>
            <Feather name="map-pin" size={48} color={theme.pink} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            No Check-Ins Yet
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Start checking in to save your favorite places
          </ThemedText>
        </View>
      );
    }

    return myCheckIns.map((checkIn, index) => (
      <Animated.View entering={FadeInUp.delay(50 * index)} key={checkIn.id}>
        <Card style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={[styles.historyIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="map-pin" size={16} color={theme.primary} />
            </View>
            <View style={styles.historyInfo}>
              <ThemedText style={[styles.historyLocation, { color: theme.text }]}>
                {checkIn.venue?.name || checkIn.customLocationName || "Unknown Location"}
              </ThemedText>
              <ThemedText style={[styles.historyTime, { color: theme.textSecondary }]}>
                {formatTime(checkIn.createdAt)}
              </ThemedText>
            </View>
          </View>
          {checkIn.caption ? (
            <ThemedText style={[styles.historyCaption, { color: theme.text }]}>
              {checkIn.caption}
            </ThemedText>
          ) : null}
        </Card>
      </Animated.View>
    ));
  };

  const renderContent = () => {
    if (activeTab === "checkin") {
      if (locationPermission !== "granted") {
        return renderLocationRequest();
      }
      return renderCheckInForm();
    }

    if (activeTab === "nearby") {
      return renderNearbyUsers();
    }

    return renderHistory();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.tabsContainer}>
          <Pressable
            style={[
              styles.tab,
              activeTab === "checkin" && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab("checkin")}
          >
            <Feather
              name="map-pin"
              size={16}
              color={activeTab === "checkin" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "checkin" ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              Check In
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === "nearby" && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab("nearby")}
          >
            <Feather
              name="users"
              size={16}
              color={activeTab === "nearby" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "nearby" ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              Nearby
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.tab,
              activeTab === "history" && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveTab("history")}
          >
            <Feather
              name="clock"
              size={16}
              color={activeTab === "history" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "history" ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              History
            </ThemedText>
          </Pressable>
        </View>

        {renderContent()}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabText: {
    fontSize: 12,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  permissionContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    fontSize: Typography.h2.fontSize,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  permissionText: {
    fontSize: Typography.body.fontSize,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  enableButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 180,
    alignItems: "center",
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  checkInCard: {
    padding: Spacing.lg,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
  },
  locationName: {
    fontSize: Typography.body.fontSize,
    marginTop: 2,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  refreshButton: {
    padding: Spacing.sm,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: Spacing.md,
  },
  checkInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkInButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.h2.fontSize,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    textAlign: "center",
    lineHeight: 22,
  },
  nearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  nearbyDistance: {
    fontSize: 12,
    marginTop: 2,
  },
  nearbyLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  waveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  historyCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: {
    flex: 1,
  },
  historyLocation: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  historyTime: {
    fontSize: 12,
    marginTop: 2,
  },
  historyCaption: {
    fontSize: 13,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});
