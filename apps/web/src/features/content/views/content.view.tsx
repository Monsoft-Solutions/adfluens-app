/**
 * Content View
 *
 * Standalone content management view for creating and managing posts
 * across all supported platforms.
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, PenSquare, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { ContentPostCard } from "../components/content-post-card.component";
import { ContentCreateDialogV2 } from "../components/content-create-dialog-v2";

type Platform =
  | "all"
  | "facebook"
  | "instagram"
  | "gmb"
  | "linkedin"
  | "twitter";

const platformTabs: { value: Platform; label: string }[] = [
  { value: "all", label: "All Platforms" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "gmb", label: "Google Business" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "X / Twitter" },
];

const statusOptions = [
  { value: "all", label: "All Posts" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

export const ContentView: React.FC = () => {
  const trpc = useTRPC();
  const [platformFilter, setPlatformFilter] = useState<Platform>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch posts
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useQuery({
    ...trpc.content.list.queryOptions({
      platform:
        platformFilter !== "all"
          ? (platformFilter as
              | "facebook"
              | "instagram"
              | "gmb"
              | "linkedin"
              | "twitter")
          : undefined,
      status:
        statusFilter !== "all"
          ? (statusFilter as "draft" | "pending" | "published" | "failed")
          : undefined,
      limit: 50,
    }),
  });

  // Fetch connected accounts summary
  const { data: accountsSummary, isLoading: isLoadingAccounts } = useQuery({
    ...trpc.platformConnection.getSummary.queryOptions(),
  });

  const posts = postsData?.posts || [];
  const hasConnectedAccounts =
    accountsSummary &&
    (accountsSummary.facebook.count > 0 ||
      accountsSummary.instagram.count > 0 ||
      accountsSummary.gmb.count > 0 ||
      accountsSummary.linkedin.count > 0 ||
      accountsSummary.twitter.count > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <PenSquare className="w-6 h-6 text-primary" />
            Content Studio
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage content across all your connected platforms
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={!hasConnectedAccounts}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Connected Accounts Status */}
      {isLoadingAccounts ? (
        <Skeleton className="h-16 w-full" />
      ) : !hasConnectedAccounts ? (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-amber-500" />
              <div>
                <p className="font-medium text-foreground">
                  No Connected Accounts
                </p>
                <p className="text-sm text-muted-foreground">
                  Connect your social media accounts to start creating and
                  publishing content. Go to Meta Business or Google Business
                  sections to connect your pages.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {accountsSummary.facebook.count +
                    accountsSummary.instagram.count +
                    accountsSummary.gmb.count +
                    accountsSummary.linkedin.count +
                    accountsSummary.twitter.count}{" "}
                  connected accounts
                </span>
                {" — "}
                {accountsSummary.facebook.count > 0 &&
                  `${accountsSummary.facebook.count} Facebook, `}
                {accountsSummary.instagram.count > 0 &&
                  `${accountsSummary.instagram.count} Instagram, `}
                {accountsSummary.gmb.count > 0 &&
                  `${accountsSummary.gmb.count} GMB, `}
                {accountsSummary.linkedin.count > 0 &&
                  `${accountsSummary.linkedin.count} LinkedIn, `}
                {accountsSummary.twitter.count > 0 &&
                  `${accountsSummary.twitter.count} Twitter`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Tabs */}
      <Tabs
        value={platformFilter}
        onValueChange={(v) => setPlatformFilter(v as Platform)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList>
            {platformTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchPosts()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Tabs>

      {/* Posts Grid */}
      {isLoadingPosts ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center">
              <PenSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {platformFilter !== "all"
                  ? `No ${platformTabs.find((t) => t.value === platformFilter)?.label} Posts`
                  : "No Posts Yet"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                {hasConnectedAccounts
                  ? "Create your first content post to publish across your connected social media accounts."
                  : "Connect your social media accounts first, then start creating content."}
              </p>
              {hasConnectedAccounts && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ContentPostCard
              key={post.id}
              post={post}
              onUpdate={refetchPosts}
            />
          ))}
        </div>
      )}

      {/* Create Dialog V2 */}
      <ContentCreateDialogV2
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          refetchPosts();
        }}
      />
    </div>
  );
};
