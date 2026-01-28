import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import type { User, Role } from "@shared/schema";

type UserWithRoles = User & { roles?: Role[] };
type FilterStatus = "all" | "active" | "suspended" | "deactivated" | "admin";

const PAGE_SIZE = 20;

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  
  const [editForm, setEditForm] = useState({
    displayName: "",
    username: "",
    bio: "",
    avatarUrl: "",
    netWorth: "",
    influenceScore: "",
  });
  
  const [suspendForm, setSuspendForm] = useState({
    reason: "",
    durationDays: "",
  });
  
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [exportingData, setExportingData] = useState(false);
  const [mallModalVisible, setMallModalVisible] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);
  const [selectedMallItemId, setSelectedMallItemId] = useState("");

  const {
    data: users,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/users", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["/api/admin/roles"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/roles", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const { data: adminNotes, refetch: refetchNotes } = useQuery<Array<{
    id: string;
    content: string;
    createdAt: string;
    createdBy: { displayName: string; username: string };
  }>>({
    queryKey: ["/api/admin/users", selectedUser?.id, "notes"],
    queryFn: async () => {
      if (!selectedUser) return [];
      const res = await fetch(new URL(`/api/admin/users/${selectedUser.id}/notes`, getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json();
    },
    enabled: !!selectedUser && notesModalVisible,
  });

  // Mall products query
  const { data: userMallProducts, refetch: refetchMallProducts, isLoading: loadingMallProducts } = useQuery<{
    user: { id: string; username: string; displayName: string; netWorth: number };
    purchases: Array<{
      id: string;
      itemId: string;
      itemName: string;
      quantity: number;
      netWorthGained: number;
      purchasedAt: string;
    }>;
    totalPurchases: number;
    totalNetWorthFromPurchases: number;
  }>({
    queryKey: ["/api/admin/users", selectedUser?.id, "mall-products"],
    queryFn: async () => {
      if (!selectedUser) throw new Error("No user selected");
      const res = await fetch(new URL(`/api/admin/users/${selectedUser.id}/mall-products`, getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch mall products");
      return res.json();
    },
    enabled: !!selectedUser && mallModalVisible,
  });

  // All mall items for dropdown
  const { data: mallItems } = useQuery<Array<{ id: string; name: string; value: number; category: string }>>({
    queryKey: ["/api/mall/items"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/mall/items", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch mall items");
      return res.json();
    },
    enabled: addProductModalVisible,
  });

  const addNoteMutation = useMutation({
    mutationFn: async (data: { userId: string; content: string }) => {
      return apiRequest("POST", `/api/admin/users/${data.userId}/notes`, { content: data.content });
    },
    onSuccess: () => {
      refetchNotes();
      setNoteContent("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert("Error", "Failed to add note");
    },
  });

  const triggerDataExportMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/data-export`, {});
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Data export has been triggered. The user will receive a download link via email when ready.");
    },
    onError: () => {
      Alert.alert("Error", "Failed to trigger data export");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<User> }) => {
      return apiRequest("PATCH", `/api/admin/users/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditMode(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User updated successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to update user");
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (data: { id: string; reason: string; durationDays?: number }) => {
      return apiRequest("POST", `/api/admin/users/${data.id}/suspend`, {
        reason: data.reason,
        durationDays: data.durationDays,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSuspendModalVisible(false);
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User suspended successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to suspend user");
    },
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/users/${id}/unsuspend`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User unsuspended successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to unsuspend user");
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/users/${id}/force-logout`, {});
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User has been logged out from all sessions");
    },
    onError: () => {
      Alert.alert("Error", "Failed to force logout user");
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/users/${id}/deactivate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User account has been deactivated");
    },
    onError: () => {
      Alert.alert("Error", "Failed to deactivate user");
    },
  });

  const reactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/users/${id}/reactivate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "User account has been reactivated");
    },
    onError: () => {
      Alert.alert("Error", "Failed to reactivate user");
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async (data: { userId: string; roleId: string; action: "assign" | "remove" }) => {
      return apiRequest("POST", `/api/admin/users/${data.userId}/roles`, {
        roleId: data.roleId,
        action: data.action,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Alert.alert("Error", "Failed to update role");
    },
  });

  // Mall product mutations
  const addMallProductMutation = useMutation({
    mutationFn: async (data: { userId: string; itemId: string; quantity: number }) => {
      return apiRequest("POST", `/api/admin/users/${data.userId}/mall-products/add`, {
        itemId: data.itemId,
        quantity: data.quantity,
      });
    },
    onSuccess: (data: any) => {
      refetchMallProducts();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setAddProductModalVisible(false);
      setSelectedMallItemId("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `Added ${data.item?.name || "product"} to user. Net worth +R${(data.netWorthGained || 0).toLocaleString()}`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to add product");
    },
  });

  const removeMallProductMutation = useMutation({
    mutationFn: async (data: { userId: string; purchaseId: string }) => {
      return apiRequest("POST", `/api/admin/users/${data.userId}/mall-products/remove`, {
        purchaseId: data.purchaseId,
      });
    },
    onSuccess: (data: any) => {
      refetchMallProducts();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `Removed product. Net worth -R${(data.netWorthReduced || 0).toLocaleString()}`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to remove product");
    },
  });

  const removeAllMallProductsMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/mall-products/remove-all`, {});
    },
    onSuccess: (data: any) => {
      refetchMallProducts();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `Removed ${data.productsRemoved} products. Net worth -R${(data.netWorthReduced || 0).toLocaleString()}`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to remove all products");
    },
  });

  const setNetWorthMutation = useMutation({
    mutationFn: async (data: { userId: string; netWorth: number }) => {
      return apiRequest("POST", `/api/admin/users/${data.userId}/set-networth`, {
        netWorth: data.netWorth,
      });
    },
    onSuccess: (data: any) => {
      refetchMallProducts();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", `Net worth set to R${(data.newNetWorth || 0).toLocaleString()}`);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to set net worth");
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filterStatus) {
      case "active":
        return !user.suspendedAt && !user.deactivatedAt;
      case "suspended":
        return !!user.suspendedAt;
      case "deactivated":
        return !!user.deactivatedAt;
      case "admin":
        return user.isAdmin;
      default:
        return true;
    }
  });

  const paginatedUsers = filteredUsers?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) || [];
  const totalPages = Math.ceil((filteredUsers?.length || 0) / PAGE_SIZE);

  const openUserDetail = useCallback(async (user: User) => {
    try {
      const res = await fetch(new URL(`/api/admin/users/${user.id}`, getApiUrl()), {
        credentials: "include",
      });
      if (res.ok) {
        const userData: UserWithRoles = await res.json();
        setSelectedUser(userData);
        setEditForm({
          displayName: userData.displayName,
          username: userData.username,
          bio: userData.bio || "",
          avatarUrl: userData.avatarUrl || "",
          netWorth: String(userData.netWorth || 0),
          influenceScore: String(userData.influenceScore || 0),
        });
        setEditMode(false);
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load user details");
    }
  }, []);

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      updates: {
        displayName: editForm.displayName,
        username: editForm.username,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl || null,
        netWorth: parseInt(editForm.netWorth) || 0,
        influenceScore: parseInt(editForm.influenceScore) || 0,
      },
    });
  };

  const handleSuspend = () => {
    if (!selectedUser || !suspendForm.reason) {
      Alert.alert("Error", "Please provide a reason for suspension");
      return;
    }
    
    suspendUserMutation.mutate({
      id: selectedUser.id,
      reason: suspendForm.reason,
      durationDays: suspendForm.durationDays ? parseInt(suspendForm.durationDays) : undefined,
    });
  };

  const handleUnsuspend = () => {
    if (!selectedUser) return;
    
    Alert.alert(
      "Confirm Unsuspend",
      `Are you sure you want to unsuspend ${selectedUser.displayName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unsuspend", onPress: () => unsuspendUserMutation.mutate(selectedUser.id) },
      ]
    );
  };

  const handleForceLogout = () => {
    if (!selectedUser) return;
    
    Alert.alert(
      "Force Logout",
      `This will log ${selectedUser.displayName} out of all devices. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Force Logout", style: "destructive", onPress: () => forceLogoutMutation.mutate(selectedUser.id) },
      ]
    );
  };

  const handleDeactivate = () => {
    if (!selectedUser) return;
    
    Alert.alert(
      "Deactivate Account",
      `This will deactivate ${selectedUser.displayName}'s account and log them out. They won't be able to use the app until reactivated.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Deactivate", style: "destructive", onPress: () => deactivateUserMutation.mutate(selectedUser.id) },
      ]
    );
  };

  const handleReactivate = () => {
    if (!selectedUser) return;
    
    Alert.alert(
      "Reactivate Account",
      `This will reactivate ${selectedUser.displayName}'s account. They will be able to use the app again.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reactivate", onPress: () => reactivateUserMutation.mutate(selectedUser.id) },
      ]
    );
  };

  const handleAddNote = () => {
    if (!selectedUser || !noteContent.trim()) {
      Alert.alert("Error", "Please enter a note");
      return;
    }
    addNoteMutation.mutate({ userId: selectedUser.id, content: noteContent.trim() });
  };

  const handleTriggerDataExport = () => {
    if (!selectedUser) return;
    
    Alert.alert(
      "Trigger Data Export",
      `This will generate a data export for ${selectedUser.displayName}. This may take a few minutes.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => triggerDataExportMutation.mutate(selectedUser.id) },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <Pressable onPress={() => openUserDetail(item)} testID={`user-row-${item.id}`}>
      <Card elevation={1} style={styles.userCard}>
        <Avatar uri={item.avatarUrl} size={48} />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <ThemedText type="body" style={styles.displayName} numberOfLines={1}>
              {item.displayName}
            </ThemedText>
            {item.isAdmin ? (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Feather name="shield" size={10} color="#FFFFFF" />
                <ThemedText style={styles.badgeText}>Admin</ThemedText>
              </View>
            ) : null}
            {item.suspendedAt ? (
              <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                <Feather name="slash" size={10} color="#FFFFFF" />
                <ThemedText style={styles.badgeText}>Suspended</ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={[styles.username, { color: theme.textSecondary }]}>
            @{item.username}
          </ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {item.email}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Card>
    </Pressable>
  );

  const FilterButton = ({ status, label }: { status: FilterStatus; label: string }) => (
    <Pressable
      style={[
        styles.filterButton,
        filterStatus === status && { backgroundColor: theme.primary },
        { borderColor: theme.glassBorder },
      ]}
      onPress={() => {
        setFilterStatus(status);
        setPage(0);
      }}
    >
      <ThemedText
        style={[
          styles.filterButtonText,
          filterStatus === status && { color: "#FFFFFF" },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(0);
            }}
            testID="search-input"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <FilterButton status="all" label="All" />
          <FilterButton status="active" label="Active" />
          <FilterButton status="suspended" label="Suspended" />
          <FilterButton status="deactivated" label="Deactivated" />
          <FilterButton status="admin" label="Admins" />
        </ScrollView>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        data={paginatedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText type="h4" style={styles.emptyTitle}>No users found</ThemedText>
          </View>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              <Pressable
                style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
                onPress={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                <Feather name="chevron-left" size={20} color={page === 0 ? theme.textSecondary : theme.text} />
              </Pressable>
              <ThemedText style={styles.pageText}>
                Page {page + 1} of {totalPages}
              </ThemedText>
              <Pressable
                style={[styles.pageButton, page >= totalPages - 1 && styles.pageButtonDisabled]}
                onPress={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                <Feather name="chevron-right" size={20} color={page >= totalPages - 1 ? theme.textSecondary : theme.text} />
              </Pressable>
            </View>
          ) : null
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setModalVisible(false)}>
                <ThemedText style={{ color: theme.primary }}>Close</ThemedText>
              </Pressable>
              <ThemedText type="h4">User Details</ThemedText>
              {editMode ? (
                <Pressable onPress={handleSaveEdit} disabled={updateUserMutation.isPending}>
                  <ThemedText style={{ color: theme.primary }}>
                    {updateUserMutation.isPending ? "Saving..." : "Save"}
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable onPress={() => setEditMode(true)}>
                  <ThemedText style={{ color: theme.primary }}>Edit</ThemedText>
                </Pressable>
              )}
            </View>

            {selectedUser ? (
              <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.userHeader}>
                  <Avatar uri={selectedUser.avatarUrl} size={80} />
                  <View style={styles.userHeaderInfo}>
                    <ThemedText type="h3">{selectedUser.displayName}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>@{selectedUser.username}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>{selectedUser.email}</ThemedText>
                  </View>
                </View>

                {selectedUser.suspendedAt ? (
                  <Card elevation={1} style={StyleSheet.flatten([styles.suspendedBanner, { backgroundColor: "#FEE2E2" }])}>
                    <Feather name="alert-circle" size={20} color="#DC2626" />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ color: "#DC2626", fontWeight: "600" }}>Suspended</ThemedText>
                      <ThemedText style={{ color: "#DC2626", fontSize: 12 }}>
                        {selectedUser.suspendedReason}
                      </ThemedText>
                      {selectedUser.suspendedUntil ? (
                        <ThemedText style={{ color: "#DC2626", fontSize: 12 }}>
                          Until: {new Date(selectedUser.suspendedUntil).toLocaleDateString()}
                        </ThemedText>
                      ) : null}
                    </View>
                  </Card>
                ) : null}

                {editMode ? (
                  <View style={styles.editForm}>
                    <ThemedText style={styles.fieldLabel}>Display Name</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      value={editForm.displayName}
                      onChangeText={(text) => setEditForm({ ...editForm, displayName: text })}
                    />

                    <ThemedText style={styles.fieldLabel}>Username</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      value={editForm.username}
                      onChangeText={(text) => setEditForm({ ...editForm, username: text })}
                    />

                    <ThemedText style={styles.fieldLabel}>Bio</ThemedText>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      value={editForm.bio}
                      onChangeText={(text) => setEditForm({ ...editForm, bio: text })}
                      multiline
                      numberOfLines={3}
                    />

                    <ThemedText style={styles.fieldLabel}>Avatar URL</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      value={editForm.avatarUrl}
                      onChangeText={(text) => setEditForm({ ...editForm, avatarUrl: text })}
                      placeholder="https://..."
                      placeholderTextColor={theme.textSecondary}
                    />

                    <ThemedText style={styles.fieldLabel}>Net Worth</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      value={editForm.netWorth}
                      onChangeText={(text) => setEditForm({ ...editForm, netWorth: text.replace(/[^0-9]/g, "") })}
                      keyboardType="number-pad"
                    />

                    <ThemedText style={styles.fieldLabel}>Influence Score</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                      value={editForm.influenceScore}
                      onChangeText={(text) => setEditForm({ ...editForm, influenceScore: text.replace(/[^0-9]/g, "") })}
                      keyboardType="number-pad"
                    />
                  </View>
                ) : (
                  <View style={styles.detailsGrid}>
                    <Card elevation={1} style={styles.statCard}>
                      <ThemedText style={{ color: theme.textSecondary }}>Net Worth</ThemedText>
                      <ThemedText type="h3" style={{ color: "#D4AF37" }}>
                        ${(selectedUser.netWorth || 0).toLocaleString()}
                      </ThemedText>
                    </Card>
                    <Card elevation={1} style={styles.statCard}>
                      <ThemedText style={{ color: theme.textSecondary }}>Influence</ThemedText>
                      <ThemedText type="h3" style={{ color: "#C0C0C0" }}>
                        {selectedUser.influenceScore || 0}
                      </ThemedText>
                    </Card>
                    <Card elevation={1} style={styles.statCard}>
                      <ThemedText style={{ color: theme.textSecondary }}>Joined</ThemedText>
                      <ThemedText type="body">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </ThemedText>
                    </Card>
                    <Card elevation={1} style={styles.statCard}>
                      <ThemedText style={{ color: theme.textSecondary }}>Status</ThemedText>
                      <ThemedText type="body" style={{ color: selectedUser.isAdmin ? theme.primary : theme.text }}>
                        {selectedUser.isAdmin ? "Admin" : "User"}
                      </ThemedText>
                    </Card>
                  </View>
                )}

                {selectedUser.bio && !editMode ? (
                  <Card elevation={1} style={styles.bioCard}>
                    <ThemedText style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>Bio</ThemedText>
                    <ThemedText>{selectedUser.bio}</ThemedText>
                  </Card>
                ) : null}

                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                  <Card elevation={1} style={styles.rolesCard}>
                    <ThemedText style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>Assigned Roles</ThemedText>
                    {selectedUser.roles.map((role) => (
                      <View key={role.id} style={styles.roleItem}>
                        <View style={[styles.roleBadge, { backgroundColor: theme.primary + "20" }]}>
                          <ThemedText style={{ color: theme.primary }}>{role.displayName}</ThemedText>
                        </View>
                        <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                          Level {role.level}
                        </ThemedText>
                      </View>
                    ))}
                  </Card>
                ) : null}

                <View style={styles.actionButtons}>
                  {selectedUser.suspendedAt ? (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                      onPress={handleUnsuspend}
                      disabled={unsuspendUserMutation.isPending}
                    >
                      <Feather name="check-circle" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.actionButtonText}>
                        {unsuspendUserMutation.isPending ? "..." : "Unsuspend User"}
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
                      onPress={() => {
                        setSuspendForm({ reason: "", durationDays: "" });
                        setSuspendModalVisible(true);
                      }}
                    >
                      <Feather name="slash" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.actionButtonText}>Suspend User</ThemedText>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.primary }]}
                    onPress={() => setRoleModalVisible(true)}
                  >
                    <Feather name="shield" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>Manage Roles</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
                    onPress={handleForceLogout}
                    disabled={forceLogoutMutation.isPending}
                  >
                    <Feather name="log-out" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>
                      {forceLogoutMutation.isPending ? "..." : "Force Logout"}
                    </ThemedText>
                  </Pressable>

                  {selectedUser.deactivatedAt ? (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: "#10B981" }]}
                      onPress={handleReactivate}
                      disabled={reactivateUserMutation.isPending}
                    >
                      <Feather name="user-check" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.actionButtonText}>
                        {reactivateUserMutation.isPending ? "..." : "Reactivate Account"}
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: "#6B7280" }]}
                      onPress={handleDeactivate}
                      disabled={deactivateUserMutation.isPending}
                    >
                      <Feather name="user-x" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.actionButtonText}>
                        {deactivateUserMutation.isPending ? "..." : "Deactivate Account"}
                      </ThemedText>
                    </Pressable>
                  )}

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: "#8B5CF6" }]}
                    onPress={() => setNotesModalVisible(true)}
                  >
                    <Feather name="file-text" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>Admin Notes</ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}
                    onPress={handleTriggerDataExport}
                    disabled={triggerDataExportMutation.isPending}
                  >
                    <Feather name="download" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>
                      {triggerDataExportMutation.isPending ? "Exporting..." : "Export User Data"}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, { backgroundColor: "#D4AF37" }]}
                    onPress={() => setMallModalVisible(true)}
                  >
                    <Feather name="shopping-bag" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.actionButtonText}>Mall Products</ThemedText>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={suspendModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSuspendModalVisible(false)}
      >
        <View style={styles.suspendModalOverlay}>
          <View style={[styles.suspendModalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>Suspend User</ThemedText>
            
            <ThemedText style={styles.fieldLabel}>Reason *</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
              value={suspendForm.reason}
              onChangeText={(text) => setSuspendForm({ ...suspendForm, reason: text })}
              placeholder="Enter reason for suspension..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />

            <ThemedText style={styles.fieldLabel}>Duration (days, optional)</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
              value={suspendForm.durationDays}
              onChangeText={(text) => setSuspendForm({ ...suspendForm, durationDays: text.replace(/[^0-9]/g, "") })}
              placeholder="Leave empty for permanent"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
            />

            <View style={styles.suspendModalButtons}>
              <Pressable
                style={[styles.suspendModalButton, { backgroundColor: theme.glassBackground }]}
                onPress={() => setSuspendModalVisible(false)}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.suspendModalButton, { backgroundColor: "#EF4444" }]}
                onPress={handleSuspend}
                disabled={suspendUserMutation.isPending}
              >
                <ThemedText style={{ color: "#FFFFFF" }}>
                  {suspendUserMutation.isPending ? "Suspending..." : "Suspend"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={roleModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.suspendModalOverlay}>
          <View style={[styles.suspendModalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>Manage Roles</ThemedText>
            
            {roles?.map((role) => {
              const hasRole = selectedUser?.roles?.some((r) => r.id === role.id);
              return (
                <Pressable
                  key={role.id}
                  style={[
                    styles.roleRow,
                    { backgroundColor: hasRole ? theme.primary + "20" : theme.glassBackground },
                  ]}
                  onPress={() => {
                    if (selectedUser) {
                      assignRoleMutation.mutate({
                        userId: selectedUser.id,
                        roleId: role.id,
                        action: hasRole ? "remove" : "assign",
                      });
                    }
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: "600" }}>{role.displayName}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                      {role.description || `Level ${role.level}`}
                    </ThemedText>
                  </View>
                  <Feather
                    name={hasRole ? "check-square" : "square"}
                    size={24}
                    color={hasRole ? theme.primary : theme.textSecondary}
                  />
                </Pressable>
              );
            })}

            <Pressable
              style={[styles.suspendModalButton, { backgroundColor: theme.primary, marginTop: Spacing.lg }]}
              onPress={() => setRoleModalVisible(false)}
            >
              <ThemedText style={{ color: "#FFFFFF" }}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={notesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setNotesModalVisible(false)}>
              <ThemedText style={{ color: theme.primary }}>Close</ThemedText>
            </Pressable>
            <ThemedText type="h4">Admin Notes</ThemedText>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.modalContent}>
            <Card elevation={1} style={styles.noteInputCard}>
              <ThemedText style={styles.fieldLabel}>Add Note</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                value={noteContent}
                onChangeText={setNoteContent}
                placeholder="Enter a note about this user..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={3}
              />
              <Pressable
                style={[styles.addNoteButton, { backgroundColor: theme.primary }]}
                onPress={handleAddNote}
                disabled={addNoteMutation.isPending}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                </ThemedText>
              </Pressable>
            </Card>

            <ThemedText type="body" style={{ marginTop: Spacing.lg, marginBottom: Spacing.md, fontWeight: "600" }}>
              Notes History
            </ThemedText>

            <ScrollView style={{ flex: 1 }}>
              {adminNotes && adminNotes.length > 0 ? (
                adminNotes.map((note) => (
                  <Card key={note.id} elevation={1} style={styles.noteCard}>
                    <View style={styles.noteHeader}>
                      <ThemedText style={{ fontWeight: "600" }}>{note.createdBy.displayName}</ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                        {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString()}
                      </ThemedText>
                    </View>
                    <ThemedText style={{ marginTop: Spacing.sm }}>{note.content}</ThemedText>
                  </Card>
                ))
              ) : (
                <View style={styles.emptyNotes}>
                  <Feather name="file-text" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                  <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                    No notes yet
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Mall Products Modal */}
      <Modal
        visible={mallModalVisible}
        animationType="slide"
        onRequestClose={() => setMallModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setMallModalVisible(false)}>
                <ThemedText style={{ color: theme.primary }}>Close</ThemedText>
              </Pressable>
              <ThemedText type="h4">Mall Products</ThemedText>
              <Pressable onPress={() => setAddProductModalVisible(true)}>
                <ThemedText style={{ color: theme.primary }}>+ Add</ThemedText>
              </Pressable>
            </View>

            {selectedUser ? (
              <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.userHeader}>
                  <Avatar uri={selectedUser.avatarUrl} size={60} />
                  <View style={styles.userHeaderInfo}>
                    <ThemedText type="h4">{selectedUser.displayName}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>@{selectedUser.username}</ThemedText>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <Card elevation={1} style={styles.statCard}>
                    <ThemedText style={{ color: theme.textSecondary }}>Net Worth</ThemedText>
                    <ThemedText type="h3" style={{ color: "#D4AF37" }}>
                      R{(userMallProducts?.user?.netWorth || selectedUser.netWorth || 0).toLocaleString()}
                    </ThemedText>
                  </Card>
                  <Card elevation={1} style={styles.statCard}>
                    <ThemedText style={{ color: theme.textSecondary }}>Total Items</ThemedText>
                    <ThemedText type="h3">
                      {userMallProducts?.totalPurchases || 0}
                    </ThemedText>
                  </Card>
                </View>

                {loadingMallProducts ? (
                  <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.xl }} />
                ) : userMallProducts?.purchases && userMallProducts.purchases.length > 0 ? (
                  <>
                    <ThemedText type="body" style={{ fontWeight: "600", marginBottom: Spacing.md }}>
                      Purchased Items
                    </ThemedText>
                    {userMallProducts.purchases.map((purchase) => (
                      <Card key={purchase.id} elevation={1} style={styles.bioCard}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <View style={{ flex: 1 }}>
                            <ThemedText style={{ fontWeight: "600" }}>{purchase.itemName}</ThemedText>
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                              Qty: {purchase.quantity} | Worth: R{(purchase.netWorthGained || 0).toLocaleString()}
                            </ThemedText>
                            <ThemedText style={{ color: theme.textSecondary, fontSize: 11 }}>
                              {new Date(purchase.purchasedAt).toLocaleDateString()}
                            </ThemedText>
                          </View>
                          <Pressable
                            style={{ padding: Spacing.sm }}
                            onPress={() => {
                              Alert.alert(
                                "Remove Item",
                                `Remove ${purchase.itemName}? This will reduce their net worth by R${(purchase.netWorthGained || 0).toLocaleString()}.`,
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Remove",
                                    style: "destructive",
                                    onPress: () => removeMallProductMutation.mutate({
                                      userId: selectedUser.id,
                                      purchaseId: purchase.id,
                                    }),
                                  },
                                ]
                              );
                            }}
                            disabled={removeMallProductMutation.isPending}
                          >
                            <Feather name="trash-2" size={20} color="#EF4444" />
                          </Pressable>
                        </View>
                      </Card>
                    ))}

                    <Pressable
                      style={[styles.actionButton, { backgroundColor: "#EF4444", marginTop: Spacing.lg }]}
                      onPress={() => {
                        Alert.alert(
                          "Remove All Products",
                          `Remove all ${userMallProducts.totalPurchases} products from ${selectedUser.displayName}? This will reduce their net worth by R${(userMallProducts.totalNetWorthFromPurchases || 0).toLocaleString()}.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Remove All",
                              style: "destructive",
                              onPress: () => removeAllMallProductsMutation.mutate(selectedUser.id),
                            },
                          ]
                        );
                      }}
                      disabled={removeAllMallProductsMutation.isPending}
                    >
                      <Feather name="trash" size={20} color="#FFFFFF" />
                      <ThemedText style={styles.actionButtonText}>
                        {removeAllMallProductsMutation.isPending ? "Removing..." : "Remove All Products"}
                      </ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <View style={styles.emptyNotes}>
                    <Feather name="shopping-bag" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                    <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
                      No mall products yet
                    </ThemedText>
                  </View>
                )}

                <ThemedText type="body" style={{ fontWeight: "600", marginTop: Spacing.xl, marginBottom: Spacing.md }}>
                  Set Net Worth Directly
                </ThemedText>
                <Card elevation={1} style={styles.noteInputCard}>
                  <ThemedText style={styles.fieldLabel}>New Net Worth (Rands)</ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: theme.glassBorder }]}
                    placeholder="e.g. 1000000"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    onSubmitEditing={(e) => {
                      const val = parseInt(e.nativeEvent.text.replace(/[^0-9]/g, ""));
                      if (!isNaN(val) && val >= 0) {
                        Alert.alert(
                          "Confirm Net Worth Change",
                          `Set ${selectedUser.displayName}'s net worth to R${val.toLocaleString()}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Set",
                              onPress: () => setNetWorthMutation.mutate({ userId: selectedUser.id, netWorth: val }),
                            },
                          ]
                        );
                      }
                    }}
                  />
                  <ThemedText style={{ color: theme.textSecondary, fontSize: 12, marginTop: Spacing.sm }}>
                    Enter amount and press Done/Enter to set
                  </ThemedText>
                </Card>
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        visible={addProductModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAddProductModalVisible(false)}
      >
        <View style={styles.suspendModalOverlay}>
          <View style={[styles.suspendModalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h4" style={{ marginBottom: Spacing.lg }}>Add Mall Product</ThemedText>
            
            <ThemedText style={styles.fieldLabel}>Select Product</ThemedText>
            <ScrollView style={{ maxHeight: 250 }}>
              {mallItems && mallItems.length > 0 ? (
                mallItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.roleRow,
                      {
                        backgroundColor: selectedMallItemId === item.id ? theme.primary + "30" : theme.glassBackground,
                        borderWidth: selectedMallItemId === item.id ? 2 : 0,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => setSelectedMallItemId(item.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: "600" }}>{item.name}</ThemedText>
                      <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                        R{(item.value || 0).toLocaleString()} | +R{((item.value || 0) * 10).toLocaleString()} net worth
                      </ThemedText>
                    </View>
                    {selectedMallItemId === item.id ? (
                      <Feather name="check-circle" size={20} color={theme.primary} />
                    ) : null}
                  </Pressable>
                ))
              ) : (
                <ThemedText style={{ color: theme.textSecondary, textAlign: "center", padding: Spacing.lg }}>
                  No mall items available
                </ThemedText>
              )}
            </ScrollView>

            <View style={styles.suspendModalButtons}>
              <Pressable
                style={[styles.suspendModalButton, { backgroundColor: theme.glassBackground }]}
                onPress={() => {
                  setAddProductModalVisible(false);
                  setSelectedMallItemId("");
                }}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.suspendModalButton, { backgroundColor: "#D4AF37", opacity: selectedMallItemId ? 1 : 0.5 }]}
                onPress={() => {
                  if (selectedMallItemId && selectedUser) {
                    addMallProductMutation.mutate({
                      userId: selectedUser.id,
                      itemId: selectedMallItemId,
                      quantity: 1,
                    });
                  }
                }}
                disabled={!selectedMallItemId || addMallProductMutation.isPending}
              >
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {addMallProductMutation.isPending ? "Adding..." : "Add Product"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
  },
  userCard: {
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  displayName: {
    fontWeight: "600",
  },
  username: {
    fontSize: 14,
  },
  email: {
    fontSize: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyTitle: {
    marginTop: Spacing.lg,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  pageButton: {
    padding: Spacing.sm,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  userHeader: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  userHeaderInfo: {
    flex: 1,
    justifyContent: "center",
  },
  suspendedBanner: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  editForm: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
    textAlignVertical: "top",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: "47%",
    padding: Spacing.lg,
    alignItems: "center",
  },
  bioCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  rolesCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  roleItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  actionButtons: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  suspendModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  suspendModalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  suspendModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  suspendModalButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  noteInputCard: {
    padding: Spacing.lg,
  },
  addNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  noteCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyNotes: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
});
