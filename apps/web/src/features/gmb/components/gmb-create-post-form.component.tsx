import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, X, Plus, Image as ImageIcon } from "lucide-react";
import {
  Button,
  Textarea,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  cn,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";

const CALL_TO_ACTION_TYPES = [
  { value: "BOOK", label: "Book" },
  { value: "ORDER", label: "Order" },
  { value: "SHOP", label: "Shop" },
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "GET_OFFER", label: "Get Offer" },
  { value: "CALL", label: "Call" },
] as const;

/**
 * Form for creating a new GMB post
 */
export const GMBCreatePostForm: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [ctaType, setCtaType] = useState<string>("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");

  const createMutation = useMutation({
    ...trpc.gmb.createPost.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.listPosts.queryKey(),
      });
      resetForm();
      setIsOpen(false);
    },
  });

  const resetForm = () => {
    setSummary("");
    setCtaType("");
    setCtaUrl("");
    setMediaUrls([]);
    setNewMediaUrl("");
  };

  const handleAddMedia = () => {
    if (newMediaUrl.trim() && mediaUrls.length < 10) {
      setMediaUrls([...mediaUrls, newMediaUrl.trim()]);
      setNewMediaUrl("");
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!summary.trim()) return;

    createMutation.mutate({
      summary: summary.trim(),
      topicType: "STANDARD",
      callToAction:
        ctaType && ctaUrl
          ? {
              actionType:
                ctaType as (typeof CALL_TO_ACTION_TYPES)[number]["value"],
              url: ctaUrl,
            }
          : undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Create a new post for your Google Business Profile.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Post Content</Label>
            <Textarea
              id="summary"
              placeholder="Write your post content here..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              maxLength={1500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {summary.length}/1500
            </p>
          </div>

          {/* Media URLs */}
          <div className="space-y-2">
            <Label>Images (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter image URL"
                value={newMediaUrl}
                onChange={(e) => setNewMediaUrl(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMedia}
                disabled={!newMediaUrl.trim() || mediaUrls.length >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {mediaUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span className="max-w-32 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call to Action */}
          <div className="space-y-2">
            <Label>Call to Action (optional)</Label>
            <div className="flex gap-2">
              <Select value={ctaType} onValueChange={setCtaType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CALL_TO_ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="URL"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                disabled={!ctaType}
                className="flex-1"
              />
            </div>
          </div>

          {/* Error */}
          {createMutation.error && (
            <div
              className={cn(
                "bg-destructive/10 border border-destructive/20 text-destructive",
                "px-3 py-2 rounded text-sm"
              )}
            >
              {createMutation.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!summary.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
