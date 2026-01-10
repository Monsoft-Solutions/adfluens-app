import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, MessageSquare, Trash2, Loader2, User } from "lucide-react";
import { Button, cn, Textarea } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import type { GMBReview } from "@repo/types/gmb/gmb-review.type";

type GMBReviewCardProps = {
  review: GMBReview;
};

const StarRating: React.FC<{ rating: GMBReview["starRating"] }> = ({
  rating,
}) => {
  const numStars = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  }[rating];

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= numStars
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
};

/**
 * Individual review card component
 */
export const GMBReviewCard: React.FC<GMBReviewCardProps> = ({ review }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  // Reply mutation
  const replyMutation = useMutation({
    ...trpc.gmb.replyToReview.mutationOptions(),
    onSuccess: () => {
      setIsReplying(false);
      setReplyText("");
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.listReviews.queryKey(),
      });
    },
  });

  // Delete reply mutation
  const deleteReplyMutation = useMutation({
    ...trpc.gmb.deleteReviewReply.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.listReviews.queryKey(),
      });
    },
  });

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;

    replyMutation.mutate({
      reviewId: review.reviewId,
      comment: replyText.trim(),
    });
  };

  const handleDeleteReply = () => {
    if (confirm("Are you sure you want to delete this reply?")) {
      deleteReplyMutation.mutate({ reviewId: review.reviewId });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Review Header */}
      <div className="flex items-start gap-3">
        {review.reviewer.profilePhotoUrl ? (
          <img
            src={review.reviewer.profilePhotoUrl}
            alt={review.reviewer.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">
              {review.reviewer.isAnonymous
                ? "Anonymous"
                : review.reviewer.displayName}
            </span>
            <StarRating rating={review.starRating} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(review.createTime)}
          </p>
        </div>
      </div>

      {/* Review Comment */}
      {review.comment && (
        <p className="text-sm text-foreground leading-relaxed">
          {review.comment}
        </p>
      )}

      {/* Existing Reply */}
      {review.reviewReply && (
        <div className="bg-muted/30 border border-border rounded-lg p-3 ml-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary">Your Reply</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {formatDate(review.reviewReply.updateTime)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteReply}
                disabled={deleteReplyMutation.isPending}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                {deleteReplyMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-foreground">
            {review.reviewReply.comment}
          </p>
        </div>
      )}

      {/* Reply Form */}
      {!review.reviewReply && (
        <div className="pt-2 border-t border-border">
          {isReplying ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Write your reply..."
                value={replyText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReplyText(e.target.value)
                }
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyText("");
                  }}
                  disabled={replyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reply"
                  )}
                </Button>
              </div>
              {replyMutation.error && (
                <p className="text-xs text-destructive">
                  {replyMutation.error.message}
                </p>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(true)}
              className="text-primary"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
