import React, { useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { useOnboarding } from "@/hooks/useOnboarding";

const { width, height } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  image: any;
  title: string;
  subtitle: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    image: require("../../assets/images/onboarding/welcome.png"),
    title: "Welcome to RabitChat",
    subtitle: "Where Wealth Meets Influence\n\nThe premier social network for the world's elite. Connect, share, and thrive among those who define success.",
  },
  {
    id: "2",
    image: require("../../assets/images/onboarding/connect.png"),
    title: "Connect with the Elite",
    subtitle: "Your Network is Your Net Worth\n\nDiscover verified high-net-worth individuals, influential creators, and industry leaders from around the globe.",
  },
  {
    id: "3",
    image: require("../../assets/images/onboarding/showcase.png"),
    title: "Showcase Your Success",
    subtitle: "Your Story Deserves to Be Heard\n\nShare moments through photos, videos, voice notes, and reels. Let your achievements inspire millions worldwide.",
  },
  {
    id: "4",
    image: require("../../assets/images/onboarding/inner-circle.png"),
    title: "Join the Inner Circle",
    subtitle: "Exclusive Access Awaits\n\nStep into a global community that celebrates ambition, rewards authenticity, and opens doors to limitless opportunities.",
  },
];

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.image}
            contentFit="contain"
            transition={300}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.title, { color: "#FFFFFF" }]}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: "rgba(255,255,255,0.8)" }]}>
            {item.subtitle}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderPageIndicator = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: isActive ? theme.primary : "rgba(255,255,255,0.3)",
                  width: isActive ? 28 : 8,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f0f1a"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {!isLastSlide ? (
          <Pressable
            style={styles.skipButton}
            onPress={handleSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ThemedText style={[styles.skipText, { color: "rgba(255,255,255,0.7)" }]}>
              Skip
            </ThemedText>
          </Pressable>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        {renderPageIndicator()}

        {isLastSlide ? (
          <Pressable
            style={[styles.getStartedButton, { backgroundColor: theme.primary }]}
            onPress={handleGetStarted}
          >
            <ThemedText style={styles.getStartedText}>Get Started</ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.nextButton, { backgroundColor: theme.primary }]}
            onPress={handleNext}
          >
            <ThemedText style={styles.nextText}>Next</ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.decorCircle1} pointerEvents="none" />
      <View style={[styles.decorCircle2, { backgroundColor: theme.primary }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f1a",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "500",
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 160,
  },
  imageContainer: {
    width: width * 0.65,
    height: width * 0.65,
    marginBottom: 32,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 0,
    width: "100%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
    width: "100%",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    fontWeight: "400",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  getStartedButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  decorCircle1: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
});
