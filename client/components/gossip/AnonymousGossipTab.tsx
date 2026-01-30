import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "../ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { EmptyState, LoadingIndicator } from "@/components/animations";
import { GossipCard } from "./GossipCard";
import { GossipComposeModal } from "./GossipComposeModal";
import { GossipRepliesModal } from "./GossipRepliesModal";
import { LocationSelector } from "./LocationSelector";
import { type AnonGossipPost, type ReactionType, type ZaLocation } from "./AnonGossipTypes";
import { useGossipShare } from "@/hooks/useGossipShare";

type FeedTab = "community" | "trending";

const DEVICE_ID_KEY = "@gossip_device_id";

async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate UUID format (36 chars) to meet backend's min 32 char requirement
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export function AnonymousGossipTab() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const { sharePost } = useGossipShare();
  
  const [activeTab, setActiveTab] = useState<FeedTab>("community");
  const [selectedCountry, setSelectedCountry] = useState<string | null>("ZA");
  const [selectedLocation, setSelectedLocation] = useState<ZaLocation | null>(null);
  const [locationDisplayText, setLocationDisplayText] = useState("South Africa");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AnonGossipPost | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showDMModal, setShowDMModal] = useState(false);
  const [dmPostId, setDmPostId] = useState<string | null>(null);
  const [dmMessage, setDmMessage] = useState("");

  React.useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId);
  }, []);

  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["/api/gossip/v2/posts", selectedLocation?.id, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLocation?.id) {
        params.set("locationId", selectedLocation.id);
      }
      if (activeTab === "trending") {
        params.set("tab", "trending");
      }
      params.set("limit", "30");
      
      const response = await fetch(
        `${getApiUrl()}/api/gossip/v2/posts?${params.toString()}`,
        { headers: deviceId ? { "x-device-id": deviceId } : {} }
      );
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
    enabled: !!deviceId,
    staleTime: 30000,
  });

  const { data: myReactionsData } = useQuery({
    queryKey: ["/api/gossip/v2/my-reactions", deviceId],
    queryFn: async () => {
      if (!deviceId) return { reactions: [] };
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/my-reactions`, {
        headers: { "x-device-id": deviceId },
      });
      if (!response.ok) return { reactions: [] };
      return response.json();
    },
    enabled: !!deviceId,
    staleTime: 60000,
  });

  const reactMutation = useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: ReactionType }) => {
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/posts/${postId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId || "",
        },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error("Failed to react");
      return response.json();
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ["/api/gossip/v2/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gossip/v2/my-reactions"] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/posts/${postId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId || "",
        },
        body: JSON.stringify({ reason: "inappropriate" }),
      });
      if (!response.ok) throw new Error("Failed to report");
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleReact = useCallback((postId: string, type: ReactionType) => {
    reactMutation.mutate({ postId, type });
  }, [reactMutation]);

  const handleReply = useCallback((postId: string) => {
    const post = posts.find((p: AnonGossipPost) => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setShowRepliesModal(true);
    }
  }, [postsData]);

  const handleReport = useCallback((postId: string) => {
    reportMutation.mutate(postId);
  }, [reportMutation]);

  const startDMMutation = useMutation({
    mutationFn: async ({ postId, message }: { postId: string; message: string }) => {
      if (!deviceId) throw new Error("No device ID");
      const response = await fetch(`${getApiUrl()}/api/gossip/v2/dm/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": deviceId,
        },
        body: JSON.stringify({ postId, message }),
      });
      if (!response.ok) throw new Error("Failed to start DM");
      return response.json();
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("GossipDMChat", {
        conversationId: data.conversation.id,
        theirAlias: data.conversation.posterAlias,
      });
    },
    onError: () => {
      Alert.alert("Error", "Could not start anonymous DM. Try again.");
    },
  });

  const handleDM = useCallback((postId: string) => {
    setDmPostId(postId);
    setDmMessage("");
    setShowDMModal(true);
  }, []);

  const handleSendDM = useCallback(() => {
    if (dmPostId && dmMessage.trim()) {
      startDMMutation.mutate({ postId: dmPostId, message: dmMessage.trim() });
      setShowDMModal(false);
      setDmPostId(null);
      setDmMessage("");
    }
  }, [dmPostId, dmMessage, startDMMutation]);

  const handleShare = useCallback((postId: string) => {
    const post = postsData?.posts.find((p: AnonGossipPost) => p.id === postId);
    if (post) {
      sharePost({
        id: post.id,
        content: post.content,
        locationDisplay: post.locationDisplay || locationDisplayText,
        teaMeter: post.teaMeter,
        alias: post.alias,
        aliasEmoji: post.aliasEmoji,
        reactions: {
          fire: post.fireCount,
          mindblown: post.mindblownCount,
          laugh: post.laughCount,
          skull: post.skullCount,
          eyes: post.eyesCount,
        },
        replyCount: post.replyCount,
        createdAt: post.createdAt,
      });
    }
  }, [postsData?.posts, sharePost, locationDisplayText]);

  const handleLocationSelect = useCallback((country: string | null, location: ZaLocation | null, displayText: string) => {
    setSelectedCountry(country);
    setSelectedLocation(location);
    setLocationDisplayText(displayText);
  }, []);

  const getMyReactions = useCallback((postId: string): string[] => {
    if (!myReactionsData?.reactions) return [];
    return myReactionsData.reactions
      .filter((r: any) => r.postId === postId)
      .map((r: any) => r.type);
  }, [myReactionsData]);

  const posts = postsData?.posts || [];

  const presetLocation = useMemo(() => {
    if (!selectedLocation || !selectedCountry) return null;
    return {
      countryCode: selectedCountry,
      zaLocationId: selectedLocation.id,
      locationDisplay: locationDisplayText,
    };
  }, [selectedCountry, selectedLocation, locationDisplayText]);

  const renderPost = useCallback(({ item, index }: { item: AnonGossipPost; index: number }) => (
    <GossipCard
      post={item}
      index={index}
      onReact={handleReact}
      onReply={handleReply}
      onReport={handleReport}
      onViewReplies={handleReply}
      onDM={handleDM}
      onShare={handleShare}
      myReactions={getMyReactions(item.id)}
    />
  ), [handleReact, handleReply, handleReport, handleDM, handleShare, getMyReactions]);

  const canPost = selectedLocation?.level === 3;
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      {canPost ? (
        <>
          <EmptyState type="posts" message="No gossip yet in this hood" />
          <Pressable 
            style={styles.beFirstButton}
            onPress={() => setShowComposeModal(true)}
          >
            <Feather name="coffee" size={20} color={Colors.light.textInverse} />
            <ThemedText style={styles.beFirstText}>Be the first to spill tea</ThemedText>
          </Pressable>
        </>
      ) : (
        <EmptyState 
          type="gossip" 
          message={activeTab === "community" 
            ? "Select a hood/kasi to see local gossip" 
            : "No trending gossip right now"
          } 
        />
      )}
    </View>
  ), [canPost, activeTab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText style={styles.title}>Local Gossip</ThemedText>
          <Pressable
            style={styles.dmButton}
            onPress={() => navigation.navigate("GossipDMList")}
          >
            <Feather name="inbox" size={20} color={Colors.light.primary} />
          </Pressable>
        </View>
        <LocationSelector
          selectedCountry={selectedCountry}
          selectedLocation={selectedLocation}
          onSelect={handleLocationSelect}
        />
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[
            styles.tab,
            activeTab === "community" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("community")}
        >
          <Feather 
            name="users" 
            size={16} 
            color={activeTab === "community" ? Colors.light.primary : Colors.light.textSecondary} 
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "community" && styles.activeTabText,
            ]}
          >
            Community
          </ThemedText>
        </Pressable>
        
        <Pressable
          style={[
            styles.tab,
            activeTab === "trending" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("trending")}
        >
          <Feather 
            name="trending-up" 
            size={16} 
            color={activeTab === "trending" ? Colors.light.primary : Colors.light.textSecondary} 
          />
          <ThemedText
            style={[
              styles.tabText,
              activeTab === "trending" && styles.activeTabText,
            ]}
          >
            Trending
          </ThemedText>
        </Pressable>
      </View>

      {postsLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetchPosts()}
              tintColor={Colors.light.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {canPost ? (
        <Pressable
          style={styles.fab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowComposeModal(true);
          }}
        >
          <Feather name="plus" size={24} color={Colors.light.textInverse} />
        </Pressable>
      ) : null}

      <GossipComposeModal
        visible={showComposeModal}
        onClose={() => {
          setShowComposeModal(false);
          refetchPosts();
        }}
        presetLocation={presetLocation}
      />

      <GossipRepliesModal
        visible={showRepliesModal}
        onClose={() => {
          setShowRepliesModal(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
      />

      <Modal
        visible={showDMModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDMModal(false)}
      >
        <Pressable 
          style={styles.dmModalOverlay} 
          onPress={() => setShowDMModal(false)}
        >
          <Pressable style={styles.dmModalContent} onPress={(e) => e.stopPropagation()}>
            <ThemedText style={styles.dmModalTitle}>Send Anonymous DM</ThemedText>
            <ThemedText style={styles.dmModalSubtitle}>
              Start a private conversation with this poster. Your identity stays hidden.
            </ThemedText>
            <TextInput
              style={styles.dmModalInput}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              value={dmMessage}
              onChangeText={setDmMessage}
              multiline
              maxLength={500}
            />
            <View style={styles.dmModalButtons}>
              <Pressable 
                style={[styles.dmModalButton, styles.dmModalButtonCancel]}
                onPress={() => setShowDMModal(false)}
              >
                <ThemedText style={styles.dmModalButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.dmModalButton, styles.dmModalButtonSend, !dmMessage.trim() && styles.dmModalButtonDisabled]}
                onPress={handleSendDM}
                disabled={!dmMessage.trim()}
              >
                <ThemedText style={[styles.dmModalButtonText, { color: "#FFF" }]}>Send</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  dmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  activeTab: {
    backgroundColor: Colors.light.backgroundTertiary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: Colors.light.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingVertical: Spacing.md,
    paddingBottom: 100,
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  beFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
  },
  beFirstText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textInverse,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  dmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  dmModalContent: {
    backgroundColor: Colors.light.backgroundRoot,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  dmModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  dmModalSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  dmModalInput: {
    borderWidth: 1,
    borderColor: Colors.light.glassBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  dmModalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dmModalButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: "center",
  },
  dmModalButtonCancel: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  dmModalButtonSend: {
    backgroundColor: Colors.light.primary,
  },
  dmModalButtonDisabled: {
    opacity: 0.5,
  },
  dmModalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
});
