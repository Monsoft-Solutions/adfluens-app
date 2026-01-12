/**
 * Content Create Dialog
 *
 * Dialog for creating new content posts with AI-powered caption,
 * hashtag, and image generation.
 */

import React, { useState } from "react";
import {
  Loader2,
  Plus,
  AlertCircle,
  Image,
  FileText,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  cn,
} from "@repo/ui";
import type { ContentCreateDialogProps } from "./content-create-dialog.types";
import { useContentCreate } from "./use-content-create.hook";
import { PlatformSelector } from "./platform-selector.component";
import { MediaSection } from "./media-section.component";
import { CaptionSection } from "./caption-section.component";
import { HashtagsSection } from "./hashtags-section.component";

export const ContentCreateDialog: React.FC<ContentCreateDialogProps> = ({
  open,
  onOpenChange,
  pageId,
  onSuccess,
}) => {
  const content = useContentCreate({
    pageId,
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  // Progressive disclosure state
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // Auto-expand content section when media is added
  const hasMedia = content.mediaUrls.length > 0;
  const hasCaption = content.caption.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Post</DialogTitle>
          <DialogDescription>
            Create a new post for Facebook and Instagram. Use AI to generate
            captions, hashtags, and images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Selection - Always visible */}
          <PlatformSelector
            platforms={content.platforms}
            onToggle={content.togglePlatform}
          />

          {/* Media Section - Card with border */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              <h3 className="font-medium">
                Media
                <span className="text-destructive ml-1">*</span>
              </h3>
              {hasMedia && (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
              )}
            </div>
            <MediaSection
              mediaTab={content.mediaTab}
              onTabChange={content.setMediaTab}
              mediaUrlInput={content.mediaUrlInput}
              onMediaUrlInputChange={content.setMediaUrlInput}
              onAddMediaUrl={content.addMediaUrl}
              isUploadingMedia={content.isUploadingMedia}
              mediaUrls={content.mediaUrls}
              onRemoveMediaUrl={content.removeMediaUrl}
              generatedImages={content.generatedImages}
              aiAvailability={content.aiAvailability}
              ideaInput={content.ideaInput}
              onIdeaInputChange={content.setIdeaInput}
              isOptimizing={content.isOptimizing}
              optimizePromptMutation={content.optimizePromptMutation}
              imagePrompt={content.imagePrompt}
              onImagePromptChange={content.setImagePrompt}
              negativePrompt={content.negativePrompt}
              onNegativePromptChange={content.setNegativePrompt}
              imageModel={content.imageModel}
              onImageModelChange={content.setImageModel}
              imageSize={content.imageSize}
              onImageSizeChange={content.setImageSize}
              imageCount={content.imageCount}
              onImageCountChange={content.setImageCount}
              imageOptions={content.imageOptions}
              selectedModelConfig={content.selectedModelConfig}
              showAdvanced={content.showAdvanced}
              onShowAdvancedChange={content.setShowAdvanced}
              imageStyle={content.imageStyle}
              onImageStyleChange={content.setImageStyle}
              imageMood={content.imageMood}
              onImageMoodChange={content.setImageMood}
              imageComposition={content.imageComposition}
              onImageCompositionChange={content.setImageComposition}
              generateFromIdeaMutation={content.generateFromIdeaMutation}
              onAddGeneratedImage={content.addGeneratedImage}
            />
          </div>

          {/* Content Section - Collapsible Card */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setIsContentExpanded(!isContentExpanded)}
              className={cn(
                "w-full p-4 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors",
                !hasMedia && "opacity-60"
              )}
            >
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-medium flex-1">Caption & Hashtags</h3>
              {hasCaption && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  (isContentExpanded || hasMedia) && "rotate-180"
                )}
              />
            </button>

            {/* Auto-expand when media is added, or manually expanded */}
            {(isContentExpanded || hasMedia) && (
              <div className="px-4 pb-4 space-y-6 border-t pt-4">
                {/* Caption Section */}
                <CaptionSection
                  aiTopic={content.aiTopic}
                  onAiTopicChange={content.setAiTopic}
                  caption={content.caption}
                  onCaptionChange={content.setCaption}
                  captionLength={content.captionLength}
                  maxLength={content.minMaxCaption}
                  isTooLong={content.isCaptionTooLong}
                  platforms={content.platforms}
                  generateCaptionMutation={content.generateCaptionMutation}
                />

                {/* Hashtags Section */}
                <HashtagsSection
                  hashtags={content.hashtags}
                  hashtagInput={content.hashtagInput}
                  onInputChange={content.setHashtagInput}
                  onAdd={content.addHashtag}
                  onRemove={content.removeHashtag}
                  caption={content.caption}
                  suggestHashtagsMutation={content.suggestHashtagsMutation}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {content.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{content.error.message}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={content.handleCreate}
            disabled={!content.isValid || content.isCreating}
            size="lg"
            className="min-w-[140px]"
          >
            {content.isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
