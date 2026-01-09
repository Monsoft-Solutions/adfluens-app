import { createTRPCContext } from "@trpc/tanstack-react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@repo/api/router";

/**
 * Get the API base URL
 * In development, Vite proxies /trpc to the backend server
 * In production, both frontend and API are served from the same origin
 */
const getBaseUrl = () => "";

/**
 * tRPC React context and hooks
 * Provides TRPCProvider, useTRPC, useTRPCClient
 */
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

/**
 * Vanilla tRPC client for imperative calls
 * Use this in event handlers or outside React components
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
    }),
  ],
});
