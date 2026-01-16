/**
 * Google Analytics 4 API Utilities
 *
 * Low-level API client for interacting with Google Analytics APIs.
 * Uses the official googleapis package for OAuth and GA4 Data/Admin API calls.
 */

import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

// Required scope for GA4 API access (read-only)
export const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

// Scopes for fetching user info (email and profile)
export const GA_USERINFO_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

// ============================================================================
// Types
// ============================================================================

export type GAOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string;
};

export type GA4Property = {
  name: string; // e.g., "properties/123456789"
  displayName: string;
  industryCategory?: string;
  timeZone?: string;
  currencyCode?: string;
  createTime?: string;
  serviceLevel?: string;
  account?: string; // e.g., "accounts/123456789"
};

export type GA4DailyMetric = {
  date: string; // YYYY-MM-DD
  sessions: number;
  users: number;
  newUsers: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
};

export type GA4TrafficData = {
  metrics: GA4DailyMetric[];
  totals: {
    totalSessions: number;
    totalUsers: number;
    totalNewUsers: number;
    totalPageviews: number;
    avgBounceRate: number;
    avgSessionDuration: number;
  };
  trends: {
    sessionsTrend: number;
    usersTrend: number;
    pageviewsTrend: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
};

export type GAUserInfo = {
  id: string;
  email?: string;
  name?: string;
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
 * Generate the OAuth authorization URL for Google Analytics
 */
export function getGAAuthUrl(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  state: string
): string {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [GA_SCOPE, ...GA_USERINFO_SCOPES],
    prompt: "consent", // Force consent to always get refresh token
    state,
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
): Promise<GAOAuthTokens> {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, redirectUri);

  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token || "",
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
): Promise<GAOAuthTokens> {
  const oauth2Client = createOAuth2Client(clientId, clientSecret, "");
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token || "",
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
export async function fetchUserInfo(accessToken: string): Promise<GAUserInfo> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  return {
    id: userInfo.data.id || "",
    email: userInfo.data.email || undefined,
    name: userInfo.data.name || undefined,
  };
}

// ============================================================================
// Property Discovery (GA4 Admin API)
// ============================================================================

/**
 * List GA4 properties the user has access to
 */
export async function fetchGA4Properties(
  accessToken: string
): Promise<GA4Property[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const analyticsAdmin = google.analyticsadmin({
    version: "v1beta",
    auth: oauth2Client,
  });

  // First, get all accounts
  const accountsResponse = await analyticsAdmin.accounts.list();
  const accounts = accountsResponse.data.accounts || [];

  // For each account, get its properties
  const allProperties: GA4Property[] = [];

  for (const account of accounts) {
    if (!account.name) continue;

    try {
      const propertiesResponse = await analyticsAdmin.properties.list({
        filter: `parent:${account.name}`,
      });

      const properties = propertiesResponse.data.properties || [];

      for (const property of properties) {
        allProperties.push({
          name: property.name || "",
          displayName: property.displayName || "",
          industryCategory: property.industryCategory || undefined,
          timeZone: property.timeZone || undefined,
          currencyCode: property.currencyCode || undefined,
          createTime: property.createTime || undefined,
          serviceLevel: property.serviceLevel || undefined,
          account: property.account || undefined,
        });
      }
    } catch (error) {
      // Log but continue with other accounts
      console.error(
        `[GA API] Error fetching properties for account ${account.name}:`,
        error
      );
    }
  }

  return allProperties;
}

/**
 * Get a single GA4 property by ID
 */
export async function fetchGA4Property(
  accessToken: string,
  propertyId: string
): Promise<GA4Property | null> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const analyticsAdmin = google.analyticsadmin({
    version: "v1beta",
    auth: oauth2Client,
  });

  try {
    const response = await analyticsAdmin.properties.get({
      name: propertyId,
    });

    const property = response.data;

    return {
      name: property.name || "",
      displayName: property.displayName || "",
      industryCategory: property.industryCategory || undefined,
      timeZone: property.timeZone || undefined,
      currencyCode: property.currencyCode || undefined,
      createTime: property.createTime || undefined,
      serviceLevel: property.serviceLevel || undefined,
      account: property.account || undefined,
    };
  } catch (error) {
    console.error(`[GA API] Error fetching property ${propertyId}:`, error);
    return null;
  }
}

// ============================================================================
// Analytics Data API (GA4 Data API)
// ============================================================================

/**
 * Fetch traffic metrics for a GA4 property
 */
