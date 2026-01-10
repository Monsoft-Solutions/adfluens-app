import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  MessageSquare,
  Trash2,
  Loader2,
  User,
  Sparkles,
} from "lucide-react";
import {
  Button,
  cn,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import type { GMBReview, GMBReplyTone } from "@repo/types/gmb/gmb-review.type";
import { starRatingToNumber, formatGMBDate } from "../utils/gmb.utils";

type GMBReviewCardProps = {
  review: GMBReview;
};

const StarRating: React.FC<{ rating: GMBReview["starRating"] }> = ({
  rating,
}) => {
  const numStars = starRatingToNumber(rating);

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
 * Sentiment badge based on star rating
 */
const SentimentBadge: React.FC<{ rating: GMBReview["starRating"] }> = ({
  rating,
}) => {
  const numStars = starRatingToNumber(rating);

  if (numStars >= 4) {
    return (
      <Badge
        variant="default"
        className="bg-success/10 text-success border-success/20 text-xs"
      >
        Positive
      </Badge>
    );
  }
  if (numStars <= 2) {
    return (
      <Badge
        variant="default"
        className="bg-destructive/10 text-destructive border-destructive/20 text-xs"
      >
        Negative
      </Badge>
    );
  }
  return (
    <Badge
      variant="default"
      className="bg-warning/10 text-warning border-warning/20 text-xs"
    >
      Neutral
    </Badge>
  );
};

/**
 * Individual review card component with AI suggestions
 */
export const GMBReviewCard: React.FC<GMBReviewCardProps> = ({ review }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedTone, setSelectedTone] =
    useState<GMBReplyTone>("professional");

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

  // AI suggestion mutation
  const suggestReplyMutation = useMutation({
    ...trpc.gmb.generateReplySuggestion.mutationOptions(),
    onSuccess: (data) => {
      setReplyText(data.suggestion);
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

  const handleSuggestReply = () => {
    suggestReplyMutation.mutate({
      reviewId: review.reviewId,
      tone: selectedTone,
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
            <SentimentBadge rating={review.starRating} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatGMBDate(review.createTime)}
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
                {formatGMBDate(review.reviewReply.updateTime)}
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
              {/* AI Suggestion Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={selectedTone}
                  onValueChange={(value) =>
                    setSelectedTone(value as GMBReplyTone)
                  }
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestReply}
                  disabled={suggestReplyMutation.isPending}
                  className="h-8 text-xs"
                >
                  {suggestReplyMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Suggest
                    </>
                  )}
                </Button>
                {suggestReplyMutation.error && (
                  <span className="text-xs text-destructive">
                    Failed to generate suggestion
                  </span>
                )}
              </div>

              <Textarea
                placeholder="Write your reply or use AI to suggest one..."
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
