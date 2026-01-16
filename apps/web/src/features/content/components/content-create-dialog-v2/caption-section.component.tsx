/**
 * Caption Section Component
 *
 * AI-powered caption generation and editing with color-coded character count.
 */

import React from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Label,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import type { UseMutationResult } from "@tanstack/react-query";

type CaptionSectionProps = {
  aiTopic: string;
  onAiTopicChange: (value: string) => void;
  caption: string;
  onCaptionChange: (value: string) => void;
  captionLength: number;
  maxLength: number;
  isTooLong: boolean;
  platforms: string[];
  generateCaptionMutation: UseMutationResult<
    Array<{ caption: string }>,
    Error,
    string
  >;
};

export const CaptionSection: React.FC<CaptionSectionProps> = ({
  aiTopic,
  onAiTopicChange,
  caption,
  onCaptionChange,
  captionLength,
  maxLength,
  isTooLong,
  platforms,
  generateCaptionMutation,
}) => {
  const handleGenerate = () => {
    generateCaptionMutation.mutate(aiTopic);
  };

  // Calculate progress percentage and color
  const progressPercentage = Math.min((captionLength / maxLength) * 100, 100);
  const getProgressColor = () => {
    if (isTooLong) return "bg-destructive";
    if (progressPercentage > 80) return "bg-warning";
    return "bg-success";
  };

  const getTextColor = () => {
    if (isTooLong) return "text-destructive";
    if (progressPercentage > 80) return "text-warning";
    return "text-success";
  };

  return (
    <div className="space-y-4">
      {/* AI Caption Generation */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          <Label className="font-medium">AI Caption Generator</Label>
          <span className="text-xs text-muted-foreground">(optional)</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Describe your post topic..."
            value={aiTopic}
            onChange={(e) => onAiTopicChange(e.target.value)}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={
                    !aiTopic.trim() || generateCaptionMutation.isPending
                  }
                >
                  {generateCaptionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate an engaging caption for your topic</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Caption Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Caption</Label>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium", getTextColor())}>
              {captionLength.toLocaleString()} / {maxLength.toLocaleString()}
            </span>
          </div>
        </div>

        <Textarea
          placeholder="Write your caption..."
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={4}
          className={cn(
            "resize-none transition-colors",
            isTooLong && "border-destructive focus-visible:ring-destructive"
          )}
        />

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all", getProgressColor())}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>

          {isTooLong && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
              Caption exceeds {maxLength.toLocaleString()} character limit for{" "}
              {platforms.join(", ")}
            </p>
          )}

          {!isTooLong && progressPercentage > 80 && (
            <p className="text-xs text-warning">Approaching character limit</p>
          )}
        </div>
      </div>
    </div>
  );
};
