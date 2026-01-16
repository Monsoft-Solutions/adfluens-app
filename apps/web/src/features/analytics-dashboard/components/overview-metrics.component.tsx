import React from "react";
import {
  Users,
  Eye,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  BarChart3,
  Share2,
  Heart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  cn,
} from "@repo/ui";

type OverviewData = {
  ga: {
    totalSessions: number;
    totalUsers: number;
    totalPageviews: number;
    bounceRate: number;
    sessionsTrend: number;
    usersTrend: number;
    pageviewsTrend: number;
    bounceRateTrend: number;
  } | null;
  meta: {
    totalReach: number;
    totalEngagement: number;
    totalFollowers: number;
    reachTrend: number;
    engagementTrend: number;
    followersTrend: number;
  } | null;
  gmb: {
    totalImpressions: number;
    totalActions: number;
    impressionsTrend: number;
    actionsTrend: number;
  } | null;
  connectionStatus: {
    ga: boolean;
    meta: boolean;
    gmb: boolean;
  };
};

type OverviewMetricsProps = {
  data?: OverviewData;
  isLoading: boolean;
  days: number;
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

function formatPercent(num: number): string {
  return `${num.toFixed(1)}%`;
}

type TrendBadgeProps = {
  value: number;
  /** If true, lower values are better (e.g., bounce rate) */
  invertColors?: boolean;
};

function TrendBadge({ value, invertColors = false }: TrendBadgeProps) {
  if (value === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="w-3 h-3" />
        <span>0%</span>
      </div>
    );
  }

  const isPositive = value > 0;
  // For inverted metrics (like bounce rate), negative change is good
  const isGood = invertColors ? !isPositive : isPositive;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm",
        isGood
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400"
      )}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>
        {isPositive ? "+" : ""}
        {value}%
      </span>
    </div>
  );
}

type MetricDefinition = {
  title: string;
  value: number;
  trend: number;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  format?: "number" | "percent";
  /** If true, lower values are better (e.g., bounce rate) */
  invertTrend?: boolean;
};

/**
 * Overview metrics cards showing key stats from all platforms
 * Only displays metrics from connected platforms
 */
export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  data,
  isLoading,
  days,
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const allMetrics: MetricDefinition[] = [
    // Google Analytics metrics
    {
      title: "Website Sessions",
      value: data?.ga?.totalSessions ?? 0,
      trend: data?.ga?.sessionsTrend ?? 0,
      description: "Total sessions",
      icon: <BarChart3 className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.ga ?? false,
    },
    {
      title: "Total Users",
      value: data?.ga?.totalUsers ?? 0,
      trend: data?.ga?.usersTrend ?? 0,
      description: "Unique visitors",
      icon: <Users className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.ga ?? false,
    },
    {
      title: "Pageviews",
      value: data?.ga?.totalPageviews ?? 0,
      trend: data?.ga?.pageviewsTrend ?? 0,
      description: "Total page views",
      icon: <FileText className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.ga ?? false,
    },
    {
      title: "Bounce Rate",
      value: data?.ga?.bounceRate ?? 0,
      trend: data?.ga?.bounceRateTrend ?? 0,
      description: "Single page visits",
      icon: <TrendingDown className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.ga ?? false,
      format: "percent",
      invertTrend: true,
    },
    // Meta metrics
    {
      title: "Social Reach",
      value: data?.meta?.totalReach ?? 0,
      trend: data?.meta?.reachTrend ?? 0,
      description: "People reached",
      icon: <Share2 className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.meta ?? false,
    },
    {
      title: "Social Engagement",
      value: data?.meta?.totalEngagement ?? 0,
      trend: data?.meta?.engagementTrend ?? 0,
      description: "Likes, comments, shares",
      icon: <Heart className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.meta ?? false,
    },
    // GMB metrics
    {
      title: "Local Impressions",
      value: data?.gmb?.totalImpressions ?? 0,
      trend: data?.gmb?.impressionsTrend ?? 0,
      description: "Google Business views",
      icon: <Eye className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.gmb ?? false,
    },
    {
      title: "Business Actions",
      value: data?.gmb?.totalActions ?? 0,
      trend: data?.gmb?.actionsTrend ?? 0,
      description: "Calls, directions, clicks",
      icon: <MousePointerClick className="w-4 h-4 text-muted-foreground" />,
      available: data?.connectionStatus.gmb ?? false,
    },
  ];

  // Only show metrics from connected platforms
  const availableMetrics = allMetrics.filter((m) => m.available);

  // If no metrics available, show empty state
  if (availableMetrics.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Performance Overview
          </h2>
          <p className="text-sm text-muted-foreground">Last {days} days</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Connect a platform to see metrics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Performance Overview
        </h2>
        <p className="text-sm text-muted-foreground">Last {days} days</p>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {availableMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.format === "percent"
                  ? formatPercent(metric.value)
                  : formatNumber(metric.value)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
                <TrendBadge
                  value={metric.trend}
                  invertColors={metric.invertTrend}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
