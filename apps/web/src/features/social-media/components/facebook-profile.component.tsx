/**
 * Facebook Profile Component
 *
 * Displays Facebook page data including stats, bio, business info, and social links.
 *
 * @module web/features/social-media/components/facebook-profile
 */

import React from "react";
import {
  Users,
  ThumbsUp,
  ExternalLink,
  MapPin,
  Building2,
  Link as LinkIcon,
  RefreshCw,
  Phone,
  Mail,
  Globe,
  Calendar,
  DollarSign,
  Megaphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  cn,
} from "@repo/ui";
import type { FacebookPlatformData } from "@repo/types/social-media/facebook-platform-data.type";
import type { SocialMediaAccountData } from "@repo/types/social-media/social-media-account-data.type";

type FacebookProfileProps = {
  /** The Facebook account data */
  account: SocialMediaAccountData;

  /** Callback when refresh button is clicked */
  onRefresh?: () => void;

  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
};

/**
 * Format number with K/M suffix for display
 */
function formatCount(count: number | null | undefined): string {
  if (count === null || count === undefined) return "0";
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toLocaleString();
}

/**
 * Format date for display
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Get social platform icon and name from URL
 */
function getSocialPlatformInfo(url: string): { name: string; color: string } {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("instagram.com")) {
    return { name: "Instagram", color: "text-pink-500" };
  }
  if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    return { name: "YouTube", color: "text-red-500" };
  }
  if (lowerUrl.includes("tiktok.com")) {
    return { name: "TikTok", color: "text-foreground" };
  }
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) {
    return { name: "Twitter/X", color: "text-sky-500" };
  }
  if (lowerUrl.includes("linkedin.com")) {
    return { name: "LinkedIn", color: "text-blue-600" };
  }
  return { name: "Website", color: "text-muted-foreground" };
}

/**
 * Stat card component for displaying profile metrics
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
    <div className="text-muted-foreground mb-1">{icon}</div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

/**
 * Info row component for displaying key-value pairs
 */
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  isLink?: boolean;
  href?: string;
}> = ({ icon, label, value, isLink, href }) => (
  <div className="flex items-start gap-3 text-sm">
    <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      {isLink && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-foreground wrap-break-word">{value}</p>
      )}
    </div>
  </div>
);

/**
 * Facebook Profile display component
 */
export const FacebookProfile: React.FC<FacebookProfileProps> = ({
  account,
  onRefresh,
  isRefreshing,
}) => {
  const platformData = account.platformData as FacebookPlatformData | null;

  return (
    <div className="space-y-6">
      {/* Cover Photo */}
      {platformData?.coverPhoto?.imageUri && (
        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
          <img
            src={platformData.coverPhoto.imageUri}
            alt="Cover photo"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            style={{
              objectPosition: `${(platformData.coverPhoto.focusX ?? 0.5) * 100}% ${(platformData.coverPhoto.focusY ?? 0.5) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Profile Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              {account.profilePicUrl ? (
                <img
                  src={account.profilePicUrlHd || account.profilePicUrl}
                  alt={account.displayName || account.username}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              {/* Name and Username */}
              <div>
                <CardTitle className="text-xl">
                  {account.displayName || account.username}
                </CardTitle>
                <CardDescription className="text-base">
                  @{account.username}
                </CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  {account.isBusinessAccount && (
                    <Badge variant="secondary">
                      <Building2 className="w-3 h-3 mr-1" />
                      Business Page
                    </Badge>
                  )}
                  {platformData?.category && (
                    <Badge variant="outline">{platformData.category}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bio / Page Intro */}
          {account.bio && (
            <p className="text-sm text-foreground whitespace-pre-line">
              {account.bio}
            </p>
          )}

          {/* Website */}
          {account.externalUrl && (
            <a
              href={account.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              {account.externalUrl.replace(/^https?:\/\//, "").split("/")[0]}
            </a>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Followers"
              value={formatCount(account.followerCount)}
            />
            <StatCard
              icon={<ThumbsUp className="w-5 h-5" />}
              label="Page Likes"
              value={formatCount(platformData?.likeCount)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Business Info Card */}
      {platformData &&
        (platformData.address ||
          platformData.phone ||
          platformData.email ||
          platformData.website ||
          platformData.priceRange ||
          platformData.creationDate) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Business Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address */}
                {platformData.address && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="Address"
                    value={platformData.address}
                  />
                )}

                {/* Phone */}
                {platformData.phone && (
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label="Phone"
                    value={platformData.phone}
                    isLink
                    href={`tel:${platformData.phone}`}
                  />
                )}

                {/* Email */}
                {platformData.email && (
                  <InfoRow
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    value={platformData.email}
                    isLink
                    href={`mailto:${platformData.email}`}
                  />
                )}

                {/* Website */}
                {platformData.website && (
                  <InfoRow
                    icon={<Globe className="w-4 h-4" />}
                    label="Website"
                    value={platformData.website
                      .replace(/^https?:\/\//, "")
                      .replace(/\/$/, "")}
                    isLink
                    href={platformData.website}
                  />
                )}

                {/* Price Range */}
                {platformData.priceRange && (
                  <InfoRow
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Price Range"
                    value={platformData.priceRange}
                  />
                )}

                {/* Creation Date */}
                {platformData.creationDate && (
                  <InfoRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Page Created"
                    value={platformData.creationDate}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Ad Library Info */}
      {platformData?.adLibrary?.adStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Advertising
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  platformData.adLibrary.adStatus.includes("running")
                    ? "default"
                    : "secondary"
                }
              >
                {platformData.adLibrary.adStatus.includes("running")
                  ? "Active Ads"
                  : "No Active Ads"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {platformData.adLibrary.adStatus}
              </p>
            </div>
            {platformData.adLibrary.pageId && (
              <a
                href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${platformData.adLibrary.pageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <ExternalLink className="w-4 h-4" />
                View in Ad Library
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Links Card */}
      {platformData?.links && platformData.links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Social Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {platformData.links.map((link, index) => {
                const platformInfo = getSocialPlatformInfo(link);
                return (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg",
                      "bg-muted/50 hover:bg-muted transition-colors"
                    )}
                  >
                    <LinkIcon className={cn("w-4 h-4", platformInfo.color)} />
                    <span className="text-sm font-medium text-foreground">
                      {platformInfo.name}
                    </span>
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {link.replace(/^https?:\/\//, "")}
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Last updated: {formatDate(account.scrapedAt)}
        </p>
      </div>
    </div>
  );
};
