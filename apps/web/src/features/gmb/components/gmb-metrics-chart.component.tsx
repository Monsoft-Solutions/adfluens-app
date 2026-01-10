import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { GMBPerformanceMetrics } from "@repo/types/gmb/gmb-performance.type";

type Props = {
  metrics: GMBPerformanceMetrics;
};

/**
 * GMB Metrics Chart Component
 *
 * Displays a line chart showing performance metrics over time.
 */
export const GMBMetricsChart: React.FC<Props> = ({ metrics }) => {
  // Transform metrics into chart data format
  const chartData = useMemo(() => {
    // Collect all unique dates
    const dateMap = new Map<
      string,
      {
        date: string;
        mapsImpressions: number;
        searchImpressions: number;
        websiteClicks: number;
        phoneClicks: number;
        directions: number;
      }
    >();

    // Helper to add date key
    const addMetric = (
      dateObj: { year: number; month: number; day: number },
      value: number,
      field: string
    ) => {
      const dateKey = `${dateObj.year}-${String(dateObj.month).padStart(2, "0")}-${String(dateObj.day).padStart(2, "0")}`;
      const existing = dateMap.get(dateKey) || {
        date: dateKey,
        mapsImpressions: 0,
        searchImpressions: 0,
        websiteClicks: 0,
        phoneClicks: 0,
        directions: 0,
      };
      (existing as Record<string, number | string>)[field] = value;
      dateMap.set(dateKey, existing);
    };

    // Process each metric type
    metrics.searchImpressionsMaps.forEach((m) =>
      addMetric(m.date, m.value, "mapsImpressions")
    );
    metrics.searchImpressionsSearch.forEach((m) =>
      addMetric(m.date, m.value, "searchImpressions")
    );
    metrics.websiteClicks.forEach((m) =>
      addMetric(m.date, m.value, "websiteClicks")
    );
    metrics.phoneClicks.forEach((m) =>
      addMetric(m.date, m.value, "phoneClicks")
    );
    metrics.directionRequests.forEach((m) =>
      addMetric(m.date, m.value, "directions")
    );

    // Sort by date
    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [metrics]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No performance data available for this period
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              padding: "12px",
            }}
            labelFormatter={formatDate}
            formatter={(value, name) => [
              typeof value === "number" ? value.toLocaleString() : "0",
              formatMetricName(String(name ?? "")),
            ]}
          />
          <Legend
            formatter={(value) => formatMetricName(value)}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="mapsImpressions"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="searchImpressions"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="websiteClicks"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="phoneClicks"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="directions"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Format metric key to display name
 */
function formatMetricName(key: string): string {
  const names: Record<string, string> = {
    mapsImpressions: "Maps Impressions",
    searchImpressions: "Search Impressions",
    websiteClicks: "Website Clicks",
    phoneClicks: "Phone Calls",
    directions: "Directions",
  };
  return names[key] || key;
}
