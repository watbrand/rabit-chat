import React from "react";
import { View, StyleSheet } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
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
  const { conversationId, theirAlias } = route.params;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
      <GossipDMChat conversationId={conversationId} theirAlias={theirAlias} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
