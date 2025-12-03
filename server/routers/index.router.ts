import { router } from '../trpc.config.js';
import { youtubeRouter } from './youtube.router.js';
import { aiRouter } from './ai.router.js';

export const appRouter = router({
  youtube: youtubeRouter,
  ai: aiRouter,
});

// Export type router type signature
// NOT the router itself.
export type AppRouter = typeof appRouter;

