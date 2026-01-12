/**
 * Content Create Dialog
 *
 * Dialog for creating new content posts with AI-powered caption,
 * hashtag, and image generation.
 */

import React from "react";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Create a new post for Facebook and Instagram. Use AI to generate
            captions, hashtags, and images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Selection */}
          <PlatformSelector
            platforms={content.platforms}
            onToggle={content.togglePlatform}
          />

          {/* Media Section with Tabs */}
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

          {/* Error */}
          {content.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{content.error.message}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={content.handleCreate}
            disabled={!content.isValid || content.isCreating}
          >
            {content.isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
