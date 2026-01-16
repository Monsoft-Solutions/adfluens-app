import { router } from "./init";
import { youtubeRouter } from "../features/youtube/youtube.router";
import { aiRouter } from "../features/ai/ai.router";
import { organizationRouter } from "../features/organization/organization.router";
import { socialMediaRouter } from "../features/social-media/social-media.router";
import { gmbRouter } from "../features/gmb/gmb.router";
import { gaRouter } from "../features/ga/ga.router";
import { metaRouter } from "../features/meta/meta.router";
import { metaBotRouter } from "../features/meta-bot/meta-bot.router";
import { contentRouter } from "../features/content/content.router";
import { platformConnectionRouter } from "../features/platform-connection/platform-connection.router";
import { analyticsDashboardRouter } from "../features/analytics-dashboard/analytics-dashboard.router";

export const appRouter = router({
  youtube: youtubeRouter,
  ai: aiRouter,
  organization: organizationRouter,
  socialMedia: socialMediaRouter,
  gmb: gmbRouter,
  ga: gaRouter,
  meta: metaRouter,
  metaBot: metaBotRouter,
  content: contentRouter,
  platformConnection: platformConnectionRouter,
  analyticsDashboard: analyticsDashboardRouter,
});

/**
 * Export type router type signature
 * NOT the router itself.
 */
export type AppRouter = typeof appRouter;
