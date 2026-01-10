import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  MousePointer,
  Phone,
  Navigation,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { GMBMetricsChart } from "./gmb-metrics-chart.component";
import { GMBKeywordsTable } from "./gmb-keywords-table.component";

type DateRange = 7 | 14 | 30 | 60 | 90;

/**
 * GMB Analytics Overview Component
 *
 * Displays performance analytics with stat cards, charts, and keyword data.
 */
export const GMBAnalyticsOverview: React.FC = () => {
  const trpc = useTRPC();
  const [days, setDays] = useState<DateRange>(30);

  const {
    data: performanceData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    ...trpc.gmb.getPerformanceMetrics.queryOptions({ days }),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Calculate percent changes (compare first half to second half of period)
  const calculateTrend = (metrics: Array<{ value: number }>) => {
    if (metrics.length < 2) return 0;
    const half = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, half);
    const secondHalf = metrics.slice(half);

    const firstSum = firstHalf.reduce((sum, m) => sum + m.value, 0);
    const secondSum = secondHalf.reduce((sum, m) => sum + m.value, 0);

    if (firstSum === 0) return secondSum > 0 ? 100 : 0;
    return Math.round(((secondSum - firstSum) / firstSum) * 100);
  };

  // Calculate trend values
  const impressionsTrend = performanceData?.metrics
    ? calculateTrend([
        ...performanceData.metrics.searchImpressionsMaps,
        ...performanceData.metrics.searchImpressionsSearch,
      ])
    : 0;
  const websiteClicksTrend = performanceData?.metrics
    ? calculateTrend(performanceData.metrics.websiteClicks)
    : 0;
  const phoneClicksTrend = performanceData?.metrics
    ? calculateTrend(performanceData.metrics.phoneClicks)
    : 0;
  const directionsTrend = performanceData?.metrics
    ? calculateTrend(performanceData.metrics.directionRequests)
    : 0;

  const stats = [
    {
      label: "Total Impressions",
      value: performanceData?.totals?.totalImpressions ?? 0,
      trend: impressionsTrend,
      icon: Eye,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Website Clicks",
      value: performanceData?.totals?.totalWebsiteClicks ?? 0,
      trend: websiteClicksTrend,
      icon: MousePointer,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Phone Calls",
      value: performanceData?.totals?.totalPhoneClicks ?? 0,
      trend: phoneClicksTrend,
      icon: Phone,
      color: "text-accent-foreground",
      bgColor: "bg-accent/10",
    },
    {
      label: "Direction Requests",
      value: performanceData?.totals?.totalDirectionRequests ?? 0,
      trend: directionsTrend,
      icon: Navigation,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const TrendIcon = ({ trend }: { trend: number }) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Performance Analytics
          </h2>
          {performanceData?.dateRange && (
            <p className="text-sm text-muted-foreground">
              {performanceData.dateRange.startDate} to{" "}
              {performanceData.dateRange.endDate}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(days)}
            onValueChange={(value) => setDays(Number(value) as DateRange)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendIcon trend={stat.trend} />
                  <span
                    className={
                      stat.trend > 0
                        ? "text-success"
                        : stat.trend < 0
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }
                  >
                    {stat.trend > 0 ? "+" : ""}
                    {stat.trend}%
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics Chart */}
      {performanceData?.metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <GMBMetricsChart metrics={performanceData.metrics} />
          </CardContent>
        </Card>
      )}

      {/* Search Keywords */}
      {performanceData?.searchKeywords &&
        performanceData.searchKeywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Search Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <GMBKeywordsTable keywords={performanceData.searchKeywords} />
            </CardContent>
          </Card>
        )}
    </div>
  );
};
