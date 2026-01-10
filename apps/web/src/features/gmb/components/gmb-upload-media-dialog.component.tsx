import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, ImagePlus, X } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import type { GMBMediaCategory } from "@repo/types/gmb/gmb-media.type";
import { GMB_CATEGORY_OPTIONS } from "../utils/gmb.constants";
import { isValidUrl } from "../utils/gmb.utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * GMB Upload Media Dialog Component
 *
 * Dialog for uploading new photos via URL.
 */
export const GMBUploadMediaDialog: React.FC<Props> = ({
  open,
  onOpenChange,
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [sourceUrl, setSourceUrl] = useState("");
  const [category, setCategory] = useState<GMBMediaCategory>("ADDITIONAL");
  const [description, setDescription] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const uploadMutation = useMutation({
    ...trpc.gmb.uploadMedia.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.listMedia.queryKey(),
      });
      handleClose();
    },
  });

  const handleClose = () => {
    setSourceUrl("");
    setCategory("ADDITIONAL");
    setDescription("");
    setPreviewError(false);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) return;

    uploadMutation.mutate({
      sourceUrl: sourceUrl.trim(),
      category,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="w-5 h-5" />
            Add Photo
          </DialogTitle>
          <DialogDescription>
            Add a photo to your Google Business Profile from a URL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Image URL</Label>
            <Input
              id="sourceUrl"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={sourceUrl}
              onChange={(e) => {
                setSourceUrl(e.target.value);
                setPreviewError(false);
              }}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter a direct URL to a publicly accessible image
            </p>
          </div>

          {/* Image Preview */}
          {sourceUrl && isValidUrl(sourceUrl) && (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border">
              {previewError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <X className="w-8 h-8 mb-2" />
                  <p className="text-sm">Failed to load preview</p>
                </div>
              ) : (
                <img
                  src={sourceUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={() => setPreviewError(true)}
                />
              )}
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as GMBMediaCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GMB_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the photo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          {/* Error Message */}
          {uploadMutation.error && (
            <p className="text-sm text-destructive">
              {uploadMutation.error.message || "Failed to upload photo"}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!sourceUrl.trim() || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
