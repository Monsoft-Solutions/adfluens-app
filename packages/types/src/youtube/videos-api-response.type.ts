import { z } from "zod";
import { videoDetailsItemSchema } from "./video-details-item.type";

export const videosApiResponseSchema = z.object({
  items: z.array(videoDetailsItemSchema),
  error: z
    .object({
      message: z.string(),
    })
    .optional(),
});

export type VideosApiResponse = z.infer<typeof videosApiResponseSchema>;

