/**
 * TikTok Profile Component
 *
 * Displays TikTok profile data including stats, bio, and account info.
 *
 * @module web/features/social-media/components/tiktok-profile
 */

import React from "react";
import {
  Users,
  Heart,
  Video,
  UserPlus,
  RefreshCw,
  Calendar,
  Globe,
  Lock,
  Store,
  CheckCircle,
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
import type { TikTokPlatformData } from "@repo/types/social-media/tiktok-platform-data.type";
import type { SocialMediaAccountData } from "@repo/types/social-media/social-media-account-data.type";

type TiktokProfileProps = {
  /** The TikTok account data */
  account: SocialMediaAccountData;

  /** Callback when refresh button is clicked */
  onRefresh?: () => void;

  /** Whether a refresh is in progress */
  isRefreshing?: boolean;
};

/**
 * TikTok icon component
 */
const TiktokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

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
 * Format Unix timestamp to readable date
 */
function formatCreateDate(timestamp: number | null | undefined): string {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
 * TikTok Profile display component
 */
export const TiktokProfile: React.FC<TiktokProfileProps> = ({
  account,
  onRefresh,
  isRefreshing,
}) => {
  const platformData = account.platformData as TikTokPlatformData | null;

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
                  <TiktokIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              {/* Name and Username */}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">
                    {account.displayName || account.username}
                  </CardTitle>
                  {account.isVerified && (
                    <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500" />
                  )}
                </div>
                <CardDescription className="text-base">
                  @{account.username}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {account.isBusinessAccount && (
                    <Badge variant="secondary">
                      <Store className="w-3 h-3 mr-1" />
                      Business
                    </Badge>
                  )}
                  {platformData?.commerceUserInfo?.category && (
                    <Badge variant="outline">
                      {platformData.commerceUserInfo.category}
                    </Badge>
                  )}
                  {platformData?.privateAccount && (
                    <Badge variant="outline">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                  {platformData?.isOrganization && (
                    <Badge variant="outline">Organization</Badge>
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
          {/* Bio / Signature */}
          {account.bio && (
            <p className="text-sm text-foreground whitespace-pre-line">
              {account.bio}
            </p>
          )}

          {/* TikTok Profile Link */}
          <a
            href={`https://www.tiktok.com/@${account.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <TiktokIcon className="w-4 h-4" />
            View on TikTok
          </a>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
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
              icon={<Heart className="w-5 h-5" />}
              label="Likes"
              value={formatCount(platformData?.heartCount)}
            />
            <StatCard
              icon={<Video className="w-5 h-5" />}
              label="Videos"
              value={formatCount(platformData?.videoCount)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      {platformData && (platformData.createTime || platformData.language) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Created */}
              {platformData.createTime && (
                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">
                      Account Created
                    </p>
                    <p className="text-foreground">
                      {formatCreateDate(platformData.createTime)}
                    </p>
                  </div>
                </div>
              )}

              {/* Language */}
              {platformData.language && (
                <div className="flex items-start gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">
                      Language
                    </p>
                    <p className="text-foreground uppercase">
                      {platformData.language}
                    </p>
                  </div>
                </div>
              )}

              {/* Friend Count */}
              {platformData.friendCount !== null &&
                platformData.friendCount !== undefined && (
                  <div className="flex items-start gap-3 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-muted-foreground text-xs mb-0.5">
                        Friends
                      </p>
                      <p className="text-foreground">
                        {formatCount(platformData.friendCount)}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Settings Card */}
      {platformData &&
        (platformData.duetSetting !== null ||
          platformData.stitchSetting !== null ||
          platformData.downloadSetting !== null) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {platformData.duetSetting === 0 && (
                  <Badge variant="outline">Duets Enabled</Badge>
                )}
                {platformData.stitchSetting === 0 && (
                  <Badge variant="outline">Stitch Enabled</Badge>
                )}
                {platformData.downloadSetting === 0 && (
                  <Badge variant="outline">Downloads Enabled</Badge>
                )}
                {platformData.ttSeller && (
                  <Badge variant="secondary">
                    <Store className="w-3 h-3 mr-1" />
                    TikTok Seller
                  </Badge>
                )}
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
