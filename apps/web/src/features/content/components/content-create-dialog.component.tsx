/**
 * Content Create Dialog
 *
 * Dialog for creating new content posts with AI-powered caption,
 * hashtag, and image generation.
 */

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Sparkles,
  Hash,
  Plus,
  X,
  Facebook,
  Instagram,
  AlertCircle,
  Link,
  Wand2,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  cn,
} from "@repo/ui";
import { trpcClient, useTRPC } from "@/lib/trpc";

type ContentCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  onSuccess?: () => void;
};

type Platform = "facebook" | "instagram";

type GeneratedImage = {
  url: string;
  storedUrl: string;
  width: number;
  height: number;
  model: string;
};

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
  const trpc = useTRPC();

  // Form state
  const [platforms, setPlatforms] = useState<Platform[]>(["facebook"]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // AI Image generation state
  const [mediaTab, setMediaTab] = useState<"url" | "ai">("url");
  const [imageIdea, setImageIdea] = useState("");
  const [imageModel, setImageModel] = useState<string>("nano-banana-pro");
  const [imageSize, setImageSize] = useState<string>("square");
  const [imageCount, setImageCount] = useState<number>(2);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [improvePrompt, setImprovePrompt] = useState(true);

  // Check if AI image generation is available
  const { data: aiAvailability } = useQuery({
    ...trpc.content.isImageGenerationAvailable.queryOptions(),
    staleTime: Infinity,
  });

  // Fetch available models and sizes
  const { data: imageOptions } = useQuery({
    ...trpc.content.getImageGenerationOptions.queryOptions(),
    staleTime: Infinity,
    enabled: aiAvailability?.available === true,
  });

  // Current selected model config
  const selectedModelConfig = imageOptions?.models.find(
    (m) => m.value === imageModel
  );

  // Reset size when model changes if current size is invalid for new model
  React.useEffect(() => {
    if (
      selectedModelConfig &&
      !selectedModelConfig.sizes.some((s) => s.value === imageSize)
    ) {
      setImageSize(selectedModelConfig.sizes[0]?.value || "square");
    }
  }, [imageModel, selectedModelConfig, imageSize]);

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
          source: generatedImages.some((g) => g.storedUrl === url)
            ? ("fal_generated" as const)
            : ("url" as const),
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

  // Generate AI image from idea mutation
  const generateFromIdeaMutation = useMutation({
    mutationFn: () =>
      trpcClient.content.generateFromIdea.mutate({
        idea: imageIdea,
        model: imageModel as "nano-banana-pro" | "gpt-image-1",
        size: imageSize as "square" | "portrait" | "landscape",
        count: imageCount,
        improvePrompt,
      }),
    onSuccess: (result) => {
      setGeneratedImages(result.images);
      setGeneratedPrompt(result.prompt);
      // Only clear input if AI improved (user might want to tweak direct prompt)
      if (improvePrompt) {
        setImageIdea("");
      }
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
    setGeneratedImages((prev) => prev.filter((g) => g.storedUrl !== url));
  };

  const addGeneratedImage = (image: GeneratedImage) => {
    if (!mediaUrls.includes(image.storedUrl) && mediaUrls.length < 10) {
      setMediaUrls((prev) => [...prev, image.storedUrl]);
    }
  };

  const resetForm = () => {
    setPlatforms(["facebook"]);
    setCaption("");
    setHashtags([]);
    setMediaUrls([]);
    setAiTopic("");
    setHashtagInput("");
    setMediaUrlInput("");
    setImageIdea("");
    setImageCount(2);
    setGeneratedImages([]);
    setGeneratedPrompt("");
    setMediaTab("url");
    setImprovePrompt(true);
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
            captions, hashtags, and images.
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

          {/* Media Section with Tabs */}
          <div className="space-y-2">
            <Label>Media (Required)</Label>
            <Tabs
              value={mediaTab}
              onValueChange={(v) => setMediaTab(v as "url" | "ai")}
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
              </TabsContent>

              {/* AI Generate Tab */}
              <TabsContent value="ai" className="space-y-4 mt-3">
                <div className="space-y-3">
                  {/* Toggle: Improve with AI vs Use as final prompt */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="improve-prompt" className="text-sm">
                      {improvePrompt
                        ? "AI will optimize your idea"
                        : "Using prompt directly"}
                    </Label>
                    <Switch
                      id="improve-prompt"
                      checked={improvePrompt}
                      onCheckedChange={setImprovePrompt}
                    />
                  </div>

                  {/* Input - changes based on mode */}
                  <div className="space-y-2">
                    <Label>
                      {improvePrompt
                        ? "Describe your image idea"
                        : "Enter your prompt"}
                    </Label>
                    {improvePrompt ? (
                      <Input
                        placeholder="e.g., sunset on a beach, product photo, cozy cafe..."
                        value={imageIdea}
                        onChange={(e) => setImageIdea(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            imageIdea.trim() &&
                            !generateFromIdeaMutation.isPending
                          ) {
                            generateFromIdeaMutation.mutate();
                          }
                        }}
                      />
                    ) : (
                      <Textarea
                        placeholder="Enter detailed prompt with style, lighting, composition..."
                        value={imageIdea}
                        onChange={(e) => setImageIdea(e.target.value)}
                        rows={3}
                      />
                    )}
                  </div>

                  {/* Model, Size & Count in compact row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Model</Label>
                      <Select
                        value={imageModel}
                        onValueChange={(v) => setImageModel(v)}
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
                        onValueChange={(v) => setImageSize(v)}
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
                        onValueChange={(v) => setImageCount(parseInt(v, 10))}
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

                  {/* Generate button */}
                  <Button
                    type="button"
                    onClick={() => generateFromIdeaMutation.mutate()}
                    disabled={
                      !imageIdea.trim() || generateFromIdeaMutation.isPending
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
                        {improvePrompt
                          ? "Generate Images"
                          : "Generate with Custom Prompt"}
                      </>
                    )}
                  </Button>

                  {/* Show AI-generated prompt for transparency (only when AI improved) */}
                  {generatedPrompt && improvePrompt && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View AI-optimized prompt
                      </summary>
                      <p className="mt-2 p-2 bg-muted rounded text-muted-foreground">
                        {generatedPrompt}
                      </p>
                    </details>
                  )}

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
                              onClick={() =>
                                !isAdded && addGeneratedImage(image)
                              }
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
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
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
                      onClick={() => removeMediaUrl(url)}
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
