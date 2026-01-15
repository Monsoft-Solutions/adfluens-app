/**
 * Content Create Dialog Types
 *
 * Shared types and constants for the content creation dialog.
 */

import { Facebook, Instagram } from "lucide-react";

export type ContentCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  onSuccess?: () => void;
};

export type Platform = "facebook" | "instagram";

export type GeneratedImage = {
  url: string;
  storedUrl: string;
  width: number;
  height: number;
  model: string;
};

export const platformConfig: Record<
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
