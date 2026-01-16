/**
 * Google OAuth API Utilities
 *
 * Shared OAuth client and utility functions for all Google services.
 * Consolidates OAuth logic that was previously duplicated in GA and GMB modules.
 */

import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

// ============================================================================
// Scope Constants
// ============================================================================

/** Base scopes for user identification */
export const GOOGLE_USERINFO_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
];

/** Google Analytics read-only scope */
export const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

/** Google Business Profile management scope */
export const GMB_SCOPE = "https://www.googleapis.com/auth/business.manage";

/** Google Search Console read-only scope (for future use) */
export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

/** Service to scope mapping */
export const SERVICE_SCOPES: Record<string, string> = {
  ga: GA_SCOPE,
  gmb: GMB_SCOPE,
  gsc: GSC_SCOPE,
};

// ============================================================================
// Types
// ============================================================================

export type GoogleOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
};

export type GoogleUserInfo = {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
};

// ============================================================================
// OAuth2 Client Factory
// ============================================================================

/**
 * Create an OAuth2 client with the given credentials
 */
export function createOAuth2Client(
  clientId: string,
  clientSecret: string,
  redirectUri: string
): OAuth2Client {
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Create an OAuth2 client with existing tokens
 */
export function createOAuth2ClientWithTokens(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  tokens: { access_token: string; refresh_token?: string }
): OAuth2Client {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

// ============================================================================
// OAuth Functions
// ============================================================================

/**
 * Generate the OAuth authorization URL for Google services
 *
 * @param clientId - OAuth client ID
 * @param clientSecret - OAuth client secret
 * @param redirectUri - OAuth redirect URI
 * @param state - State parameter to pass through
 * @param additionalScopes - Additional scopes to request (service-specific)
 * @param existingScopes - Existing scopes to include for incremental auth
 */
export function getGoogleAuthUrl(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  state: string,
  additionalScopes: string[] = [],
  existingScopes: string[] = []
): string {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

  // Combine base scopes with additional service scopes
  const allScopes = [
    ...GOOGLE_USERINFO_SCOPES,
    ...additionalScopes,
    ...existingScopes,
  ];

  // Deduplicate scopes
  const uniqueScopes = [...new Set(allScopes)];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: uniqueScopes,
    prompt: "consent", // Force consent to always get refresh token
    state,
    // Include granted scopes to enable incremental authorization
    include_granted_scopes: true,
  });
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleOAuthTokens> {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error(
      "Failed to exchange authorization code: no access token returned"
    );
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || undefined,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    scope: tokens.scope || undefined,
  };
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<GoogleOAuthTokens> {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, "");
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Failed to refresh access token: no access token returned");
  }

  return {
    accessToken: credentials.access_token,
    // Refresh token is not returned on refresh, keep the old one
    refreshToken: refreshToken,
    expiresAt: credentials.expiry_date
      ? new Date(credentials.expiry_date)
      : undefined,
    scope: credentials.scope || undefined,
  };
}

/**
 * Get the authenticated user's info from Google
 */
export async function fetchUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  return {
    id: userInfo.data.id || "",
    email: userInfo.data.email || undefined,
    name: userInfo.data.name || undefined,
    picture: userInfo.data.picture || undefined,
  };
}

/**
 * Check which scopes have been granted in a scope string
 */
export function parseScopesFromString(scopeString: string): string[] {
  return scopeString.split(" ").filter((s) => s.length > 0);
}

/**
 * Check if a specific scope is granted
 */
export function hasScopeGranted(
  grantedScopes: string | null | undefined,
  requiredScope: string
): boolean {
  if (!grantedScopes) return false;
  const scopes = parseScopesFromString(grantedScopes);
  return scopes.includes(requiredScope);
}

/**
 * Check which services have their required scopes granted
 */
export function getServicesWithGrantedScopes(
  grantedScopes: string | null | undefined
): string[] {
  if (!grantedScopes) return [];

  const services: string[] = [];

  if (hasScopeGranted(grantedScopes, GA_SCOPE)) {
    services.push("ga");
  }

  if (hasScopeGranted(grantedScopes, GMB_SCOPE)) {
    services.push("gmb");
  }

  if (hasScopeGranted(grantedScopes, GSC_SCOPE)) {
    services.push("gsc");
  }

  return services;
}

/**
 * Get the scopes needed for a specific service
 */
export function getScopesForService(service: string): string[] {
  const scopes = [...GOOGLE_USERINFO_SCOPES];

  const serviceScope = SERVICE_SCOPES[service];
  if (serviceScope) {
    scopes.push(serviceScope);
  }

  return scopes;
}

/**
 * Check if all required scopes for a service are granted
 */
export function hasServiceScopesGranted(
  grantedScopes: string | null | undefined,
  service: string
): boolean {
  const serviceScope = SERVICE_SCOPES[service];
  if (!serviceScope) return false;

  return hasScopeGranted(grantedScopes, serviceScope);
}
