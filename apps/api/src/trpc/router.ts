import { router } from "./init";
import { youtubeRouter } from "../features/youtube/youtube.router";
import { aiRouter } from "../features/ai/ai.router";
import { organizationRouter } from "../features/organization/organization.router";
import { socialMediaRouter } from "../features/social-media/social-media.router";
import { gmbRouter } from "../features/gmb/gmb.router";
import { metaRouter } from "../features/meta/meta.router";

export const appRouter = router({
  youtube: youtubeRouter,
  ai: aiRouter,
  organization: organizationRouter,
  socialMedia: socialMediaRouter,
  gmb: gmbRouter,
  meta: metaRouter,
});

/**
 * Export type router type signature
 * NOT the router itself.
 */
export type AppRouter = typeof appRouter;
