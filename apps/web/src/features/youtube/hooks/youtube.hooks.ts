import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc";

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
