import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GossipDMChat } from "@/components/gossip/GossipDMChat";
import { useTheme } from "@/hooks/useTheme";

type GossipDMChatRouteParams = {
  GossipDMChat: {
    conversationId: string;
    theirAlias?: string;
  };
};

export default function GossipDMChatScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<GossipDMChatRouteParams, "GossipDMChat">>();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const { conversationId, theirAlias } = route.params;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.content, { paddingTop: headerHeight, paddingBottom: insets.bottom }]}>
        <GossipDMChat conversationId={conversationId} theirAlias={theirAlias} />
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
});
