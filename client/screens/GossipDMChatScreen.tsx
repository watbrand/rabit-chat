import React, { useState, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { GossipDMChat } from "@/components/gossip/GossipDMChat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

type GossipDMChatRouteParams = {
  GossipDMChat: {
    conversationId: string;
    theirAlias?: string;
  };
};

export default function GossipDMChatScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<GossipDMChatRouteParams, "GossipDMChat">>();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { conversationId, theirAlias } = route.params;
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <View style={styles.headerTitleContent}>
            <Feather name="user" size={16} color={theme.textSecondary} />
            <ThemedText style={styles.headerTitleText} numberOfLines={1}>
              {theirAlias || "Anonymous"}
            </ThemedText>
          </View>
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? "#22C55E" : theme.textTertiary }]} />
            <ThemedText style={[styles.connectionText, { color: isConnected ? "#22C55E" : theme.textTertiary }]}>
              {isConnected ? "Live" : "Offline"}
            </ThemedText>
          </View>
        </View>
      ),
    });
  }, [navigation, theirAlias, theme, isConnected]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.content, { paddingTop: headerHeight, paddingBottom: insets.bottom }]}>
        <GossipDMChat
          conversationId={conversationId}
          theirAlias={theirAlias}
          onConnectionChange={handleConnectionChange}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerTitle: {
    alignItems: "center",
  },
  headerTitleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 11,
  },
});
