import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { BarChart3, Link2, TrendingUp, LayoutDashboard } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { OverviewMetrics } from "../components/overview-metrics.component";
import { GASection } from "../components/ga/ga-section.component";
import { MetaDashboardSection } from "../components/meta/meta-dashboard-section.component";
import { GMBDashboardSection } from "../components/gmb/gmb-dashboard-section.component";
import { DateRangeSelector } from "../components/date-range-selector.component";

/**
 * Analytics Dashboard View
 *
 * Unified analytics dashboard showing metrics from:
 * - Google Analytics 4 (traffic, sessions, users)
 * - Meta (Facebook/Instagram) (engagement, followers)
 * - Google My Business (visibility, actions, reviews)
 */
export const AnalyticsDashboardView: React.FC = () => {
  const trpc = useTRPC();
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL params with defaults
  const activeTab = searchParams.get("tab") || "overview";
  const days = Number(searchParams.get("days")) || 30;

  // Update URL params helper (uses replace to avoid history spam)
  const updateParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    setSearchParams(newParams, { replace: true });
  };

  const handleTabChange = (tab: string) => {
    updateParams({ tab });
  };

  const handleDaysChange = (newDays: number) => {
    updateParams({ days: String(newDays) });
  };

  const { data: connectionStatus, isLoading: isLoadingStatus } = useQuery({
    ...trpc.analyticsDashboard.getConnectionStatus.queryOptions(),
    enabled: !!organization,
  });

  const { data: overviewData, isLoading: isLoadingOverview } = useQuery({
    ...trpc.analyticsDashboard.getOverview.queryOptions({ days }),
    enabled: !!organization,
  });

  // No organization
  if (!organization) {
    return (
      <div className="animate-reveal">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
            <LayoutDashboard className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            No Organization Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            Please select or create an organization to view analytics.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoadingStatus) {
    return (
      <div className="animate-reveal space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const hasAnyConnection =
    connectionStatus?.ga?.connected ||
    connectionStatus?.meta?.connected ||
    connectionStatus?.gmb?.connected;

  return (
    <div className="animate-reveal">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground">
                Unified view of your digital presence
              </p>
            </div>
          </div>
          <DateRangeSelector value={days} onChange={handleDaysChange} />
        </div>
      </div>

      {/* Show connect prompt if no platforms connected */}
      {!hasAnyConnection && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Connect Your Platforms
            </CardTitle>
            <CardDescription>
              Connect Google Analytics, Meta, or Google Business Profile to
              start seeing unified analytics data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Click on any platform card above to connect and start tracking
              your metrics.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {hasAnyConnection && (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex items-center gap-2">
              <span className="text-xs">META</span>
              <span className="hidden sm:inline">Social</span>
            </TabsTrigger>
            <TabsTrigger value="gmb" className="flex items-center gap-2">
              <span className="text-xs">GMB</span>
              <span className="hidden sm:inline">Local</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewMetrics
              data={overviewData}
              isLoading={isLoadingOverview}
              days={days}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <GASection days={days} />
          </TabsContent>

          <TabsContent value="meta" className="space-y-6">
            <MetaDashboardSection days={days} />
          </TabsContent>

          <TabsContent value="gmb" className="space-y-6">
            <GMBDashboardSection days={days} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
