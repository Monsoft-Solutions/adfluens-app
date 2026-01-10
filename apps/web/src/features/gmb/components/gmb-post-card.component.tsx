import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ExternalLink,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";
import { Button, Badge, cn } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import type { GMBPost } from "@repo/types/gmb/gmb-post.type";

type GMBPostCardProps = {
  post: GMBPost;
};

const PostStateBadge: React.FC<{ state: GMBPost["state"] }> = ({ state }) => {
  const config = {
    LIVE: {
      icon: CheckCircle,
      label: "Live",
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    PROCESSING: {
      icon: Clock,
      label: "Processing",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    REJECTED: {
      icon: XCircle,
      label: "Rejected",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  }[state];

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

/**
 * Individual post card component
 */
export const GMBPostCard: React.FC<GMBPostCardProps> = ({ post }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...trpc.gmb.deletePost.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.listPosts.queryKey(),
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate({ postName: post.name });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Post Media */}
      {post.media && post.media.length > 0 && post.media[0] && (
        <div className="aspect-video bg-muted relative">
          {post.media[0].mediaFormat === "PHOTO" ? (
            <img
              src={post.media[0].sourceUrl}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {post.media.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              +{post.media.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Post Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <PostStateBadge state={post.state} />
            <Badge variant="outline" className="capitalize">
              {post.topicType.toLowerCase()}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Summary */}
        <p className="text-sm text-foreground line-clamp-3">{post.summary}</p>

        {/* Call to Action */}
        {post.callToAction && (
          <div className="pt-2">
            <a
              href={post.callToAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {post.callToAction.actionType.replace("_", " ")}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(post.createTime)}</span>
        </div>

        {/* Delete Error */}
        {deleteMutation.error && (
          <p className="text-xs text-destructive">
            {deleteMutation.error.message}
          </p>
        )}
      </div>
    </div>
  );
};
