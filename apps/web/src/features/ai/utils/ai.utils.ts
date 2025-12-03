import { trpcClient } from "@/lib/trpc";
import type { YouTubeVideo, YouTubeComment, ViralAnalysisResult } from "@repo/types";

/**
 * Analyze video content imperatively
 */
export const analyzeVideoContent = async (
  video: YouTubeVideo,
  comments: YouTubeComment[]
): Promise<ViralAnalysisResult> => {
  return await trpcClient.ai.analyze.mutate({ video, comments });
};

/**
 * Chat history item for Gemini API
 */
type ChatHistoryItem = {
  role: string;
  parts: { text: string }[];
};

/**
 * Chat with AI about a video imperatively
 */
export const chatWithVideoContext = async (
  history: ChatHistoryItem[],
  message: string,
  video: YouTubeVideo,
  analysis: ViralAnalysisResult
): Promise<string> => {
  const result = await trpcClient.ai.chat.mutate({
    history,
    message,
    video,
    analysis,
  });
  return result.response;
};

