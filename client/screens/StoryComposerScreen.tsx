import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  StatusBar,
  Dimensions,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { LoadingIndicator } from "@/components/animations";
import { 
  UniversalStoryEditor,
  TextStoryEditor,
  VoiceStoryRecorder,
} from "@/components/story";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { uploadFileWithDuration } from "@/lib/upload";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type StoryType = "TEXT" | "PHOTO" | "VIDEO" | "VOICE";

// Map frontend font names to database enum values
const mapFontToDbEnum = (font: string | undefined): string | undefined => {
  if (!font) return undefined;
  const fontMap: Record<string, string> = {
    'POPPINS': 'MODERN',
    'PLAYFAIR': 'SERIF', 
    'SPACE_MONO': 'MODERN',
    'DANCING_SCRIPT': 'HANDWRITTEN',
    'BEBAS_NEUE': 'BOLD',
  };
  return fontMap[font] || 'MODERN';
};

interface PickedMedia {
  uri: string;
  type: "image" | "video";
  mimeType?: string;
  duration?: number;
}

interface StoryOption {
  type: StoryType;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  gradient: readonly [string, string];
}

const STORY_OPTIONS: StoryOption[] = [
  { 
    type: "TEXT", 
    icon: "type", 
    title: "Text", 
    subtitle: "Create with words",
    color: Colors.dark.primary,
    gradient: Gradients.primary as readonly [string, string],
  },
  { 
    type: "PHOTO", 
    icon: "image", 
    title: "Photo", 
    subtitle: "From gallery or camera",
    color: Colors.dark.teal,
    gradient: ["#14B8A6", "#0D9488"] as readonly [string, string],
  },
  { 
    type: "VIDEO", 
    icon: "video", 
    title: "Video", 
    subtitle: "Record or upload",
    color: Colors.dark.pink,
    gradient: ["#EC4899", "#DB2777"] as readonly [string, string],
  },
  { 
    type: "VOICE", 
    icon: "mic", 
    title: "Voice", 
    subtitle: "Record audio story",
    color: Colors.dark.warning,
    gradient: ["#F97316", "#EA580C"] as readonly [string, string],
  },
];

