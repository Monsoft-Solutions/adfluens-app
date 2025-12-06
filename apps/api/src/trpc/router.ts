import { router } from "./init";
import { youtubeRouter } from "../features/youtube/youtube.router";
import { aiRouter } from "../features/ai/ai.router";
import { organizationRouter } from "../features/organization/organization.router";

export const appRouter = router({
  youtube: youtubeRouter,
  ai: aiRouter,
  organization: organizationRouter,
});

/**
 * Export type router type signature
 * NOT the router itself.
 */
export type AppRouter = typeof appRouter;
