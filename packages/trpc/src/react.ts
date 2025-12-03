import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AnyRouter } from "@trpc/server";

/**
 * Creates React-specific tRPC context and hooks
 * @template TRouter - The tRPC router type from the API
 * @returns TRPCProvider, useTRPC, useTRPCClient hooks
 */
export function createTRPCReact<TRouter extends AnyRouter>() {
  return createTRPCContext<TRouter>();
}

