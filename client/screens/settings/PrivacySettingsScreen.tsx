import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, Pressable, Alert, Platform, TextInput } from "react-native";
import { LoadingIndicator } from "@/components/animations";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Haptics from "@/lib/safeHaptics";
import { useNavigation } from "@react-navigation/native";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

type PolicyOption = "EVERYONE" | "FOLLOWERS" | "NOBODY";

interface UserSettings {
  id: string;
  privateAccount: boolean;
  commentPolicy: PolicyOption;
  messagePolicy: PolicyOption;
  mentionPolicy: PolicyOption;
}

interface RestrictedAccount {
  id: string;
  restrictedUserId: string;
  reason: string | null;
  createdAt: string;
}

interface MutedAccount {
  id: string;
  mutedUserId: string;
  mutePosts: boolean;
  muteStories: boolean;
  muteMessages: boolean;
  createdAt: string;
}

interface KeywordFilter {
  id: string;
  keyword: string;
  filterComments: boolean;
  filterMessages: boolean;
  filterPosts: boolean;
  isActive: boolean;
}

const policyOptions: { value: PolicyOption; label: string }[] = [
  { value: "EVERYONE", label: "Everyone" },
  { value: "FOLLOWERS", label: "Followers Only" },
  { value: "NOBODY", label: "Nobody" },
];

