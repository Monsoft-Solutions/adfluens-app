/**
 * Media Preview Component
 *
 * Grid of selected media with remove functionality.
 */

import { X, ImageIcon } from "lucide-react";
import { Label, Badge } from "@repo/ui";
import type { GeneratedImage } from "./content-create-dialog.types";

type MediaPreviewProps = {
  mediaUrls: string[];
  onRemoveMediaUrl: (url: string) => void;
  generatedImages: GeneratedImage[];
};

export function MediaPreview({
  mediaUrls,
  onRemoveMediaUrl,
  generatedImages,
}: MediaPreviewProps) {
  if (mediaUrls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <Label className="text-sm font-medium">
        Selected Images ({mediaUrls.length}/10)
      </Label>
      <div className="grid grid-cols-4 gap-2">
        {mediaUrls.map((url, index) => (
          <MediaPreviewItem
            key={url}
            url={url}
            index={index}
            onRemove={() => onRemoveMediaUrl(url)}
            isAiGenerated={generatedImages.some((g) => g.storedUrl === url)}
          />
        ))}
      </div>
    </div>
  );
}

type MediaPreviewItemProps = {
  url: string;
  index: number;
  onRemove: () => void;
  isAiGenerated: boolean;
};

function MediaPreviewItem({
  url,
  index,
  onRemove,
  isAiGenerated,
}: MediaPreviewItemProps) {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 group">
      <img
        src={url}
        alt={`Media ${index + 1}`}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-1.5 bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
      >
        <X className="w-3 h-3" />
      </button>
      {isAiGenerated && (
        <Badge
          variant="secondary"
          className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5"
        >
          AI
        </Badge>
      )}
    </div>
  );
}

type MediaEmptyStateProps = {
  mediaTab: "url" | "upload" | "ai";
};

export function MediaEmptyState({ mediaTab }: MediaEmptyStateProps) {
  const messages = {
    url: {
      title: "No images added yet",
      subtitle: "Paste an image URL above to get started",
    },
    upload: {
      title: "No images added yet",
      subtitle: "Drag and drop images or click the upload area above",
    },
    ai: {
      title: "No images generated yet",
      subtitle: "Describe your idea and generate AI images above",
    },
  };

  const { title, subtitle } = messages[mediaTab];

  return (
    <div className="text-center py-6 text-muted-foreground">
      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{title}</p>
      <p className="text-xs">{subtitle}</p>
    </div>
  );
}
