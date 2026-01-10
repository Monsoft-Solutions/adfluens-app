import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Unplug,
} from "lucide-react";
import { Button, cn, Skeleton } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { GoogleBusinessIcon } from "@/shared/components/icons/google-business.icon";
import { GMBLocationSelector } from "@/features/gmb/components/gmb-location-selector.component";

/**
 * GMB Connection Settings Component
 *
 * Displays GMB connection status and allows connecting/disconnecting.
 * Handles OAuth callback flow when redirected back from Google.
 */
export const GMBConnectionSettings: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [setupCode, setSetupCode] = useState<string | null>(null);

  // Check for OAuth callback parameters
  useEffect(() => {
    const gmbSetupCode = searchParams.get("gmb_setup_code");
    const gmbError = searchParams.get("gmb_error");

    if (gmbError) {
      setError(decodeURIComponent(gmbError));
      // Clean up URL params
      searchParams.delete("gmb_error");
      setSearchParams(searchParams, { replace: true });
    } else if (gmbSetupCode) {
      // Store setup code and open location selector
      setSetupCode(gmbSetupCode);
      setIsLocationSelectorOpen(true);

      // Clean up URL params immediately
      searchParams.delete("gmb_setup_code");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch GMB connection status
  const {
    data: connectionData,
    isLoading: isLoadingConnection,
    error: fetchError,
  } = useQuery({
    ...trpc.gmb.getConnection.queryOptions(),
    enabled: !!organization,
  });

  // Get OAuth URL
  const { data: oauthUrlData } = useQuery({
    ...trpc.gmb.getOAuthUrl.queryOptions({ redirectPath: "/settings" }),
    enabled: !!organization && !connectionData?.connection,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    ...trpc.gmb.disconnect.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Google Business Profile disconnected successfully");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.getConnection.queryKey(),
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to disconnect");
      setSuccessMessage(null);
    },
  });

  const handleConnect = () => {
    if (oauthUrlData?.url) {
      window.location.href = oauthUrlData.url;
    }
  };

  const handleDisconnect = () => {
    if (
      confirm("Are you sure you want to disconnect Google Business Profile?")
    ) {
      disconnectMutation.mutate();
    }
  };

  const handleLocationSelected = () => {
    setIsLocationSelectorOpen(false);
    setSetupCode(null);
    setSuccessMessage("Google Business Profile connected successfully!");
    queryClient.invalidateQueries({
      queryKey: trpc.gmb.getConnection.queryKey(),
    });
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const connection = connectionData?.connection;

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div
          className={cn(
            "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            "px-4 py-3 rounded-lg flex items-center gap-3"
          )}
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {(error || fetchError) && (
        <div
          className={cn(
            "bg-destructive/10 border border-destructive/20 text-destructive",
            "px-4 py-3 rounded-lg flex items-center gap-3"
          )}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error || fetchError?.message}</p>
        </div>
      )}

      {isLoadingConnection ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : connection ? (
        // Connected state
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground">Connected</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Your organization is connected to Google Business Profile.
              </p>
            </div>
          </div>

          {/* Location Info */}
          <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {connection.gmbLocationName || "Business Location"}
              </span>
            </div>

            {connection.locationData && (
              <div className="text-sm text-muted-foreground space-y-1">
                {connection.locationData.storefrontAddress && (
                  <p>
                    {[
                      ...(connection.locationData.storefrontAddress
                        .addressLines || []),
                      connection.locationData.storefrontAddress.locality,
                      connection.locationData.storefrontAddress
                        .administrativeArea,
                      connection.locationData.storefrontAddress.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {connection.locationData.phoneNumbers?.primaryPhone && (
                  <p>{connection.locationData.phoneNumbers.primaryPhone}</p>
                )}
              </div>
            )}

            {connection.locationData?.metadata?.mapsUri && (
              <a
                href={connection.locationData.metadata.mapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View on Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {connection.status === "error" && connection.lastError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                <p className="font-medium">Connection Error</p>
                <p className="mt-1">{connection.lastError}</p>
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="text-destructive hover:text-destructive"
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unplug className="w-4 h-4 mr-2" />
              )}
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        // Not connected state
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border rounded-lg">
            <div className="bg-muted p-2 rounded-lg">
              <GoogleBusinessIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground">Not Connected</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your Google Business Profile to manage posts and reviews
                directly from this app.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleConnect} disabled={!oauthUrlData?.url}>
              <GoogleBusinessIcon className="w-4 h-4 mr-2" />
              Connect Google Business Profile
            </Button>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      {setupCode && (
        <GMBLocationSelector
          open={isLocationSelectorOpen}
          onOpenChange={setIsLocationSelectorOpen}
          setupCode={setupCode}
          onSuccess={handleLocationSelected}
          onError={(err) => {
            setError(err);
            setIsLocationSelectorOpen(false);
            setSetupCode(null);
          }}
        />
      )}
    </div>
  );
};
