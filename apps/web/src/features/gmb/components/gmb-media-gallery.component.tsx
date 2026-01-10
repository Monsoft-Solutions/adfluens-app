import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image, Plus, Filter } from "lucide-react";
import {
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { GMBMediaCard } from "./gmb-media-card.component";
import { GMBUploadMediaDialog } from "./gmb-upload-media-dialog.component";
import type { GMBMediaCategory } from "@repo/types/gmb/gmb-media.type";
import { GMB_CATEGORY_LABELS } from "../utils/gmb.constants";

/**
 * GMB Media Gallery Component
 *
 * Displays a grid of photos with category filtering and upload capability.
 */
export const GMBMediaGallery: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    GMBMediaCategory | "ALL"
  >("ALL");

  const {
    data: mediaData,
    isLoading,
    isError,
  } = useQuery(trpc.gmb.listMedia.queryOptions({}));

  const deleteMutation = useMutation({
    ...trpc.gmb.deleteMedia.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.gmb.listMedia.queryKey(),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Image className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Failed to load photos
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          There was an error loading your business photos.
        </p>
        <Button
          variant="outline"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: trpc.gmb.listMedia.queryKey(),
            })
          }
        >
          Try Again
        </Button>
      </div>
    );
  }

  const mediaItems = mediaData?.mediaItems || [];

  // Get unique categories from media items
  const availableCategories = [
    ...new Set(mediaItems.map((item) => item.category)),
  ];

  // Filter by category
  const filteredItems =
    categoryFilter === "ALL"
      ? mediaItems
      : mediaItems.filter((item) => item.category === categoryFilter);

  const handleDelete = (mediaName: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      deleteMutation.mutate({ mediaName });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Business Photos
          </h2>
          {mediaData?.totalMediaItemCount && (
            <span className="text-sm text-muted-foreground">
              ({mediaData.totalMediaItemCount} total)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as GMBMediaCategory | "ALL")
            }
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {GMB_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <Image className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {categoryFilter === "ALL"
              ? "No photos yet"
              : `No ${GMB_CATEGORY_LABELS[categoryFilter].toLowerCase()} photos`}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add photos to help customers see your business.
          </p>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </div>
      )}

      {/* Media Grid */}
      {filteredItems.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <GMBMediaCard
              key={item.name}
              media={item}
              onDelete={() => handleDelete(item.name)}
              isDeleting={
                deleteMutation.isPending &&
                deleteMutation.variables?.mediaName === item.name
              }
            />
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <GMBUploadMediaDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </div>
  );
};
