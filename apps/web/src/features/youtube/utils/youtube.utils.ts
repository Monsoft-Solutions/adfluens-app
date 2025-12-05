import { trpcClient } from "@/lib/trpc";
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";

/**
 * Fetch channel videos imperatively
 * Resolves the channel identifier and fetches videos in sequence
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
