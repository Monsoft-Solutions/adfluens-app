/**
 * Content Create Dialog
 *
 * Dialog for creating new content posts with AI-powered caption
 * and hashtag generation.
 */

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Loader2,
  Sparkles,
  Hash,
  Plus,
  X,
  Facebook,
  Instagram,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
  Label,
  Badge,
  cn,
} from "@repo/ui";
import { trpcClient } from "@/lib/trpc";

type ContentCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  onSuccess?: () => void;
};

type Platform = "facebook" | "instagram";

const platformConfig: Record<
  Platform,
  {
    label: string;
    icon: typeof Facebook;
    maxCaption: number;
    maxHashtags: number;
  }
> = {
  facebook: {
    label: "Facebook",
    icon: Facebook,
    maxCaption: 63206,
    maxHashtags: 30,
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    maxCaption: 2200,
    maxHashtags: 30,
  },
};

export const ContentCreateDialog: React.FC<ContentCreateDialogProps> = ({
  open,
  onOpenChange,
  pageId,
  onSuccess,
}) => {
  // Form state
  const [platforms, setPlatforms] = useState<Platform[]>(["facebook"]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      trpcClient.content.create.mutate({
        platforms,
        pageId,
        caption,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        media: mediaUrls.map((url) => ({
          url,
          storedUrl: url,
          source: "url" as const,
        })),
      }),
    onSuccess: () => {
      resetForm();
      onSuccess?.();
    },
  });

  // Generate caption mutation
  const generateCaptionMutation = useMutation({
    mutationFn: (topic: string) =>
      trpcClient.content.generateCaption.mutate({
        topic,
        platforms,
        tone: "engaging",
      }),
    onSuccess: (result) => {
      if (result.length > 0) {
        setCaption(result[0]?.caption || "");
      }
    },
  });

  // Suggest hashtags mutation
  const suggestHashtagsMutation = useMutation({
    mutationFn: () =>
      trpcClient.content.suggestHashtags.mutate({
        caption,
        platforms,
        count: 15,
      }),
    onSuccess: (result) => {
      setHashtags((prev) => [...new Set([...prev, ...result].slice(0, 30))]);
    },
  });

  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: (sourceUrl: string) =>
      trpcClient.content.uploadMediaFromUrl.mutate({ sourceUrl }),
    onSuccess: (result) => {
      setMediaUrls((prev) => [...prev, result.storedUrl]);
      setMediaUrlInput("");
      setIsUploadingMedia(false);
    },
    onError: () => {
      setIsUploadingMedia(false);
    },
  });

  // Platform validation
  const minMaxCaption = Math.min(
    ...platforms.map((p) => platformConfig[p].maxCaption)
  );
  const captionLength = caption.length;
  const isCaptionTooLong = captionLength > minMaxCaption;

  // Handlers
  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "").toLowerCase();
    if (tag && !hashtags.includes(tag) && hashtags.length < 30) {
      setHashtags((prev) => [...prev, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const addMediaUrl = () => {
    const url = mediaUrlInput.trim();
    if (url && !mediaUrls.includes(url) && mediaUrls.length < 10) {
      setIsUploadingMedia(true);
      uploadMediaMutation.mutate(url);
    }
  };

  const removeMediaUrl = (url: string) => {
    setMediaUrls((prev) => prev.filter((u) => u !== url));
  };

  const resetForm = () => {
    setPlatforms(["facebook"]);
    setCaption("");
    setHashtags([]);
    setMediaUrls([]);
    setAiTopic("");
    setHashtagInput("");
    setMediaUrlInput("");
  };

  const isValid =
    platforms.length > 0 &&
    caption.trim().length > 0 &&
    !isCaptionTooLong &&
    mediaUrls.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Create a new post for Facebook and Instagram. Use AI to generate
            captions and hashtags.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex gap-4">
              {(Object.keys(platformConfig) as Platform[]).map((platform) => {
                const config = platformConfig[platform];
                const Icon = config.icon;
                return (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                      platforms.includes(platform)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
            {platforms.length === 0 && (
              <p className="text-sm text-destructive">
                Select at least one platform
              </p>
            )}
          </div>

          {/* Media Section */}
          <div className="space-y-2">
            <Label>Media (Required)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste image URL..."
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMediaUrl()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addMediaUrl}
                disabled={isUploadingMedia || !mediaUrlInput.trim()}
              >
                {isUploadingMedia ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
            {mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
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
                      onClick={() => removeMediaUrl(url)}
                      className="absolute top-1 right-1 p-1 bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add up to 10 images. Images will be uploaded and stored.
            </p>
          </div>

          {/* AI Caption Generation */}
          <div className="space-y-2">
            <Label>AI Caption Generator</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Describe your post topic..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => generateCaptionMutation.mutate(aiTopic)}
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
                  isCaptionTooLong
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {captionLength} / {minMaxCaption}
              </span>
            </div>
            <Textarea
              placeholder="Write your caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className={cn(isCaptionTooLong && "border-destructive")}
            />
            {isCaptionTooLong && (
              <p className="text-xs text-destructive">
                Caption exceeds {minMaxCaption} character limit for{" "}
                {platforms.join(", ")}
              </p>
            )}
          </div>

          {/* Hashtags */}
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
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addHashtag()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addHashtag}
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
                    onClick={() => removeHashtag(tag)}
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

          {/* Error */}
          {createMutation.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{createMutation.error.message}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? (
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
