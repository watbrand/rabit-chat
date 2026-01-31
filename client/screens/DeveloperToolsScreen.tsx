import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Switch,
  Platform,
  RefreshControl,
  Modal,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { LoadingIndicator } from "@/components/animations";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  lastDeliveryAt: string | null;
  failureCount: number;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  responseStatus: number | null;
  responseBody: string | null;
  success: boolean;
  deliveredAt: string;
}

const WEBHOOK_EVENTS = [
  { id: "post.created", label: "New Post Created" },
  { id: "post.liked", label: "Post Liked" },
  { id: "post.commented", label: "Post Commented" },
  { id: "follow.new", label: "New Follower" },
  { id: "message.received", label: "Message Received" },
  { id: "story.created", label: "Story Created" },
];

export function DeveloperToolsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  const { data: webhooks, isLoading: loadingWebhooks } = useQuery<Webhook[]>({
    queryKey: ["/api/webhooks"],
    enabled: !!user,
  });

  const { data: deliveries, isLoading: loadingDeliveries } = useQuery<WebhookDelivery[]>({
    queryKey: ["/api/webhooks", selectedWebhook?.id, "deliveries"],
    enabled: !!selectedWebhook,
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/webhooks", {
        name: webhookName,
        url: webhookUrl,
        events: selectedEvents,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreateModalVisible(false);
      setWebhookName("");
      setWebhookUrl("");
      setSelectedEvents([]);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create webhook");
    },
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PUT", `/api/webhooks/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
    setRefreshing(false);
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId]
    );
  };

  const copySecret = async (secret: string) => {
    await Clipboard.setStringAsync(secret);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Webhook secret copied to clipboard");
  };

  const confirmDelete = (webhook: Webhook) => {
    Alert.alert("Delete Webhook", `Delete "${webhook.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteWebhookMutation.mutate(webhook.id) },
    ]);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        <Animated.View entering={FadeInUp.delay(0)}>
          <Card style={styles.infoCard}>
            <Feather name="code" size={24} color={theme.primary} />
            <View style={styles.infoContent}>
              <ThemedText style={[styles.infoTitle, { color: theme.text }]}>Developer Tools</ThemedText>
              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                Create webhooks to receive real-time updates when events happen on your account
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Pressable
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
          <ThemedText style={styles.createButtonText}>Create Webhook</ThemedText>
        </Pressable>

        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
          Your Webhooks ({webhooks?.length || 0})
        </ThemedText>

        {loadingWebhooks ? (
          <LoadingIndicator size="large" />
        ) : webhooks && webhooks.length > 0 ? (
          webhooks.map((webhook, index) => (
            <Animated.View entering={FadeInUp.delay(50 * index)} key={webhook.id}>
              <Card style={styles.webhookCard}>
                <View style={styles.webhookHeader}>
                  <View style={[styles.webhookIcon, { backgroundColor: theme.primary + "20" }]}>
                    <Feather name="link" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.webhookInfo}>
                    <ThemedText style={[styles.webhookName, { color: theme.text }]}>{webhook.name}</ThemedText>
                    <ThemedText style={[styles.webhookUrl, { color: theme.textSecondary }]} numberOfLines={1}>
                      {webhook.url}
                    </ThemedText>
                  </View>
                  <Switch
                    value={webhook.isActive}
                    onValueChange={(val) => toggleWebhookMutation.mutate({ id: webhook.id, isActive: val })}
                    trackColor={{ false: theme.glassBorder, true: theme.success + "80" }}
                    thumbColor={webhook.isActive ? theme.success : theme.textSecondary}
                  />
                </View>

                <View style={styles.eventsRow}>
                  {webhook.events.map((event) => (
                    <View key={event} style={[styles.eventTag, { backgroundColor: theme.primary + "20" }]}>
                      <ThemedText style={[styles.eventText, { color: theme.primary }]}>{event}</ThemedText>
                    </View>
                  ))}
                </View>

                <View style={styles.webhookFooter}>
                  <Pressable style={styles.footerButton} onPress={() => copySecret(webhook.secret)}>
                    <Feather name="key" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.footerButtonText, { color: theme.textSecondary }]}>Copy Secret</ThemedText>
                  </Pressable>
                  <Pressable style={styles.footerButton} onPress={() => setSelectedWebhook(webhook)}>
                    <Feather name="activity" size={14} color={theme.textSecondary} />
                    <ThemedText style={[styles.footerButtonText, { color: theme.textSecondary }]}>Deliveries</ThemedText>
                  </Pressable>
                  <Pressable style={styles.footerButton} onPress={() => confirmDelete(webhook)}>
                    <Feather name="trash-2" size={14} color={theme.error} />
                    <ThemedText style={[styles.footerButtonText, { color: theme.error }]}>Delete</ThemedText>
                  </Pressable>
                </View>

                {webhook.failureCount > 0 ? (
                  <View style={[styles.warningBanner, { backgroundColor: theme.error + "20" }]}>
                    <Feather name="alert-triangle" size={14} color={theme.error} />
                    <ThemedText style={[styles.warningText, { color: theme.error }]}>
                      {webhook.failureCount} failed deliveries
                    </ThemedText>
                  </View>
                ) : null}
              </Card>
            </Animated.View>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Feather name="link" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Webhooks</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Create webhooks to integrate with external services
            </ThemedText>
          </Card>
        )}
      </KeyboardAwareScrollViewCompat>

      <Modal visible={createModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <Card style={styles.modalContent}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Create Webhook</ThemedText>

            <TextInput
              style={[styles.input, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, color: theme.text }]}
              placeholder="Webhook name"
              placeholderTextColor={theme.textSecondary}
              value={webhookName}
              onChangeText={setWebhookName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, color: theme.text }]}
              placeholder="https://your-server.com/webhook"
              placeholderTextColor={theme.textSecondary}
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <ThemedText style={[styles.label, { color: theme.text }]}>Events to Subscribe</ThemedText>
            {WEBHOOK_EVENTS.map((event) => (
              <Pressable
                key={event.id}
                style={[styles.eventOption, { borderColor: theme.glassBorder }]}
                onPress={() => toggleEvent(event.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: selectedEvents.includes(event.id) ? theme.primary : "transparent",
                      borderColor: selectedEvents.includes(event.id) ? theme.primary : theme.textSecondary,
                    },
                  ]}
                >
                  {selectedEvents.includes(event.id) ? <Feather name="check" size={12} color="#FFFFFF" /> : null}
                </View>
                <ThemedText style={{ color: theme.text }}>{event.label}</ThemedText>
              </Pressable>
            ))}

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.glassBackground }]}
                onPress={() => setCreateModalVisible(false)}
              >
                <ThemedText style={{ color: theme.text }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => createWebhookMutation.mutate()}
                disabled={!webhookName.trim() || !webhookUrl.trim() || selectedEvents.length === 0 || createWebhookMutation.isPending}
              >
                {createWebhookMutation.isPending ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <ThemedText style={{ color: "#FFFFFF" }}>Create</ThemedText>
                )}
              </Pressable>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!selectedWebhook} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Card style={styles.deliveriesModal}>
            <View style={styles.deliveriesHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Deliveries</ThemedText>
              <Pressable onPress={() => setSelectedWebhook(null)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.deliveriesScroll}>
              {loadingDeliveries ? (
                <LoadingIndicator size="large" />
              ) : deliveries && deliveries.length > 0 ? (
                deliveries.map((delivery) => (
                  <View key={delivery.id} style={[styles.deliveryItem, { borderColor: theme.glassBorder }]}>
                    <View style={styles.deliveryHeader}>
                      <Feather
                        name={delivery.success ? "check-circle" : "x-circle"}
                        size={16}
                        color={delivery.success ? theme.success : theme.error}
                      />
                      <ThemedText style={[styles.deliveryEvent, { color: theme.text }]}>{delivery.event}</ThemedText>
                      <ThemedText style={[styles.deliveryTime, { color: theme.textSecondary }]}>
                        {formatTime(delivery.deliveredAt)}
                      </ThemedText>
                    </View>
                    {delivery.responseStatus ? (
                      <ThemedText style={[styles.deliveryStatus, { color: theme.textSecondary }]}>
                        Status: {delivery.responseStatus}
                      </ThemedText>
                    ) : null}
                  </View>
                ))
              ) : (
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary, textAlign: "center" }]}>
                  No deliveries yet
                </ThemedText>
              )}
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
  infoCard: { flexDirection: "row", padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.md, alignItems: "center" },
  infoContent: { flex: 1 },
  infoTitle: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  infoText: { fontSize: 12, marginTop: 2 },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
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
  webhookCard: { padding: Spacing.md, marginBottom: Spacing.md },
  webhookHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  webhookIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  webhookInfo: { flex: 1 },
  webhookName: {
    fontSize: Typography.body.fontSize,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  webhookUrl: { fontSize: 12, marginTop: 2 },
  eventsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginTop: Spacing.md },
  eventTag: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  eventText: { fontSize: 10 },
  webhookFooter: { flexDirection: "row", justifyContent: "space-around", marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.1)" },
  footerButton: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerButtonText: { fontSize: 12 },
  warningBanner: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, padding: Spacing.sm, borderRadius: BorderRadius.sm, marginTop: Spacing.sm },
  warningText: { fontSize: 12 },
  emptyCard: { padding: Spacing.xl, alignItems: "center" },
  emptyTitle: {
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.md,
    ...Platform.select({
      ios: { fontFamily: Fonts?.semiBold || "System" },
      android: { fontFamily: Fonts?.semiBold, fontWeight: "600" as const },
      default: { fontWeight: "600" as const },
    }),
  },
  emptyText: { fontSize: 13, marginTop: Spacing.xs, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: Spacing.lg },
  modalContent: { padding: Spacing.lg, maxHeight: "80%" },
  modalTitle: {
    fontSize: Typography.h3.fontSize,
    marginBottom: Spacing.lg,
    textAlign: "center",
    ...Platform.select({
      ios: { fontFamily: Fonts?.bold || "System" },
      android: { fontFamily: Fonts?.bold, fontWeight: "700" as const },
      default: { fontWeight: "700" as const },
    }),
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: { fontFamily: Fonts?.medium || "System" },
      android: { fontFamily: Fonts?.medium, fontWeight: "500" as const },
      default: { fontWeight: "500" as const },
    }),
  },
  eventOption: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  modalButtons: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
  modalButton: { flex: 1, alignItems: "center", paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  deliveriesModal: { padding: Spacing.lg, maxHeight: "70%" },
  deliveriesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  deliveriesScroll: { maxHeight: 400 },
  deliveryItem: { paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  deliveryHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  deliveryEvent: { flex: 1, fontSize: 13 },
  deliveryTime: { fontSize: 11 },
  deliveryStatus: { fontSize: 11, marginTop: 2, marginLeft: 24 },
});
