import { z } from "zod";
import { router, protectedProcedure } from "../../trpc/init";
import { youtubeVideoSchema } from "@repo/types/youtube/youtube-video.type";
import { youtubeCommentSchema } from "@repo/types/youtube/youtube-comment.type";
import { viralAnalysisResultSchema } from "@repo/types/ai/viral-analysis-result.type";
import { analyzeVideo, chatAboutVideo } from "./ai.service";

const chatHistorySchema = z.array(
  z.object({
    role: z.string(),
    parts: z.array(z.object({ text: z.string() })),
  })
);

export const aiRouter = router({
  /**
   * Analyze a video using Gemini AI
   * Requires authentication
   */
  analyze: protectedProcedure
    .input(
      z.object({
        video: youtubeVideoSchema,
        comments: z.array(youtubeCommentSchema).optional().default([]),
      })
    )
    .mutation(async ({ input }) => {
      const { video, comments } = input;
      return await analyzeVideo(video, comments);
    }),

  /**
   * Chat with AI about a video
   * Requires authentication
   */
  chat: protectedProcedure
    .input(
      z.object({
        history: chatHistorySchema.optional().default([]),
        message: z.string().min(1),
        video: youtubeVideoSchema,
        analysis: viralAnalysisResultSchema,
      })
    )
    .mutation(async ({ input }) => {
      const { history, message, video, analysis } = input;
      const response = await chatAboutVideo(history, message, video, analysis);
      return { response };
    }),
});
