/**
 * Hashtags Section Component
 *
 * Hashtag input with AI-powered suggestions.
 */

import React from "react";
import { Loader2, Hash, Plus, X } from "lucide-react";
import { Button, Input, Label, Badge } from "@repo/ui";
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
      onAdd();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Hashtags</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => suggestHashtagsMutation.mutate()}
          disabled={!caption.trim() || suggestHashtagsMutation.isPending}
        >
          {suggestHashtagsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Hash className="w-4 h-4 mr-1" />
          )}
          Suggest
        </Button>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add hashtag..."
          value={hashtagInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={!hashtagInput.trim()}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hashtags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => onRemove(tag)}
            >
              #{tag}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {hashtags.length} / 30 hashtags
      </p>
    </div>
  );
};
