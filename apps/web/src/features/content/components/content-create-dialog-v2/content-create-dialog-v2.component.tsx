/**
 * Content Create Dialog V2
 *
 * Dialog for creating new content posts with multi-account support.
 * Uses platform connection IDs instead of Meta page ID.
 */

import React, { useState } from "react";
import {
  Loader2,
  Users,
  Image,
  FileText,
  ChevronDown,
  CheckCircle2,
  Hash,
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
import { useContentCreateV2 } from "./use-content-create-v2.hook";
import { AccountSelector } from "./account-selector.component";
import { MediaSection } from "./media-section.component";
import { CaptionSection } from "./caption-section.component";
import { HashtagsSection } from "./hashtags-section.component";

type ContentCreateDialogV2Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export const ContentCreateDialogV2: React.FC<ContentCreateDialogV2Props> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const content = useContentCreateV2({
    onSuccess,
    onClose: () => onOpenChange(false),
  });

  // Progressive disclosure state
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // Auto-expand content section when media is added
  const hasMedia = content.mediaUrls.length > 0;
  const hasCaption = content.caption.trim().length > 0;
  const hasAccounts = content.selectedAccountIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Post</DialogTitle>
          <DialogDescription>
            Create a new post for your connected social media accounts. Use AI
            to generate captions, hashtags, and images.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Selection - Card with border */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-medium">
                Select Accounts
                <span className="text-destructive ml-1">*</span>
              </h3>
              {hasAccounts && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {content.selectedAccountIds.length} selected
                </span>
              )}
            </div>
            <AccountSelector
              accounts={content.accounts}
              selectedAccountIds={content.selectedAccountIds}
              onToggle={content.toggleAccount}
              isLoading={content.isLoadingAccounts}
            />
          </div>

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
              generateFromIdeaMutation={content.generateFromIdeaMutation}
              onAddGeneratedImage={content.addGeneratedImage}
              showAdvanced={content.showAdvanced}
              onShowAdvancedChange={content.setShowAdvanced}
              imageStyle={content.imageStyle}
              onImageStyleChange={content.setImageStyle}
              imageMood={content.imageMood}
              onImageMoodChange={content.setImageMood}
              imageComposition={content.imageComposition}
              onImageCompositionChange={content.setImageComposition}
            />
          </div>

          {/* Content Section - Expandable */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-between p-4",
                "hover:bg-accent/50 transition-colors",
                (hasMedia || isContentExpanded) && "border-b"
              )}
              onClick={() => setIsContentExpanded(!isContentExpanded)}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Content</h3>
                {hasCaption && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  (isContentExpanded || hasMedia) && "rotate-180"
                )}
              />
            </button>

            {(isContentExpanded || hasMedia) && (
              <div className="p-4 space-y-6">
                {/* Caption */}
                <CaptionSection
                  caption={content.caption}
                  onCaptionChange={content.setCaption}
                  captionLength={content.captionLength}
                  maxLength={content.minMaxCaption}
                  isTooLong={content.isCaptionTooLong}
                  aiTopic={content.aiTopic}
                  onAiTopicChange={content.setAiTopic}
                  generateCaptionMutation={content.generateCaptionMutation}
                  platforms={content.selectedPlatforms}
                />

                {/* Hashtags */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Hashtags</span>
                    <span className="text-xs text-muted-foreground">
                      ({content.hashtags.length}/30)
                    </span>
                  </div>
                  <HashtagsSection
                    hashtags={content.hashtags}
                    hashtagInput={content.hashtagInput}
                    onInputChange={content.setHashtagInput}
                    onAdd={content.addHashtag}
                    onRemove={content.removeHashtag}
                    suggestHashtagsMutation={content.suggestHashtagsMutation}
                    caption={content.caption}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={content.handleCreate}
            disabled={!content.isValid || content.isCreating}
          >
            {content.isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Draft"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
