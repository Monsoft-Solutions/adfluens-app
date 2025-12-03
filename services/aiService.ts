
import { GoogleGenAI } from "@google/genai";
import { YouTubeVideo, YouTubeComment, ViralAnalysisResult } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

export const analyzeVideoContent = async (
  video: YouTubeVideo,
  comments: YouTubeComment[],
  apiKey: string
): Promise<ViralAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey });

  const commentsText = comments
    .slice(0, 20)
    .map((c) => `- "${c.textDisplay}" (Likes: ${c.likeCount})`)
    .join("\n");

  // We explicitly ask the model to use Google Search to "watch" (read about) the video via its URL
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

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        // We use googleSearch to allow the model to access the video page content
        tools: [{ googleSearch: {} }],
        // responseSchema is NOT allowed when using tools, so we parse manually
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    // Extract JSON from potential Markdown blocks
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json/, "").replace(/```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```/, "").replace(/```$/, "");
    }

    let result: ViralAnalysisResult;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Failed to parse JSON directly, attempting cleanup", jsonStr);
      // Fallback: Try to find the first '{' and last '}'
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        result = JSON.parse(jsonStr.substring(start, end + 1));
      } else {
        throw new Error("Invalid JSON format returned by AI");
      }
    }

    // Extract sources from grounding metadata if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri && web.title)
        .map((web: any) => ({ title: web.title, uri: web.uri }));
    }

    return result;
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    throw new Error("Failed to analyze video. Please check your API key or try again.");
  }
};

export const chatWithVideoContext = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  video: YouTubeVideo,
  analysis: ViralAnalysisResult,
  apiKey: string
) => {
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
    model: MODEL_NAME,
    history: history,
    config: {
      systemInstruction: contextSystemInstruction,
      // We can enable search for the chat too if needed, but for now we rely on context.
    },
  });

  const response = await chat.sendMessage({ message: message });
  return response.text;
};
