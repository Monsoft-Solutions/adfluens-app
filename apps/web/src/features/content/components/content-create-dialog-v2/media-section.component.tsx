/**
 * Media Section Component
 *
 * Media upload from URL, file upload, and AI-powered image generation.
 */

import { Upload, Link, Wand2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import type { UseMutationResult } from "@tanstack/react-query";
import type { GeneratedImage } from "./content-create-dialog.types";
import { UrlTab } from "./url-tab.component";
import { UploadTab } from "./upload-tab.component";
import { AiIdeaStep } from "./ai-idea-step.component";
import { AiPromptStep } from "./ai-prompt-step.component";
import { AiGenerateStep } from "./ai-generate-step.component";
import { MediaPreview, MediaEmptyState } from "./media-preview.component";

type MediaSectionProps = {
  mediaTab: "url" | "upload" | "ai";
  onTabChange: (tab: "url" | "upload" | "ai") => void;
  mediaUrlInput: string;
  onMediaUrlInputChange: (value: string) => void;
  onAddMediaUrl: () => void;
  isUploadingMedia: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingFiles: boolean;
  uploadProgress: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileInput: () => void;
  onFileDrop: (files: FileList) => void;
  mediaUrls: string[];
  onRemoveMediaUrl: (url: string) => void;
  generatedImages: GeneratedImage[];
  aiAvailability?: { available: boolean };
  ideaInput: string;
  onIdeaInputChange: (value: string) => void;
  isOptimizing: boolean;
  optimizePromptMutation: UseMutationResult<
    { prompt: string; negativePrompt?: string },
    Error,
    void
  >;
  imagePrompt: string;
  onImagePromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
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
  showAdvanced: boolean;
  onShowAdvancedChange: (show: boolean) => void;
  imageStyle?: string;
  onImageStyleChange: (value: string | undefined) => void;
  imageMood?: string;
  onImageMoodChange: (value: string | undefined) => void;
  imageComposition?: string;
  onImageCompositionChange: (value: string | undefined) => void;
  generateFromIdeaMutation: UseMutationResult<
    { images: GeneratedImage[] },
    Error,
    void
  >;
  onAddGeneratedImage: (image: GeneratedImage) => void;
};

const MAX_IMAGES = 10;

export function MediaSection({
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
}: MediaSectionProps) {
  const hasPrompt = imagePrompt.trim().length > 0;
  const hasGeneratedImages = generatedImages.length > 0;
  const remainingSlots = MAX_IMAGES - mediaUrls.length;

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

        <TabsContent value="upload" className="space-y-4 mt-4">
          <UploadTab
            fileInputRef={fileInputRef}
            isUploadingFiles={isUploadingFiles}
            uploadProgress={uploadProgress}
            onFileSelect={onFileSelect}
            onTriggerFileInput={onTriggerFileInput}
            onFileDrop={onFileDrop}
            remainingSlots={remainingSlots}
          />
        </TabsContent>

        <TabsContent value="url" className="space-y-4 mt-4">
          <UrlTab
            mediaUrlInput={mediaUrlInput}
            onMediaUrlInputChange={onMediaUrlInputChange}
            onAddMediaUrl={onAddMediaUrl}
            isUploadingMedia={isUploadingMedia}
          />
        </TabsContent>

        <TabsContent value="ai" className="space-y-5 mt-4">
          <AiIdeaStep
            ideaInput={ideaInput}
            onIdeaInputChange={onIdeaInputChange}
            isOptimizing={isOptimizing}
            onOptimize={() => optimizePromptMutation.mutate()}
            showAdvanced={showAdvanced}
            onShowAdvancedChange={onShowAdvancedChange}
            imageStyle={imageStyle}
            onImageStyleChange={onImageStyleChange}
            imageMood={imageMood}
            onImageMoodChange={onImageMoodChange}
            imageComposition={imageComposition}
            onImageCompositionChange={onImageCompositionChange}
            hasPrompt={hasPrompt}
          />

          <AiPromptStep
            imagePrompt={imagePrompt}
            onImagePromptChange={onImagePromptChange}
            hasPrompt={hasPrompt}
            hasGeneratedImages={hasGeneratedImages}
          />

          <AiGenerateStep
            imagePrompt={imagePrompt}
            imageModel={imageModel}
            onImageModelChange={onImageModelChange}
            imageSize={imageSize}
            onImageSizeChange={onImageSizeChange}
            imageCount={imageCount}
            onImageCountChange={onImageCountChange}
            imageOptions={imageOptions}
            selectedModelConfig={selectedModelConfig}
            isGenerating={generateFromIdeaMutation.isPending}
            onGenerate={() => generateFromIdeaMutation.mutate()}
            generatedImages={generatedImages}
            mediaUrls={mediaUrls}
            onAddGeneratedImage={onAddGeneratedImage}
            error={generateFromIdeaMutation.error}
            hasPrompt={hasPrompt}
            hasGeneratedImages={hasGeneratedImages}
          />
        </TabsContent>
      </Tabs>

      <MediaPreview
        mediaUrls={mediaUrls}
        onRemoveMediaUrl={onRemoveMediaUrl}
        generatedImages={generatedImages}
      />

      {mediaUrls.length === 0 &&
        (mediaTab === "url" || mediaTab === "upload") && (
          <MediaEmptyState mediaTab={mediaTab} />
        )}
    </div>
  );
}
