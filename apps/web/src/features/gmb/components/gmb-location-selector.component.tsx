import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Building2,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";

type GMBLocationSelectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    scope?: string;
  };
  onSuccess: () => void;
  onError: (error: string) => void;
};

/**
 * Location Selector Modal
 *
 * After OAuth, allows user to select which GMB account and location to connect.
 */
export const GMBLocationSelector: React.FC<GMBLocationSelectorProps> = ({
  open,
  onOpenChange,
  tokens,
  onSuccess,
  onError,
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedAccountName, setSelectedAccountName] = useState<string | null>(
    null
  );
  const [selectedLocation, setSelectedLocation] = useState<{
    locationId: string;
    title: string;
  } | null>(null);

  // Fetch accounts
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
  } = useQuery({
    ...trpc.gmb.listAccounts.queryOptions({ accessToken: tokens.accessToken }),
    enabled: open,
  });

  // Fetch locations for selected account
  const {
    data: locationsData,
    isLoading: isLoadingLocations,
    error: locationsError,
  } = useQuery({
    ...trpc.gmb.listLocations.queryOptions({
      accessToken: tokens.accessToken,
      accountName: selectedAccountName || "",
    }),
    enabled: open && !!selectedAccountName,
  });

  // Save selection mutation
  const selectLocationMutation = useMutation({
    ...trpc.gmb.selectLocation.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.getConnection.queryKey(),
      });
      onSuccess();
    },
    onError: (err) => {
      onError(err.message || "Failed to save connection");
    },
  });

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedAccountName(null);
      setSelectedLocation(null);
    }
  }, [open]);

  const handleAccountSelect = (accountName: string) => {
    setSelectedAccountName(accountName);
    setSelectedLocation(null);
  };

  const handleLocationSelect = (locationId: string, title: string) => {
    setSelectedLocation({ locationId, title });
  };

  const handleConfirm = () => {
    if (!selectedAccountName || !selectedLocation) return;

    // Extract account ID from account name (accounts/123456789 -> 123456789)
    const gmbAccountId = selectedAccountName.replace("accounts/", "");

    selectLocationMutation.mutate({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresAt: tokens.expiresAt,
      scope: tokens.scope,
      gmbAccountId,
      gmbLocationId: selectedLocation.locationId,
      gmbLocationName: selectedLocation.title,
    });
  };

  const error = accountsError || locationsError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Business Location</DialogTitle>
          <DialogDescription>
            Choose the Google Business Profile location you want to connect.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            className={cn(
              "bg-destructive/10 border border-destructive/20 text-destructive",
              "px-4 py-3 rounded-lg flex items-center gap-3"
            )}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Step 1: Select Account */}
          {!selectedAccountName ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                Step 1: Select Account
              </h4>

              {isLoadingAccounts ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : accountsData?.accounts.length === 0 ? (
                <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
                  <Building2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No Google Business accounts found. Make sure you have access
                    to a Google Business Profile.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accountsData?.accounts.map((account) => (
                    <button
                      key={account.name}
                      onClick={() => handleAccountSelect(account.name)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border",
                        "bg-background hover:bg-muted/50 transition-colors",
                        "text-left"
                      )}
                    >
                      <div className="bg-primary/10 p-2 rounded">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {account.accountName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {account.type.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Select Location */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  Step 2: Select Location
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAccountName(null)}
                >
                  Back
                </Button>
              </div>

              {isLoadingLocations ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : locationsData?.locations.length === 0 ? (
                <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
                  <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No locations found for this account.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {locationsData?.locations.map((location) => (
                    <button
                      key={location.locationId}
                      onClick={() =>
                        handleLocationSelect(
                          location.locationId,
                          location.title
                        )
                      }
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border",
                        "bg-background hover:bg-muted/50 transition-colors",
                        "text-left",
                        selectedLocation?.locationId === location.locationId &&
                          "border-primary bg-primary/5"
                      )}
                    >
                      <div className="bg-primary/10 p-2 rounded">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {location.title}
                        </p>
                        {location.formattedAddress && (
                          <p className="text-xs text-muted-foreground truncate">
                            {location.formattedAddress}
                          </p>
                        )}
                      </div>
                      {selectedLocation?.locationId === location.locationId && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocation || selectLocationMutation.isPending}
          >
            {selectLocationMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Location"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
