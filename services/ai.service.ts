import { useMutation } from "@tanstack/react-query";
import { useTRPC, trpcClient } from "../lib/trpc.client";
import { YouTubeVideo } from "../types/youtube/youtube-video.type";
import { YouTubeComment } from "../types/youtube/youtube-comment.type";
import { ViralAnalysisResult } from "../types/ai/viral-analysis-result.type";

// ==================== tRPC Hooks ====================
// These hooks can be used directly in React components

/**
 * Hook to analyze a video using AI
 * Usage: const mutation = useAnalyzeVideo();
 *        mutation.mutate({ video, comments });
 */
export const useAnalyzeVideo = () => {
  const trpc = useTRPC();
  return useMutation(trpc.ai.analyze.mutationOptions());
};

/**
 * Hook to chat with AI about a video
 * Usage: const mutation = useChatWithVideo();
 *        mutation.mutate({ history, message, video, analysis });
 */
export const useChatWithVideo = () => {
  const trpc = useTRPC();
  return useMutation(trpc.ai.chat.mutationOptions());
};

// ==================== Imperative Functions ====================
// These functions can be called imperatively (outside React hooks)
// Useful for event handlers where you need async/await

/**
 * Analyze video content imperatively (for use in event handlers)
 */
export const analyzeVideoContent = async (
  video: YouTubeVideo,
  comments: YouTubeComment[]
): Promise<ViralAnalysisResult> => {
  return await trpcClient.ai.analyze.mutate({ video, comments });
};

/**
 * Chat with AI about a video imperatively (for use in event handlers)
 */
export const chatWithVideoContext = async (
  history: { role: string; parts: { text: string }[] }[],
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

