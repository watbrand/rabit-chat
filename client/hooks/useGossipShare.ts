import { useCallback } from "react";
import { Share, Platform, Alert } from "react-native";

interface GossipPost {
  id: string;
  content: string;
  locationDisplay?: string;
  teaMeter?: number;
  alias?: string;
  aliasEmoji?: string;
  reactions?: {
    fire?: number;
    mindblown?: number;
    laugh?: number;
    skull?: number;
    eyes?: number;
  };
  replyCount?: number;
  createdAt?: string;
}

export function useGossipShare() {
  const formatShareText = useCallback((post: GossipPost) => {
    const teaEmoji = getTeaEmoji(post.teaMeter || 5);
    const locationText = post.locationDisplay || "South Africa";
    const totalReactions = post.reactions 
      ? (post.reactions.fire || 0) + (post.reactions.mindblown || 0) + 
        (post.reactions.laugh || 0) + (post.reactions.skull || 0) + (post.reactions.eyes || 0)
      : 0;

    let shareText = `${teaEmoji} ANONYMOUS TEA from ${locationText}\n\n`;
    shareText += `"${post.content}"\n\n`;
    
    if (totalReactions > 0) {
      shareText += `${totalReactions} people reacted to this tea\n`;
    }
    if (post.replyCount && post.replyCount > 0) {
      shareText += `${post.replyCount} comments\n`;
    }
    
    shareText += `\nSpill your own tea anonymously on RabitChat`;
    
    return shareText;
  }, []);

  const formatShareTextMinimal = useCallback((post: GossipPost) => {
    const locationText = post.locationDisplay || "SA";
    return `Anonymous tea from ${locationText}: "${post.content.substring(0, 100)}${post.content.length > 100 ? "..." : ""}" - RabitChat`;
  }, []);

  const sharePost = useCallback(async (post: GossipPost, format: "full" | "minimal" = "full") => {
    try {
      const shareText = format === "full" ? formatShareText(post) : formatShareTextMinimal(post);
      
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({
            title: "Anonymous Tea from RabitChat",
            text: shareText,
          });
        } else {
          await navigator.clipboard.writeText(shareText);
          Alert.alert("Copied!", "The tea has been copied to your clipboard");
        }
      } else {
        const result = await Share.share({
          message: shareText,
          title: "Anonymous Tea from RabitChat",
        });
        
        return result.action === Share.sharedAction;
      }
      
      return true;
    } catch (error) {
      console.error("Error sharing post:", error);
      return false;
    }
  }, [formatShareText, formatShareTextMinimal]);

  const shareToWhatsApp = useCallback(async (post: GossipPost) => {
    try {
      const shareText = formatShareText(post);
      const encodedText = encodeURIComponent(shareText);
      const whatsappUrl = `whatsapp://send?text=${encodedText}`;
      
      if (Platform.OS === "web") {
        window.open(`https://wa.me/?text=${encodedText}`, "_blank");
        return true;
      }
      
      const { Linking } = await import("react-native");
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return true;
      } else {
        Alert.alert(
          "WhatsApp Not Found",
          "WhatsApp is not installed on your device. Would you like to share using another app?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Share", onPress: () => sharePost(post) },
          ]
        );
        return false;
      }
    } catch (error) {
      console.error("Error sharing to WhatsApp:", error);
      return false;
    }
  }, [formatShareText, sharePost]);

  const copyToClipboard = useCallback(async (post: GossipPost) => {
    try {
      const shareText = formatShareText(post);
      const { Clipboard } = await import("react-native");
      
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(shareText);
      } else {
        const ExpoClipboard = await import("expo-clipboard");
        await ExpoClipboard.setStringAsync(shareText);
      }
      
      Alert.alert("Copied!", "The tea has been copied to your clipboard");
      return true;
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      return false;
    }
  }, [formatShareText]);

  return {
    sharePost,
    shareToWhatsApp,
    copyToClipboard,
    formatShareText,
    formatShareTextMinimal,
  };
}

function getTeaEmoji(teaMeter: number): string {
  if (teaMeter >= 9) return "🔥🍵";
  if (teaMeter >= 7) return "🍵";
  if (teaMeter >= 5) return "☕";
  return "🫖";
}
