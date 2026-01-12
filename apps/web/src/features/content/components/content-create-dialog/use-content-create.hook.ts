/**
 * Content Create Hook
 *
 * Custom hook managing all state, mutations, and handlers for content creation.
 */

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpcClient, useTRPC } from "@/lib/trpc";
import type { Platform, GeneratedImage } from "./content-create-dialog.types";
import { platformConfig } from "./content-create-dialog.types";

type UseContentCreateProps = {
  pageId: string;
  onSuccess?: () => void;
  onClose: () => void;
};

export const useContentCreate = ({
  pageId,
  onSuccess,
  onClose: _onClose,
}: UseContentCreateProps) => {
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
  const [ideaInput, setIdeaInput] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [imageModel, setImageModel] = useState<string>("nano-banana-pro");
  const [imageSize, setImageSize] = useState<string>("square");
  const [imageCount, setImageCount] = useState<number>(2);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Advanced style options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imageStyle, setImageStyle] = useState<string | undefined>();
  const [imageMood, setImageMood] = useState<string | undefined>();
  const [imageComposition, setImageComposition] = useState<
    string | undefined
  >();

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

  // Reset form function
  const resetForm = () => {
    setPlatforms(["facebook"]);
    setCaption("");
    setHashtags([]);
    setMediaUrls([]);
    setAiTopic("");
    setHashtagInput("");
    setMediaUrlInput("");
    setIdeaInput("");
    setImagePrompt("");
    setNegativePrompt("");
    setImageCount(2);
    setGeneratedImages([]);
    setMediaTab("url");
    setIsOptimizing(false);
    setShowAdvanced(false);
    setImageStyle(undefined);
    setImageMood(undefined);
    setImageComposition(undefined);
  };

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

  // Optimize prompt from idea mutation
  const optimizePromptMutation = useMutation({
    mutationFn: () =>
      trpcClient.content.optimizeImagePrompt.mutate({
        idea: ideaInput,
        model: imageModel as "nano-banana-pro" | "gpt-image-1",
        style: imageStyle as
          | "photorealistic"
          | "illustration"
          | "3d-render"
          | "flat-design"
          | "watercolor"
          | "cinematic"
          | undefined,
        mood: imageMood as
          | "vibrant"
          | "moody"
          | "professional"
          | "playful"
          | "calm"
          | "luxurious"
          | undefined,
        composition: imageComposition as
          | "closeup"
          | "wide"
          | "overhead"
          | "centered"
          | "rule-of-thirds"
          | undefined,
      }),
    onMutate: () => {
      setIsOptimizing(true);
    },
    onSuccess: (result) => {
      setImagePrompt(result.prompt);
      setNegativePrompt(result.negativePrompt || "");
      setIsOptimizing(false);
      setShowAdvanced(false);
    },
    onError: () => {
      setIsOptimizing(false);
    },
  });

  // Generate AI images from prompt mutation
  const generateFromIdeaMutation = useMutation({
    mutationFn: () =>
      trpcClient.content.generateFromIdea.mutate({
        prompt: imagePrompt,
        negativePrompt: negativePrompt || undefined,
        model: imageModel as "nano-banana-pro" | "gpt-image-1",
        size: imageSize as "square" | "portrait" | "landscape",
        count: imageCount,
      }),
    onSuccess: (result) => {
      setGeneratedImages(result.images);
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

  const handleCreate = () => {
    createMutation.mutate();
  };

  const isValid =
    platforms.length > 0 &&
    caption.trim().length > 0 &&
    !isCaptionTooLong &&
    mediaUrls.length > 0;

  return {
    // Platform state
    platforms,
    togglePlatform,

    // Media state
    mediaTab,
    setMediaTab,
    mediaUrls,
    mediaUrlInput,
    setMediaUrlInput,
    addMediaUrl,
    removeMediaUrl,
    isUploadingMedia,

    // AI Image generation
    ideaInput,
    setIdeaInput,
    imagePrompt,
    setImagePrompt,
    negativePrompt,
    setNegativePrompt,
    imageModel,
    setImageModel,
    imageSize,
    setImageSize,
    imageCount,
    setImageCount,
    generatedImages,
    addGeneratedImage,
    isOptimizing,
    aiAvailability,
    imageOptions,
    selectedModelConfig,
    optimizePromptMutation,
    generateFromIdeaMutation,

    // Advanced style options
    showAdvanced,
    setShowAdvanced,
    imageStyle,
    setImageStyle,
    imageMood,
    setImageMood,
    imageComposition,
    setImageComposition,

    // Caption state
    aiTopic,
    setAiTopic,
    caption,
    setCaption,
    minMaxCaption,
    captionLength,
    isCaptionTooLong,
    generateCaptionMutation,

    // Hashtag state
    hashtags,
    hashtagInput,
    setHashtagInput,
    addHashtag,
    removeHashtag,
    suggestHashtagsMutation,

    // Form actions
    handleCreate,
    isValid,
    isCreating: createMutation.isPending,
    error: createMutation.error,
  };
};
