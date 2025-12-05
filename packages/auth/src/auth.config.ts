import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { db } from "@repo/db/client";
import { env } from "@repo/env";
import * as authSchema from "./schema/auth.table";

/**
 * Access control statement
 * Defines resources and actions for role-based access control
 */
const statement = {
  organization: ["view", "update", "delete", "manage"],
  member: ["view", "invite", "remove", "updateRole"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
} as const;

/**
 * Access control instance
 */
const ac = createAccessControl(statement);

/**
 * Custom roles with specific permissions
 */
const owner = ac.newRole({
  organization: ["update", "delete", "manage"],
  member: ["invite", "remove", "updateRole"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
});

const admin = ac.newRole({
  organization: ["update", "manage"],
  member: ["invite", "remove", "updateRole"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
});

const viewer = ac.newRole({
  organization: ["view"],
  member: ["view"],
  channel: ["view"],
  video: ["view"],
});

const creator = ac.newRole({
  organization: ["view"],
  member: ["view"],
  channel: ["analyze", "view", "manage"],
  video: ["analyze", "view"],
});

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
    }),
  ],
});

/** Export auth type for client inference */
export type Auth = typeof auth;

/** Export access control and roles for client-side usage */
export { ac, owner, admin, viewer, creator };
