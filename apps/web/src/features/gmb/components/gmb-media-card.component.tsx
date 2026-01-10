import React from "react";
import { Eye, Trash2, Loader2 } from "lucide-react";
import { Button, Badge } from "@repo/ui";
import type { GMBMediaItem } from "@repo/types/gmb/gmb-media.type";
import { GMB_CATEGORY_LABELS } from "../utils/gmb.constants";
import { formatGMBDate } from "../utils/gmb.utils";

type Props = {
  media: GMBMediaItem;
  onDelete: () => void;
  isDeleting: boolean;
};

/**
 * GMB Media Card Component
 *
 * Displays a single photo with view count, category, and delete option.
 */
export const GMBMediaCard: React.FC<Props> = ({
  media,
  onDelete,
  isDeleting,
}) => {
  const viewCount = media.insights?.viewCount
    ? parseInt(media.insights.viewCount, 10)
    : 0;

  return (
    <div className="group relative bg-card border border-border rounded-lg overflow-hidden">
      {/* Image */}
      <div className="aspect-square relative">
        <img
          src={media.thumbnailUrl || media.googleUrl}
          alt={media.description || "Business photo"}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <a
            href={media.googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Eye className="w-5 h-5 text-white" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 bg-white/10 hover:bg-red-500/50 rounded-full transition-colors"
          >
            {isDeleting ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>

        {/* Category Badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-xs bg-black/60 text-white border-none"
        >
          {GMB_CATEGORY_LABELS[media.category]}
        </Badge>

        {/* View Count */}
        {viewCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
            <Eye className="w-3 h-3" />
            {viewCount.toLocaleString()}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2">
        <p className="text-xs text-muted-foreground truncate">
          {media.description || formatGMBDate(media.createTime)}
        </p>
      </div>
    </div>
  );
};
