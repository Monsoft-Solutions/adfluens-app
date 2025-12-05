import { z } from "zod";

export const commentsApiResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      snippet: z.object({
        topLevelComment: z.object({
          snippet: z.object({
            authorDisplayName: z.string(),
            authorProfileImageUrl: z.string(),
            textDisplay: z.string(),
            likeCount: z.coerce.number(),
            publishedAt: z.string(),
          }),
        }),
      }),
    })
  ),
  error: z
    .object({
      message: z.string(),
    })
    .optional(),
});

export type CommentsApiResponse = z.infer<typeof commentsApiResponseSchema>;
