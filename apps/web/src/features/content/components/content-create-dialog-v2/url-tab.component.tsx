/**
 * URL Tab Component
 *
 * Input for adding media from URL.
 */

import { Loader2, Plus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";

type UrlTabProps = {
  mediaUrlInput: string;
  onMediaUrlInputChange: (value: string) => void;
  onAddMediaUrl: () => void;
  isUploadingMedia: boolean;
};

export function UrlTab({
  mediaUrlInput,
  onMediaUrlInputChange,
  onAddMediaUrl,
  isUploadingMedia,
}: UrlTabProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAddMediaUrl();
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">
        Paste an image URL to add it to your post
      </Label>
      <div className="flex gap-2">
        <Input
          placeholder="https://example.com/image.jpg"
          value={mediaUrlInput}
          onChange={(e) => onMediaUrlInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={onAddMediaUrl}
                disabled={isUploadingMedia || !mediaUrlInput.trim()}
              >
                {isUploadingMedia ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add image from URL</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
