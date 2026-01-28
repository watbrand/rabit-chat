import { Text, type TextProps, Platform } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography, Fonts } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "largeTitle"
    | "title1"
    | "title2"
    | "title3"
    | "headline"
    | "body"
    | "callout"
    | "subhead"
    | "footnote"
    | "caption1"
    | "caption2"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "small"
    | "caption"
    | "link";
  weight?: "regular" | "medium" | "semiBold" | "bold";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  weight,
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "largeTitle":
        return Typography.largeTitle;
      case "title1":
        return Typography.title1;
      case "title2":
        return Typography.title2;
      case "title3":
        return Typography.title3;
      case "headline":
        return Typography.headline;
      case "callout":
        return Typography.callout;
      case "subhead":
        return Typography.subhead;
      case "footnote":
        return Typography.footnote;
      case "caption1":
        return Typography.caption1;
      case "caption2":
        return Typography.caption2;
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "small":
        return Typography.small;
      case "caption":
        return Typography.caption;
      case "link":
        return Typography.link;
      case "body":
      default:
        return Typography.body;
    }
  };

  const getFontFamily = () => {
    const fonts = Fonts;
    if (!fonts) return undefined;

    if (weight) {
      switch (weight) {
        case "bold":
          return fonts.bold;
        case "semiBold":
          return fonts.semiBold;
        case "medium":
          return fonts.medium;
        case "regular":
        default:
          return fonts.regular;
      }
    }

    const typeStyle = getTypeStyle();
    const fontWeight = String(typeStyle.fontWeight);

    if (fontWeight === "700") {
      return fonts.bold;
    } else if (fontWeight === "600") {
      return fonts.semiBold;
    } else if (fontWeight === "500") {
      return fonts.medium;
    }

    return fonts.regular;
  };

  const fontFamily = getFontFamily();
  const typeStyle = getTypeStyle();

  return (
    <Text
      style={[
        { color: getColor() },
        typeStyle,
        fontFamily ? { fontFamily } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
