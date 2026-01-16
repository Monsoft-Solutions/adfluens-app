/**
 * Hashtags Section Component
 *
 * Hashtag input with AI-powered suggestions and visual feedback.
 */

import React from "react";
import { Loader2, Hash, Plus, X, Sparkles } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Badge,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import type { UseMutationResult } from "@tanstack/react-query";

type HashtagsSectionProps = {
  hashtags: string[];
  hashtagInput: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
  caption: string;
  suggestHashtagsMutation: UseMutationResult<string[], Error, void>;
};

export const HashtagsSection: React.FC<HashtagsSectionProps> = ({
  hashtags,
  hashtagInput,
  onInputChange,
  onAdd,
  onRemove,
  caption,
  suggestHashtagsMutation,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAdd();
    }
  };

  // Progress tracking
  const progressPercentage = (hashtags.length / 30) * 100;
  const isNearLimit = hashtags.length >= 25;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-primary" />
          <Label className="font-medium">Hashtags</Label>
          <span className="text-xs text-muted-foreground">(optional)</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => suggestHashtagsMutation.mutate()}
                disabled={!caption.trim() || suggestHashtagsMutation.isPending}
                className="h-8"
              >
                {suggestHashtagsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Suggesting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    AI Suggest
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {caption.trim()
                  ? "Generate hashtags based on your caption"
                  : "Write a caption first to enable suggestions"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Type a hashtag and press Enter..."
          value={hashtagInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={hashtags.length >= 30}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={onAdd}
                disabled={!hashtagInput.trim() || hashtags.length >= 30}
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add hashtag</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Hashtags display */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors group pr-1.5"
              onClick={() => onRemove(tag)}
            >
              #{tag}
              <X className="w-3 h-3 ml-1.5 opacity-50 group-hover:opacity-100" />
            </Badge>
          ))}
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden max-w-[100px]">
            <div
              className={cn(
                "h-full transition-all",
                isNearLimit ? "bg-warning" : "bg-primary"
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span
            className={cn(
              "text-xs",
              isNearLimit ? "text-warning" : "text-muted-foreground"
            )}
          >
            {hashtags.length}/30
          </span>
        </div>

        {hashtags.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Hashtags help increase reach
          </span>
        )}
      </div>
    </div>
  );
};
