import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React client
 * Provides hooks and methods for authentication in React components
 *
 * In development, requests are proxied to the API server via Vite
 * In production, both frontend and API are served from the same origin
 */
const client = createAuthClient({
  baseURL: "",
});

/** Export individual methods for convenience */
export const signIn = client.signIn;
export const signUp = client.signUp;
export const signOut = client.signOut;
export const useSession = client.useSession;
export const getSession = client.getSession;

/** Re-export the full client */
export const authClient = client;
export default client;
