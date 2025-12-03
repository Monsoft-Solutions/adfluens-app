import { z } from "zod";
import { router, publicProcedure } from "../../trpc/init";
import { youtubeVideoSchema, youtubeCommentSchema, viralAnalysisResultSchema } from "@repo/types";
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
   */
  analyze: publicProcedure
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
   */
  chat: publicProcedure
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

