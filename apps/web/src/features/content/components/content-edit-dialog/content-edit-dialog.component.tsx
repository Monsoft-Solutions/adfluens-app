/**
 * Content Edit Dialog
 *
 * Dialog for editing an existing draft content post.
 * Reuses components from content-create-dialog-v2.
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
import { useContentEdit } from "./use-content-edit.hook";
import { AccountSelector } from "../content-create-dialog-v2/account-selector.component";
import { MediaSection } from "../content-create-dialog-v2/media-section.component";
import { CaptionSection } from "../content-create-dialog-v2/caption-section.component";
import { HashtagsSection } from "../content-create-dialog-v2/hashtags-section.component";

type ContentPostMedia = {
  url: string;
  storedUrl?: string;
  source: "upload" | "fal_generated" | "url";
};

type ContentPostAccount = {
  id: string;
  status: "draft" | "pending" | "published" | "failed";
  platformConnection: {
    id: string;
    platform: string;
    accountName: string;
  };
};

type ContentPost = {
  id: string;
  organizationId: string;
  platforms: string[];
  caption: string;
  hashtags: string[] | null;
  media: ContentPostMedia[];
  status: "draft" | "pending" | "published" | "failed";
  accounts?: ContentPostAccount[];
  lastError: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

type ContentEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: ContentPost;
  onSuccess?: () => void;
};

export const ContentEditDialog: React.FC<ContentEditDialogProps> = ({
  open,
  onOpenChange,
  post,
  onSuccess,
}) => {
  const content = useContentEdit({
    post,
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
    onClose: () => onOpenChange(false),
  });

  // Progressive disclosure state
  const [isContentExpanded, setIsContentExpanded] = useState(true);

  const hasMedia = content.mediaUrls.length > 0;
  const hasCaption = content.caption.trim().length > 0;
  const hasAccounts = content.selectedAccountIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Post</DialogTitle>
          <DialogDescription>
            Edit your draft post. You can change the caption, media, hashtags,
            and target accounts.
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
              fileInputRef={content.fileInputRef}
              isUploadingFiles={content.isUploadingFiles}
              uploadProgress={content.uploadProgress}
              onFileSelect={content.handleFileSelect}
              onTriggerFileInput={content.triggerFileInput}
              onFileDrop={content.uploadFiles}
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
                isContentExpanded && "border-b"
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
                  isContentExpanded && "rotate-180"
                )}
              />
            </button>

            {isContentExpanded && (
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
            onClick={content.handleUpdate}
            disabled={
              !content.isValid || !content.hasChanges || content.isUpdating
            }
          >
            {content.isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
