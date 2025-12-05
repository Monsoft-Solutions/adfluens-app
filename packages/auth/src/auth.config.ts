import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@repo/db/client";
import { env } from "@repo/env";
import * as authSchema from "./schema/auth.table";
import { ac, owner, admin, viewer, creator } from "./auth.roles";

/**
 * Better Auth server configuration
 * Handles authentication with email/password and social providers
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),

  /** Explicit baseURL where Better Auth API runs */
  baseURL: env.BETTER_AUTH_URL,

  /** Trusted origins for cross-origin requests (frontend) */
  trustedOrigins: [env.APP_URL],

  /** Email and password authentication */
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  /** Social OAuth providers */
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    },
  },

  /** Session configuration */
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  /** Account linking configuration */
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "facebook"],
    },
  },

  /** Organization plugin configuration */
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        viewer,
        creator,
      },
      schema: {
        organization: {
          additionalFields: {
            /** Track who created the organization */
            createdBy: {
              type: "string",
              required: true,
              input: true,
              fieldName: "created_by",
            },
          },
        },
      },
    }),
  ],

  /** Database hooks for custom logic on data operations */
  databaseHooks: {
    user: {
      create: {
        /**
         * Auto-create a personal organization for each new user
         * This ensures every user has a workspace immediately after signup
         *
         * Note: Organization creation failure is non-blocking to prevent
         * user signup failures due to workspace initialization issues
         */
        after: async (user) => {
          try {
            await auth.api.createOrganization({
              body: {
                name: `${user.name}'s Workspace`,
                slug: `${user.id}-workspace`,
                userId: user.id,
                createdBy: user.id,
              } as {
                name: string;
                slug: string;
                userId: string;
                createdBy: string;
              },
            });
          } catch (error) {
            // Log the error but don't block user creation
            // User can create an organization manually later if needed
            console.error(
              `[auth] Failed to create personal organization for user ${user.id}:`,
              error instanceof Error ? error.message : error
            );
          }
        },
      },
    },
  },
});

/** Export auth type for client inference */
export type Auth = typeof auth;

/** Re-export access control and roles for convenience */
export { ac, owner, admin, viewer, creator } from "./auth.roles";
