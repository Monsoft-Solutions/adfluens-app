import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, owner, admin, viewer, creator } from "./auth.roles";

/**
 * Better Auth React client
 * Provides hooks and methods for authentication in React components
 */
export const authClient = createAuthClient({
  /** Base URL configured in the app that uses this client */
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [
    organizationClient({
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

/** Export individual methods and hooks for convenience */
export const { signIn, signUp, signOut, useSession, getSession } = authClient;

/** Re-export the full client */
export { authClient as default };
