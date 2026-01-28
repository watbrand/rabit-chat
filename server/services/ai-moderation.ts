// AI Content Moderation Service using Gemini
// Uses Replit AI Integrations for Gemini access (no API key required, billed to Replit credits)
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export interface ModerationResult {
  safe: boolean;
  category?: string;
  reason?: string;
  confidence: number;
}

export interface ImageAnalysisResult {
  description: string;
  tags: string[];
  isAppropriate: boolean;
  suggestedCaption?: string;
  detectedObjects: string[];
  mood?: string;
}

export interface ContentSuggestion {
  improvedText: string;
  suggestions: string[];
  tone: string;
  hashtags: string[];
}

/**
 * Moderate text content for policy violations
 */
export async function moderateText(content: string): Promise<ModerationResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a content moderation AI for a luxury social network. Analyze this text for policy violations.

Content to analyze:
"${content}"

Check for:
1. Hate speech or discrimination
2. Harassment or bullying
3. Violent threats
4. Adult/explicit content
5. Spam or scams
6. Personal information exposure (doxxing)
7. Illegal activities

Respond in JSON format:
{
  "safe": true/false,
  "category": "none" or "hate_speech" or "harassment" or "violence" or "adult" or "spam" or "doxxing" or "illegal",
  "reason": "brief explanation if unsafe",
  "confidence": 0.0-1.0
}

Only respond with the JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        safe: result.safe ?? true,
        category: result.category,
        reason: result.reason,
        confidence: result.confidence ?? 0.8,
      };
    }

    return { safe: true, confidence: 0.5 };
  } catch (error) {
    console.error("[AI Moderation] Error moderating text:", error);
    return { safe: true, confidence: 0.3 };
  }
}

/**
 * Analyze an image using Gemini's vision capabilities
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this image for a luxury social network. Provide a detailed analysis.

Image URL: ${imageUrl}

Respond in JSON format:
{
  "description": "detailed description of the image",
  "tags": ["tag1", "tag2", "tag3"],
  "isAppropriate": true/false,
  "suggestedCaption": "a suggested caption for social media",
  "detectedObjects": ["object1", "object2"],
  "mood": "luxurious/professional/casual/artistic/etc"
}

Only respond with the JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        description: result.description || "Image analysis complete",
        tags: result.tags || [],
        isAppropriate: result.isAppropriate ?? true,
        suggestedCaption: result.suggestedCaption,
        detectedObjects: result.detectedObjects || [],
        mood: result.mood,
      };
    }

    return {
      description: "Unable to analyze image",
      tags: [],
      isAppropriate: true,
      detectedObjects: [],
    };
  } catch (error) {
    console.error("[AI Moderation] Error analyzing image:", error);
    return {
      description: "Analysis unavailable",
      tags: [],
      isAppropriate: true,
      detectedObjects: [],
    };
  }
}

/**
 * Generate smart content suggestions for posts
 */
export async function getContentSuggestions(
  content: string,
  context?: { category?: string; audience?: string }
): Promise<ContentSuggestion> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a social media expert for a luxury social network called RabitChat. Help improve this post.

Original content:
"${content}"

${context?.category ? `Post category: ${context.category}` : ""}
${context?.audience ? `Target audience: ${context.audience}` : ""}

Provide suggestions to make this post more engaging while maintaining a premium, sophisticated tone.

Respond in JSON format:
{
  "improvedText": "enhanced version of the post",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "tone": "the detected/recommended tone",
  "hashtags": ["#hashtag1", "#hashtag2"]
}

Only respond with the JSON, no other text.`,
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        improvedText: result.improvedText || content,
        suggestions: result.suggestions || [],
        tone: result.tone || "professional",
        hashtags: result.hashtags || [],
      };
    }

    return {
      improvedText: content,
      suggestions: [],
      tone: "neutral",
      hashtags: [],
    };
  } catch (error) {
    console.error("[AI Moderation] Error getting suggestions:", error);
    return {
      improvedText: content,
      suggestions: [],
      tone: "neutral",
      hashtags: [],
    };
  }
}

/**
 * Transcribe voice/audio content to text using Gemini
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Transcribe the audio from this URL to text. If you cannot access the audio, provide a polite message indicating so.

Audio URL: ${audioUrl}

Provide only the transcribed text, no additional formatting or explanation.`,
            },
          ],
        },
      ],
    });

    return response.text || "Transcription unavailable";
  } catch (error) {
    console.error("[AI Moderation] Error transcribing audio:", error);
    return "Transcription unavailable";
  }
}

/**
 * Generate a summary of multiple posts/content
 */
export async function summarizeContent(contents: string[]): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Summarize the following social media posts into a brief, engaging digest. Keep a luxury/premium tone.

Posts:
${contents.map((c, i) => `${i + 1}. "${c}"`).join("\n")}

Provide a 2-3 sentence summary highlighting the main themes and key points.`,
            },
          ],
        },
      ],
    });

    return response.text || "Summary unavailable";
  } catch (error) {
    console.error("[AI Moderation] Error summarizing content:", error);
    return "Summary unavailable";
  }
}

/**
 * Detect language of content
 */
export async function detectLanguage(content: string): Promise<{ language: string; confidence: number }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Detect the language of this text. Respond with JSON only:
{"language": "language name", "code": "ISO code", "confidence": 0.0-1.0}

Text: "${content}"`,
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        language: result.language || "unknown",
        confidence: result.confidence ?? 0.8,
      };
    }

    return { language: "unknown", confidence: 0.5 };
  } catch (error) {
    console.error("[AI Moderation] Error detecting language:", error);
    return { language: "unknown", confidence: 0.3 };
  }
}
