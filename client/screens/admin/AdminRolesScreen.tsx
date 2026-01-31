import React, { useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import type { Role, Permission, RoleWithPermissions } from "@shared/schema";

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "#DC2626",
  ADMIN: "#8B5CF6",
  MODERATOR: "#3B82F6",
  SUPPORT: "#10B981",
};

export default function AdminRolesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);

  const [formName, setFormName] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLevel, setFormLevel] = useState("0");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const {
    data: roles,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<RoleWithPermissions[]>({
    queryKey: ["/api/admin/roles"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/roles", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const { data: allPermissions } = useQuery<Record<string, Permission[]>>({
    queryKey: ["/api/admin/permissions"],
    queryFn: async () => {
      const res = await fetch(new URL("/api/admin/permissions?grouped=true", getApiUrl()), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch permissions");
      return res.json();
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string; displayName: string; description?: string; level?: number }) => {
      await apiRequest("POST", "/api/admin/roles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to create role");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { displayName?: string; description?: string; level?: number } }) => {
      await apiRequest("PATCH", `/api/admin/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update role");
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to delete role");
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => {
      await apiRequest("POST", `/api/admin/roles/${roleId}/permissions`, { permissionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowPermissionsModal(false);
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update permissions");
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormDisplayName("");
    setFormDescription("");
    setFormLevel("0");
    setSelectedRole(null);
    setSelectedPermissions([]);
  };

  const openEditModal = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setFormDisplayName(role.displayName);
    setFormDescription(role.description || "");
    setFormLevel(role.level.toString());
    setShowEditModal(true);
  };

  const openPermissionsModal = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions.map((p) => p.id));
    setShowPermissionsModal(true);
  };

  const handleDeleteRole = (role: RoleWithPermissions) => {
    if (role.isSystem) {
      Alert.alert("Cannot Delete", "System roles cannot be deleted.");
      return;
    }
    if (role.name === "SUPER_ADMIN") {
      Alert.alert("Cannot Delete", "The SUPER_ADMIN role cannot be deleted.");
      return;
    }

    Alert.alert(
      "Delete Role",
      `Are you sure you want to delete the "${role.displayName}" role? Users with this role will lose their assigned permissions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteRoleMutation.mutate(role.id),
        },
      ]
    );
  };

  const handleCreateRole = () => {
    if (!formName.trim() || !formDisplayName.trim()) {
      Alert.alert("Error", "Name and display name are required");
      return;
    }
    createRoleMutation.mutate({
      name: formName,
      displayName: formDisplayName,
      description: formDescription || undefined,
      level: parseInt(formLevel) || 0,
    });
  };

  const handleUpdateRole = () => {
    if (!selectedRole) return;
    updateRoleMutation.mutate({
      id: selectedRole.id,
      data: {
        displayName: formDisplayName,
        description: formDescription || undefined,
        level: parseInt(formLevel) || 0,
      },
    });
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    updatePermissionsMutation.mutate({
      roleId: selectedRole.id,
      permissionIds: selectedPermissions,
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getRoleColor = (roleName: string) => {
    return ROLE_COLORS[roleName] || theme.primary;
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "SUPER_ADMIN":
        return "star";
      case "ADMIN":
        return "shield";
      case "MODERATOR":
        return "eye";
      case "SUPPORT":
        return "headphones";
      default:
        return "user";
    }
  };

  const renderRoleItem = ({ item }: { item: RoleWithPermissions }) => {
    const color = getRoleColor(item.name);
    const icon = getRoleIcon(item.name);

    return (
      <Card elevation={1} style={styles.roleCard}>
        <View style={styles.roleHeader}>
          <View style={[styles.roleIcon, { backgroundColor: `${color}20` }]}>
            <Feather name={icon as any} size={24} color={color} />
          </View>
          <View style={styles.roleInfo}>
            <View style={styles.roleNameRow}>
              <ThemedText type="body" style={styles.roleName}>
                {item.displayName}
              </ThemedText>
              {item.isSystem ? (
                <View style={[styles.systemBadge, { backgroundColor: theme.glassBackground }]}>
                  <ThemedText style={[styles.systemBadgeText, { color: theme.textSecondary }]}>
                    System
                  </ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText style={[styles.roleDescription, { color: theme.textSecondary }]}>
              {item.description || "No description"}
            </ThemedText>
          </View>
        </View>

        <View style={styles.roleDetails}>
          <View style={styles.detailItem}>
            <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Level
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color }]}>
              {item.level}
            </ThemedText>
          </View>
          <View style={styles.detailItem}>
            <ThemedText style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Permissions
            </ThemedText>
            <ThemedText style={styles.detailValue}>
              {item.permissions.length}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => openPermissionsModal(item)}
            style={[styles.actionButton, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}
          >
            <Feather name="key" size={14} color={theme.primary} />
            <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
              Permissions
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => openEditModal(item)}
            style={[styles.actionButton, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}
          >
            <Feather name="edit-2" size={14} color={theme.primary} />
            <ThemedText style={[styles.actionButtonText, { color: theme.primary }]}>
              Edit
            </ThemedText>
          </Pressable>

          {!item.isSystem && item.name !== "SUPER_ADMIN" ? (
            <Pressable
              onPress={() => handleDeleteRole(item)}
              style={[styles.actionButton, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}40` }]}
            >
              <Feather name="trash-2" size={14} color={theme.error} />
              <ThemedText style={[styles.actionButtonText, { color: theme.error }]}>
                Delete
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </Card>
    );
  };

  const renderFormModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        isEdit ? setShowEditModal(false) : setShowCreateModal(false);
        resetForm();
      }}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => {
              isEdit ? setShowEditModal(false) : setShowCreateModal(false);
              resetForm();
            }}
          >
            <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
          </Pressable>
          <ThemedText type="h4">{isEdit ? "Edit Role" : "Create Role"}</ThemedText>
          <Pressable
            onPress={isEdit ? handleUpdateRole : handleCreateRole}
            disabled={createRoleMutation.isPending || updateRoleMutation.isPending}
          >
            <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
              {isEdit ? "Save" : "Create"}
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent}>
          {!isEdit ? (
            <View style={styles.formGroup}>
              <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
                Role Name (ID)
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: `${theme.primary}30` }]}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g., CONTENT_REVIEWER"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
              />
              <ThemedText style={[styles.formHint, { color: theme.textSecondary }]}>
                Will be converted to uppercase with underscores
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
              Display Name
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: `${theme.primary}30` }]}
              value={formDisplayName}
              onChangeText={setFormDisplayName}
              placeholder="e.g., Content Reviewer"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
              Description
            </ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: `${theme.primary}30` }]}
              value={formDescription}
              onChangeText={setFormDescription}
              placeholder="Describe what this role can do..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: theme.textSecondary }]}>
              Authority Level
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.glassBackground, color: theme.text, borderColor: `${theme.primary}30` }]}
              value={formLevel}
              onChangeText={setFormLevel}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
            />
            <ThemedText style={[styles.formHint, { color: theme.textSecondary }]}>
              Higher levels can manage lower level roles (0-100)
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderPermissionsModal = () => (
    <Modal
      visible={showPermissionsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowPermissionsModal(false);
        resetForm();
      }}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => {
              setShowPermissionsModal(false);
              resetForm();
            }}
          >
            <ThemedText style={{ color: theme.primary }}>Cancel</ThemedText>
          </Pressable>
          <ThemedText type="h4">Permissions</ThemedText>
          <Pressable
            onPress={handleSavePermissions}
            disabled={updatePermissionsMutation.isPending}
          >
            <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>Save</ThemedText>
          </Pressable>
        </View>

        {selectedRole ? (
          <View style={styles.permissionsHeader}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              {selectedRole.displayName}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {selectedPermissions.length} permissions selected
            </ThemedText>
          </View>
        ) : null}

        <ScrollView style={styles.modalContent}>
          {allPermissions && Object.entries(allPermissions).map(([group, perms]) => (
            <View key={group} style={styles.permissionGroup}>
              <ThemedText style={[styles.permissionGroupTitle, { color: theme.primary }]}>
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </ThemedText>
              {perms.map((perm) => (
                <Pressable
                  key={perm.id}
                  style={styles.permissionItem}
                  onPress={() => togglePermission(perm.id)}
                >
                  <View style={styles.permissionInfo}>
                    <ThemedText style={styles.permissionName}>{perm.name}</ThemedText>
                    <ThemedText style={[styles.permissionKey, { color: theme.textSecondary }]}>
                      {perm.key}
                    </ThemedText>
                  </View>
                  <Switch
                    value={selectedPermissions.includes(perm.id)}
                    onValueChange={() => togglePermission(perm.id)}
                    trackColor={{ false: theme.glassBackground, true: `${theme.primary}80` }}
                    thumbColor={selectedPermissions.includes(perm.id) ? theme.primary : "#f4f3f4"}
                  />
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.backgroundRoot }]}>
        <LoadingIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
        <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        data={roles || []}
        keyExtractor={(item) => item.id}
        renderItem={renderRoleItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListHeaderComponent={
          <View style={{ marginBottom: Spacing.lg }}>
            <Card elevation={1} style={styles.infoCard}>
              <Feather name="info" size={20} color={theme.primary} />
              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                Roles define access levels. Higher level roles can manage lower level roles. System roles cannot be deleted.
              </ThemedText>
            </Card>

            <Pressable
              onPress={() => setShowCreateModal(true)}
              style={[styles.createButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>Create New Role</ThemedText>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="shield" size={64} color={theme.textSecondary} style={{ opacity: 0.5 }} />
            <ThemedText type="h4" style={styles.emptyTitle}>No roles found</ThemedText>
          </View>
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

        {renderFormModal(false)}
        {renderFormModal(true)}
        {renderPermissionsModal()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  roleCard: {
    padding: Spacing.lg,
  },
  roleHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  roleInfo: {
    flex: 1,
  },
  roleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  roleName: {
    fontWeight: "600",
  },
  systemBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  systemBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  roleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  roleDetails: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
    paddingTop: Spacing.md,
    gap: Spacing.xl,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(139, 92, 246, 0.15)",
    flexWrap: "wrap",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.15)",
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formHint: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  permissionsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.15)",
  },
  permissionGroup: {
    marginBottom: Spacing.xl,
  },
  permissionGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139, 92, 246, 0.1)",
  },
  permissionInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  permissionName: {
    fontSize: 15,
    fontWeight: "500",
  },
  permissionKey: {
    fontSize: 12,
    marginTop: 2,
  },
});
