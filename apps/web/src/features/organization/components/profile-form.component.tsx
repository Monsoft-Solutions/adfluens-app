import React, { useState, useEffect } from "react";
import {
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Loader2,
  Save,
} from "lucide-react";
import { Button, Input, Label, cn } from "@repo/ui";

/** TikTok icon component (not available in lucide-react) */
const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

/**
 * Profile form data shape
 */
export type ProfileFormData = {
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
};

type ProfileFormProps = {
  initialData?: Partial<ProfileFormData>;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  isLoading?: boolean;
};

/**
 * Form component for editing organization profile (website + social links)
 */
export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    websiteUrl: initialData?.websiteUrl ?? "",
    instagramUrl: initialData?.instagramUrl ?? "",
    facebookUrl: initialData?.facebookUrl ?? "",
    tiktokUrl: initialData?.tiktokUrl ?? "",
    twitterUrl: initialData?.twitterUrl ?? "",
    linkedinUrl: initialData?.linkedinUrl ?? "",
  });

  // Update form when initialData changes (e.g., after fetch)
  useEffect(() => {
    if (initialData) {
      setFormData({
        websiteUrl: initialData.websiteUrl ?? "",
        instagramUrl: initialData.instagramUrl ?? "",
        facebookUrl: initialData.facebookUrl ?? "",
        tiktokUrl: initialData.tiktokUrl ?? "",
        twitterUrl: initialData.twitterUrl ?? "",
        linkedinUrl: initialData.linkedinUrl ?? "",
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Website URL */}
      <div className="space-y-2">
        <Label htmlFor="websiteUrl" className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          Website URL
        </Label>
        <Input
          id="websiteUrl"
          type="url"
          placeholder="https://yourwebsite.com"
          value={formData.websiteUrl}
          onChange={(e) => handleChange("websiteUrl", e.target.value)}
          disabled={isLoading}
          className="bg-background"
        />
        <p className="text-xs text-muted-foreground">
          Your business website. We&apos;ll scrape it to extract business
          information.
        </p>
      </div>

      {/* Social Media Links Section */}
      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-medium text-foreground mb-4">
          Social Media Links
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagramUrl" className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" />
              Instagram
            </Label>
            <Input
              id="instagramUrl"
              type="url"
              placeholder="https://instagram.com/yourprofile"
              value={formData.instagramUrl}
              onChange={(e) => handleChange("instagramUrl", e.target.value)}
              disabled={isLoading}
              className="bg-background"
            />
          </div>

          {/* Facebook */}
          <div className="space-y-2">
            <Label htmlFor="facebookUrl" className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Label>
            <Input
              id="facebookUrl"
              type="url"
              placeholder="https://facebook.com/yourpage"
              value={formData.facebookUrl}
              onChange={(e) => handleChange("facebookUrl", e.target.value)}
              disabled={isLoading}
              className="bg-background"
            />
          </div>

          {/* TikTok */}
          <div className="space-y-2">
            <Label htmlFor="tiktokUrl" className="flex items-center gap-2">
              <TikTokIcon className="w-4 h-4" />
              TikTok
            </Label>
            <Input
              id="tiktokUrl"
              type="url"
              placeholder="https://tiktok.com/@yourprofile"
              value={formData.tiktokUrl}
              onChange={(e) => handleChange("tiktokUrl", e.target.value)}
              disabled={isLoading}
              className="bg-background"
            />
          </div>

          {/* Twitter/X */}
          <div className="space-y-2">
            <Label htmlFor="twitterUrl" className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-sky-500" />
              Twitter / X
            </Label>
            <Input
              id="twitterUrl"
              type="url"
              placeholder="https://twitter.com/yourprofile"
              value={formData.twitterUrl}
              onChange={(e) => handleChange("twitterUrl", e.target.value)}
              disabled={isLoading}
              className="bg-background"
            />
          </div>

          {/* LinkedIn */}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-blue-700" />
              LinkedIn
            </Label>
            <Input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/company/yourcompany"
              value={formData.linkedinUrl}
              onChange={(e) => handleChange("linkedinUrl", e.target.value)}
              disabled={isLoading}
              className="bg-background"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={isLoading} className={cn("min-w-32")}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
