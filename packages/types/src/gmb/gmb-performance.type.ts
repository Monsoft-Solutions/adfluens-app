/**
 * GMB Performance Analytics Types
 *
 * Types for Google Business Profile Performance API metrics.
 *
 * @module @repo/types/gmb/gmb-performance
 */

import { z } from "zod";

// ============================================================================
// Metric Types
// ============================================================================

/**
 * Performance API daily metric type schema
 */
export const gmbDailyMetricTypeSchema = z.enum([
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "WEBSITE_CLICKS",
  "CALL_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
]);

export type GMBDailyMetricType = z.infer<typeof gmbDailyMetricTypeSchema>;

/**
 * Date schema for metrics
 */
export const gmbMetricDateSchema = z.object({
  year: z.number(),
  month: z.number(),
  day: z.number(),
});

export type GMBMetricDate = z.infer<typeof gmbMetricDateSchema>;

/**
 * A single daily metric value schema
 */
export const gmbDailyMetricSchema = z.object({
  date: gmbMetricDateSchema,
  value: z.number(),
});

export type GMBDailyMetric = z.infer<typeof gmbDailyMetricSchema>;

/**
 * All available daily performance metrics schema
 */
export const gmbPerformanceMetricsSchema = z.object({
  /** Impressions on Google Maps (desktop + mobile) */
  searchImpressionsMaps: z.array(gmbDailyMetricSchema),
  /** Impressions on Google Search (desktop + mobile) */
  searchImpressionsSearch: z.array(gmbDailyMetricSchema),
  /** Clicks to website */
  websiteClicks: z.array(gmbDailyMetricSchema),
  /** Clicks to call */
  phoneClicks: z.array(gmbDailyMetricSchema),
  /** Direction requests */
  directionRequests: z.array(gmbDailyMetricSchema),
});

export type GMBPerformanceMetrics = z.infer<typeof gmbPerformanceMetricsSchema>;

// ============================================================================
// Search Keywords
// ============================================================================

/**
 * A search keyword with impression count schema
 */
export const gmbSearchKeywordSchema = z.object({
  keyword: z.string(),
  impressions: z.number(),
});

export type GMBSearchKeyword = z.infer<typeof gmbSearchKeywordSchema>;

// ============================================================================
// Complete Response
// ============================================================================

/**
 * Date range schema
 */
export const gmbDateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export type GMBDateRange = z.infer<typeof gmbDateRangeSchema>;

/**
 * Performance totals schema
 */
export const gmbPerformanceTotalsSchema = z.object({
  totalImpressions: z.number(),
  totalWebsiteClicks: z.number(),
  totalPhoneClicks: z.number(),
  totalDirectionRequests: z.number(),
});

export type GMBPerformanceTotals = z.infer<typeof gmbPerformanceTotalsSchema>;

/**
 * Complete performance data response schema
 */
export const gmbPerformanceDataSchema = z.object({
  metrics: gmbPerformanceMetricsSchema,
  searchKeywords: z.array(gmbSearchKeywordSchema),
  dateRange: gmbDateRangeSchema,
  /** Aggregated totals for the period */
  totals: gmbPerformanceTotalsSchema,
});

export type GMBPerformanceData = z.infer<typeof gmbPerformanceDataSchema>;
