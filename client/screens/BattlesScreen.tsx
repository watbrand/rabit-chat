import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { GlassButton } from "@/components/GlassButton";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Gradients } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { LoadingIndicator } from "@/components/animations";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Battle {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "ended";
  participantCount: number;
  maxParticipants: number;
  isJoined: boolean;
  creatorId: string;
  creatorName: string;
}

interface BattleParticipant {
  id: string;
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  giftsReceived: number;
}

type TabType = "active" | "upcoming" | "ended";

const TABS: { id: TabType; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "upcoming", label: "Upcoming" },
  { id: "ended", label: "Ended" },
];

function formatCountdown(endDate: string): string {
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function BattleCard({
  battle,
  onJoin,
  onView,
  index,
}: {
  battle: Battle;
  onJoin: (id: string) => void;
  onView: (battle: Battle) => void;
  index: number;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getStatusColor = () => {
    switch (battle.status) {
      case "active":
        return theme.success;
      case "upcoming":
        return theme.gold;
      case "ended":
        return theme.textTertiary;
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={() => onView(battle)}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.battleCard,
          {
            backgroundColor: isDark ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.9)",
            borderColor: battle.status === "active" ? theme.primary + "60" : theme.border,
          },
        ]}
      >
        <View style={styles.battleHeader}>
          <View style={styles.battleTitleRow}>
            <ThemedText style={[styles.battleName, { color: theme.text }]}>
              {battle.name}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + "20" }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
                {battle.status.charAt(0).toUpperCase() + battle.status.slice(1)}
              </ThemedText>
            </View>
          </View>
          <ThemedText
            style={[styles.battleDescription, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {battle.description}
          </ThemedText>
        </View>

        <View style={styles.battleStats}>
          <View style={styles.battleStat}>
            <Feather name="users" size={16} color={theme.primary} />
            <ThemedText style={[styles.statValue, { color: theme.text }]}>
              {battle.participantCount}/{battle.maxParticipants}
            </ThemedText>
          </View>
          <View style={styles.battleStat}>
            <Feather name="award" size={16} color={theme.gold} />
            <ThemedText style={[styles.statValue, { color: theme.gold }]}>
              {battle.prizePool.toLocaleString()}
            </ThemedText>
          </View>
          <View style={styles.battleStat}>
            <Feather name="clock" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.statValue, { color: theme.textSecondary }]}>
              {formatCountdown(battle.endDate)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.battleFooter}>
          <View style={styles.entryFee}>
            <ThemedText style={[styles.entryFeeLabel, { color: theme.textSecondary }]}>
              Entry Fee:
            </ThemedText>
            <ThemedText style={[styles.entryFeeValue, { color: theme.text }]}>
              {battle.entryFee > 0 ? `${battle.entryFee} coins` : "Free"}
            </ThemedText>
          </View>

          {battle.status !== "ended" && !battle.isJoined ? (
            <Pressable
              onPress={() => onJoin(battle.id)}
              style={styles.joinButton}
            >
              <LinearGradient
                colors={Gradients.primary}
                style={styles.joinGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ThemedText style={styles.joinText}>Join</ThemedText>
              </LinearGradient>
            </Pressable>
          ) : battle.isJoined ? (
            <View style={[styles.joinedBadge, { backgroundColor: theme.successLight }]}>
              <Feather name="check" size={14} color={theme.success} />
              <ThemedText style={[styles.joinedText, { color: theme.success }]}>
                Joined
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function LeaderboardEntry({
  participant,
  onGift,
}: {
  participant: BattleParticipant;
  onGift: (userId: string) => void;
}) {
  const { theme, isDark } = useTheme();

  const getRankColor = () => {
    switch (participant.rank) {
      case 1:
        return "#FFD700";
      case 2:
        return "#C0C0C0";
      case 3:
        return "#CD7F32";
      default:
        return theme.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.leaderboardEntry,
        {
          backgroundColor: isDark ? "rgba(26, 26, 36, 0.6)" : "rgba(255, 255, 255, 0.8)",
        },
      ]}
    >
      <View style={[styles.rankBadge, { backgroundColor: getRankColor() + "20" }]}>
        <ThemedText style={[styles.rankText, { color: getRankColor() }]}>
          #{participant.rank}
        </ThemedText>
      </View>

      <Avatar
        url={participant.avatarUrl}
        size={40}
        username={participant.username}
      />

      <View style={styles.participantInfo}>
        <ThemedText style={[styles.participantName, { color: theme.text }]}>
          {participant.displayName || participant.username}
        </ThemedText>
        <ThemedText style={[styles.participantScore, { color: theme.textSecondary }]}>
          {participant.score.toLocaleString()} points
        </ThemedText>
      </View>

      <Pressable
        onPress={() => onGift(participant.userId)}
        style={[styles.giftButton, { backgroundColor: theme.primaryLight + "20" }]}
      >
        <Feather name="gift" size={16} color={theme.primary} />
      </Pressable>
    </View>
  );
}

export default function BattlesScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBattle, setSelectedBattle] = useState<Battle | null>(null);

  const [newBattle, setNewBattle] = useState({
    name: "",
    description: "",
    entryFee: "",
    maxParticipants: "",
    durationDays: "7",
  });

  const { data: battles = [], isLoading, refetch, isRefetching } = useQuery<Battle[]>({
    queryKey: ["/api/battles"],
  });

  const { data: leaderboard = [] } = useQuery<BattleParticipant[]>({
    queryKey: ["/api/battles", selectedBattle?.id, "leaderboard"],
    enabled: !!selectedBattle,
  });

  const joinMutation = useMutation({
    mutationFn: async (battleId: string) => {
      return apiRequest("POST", `/api/battles/${battleId}/join`);
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
    },
    onError: (error: any) => {
      Alert.alert("Join Failed", error.message || "Failed to join battle");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/battles", data);
    },
    onSuccess: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/battles"] });
      setCreateModalVisible(false);
      setNewBattle({
        name: "",
        description: "",
        entryFee: "",
        maxParticipants: "",
        durationDays: "7",
      });
    },
    onError: (error: any) => {
      Alert.alert("Create Failed", error.message || "Failed to create battle");
    },
  });

  const handleJoinBattle = (battleId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    joinMutation.mutate(battleId);
  };

  const handleViewBattle = (battle: Battle) => {
    setSelectedBattle(battle);
    setDetailModalVisible(true);
  };

  const handleCreateBattle = () => {
    if (!newBattle.name.trim()) {
      Alert.alert("Missing Name", "Please enter a battle name");
      return;
    }
    createMutation.mutate({
      name: newBattle.name,
      description: newBattle.description,
      entryFee: parseInt(newBattle.entryFee, 10) || 0,
      maxParticipants: parseInt(newBattle.maxParticipants, 10) || 50,
      durationDays: parseInt(newBattle.durationDays, 10) || 7,
    });
  };

  const handleGiftParticipant = (userId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert("Gift", "Gift sending coming soon!");
  };

  const filteredBattles = battles.filter((b) => b.status === activeTab);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={isDark ? ["#1a1a2e", "#16213e", "#0f0f1a"] : ["#F8F5FF", "#EEE8FF", "#E8E0FF"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.springify()}>
          <Pressable
            onPress={() => setCreateModalVisible(true)}
            style={styles.createButton}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.createGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.createText}>Create Battle</ThemedText>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveTab(tab.id);
              }}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    activeTab === tab.id
                      ? theme.primary
                      : "transparent",
                  borderColor: activeTab === tab.id ? theme.primary : theme.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab.id ? "#FFFFFF" : theme.text },
                ]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.battlesList}>
          {filteredBattles.map((battle, index) => (
            <BattleCard
              key={battle.id}
              battle={battle}
              onJoin={handleJoinBattle}
              onView={handleViewBattle}
              index={index}
            />
          ))}
        </View>

        {filteredBattles.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="flag" size={48} color={theme.textTertiary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No {activeTab} battles
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1A1A24" : "#FFFFFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                Create Battle
              </ThemedText>
              <Pressable onPress={() => setCreateModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Battle Name"
                placeholderTextColor={theme.textTertiary}
                value={newBattle.name}
                onChangeText={(text) => setNewBattle({ ...newBattle, name: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Description"
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
                value={newBattle.description}
                onChangeText={(text) => setNewBattle({ ...newBattle, description: text })}
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Entry Fee (0 for free)"
                placeholderTextColor={theme.textTertiary}
                keyboardType="number-pad"
                value={newBattle.entryFee}
                onChangeText={(text) => setNewBattle({ ...newBattle, entryFee: text })}
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Max Participants (default 50)"
                placeholderTextColor={theme.textTertiary}
                keyboardType="number-pad"
                value={newBattle.maxParticipants}
                onChangeText={(text) => setNewBattle({ ...newBattle, maxParticipants: text })}
              />

              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
                placeholder="Duration (days, default 7)"
                placeholderTextColor={theme.textTertiary}
                keyboardType="number-pad"
                value={newBattle.durationDays}
                onChangeText={(text) => setNewBattle({ ...newBattle, durationDays: text })}
              />
            </ScrollView>

            <Pressable
              onPress={handleCreateBattle}
              disabled={createMutation.isPending}
              style={[styles.confirmButton, { opacity: createMutation.isPending ? 0.6 : 1 }]}
            >
              <LinearGradient
                colors={Gradients.primary}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {createMutation.isPending ? (
                  <LoadingIndicator size="small" />
                ) : (
                  <ThemedText style={styles.confirmText}>Create Battle</ThemedText>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              styles.detailModal,
              { backgroundColor: isDark ? "#1A1A24" : "#FFFFFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                {selectedBattle?.name}
              </ThemedText>
              <Pressable onPress={() => setDetailModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedBattle ? (
              <ScrollView style={styles.detailScroll}>
                <ThemedText style={[styles.detailDescription, { color: theme.textSecondary }]}>
                  {selectedBattle.description}
                </ThemedText>

                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <ThemedText style={[styles.detailStatLabel, { color: theme.textSecondary }]}>
                      Prize Pool
                    </ThemedText>
                    <ThemedText style={[styles.detailStatValue, { color: theme.gold }]}>
                      {selectedBattle.prizePool.toLocaleString()} coins
                    </ThemedText>
                  </View>
                  <View style={styles.detailStat}>
                    <ThemedText style={[styles.detailStatLabel, { color: theme.textSecondary }]}>
                      Participants
                    </ThemedText>
                    <ThemedText style={[styles.detailStatValue, { color: theme.text }]}>
                      {selectedBattle.participantCount}/{selectedBattle.maxParticipants}
                    </ThemedText>
                  </View>
                  <View style={styles.detailStat}>
                    <ThemedText style={[styles.detailStatLabel, { color: theme.textSecondary }]}>
                      Time Left
                    </ThemedText>
                    <ThemedText style={[styles.detailStatValue, { color: theme.primary }]}>
                      {formatCountdown(selectedBattle.endDate)}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={[styles.leaderboardTitle, { color: theme.text }]}>
                  Leaderboard
                </ThemedText>

                {leaderboard.map((participant) => (
                  <LeaderboardEntry
                    key={participant.id}
                    participant={participant}
                    onGift={handleGiftParticipant}
                  />
                ))}

                {leaderboard.length === 0 ? (
                  <ThemedText style={[styles.noParticipants, { color: theme.textSecondary }]}>
                    No participants yet
                  </ThemedText>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  createButton: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  createGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  createText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  battlesList: {
    gap: Spacing.md,
  },
  battleCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  battleHeader: {
    marginBottom: Spacing.md,
  },
  battleTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  battleName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  battleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  battleStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  battleStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  battleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryFee: {},
  entryFeeLabel: {
    fontSize: 12,
  },
  entryFeeValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  joinButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  joinGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  joinText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  joinedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  joinedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: "80%",
  },
  detailModal: {
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  modalScroll: {
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  confirmButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  confirmGradient: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  detailScroll: {
    flex: 1,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  detailStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  detailStat: {
    alignItems: "center",
  },
  detailStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  leaderboardEntry: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "700",
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  participantName: {
    fontSize: 14,
    fontWeight: "600",
  },
  participantScore: {
    fontSize: 12,
  },
  giftButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  noParticipants: {
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
});
