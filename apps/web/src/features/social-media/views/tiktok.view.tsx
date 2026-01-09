/**
 * TikTok View
 *
 * Displays the TikTok profile data for the current organization.
 * Allows users to view and refresh their TikTok profile information.
 *
 * @module web/features/social-media/views/tiktok
 */

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Link as LinkIcon } from "lucide-react";
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
import { TiktokProfile } from "../components/tiktok-profile.component";
import { TiktokPostsGrid } from "../components/tiktok-posts-grid.component";

/**
 * TikTok icon component
 */
const TiktokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

/**
 * TikTok view component
 * Displays TikTok profile data with refresh capability
 */
export const TiktokView: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch TikTok account data
  const {
    data: accountData,
    isLoading,
    error: fetchError,
  } = useQuery({
    ...trpc.socialMedia.getAccount.queryOptions({ platform: "tiktok" }),
    enabled: !!organization,
  });

  // Fetch TikTok posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery({
    ...trpc.socialMedia.getTiktokPosts.queryOptions({ limit: 50 }),
    enabled: !!organization && !!accountData?.account,
  });

  // Refresh mutation
  const refreshMutation = useMutation({
    ...trpc.socialMedia.refreshAccount.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("TikTok profile refreshed successfully!");
      setError(null);
      // Invalidate both account and posts queries
      queryClient.invalidateQueries({
        queryKey: trpc.socialMedia.getAccount.queryKey({
          platform: "tiktok",
        }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.socialMedia.getTiktokPosts.queryKey({ limit: 50 }),
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to refresh TikTok profile");
      setSuccessMessage(null);
    },
  });

  const handleRefresh = () => {
    setError(null);
    setSuccessMessage(null);
    refreshMutation.mutate({ platform: "tiktok" });
  };

  // No organization state
  if (!organization) {
    return (
      <div className="animate-reveal">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
            <TiktokIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            No Organization Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            Please select or create an organization to view TikTok data.
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
          <div className="bg-foreground p-2 rounded-lg">
            <TiktokIcon className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
              TikTok
            </h1>
            <p className="text-muted-foreground">
              View and manage your TikTok profile data
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
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : accountData?.account ? (
        // Profile and Posts Display
        <div className="space-y-6">
          <TiktokProfile
            account={accountData.account}
            onRefresh={handleRefresh}
            isRefreshing={refreshMutation.isPending}
          />

          {/* Posts Grid */}
          <TiktokPostsGrid
            posts={postsData?.posts ?? null}
            isLoading={isLoadingPosts}
          />

          {/* Posts Error */}
          {postsError && (
            <div
              className={cn(
                "bg-destructive/10 border border-destructive/20 text-destructive",
                "px-4 py-3 rounded-lg flex items-center gap-3"
              )}
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>Failed to load posts: {postsError.message}</p>
            </div>
          )}
        </div>
      ) : (
        // No Data State
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-muted rounded-full p-4 w-fit mb-4">
              <TiktokIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>No TikTok Data</CardTitle>
            <CardDescription>
              Connect your TikTok account to see your profile data here.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Add your TikTok URL in Organization Settings to automatically
              fetch your profile data.
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
