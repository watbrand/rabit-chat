import React from "react";
import { View, StyleSheet, Modal, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Avatar } from "@/components/Avatar";
import { ThemedText } from "@/components/ThemedText";
import { useIncomingCall } from "@/contexts/IncomingCallContext";
import { Spacing, BorderRadius, Fonts } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function IncomingCallModal() {
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const pulseScale = useSharedValue(1);
  const buttonGlow = useSharedValue(1);

  useEffect(() => {
    if (incomingCall) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );

      buttonGlow.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    }
  }, [incomingCall, pulseScale, buttonGlow]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 0.3,
  }));

  const acceptButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonGlow.value }],
  }));

  if (!incomingCall) return null;

  return (
    <Modal
      visible={!!incomingCall}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f0f23"]}
        style={styles.container}
      >
        <View style={styles.content}>
          <ThemedText style={styles.incomingLabel}>Incoming Call</ThemedText>

          <View style={styles.avatarContainer}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
            <View style={styles.avatarBorder}>
              <Avatar uri={incomingCall.caller.avatarUrl} size={120} />
            </View>
          </View>

          <ThemedText style={styles.callerName}>
            {incomingCall.caller.displayName}
          </ThemedText>
          <ThemedText style={styles.callerUsername}>
            @{incomingCall.caller.username}
          </ThemedText>

          <ThemedText style={styles.callStatus}>Voice Call</ThemedText>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.declineButton} onPress={declineCall}>
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                style={styles.buttonGradient}
              >
                <Feather name="phone-off" size={28} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={styles.buttonLabel}>Decline</ThemedText>
            </Pressable>

            <Animated.View style={acceptButtonStyle}>
              <Pressable style={styles.acceptButton} onPress={acceptCall}>
                <LinearGradient
                  colors={["#22c55e", "#16a34a"]}
                  style={styles.buttonGradient}
                >
                  <Feather name="phone" size={28} color="#FFFFFF" />
                </LinearGradient>
                <ThemedText style={styles.buttonLabel}>Accept</ThemedText>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  incomingLabel: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: Spacing.xl,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  pulseRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#8B5CF6",
  },
  avatarBorder: {
    padding: 4,
    borderRadius: 64,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  callerName: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  callerUsername: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: Spacing.lg,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  callStatus: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: "#8B5CF6",
    marginBottom: 80,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 60,
  },
  declineButton: {
    alignItems: "center",
  },
  acceptButton: {
    alignItems: "center",
  },
  buttonGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  buttonLabel: {
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: "rgba(255, 255, 255, 0.8)",
  },
});
