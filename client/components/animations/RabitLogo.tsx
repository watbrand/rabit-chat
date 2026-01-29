import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from "react-native-svg";
import { Colors, Gradients } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface RabitLogoProps {
  size?: number;
  color?: string;
  showGlow?: boolean;
  variant?: "full" | "simple" | "minimal";
}

export function RabitLogo({ 
  size = 80, 
  color,
  showGlow = false,
  variant = "full"
}: RabitLogoProps) {
  const { theme, isDark } = useTheme();
  const primaryColor = color || theme.primary;
  const accentColor = Colors.light.gold;
  
  if (variant === "minimal") {
    return (
      <View style={[styles.container, showGlow && styles.glow, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={Gradients.primary[0]} />
              <Stop offset="100%" stopColor={Gradients.primary[1]} />
            </LinearGradient>
          </Defs>
          <Circle cx="50" cy="55" r="30" fill="url(#logoGradient)" />
          <Path
            d="M35 45 Q30 15 40 25 Q45 30 42 45"
            fill="url(#logoGradient)"
            strokeWidth="0"
          />
          <Path
            d="M65 45 Q70 15 60 25 Q55 30 58 45"
            fill="url(#logoGradient)"
            strokeWidth="0"
          />
        </Svg>
      </View>
    );
  }

  if (variant === "simple") {
    return (
      <View style={[styles.container, showGlow && styles.glow, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="logoGradientSimple" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={Gradients.primary[0]} />
              <Stop offset="50%" stopColor={Gradients.primary[1]} />
              <Stop offset="100%" stopColor={accentColor} />
            </LinearGradient>
          </Defs>
          <G>
            <Path
              d="M32 50 Q25 10 38 22 Q44 28 40 50"
              fill="url(#logoGradientSimple)"
            />
            <Path
              d="M68 50 Q75 10 62 22 Q56 28 60 50"
              fill="url(#logoGradientSimple)"
            />
            <Path
              d="M25 55 Q25 35 50 35 Q75 35 75 55 Q75 80 50 85 Q25 80 25 55 Z"
              fill="url(#logoGradientSimple)"
            />
            <Circle cx="38" cy="52" r="5" fill="white" opacity="0.9" />
            <Circle cx="62" cy="52" r="5" fill="white" opacity="0.9" />
            <Circle cx="39" cy="51" r="2.5" fill="#1a1a24" />
            <Circle cx="63" cy="51" r="2.5" fill="#1a1a24" />
            <Path
              d="M45 65 Q50 70 55 65"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </G>
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.container, showGlow && styles.glow, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="logoGradientFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Gradients.primary[0]} />
            <Stop offset="60%" stopColor={Gradients.primary[1]} />
            <Stop offset="100%" stopColor={accentColor} />
          </LinearGradient>
          <LinearGradient id="earGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor={Gradients.primary[0]} />
            <Stop offset="100%" stopColor={Gradients.primary[1]} />
          </LinearGradient>
          <LinearGradient id="innerEarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={Colors.light.pink} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={Colors.light.pink} stopOpacity="0.3" />
          </LinearGradient>
          <LinearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Gradients.gold[0]} />
            <Stop offset="100%" stopColor={Gradients.gold[1]} />
          </LinearGradient>
        </Defs>
        <G>
          <Path
            d="M30 52 Q22 8 36 20 Q44 28 38 52"
            fill="url(#earGradient)"
          />
          <Path
            d="M32 48 Q28 18 37 26 Q42 32 39 48"
            fill="url(#innerEarGradient)"
          />
          <Path
            d="M70 52 Q78 8 64 20 Q56 28 62 52"
            fill="url(#earGradient)"
          />
          <Path
            d="M68 48 Q72 18 63 26 Q58 32 61 48"
            fill="url(#innerEarGradient)"
          />
          <Path
            d="M22 58 Q22 35 50 35 Q78 35 78 58 Q78 85 50 90 Q22 85 22 58 Z"
            fill="url(#logoGradientFull)"
          />
          <Circle cx="37" cy="55" r="7" fill="white" opacity="0.95" />
          <Circle cx="63" cy="55" r="7" fill="white" opacity="0.95" />
          <Circle cx="38" cy="54" r="4" fill="#1a1a24" />
          <Circle cx="64" cy="54" r="4" fill="#1a1a24" />
          <Circle cx="40" cy="52" r="1.5" fill="white" opacity="0.8" />
          <Circle cx="66" cy="52" r="1.5" fill="white" opacity="0.8" />
          <Path
            d={`M${30 - 4},${62} a${4},${3} 0 1,0 ${4 * 2},0 a${4},${3} 0 1,0 -${4 * 2},0`}
            fill={Colors.light.pink}
            opacity={0.4}
          />
          <Path
            d={`M${70 - 4},${62} a${4},${3} 0 1,0 ${4 * 2},0 a${4},${3} 0 1,0 -${4 * 2},0`}
            fill={Colors.light.pink}
            opacity={0.4}
          />
          <Path
            d="M44 70 Q50 76 56 70"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Circle cx="50" cy="66" r="3" fill={Colors.light.pink} opacity="0.6" />
          <Path
            d="M62 30 L68 22 L74 28"
            fill="none"
            stroke="url(#goldAccent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
});

export default RabitLogo;
