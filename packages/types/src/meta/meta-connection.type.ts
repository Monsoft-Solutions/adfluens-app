/**
 * Meta Connection Type
 *
 * Represents a Meta (Facebook/Instagram) OAuth connection for an organization.
 *
 * @module @repo/types/meta/meta-connection
 */

import { z } from "zod";

/**
 * Meta connection status schema
 */
export const metaConnectionStatusSchema = z.enum([
  "active",
  "pending",
  "disconnected",
  "error",
]);

export type MetaConnectionStatus = z.infer<typeof metaConnectionStatusSchema>;

/**
 * Meta connection schema
 */
export const metaConnectionSchema = z.object({
  /** Unique identifier */
  id: z.string(),

  /** Organization ID this connection belongs to */
  organizationId: z.string(),

  /** User ID who connected this account */
  connectedByUserId: z.string(),

  /** Meta user ID */
  metaUserId: z.string(),

  /** Meta user display name */
  metaUserName: z.string().nullable(),

  /** OAuth scopes granted */
  scopes: z.string().nullable(),

  /** Connection status */
  status: metaConnectionStatusSchema,

  /** When the connection was last validated */
  lastValidatedAt: z.date().nullable(),

  /** Last error message if status is error */
  lastError: z.string().nullable(),

  /** When the connection was created */
  createdAt: z.date(),
});

export type MetaConnection = z.infer<typeof metaConnectionSchema>;

/**
 * Input schema for creating a Meta connection
 */
export const metaConnectionInputSchema = z.object({
  organizationId: z.string(),
  connectedByUserId: z.string(),
  metaUserId: z.string(),
  metaUserName: z.string().optional(),
  accessToken: z.string(),
  accessTokenExpiresAt: z.coerce.date().optional(),
  scopes: z.string().optional(),
});

export type MetaConnectionInput = z.infer<typeof metaConnectionInputSchema>;

/**
 * OAuth tokens returned from Meta
 */
export const metaOAuthTokensSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string().optional(),
  expiresIn: z.number().optional(),
  expiresAt: z.coerce.date().optional(),
});

export type MetaOAuthTokens = z.infer<typeof metaOAuthTokensSchema>;
