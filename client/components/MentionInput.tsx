import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  TextInputProps,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius } from "@/constants/theme";

interface MentionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface MentionInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  inputRef?: React.RefObject<TextInput>;
}

export function MentionInput({
  value,
  onChangeText,
  inputRef,
  style,
  ...props
}: MentionInputProps) {
  const { theme } = useTheme();
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const localInputRef = useRef<TextInput>(null);
  const ref = inputRef || localInputRef;

  const { data: suggestions, isLoading: suggestionsLoading } = useQuery<MentionUser[]>({
    queryKey: ["/api/users/search", mentionSearch],
    queryFn: async () => {
      if (!mentionSearch || mentionSearch.length < 1) return [];
      const url = new URL("/api/users/search", getApiUrl());
      url.searchParams.set("q", mentionSearch);
      url.searchParams.set("limit", "5");
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: mentionSearch !== null && mentionSearch.length >= 1,
  });

  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);

    const textBeforeCursor = text.slice(0, cursorPosition + (text.length - value.length));
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const hasSpaceAfterAt = textAfterAt.includes(" ");
      
      if (!hasSpaceAfterAt && textAfterAt.length <= 20) {
        setMentionSearch(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        return;
      }
    }

    setMentionSearch(null);
    setMentionStartIndex(-1);
  }, [onChangeText, cursorPosition, value.length]);

  const handleSelectionChange = useCallback((event: { nativeEvent: { selection: { start: number; end: number } } }) => {
    setCursorPosition(event.nativeEvent.selection.start);
  }, []);

  const handleSelectUser = useCallback((user: MentionUser) => {
    if (mentionStartIndex === -1) return;

    const beforeMention = value.slice(0, mentionStartIndex);
    const afterSearch = value.slice(mentionStartIndex + 1 + (mentionSearch?.length || 0));
    const newText = `${beforeMention}@${user.username} ${afterSearch}`;
    
    onChangeText(newText);
    setMentionSearch(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      const newPosition = beforeMention.length + user.username.length + 2;
      ref.current?.setNativeProps({ selection: { start: newPosition, end: newPosition } });
    }, 50);
  }, [value, mentionStartIndex, mentionSearch, onChangeText, ref]);

  const showSuggestions = mentionSearch !== null && (suggestionsLoading || (suggestions && suggestions.length > 0));

  return (
    <View style={styles.container}>
      {showSuggestions ? (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.backgroundElevated, borderColor: theme.glassBorder }]}>
          {suggestionsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="always"
              style={styles.suggestionsList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.suggestionItem,
                    { backgroundColor: pressed ? theme.glassBorder : "transparent" },
                  ]}
                  onPress={() => handleSelectUser(item)}
                >
                  <Avatar uri={item.avatarUrl} size={32} />
                  <View style={styles.suggestionInfo}>
                    <ThemedText style={styles.suggestionName} numberOfLines={1}>
                      {item.displayName}
                    </ThemedText>
                    <ThemedText style={[styles.suggestionUsername, { color: theme.textSecondary }]} numberOfLines={1}>
                      @{item.username}
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      ) : null}
      
      <TextInput
        ref={ref}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        style={style}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  suggestionsContainer: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    overflow: "hidden",
  },
  suggestionsList: {
    maxHeight: 200,
  },
  loadingContainer: {
    padding: Spacing.md,
    alignItems: "center",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionUsername: {
    fontSize: 12,
  },
});
