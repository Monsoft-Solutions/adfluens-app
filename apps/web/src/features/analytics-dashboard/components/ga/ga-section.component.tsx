import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  ExternalLink,
  RefreshCw,
  Settings,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from "@repo/ui";
import { useTRPC, trpcClient } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { GAPropertySelector } from "./ga-property-selector.component";
import { GATrafficChart } from "./ga-traffic-chart.component";
import { GATopPagesTable } from "./ga-top-pages-table.component";

type GASectionProps = {
  days: number;
};

/**
 * Google Analytics section of the dashboard
 */
export const GASection: React.FC<GASectionProps> = ({ days }) => {
  const trpc = useTRPC();
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showPropertySelector, setShowPropertySelector] = React.useState(false);
  const [pendingSetupCode, setPendingSetupCode] = React.useState<string | null>(
    null
  );

  // Check URL for setup code (redirected from OAuth)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setupCode = params.get("ga_setup_code");
    if (setupCode) {
      setPendingSetupCode(setupCode);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("ga_setup_code");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

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

  const connectMutation = useMutation({
    mutationFn: async () => {
      const result = await trpcClient.ga.getOAuthUrl.query({
        redirectPath: "/analytics",
      });
      window.location.href = result.url;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await trpcClient.ga.disconnect.mutate();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.ga.getConnection.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.analyticsDashboard.getConnectionStatus.queryKey(),
      });
    },
  });

  if (isLoadingConnection) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Pending property selection from OAuth redirect
  if (pendingSetupCode) {
    return (
      <GAPropertySelector
        setupCode={pendingSetupCode}
        onComplete={() => {
          setPendingSetupCode(null);
          queryClient.invalidateQueries({
            queryKey: trpc.ga.getConnection.queryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.analyticsDashboard.getConnectionStatus.queryKey(),
          });
        }}
        onCancel={() => setPendingSetupCode(null)}
      />
    );
  }

  // Not connected
  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Connect Google Analytics
          </CardTitle>
          <CardDescription>
            Connect your Google Analytics 4 property to see traffic metrics,
            user behavior, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
          >
            {connectMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Google Analytics
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Connection error
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
                  "Unknown error. Please try reconnecting."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => connectMutation.mutate()}
            >
              Reconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending - needs property selection
  if (connection.status === "pending") {
    return (
      <GAPropertySelector
        setupCode={connection.id}
        onComplete={() => {
          queryClient.invalidateQueries({
            queryKey: trpc.ga.getConnection.queryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.analyticsDashboard.getConnectionStatus.queryKey(),
          });
        }}
        onCancel={() => {}}
      />
    );
  }

  const activeProperty = connection.properties?.find((p) => p.isActive);

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
            {activeProperty?.propertyName || "No property selected"} &bull;{" "}
            {connection.googleEmail}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPropertySelector(!showPropertySelector)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Change Property
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
          >
            Disconnect
          </Button>
        </div>
      </div>

      {/* Property selector (if open) */}
      {showPropertySelector && (
        <GAPropertySelector
          setupCode={connection.id}
          onComplete={() => {
            setShowPropertySelector(false);
            queryClient.invalidateQueries({
              queryKey: trpc.ga.getConnection.queryKey(),
            });
            queryClient.invalidateQueries({
              queryKey: trpc.ga.getTrafficMetrics.queryKey(),
            });
          }}
          onCancel={() => setShowPropertySelector(false)}
        />
      )}

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
