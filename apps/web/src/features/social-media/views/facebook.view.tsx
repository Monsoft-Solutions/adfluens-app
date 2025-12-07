/**
 * Facebook View
 *
 * Displays the Facebook page data for the current organization.
 * Allows users to view and refresh their Facebook page information.
 *
 * @module web/features/social-media/views/facebook
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Facebook, AlertCircle, Link as LinkIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  cn,
} from "@repo/ui";
import { FacebookProfile } from "../components/facebook-profile.component";

/**
 * Facebook view component
 * Displays Facebook page data with refresh capability
 */
export const FacebookView: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch Facebook account data
  const {
    data: accountData,
    isLoading,
    error: fetchError,
  } = useQuery({
    ...trpc.socialMedia.getAccount.queryOptions({ platform: "facebook" }),
    enabled: !!organization,
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    ...trpc.socialMedia.refreshAccount.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Facebook page refreshed successfully!");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: trpc.socialMedia.getAccount.queryKey({
          platform: "facebook",
        }),
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to refresh Facebook page");
      setSuccessMessage(null);
    },
  });

  const handleRefresh = () => {
    setError(null);
    setSuccessMessage(null);
    refreshMutation.mutate({ platform: "facebook" });
  };

  // No organization state
  if (!organization) {
    return (
      <div className="animate-reveal">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
            <Facebook className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            No Organization Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            Please select or create an organization to view Facebook data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-reveal">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Facebook className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
              Facebook
            </h1>
            <p className="text-muted-foreground">
              View and manage your Facebook page data
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          className={cn(
            "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
          )}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {(error || fetchError) && (
        <div
          className={cn(
            "bg-destructive/10 border border-destructive/20 text-destructive",
            "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
          )}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error || fetchError?.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Cover photo skeleton */}
          <Skeleton className="w-full h-48 rounded-lg" />
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : accountData?.account ? (
        // Profile Display
        <FacebookProfile
          account={accountData.account}
          onRefresh={handleRefresh}
          isRefreshing={refreshMutation.isPending}
        />
      ) : (
        // No Data State
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
              <Facebook className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>No Facebook Data</CardTitle>
            <CardDescription>
              Connect your Facebook page to see your profile data here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Add your Facebook page URL in Organization Settings to
              automatically fetch your page data.
            </p>
            <Button asChild>
              <NavLink to="/settings">
                <LinkIcon className="w-4 h-4 mr-2" />
                Go to Settings
              </NavLink>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
