import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface AIAvatar {
  id: string;
  userId: string;
  name: string;
  style: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface AITranslation {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
}

const AVATAR_STYLES = [
  { id: "realistic", name: "Realistic", icon: "user" },
  { id: "anime", name: "Anime", icon: "star" },
  { id: "cartoon", name: "Cartoon", icon: "smile" },
  { id: "artistic", name: "Artistic", icon: "feather" },
  { id: "3d", name: "3D Render", icon: "box" },
  { id: "pixel", name: "Pixel Art", icon: "grid" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "pt", name: "Portuguese" },
  { code: "zu", name: "Zulu" },
  { code: "af", name: "Afrikaans" },
];

export function AIFeaturesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"avatars" | "translate">("avatars");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [avatarName, setAvatarName] = useState("");
  const [textToTranslate, setTextToTranslate] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [translatedText, setTranslatedText] = useState("");

  const { data: avatars, isLoading: loadingAvatars } = useQuery<AIAvatar[]>({
    queryKey: ["/api/ai/avatars"],
    enabled: !!user,
  });

  const { data: translations, isLoading: loadingTranslations } = useQuery<AITranslation[]>({
    queryKey: ["/api/ai/translations"],
    enabled: !!user,
  });

  const generateAvatarMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai/avatars", {
        name: avatarName || "My Avatar",
        style: selectedStyle,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/avatars"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your AI avatar is being generated!");
      setAvatarName("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to generate avatar");
    },
  });

  const translateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ai/translate", {
        text: textToTranslate,
        targetLanguage,
      });
    },
    onSuccess: (data: any) => {
      setTranslatedText(data.translatedText || data.translation || "Translation completed");
      queryClient.invalidateQueries({ queryKey: ["/api/ai/translations"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to translate");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/ai/avatars"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/ai/translations"] });
    setRefreshing(false);
  };

  const renderAvatarsTab = () => (
    <View>
      <Animated.View entering={FadeInUp.delay(100)}>
        <Card style={styles.card}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
            Generate AI Avatar
          </ThemedText>
          <ThemedText style={[styles.cardDesc, { color: theme.textSecondary }]}>
            Create a unique AI-generated avatar in your preferred style
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
            placeholder="Avatar name (optional)"
            placeholderTextColor={theme.textSecondary}
            value={avatarName}
            onChangeText={setAvatarName}
          />

          <ThemedText style={[styles.label, { color: theme.text }]}>Select Style</ThemedText>
          <View style={styles.stylesGrid}>
            {AVATAR_STYLES.map((style) => (
              <Pressable
                key={style.id}
                style={[
                  styles.styleOption,
                  {
                    backgroundColor:
                      selectedStyle === style.id ? theme.primary + "20" : theme.glassBackground,
                    borderColor: selectedStyle === style.id ? theme.primary : theme.glassBorder,
                  },
                ]}
                onPress={() => setSelectedStyle(style.id)}
              >
                <Feather
                  name={style.icon as any}
                  size={24}
                  color={selectedStyle === style.id ? theme.primary : theme.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.styleName,
                    { color: selectedStyle === style.id ? theme.primary : theme.text },
                  ]}
                >
                  {style.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[
              styles.generateButton,
              { backgroundColor: theme.primary },
              generateAvatarMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={() => generateAvatarMutation.mutate()}
            disabled={generateAvatarMutation.isPending}
          >
            {generateAvatarMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="cpu" size={18} color="#FFFFFF" />
                <ThemedText style={styles.generateButtonText}>Generate Avatar</ThemedText>
              </>
            )}
          </Pressable>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200)}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Your Avatars ({avatars?.length || 0})
        </ThemedText>

        {loadingAvatars ? (
          <LoadingIndicator size="large" />
        ) : avatars && avatars.length > 0 ? (
          <View style={styles.avatarsGrid}>
            {avatars.map((avatar) => (
              <Card key={avatar.id} style={styles.avatarCard}>
                <Image
                  source={{ uri: avatar.imageUrl }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
                <ThemedText style={[styles.avatarName, { color: theme.text }]}>
                  {avatar.name}
                </ThemedText>
                <ThemedText style={[styles.avatarStyle, { color: theme.textSecondary }]}>
                  {avatar.style}
                </ThemedText>
              </Card>
            ))}
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="image" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No avatars yet. Generate your first one!
            </ThemedText>
          </Card>
        )}
      </Animated.View>
    </View>
  );

  const renderTranslateTab = () => (
    <View>
      <Animated.View entering={FadeInUp.delay(100)}>
        <Card style={styles.card}>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
            AI Translation
          </ThemedText>
          <ThemedText style={[styles.cardDesc, { color: theme.textSecondary }]}>
            Translate text to any language using AI
          </ThemedText>

          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.glassBackground,
                borderColor: theme.glassBorder,
                color: theme.text,
              },
            ]}
            placeholder="Enter text to translate..."
            placeholderTextColor={theme.textSecondary}
            value={textToTranslate}
            onChangeText={setTextToTranslate}
            multiline
            numberOfLines={4}
          />

          <ThemedText style={[styles.label, { color: theme.text }]}>Translate to</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.languagesRow}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageChip,
                  {
                    backgroundColor:
                      targetLanguage === lang.code ? theme.primary : theme.glassBackground,
                    borderColor: targetLanguage === lang.code ? theme.primary : theme.glassBorder,
                  },
                ]}
                onPress={() => setTargetLanguage(lang.code)}
              >
                <ThemedText
                  style={[
                    styles.languageText,
                    { color: targetLanguage === lang.code ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {lang.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[
              styles.generateButton,
              { backgroundColor: theme.primary },
              (translateMutation.isPending || !textToTranslate.trim()) && styles.buttonDisabled,
            ]}
            onPress={() => translateMutation.mutate()}
            disabled={translateMutation.isPending || !textToTranslate.trim()}
          >
            {translateMutation.isPending ? (
              <LoadingIndicator size="small" />
            ) : (
              <>
                <Feather name="globe" size={18} color="#FFFFFF" />
                <ThemedText style={styles.generateButtonText}>Translate</ThemedText>
              </>
            )}
          </Pressable>

          {translatedText ? (
            <View style={[styles.resultBox, { backgroundColor: theme.success + "20" }]}>
              <ThemedText style={[styles.resultLabel, { color: theme.success }]}>
                Translation:
              </ThemedText>
              <ThemedText style={[styles.resultText, { color: theme.text }]}>
                {translatedText}
              </ThemedText>
            </View>
          ) : null}
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200)}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Recent Translations
        </ThemedText>

        {loadingTranslations ? (
          <LoadingIndicator size="large" />
        ) : translations && translations.length > 0 ? (
          translations.slice(0, 5).map((t) => (
            <Card key={t.id} style={styles.translationCard}>
              <ThemedText style={[styles.originalText, { color: theme.textSecondary }]}>
                {t.originalText}
              </ThemedText>
              <Feather name="arrow-down" size={16} color={theme.primary} style={styles.arrowIcon} />
              <ThemedText style={[styles.translatedCardText, { color: theme.text }]}>
                {t.translatedText}
              </ThemedText>
              <ThemedText style={[styles.langBadge, { color: theme.primary }]}>
                {t.sourceLanguage} → {t.targetLanguage}
              </ThemedText>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="globe" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No translations yet
            </ThemedText>
          </Card>
        )}
      </Animated.View>
    </View>
  );

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "avatars" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("avatars")}
          >
            <Feather
              name="user"
              size={16}
              color={activeTab === "avatars" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "avatars" ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              AI Avatars
            </ThemedText>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "translate" && { backgroundColor: theme.primary }]}
            onPress={() => setActiveTab("translate")}
          >
            <Feather
              name="globe"
              size={16}
              color={activeTab === "translate" ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "translate" ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              Translate
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "avatars" ? renderAvatarsTab() : renderTranslateTab()}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  tabsContainer: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.lg },
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
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  card: { padding: Spacing.lg, marginBottom: Spacing.lg },
  cardTitle: {
    fontSize: Typography.h3.fontSize,
    marginBottom: Spacing.xs,
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  cardDesc: { fontSize: 13, marginBottom: Spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.md,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  label: {
    fontSize: 13,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  stylesGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  styleOption: {
    width: "31%",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  styleName: { fontSize: 11, marginTop: Spacing.xs },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  buttonDisabled: { opacity: 0.6 },
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  loader: { paddingVertical: Spacing.xl },
  avatarsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  avatarCard: { width: "48%", padding: Spacing.sm, alignItems: "center" },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.sm },
  avatarName: { fontSize: 13, textAlign: "center" },
  avatarStyle: { fontSize: 11, textAlign: "center" },
  emptyCard: { padding: Spacing.xl, alignItems: "center" },
  emptyText: { fontSize: 13, marginTop: Spacing.md, textAlign: "center" },
  languagesRow: { marginBottom: Spacing.lg },
  languageChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  languageText: { fontSize: 13 },
  resultBox: { padding: Spacing.md, borderRadius: BorderRadius.md, marginTop: Spacing.md },
  resultLabel: { fontSize: 12, marginBottom: Spacing.xs },
  resultText: { fontSize: Typography.body.fontSize, lineHeight: 22 },
  translationCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  originalText: { fontSize: 13 },
  arrowIcon: { marginVertical: Spacing.xs },
  translatedCardText: { fontSize: Typography.body.fontSize },
  langBadge: { fontSize: 11, marginTop: Spacing.xs },
});
