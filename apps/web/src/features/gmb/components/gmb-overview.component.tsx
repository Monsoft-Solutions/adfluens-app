import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Phone,
  Globe,
  Clock,
  RefreshCw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";

/**
 * GMB Overview Component
 *
 * Displays location information and basic stats for the connected GMB location.
 */
export const GMBOverview: React.FC = () => {
  const trpc = useTRPC();

  const { data: connectionData, isLoading: isLoadingConnection } = useQuery(
    trpc.gmb.getConnection.queryOptions()
  );

  const {
    data: locationData,
    isLoading: isLoadingLocation,
    refetch: refetchLocation,
    isRefetching,
  } = useQuery({
    ...trpc.gmb.getLocationInfo.queryOptions(),
    enabled: !!connectionData?.connection,
  });

  const connection = connectionData?.connection;
  const location = locationData?.locationData;

  if (isLoadingConnection || isLoadingLocation) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!connection) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Location Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {location?.title ||
              connection.gmbLocationName ||
              "Business Location"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchLocation()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          {location?.storefrontAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                {location.storefrontAddress.addressLines?.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <p>
                  {[
                    location.storefrontAddress.locality,
                    location.storefrontAddress.administrativeArea,
                    location.storefrontAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          )}

          {/* Phone */}
          {location?.phoneNumbers?.primaryPhone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {location.phoneNumbers.primaryPhone}
              </span>
            </div>
          )}

          {/* Website */}
          {location?.websiteUri && (
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a
                href={location.websiteUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {new URL(location.websiteUri).hostname}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Category */}
          {location?.categories?.primaryCategory && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Category</p>
              <p className="text-sm font-medium">
                {location.categories.primaryCategory.displayName}
              </p>
            </div>
          )}

          {/* Maps Link */}
          {location?.metadata?.mapsUri && (
            <div className="pt-3 border-t border-border">
              <a
                href={location.metadata.mapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <MapPin className="w-4 h-4" />
                View on Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Hours Card */}
      {location?.regularHours?.periods &&
        location.regularHours.periods.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-primary" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {location.regularHours.periods.map((period, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {period.openDay.toLowerCase()}
                    </span>
                    <span>
                      {period.openTime} - {period.closeTime}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize">{connection.status}</span>
          </div>
          {connection.lastSyncedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Synced</span>
              <span>
                {new Date(connection.lastSyncedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
