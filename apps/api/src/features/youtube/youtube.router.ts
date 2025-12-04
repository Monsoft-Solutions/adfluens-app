import { z } from "zod";
import { videoSearchParamsSchema } from "@repo/types/youtube/video-search-params.type";
import { router, protectedProcedure } from "../../trpc/init";
import {
  resolveChannelId,
  fetchChannelVideos,
  fetchVideoComments,
  searchVideos,
} from "./youtube.service";

export const youtubeRouter = router({
  /**
   * Resolve a channel handle/name to a channel ID
   * Requires authentication
   */
  resolveChannel: protectedProcedure
    .input(z.object({ identifier: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const channelId = await resolveChannelId(input.identifier);
      return { channelId };
    }),

  /**
   * Fetch videos for a channel with statistics
   * Requires authentication
   */
  getVideos: protectedProcedure
    .input(z.object({ channelId: z.string().min(1) }))
    .query(async ({ input }) => {
      const videos = await fetchChannelVideos(input.channelId);
      return { videos };
    }),

  /**
   * Fetch comments for a video
   * Requires authentication
   */
  getComments: protectedProcedure
    .input(z.object({ videoId: z.string().min(1) }))
    .query(async ({ input }) => {
      const comments = await fetchVideoComments(input.videoId);
      return { comments };
    }),

  /**
   * Search videos globally on YouTube with sorting options
   * Requires authentication
   */
  searchVideos: protectedProcedure
    .input(videoSearchParamsSchema)
    .query(async ({ input }) => {
      const videos = await searchVideos(
        input.query,
        input.sortBy,
        input.maxResults
      );
      return { videos };
    }),
});
