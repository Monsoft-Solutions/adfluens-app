import { createTRPCContext } from "@trpc/tanstack-react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/routers/index.js";

// Create the tRPC context (provides TRPCProvider, useTRPC, useTRPCClient)
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

// Get the API base URL
// In development, Vite proxies /trpc to the backend server
// In production, both frontend and API are served from the same origin
const getBaseUrl = () => "";

// Create tRPC client
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
    }),
  ],
});
