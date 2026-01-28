import React from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useTheme } from "@/hooks/useTheme";

interface MentionTextProps {
  text: string;
  style?: TextStyle;
  mentionStyle?: TextStyle;
}

export function MentionText({ text, style, mentionStyle }: MentionTextProps) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const handleMentionPress = (username: string) => {
    navigation.navigate("UserProfile", { username });
  };

  const renderTextWithMentions = () => {
    const mentionRegex = /@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={style}>
            {text.slice(lastIndex, match.index)}
          </Text>
        );
      }

      const username = match[1];
      parts.push(
        <Text
          key={`mention-${match.index}`}
          style={[
            styles.mention,
            { color: theme.primary },
            mentionStyle,
          ]}
          onPress={() => handleMentionPress(username)}
        >
          @{username}
        </Text>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={style}>
          {text.slice(lastIndex)}
        </Text>
      );
    }

    return parts;
  };

  return (
    <Text style={style}>
      {renderTextWithMentions()}
    </Text>
  );
}

const styles = StyleSheet.create({
  mention: {
    fontWeight: "600",
  },
});
