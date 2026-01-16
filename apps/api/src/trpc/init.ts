import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@repo/auth";
import { Logger, updateContext } from "@repo/logger";

/**
 * User type from Better Auth session
 */
type User = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Organization type from Better Auth
 */
type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Session type from Better Auth
 */
type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string | null;
};

/**
 * tRPC context type
 * Contains optional user, session, and organization from Better Auth
 */
export type Context = {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
};

const logger = new Logger({ context: "trpc" });

/**
 * Creates the tRPC context for each request
 * Extracts session from request headers using Better Auth
 */
export const createContext = async ({
  req,
}: CreateExpressContextOptions): Promise<Context> => {
  const headers = fromNodeHeaders(req.headers);

  const sessionData = await auth.api.getSession({
    headers,
  });

  if (!sessionData?.session || !sessionData?.user) {
    return {
      user: null,
      session: null,
      organization: null,
    };
  }

  const session = sessionData.session as Session & {
    activeOrganizationId?: string | null;
  };
  const user = sessionData.user as User;

  // Update logging context with user info
  updateContext({
    userId: user.id,
    organizationId: session.activeOrganizationId ?? undefined,
  });

  // Fetch organization if there's an active organization ID in the session
  let organization: Organization | null = null;
  if (session.activeOrganizationId) {
    try {
      const orgData = await auth.api.getFullOrganization({
        headers,
        query: {
          organizationId: session.activeOrganizationId,
        },
      });
      if (orgData) {
        organization = orgData as unknown as Organization;
      }
    } catch (error) {
      logger.error("Failed to fetch organization", error);
      // Continue without organization
    }
  }

  return {
    user,
    session,
    organization,
  };
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure middleware
 * Throws UNAUTHORIZED error if no valid session exists
 */
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
    },
  });
});

/**
 * Protected procedure - requires authentication
 * Use this for routes that need a logged-in user
 */
export const protectedProcedure = t.procedure.use(isAuthenticated);

/**
 * Organization procedure middleware
 * Requires user to be authenticated and have an active organization
 * Composes with isAuthenticated to avoid duplicating auth checks
 */
const hasOrganization = isAuthenticated.unstable_pipe(async ({ ctx, next }) => {
  if (!ctx.organization) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "No active organization. Please select or create an organization.",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      session: ctx.session,
      organization: ctx.organization,
    },
  });
});

/**
 * Organization procedure - requires authentication and active organization
 * Use this for routes that need organization context
 */
export const organizationProcedure = t.procedure.use(hasOrganization);
