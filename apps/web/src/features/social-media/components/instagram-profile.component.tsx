/**
 * Instagram Profile Component
 *
 * Displays Instagram profile data including stats, bio, and business info.
 *
 * @module web/features/social-media/components/instagram-profile
 */

import React from "react";
import {
  Users,
  UserPlus,
  Grid3X3,
  ExternalLink,
  MapPin,
  BadgeCheck,
  Building2,
  Link as LinkIcon,
  RefreshCw,
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
import type { InstagramPlatformData } from "@repo/types/social-media/instagram-platform-data.type";
import type { SocialMediaAccountData } from "@repo/types/social-media/social-media-account-data.type";

type InstagramProfileProps = {
  /** The Instagram account data */
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
 * Instagram Profile display component
 */
export const InstagramProfile: React.FC<InstagramProfileProps> = ({
  account,
  onRefresh,
  isRefreshing,
}) => {
  const platformData = account.platformData as InstagramPlatformData | null;

  return (
    <div className="space-y-6">
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
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              {/* Name and Username */}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">
                    {account.displayName || account.username}
                  </CardTitle>
                  {account.isVerified && (
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <CardDescription className="text-base">
                  @{account.username}
                </CardDescription>
                {account.isBusinessAccount && (
                  <Badge variant="secondary" className="mt-1">
                    <Building2 className="w-3 h-3 mr-1" />
                    Business Account
                  </Badge>
                )}
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
          {/* Bio */}
          {account.bio && (
            <p className="text-sm text-foreground whitespace-pre-line">
              {account.bio}
            </p>
          )}

          {/* External URL */}
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
          <div className="grid grid-cols-3 gap-4 pt-2">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Followers"
              value={formatCount(account.followerCount)}
            />
            <StatCard
              icon={<UserPlus className="w-5 h-5" />}
              label="Following"
              value={formatCount(account.followingCount)}
            />
            <StatCard
              icon={<Grid3X3 className="w-5 h-5" />}
              label="Posts"
              value={formatCount(platformData?.postsCount)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Info Card */}
      {platformData &&
        (platformData.categoryName || platformData.businessAddress) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Category */}
              {platformData.categoryName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{platformData.categoryName}</span>
                </div>
              )}

              {/* Address */}
              {platformData.businessAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    {platformData.businessAddress.streetAddress && (
                      <p>{platformData.businessAddress.streetAddress}</p>
                    )}
                    <p>
                      {[
                        platformData.businessAddress.cityName,
                        platformData.businessAddress.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Bio Links Card */}
      {platformData?.bioLinks && platformData.bioLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bio Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {platformData.bioLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    "bg-muted/50 hover:bg-muted transition-colors"
                  )}
                >
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1 truncate">
                    {link.title || link.url.replace(/^https?:\/\//, "")}
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              ))}
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
