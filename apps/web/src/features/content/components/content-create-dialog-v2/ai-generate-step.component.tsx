/**
 * AI Generate Step Component
 *
 * Step 3 of AI image generation - configuration and generation.
 */

import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Button,
  Label,
  Badge,
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
import type { GeneratedImage } from "./content-create-dialog.types";
import { StepIndicator } from "./step-indicator.component";

type AiGenerateStepProps = {
  imagePrompt: string;
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
  isGenerating: boolean;
  onGenerate: () => void;
  generatedImages: GeneratedImage[];
  mediaUrls: string[];
  onAddGeneratedImage: (image: GeneratedImage) => void;
  error?: Error | null;
  hasPrompt: boolean;
  hasGeneratedImages: boolean;
};

export function AiGenerateStep({
  imagePrompt,
  imageModel,
  onImageModelChange,
  imageSize,
  onImageSizeChange,
  imageCount,
  onImageCountChange,
  imageOptions,
  selectedModelConfig,
  isGenerating,
  onGenerate,
  generatedImages,
  mediaUrls,
  onAddGeneratedImage,
  error,
  hasPrompt,
  hasGeneratedImages,
}: AiGenerateStepProps) {
  return (
    <div className="space-y-3">
      <StepIndicator
        step={3}
        title="Configure & generate"
        icon={<Sparkles className="w-4 h-4" />}
        isComplete={hasGeneratedImages}
        isActive={hasPrompt}
      />
      <div className="pl-8 space-y-4">
        <ModelSizeCountSelectors
          imageModel={imageModel}
          onImageModelChange={onImageModelChange}
          imageSize={imageSize}
          onImageSizeChange={onImageSizeChange}
          imageCount={imageCount}
          onImageCountChange={onImageCountChange}
          imageOptions={imageOptions}
          selectedModelConfig={selectedModelConfig}
        />

        <Button
          type="button"
          onClick={onGenerate}
          disabled={!imagePrompt.trim() || isGenerating}
          className="w-full h-11"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating images...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate {imageCount} {imageCount === 1 ? "Image" : "Images"}
            </>
          )}
        </Button>

        {isGenerating && (
          <p className="text-xs text-muted-foreground text-center animate-pulse">
            This may take 10-30 seconds depending on the model...
          </p>
        )}

        {generatedImages.length > 0 && (
          <GeneratedImagesPreview
            generatedImages={generatedImages}
            mediaUrls={mediaUrls}
            onAddGeneratedImage={onAddGeneratedImage}
          />
        )}

        {error && <ErrorMessage message={error.message} />}
      </div>
    </div>
  );
}

type ModelSizeCountSelectorsProps = {
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
};

function ModelSizeCountSelectors({
  imageModel,
  onImageModelChange,
  imageSize,
  onImageSizeChange,
  imageCount,
  onImageCountChange,
  imageOptions,
  selectedModelConfig,
}: ModelSizeCountSelectorsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <TooltipProvider>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Model</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Select value={imageModel} onValueChange={onImageModelChange}>
                  <SelectTrigger className="h-9">
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
            </TooltipTrigger>
            <TooltipContent>
              <p>AI model for image generation</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Size</Label>
        <Select value={imageSize} onValueChange={onImageSizeChange}>
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
  );
}

type GeneratedImagesPreviewProps = {
  generatedImages: GeneratedImage[];
  mediaUrls: string[];
  onAddGeneratedImage: (image: GeneratedImage) => void;
};

function GeneratedImagesPreview({
  generatedImages,
  mediaUrls,
  onAddGeneratedImage,
}: GeneratedImagesPreviewProps) {
  return (
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
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
