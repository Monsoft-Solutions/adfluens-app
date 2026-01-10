import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, RefreshCw } from "lucide-react";
import { Button, Skeleton } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { ErrorAlert } from "@/shared/components/error-alert.component";
import { LoadMoreButton } from "@/shared/components/load-more-button.component";
import { GMBPostCard } from "./gmb-post-card.component";
import { GMBCreatePostForm } from "./gmb-create-post-form.component";

/**
 * Posts list component with create functionality
 */
export const GMBPostsList: React.FC = () => {
  const trpc = useTRPC();
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);

  const { data, isLoading, error, refetch, isRefetching, isFetching } =
    useQuery({
      ...trpc.gmb.listPosts.queryOptions({ pageSize: 20, pageToken }),
    });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert
        message={`Failed to load posts: ${error.message}`}
        onRetry={() => refetch()}
      />
    );
  }

  const posts = data?.posts || [];
  const hasMore = !!data?.nextPageToken;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <GMBCreatePostForm />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Posts Yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first post to engage with customers on Google.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <GMBPostCard key={post.name} post={post} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <LoadMoreButton
          onClick={() => setPageToken(data?.nextPageToken)}
          isLoading={isFetching}
          label="Load More Posts"
        />
      )}
    </div>
  );
};
