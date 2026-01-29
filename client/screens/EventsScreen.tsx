import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  RefreshControl,
  Modal,
} from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
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

const RSVP_OPTIONS = [
  { status: "GOING", icon: "check-circle", label: "Going", color: "#4caf50" },
  { status: "INTERESTED", icon: "star", label: "Interested", color: "#ff9800" },
  { status: "NOT_GOING", icon: "x-circle", label: "Can't Go", color: "#f44336" },
];

export default function EventsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: events = [], isLoading, refetch } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      return apiRequest("POST", `/api/events/${eventId}/rsvp`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 7);
      return apiRequest("POST", "/api/events", {
        title: newEventTitle,
        description: newEventDescription,
        location: newEventLocation,
        startTime: startTime.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setShowCreateModal(false);
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventLocation("");
    },
  });

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

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}
          showsVerticalScrollIndicator={false}
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

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Create Event
              </Text>
              <Pressable onPress={() => setShowCreateModal(false)}>
                <Feather name="x" size={24} color={theme.textSecondary} />
              </Pressable>
            </View>

            <GlassInput
              placeholder="Event Title"
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              containerStyle={styles.input}
            />

            <GlassInput
              placeholder="Description"
              value={newEventDescription}
              onChangeText={setNewEventDescription}
              multiline
              numberOfLines={3}
              containerStyle={styles.input}
            />

            <GlassInput
              placeholder="Location"
              value={newEventLocation}
              onChangeText={setNewEventLocation}
              containerStyle={styles.input}
            />

            <GlassButton
              title={createEventMutation.isPending ? "Creating..." : "Create Event"}
              onPress={() => createEventMutation.mutate()}
              disabled={!newEventTitle.trim() || createEventMutation.isPending}
              style={styles.createModalButton}
            />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  createModalButton: {
    marginTop: 8,
  },
});
