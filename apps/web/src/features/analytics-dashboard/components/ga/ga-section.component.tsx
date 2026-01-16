import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BarChart3, Settings, AlertCircle, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { GATrafficChart } from "./ga-traffic-chart.component";
import { GATopPagesTable } from "./ga-top-pages-table.component";

type GASectionProps = {
  days: number;
};

/**
 * Google Analytics section of the dashboard
 *
 * Displays GA traffic metrics and top pages.
 * Connection management is handled in Settings > Google tab.
 */
export const GASection: React.FC<GASectionProps> = ({ days }) => {
  const trpc = useTRPC();
  const { organization } = useAuth();

  const { data: connectionData, isLoading: isLoadingConnection } = useQuery({
    ...trpc.ga.getConnection.queryOptions(),
    enabled: !!organization,
  });

  const connection = connectionData?.connection;

  const { data: trafficData, isLoading: isLoadingTraffic } = useQuery({
    ...trpc.ga.getTrafficMetrics.queryOptions({ days }),
    enabled: !!organization && connection?.status === "active",
  });

  const { data: topPagesData, isLoading: isLoadingTopPages } = useQuery({
    ...trpc.ga.getTopPages.queryOptions({ days, limit: 10 }),
    enabled: !!organization && connection?.status === "active",
  });

  if (isLoadingConnection) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Not connected - direct to Settings
  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Connect your Google Analytics 4 property to see traffic metrics,
            user behavior, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              Set up Google Analytics in Settings to start tracking your website
              traffic.
            </p>
            <Button asChild>
              <Link to="/settings?tab=google">
                <Settings className="w-4 h-4 mr-2" />
                Go to Settings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Connection error - direct to Settings
  if (connection.status === "error") {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">Connection Error</p>
              <p className="text-sm text-muted-foreground">
                {connection.lastError ||
                  "Unknown error. Please reconnect in Settings."}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings?tab=google">
                <Settings className="w-4 h-4 mr-2" />
                Go to Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending - needs property selection in Settings
  if (connection.status === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Your Google account is connected. Select a GA4 property to start
            tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              Complete the setup by selecting a property in Settings.
            </p>
            <Button asChild>
              <Link to="/settings?tab=google">
                <Settings className="w-4 h-4 mr-2" />
                Select Property in Settings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeProperty = connection.properties?.find((p) => p.isActive);

  // No active property selected - direct to Settings
  if (!activeProperty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Google Analytics
          </CardTitle>
          <CardDescription>
            Select a GA4 property to view your analytics data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">
              No property selected. Choose a GA4 property in Settings.
            </p>
            <Button asChild>
              <Link to="/settings?tab=google">
                <Settings className="w-4 h-4 mr-2" />
                Select Property in Settings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with property info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Google Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeProperty.propertyName} &bull; {connection.googleEmail}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/settings?tab=google">
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Link>
        </Button>
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Overview</CardTitle>
          <CardDescription>
            Sessions, users, and pageviews over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTraffic ? (
            <Skeleton className="h-64" />
          ) : trafficData ? (
            <GATrafficChart data={trafficData} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No traffic data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>
            Most visited pages in the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTopPages ? (
            <Skeleton className="h-48" />
          ) : topPagesData?.pages && topPagesData.pages.length > 0 ? (
            <GATopPagesTable pages={topPagesData.pages} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No page data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