export default function StoryComposerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { user } = useAuth();

  const [step, setStep] = useState<"picker" | "text" | "voice" | "editor">("picker");
  const [selectedType, setSelectedType] = useState<StoryType | null>(null);
  const [pickedMedia, setPickedMedia] = useState<PickedMedia | null>(null);
  const [textContent, setTextContent] = useState("");
  const textContentRef = useRef<string>(""); // Ref to immediately capture text content
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    StatusBar.setHidden(true);
    return () => {
      StatusBar.setHidden(false);
    };
  }, []);

  const postStoryMutation = useMutation({
    mutationFn: async (data: { 
      mediaUrl?: string;
      audioUrl?: string;
      type: string; 
      caption?: string; 
      thumbnailUrl?: string; 
      durationMs?: number;
      textContent?: string;
      backgroundColor?: string;
      fontFamily?: string;
      animation?: string;
      stickers?: any[];
      musicUrl?: string;
      musicTitle?: string;
      musicArtist?: string;
      musicStartTime?: number;
      musicDuration?: number;
    }) => {
      const response = await apiRequest("POST", "/api/stories", data);
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = "Failed to create story";
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = JSON.parse(responseText);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/stories`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/feed"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to post story");
    },
  });

  const handleSelectType = async (type: StoryType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedType(type);

    switch (type) {
      case "TEXT":
        setStep("text");
        break;
      case "VOICE":
        setStep("voice");
        break;
      case "PHOTO":
        await pickMedia("image");
        break;
      case "VIDEO":
        await pickMedia("video");
        break;
    }
  };

  const pickMedia = async (mediaType: "image" | "video") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === "image" 
        ? ImagePicker.MediaTypeOptions.Images 
        : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedMedia({
        uri: asset.uri,
        type: asset.type === "video" ? "video" : "image",
        mimeType: asset.mimeType,
        duration: asset.duration ? Math.round(asset.duration * 1000) : undefined,
      });
      setStep("editor");
    }
  };


  const handleEditorSave = async (data: any) => {
    // Validate before uploading
    if (selectedType === "TEXT") {
      const finalText = (textContentRef.current || textContent || data.content || "").trim();
      if (!finalText) {
        Alert.alert("Missing Content", "Please add some text to your story");
        return;
      }
    }
    
    if (selectedType === "PHOTO" || selectedType === "VIDEO") {
      if (!pickedMedia) {
        Alert.alert("Missing Media", "Please select a photo or video for your story");
        return;
      }
    }
    
    if (selectedType === "VOICE") {
      if (!voiceUri) {
        Alert.alert("Missing Audio", "Please record audio for your voice story");
        return;
      }
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      let durationMs: number | undefined;

      if (selectedType === "PHOTO" || selectedType === "VIDEO") {
        if (!pickedMedia) throw new Error("No media selected");
        
        const uploadResult = await uploadFileWithDuration(
          pickedMedia.uri,
          "general",
          pickedMedia.mimeType,
          pickedMedia.duration,
          (progress) => setUploadProgress(Math.min(100, progress))
        );
        
        mediaUrl = uploadResult.url;
        thumbnailUrl = uploadResult.thumbnailUrl;
        durationMs = pickedMedia.duration || uploadResult.durationMs;
      }

      let audioUrl: string | undefined;
      
      if (selectedType === "VOICE" && voiceUri) {
        const uploadResult = await uploadFileWithDuration(
          voiceUri,
          "general",
          "audio/m4a",
          undefined,
          (progress) => setUploadProgress(Math.min(100, progress))
        );
        
        audioUrl = uploadResult.url;
        durationMs = uploadResult.durationMs;
      }

      // Build stickers array only if we have valid stickers
      const mappedStickers = data.stickers && data.stickers.length > 0 
        ? data.stickers.map((s: any) => ({
            type: s.type,
            positionX: s.position?.x ?? s.positionX ?? 0.5,
            positionY: s.position?.y ?? s.positionY ?? 0.5,
            scale: s.scale ?? 1,
            rotation: s.rotation ?? 0,
            data: s.data || {},
          }))
        : undefined;

      // Build flat music fields if we have music data
      // data.music is the MusicTrackData object directly, not nested
      let musicUrl: string | undefined;
      let musicTitle: string | undefined;
      let musicArtist: string | undefined;
      let musicStartTime: number | undefined;
      let musicDuration: number | undefined;
      
      if (data.music && data.music.id) {
        musicUrl = data.music.fullUrl || data.music.previewUrl;
        musicTitle = data.music.title;
        musicArtist = data.music.artist;
        const startTime = data.musicStartTime ?? 0;
        const endTime = data.musicEndTime ?? 15;
        musicStartTime = startTime;
        musicDuration = endTime - startTime;
      }

      // Get text content from ref, state, or editor data
      const finalTextContent = selectedType === "TEXT" 
        ? (textContentRef.current || textContent || data.content || "").trim() 
        : undefined;
      
      const storyData = {
        mediaUrl,
        audioUrl,
        type: selectedType || "TEXT",
        caption: data.content || undefined,
        thumbnailUrl,
        durationMs,
        textContent: finalTextContent,
        backgroundColor: data.colors?.value,
        fontFamily: mapFontToDbEnum(data.font),
        animation: data.animation,
        stickers: mappedStickers,
        musicUrl,
        musicTitle,
        musicArtist,
        musicStartTime,
        musicDuration,
      };
      
      await postStoryMutation.mutateAsync(storyData);
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Could not upload story");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step !== "picker" && (textContent || pickedMedia || voiceUri)) {
      Alert.alert(
        "Discard Story?",
        "You have unsaved changes. Are you sure you want to discard?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("picker");
    setSelectedType(null);
    setPickedMedia(null);
    setTextContent("");
    textContentRef.current = ""; // Also reset ref
    setVoiceUri(null);
  };

  if (step === "text") {
    return (
      <TextStoryEditor
        onSave={(data) => {
          textContentRef.current = data.textContent; // Store immediately in ref
          setTextContent(data.textContent);
          setStep("editor");
        }}
        onCancel={handleBack}
      />
    );
  }

  if (step === "voice") {
    return (
      <VoiceStoryRecorder
        onSave={(uri, duration) => {
          setVoiceUri(uri);
          setStep("editor");
        }}
        onCancel={handleBack}
      />
    );
  }

  if (step === "editor") {
    const editorMediaUri = selectedType === "VOICE" ? voiceUri : pickedMedia?.uri;
    // Use ref for immediate access to text content (avoids async state timing issues)
    const editorInitialContent = textContentRef.current || textContent;
    
    return (
      <View style={styles.container}>
        <UniversalStoryEditor
          initialType={selectedType || "TEXT"}
          initialMediaUri={editorMediaUri || undefined}
          initialContent={editorInitialContent}
          onSave={handleEditorSave}
          onCancel={handleBack}
        />
        
        {isUploading ? (
          <View style={styles.uploadingOverlay}>
            <View style={styles.uploadProgressContent}>
              <LoadingIndicator size="large" />
              <ThemedText style={styles.uploadingText}>
                Uploading... {uploadProgress}%
              </ThemedText>
              <View style={styles.uploadProgressBarContainer}>
                <View style={styles.uploadProgressBarBackground}>
                  <View
                    style={[
                      styles.uploadProgressBarFill,
                      { width: `${uploadProgress}%`, backgroundColor: theme.primary },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <LinearGradient
        colors={["rgba(139, 92, 246, 0.2)", "rgba(0, 0, 0, 0.95)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.iconButton} onPress={handleClose} testID="close-button">
          <Feather name="x" size={28} color="#FFF" />
        </Pressable>
      </View>

      <View style={[styles.pickerContainer, { paddingTop: insets.top + 100 }]}>
        <View style={styles.titleContainer}>
          <Text style={styles.pickerTitle}>Create Story</Text>
          <Text style={styles.pickerSubtitle}>
            Share your moment with the world
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {STORY_OPTIONS.map((option) => (
            <Pressable
              key={option.type}
              style={[styles.optionCard, { backgroundColor: "rgba(255,255,255,0.08)" }]}
              onPress={() => handleSelectType(option.type)}
              testID={`story-option-${option.type.toLowerCase()}`}
            >
              <LinearGradient
                colors={option.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionIconContainer}
              >
                <Feather name={option.icon} size={28} color="#FFF" />
              </LinearGradient>
              <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
              <ThemedText style={styles.optionSubtitle}>{option.subtitle}</ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.featuresRow}>
          <FeatureBadge icon="smile" label="13 Stickers" />
          <FeatureBadge icon="music" label="Music" />
          <FeatureBadge icon="edit-3" label="Drawing" />
          <FeatureBadge icon="sliders" label="Filters" />
        </View>
      </View>
    </View>
  );
}

function FeatureBadge({ icon, label }: { icon: keyof typeof Feather.glyphMap; label: string }) {
  return (
    <View style={styles.featureBadge}>
      <Feather name={icon} size={14} color="rgba(255,255,255,0.7)" />
      <ThemedText style={styles.featureBadgeText}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  pickerTitle: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  pickerSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    textAlign: "center",
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    maxWidth: SCREEN_WIDTH - Spacing.xl * 2,
  },
  optionCard: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  optionTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  optionSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textAlign: "center",
  },
  featuresRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing["3xl"],
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  featureBadgeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadProgressContent: {
    alignItems: "center",
    width: "80%",
  },
  uploadingText: {
    color: "#FFF",
    fontSize: 16,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  uploadProgressBarContainer: {
    width: "100%",
    paddingHorizontal: Spacing.xl,
  },
  uploadProgressBarBackground: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  uploadProgressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
});
