/**
 * Caption Section Component
 *
 * AI-powered caption generation and editing.
 */

import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button, Input, Textarea, Label, cn } from "@repo/ui";
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

  return (
    <>
      {/* AI Caption Generation */}
      <div className="space-y-2">
        <Label>AI Caption Generator</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Describe your post topic..."
            value={aiTopic}
            onChange={(e) => onAiTopicChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerate}
            disabled={!aiTopic.trim() || generateCaptionMutation.isPending}
          >
            {generateCaptionMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate
          </Button>
        </div>
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Caption</Label>
          <span
            className={cn(
              "text-xs",
              isTooLong ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {captionLength} / {maxLength}
          </span>
        </div>
        <Textarea
          placeholder="Write your caption..."
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          rows={4}
          className={cn(isTooLong && "border-destructive")}
        />
        {isTooLong && (
          <p className="text-xs text-destructive">
            Caption exceeds {maxLength} character limit for{" "}
            {platforms.join(", ")}
          </p>
        )}
      </div>
    </>
  );
};
