import { router } from "./init";
import { youtubeRouter } from "../features/youtube/youtube.router";
import { aiRouter } from "../features/ai/ai.router";
import { organizationRouter } from "../features/organization/organization.router";
import { socialMediaRouter } from "../features/social-media/social-media.router";
import { gmbRouter } from "../features/gmb/gmb.router";
import { metaRouter } from "../features/meta/meta.router";
import { metaBotRouter } from "../features/meta-bot/meta-bot.router";
import { contentRouter } from "../features/content/content.router";

export const appRouter = router({
  youtube: youtubeRouter,
  ai: aiRouter,
  organization: organizationRouter,
  socialMedia: socialMediaRouter,
  gmb: gmbRouter,
  meta: metaRouter,
  metaBot: metaBotRouter,
  content: contentRouter,
});

/**
 * Export type router type signature
 * NOT the router itself.
 */
export type AppRouter = typeof appRouter;
