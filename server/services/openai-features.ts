import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface CaptionResult {
  caption: string;
  hashtags: string[];
  tone: string;
}

export interface TranscriptionResult {
  text: string;
  duration?: number;
  language?: string;
}

export interface PostEnhancement {
  original: string;
  enhanced: string;
  suggestions: string[];
  readabilityScore: number;
}

export interface AIAssistantResponse {
  response: string;
  suggestions?: string[];
}

export async function generateSmartCaption(
  imageDescription: string,
  context?: { mood?: string; style?: string; audience?: string }
): Promise<CaptionResult> {
  try {
    const styleGuide = context?.style || "luxury, sophisticated";
    const moodGuide = context?.mood || "aspirational";
    const audienceGuide = context?.audience || "high-net-worth individuals and influencers";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a social media expert for RabitChat, a Forbes-style luxury social network. Generate captivating captions that resonate with ${audienceGuide}. Style: ${styleGuide}. Mood: ${moodGuide}.`,
        },
        {
          role: "user",
          content: `Generate an engaging caption for this image/content: "${imageDescription}"

Respond in JSON format only:
{
  "caption": "the engaging caption (2-3 sentences max)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "tone": "detected tone of the caption"
}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    const text = response.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        caption: result.caption || "",
        hashtags: result.hashtags || [],
        tone: result.tone || "luxury",
      };
    }

    return {
      caption: "Living the extraordinary life.",
      hashtags: ["#luxury", "#lifestyle", "#elite"],
      tone: "aspirational",
    };
  } catch (error) {
    console.error("[OpenAI] Caption generation error:", error);
    return {
      caption: "",
      hashtags: [],
      tone: "neutral",
    };
  }
}

export async function transcribeVoiceMessage(audioUrl: string): Promise<TranscriptionResult> {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    return {
      text: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
    };
  } catch (error) {
    console.error("[OpenAI] Transcription error:", error);
    return {
      text: "Transcription unavailable",
    };
  }
}

export async function enhancePost(
  content: string,
  options?: { targetTone?: string; maxLength?: number }
): Promise<PostEnhancement> {
  try {
    const targetTone = options?.targetTone || "sophisticated and engaging";
    const maxLength = options?.maxLength || 500;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a premium content editor for RabitChat, a Forbes-style luxury social network. Enhance posts to be more ${targetTone} while maintaining authenticity. Max length: ${maxLength} characters.`,
        },
        {
          role: "user",
          content: `Enhance this post while keeping the core message:

"${content}"

Respond in JSON format only:
{
  "enhanced": "the improved version",
  "suggestions": ["improvement 1", "improvement 2", "improvement 3"],
  "readabilityScore": 0-100
}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        original: content,
        enhanced: result.enhanced || content,
        suggestions: result.suggestions || [],
        readabilityScore: result.readabilityScore ?? 75,
      };
    }

    return {
      original: content,
      enhanced: content,
      suggestions: [],
      readabilityScore: 70,
    };
  } catch (error) {
    console.error("[OpenAI] Post enhancement error:", error);
    return {
      original: content,
      enhanced: content,
      suggestions: [],
      readabilityScore: 50,
    };
  }
}

export async function getAIAssistance(
  query: string,
  context?: { topic?: string; previousMessages?: string[] }
): Promise<AIAssistantResponse> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are RabitChat's AI assistant, helping users create compelling content for a Forbes-style luxury social network. Be helpful, concise, and maintain a sophisticated tone. Focus on: content creation, caption ideas, engagement strategies, and personal branding tips.${context?.topic ? ` Current topic: ${context.topic}` : ""}`,
      },
    ];

    if (context?.previousMessages) {
      for (const msg of context.previousMessages.slice(-6)) {
        messages.push({ role: "user", content: msg });
      }
    }

    messages.push({ role: "user", content: query });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseText = response.choices[0]?.message?.content || "";

    return {
      response: responseText,
      suggestions: extractSuggestions(responseText),
    };
  } catch (error) {
    console.error("[OpenAI] AI assistance error:", error);
    return {
      response: "I'm having trouble processing your request right now. Please try again.",
    };
  }
}

function extractSuggestions(text: string): string[] {
  const lines = text.split("\n").filter((line) => line.trim().startsWith("-") || line.trim().match(/^\d+\./));
  return lines.slice(0, 5).map((line) => line.replace(/^[-\d.]+\s*/, "").trim());
}

export async function generateImageCaption(imageUrl: string): Promise<CaptionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a luxury social media content expert. Analyze images and generate captivating captions for a high-end social network.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and generate an engaging caption for RabitChat, a Forbes-style luxury social network.

Respond in JSON format only:
{
  "caption": "the engaging caption (2-3 sentences max)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "tone": "detected tone"
}`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const text = response.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        caption: result.caption || "",
        hashtags: result.hashtags || [],
        tone: result.tone || "luxury",
      };
    }

    return {
      caption: "Capturing life's finest moments.",
      hashtags: ["#luxury", "#lifestyle"],
      tone: "aspirational",
    };
  } catch (error) {
    console.error("[OpenAI] Image caption error:", error);
    return {
      caption: "",
      hashtags: [],
      tone: "neutral",
    };
  }
}

export async function generateVoicePostSummary(transcription: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Create a brief, engaging text summary of voice content for a luxury social network. Keep it under 100 words.",
        },
        {
          role: "user",
          content: `Summarize this voice message transcription for display: "${transcription}"`,
        },
      ],
      max_tokens: 150,
    });

    return response.choices[0]?.message?.content || transcription.slice(0, 200);
  } catch (error) {
    console.error("[OpenAI] Voice summary error:", error);
    return transcription.slice(0, 200);
  }
}
