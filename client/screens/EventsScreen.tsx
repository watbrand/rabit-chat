import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { LoadingIndicator, EmptyState } from "@/components/animations";
import { ThemedView } from "@/components/ThemedView";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { Feather } from "@expo/vector-icons";
import { GlassButton } from "@/components/GlassButton";
import { GlassInput } from "@/components/GlassInput";

interface Event {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  status: "UPCOMING" | "LIVE" | "ENDED" | "CANCELLED";
  rsvpCount: number;
  host?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  userRsvp?: {
    status: "GOING" | "INTERESTED" | "NOT_GOING";
  };
}

interface ValidationErrors {
  title?: string;
  description?: string;
  startTime?: string;
}

const RSVP_OPTIONS = [
  { status: "GOING", icon: "check-circle", label: "Going", color: "#4caf50" },
  { status: "INTERESTED", icon: "star", label: "Interested", color: "#ff9800" },
  { status: "NOT_GOING", icon: "x-circle", label: "Can't Go", color: "#f44336" },
];

const MIN_TITLE_LENGTH = 3;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;

export default function EventsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const { data: events = [], isLoading, isError, error, refetch } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const validateEventData = useCallback((title: string, description: string): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    if (title.trim().length < MIN_TITLE_LENGTH) {
      errors.title = `Title must be at least ${MIN_TITLE_LENGTH} characters`;
    } else if (title.trim().length > MAX_TITLE_LENGTH) {
      errors.title = `Title must be less than ${MAX_TITLE_LENGTH} characters`;
    }
    
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`;
    }
    
    return errors;
  }, []);

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      return apiRequest("POST", `/api/events/${eventId}/rsvp`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      Alert.alert("RSVP Failed", error.message || "Failed to update RSVP. Please try again.");
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 7);
      return apiRequest("POST", "/api/events", {
        title: newEventTitle.trim(),
        description: newEventDescription.trim(),
        location: newEventLocation.trim(),
        startTime: startTime.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setShowCreateModal(false);
      resetCreateForm();
    },
    onError: (error: Error) => {
      Alert.alert("Create Failed", error.message || "Failed to create event. Please try again.");
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: Partial<Event> }) => {
      return apiRequest("PATCH", `/api/events/${eventId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setShowEditModal(false);
      setEditingEvent(null);
      resetCreateForm();
    },
    onError: (error: Error) => {
      Alert.alert("Update Failed", error.message || "Failed to update event. Please try again.");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: Error) => {
      Alert.alert("Delete Failed", error.message || "Failed to delete event. Please try again.");
    },
  });

  const resetCreateForm = () => {
    setNewEventTitle("");
    setNewEventDescription("");
    setNewEventLocation("");
    setValidationErrors({});
  };

  const handleCreateEvent = () => {
    const errors = validateEventData(newEventTitle, newEventDescription);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      createEventMutation.mutate();
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventDescription(event.description || "");
    setNewEventLocation(event.location || "");
    setValidationErrors({});
    setShowEditModal(true);
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;
    
    const errors = validateEventData(newEventTitle, newEventDescription);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      updateEventMutation.mutate({
        eventId: editingEvent.id,
        data: {
          title: newEventTitle.trim(),
          description: newEventDescription.trim(),
          location: newEventLocation.trim(),
        },
      });
    }
  };

  const handleDeleteEvent = (event: Event) => {
    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteEventMutation.mutate(event.id),
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <Pressable
      style={[styles.eventCard, { backgroundColor: theme.backgroundSecondary }]}
      onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
      onLongPress={() => handleEditEvent(item)}
    >
      {item.coverImageUrl ? (
        <Image source={{ uri: item.coverImageUrl }} style={styles.eventCover} />
      ) : (
        <View style={[styles.eventCoverPlaceholder, { backgroundColor: theme.primary + "30" }]}>
          <Feather name="calendar" size={32} color={theme.primary} />
        </View>
      )}
      
      <View style={styles.dateOverlay}>
        <Text style={styles.dateMonth}>
          {new Date(item.startTime).toLocaleDateString("en-US", { month: "short" })}
        </Text>
        <Text style={styles.dateDay}>
          {new Date(item.startTime).getDate()}
        </Text>
      </View>

      <View style={styles.eventActionsOverlay}>
        <Pressable
          style={[styles.eventActionButton, { backgroundColor: theme.primary }]}
          onPress={() => handleEditEvent(item)}
          hitSlop={8}
        >
          <Feather name="edit-2" size={14} color="#fff" />
        </Pressable>
        <Pressable
          style={[styles.eventActionButton, { backgroundColor: "#EF4444" }]}
          onPress={() => handleDeleteEvent(item)}
          hitSlop={8}
        >
          <Feather name="trash-2" size={14} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.eventInfo}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: item.status === "LIVE" ? "#4caf50" : theme.primary }]} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {item.status}
          </Text>
        </View>

        <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={styles.eventMeta}>
          <Feather name="clock" size={14} color={theme.textSecondary} />
          <Text style={[styles.eventMetaText, { color: theme.textSecondary }]}>
            {formatDate(item.startTime)}
          </Text>
        </View>

        {item.location ? (
          <View style={styles.eventMeta}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <Text style={[styles.eventMetaText, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        ) : null}

        <View style={styles.eventFooter}>
          <View style={styles.rsvpInfo}>
            <Feather name="users" size={14} color={theme.textSecondary} />
            <Text style={[styles.rsvpCount, { color: theme.textSecondary }]}>
              {item.rsvpCount} attending
            </Text>
          </View>

          <View style={styles.rsvpButtons}>
            {RSVP_OPTIONS.map((option) => (
              <Pressable
                key={option.status}
                style={[
                  styles.rsvpButton,
                  { borderColor: option.color },
                  item.userRsvp?.status === option.status && { backgroundColor: option.color },
                ]}
                onPress={() => rsvpMutation.mutate({ eventId: item.id, status: option.status })}
                disabled={rsvpMutation.isPending}
              >
                <Feather
                  name={option.icon as any}
                  size={16}
                  color={item.userRsvp?.status === option.status ? "#fff" : option.color}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Pressable>
  );

  const renderEventModal = (isEdit: boolean) => {
    const isVisible = isEdit ? showEditModal : showCreateModal;
    const title = isEdit ? "Edit Event" : "Create Event";
    const buttonTitle = isEdit
      ? updateEventMutation.isPending ? "Saving..." : "Save Changes"
      : createEventMutation.isPending ? "Creating..." : "Create Event";
    const isPending = isEdit ? updateEventMutation.isPending : createEventMutation.isPending;
    const handleSubmit = isEdit ? handleUpdateEvent : handleCreateEvent;
    const handleClose = () => {
      if (isEdit) {
        setShowEditModal(false);
        setEditingEvent(null);
      } else {
        setShowCreateModal(false);
      }
      resetCreateForm();
    };

    return (
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {title}
                </Text>
                <Pressable onPress={handleClose}>
                  <Feather name="x" size={24} color={theme.textSecondary} />
                </Pressable>
              </View>

              <GlassInput
                placeholder="Event Title (3-100 characters)"
                value={newEventTitle}
                onChangeText={(text) => {
                  setNewEventTitle(text);
                  if (validationErrors.title) {
                    setValidationErrors(prev => ({ ...prev, title: undefined }));
                  }
                }}
                containerStyle={styles.input}
                maxLength={MAX_TITLE_LENGTH}
              />
              {validationErrors.title ? (
                <Text style={styles.errorText}>{validationErrors.title}</Text>
              ) : null}

              <GlassInput
                placeholder="Description (optional, max 1000 characters)"
                value={newEventDescription}
                onChangeText={(text) => {
                  setNewEventDescription(text);
                  if (validationErrors.description) {
                    setValidationErrors(prev => ({ ...prev, description: undefined }));
                  }
                }}
                multiline
                numberOfLines={3}
                containerStyle={styles.input}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              {validationErrors.description ? (
                <Text style={styles.errorText}>{validationErrors.description}</Text>
              ) : null}
              <Text style={[styles.charCount, { color: theme.textSecondary }]}>
                {newEventDescription.length}/{MAX_DESCRIPTION_LENGTH}
              </Text>

              <GlassInput
                placeholder="Location (optional)"
                value={newEventLocation}
                onChangeText={setNewEventLocation}
                containerStyle={styles.input}
              />

              <GlassButton
                title={buttonTitle}
                onPress={handleSubmit}
                disabled={newEventTitle.trim().length < MIN_TITLE_LENGTH || isPending}
                style={styles.createModalButton}
              />

              {isEdit ? (
                <Pressable
                  style={styles.deleteButtonContainer}
                  onPress={() => {
                    if (editingEvent) {
                      handleClose();
                      setTimeout(() => handleDeleteEvent(editingEvent), 300);
                    }
                  }}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete Event</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  if (isError) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.header, { paddingTop: Platform.OS === "android" ? Spacing.md : headerHeight + Spacing.sm }]}>
          <Text style={[styles.title, { color: theme.text }]}>Events</Text>
          <Pressable
            style={[styles.createButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.errorContainer}>
          <EmptyState
            icon="alert-circle"
            title="Something went wrong"
            message={(error as Error)?.message || "Failed to load events. Please try again."}
            actionLabel="Try Again"
            onAction={refetch}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === "android" ? Spacing.md : headerHeight + Spacing.sm }]}>
        <Text style={[styles.title, { color: theme.text }]}>Events</Text>
        <Pressable
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No events yet. Create one!
              </Text>
            </View>
          }
        />
      )}

      {renderEventModal(false)}
      {renderEventModal(true)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  list: {
    padding: 16,
    gap: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  eventCover: {
    width: "100%",
    height: 140,
  },
  eventCoverPlaceholder: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  dateOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    minWidth: 48,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "600",
    color: "#e53935",
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  eventActionsOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  eventActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: {
    padding: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 14,
    flex: 1,
  },
  eventFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  rsvpInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rsvpCount: {
    fontSize: 14,
  },
  rsvpButtons: {
    flexDirection: "row",
    gap: 8,
  },
  rsvpButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  createModalButton: {
    marginTop: 8,
  },
  deleteButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 8,
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
});