export async function fetchGA4TrafficMetrics(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<GA4TrafficData> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const analyticsData = google.analyticsdata({
    version: "v1beta",
    auth: oauth2Client,
  });

  // Run the report
  const response = await analyticsData.properties.runReport({
    property: propertyId,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    },
  });

  // Parse the response
  const rows = response.data.rows || [];
  const metrics: GA4DailyMetric[] = [];

  let totalSessions = 0;
  let totalUsers = 0;
  let totalNewUsers = 0;
  let totalPageviews = 0;
  let totalBounceRate = 0;
  let totalSessionDuration = 0;

  for (const row of rows) {
    const date = row.dimensionValues?.[0]?.value || "";
    const sessions = parseInt(row.metricValues?.[0]?.value || "0", 10);
    const users = parseInt(row.metricValues?.[1]?.value || "0", 10);
    const newUsers = parseInt(row.metricValues?.[2]?.value || "0", 10);
    const pageviews = parseInt(row.metricValues?.[3]?.value || "0", 10);
    const bounceRate = parseFloat(row.metricValues?.[4]?.value || "0");
    const avgSessionDuration = parseFloat(row.metricValues?.[5]?.value || "0");

    // Format date as YYYY-MM-DD
    const formattedDate =
      date.length === 8
        ? `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`
        : date;

    metrics.push({
      date: formattedDate,
      sessions,
      users,
      newUsers,
      pageviews,
      bounceRate: Math.round(bounceRate * 10000) / 100, // Convert to percentage
      avgSessionDuration: Math.round(avgSessionDuration),
    });

    totalSessions += sessions;
    totalUsers += users;
    totalNewUsers += newUsers;
    totalPageviews += pageviews;
    totalBounceRate += bounceRate;
    totalSessionDuration += avgSessionDuration;
  }

  const rowCount = rows.length || 1;

  // Calculate trends (compare first half to second half)
  const trends = calculateTrends(metrics);

  return {
    metrics,
    totals: {
      totalSessions,
      totalUsers,
      totalNewUsers,
      totalPageviews,
      avgBounceRate: Math.round((totalBounceRate / rowCount) * 10000) / 100,
      avgSessionDuration: Math.round(totalSessionDuration / rowCount),
    },
    trends,
    dateRange: {
      startDate,
      endDate,
    },
  };
}

/**
 * Calculate trend percentages comparing first half to second half
 */
function calculateTrends(metrics: GA4DailyMetric[]): GA4TrafficData["trends"] {
  if (metrics.length < 2) {
    return { sessionsTrend: 0, usersTrend: 0, pageviewsTrend: 0 };
  }

  const half = Math.floor(metrics.length / 2);
  const firstHalf = metrics.slice(0, half);
  const secondHalf = metrics.slice(half);

  const calculateTrendPercent = (first: number[], second: number[]): number => {
    const firstSum = first.reduce((a, b) => a + b, 0);
    const secondSum = second.reduce((a, b) => a + b, 0);

    if (firstSum === 0) return secondSum > 0 ? 100 : 0;
    return Math.round(((secondSum - firstSum) / firstSum) * 100);
  };

  return {
    sessionsTrend: calculateTrendPercent(
      firstHalf.map((m) => m.sessions),
      secondHalf.map((m) => m.sessions)
    ),
    usersTrend: calculateTrendPercent(
      firstHalf.map((m) => m.users),
      secondHalf.map((m) => m.users)
    ),
    pageviewsTrend: calculateTrendPercent(
      firstHalf.map((m) => m.pageviews),
      secondHalf.map((m) => m.pageviews)
    ),
  };
}

/**
 * Fetch top pages for a GA4 property
 */
export async function fetchGA4TopPages(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<
  Array<{ pagePath: string; pageviews: number; avgTimeOnPage: number }>
> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const analyticsData = google.analyticsdata({
    version: "v1beta",
    auth: oauth2Client,
  });

  const response = await analyticsData.properties.runReport({
    property: propertyId,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: String(limit),
    },
  });

  const rows = response.data.rows || [];

  return rows.map((row) => ({
    pagePath: row.dimensionValues?.[0]?.value || "",
    pageviews: parseInt(row.metricValues?.[0]?.value || "0", 10),
    avgTimeOnPage: Math.round(parseFloat(row.metricValues?.[1]?.value || "0")),
  }));
}

/**
 * Fetch traffic sources for a GA4 property
 */
export async function fetchGA4TrafficSources(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<
  Array<{ source: string; medium: string; sessions: number; users: number }>
> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const analyticsData = google.analyticsdata({
    version: "v1beta",
    auth: oauth2Client,
  });

  const response = await analyticsData.properties.runReport({
    property: propertyId,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: String(limit),
    },
  });

  const rows = response.data.rows || [];

  return rows.map((row) => ({
    source: row.dimensionValues?.[0]?.value || "(direct)",
    medium: row.dimensionValues?.[1]?.value || "(none)",
    sessions: parseInt(row.metricValues?.[0]?.value || "0", 10),
    users: parseInt(row.metricValues?.[1]?.value || "0", 10),
  }));
}
