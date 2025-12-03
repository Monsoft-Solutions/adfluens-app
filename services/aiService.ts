import { GoogleGenAI, Type } from "@google/genai";
import { YouTubeVideo, YouTubeComment, ViralAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const analyzeVideoContent = async (
  video: YouTubeVideo,
  comments: YouTubeComment[]
): Promise<ViralAnalysisResult> => {
  
  const commentsText = comments
    .slice(0, 15)
    .map((c) => `- "${c.textDisplay}" (Likes: ${c.likeCount})`)
    .join("\n");

  const prompt = `
    You are an expert video strategist and viral marketing analyst. Analyze the following YouTube video data to explain why it is successful and how a creator can replicate this success.

    VIDEO METADATA:
    Title: ${video.title}
    Channel: ${video.channelTitle}
    Views: ${video.viewCount}
    Likes: ${video.likeCount}
    Description: ${video.description}

    TOP COMMENTS (Audience Sentiment):
    ${commentsText}

    Your task is to provide:
    1. A concise summary of what the video is likely about based on metadata and comments.
    2. The "Hooks" used (titles, concepts, or emotional triggers identified).
    3. The "Viral Reasons" (psychological triggers, format, trend surfing, or value provided).
    4. 3-5 specific "Content Ideas" that a marketer or creator could produce inspired by this video's success structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are a concise, professional marketing analyst. Output JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            hooks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            viralReasons: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            contentIdeas: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
          },
          required: ["summary", "hooks", "viralReasons", "contentIdeas"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ViralAnalysisResult;
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    throw new Error("Failed to analyze video. Please try again.");
  }
};

export const chatWithVideoContext = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  video: YouTubeVideo,
  analysis: ViralAnalysisResult
) => {
  const contextSystemInstruction = `
    You are a helpful AI assistant discussing a specific YouTube video.
    
    CONTEXT:
    Video Title: ${video.title}
    Channel: ${video.channelTitle}
    Analysis Summary: ${analysis.summary}
    Viral Reasons identified: ${analysis.viralReasons.join(", ")}
    
    Answer the user's questions specifically about this video, marketing strategies, or content creation. Keep answers practical and actionable.
  `;

  const chat = ai.chats.create({
    model: MODEL_NAME,
    history: history,
    config: {
      systemInstruction: contextSystemInstruction,
    },
  });

  const response = await chat.sendMessage({ message: message });
  return response.text;
};