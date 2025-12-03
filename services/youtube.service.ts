import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC, trpcClient } from "../lib/trpc.client";
import { YouTubeVideo } from "../types/youtube/youtube-video.type";
import { YouTubeComment } from "../types/youtube/youtube-comment.type";

// ==================== tRPC Hooks ====================
// These hooks can be used directly in React components

/**
 * Hook to resolve channel identifier
 * Usage: const mutation = useResolveChannel();
 *        mutation.mutate({ identifier: "channelHandle" });
 */
export const useResolveChannel = () => {
  const trpc = useTRPC();
  return useMutation(trpc.youtube.resolveChannel.mutationOptions());
};

/**
 * Hook to fetch videos for a channel (query)
 * Usage: const { data } = useChannelVideos(channelId);
 */
export const useChannelVideos = (channelId: string | null) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.youtube.getVideos.queryOptions({ channelId: channelId! }),
    enabled: !!channelId,
  });
};

/**
 * Hook to fetch comments for a video (query)
 * Usage: const { data } = useVideoComments(videoId);
 */
export const useVideoComments = (videoId: string | null) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.youtube.getComments.queryOptions({ videoId: videoId! }),
    enabled: !!videoId,
  });
};

// ==================== Imperative Functions ====================
// These functions can be called imperatively (outside React hooks)
// Useful for event handlers where you need async/await

/**
 * Fetch channel videos imperatively (for use in event handlers)
 */
export const fetchChannelVideos = async (
  channelIdentifier: string
): Promise<YouTubeVideo[]> => {
  if (!channelIdentifier) {
    throw new Error("Channel ID/Handle is required.");
  }

  // Step 1: Resolve the channel identifier to a channel ID
  const { channelId } = await trpcClient.youtube.resolveChannel.mutate({
    identifier: channelIdentifier,
  });

  // Step 2: Fetch videos for the channel
  const { videos } = await trpcClient.youtube.getVideos.query({ channelId });

  return videos;
};

/**
 * Fetch video comments imperatively (for use in event handlers)
 */
export const fetchVideoComments = async (
  videoId: string
): Promise<YouTubeComment[]> => {
  const { comments } = await trpcClient.youtube.getComments.query({ videoId });
  return comments;
};

