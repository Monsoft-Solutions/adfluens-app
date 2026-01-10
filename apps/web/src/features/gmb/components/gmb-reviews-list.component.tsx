import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Star, MessageSquareText, Loader2, RefreshCw } from "lucide-react";
import { Button, Skeleton } from "@repo/ui";
import { trpcClient } from "@/lib/trpc";
import { ErrorAlert } from "@/shared/components/error-alert.component";
import { LoadMoreButton } from "@/shared/components/load-more-button.component";
import { GMBReviewCard } from "./gmb-review-card.component";

/**
 * Reviews list component with pagination
 */
export const GMBReviewsList: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["gmb", "listReviews"],
    queryFn: ({ pageParam }) =>
      trpcClient.gmb.listReviews.query({ pageSize: 20, pageToken: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert
        message={`Failed to load reviews: ${error.message}`}
        onRetry={() => refetch()}
      />
    );
  }

  // Flatten all pages into a single reviews array
  const reviews = data?.pages.flatMap((page) => page.reviews) || [];
  // Get stats from the first page (they're the same across all pages)
  const firstPage = data?.pages[0];

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {firstPage?.averageRating !== undefined && (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-lg">
                {firstPage.averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-sm">
                ({firstPage.totalReviewCount || 0} reviews)
              </span>
            </div>
          )}
        </div>
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

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquareText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Reviews Yet
          </h3>
          <p className="text-muted-foreground">
            When customers leave reviews on your Google Business Profile,
            they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <GMBReviewCard key={review.reviewId} review={review} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <LoadMoreButton
          onClick={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
          label="Load More Reviews"
        />
      )}
    </div>
  );
};
