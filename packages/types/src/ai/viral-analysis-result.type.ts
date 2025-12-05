import { z } from "zod";

export const viralAnalysisResultSchema = z.object({
  summary: z.string(),
  hooks: z.array(z.string()),
  viralReasons: z.array(z.string()),
  contentIdeas: z.array(z.string()),
  sources: z
    .array(
      z.object({
        title: z.string(),
        uri: z.string(),
      })
    )
    .optional(),
});

export type ViralAnalysisResult = z.infer<typeof viralAnalysisResultSchema>;
