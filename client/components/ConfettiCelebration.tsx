import React, { useEffect, useCallback } from "react";
import { StyleSheet, View, Dimensions, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import Haptics from "@/lib/safeHaptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#8B5CF6",
  "#A855F7",
  "#C084FC",
  "#FF3B5C",
  "#FFD700",
  "#00D4AA",
  "#00B4FF",
  "#FF6B35",
];

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  rotation: number;
  color: string;
  size: number;
  type: "square" | "circle" | "strip";
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
  pieceCount?: number;
}

function ConfettiPieceComponent({ piece }: { piece: ConfettiPiece }) {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      piece.delay,
      withSpring(1, { damping: 8 })
    );
    
    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 3000 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      })
    );

    translateX.value = withDelay(
      piece.delay,
      withTiming((Math.random() - 0.5) * 200, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      })
    );

    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 720, {
        duration: 3000,
        easing: Easing.linear,
      })
    );

    opacity.value = withDelay(
      piece.delay + 2500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const pieceStyle = {
    width: piece.size,
    height: piece.type === "strip" ? piece.size * 3 : piece.size,
    backgroundColor: piece.color,
    borderRadius: piece.type === "circle" ? piece.size / 2 : piece.type === "strip" ? 2 : 0,
  };

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { left: piece.x },
        pieceStyle,
        animatedStyle,
      ]}
    />
  );
}

export default function ConfettiCelebration({
  isActive,
  onComplete,
  duration = 3500,
  pieceCount = 50,
}: ConfettiCelebrationProps) {
  const [pieces, setPieces] = React.useState<ConfettiPiece[]>([]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      triggerHaptic();
      
      const newPieces: ConfettiPiece[] = [];
      const types: Array<"square" | "circle" | "strip"> = ["square", "circle", "strip"];
      
      for (let i = 0; i < pieceCount; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * SCREEN_WIDTH,
          delay: Math.random() * 500,
          rotation: Math.random() * 360,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          size: 8 + Math.random() * 8,
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
      
      setPieces(newPieces);

      const timeout = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [isActive, pieceCount, duration, onComplete]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPieceComponent key={piece.id} piece={piece} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: "none",
  },
  confettiPiece: {
    position: "absolute",
    top: -20,
  },
});
