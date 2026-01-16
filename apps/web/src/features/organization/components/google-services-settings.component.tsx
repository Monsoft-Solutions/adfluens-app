import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Unplug,
  MapPin,
  BarChart3,
  ChevronRight,
  ExternalLink,
  Settings,
  User,
} from "lucide-react";
import { Button, cn, Skeleton, Card, CardContent } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { GoogleIcon } from "@/shared/components/icons/google.icon";
import { GoogleBusinessIcon } from "@/shared/components/icons/google-business.icon";
import { GAPropertySelector } from "@/features/analytics-dashboard/components/ga/ga-property-selector.component";
import { GMBLocationSelector } from "@/features/gmb/components/gmb-location-selector.component";

/**
 * Google Services Settings Component
 *
 * Unified settings panel for all Google services (GA, GMB).
 * Displays connection status and allows enabling/configuring individual services.
 * Handles OAuth callback flow when redirected back from Google.
 */
export const GoogleServicesSettings: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // GA-specific state
  const [isGAPropertySelectorOpen, setIsGAPropertySelectorOpen] =
    useState(false);
  const [gaSetupCode, setGaSetupCode] = useState<string | null>(null);

  // GMB-specific state
  const [isGMBLocationSelectorOpen, setIsGMBLocationSelectorOpen] =
    useState(false);
  const [gmbSetupCode, setGmbSetupCode] = useState<string | null>(null);

  // Check for OAuth callback parameters
  useEffect(() => {
    const googleError = searchParams.get("google_error");
    const googleSetupCode = searchParams.get("google_setup_code");
    const gmbSetupCodeParam = searchParams.get("gmb_setup_code");
    const gaSetupCodeParam = searchParams.get("ga_setup_code");

    if (googleError) {
      setError(decodeURIComponent(googleError));
      searchParams.delete("google_error");
      setSearchParams(searchParams, { replace: true });
    } else if (googleSetupCode || gaSetupCodeParam) {
      // GA OAuth callback - open property selector
      const code = googleSetupCode || gaSetupCodeParam;
      setGaSetupCode(code);
      setIsGAPropertySelectorOpen(true);

      searchParams.delete("google_setup_code");
      searchParams.delete("ga_setup_code");
      setSearchParams(searchParams, { replace: true });
    } else if (gmbSetupCodeParam) {
      // GMB OAuth callback - open location selector
      setGmbSetupCode(gmbSetupCodeParam);
      setIsGMBLocationSelectorOpen(true);

      searchParams.delete("gmb_setup_code");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch Google connection status
  const {
    data: connectionData,
    isLoading: isLoadingConnection,
    error: fetchError,
  } = useQuery({
    ...trpc.google.getConnection.queryOptions(),
    enabled: !!organization,
  });

  // Fetch service statuses
  const { data: statusData, isLoading: isLoadingStatuses } = useQuery({
    ...trpc.google.getServiceStatuses.queryOptions(),
    enabled: !!organization,
  });

  // Fetch GA connection (for property info)
  const { data: gaConnectionData } = useQuery({
    ...trpc.ga.getConnection.queryOptions(),
    enabled: !!organization,
  });

  // Fetch GMB connection (for location info)
  const { data: gmbConnectionData } = useQuery({
    ...trpc.gmb.getConnection.queryOptions(),
    enabled: !!organization,
  });

  // Get OAuth URL for initial Google connection (GA by default)
  const { data: gaOAuthUrlData } = useQuery({
    ...trpc.google.getOAuthUrl.queryOptions({
      service: "ga",
      redirectPath: "/settings?tab=google",
    }),
    enabled: !!organization && !connectionData?.connection,
  });

  // Disconnect Google mutation
  const disconnectMutation = useMutation({
    ...trpc.google.disconnect.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Google disconnected successfully");
      setError(null);
      invalidateQueries();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to disconnect");
      setSuccessMessage(null);
    },
  });

  // Enable GA mutation
  const enableGAMutation = useMutation({
    ...trpc.google.enableService.mutationOptions(),
    onSuccess: (result) => {
      if (result.needsAuth && result.authUrl) {
        // Need to authenticate - redirect to Google
        window.location.href = result.authUrl;
      } else {
        // Already have permission, but need to select property
        // Open property selector with existing connection ID
        if (connectionData?.connection) {
          setGaSetupCode(connectionData.connection.id);
          setIsGAPropertySelectorOpen(true);
        }
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to enable Google Analytics");
    },
  });

  // Enable GMB mutation
  const enableGMBMutation = useMutation({
    ...trpc.google.enableService.mutationOptions(),
    onSuccess: (result) => {
      if (result.needsAuth && result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        // Already have permission, but need to select location
        if (connectionData?.connection) {
          setGmbSetupCode(connectionData.connection.id);
          setIsGMBLocationSelectorOpen(true);
        }
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to enable Google Business Profile");
    },
  });

  // Disable GA mutation
  const disableGAMutation = useMutation({
    ...trpc.google.disableService.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Google Analytics disabled");
      invalidateQueries();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to disable Google Analytics");
    },
  });

  // Disable GMB mutation
  const disableGMBMutation = useMutation({
    ...trpc.gmb.disconnect.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Google Business Profile disabled");
      invalidateQueries();
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to disable Google Business Profile");
    },
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.google.getConnection.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.google.getServiceStatuses.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.ga.getConnection.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.gmb.getConnection.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.analyticsDashboard.getConnectionStatus.queryKey(),
    });
  };

  const handleConnectGoogle = () => {
    if (gaOAuthUrlData?.url) {
      window.location.href = gaOAuthUrlData.url;
    }
  };

  const handleEnableGA = () => {
    enableGAMutation.mutate({
      service: "ga",
      redirectPath: "/settings?tab=google",
    });
  };

  const handleEnableGMB = () => {
    enableGMBMutation.mutate({
      service: "gmb",
      redirectPath: "/settings?tab=google",
    });
  };

  const handleDisableGA = () => {
    if (confirm("Are you sure you want to disable Google Analytics?")) {
      disableGAMutation.mutate({ service: "ga" });
    }
  };

  const handleDisableGMB = () => {
    if (confirm("Are you sure you want to disable Google Business Profile?")) {
      disableGMBMutation.mutate();
    }
  };

  const handleDisconnectGoogle = () => {
    if (
      confirm(
        "Are you sure you want to disconnect Google? This will disable all Google services."
      )
    ) {
      disconnectMutation.mutate();
    }
  };

  const handleGAPropertySelected = () => {
    setIsGAPropertySelectorOpen(false);
    setGaSetupCode(null);
    setSuccessMessage("Google Analytics connected successfully!");
    invalidateQueries();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleGMBLocationSelected = () => {
    setIsGMBLocationSelectorOpen(false);
    setGmbSetupCode(null);
    setSuccessMessage("Google Business Profile connected successfully!");
    invalidateQueries();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const connection = connectionData?.connection;
  const gaStatus = statusData?.statuses?.find((s) => s.service === "ga");
  const gmbStatus = statusData?.statuses?.find((s) => s.service === "gmb");

  const gaConnection = gaConnectionData?.connection;
  const gmbConnection = gmbConnectionData?.connection;

  const activeProperty = gaConnection?.properties?.find((p) => p.isActive);

  const isLoading = isLoadingConnection || isLoadingStatuses;

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div
          className={cn(
            "bg-success/10 border border-success/20 text-success",
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

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : connection && connection.status !== "disconnected" ? (
        // Connected state - show account info and service cards
        <div className="space-y-6">
          {/* Google Account Info */}
          <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border rounded-lg">
            {connection.googlePicture ? (
              <img
                src={connection.googlePicture}
                alt={connection.googleName || "Google Account"}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">
                  Connected
                </span>
              </div>
              <p className="font-medium text-foreground mt-1">
                {connection.googleName || "Google Account"}
              </p>
              <p className="text-sm text-muted-foreground">
                {connection.googleEmail}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnectGoogle}
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

          {/* Google Analytics Service Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    Google Analytics
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track website traffic, user behavior, and conversions
                  </p>

                  {gaStatus?.enabled && activeProperty ? (
                    // GA is enabled with a property selected
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-success font-medium">
                          Enabled
                        </span>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium text-foreground">
                          {activeProperty.propertyName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Property ID:{" "}
                          {activeProperty.propertyId.replace("properties/", "")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGaSetupCode(connection.id);
                            setIsGAPropertySelectorOpen(true);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Change Property
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDisableGA}
                          disabled={disableGAMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          Disable
                        </Button>
                        <Link
                          to="/analytics"
                          className="ml-auto text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          View Dashboard
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ) : gaStatus?.enabled ? (
                    // GA is enabled but no property selected
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <span className="text-warning font-medium">
                          Property Required
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select a GA4 property to start tracking.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setGaSetupCode(connection.id);
                          setIsGAPropertySelectorOpen(true);
                        }}
                      >
                        Select Property
                      </Button>
                    </div>
                  ) : (
                    // GA is not enabled
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={handleEnableGA}
                        disabled={enableGAMutation.isPending}
                      >
                        {enableGAMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <BarChart3 className="w-4 h-4 mr-2" />
                        )}
                        Enable Google Analytics
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Business Profile Service Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <GoogleBusinessIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">
                    Google Business Profile
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your business listing, posts, and reviews
                  </p>

                  {gmbStatus?.enabled && gmbConnection ? (
                    // GMB is enabled with a location selected
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-success font-medium">
                          Enabled
                        </span>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <p className="text-sm font-medium text-foreground">
                            {gmbConnection.gmbLocationName ||
                              "Business Location"}
                          </p>
                        </div>
                        {gmbConnection.locationData?.storefrontAddress && (
                          <p className="text-xs text-muted-foreground mt-1 ml-6">
                            {[
                              ...(gmbConnection.locationData.storefrontAddress
                                .addressLines || []),
                              gmbConnection.locationData.storefrontAddress
                                .locality,
                              gmbConnection.locationData.storefrontAddress
                                .administrativeArea,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                        {gmbConnection.locationData?.metadata?.mapsUri && (
                          <a
                            href={gmbConnection.locationData.metadata.mapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2 ml-6"
                          >
                            View on Google Maps
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setGmbSetupCode(connection.id);
                            setIsGMBLocationSelectorOpen(true);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Change Location
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDisableGMB}
                          disabled={disableGMBMutation.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          Disable
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // GMB is not enabled
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={handleEnableGMB}
                        disabled={enableGMBMutation.isPending}
                      >
                        {enableGMBMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <GoogleBusinessIcon className="w-4 h-4 mr-2" />
                        )}
                        Enable Google Business Profile
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Not connected state
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-6 bg-muted/30 border border-border rounded-lg">
            <div className="bg-muted p-3 rounded-lg">
              <GoogleIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground">
                Connect Your Google Account
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Connect to Google to enable analytics tracking and business
                profile management. You can choose which services to enable
                after connecting.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChart3 className="w-4 h-4" />
                  <span>Google Analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GoogleBusinessIcon className="w-4 h-4" />
                  <span>Google Business Profile</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleConnectGoogle}
              disabled={!gaOAuthUrlData?.url}
            >
              <GoogleIcon className="w-4 h-4 mr-2" />
              Connect Google Account
            </Button>
          </div>
        </div>
      )}

      {/* GA Property Selector Modal */}
      {gaSetupCode && isGAPropertySelectorOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <GAPropertySelector
              setupCode={gaSetupCode}
              onComplete={handleGAPropertySelected}
              onCancel={() => {
                setIsGAPropertySelectorOpen(false);
                setGaSetupCode(null);
              }}
            />
          </div>
        </div>
      )}

      {/* GMB Location Selector Modal */}
      {gmbSetupCode && (
        <GMBLocationSelector
          open={isGMBLocationSelectorOpen}
          onOpenChange={(open) => {
            setIsGMBLocationSelectorOpen(open);
            if (!open) setGmbSetupCode(null);
          }}
          setupCode={gmbSetupCode}
          onSuccess={handleGMBLocationSelected}
          onError={(err) => {
            setError(err);
            setIsGMBLocationSelectorOpen(false);
            setGmbSetupCode(null);
          }}
        />
      )}
    </div>
  );
};
