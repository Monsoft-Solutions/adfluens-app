import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@repo/auth";

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

/**
 * Creates the tRPC context for each request
 * Extracts session from request headers using Better Auth
 */
export const createContext = async ({
  req,
}: CreateExpressContextOptions): Promise<Context> => {
  const sessionData = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  // Organization data may be included in session response when organization plugin is active
  // Type assertion needed as Better Auth types may vary
  const sessionWithOrg = sessionData as
    | {
        user?: User;
        session?: Session;
        organization?: Organization;
      }
    | null
    | undefined;

  return {
    user: sessionWithOrg?.user as User | null,
    session: sessionWithOrg?.session as Session | null,
    organization: sessionWithOrg?.organization as Organization | null,
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
 */
const hasOrganization = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

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
