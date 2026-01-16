import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin, Phone, Globe, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
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
import { GoogleBusinessIcon } from "@/shared/components/icons/google-business.icon";

type GMBDashboardSectionProps = {
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

/**
 * Google My Business section of the dashboard
 */
export const GMBDashboardSection: React.FC<GMBDashboardSectionProps> = ({
  days,
}) => {
  const trpc = useTRPC();
  const { organization } = useAuth();

  const { data: connectionData, isLoading: isLoadingConnection } = useQuery({
    ...trpc.gmb.getConnection.queryOptions(),
    enabled: !!organization,
  });

  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    ...trpc.gmb.getPerformanceMetrics.queryOptions({ days }),
    enabled: !!organization && !!connectionData?.connection,
  });

  if (isLoadingConnection) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const connection = connectionData?.connection;

  // Not connected
  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleBusinessIcon className="w-5 h-5" />
            Connect Google Business
          </CardTitle>
          <CardDescription>
            Connect your Google Business Profile to see local visibility,
            customer actions, and reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/gmb">
            <Button>
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Google Business
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isLoadingPerformance;

  // Calculate totals from performance data
  const totals = performanceData?.totals || {
    totalImpressions: 0,
    totalWebsiteClicks: 0,
    totalPhoneClicks: 0,
    totalDirectionRequests: 0,
  };

  const totalActions =
    totals.totalWebsiteClicks +
    totals.totalPhoneClicks +
    totals.totalDirectionRequests;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <GoogleBusinessIcon className="w-5 h-5" />
            Google Business Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            {connection.gmbLocationName || "Business Location"}
          </p>
        </div>
        <Link to="/gmb">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Full Dashboard
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatNumber(totals.totalImpressions)}
                  </p>
                  <p className="text-sm text-muted-foreground">Impressions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/10 p-2 rounded-lg">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatNumber(totals.totalWebsiteClicks)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Website Clicks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <Phone className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatNumber(totals.totalPhoneClicks)}
                  </p>
                  <p className="text-sm text-muted-foreground">Phone Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/10 p-2 rounded-lg">
                  <Navigation className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatNumber(totals.totalDirectionRequests)}
                  </p>
                  <p className="text-sm text-muted-foreground">Directions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Summary</CardTitle>
          <CardDescription>Last {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Impressions</span>
              <span className="font-medium">
                {formatNumber(totals.totalImpressions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Actions</span>
              <span className="font-medium">{formatNumber(totalActions)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Action Rate</span>
              <span className="font-medium">
                {totals.totalImpressions > 0
                  ? ((totalActions / totals.totalImpressions) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link to full dashboard */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            View reviews, posts, and detailed analytics in the{" "}
            <Link to="/gmb" className="text-primary hover:underline">
              full Google Business dashboard
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
