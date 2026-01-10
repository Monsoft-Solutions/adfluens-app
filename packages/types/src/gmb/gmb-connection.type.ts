/**
 * Google Business Profile Connection Type
 *
 * Represents a GMB connection for an organization.
 *
 * @module @repo/types/gmb/gmb-connection
 */

import { z } from "zod";
import { gmbLocationDataSchema } from "./gmb-location-data.type";

/**
 * GMB connection status schema
 */
export const gmbConnectionStatusSchema = z.enum([
  "active",
  "disconnected",
  "error",
]);

export type GMBConnectionStatus = z.infer<typeof gmbConnectionStatusSchema>;

/**
 * GMB connection schema
 */
export const gmbConnectionSchema = z.object({
  /** Unique identifier */
  id: z.string(),

  /** Organization ID this connection belongs to */
  organizationId: z.string(),

  /** Google Business Profile account ID */
  gmbAccountId: z.string(),

  /** Google Business Profile location ID */
  gmbLocationId: z.string(),

  /** Display name of the location */
  gmbLocationName: z.string().nullable(),

  /** Cached location data from GMB API */
  locationData: gmbLocationDataSchema.nullable(),

  /** Connection status */
  status: gmbConnectionStatusSchema,

  /** When the connection data was last synced */
  lastSyncedAt: z.date().nullable(),

  /** Last error message if status is error */
  lastError: z.string().nullable(),

  /** User ID who connected this account */
  connectedByUserId: z.string(),

  /** When the connection was created */
  createdAt: z.date(),
});

export type GMBConnection = z.infer<typeof gmbConnectionSchema>;

/**
 * Input schema for creating/updating a GMB connection
 */
export const gmbConnectionInputSchema = z.object({
  organizationId: z.string(),
  connectedByUserId: z.string(),
  gmbAccountId: z.string(),
  gmbLocationId: z.string(),
  gmbLocationName: z.string().optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  accessTokenExpiresAt: z.coerce.date().optional(),
  scope: z.string().optional(),
  locationData: gmbLocationDataSchema.optional(),
});

export type GMBConnectionInput = z.infer<typeof gmbConnectionInputSchema>;
