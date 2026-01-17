/**
 * Media Section Component
 *
 * Media upload from URL and AI-powered image generation.
 */

import React, { useCallback } from "react";
import {
  Loader2,
  Plus,
  X,
  Link,
  Wand2,
  Sparkles,
  AlertCircle,
  ChevronDown,
  Lightbulb,
  Palette,
  ImageIcon,
  CheckCircle2,
  Upload,
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
  mediaTab: "url" | "upload" | "ai";
  onTabChange: (tab: "url" | "upload" | "ai") => void;

  // URL upload
  mediaUrlInput: string;
  onMediaUrlInputChange: (value: string) => void;
  onAddMediaUrl: () => void;
  isUploadingMedia: boolean;

  // File upload
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingFiles: boolean;
  uploadProgress: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileInput: () => void;
  onFileDrop: (files: FileList) => void;

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

/** Step indicator component for AI flow */
const StepIndicator: React.FC<{
  step: number;
  title: string;
  icon: React.ReactNode;
  isComplete?: boolean;
  isActive?: boolean;
}> = ({ step, title, icon, isComplete, isActive }) => (
  <div className="flex items-center gap-2 mb-2">
    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
        isComplete
          ? "bg-success text-success-foreground"
          : isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
      )}
    >
      {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step}
    </div>
    <span
      className={cn(
        "text-sm font-medium flex items-center gap-1.5",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      {title}
    </span>
  </div>
);

export const MediaSection: React.FC<MediaSectionProps> = ({
  mediaTab,
  onTabChange,
  mediaUrlInput,
  onMediaUrlInputChange,
  onAddMediaUrl,
  isUploadingMedia,
  fileInputRef,
  isUploadingFiles,
  uploadProgress,
  onFileSelect,
  onTriggerFileInput,
  onFileDrop,
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

  // Drag and drop state
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileDrop(files);
      }
    },
    [onFileDrop]
  );

  // AI flow step completion tracking
  const hasPrompt = imagePrompt.trim().length > 0;
  const hasGeneratedImages = generatedImages.length > 0;

  return (
    <div className="space-y-4">
      <Tabs
        value={mediaTab}
        onValueChange={(v) => onTabChange(v as "url" | "upload" | "ai")}
      >
        <TabsList className="grid w-full grid-cols-3 h-11">
          <TabsTrigger
            value="upload"
            className="flex items-center gap-2 data-[state=active]:shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>

          <TabsTrigger
            value="url"
            className="flex items-center gap-2 data-[state=active]:shadow-sm"
          >
            <Link className="w-4 h-4" />
            From URL
          </TabsTrigger>

          <TabsTrigger
            value="ai"
            className="flex items-center gap-2 data-[state=active]:shadow-sm"
            disabled={!aiAvailability?.available}
          >
            <Wand2 className="w-4 h-4" />
            AI Generate
            {!aiAvailability?.available && (
              <span className="text-xs text-muted-foreground">(N/A)</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
            multiple
            onChange={onFileSelect}
            className="hidden"
          />

          {/* Drag and drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onTriggerFileInput}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            {isUploadingFiles ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Uploading images...
                </p>
                {uploadProgress > 0 && (
                  <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drop images here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, GIF, WebP, HEIC supported. Max 10MB per file.
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {10 - mediaUrls.length} images remaining
          </p>
        </TabsContent>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Paste an image URL to add it to your post
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={mediaUrlInput}
                onChange={(e) => onMediaUrlInputChange(e.target.value)}
                onKeyDown={handleMediaUrlKeyDown}
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
        </TabsContent>

        {/* AI Generate Tab */}
        <TabsContent value="ai" className="space-y-5 mt-4">
          {/* Step 1: Describe your idea */}
          <div className="space-y-3">
            <StepIndicator
              step={1}
              title="Describe your idea"
              icon={<Lightbulb className="w-4 h-4" />}
              isComplete={hasPrompt}
              isActive={!hasPrompt}
            />
            <div className="pl-8 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., sunset on a beach, product photo, cozy cafe..."
                  value={ideaInput}
                  onChange={(e) => onIdeaInputChange(e.target.value)}
                  className="flex-1"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Turn your idea into a detailed image prompt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Collapsible Advanced Style Options */}
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
                <Palette className="w-4 h-4" />
                Customize Style
                {(imageStyle || imageMood || imageComposition) && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {
                      [imageStyle, imageMood, imageComposition].filter(Boolean)
                        .length
                    }{" "}
                    set
                  </Badge>
                )}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 border">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Style</Label>
                    <Select
                      value={imageStyle || "auto"}
                      onValueChange={(v) =>
                        onImageStyleChange(v === "auto" ? undefined : v)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="photorealistic">
                          Photorealistic
                        </SelectItem>
                        <SelectItem value="illustration">
                          Illustration
                        </SelectItem>
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
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="vibrant">Vibrant</SelectItem>
                        <SelectItem value="moody">Moody</SelectItem>
                        <SelectItem value="professional">
                          Professional
                        </SelectItem>
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
                      <SelectTrigger className="h-9">
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
            </div>
          </div>

          {/* Step 2: Review prompt */}
          <div className="space-y-3">
            <StepIndicator
              step={2}
              title="Review & edit prompt"
              icon={<ImageIcon className="w-4 h-4" />}
              isComplete={hasPrompt && hasGeneratedImages}
              isActive={hasPrompt && !hasGeneratedImages}
            />
            <div className="pl-8 space-y-3">
              <Textarea
                placeholder="Type your prompt directly or click 'Optimize' above to generate one..."
                value={imagePrompt}
                onChange={(e) => onImagePromptChange(e.target.value)}
                rows={3}
                className="font-mono text-sm resize-none"
              />
            </div>
          </div>

          {/* Step 3: Configure & Generate */}
          <div className="space-y-3">
            <StepIndicator
              step={3}
              title="Configure & generate"
              icon={<Sparkles className="w-4 h-4" />}
              isComplete={hasGeneratedImages}
              isActive={hasPrompt}
            />
            <div className="pl-8 space-y-4">
              {/* Model, Size & Count in compact row */}
              <div className="grid grid-cols-3 gap-3">
                <TooltipProvider>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Model
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Select
                            value={imageModel}
                            onValueChange={(v) => onImageModelChange(v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {imageOptions?.models.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI model for image generation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <Select
                    value={imageSize}
                    onValueChange={(v) => onImageSizeChange(v)}
                  >
                    <SelectTrigger className="h-9">
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
                  <Label className="text-xs text-muted-foreground">Count</Label>
                  <Select
                    value={imageCount.toString()}
                    onValueChange={(v) => onImageCountChange(parseInt(v, 10))}
                  >
                    <SelectTrigger className="h-9">
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
                className="w-full h-11"
                size="lg"
              >
                {generateFromIdeaMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating images...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate {imageCount}{" "}
                    {imageCount === 1 ? "Image" : "Images"}
                  </>
                )}
              </Button>

              {/* Loading state with tips */}
              {generateFromIdeaMutation.isPending && (
                <p className="text-xs text-muted-foreground text-center animate-pulse">
                  This may take 10-30 seconds depending on the model...
                </p>
              )}

              {/* Generated Images Preview */}
              {generatedImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Generated Images
                    <span className="text-muted-foreground font-normal">
                      (click to add)
                    </span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {generatedImages.map((image, index) => {
                      const isAdded = mediaUrls.includes(image.storedUrl);
                      return (
                        <button
                          key={image.storedUrl}
                          type="button"
                          onClick={() => !isAdded && onAddGeneratedImage(image)}
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                            isAdded
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50 hover:shadow-md"
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
                              <Badge variant="default" className="shadow-lg">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Added
                              </Badge>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {generateFromIdeaMutation.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{generateFromIdeaMutation.error.message}</span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Media Preview */}
      {mediaUrls.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <Label className="text-sm font-medium">
            Selected Images ({mediaUrls.length}/10)
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {mediaUrls.map((url, index) => (
              <div
                key={url}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 group"
              >
                <img
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveMediaUrl(url)}
                  className="absolute top-1 right-1 p-1.5 bg-background/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
                {generatedImages.some((g) => g.storedUrl === url) && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5"
                  >
                    AI
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {mediaUrls.length === 0 && mediaTab === "url" && (
        <div className="text-center py-6 text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images added yet</p>
          <p className="text-xs">Paste an image URL above to get started</p>
        </div>
      )}
      {mediaUrls.length === 0 && mediaTab === "upload" && (
        <div className="text-center py-6 text-muted-foreground">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images added yet</p>
          <p className="text-xs">
            Drag and drop images or click the upload area above
          </p>
        </div>
      )}
    </div>
  );
};
