import { router } from '../trpc.js';
import { youtubeRouter } from './youtube.js';
import { aiRouter } from './ai.js';

export const appRouter = router({
  youtube: youtubeRouter,
  ai: aiRouter,
});

// Export type router type signature
// NOT the router itself.
export type AppRouter = typeof appRouter;

