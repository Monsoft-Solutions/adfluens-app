/**
 * Content Post Card
 *
 * Displays a single content post with status, preview, and actions.
 */

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Send,
  MoreVertical,
  ExternalLink,
  Pencil,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@repo/ui";
import { trpcClient, useTRPC } from "@/lib/trpc";
import { ContentEditDialog } from "./content-edit-dialog/content-edit-dialog.component";

// Content post type based on the API response
type ContentPostMedia = {
  url: string;
  storedUrl?: string;
  source: "upload" | "fal_generated" | "url";
};

type ContentPublishResult = {
  id: string;
  platform: string;
  accountName: string;
  success: boolean;
  platformPostId?: string | null;
  permalink?: string | null;
  error?: string | null;
  publishedAt?: string | null;
};

type ContentPostAccount = {
  id: string;
  status: "draft" | "pending" | "published" | "failed";
  platformConnection: {
    id: string;
    platform: string;
    accountName: string;
  };
  publishResult?: ContentPublishResult | null;
};

type ContentPost = {
  id: string;
  organizationId: string;
  platforms: string[];
  caption: string;
  hashtags: string[] | null;
  media: ContentPostMedia[];
  status: "draft" | "pending" | "published" | "failed";
  accounts?: ContentPostAccount[];
  lastError: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

type ContentPostCardProps = {
  post: ContentPost;
  onUpdate?: () => void;
};

const statusConfig = {
  draft: {
    label: "Draft",
    icon: Clock,
    variant: "secondary" as const,
  },
  pending: {
    label: "Publishing...",
    icon: Loader2,
    variant: "outline" as const,
  },
  published: {
    label: "Published",
    icon: CheckCircle,
    variant: "default" as const,
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    variant: "destructive" as const,
  },
};

const platformLabels: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  gmb: "Google Business",
  linkedin: "LinkedIn",
  twitter: "Twitter",
};

export const ContentPostCard: React.FC<ContentPostCardProps> = ({
  post,
  onUpdate,
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const status = statusConfig[post.status];
  const StatusIcon = status.icon;

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: () => trpcClient.content.publish.mutate({ postId: post.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() });
      onUpdate?.();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => trpcClient.content.delete.mutate({ postId: post.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() });
      setIsDeleteDialogOpen(false);
      onUpdate?.();
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: () => trpcClient.content.duplicate.mutate({ postId: post.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.content.list.queryKey() });
      toast.success("Post duplicated", {
        description: "A copy of the post has been created as a draft.",
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error("Failed to duplicate post", {
        description: error.message,
      });
    },
  });

  // Get first media item for preview
  const firstMedia = post.media[0];
  const mediaUrl = firstMedia?.storedUrl || firstMedia?.url;

  return (
    <>
      <Card className="overflow-hidden group hover:shadow-md transition-shadow">
        {/* Media Preview */}
        {mediaUrl && (
          <div className="aspect-square relative overflow-hidden bg-muted">
            <img
              src={mediaUrl}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
            {post.media.length > 1 && (
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
              >
                +{post.media.length - 1}
              </Badge>
            )}
          </div>
        )}

        <CardContent className="p-4 space-y-3">
          {/* Status and Platforms */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon
                  className={cn(
                    "w-3 h-3",
                    post.status === "pending" && "animate-spin"
                  )}
                />
                {status.label}
              </Badge>
            </div>
            <div className="flex gap-1">
              {post.platforms.map((platform) => (
                <Badge key={platform} variant="outline" className="text-xs">
                  {platformLabels[platform] || platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* Caption Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.caption}
          </p>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <p className="text-xs text-primary line-clamp-1">
              {post.hashtags
                .slice(0, 5)
                .map((tag) => `#${tag}`)
                .join(" ")}
              {post.hashtags.length > 5 && ` +${post.hashtags.length - 5}`}
            </p>
          )}

          {/* Error Message */}
          {post.status === "failed" && post.lastError && (
            <p className="text-xs text-destructive line-clamp-2">
              {post.lastError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>

            <div className="flex items-center gap-2">
              {post.status === "draft" && (
                <Button
                  size="sm"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  {publishMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  Publish
                </Button>
              )}

              {post.status === "published" &&
                post.accounts &&
                post.accounts.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {post.accounts
                        .filter((acc) => acc.publishResult?.permalink)
                        .map((account) => (
                          <DropdownMenuItem key={account.id} asChild>
                            <a
                              href={account.publishResult!.permalink!}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {platformLabels[
                                account.publishResult!.platform
                              ] || account.publishResult!.platform}
                              {` - ${account.publishResult!.accountName}`}
                            </a>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Edit - only for draft posts */}
                  {post.status === "draft" && (
                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}

                  {/* Duplicate - available for all posts */}
                  <DropdownMenuItem
                    onClick={() => duplicateMutation.mutate()}
                    disabled={duplicateMutation.isPending}
                  >
                    {duplicateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Duplicate
                  </DropdownMenuItem>

                  {/* Delete - only for non-published posts */}
                  {post.status !== "published" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The post will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {post.status === "draft" && (
        <ContentEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          post={post}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
};
