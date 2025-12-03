import { z } from "zod";
import { router, publicProcedure } from "../../trpc/init";
import {
  resolveChannelId,
  fetchChannelVideos,
  fetchVideoComments,
} from "./youtube.service";

export const youtubeRouter = router({
  /**
   * Resolve a channel handle/name to a channel ID
   */
  resolveChannel: publicProcedure
    .input(z.object({ identifier: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const channelId = await resolveChannelId(input.identifier);
      return { channelId };
    }),

  /**
   * Fetch videos for a channel with statistics
   */
  getVideos: publicProcedure
    .input(z.object({ channelId: z.string().min(1) }))
    .query(async ({ input }) => {
      const videos = await fetchChannelVideos(input.channelId);
      return { videos };
    }),

  /**
   * Fetch comments for a video
   */
  getComments: publicProcedure
    .input(z.object({ videoId: z.string().min(1) }))
    .query(async ({ input }) => {
      const comments = await fetchVideoComments(input.videoId);
      return { comments };
    }),
});
