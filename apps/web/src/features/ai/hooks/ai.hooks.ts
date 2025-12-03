import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

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
