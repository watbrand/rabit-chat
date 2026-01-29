import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as DocumentPicker from "expo-document-picker";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { uploadFileWithProgress } from "@/lib/upload";

type TicketCategory = "ACCOUNT" | "PAYMENT" | "WITHDRAWAL" | "COINS" | "GIFTS" | "MALL" | "TECHNICAL" | "REPORT" | "OTHER";
type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type NewTicketParams = {
  NewTicket: {
    category?: string;
    priority?: string;
  };
};

interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

const CATEGORIES: { value: TicketCategory; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: "ACCOUNT", label: "Account", icon: "user" },
  { value: "PAYMENT", label: "Payment", icon: "credit-card" },
  { value: "WITHDRAWAL", label: "Withdrawal", icon: "arrow-up-right" },
  { value: "COINS", label: "Rabit Coins", icon: "dollar-sign" },
  { value: "GIFTS", label: "Gifts", icon: "gift" },
  { value: "MALL", label: "Luxury Mall", icon: "shopping-bag" },
  { value: "TECHNICAL", label: "Technical", icon: "settings" },
  { value: "REPORT", label: "Report Issue", icon: "flag" },
  { value: "OTHER", label: "Other", icon: "help-circle" },
];

const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "#6B7280" },
  { value: "MEDIUM", label: "Normal", color: "#3B82F6" },
  { value: "HIGH", label: "High", color: "#F59E0B" },
  { value: "URGENT", label: "Urgent", color: "#EF4444" },
];

// Map incoming category params to valid TicketCategory values
const mapCategoryParam = (param?: string): TicketCategory => {
  if (!param) return "OTHER";
  const upper = param.toUpperCase();
  const validCategories: TicketCategory[] = ["ACCOUNT", "PAYMENT", "WITHDRAWAL", "COINS", "GIFTS", "MALL", "TECHNICAL", "REPORT", "OTHER"];
  if (validCategories.includes(upper as TicketCategory)) return upper as TicketCategory;
  // Map legacy values
  if (upper === "SAFETY") return "REPORT";
  return "OTHER";
};

const mapPriorityParam = (param?: string): TicketPriority => {
  if (!param) return "MEDIUM";
  const upper = param.toUpperCase();
  const validPriorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  if (validPriorities.includes(upper as TicketPriority)) return upper as TicketPriority;
  return "MEDIUM";
};

