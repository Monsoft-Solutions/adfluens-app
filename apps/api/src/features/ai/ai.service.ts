import { GoogleGenAI } from "@google/genai";
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import type { YouTubeComment } from "@repo/types/youtube/youtube-comment.type";
import type { ViralAnalysisResult } from "@repo/types/ai/viral-analysis-result.type";

const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Get Gemini API key from environment
 */
const getGeminiApiKey = () => process.env.GEMINI_API_KEY || "";

/**
 * Analyze a video using Gemini AI with Google Search grounding
 */
export const analyzeVideo = async (
  video: YouTubeVideo,
  comments: YouTubeComment[]
): Promise<ViralAnalysisResult> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key not configured on server");
  }

  const ai = new GoogleGenAI({ apiKey });

  const commentsText = comments
    .slice(0, 20)
    .map((c) => `- "${c.textDisplay}" (Likes: ${c.likeCount})`)
    .join("\n");

  const prompt = `
    You are an expert video strategist. 
    Please analyze this YouTube video by using Google Search to find its content, transcript, or summary information using the provided URL.
    
    Video URL: https://www.youtube.com/watch?v=${video.id}
    
    Context Data:
    Title: ${video.title}
    Channel: ${video.channelTitle}
    Description: ${video.description}
    
    Audience Sentiment (Comments):
    ${commentsText}

    Task:
    1. Summarize the video content.
    2. Identify the "Hooks" (why people clicked).
    3. Explain the "Viral Reasons" (why people shared/watched).
    4. Provide 3-5 "Content Ideas" inspired by this video.

    OUTPUT FORMAT:
    You must return a strictly valid JSON object. Do not include markdown formatting (like \`\`\`json).
    The JSON structure must be:
    {
      "summary": "string",
      "hooks": ["string", "string"],
      "viralReasons": ["string", "string"],
      "contentIdeas": ["string", "string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  // Parse JSON from response
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
  }

  let result: ViralAnalysisResult;
  try {
    result = JSON.parse(jsonStr);
  } catch {
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      result = JSON.parse(jsonStr.substring(start, end + 1));
    } else {
      throw new Error("Invalid JSON format returned by AI");
    }
  }

  // Extract sources from grounding metadata
  const groundingChunks =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    result.sources = groundingChunks
      .map((chunk: { web?: { uri?: string; title?: string } }) => chunk.web)
      .filter(
        (
          web: { uri?: string; title?: string } | undefined
        ): web is { uri: string; title: string } =>
          web !== undefined && !!web.uri && !!web.title
      )
      .map((web: { title: string; uri: string }) => ({
        title: web.title,
        uri: web.uri,
      }));
  }

  return result;
};

/**
 * Chat history item for Gemini API
 */
type ChatHistoryItem = {
  role: string;
  parts: { text: string }[];
};

/**
 * Chat with AI about a video
 */
export const chatAboutVideo = async (
  history: ChatHistoryItem[],
  message: string,
  video: YouTubeVideo,
  analysis: ViralAnalysisResult
): Promise<string> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Gemini API key not configured on server");
  }

  const ai = new GoogleGenAI({ apiKey });

  const contextSystemInstruction = `
    You are a helpful AI assistant discussing a specific YouTube video.
    
    CONTEXT:
    Video URL: https://www.youtube.com/watch?v=${video.id}
    Video Title: ${video.title}
    Channel: ${video.channelTitle}
    Analysis Summary: ${analysis.summary}
    Viral Reasons: ${analysis.viralReasons.join(", ")}
    
    Answer the user's questions specifically about this video, marketing strategies, or content creation. Keep answers practical and actionable.
  `;

  const chat = ai.chats.create({
    model: GEMINI_MODEL,
    history: history,
    config: {
      systemInstruction: contextSystemInstruction,
    },
  });

  const response = await chat.sendMessage({ message });
  const responseText = response.text ?? "";

  return responseText;
};
