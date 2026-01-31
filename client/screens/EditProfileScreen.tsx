import React, { useState, useLayoutEffect, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  Pressable,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, EventArg } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { Image } from "expo-image";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Avatar } from "@/components/Avatar";
import { LoadingIndicator } from "@/components/animations";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { validateUrl } from "@/lib/validation";
import { pickImage, uploadFile } from "@/lib/upload";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || "");
  const [linkUrl, setLinkUrl] = useState(user?.linkUrl || "");
  const [linkUrlError, setLinkUrlError] = useState<string | null>(null);
  const [location, setLocation] = useState(user?.location || "");
  const [pronouns, setPronouns] = useState(user?.pronouns || "");
  const [category, setCategory] = useState<"PERSONAL" | "CREATOR" | "BUSINESS">(user?.category || "PERSONAL");
  const [isUploading, setIsUploading] = useState(false);
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  const hasUnsavedChanges = useCallback(() => {
    if (!user) return false;
    return (
      displayName !== (user.displayName || "") ||
      username !== (user.username || "") ||
      bio !== (user.bio || "") ||
      avatarUrl !== (user.avatarUrl || "") ||
      coverUrl !== (user.coverUrl || "") ||
      linkUrl !== (user.linkUrl || "") ||
      location !== (user.location || "") ||
      pronouns !== (user.pronouns || "") ||
      category !== (user.category || "PERSONAL")
    );
  }, [user, displayName, username, bio, avatarUrl, coverUrl, linkUrl, location, pronouns, category]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: EventArg<'beforeRemove', true, { action: any }>) => {
      if (!hasUnsavedChanges()) return;

      e.preventDefault();

      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Save before leaving?',
        [
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: () => {
              updateMutation.mutate(undefined, {
                onSuccess: () => {
                  navigation.dispatch(e.data.action);
                },
              });
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 30) return "Username must be 30 characters or less";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Only letters, numbers, and underscores allowed";
    return null;
  };

  useEffect(() => {
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    if (username === user?.username) {
      setUsernameAvailable(null);
      setUsernameError(null);
      setUsernameChecking(false);
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    setUsernameError(null);
    setUsernameChecking(true);
    
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const url = new URL(`/api/auth/check-username?username=${encodeURIComponent(username)}`, getApiUrl());
        const response = await fetch(url.toString(), { credentials: "include" });
        const data = await response.json();
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError("Username is already taken");
        }
      } catch (error) {
        setUsernameError("Could not check username");
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username, user?.username]);

  const handleAvatarUpload = async () => {
    try {
      setIsUploading(true);
      const asset = await pickImage();
      if (!asset) {
        setIsUploading(false);
        return;
      }
      
      const result = await uploadFile(asset.uri, "avatars", asset.mimeType);
      setAvatarUrl(result.url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Upload Failed", error.message || "Could not upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async () => {
    try {
      setIsCoverUploading(true);
      const asset = await pickImage();
      if (!asset) {
        setIsCoverUploading(false);
        return;
      }
      
      const result = await uploadFile(asset.uri, "covers", asset.mimeType);
      setCoverUrl(result.url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Upload Failed", error.message || "Could not upload cover photo");
    } finally {
      setIsCoverUploading(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        displayName,
        bio,
        avatarUrl: avatarUrl || null,
        coverUrl: coverUrl || null,
        linkUrl: linkUrl || null,
        location: location || null,
        pronouns: pronouns || null,
        category,
      };
      if (username !== user?.username) {
        payload.username = username;
      }
      await apiRequest("PUT", "/api/users/me", payload);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshUser();
      navigation.goBack();
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update profile");
    },
  });

  const usernameValid = username === user?.username || (usernameAvailable === true && !usernameError);
  const urlValid = !linkUrlError;
  const canSave = displayName.trim().length > 0 && username.length >= 3 && usernameValid && !usernameChecking && urlValid;
  const isSaving = updateMutation.isPending;

  useLayoutEffect(() => {
    navigation.setOptions({
      // Only show Save button in header on iOS/Web - Android gets it below the content
      headerRight: Platform.OS === "android" ? undefined : () => (
        <TouchableOpacity
          onPress={canSave && !isSaving ? () => updateMutation.mutate() : undefined}
          disabled={!canSave || isSaving}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
          style={{ padding: 8, marginRight: 8 }}
        >
          {isSaving ? (
            <LoadingIndicator size="small" />
          ) : (
            <ThemedText
              style={{
                color: canSave ? theme.primary : theme.textSecondary,
                fontWeight: "600",
                opacity: canSave ? 1 : 0.6,
              }}
            >
              Save
            </ThemedText>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, canSave, isSaving, theme]);

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl + 80,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <View style={styles.avatarSection}>
        <TouchableOpacity 
          onPress={handleAvatarUpload} 
          disabled={isUploading} 
          activeOpacity={0.7}
          testID="button-upload-avatar"
        >
          <View style={styles.avatarWrapper}>
            <Avatar uri={avatarUrl} size={100} />
            <View style={[styles.avatarOverlay, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
              {isUploading ? (
                <LoadingIndicator size="small" />
              ) : (
                <Feather name="camera" size={24} color="#fff" />
              )}
            </View>
          </View>
        </TouchableOpacity>
        <ThemedText style={[styles.uploadHint, { color: theme.textSecondary }]}>
          Tap to upload a photo
        </ThemedText>
        <View style={styles.avatarUrlContainer}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Or enter URL directly
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.glassBackground,
                borderColor: theme.glassBorder,
                color: theme.text,
              },
            ]}
            placeholder="https://example.com/avatar.jpg"
            placeholderTextColor={theme.textSecondary}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            autoCapitalize="none"
            keyboardType="url"
            testID="input-avatar-url"
          />
        </View>
      </View>

      <View style={styles.coverSection}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Cover Photo
        </ThemedText>
        <TouchableOpacity 
          onPress={handleCoverUpload} 
          disabled={isCoverUploading} 
          activeOpacity={0.7}
          testID="button-upload-cover"
        >
          <View style={[styles.coverWrapper, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
            {coverUrl ? (
              <Image
                source={{ uri: coverUrl }}
                style={styles.coverImage}
                contentFit="cover"
              />
            ) : null}
            <View style={[styles.coverOverlay, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
              {isCoverUploading ? (
                <LoadingIndicator size="small" />
              ) : (
                <View style={styles.coverUploadContent}>
                  <Feather name="camera" size={24} color="#fff" />
                  <ThemedText style={styles.coverUploadText}>
                    {coverUrl ? "Change Cover" : "Add Cover Photo"}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Display Name
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.glassBackground,
              borderColor: theme.glassBorder,
              color: theme.text,
            },
          ]}
          placeholder="Your display name"
          placeholderTextColor={theme.textSecondary}
          value={displayName}
          onChangeText={setDisplayName}
          testID="input-display-name"
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Username
        </ThemedText>
        <View style={styles.usernameInputWrapper}>
          <TextInput
            style={[
              styles.input,
              styles.usernameInput,
              {
                backgroundColor: theme.glassBackground,
                borderColor: usernameError
                  ? "#EF4444"
                  : usernameAvailable === true
                  ? "#10B981"
                  : theme.glassBorder,
                color: theme.text,
              },
            ]}
            placeholder="your_username"
            placeholderTextColor={theme.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            testID="input-username"
          />
          <View style={styles.usernameStatusIcon}>
            {usernameChecking ? (
              <LoadingIndicator size="small" />
            ) : usernameAvailable === true && !usernameError ? (
              <Feather name="check-circle" size={20} color="#10B981" />
            ) : usernameError ? (
              <Feather name="x-circle" size={20} color="#EF4444" />
            ) : null}
          </View>
        </View>
        {usernameError ? (
          <ThemedText style={styles.usernameErrorText}>{usernameError}</ThemedText>
        ) : usernameAvailable === true ? (
          <ThemedText style={styles.usernameSuccessText}>Username is available</ThemedText>
        ) : (
          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
            3-30 characters, letters, numbers, and underscores only
          </ThemedText>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Bio
        </ThemedText>
        <TextInput
          style={[
            styles.bioInput,
            {
              backgroundColor: theme.glassBackground,
              borderColor: theme.glassBorder,
              color: theme.text,
            },
          ]}
          placeholder="Tell us about yourself..."
          placeholderTextColor={theme.textSecondary}
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={160}
          testID="input-bio"
        />
        <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
          {bio.length}/160
        </ThemedText>
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Website
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.glassBackground,
              borderColor: linkUrlError ? "#EF4444" : theme.glassBorder,
              color: theme.text,
            },
          ]}
          placeholder="https://your-website.com"
          placeholderTextColor={theme.textSecondary}
          value={linkUrl}
          onChangeText={(text) => {
            setLinkUrl(text);
            if (text && !validateUrl(text)) {
              setLinkUrlError("URL must start with http:// or https://");
            } else {
              setLinkUrlError(null);
            }
          }}
          autoCapitalize="none"
          keyboardType="url"
          testID="input-link-url"
        />
        {linkUrlError ? (
          <ThemedText style={styles.urlErrorText}>{linkUrlError}</ThemedText>
        ) : null}
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Location
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.glassBackground,
              borderColor: theme.glassBorder,
              color: theme.text,
            },
          ]}
          placeholder="City, Country"
          placeholderTextColor={theme.textSecondary}
          value={location}
          onChangeText={setLocation}
          testID="input-location"
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Pronouns
        </ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.glassBackground,
              borderColor: theme.glassBorder,
              color: theme.text,
            },
          ]}
          placeholder="e.g., she/her, he/him, they/them"
          placeholderTextColor={theme.textSecondary}
          value={pronouns}
          onChangeText={setPronouns}
          testID="input-pronouns"
        />
      </View>

      <View style={styles.field}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Account Type
        </ThemedText>
        <View style={styles.categoryRow}>
          {(["PERSONAL", "CREATOR", "BUSINESS"] as const).map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.categoryOption,
                {
                  backgroundColor: category === cat ? theme.primary : theme.glassBackground,
                  borderColor: category === cat ? theme.primary : theme.glassBorder,
                },
              ]}
              onPress={() => setCategory(cat)}
              testID={`category-${cat.toLowerCase()}`}
            >
              <Feather
                name={cat === "PERSONAL" ? "user" : cat === "CREATOR" ? "star" : "briefcase"}
                size={16}
                color={category === cat ? "#FFF" : theme.textSecondary}
              />
              <ThemedText
                style={{
                  color: category === cat ? "#FFF" : theme.text,
                  fontSize: 14,
                  fontWeight: "500",
                  marginLeft: Spacing.xs,
                }}
              >
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Android-only Save button below content */}
      {Platform.OS === "android" ? (
        <View style={styles.androidSaveContainer}>
          <TouchableOpacity
            onPress={canSave && !isSaving ? () => updateMutation.mutate() : undefined}
            disabled={!canSave || isSaving}
            activeOpacity={0.7}
            style={[
              styles.androidSaveButton,
              {
                backgroundColor: canSave ? theme.primary : theme.glassBackground,
                opacity: !canSave || isSaving ? 0.6 : 1,
              },
            ]}
            testID="button-save-profile"
          >
            {isSaving ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="check" size={18} color={canSave ? "#FFF" : theme.textSecondary} />
                <ThemedText
                  style={[
                    styles.androidSaveButtonText,
                    { color: canSave ? "#FFF" : theme.textSecondary },
                  ]}
                >
                  Save Changes
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    zIndex: 1,
  },
  coverSection: {
    marginBottom: Spacing.xl,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  coverWrapper: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  coverUploadContent: {
    alignItems: "center",
  },
  coverUploadText: {
    color: "#fff",
    marginTop: Spacing.sm,
    fontSize: 14,
    fontWeight: "500",
  },
  avatarWrapper: {
    position: "relative",
    borderRadius: 50,
    overflow: "hidden",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
    zIndex: 2,
  },
  uploadHint: {
    marginTop: Spacing.sm,
    fontSize: 12,
  },
  avatarUrlContainer: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.small.fontSize,
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
  },
  bioInput: {
    minHeight: 100,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
    borderWidth: 1,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  hint: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  usernameInputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  usernameInput: {
    flex: 1,
    paddingRight: 44,
  },
  usernameStatusIcon: {
    position: "absolute",
    right: Spacing.md,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  usernameErrorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  usernameSuccessText: {
    color: "#10B981",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  urlErrorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  androidSaveContainer: {
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  androidSaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    minHeight: 56,
  },
  androidSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  categoryOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
});
