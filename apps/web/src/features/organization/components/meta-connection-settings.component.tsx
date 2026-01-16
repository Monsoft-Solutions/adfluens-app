import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Unplug,
  RefreshCw,
  User,
  FileText,
} from "lucide-react";
import { Button, cn, Skeleton } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { MetaBusinessIcon } from "@/shared/components/icons/meta-business.icon";
import { MetaPageSelector } from "@/features/meta/components/meta-page-selector.component";

/**
 * Meta Connection Settings Component
 *
 * Displays Meta Business connection status and allows connecting/reconnecting/disconnecting.
 * Handles OAuth callback flow when redirected back from Meta.
 */
export const MetaConnectionSettings: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);
  const [setupCode, setSetupCode] = useState<string | null>(null);

  // Check for OAuth callback parameters
  useEffect(() => {
    const metaSetupCode = searchParams.get("meta_setup_code");
    const metaError = searchParams.get("meta_error");

    if (metaError) {
      setError(decodeURIComponent(metaError));
      // Clean up URL params
      searchParams.delete("meta_error");
      setSearchParams(searchParams, { replace: true });
    } else if (metaSetupCode) {
      // Store setup code and open page selector
      setSetupCode(metaSetupCode);
      setIsPageSelectorOpen(true);

      // Clean up URL params immediately
      searchParams.delete("meta_setup_code");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch Meta connection status
  const {
    data: connectionData,
    isLoading: isLoadingConnection,
    error: fetchError,
  } = useQuery({
    ...trpc.meta.getConnection.queryOptions(),
    enabled: !!organization,
  });

  // Get OAuth URL for connect/reconnect
  const { data: oauthUrlData, refetch: refetchOAuthUrl } = useQuery({
    ...trpc.meta.getOAuthUrl.queryOptions({ redirectPath: "/settings" }),
    enabled: !!organization,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    ...trpc.meta.disconnect.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Meta Business disconnected successfully");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: trpc.meta.getConnection.queryKey(),
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to disconnect");
      setSuccessMessage(null);
    },
  });

  const handleConnect = async () => {
    // Refetch OAuth URL to ensure it's fresh
    const result = await refetchOAuthUrl();
    if (result.data?.url) {
      window.location.href = result.data.url;
    }
  };

  const handleReconnect = async () => {
    // Same as connect - triggers new OAuth flow
    await handleConnect();
  };

  const handleDisconnect = () => {
    if (
      confirm(
        "Are you sure you want to disconnect Meta Business? This will remove all connected pages."
      )
    ) {
      disconnectMutation.mutate();
    }
  };

  const handlePagesSelected = () => {
    setIsPageSelectorOpen(false);
    setSetupCode(null);
    setSuccessMessage("Meta Business connected successfully!");
    queryClient.invalidateQueries({
      queryKey: trpc.meta.getConnection.queryKey(),
    });
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const connection = connectionData?.connection;
  const pages = connectionData?.pages || [];
  const isConnected = connectionData?.isConnected;
  const hasError = connection?.status === "error";

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

      {isLoadingConnection ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isConnected && connection ? (
        // Connected state
        <div className="space-y-4">
          {/* Connection Status */}
          <div
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg",
              hasError
                ? "bg-destructive/5 border border-destructive/20"
                : "bg-success/5 border border-success/20"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-lg",
                hasError ? "bg-destructive/10" : "bg-success/10"
              )}
            >
              {hasError ? (
                <AlertCircle className="w-6 h-6 text-destructive" />
              ) : (
                <CheckCircle className="w-6 h-6 text-success" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground">
                {hasError ? "Connection Error" : "Connected"}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {hasError
                  ? "Your Meta access token has expired or is invalid. Please reconnect to restore functionality."
                  : "Your organization is connected to Meta Business."}
              </p>
            </div>
          </div>

          {/* Connection Details */}
          {!hasError && (
            <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-3">
              {/* User Info */}
              {connection.metaUserName && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-foreground">
                    {connection.metaUserName}
                  </span>
                </div>
              )}

              {/* Pages Count */}
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-foreground">
                  {pages.length} {pages.length === 1 ? "page" : "pages"}{" "}
                  connected
                </span>
              </div>

              {/* Last Validated */}
              {connection.lastValidatedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    Last verified:{" "}
                    {new Date(connection.lastValidatedAt).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Connected Pages List */}
              {pages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Connected Pages:
                  </p>
                  <div className="space-y-1">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        className="text-sm text-foreground flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        {page.pageName}
                        {page.instagramUsername && (
                          <span className="text-muted-foreground">
                            (@{page.instagramUsername})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {hasError && connection.lastError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              <p className="font-medium">Error Details</p>
              <p className="mt-1">{connection.lastError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleReconnect}
              disabled={disconnectMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {hasError ? "Reconnect Now" : "Reconnect"}
            </Button>
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
              <MetaBusinessIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground">Not Connected</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Connect your Meta Business account to manage Facebook and
                Instagram pages directly from this app.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleConnect} disabled={!oauthUrlData?.url}>
              <MetaBusinessIcon className="w-4 h-4 mr-2" />
              Connect Meta Business
            </Button>
          </div>
        </div>
      )}

      {/* Page Selector Modal */}
      {setupCode && (
        <MetaPageSelector
          open={isPageSelectorOpen}
          onOpenChange={setIsPageSelectorOpen}
          setupCode={setupCode}
          onSuccess={handlePagesSelected}
          onError={(err) => {
            setError(err);
            setIsPageSelectorOpen(false);
            setSetupCode(null);
          }}
        />
      )}
    </div>
  );
};
