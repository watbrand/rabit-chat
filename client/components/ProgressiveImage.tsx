import React, { useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Image } from "expo-image";

interface ProgressiveImageProps {
  source: { uri: string };
  thumbnailSource?: { uri: string };
  style?: ViewStyle;
  contentFit?: "cover" | "contain" | "fill";
  transition?: number;
}

export default function ProgressiveImage({
  source,
  thumbnailSource,
  style,
  contentFit = "cover",
  transition = 300,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbnailOpacity = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const blurAmount = useSharedValue(20);

  const handleLoad = () => {
    setIsLoaded(true);
    imageOpacity.value = withTiming(1, { duration: transition, easing: Easing.ease });
    thumbnailOpacity.value = withTiming(0, { duration: transition, easing: Easing.ease });
    blurAmount.value = withTiming(0, { duration: transition, easing: Easing.ease });
  };

  const thumbnailStyle = useAnimatedStyle(() => ({
    opacity: thumbnailOpacity.value,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  return (
    <View style={[styles.container, style]}>
      {thumbnailSource ? (
        <Animated.View style={[styles.imageWrapper, thumbnailStyle]}>
          <Image
            source={thumbnailSource}
            style={styles.image}
            contentFit={contentFit}
            blurRadius={20}
          />
        </Animated.View>
      ) : null}
      <Animated.View style={[styles.imageWrapper, imageStyle]}>
        <Image
          source={source}
          style={styles.image}
          contentFit={contentFit}
          onLoad={handleLoad}
          transition={transition}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  imageWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
