/**
 * Google Business Profile Connection Type
 *
 * Represents a GMB connection for an organization.
 *
 * @module @repo/types/gmb/gmb-connection
 */

import type { GMBLocationData } from "./gmb-location-data.type";

/**
 * GMB connection status
 */
export type GMBConnectionStatus = "active" | "disconnected" | "error";

/**
 * GMB connection data returned to clients
 */
export type GMBConnection = {
  /** Unique identifier */
  id: string;

  /** Organization ID this connection belongs to */
  organizationId: string;

  /** Google Business Profile account ID */
  gmbAccountId: string;

  /** Google Business Profile location ID */
  gmbLocationId: string;

  /** Display name of the location */
  gmbLocationName: string | null;

  /** Cached location data from GMB API */
  locationData: GMBLocationData | null;

  /** Connection status */
  status: GMBConnectionStatus;

  /** When the connection data was last synced */
  lastSyncedAt: Date | null;

  /** Last error message if status is error */
  lastError: string | null;

  /** User ID who connected this account */
  connectedByUserId: string;

  /** When the connection was created */
  createdAt: Date;
};

/**
 * Input for creating/updating a GMB connection
 */
export type GMBConnectionInput = {
  organizationId: string;
  connectedByUserId: string;
  gmbAccountId: string;
  gmbLocationId: string;
  gmbLocationName?: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
  scope?: string;
  locationData?: GMBLocationData;
};