export default function NewTicketScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<NewTicketParams, "NewTicket">>();
  const queryClient = useQueryClient();

  const initialCategory = mapCategoryParam(route.params?.category);
  const initialPriority = mapPriorityParam(route.params?.priority);

  const [category, setCategory] = useState<TicketCategory>(initialCategory);
  const [priority, setPriority] = useState<TicketPriority>(initialPriority);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createTicketMutation = useMutation({
    mutationFn: async (data: { category: TicketCategory; priority: TicketPriority; subject: string; description: string; attachmentUrls?: string[] }) => {
      const res = await apiRequest("POST", "/api/support/tickets", data);
      return res.json();
    },
    onSuccess: (ticket) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/support/inbox"] });
      navigation.replace("TicketChat", { ticketId: ticket.id });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to create ticket. Please try again.");
    },
  });

  const handleSubmit = useCallback(async () => {
    if (!subject.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Missing Subject", "Please enter a subject for your ticket.");
      return;
    }

    if (!description.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Missing Description", "Please describe your issue.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let attachmentUrls: string[] = [];
    if (attachedFiles.length > 0) {
      setIsUploading(true);
      try {
        for (const file of attachedFiles) {
          const result = await uploadFileWithProgress(file.uri, "general", file.mimeType);
          if (result.url) {
            attachmentUrls.push(result.url);
          }
        }
      } catch (error) {
        Alert.alert("Upload Failed", "Could not upload attachments. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createTicketMutation.mutate({
      category,
      priority,
      subject: subject.trim(),
      description: description.trim(),
      attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
    });
  }, [subject, description, category, priority, attachedFiles, createTicketMutation]);

  const handleAttachFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets) return;

      const newFiles: SelectedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        size: asset.size || 0,
        mimeType: asset.mimeType || "application/octet-stream",
      }));

      setAttachedFiles((prev) => [...prev, ...newFiles]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Document picker error:", error);
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCategorySelect = useCallback((value: TicketCategory) => {
    Haptics.selectionAsync();
    setCategory(value);
    setShowCategoryPicker(false);
  }, []);

  const handlePrioritySelect = useCallback((value: TicketPriority) => {
    Haptics.selectionAsync();
    setPriority(value);
  }, []);

  const selectedCategory = CATEGORIES.find((c) => c.value === category);
  const selectedPriority = PRIORITIES.find((p) => p.value === priority);

  const isSubmitting = createTicketMutation.isPending || isUploading;
  const canSubmit = subject.trim().length > 0 && description.trim().length > 0 && !isSubmitting;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
    >
      <Animated.View entering={FadeIn.duration(300)}>
        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Category
          </ThemedText>
          <Pressable
            testID="button-select-category"
            style={[
              styles.picker,
              {
                backgroundColor: theme.glassBackground,
                borderColor: showCategoryPicker ? theme.primary : theme.glassBorder,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCategoryPicker(!showCategoryPicker);
            }}
          >
            <View style={styles.pickerContent}>
              <Feather name={selectedCategory?.icon || "help-circle"} size={18} color={theme.primary} />
              <ThemedText style={styles.pickerText}>
                {selectedCategory?.label || "Select category"}
              </ThemedText>
            </View>
            <Feather
              name={showCategoryPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>

          {showCategoryPicker ? (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={[
                styles.pickerDropdown,
                {
                  backgroundColor: theme.glassBackground,
                  borderColor: theme.glassBorder,
                },
              ]}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  testID={`category-option-${cat.value.toLowerCase()}`}
                  style={[
                    styles.pickerOption,
                    category === cat.value && { backgroundColor: theme.primary + "15" },
                  ]}
                  onPress={() => handleCategorySelect(cat.value)}
                >
                  <Feather
                    name={cat.icon}
                    size={16}
                    color={category === cat.value ? theme.primary : theme.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.pickerOptionText,
                      category === cat.value && { color: theme.primary },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                  {category === cat.value ? (
                    <Feather name="check" size={16} color={theme.primary} />
                  ) : null}
                </Pressable>
              ))}
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Subject <ThemedText style={{ color: theme.error }}>*</ThemedText>
          </ThemedText>
          <TextInput
            testID="input-ticket-subject"
            style={[
              styles.input,
              {
                backgroundColor: theme.glassBackground,
                borderColor: theme.glassBorder,
                color: theme.text,
              },
            ]}
            placeholder="Brief summary of your issue"
            placeholderTextColor={theme.textTertiary}
            value={subject}
            onChangeText={setSubject}
            maxLength={200}
          />
          <ThemedText style={[styles.charCount, { color: theme.textTertiary }]}>
            {subject.length}/200
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Description <ThemedText style={{ color: theme.error }}>*</ThemedText>
          </ThemedText>
          <TextInput
            testID="input-ticket-description"
            style={[
              styles.textArea,
              {
                backgroundColor: theme.glassBackground,
                borderColor: theme.glassBorder,
                color: theme.text,
              },
            ]}
            placeholder="Please describe your issue in detail..."
            placeholderTextColor={theme.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Priority
          </ThemedText>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <Pressable
                key={p.value}
                testID={`priority-${p.value.toLowerCase()}`}
                style={[
                  styles.priorityOption,
                  {
                    backgroundColor: priority === p.value ? p.color + "20" : theme.glassBackground,
                    borderColor: priority === p.value ? p.color : theme.glassBorder,
                  },
                ]}
                onPress={() => handlePrioritySelect(p.value)}
              >
                <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                <ThemedText
                  style={[
                    styles.priorityText,
                    priority === p.value && { color: p.color },
                  ]}
                >
                  {p.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Attachments (Optional)
          </ThemedText>
          <Pressable
            testID="button-attach-files"
            style={[
              styles.attachButton,
              {
                backgroundColor: theme.glassBackground,
                borderColor: theme.glassBorder,
              },
            ]}
            onPress={handleAttachFile}
          >
            <Feather name="paperclip" size={18} color={theme.primary} />
            <ThemedText style={[styles.attachButtonText, { color: theme.primary }]}>
              Attach Files
            </ThemedText>
          </Pressable>

          {attachedFiles.length > 0 ? (
            <View style={styles.attachedFiles}>
              {attachedFiles.map((file, index) => (
                <View
                  key={index}
                  style={[
                    styles.fileItem,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Feather name="file" size={16} color={theme.textSecondary} />
                  <ThemedText style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </ThemedText>
                  <Pressable
                    testID={`remove-file-${index}`}
                    onPress={() => handleRemoveFile(index)}
                  >
                    <Feather name="x" size={18} color={theme.error} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Pressable
          testID="button-submit-ticket"
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? theme.primary : theme.textTertiary,
              opacity: canSubmit ? 1 : 0.6,
            },
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <LoadingIndicator size="small" />
          ) : (
            <>
              <Feather name="send" size={18} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>Submit Ticket</ThemedText>
            </>
          )}
        </Pressable>

        <ThemedText style={[styles.disclaimer, { color: theme.textTertiary }]}>
          Our support team typically responds within 24-48 hours. For urgent issues, please select the appropriate priority level.
        </ThemedText>
      </Animated.View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  pickerText: {
    fontSize: 15,
  },
  pickerDropdown: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pickerOptionText: {
    flex: 1,
    fontSize: 14,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 140,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  priorityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  priorityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  attachedFiles: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});