export default function PrivacySettingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/me/settings"],
  });

  const { data: restrictedAccounts } = useQuery<RestrictedAccount[]>({
    queryKey: ["/api/privacy/restricted"],
  });

  const { data: mutedAccounts } = useQuery<MutedAccount[]>({
    queryKey: ["/api/privacy/muted"],
  });

  const { data: keywordFilters } = useQuery<KeywordFilter[]>({
    queryKey: ["/api/privacy/keyword-filters"],
  });

  const [privateAccount, setPrivateAccount] = useState(false);
  const [commentPolicy, setCommentPolicy] = useState<PolicyOption>("EVERYONE");
  const [messagePolicy, setMessagePolicy] = useState<PolicyOption>("EVERYONE");
  const [mentionPolicy, setMentionPolicy] = useState<PolicyOption>("EVERYONE");
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (settings) {
      setPrivateAccount(settings.privateAccount);
      setCommentPolicy(settings.commentPolicy);
      setMessagePolicy(settings.messagePolicy);
      setMentionPolicy(settings.mentionPolicy);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      return apiRequest("PATCH", "/api/me/settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/settings"] });
    },
    onError: (error: any, _variables, _context) => {
      if (settings) {
        setPrivateAccount(settings.privateAccount);
        setCommentPolicy(settings.commentPolicy);
        setMessagePolicy(settings.messagePolicy);
        setMentionPolicy(settings.mentionPolicy);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to update settings. Please try again.");
    },
  });

  const unrestrictMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/privacy/restricted/${userId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/privacy/restricted"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to unrestrict account. Please try again.");
    },
  });

  const unmuteMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/privacy/muted/${userId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/privacy/muted"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to unmute account. Please try again.");
    },
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (keyword: string) => {
      return apiRequest("POST", "/api/privacy/keyword-filters", {
        keyword,
        filterComments: true,
        filterMessages: true,
        filterPosts: true,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/privacy/keyword-filters"] });
      setNewKeyword("");
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to add keyword filter. Please try again.");
    },
  });

  const removeKeywordMutation = useMutation({
    mutationFn: async (filterId: string) => {
      return apiRequest("DELETE", `/api/privacy/keyword-filters/${filterId}`);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/privacy/keyword-filters"] });
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to remove keyword filter. Please try again.");
    },
  });

  const handlePrivateToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        "Switch to Private Account",
        "When your account is private:\n\n" +
        "\u2022 Only your followers can see your posts and profile details\n" +
        "\u2022 New follow requests will need your approval\n" +
        "\u2022 People who don't follow you can only see your username and profile picture",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Private",
            onPress: () => {
              setPrivateAccount(true);
              updateMutation.mutate({ privateAccount: true });
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Switch to Public Account",
        "When your account is public:\n\n" +
        "\u2022 Anyone can see your posts and profile\n" +
        "\u2022 Anyone can follow you without approval\n" +
        "\u2022 Your content may appear in search results and recommendations",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Public",
            onPress: () => {
              setPrivateAccount(false);
              updateMutation.mutate({ privateAccount: false });
            },
          },
        ]
      );
    }
  };

  const PolicySelector = ({
    label,
    description,
    value,
    onChange,
  }: {
    label: string;
    description: string;
    value: PolicyOption;
    onChange: (v: PolicyOption) => void;
  }) => (
    <View style={[styles.settingItem, { borderColor: theme.glassBorder }]}>
      <View style={styles.settingHeader}>
        <ThemedText style={styles.settingLabel}>{label}</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <View style={styles.policyOptions}>
        {policyOptions.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.policyOption,
              {
                backgroundColor: value === option.value ? theme.primary : theme.glassBackground,
                borderColor: theme.glassBorder,
              },
            ]}
            onPress={() => {
              onChange(option.value);
              const keyMap: Record<string, string> = {
                "Comments": "commentPolicy",
                "Messages": "messagePolicy",
                "Mentions": "mentionPolicy"
              };
              updateMutation.mutate({ [keyMap[label]]: option.value } as any);
            }}
          >
            <ThemedText
              style={[
                styles.policyOptionText,
                { color: value === option.value ? "#FFFFFF" : theme.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LoadingIndicator fullScreen />
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      contentContainerStyle={{
        paddingTop: Platform.OS === "android" ? Spacing.xl : headerHeight + Spacing.xl,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Account Privacy
        </ThemedText>
        <View
          style={[
            styles.settingRow,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <View style={styles.settingInfo}>
            <ThemedText style={styles.settingLabel}>Private Account</ThemedText>
            <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Only followers can see your posts and profile details
            </ThemedText>
          </View>
          <Switch
            value={privateAccount}
            onValueChange={handlePrivateToggle}
            trackColor={{ false: theme.glassBorder, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Interaction Controls
        </ThemedText>
        <PolicySelector
          label="Comments"
          description="Who can comment on your posts"
          value={commentPolicy}
          onChange={setCommentPolicy}
        />
        <PolicySelector
          label="Messages"
          description="Who can send you direct messages"
          value={messagePolicy}
          onChange={setMessagePolicy}
        />
        <PolicySelector
          label="Mentions"
          description="Who can mention you in posts"
          value={mentionPolicy}
          onChange={setMentionPolicy}
        />
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Keyword Filters
        </ThemedText>
        <View
          style={[
            styles.listContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <ThemedText style={[styles.settingDescription, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
            Hide content containing specific words or phrases
          </ThemedText>
          <View style={styles.addKeywordRow}>
            <TextInput
              style={[
                styles.keywordInput,
                { borderColor: theme.glassBorder, backgroundColor: theme.backgroundRoot, color: theme.text },
              ]}
              value={newKeyword}
              onChangeText={setNewKeyword}
              placeholder="Add keyword..."
              placeholderTextColor={theme.textSecondary}
            />
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                if (newKeyword.trim()) {
                  addKeywordMutation.mutate(newKeyword.trim());
                }
              }}
              disabled={addKeywordMutation.isPending || !newKeyword.trim()}
            >
              {addKeywordMutation.isPending ? (
                <LoadingIndicator size="small" />
              ) : (
                <Feather name="plus" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
          {keywordFilters && keywordFilters.length > 0 ? (
            <View style={styles.keywordList}>
              {keywordFilters.map((filter) => (
                <View key={filter.id} style={[styles.keywordItem, { borderColor: theme.glassBorder }]}>
                  <ThemedText style={styles.keywordText}>{filter.keyword}</ThemedText>
                  <Pressable
                    onPress={() => removeKeywordMutation.mutate(filter.id)}
                  >
                    <Feather name="x" size={18} color={theme.error} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Restricted Accounts ({restrictedAccounts?.length || 0})
        </ThemedText>
        <View
          style={[
            styles.listContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <ThemedText style={[styles.settingDescription, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
            Restricted accounts can only see your public content
          </ThemedText>
          {restrictedAccounts && restrictedAccounts.length > 0 ? (
            restrictedAccounts.map((account) => (
              <View key={account.id} style={[styles.accountItem, { borderColor: theme.glassBorder }]}>
                <View style={styles.accountInfo}>
                  <ThemedText style={styles.accountId}>User ID: {account.restrictedUserId}</ThemedText>
                  {account.reason ? (
                    <ThemedText style={[styles.accountReason, { color: theme.textSecondary }]}>
                      {account.reason}
                    </ThemedText>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Unrestrict Account",
                      "Allow this user to see all your content again?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Unrestrict",
                          onPress: () => unrestrictMutation.mutate(account.restrictedUserId),
                        },
                      ]
                    );
                  }}
                >
                  <ThemedText style={[styles.actionText, { color: theme.primary }]}>Unrestrict</ThemedText>
                </Pressable>
              </View>
            ))
          ) : (
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No restricted accounts
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          Muted Accounts ({mutedAccounts?.length || 0})
        </ThemedText>
        <View
          style={[
            styles.listContainer,
            { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder },
          ]}
        >
          <ThemedText style={[styles.settingDescription, { color: theme.textSecondary, marginBottom: Spacing.md }]}>
            You won't see posts or stories from muted accounts
          </ThemedText>
          {mutedAccounts && mutedAccounts.length > 0 ? (
            mutedAccounts.map((account) => (
              <View key={account.id} style={[styles.accountItem, { borderColor: theme.glassBorder }]}>
                <View style={styles.accountInfo}>
                  <ThemedText style={styles.accountId}>User ID: {account.mutedUserId}</ThemedText>
                  <ThemedText style={[styles.accountReason, { color: theme.textSecondary }]}>
                    Muted: {[
                      account.mutePosts ? "Posts" : null,
                      account.muteStories ? "Stories" : null,
                      account.muteMessages ? "Messages" : null,
                    ].filter(Boolean).join(", ")}
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Unmute Account",
                      "Start seeing content from this user again?",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Unmute",
                          onPress: () => unmuteMutation.mutate(account.mutedUserId),
                        },
                      ]
                    );
                  }}
                >
                  <ThemedText style={[styles.actionText, { color: theme.primary }]}>Unmute</ThemedText>
                </Pressable>
              </View>
            ))
          ) : (
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No muted accounts
            </ThemedText>
          )}
        </View>
      </View>

      {updateMutation.isPending ? (
        <View style={styles.savingIndicator}>
          <LoadingIndicator size="small" />
          <ThemedText style={[styles.savingText, { color: theme.textSecondary }]}>
            Saving...
          </ThemedText>
        </View>
      ) : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: 13,
  },
  settingItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  settingHeader: {
    marginBottom: Spacing.md,
  },
  policyOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  policyOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
  },
  policyOptionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  savingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  savingText: {
    fontSize: 14,
  },
  listContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  addKeywordRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  keywordInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  keywordList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  keywordItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  keywordText: {
    fontSize: 14,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  accountInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  accountId: {
    fontSize: 14,
    fontWeight: "500",
  },
  accountReason: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
});
