/**
 * Media Section Component
 *
 * Media upload from URL and AI-powered image generation.
 */

import React from "react";
import {
  Loader2,
  Plus,
  X,
  Link,
  Wand2,
  Sparkles,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import type { UseMutationResult } from "@tanstack/react-query";
import type { GeneratedImage } from "./content-create-dialog.types";

type MediaSectionProps = {
  // Tab state
  mediaTab: "url" | "ai";
  onTabChange: (tab: "url" | "ai") => void;

  // URL upload
  mediaUrlInput: string;
  onMediaUrlInputChange: (value: string) => void;
  onAddMediaUrl: () => void;
  isUploadingMedia: boolean;

  // Media preview
  mediaUrls: string[];
  onRemoveMediaUrl: (url: string) => void;
  generatedImages: GeneratedImage[];

  // AI availability
  aiAvailability?: { available: boolean };

  // AI Image generation - Idea optimization
  ideaInput: string;
  onIdeaInputChange: (value: string) => void;
  isOptimizing: boolean;
  optimizePromptMutation: UseMutationResult<
    { prompt: string; negativePrompt?: string },
    Error,
    void
  >;

  // AI Image generation - Prompt
  imagePrompt: string;
  onImagePromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;

  // AI Image generation - Model/Size/Count
  imageModel: string;
  onImageModelChange: (value: string) => void;
  imageSize: string;
  onImageSizeChange: (value: string) => void;
  imageCount: number;
  onImageCountChange: (value: number) => void;
  imageOptions?: {
    models: Array<{
      value: string;
      label: string;
      sizes: Array<{ value: string; label: string }>;
    }>;
  };
  selectedModelConfig?: {
    sizes: Array<{ value: string; label: string }>;
  };

  // AI Image generation - Advanced style
  showAdvanced: boolean;
  onShowAdvancedChange: (show: boolean) => void;
  imageStyle?: string;
  onImageStyleChange: (value: string | undefined) => void;
  imageMood?: string;
  onImageMoodChange: (value: string | undefined) => void;
  imageComposition?: string;
  onImageCompositionChange: (value: string | undefined) => void;

  // AI Image generation - Generate
  generateFromIdeaMutation: UseMutationResult<
    { images: GeneratedImage[] },
    Error,
    void
  >;
  onAddGeneratedImage: (image: GeneratedImage) => void;
};

export const MediaSection: React.FC<MediaSectionProps> = ({
  mediaTab,
  onTabChange,
  mediaUrlInput,
  onMediaUrlInputChange,
  onAddMediaUrl,
  isUploadingMedia,
  mediaUrls,
  onRemoveMediaUrl,
  generatedImages,
  aiAvailability,
  ideaInput,
  onIdeaInputChange,
  isOptimizing,
  optimizePromptMutation,
  imagePrompt,
  onImagePromptChange,
  imageModel,
  onImageModelChange,
  imageSize,
  onImageSizeChange,
  imageCount,
  onImageCountChange,
  imageOptions,
  selectedModelConfig,
  showAdvanced,
  onShowAdvancedChange,
  imageStyle,
  onImageStyleChange,
  imageMood,
  onImageMoodChange,
  imageComposition,
  onImageCompositionChange,
  generateFromIdeaMutation,
  onAddGeneratedImage,
}) => {
  const handleMediaUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAddMediaUrl();
    }
  };

  return (
    <div className="space-y-2">
      <Label>Media (Required)</Label>
      <Tabs
        value={mediaTab}
        onValueChange={(v) => onTabChange(v as "url" | "ai")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            From URL
          </TabsTrigger>
          <TabsTrigger
            value="ai"
            className="flex items-center gap-2"
            disabled={!aiAvailability?.available}
          >
            <Wand2 className="w-4 h-4" />
            AI Generate
            {!aiAvailability?.available && (
              <span className="text-xs text-muted-foreground">
                (Not configured)
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-3 mt-3">
          <div className="flex gap-2">
            <Input
              placeholder="Paste image URL..."
              value={mediaUrlInput}
              onChange={(e) => onMediaUrlInputChange(e.target.value)}
              onKeyDown={handleMediaUrlKeyDown}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onAddMediaUrl}
              disabled={isUploadingMedia || !mediaUrlInput.trim()}
            >
              {isUploadingMedia ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </TabsContent>

        {/* AI Generate Tab */}
        <TabsContent value="ai" className="space-y-4 mt-3">
          <div className="space-y-3">
            {/* Step 1: Idea input (optional) with Optimize button */}
            <div className="space-y-2">
              <Label className="text-sm">Describe your idea (optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., sunset on a beach, product photo, cozy cafe..."
                  value={ideaInput}
                  onChange={(e) => onIdeaInputChange(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => optimizePromptMutation.mutate()}
                  disabled={!ideaInput.trim() || isOptimizing}
                  className="whitespace-nowrap"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Optimize
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Collapsible Advanced Style Options */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onShowAdvancedChange(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        showAdvanced && "rotate-180"
                      )}
                    />
                    Customize Style
                    {(imageStyle || imageMood || imageComposition) && (
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0"
                      >
                        {
                          [imageStyle, imageMood, imageComposition].filter(
                            Boolean
                          ).length
                        }{" "}
                        set
                      </Badge>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">
                    These options guide AI prompt optimization. Click
                    &quot;Optimize&quot; to apply them to your idea.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {showAdvanced && (
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Style</Label>
                  <Select
                    value={imageStyle || "auto"}
                    onValueChange={(v) =>
                      onImageStyleChange(v === "auto" ? undefined : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="photorealistic">
                        Photorealistic
                      </SelectItem>
                      <SelectItem value="illustration">Illustration</SelectItem>
                      <SelectItem value="3d-render">3D Render</SelectItem>
                      <SelectItem value="flat-design">Flat Design</SelectItem>
                      <SelectItem value="watercolor">Watercolor</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Mood</Label>
                  <Select
                    value={imageMood || "auto"}
                    onValueChange={(v) =>
                      onImageMoodChange(v === "auto" ? undefined : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="vibrant">Vibrant</SelectItem>
                      <SelectItem value="moody">Moody</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="luxurious">Luxurious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Composition</Label>
                  <Select
                    value={imageComposition || "auto"}
                    onValueChange={(v) =>
                      onImageCompositionChange(v === "auto" ? undefined : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="closeup">Close-up</SelectItem>
                      <SelectItem value="wide">Wide Shot</SelectItem>
                      <SelectItem value="overhead">Overhead</SelectItem>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="rule-of-thirds">
                        Rule of Thirds
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Editable prompt textarea */}
            <div className="space-y-2">
              <Label className="text-sm">Image Prompt</Label>
              <Textarea
                placeholder="Type your prompt directly or optimize from an idea above..."
                value={imagePrompt}
                onChange={(e) => onImagePromptChange(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            {/* Model, Size & Count in compact row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Model</Label>
                <Select
                  value={imageModel}
                  onValueChange={(v) => onImageModelChange(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageOptions?.models.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Size</Label>
                <Select
                  value={imageSize}
                  onValueChange={(v) => onImageSizeChange(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedModelConfig?.sizes.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Count</Label>
                <Select
                  value={imageCount.toString()}
                  onValueChange={(v) => onImageCountChange(parseInt(v, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {n === 1 ? "image" : "images"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Images button */}
            <Button
              type="button"
              onClick={() => generateFromIdeaMutation.mutate()}
              disabled={
                !imagePrompt.trim() || generateFromIdeaMutation.isPending
              }
              className="w-full"
            >
              {generateFromIdeaMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Images
                </>
              )}
            </Button>

            {/* Generated Images Preview */}
            {generatedImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">
                  Generated Images (click to add)
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((image, index) => {
                    const isAdded = mediaUrls.includes(image.storedUrl);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => !isAdded && onAddGeneratedImage(image)}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          isAdded
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                        disabled={isAdded}
                      >
                        <img
                          src={image.storedUrl}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isAdded && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Badge variant="default">Added</Badge>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {generateFromIdeaMutation.error && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{generateFromIdeaMutation.error.message}</span>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Media Preview */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {mediaUrls.map((url, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden border group"
            >
              <img
                src={url}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemoveMediaUrl(url)}
                className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {generatedImages.some((g) => g.storedUrl === url) && (
                <Badge
                  variant="secondary"
                  className="absolute bottom-1 left-1 text-[10px] px-1 py-0"
                >
                  AI
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {mediaUrls.length}/10 images added
      </p>
    </div>
  );
};
