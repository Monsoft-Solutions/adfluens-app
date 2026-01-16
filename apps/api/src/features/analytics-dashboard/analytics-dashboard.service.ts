/**
 * Analytics Dashboard Service
 *
 * Aggregates analytics data from multiple platforms (GA, Meta, GMB)
 * into a unified dashboard view.
 */

import {
  getTrafficMetrics as getGATrafficMetrics,
  getGAConnection,
} from "../ga/ga.service";
import {
  getGMBConnection,
  getPerformanceMetrics as getGMBPerformanceMetrics,
} from "../gmb/gmb.service";
import {
  getConnection as getMetaConnection,
  getPages as getMetaPages,
} from "../meta/meta.service";

// ============================================================================
// Types
// ============================================================================

export type PlatformConnectionStatus = {
  ga: {
    connected: boolean;
    propertyName?: string;
    googleEmail?: string;
  } | null;
  meta: {
    connected: boolean;
    pageCount: number;
    userName?: string;
  } | null;
  gmb: {
    connected: boolean;
    locationName?: string;
  } | null;
};

export type GAOverviewData = {
  totalSessions: number;
  totalUsers: number;
  totalPageviews: number;
  bounceRate: number;
  sessionsTrend: number;
  usersTrend: number;
  pageviewsTrend: number;
  bounceRateTrend: number;
};

export type MetaOverviewData = {
  totalReach: number;
  totalEngagement: number;
  totalFollowers: number;
  reachTrend: number;
  engagementTrend: number;
  followersTrend: number;
};

export type GMBOverviewData = {
  totalImpressions: number;
  totalActions: number;
  impressionsTrend: number;
  actionsTrend: number;
  reviewCount?: number;
  averageRating?: number;
};

export type DashboardOverview = {
  ga: GAOverviewData | null;
  meta: MetaOverviewData | null;
  gmb: GMBOverviewData | null;
  connectionStatus: {
    ga: boolean;
    meta: boolean;
    gmb: boolean;
  };
};

// ============================================================================
// Connection Status
// ============================================================================

/**
 * Get connection status for all platforms
 */
export async function getConnectionStatus(
  organizationId: string
): Promise<PlatformConnectionStatus> {
  // Fetch all connections in parallel
  const [gaConnection, metaConnection, gmbConnection, metaPages] =
    await Promise.all([
      getGAConnection(organizationId).catch(() => null),
      getMetaConnection(organizationId).catch(() => null),
      getGMBConnection(organizationId).catch(() => null),
      getMetaPages(organizationId).catch(() => []),
    ]);

  return {
    ga: gaConnection
      ? {
          connected: gaConnection.status === "active",
          propertyName: gaConnection.properties?.find((p) => p.isActive)
            ?.propertyName,
          googleEmail: gaConnection.googleEmail || undefined,
        }
      : null,
    meta: metaConnection
      ? {
          connected: metaConnection.status === "active",
          pageCount: metaPages.length,
          userName: metaConnection.metaUserName || undefined,
        }
      : null,
    gmb: gmbConnection
      ? {
          connected: gmbConnection.status === "active",
          locationName: gmbConnection.gmbLocationName || undefined,
        }
      : null,
  };
}

// ============================================================================
// Overview Metrics
// ============================================================================

/**
 * Get aggregated overview metrics from all platforms
 */
export async function getOverviewMetrics(
  organizationId: string,
  days: number = 30
): Promise<DashboardOverview> {
  // Fetch data from all platforms in parallel with graceful error handling
  const [gaData, gmbData] = await Promise.all([
    getGAOverviewData(organizationId, days).catch((error) => {
      console.warn("[Dashboard] Failed to fetch GA data:", error);
      return null;
    }),
    getGMBOverviewData(organizationId, days).catch((error) => {
      console.warn("[Dashboard] Failed to fetch GMB data:", error);
      return null;
    }),
  ]);

  // Meta insights require additional API calls that may not be available yet
  // For now, return null for Meta until we extend the service
  const metaData: MetaOverviewData | null = null;

  return {
    ga: gaData,
    meta: metaData,
    gmb: gmbData,
    connectionStatus: {
      ga: gaData !== null,
      meta: metaData !== null,
      gmb: gmbData !== null,
    },
  };
}

/**
 * Get GA overview data
 */
async function getGAOverviewData(
  organizationId: string,
  days: number
): Promise<GAOverviewData | null> {
  try {
    const trafficData = await getGATrafficMetrics(organizationId, days);

    if (!trafficData) {
      return null;
    }

    // Calculate bounce rate trend from metrics
    const bounceRateTrend = calculateBounceRateTrend(trafficData.metrics);

    return {
      totalSessions: trafficData.totals.totalSessions,
      totalUsers: trafficData.totals.totalUsers,
      totalPageviews: trafficData.totals.totalPageviews,
      bounceRate: trafficData.totals.avgBounceRate,
      sessionsTrend: trafficData.trends.sessionsTrend,
      usersTrend: trafficData.trends.usersTrend,
      pageviewsTrend: trafficData.trends.pageviewsTrend,
      bounceRateTrend,
    };
  } catch (error) {
    console.warn("[Dashboard] GA data fetch failed:", error);
    return null;
  }
}

/**
 * Calculate bounce rate trend (comparing first half to second half averages)
 * Note: For bounce rate, a decrease is generally positive
 */
function calculateBounceRateTrend(
  metrics: Array<{ bounceRate: number }>
): number {
  if (metrics.length < 2) return 0;

  const half = Math.floor(metrics.length / 2);
  const firstHalf = metrics.slice(0, half);
  const secondHalf = metrics.slice(half);

  const firstAvg =
    firstHalf.reduce((sum, m) => sum + m.bounceRate, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, m) => sum + m.bounceRate, 0) / secondHalf.length;

  if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

/**
 * Get GMB overview data
 */
async function getGMBOverviewData(
  organizationId: string,
  days: number
): Promise<GMBOverviewData | null> {
  try {
    const performanceData = await getGMBPerformanceMetrics(
      organizationId,
      days
    );

    if (!performanceData) {
      return null;
    }

    // Calculate totals
    const totalImpressions = performanceData.totals.totalImpressions;
    const totalActions =
      performanceData.totals.totalWebsiteClicks +
      performanceData.totals.totalPhoneClicks +
      performanceData.totals.totalDirectionRequests;

    // Calculate trends (compare first half to second half)
    const impressionsTrend = calculateTrendFromMetrics([
      ...performanceData.metrics.searchImpressionsMaps,
      ...performanceData.metrics.searchImpressionsSearch,
    ]);

    const actionsTrend = calculateTrendFromMetrics([
      ...performanceData.metrics.websiteClicks,
      ...performanceData.metrics.phoneClicks,
      ...performanceData.metrics.directionRequests,
    ]);

    return {
      totalImpressions,
      totalActions,
      impressionsTrend,
      actionsTrend,
    };
  } catch (error) {
    console.warn("[Dashboard] GMB data fetch failed:", error);
    return null;
  }
}

/**
 * Calculate trend percentage from metrics array
 */
function calculateTrendFromMetrics(metrics: Array<{ value: number }>): number {
  if (metrics.length < 2) return 0;

  const half = Math.floor(metrics.length / 2);
  const firstHalf = metrics.slice(0, half);
  const secondHalf = metrics.slice(half);

  const firstSum = firstHalf.reduce((sum, m) => sum + m.value, 0);
  const secondSum = secondHalf.reduce((sum, m) => sum + m.value, 0);

  if (firstSum === 0) return secondSum > 0 ? 100 : 0;
  return Math.round(((secondSum - firstSum) / firstSum) * 100);
}
