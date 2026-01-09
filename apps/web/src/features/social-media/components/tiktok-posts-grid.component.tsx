/**
 * TikTok Posts Grid Component
 *
 * Displays a TikTok-style grid of posts with minimal design,
 * matching TikTok's native look and feel.
 *
 * @module web/features/social-media/components/tiktok-posts-grid
 */

import React, { useState } from "react";
import { Heart, MessageCircle, Play, Grid3X3 } from "lucide-react";
import { cn } from "@repo/ui";

/**
 * Post data type matching SocialMediaPostRow from database
 */
type TiktokPostData = {
  id: string;
  shortcode: string;
  caption: string | null;
  postUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  videoDuration: number | null;
  takenAt: Date | string | null;
};

type TiktokPostsGridProps = {
  /** Array of TikTok posts to display */
  posts: TiktokPostData[] | null;

  /** Whether posts are currently loading */
  isLoading?: boolean;
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
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

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
 * Single post card component - TikTok style
 */
const PostCard: React.FC<{ post: TiktokPostData }> = ({ post }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = () => {
    if (post.postUrl) {
      window.open(post.postUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative aspect-9/16 cursor-pointer group bg-neutral-900 rounded-md overflow-hidden"
    >
      {/* Image */}
      {post.thumbnailUrl && !imageError ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
          )}
          <img
            src={post.thumbnailUrl}
            alt=""
            className={cn(
              "w-full h-full object-cover",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
          <TiktokIcon className="w-8 h-8 text-neutral-600" />
        </div>
      )}

      {/* Duration badge (top-right) */}
      {post.videoDuration && (
        <div className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white font-medium">
          {formatDuration(post.videoDuration)}
        </div>
      )}

      {/* Play count (bottom-left) */}
      {post.playCount !== null && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-sm font-semibold drop-shadow-lg">
          <Play className="w-4 h-4 fill-white" />
          {formatCount(post.playCount)}
        </div>
      )}

      {/* Hover Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-3",
          "bg-black/50 opacity-0 group-hover:opacity-100",
          "transition-opacity duration-150"
        )}
      >
        <div className="flex items-center gap-2 text-white font-semibold">
          <Heart className="w-5 h-5 fill-white" />
          {formatCount(post.likeCount)}
        </div>
        <div className="flex items-center gap-2 text-white font-semibold">
          <MessageCircle className="w-5 h-5 fill-white" />
          {formatCount(post.commentCount)}
        </div>
      </div>
    </div>
  );
};

/**
 * Loading skeleton
 */
const PostSkeleton: React.FC = () => (
  <div className="aspect-9/16 bg-neutral-800 animate-pulse rounded-md" />
);

/**
 * Tab button component
 */
const TabButton: React.FC<{
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-4 py-3 text-xs font-semibold uppercase tracking-wider",
      "border-t transition-colors",
      active
        ? "border-foreground text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    )}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

/**
 * TikTok Posts Grid component
 */
export const TiktokPostsGrid: React.FC<TiktokPostsGridProps> = ({
  posts,
  isLoading,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="border-t border-border">
        {/* Tabs */}
        <div className="flex justify-center gap-8 border-b border-border">
          <TabButton
            active
            icon={<Grid3X3 className="w-3.5 h-3.5" />}
            label="Videos"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
          {[...Array(10)].map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // No posts state
  if (!posts || posts.length === 0) {
    return (
      <div className="border-t border-border">
        {/* Tabs */}
        <div className="flex justify-center gap-8 border-b border-border">
          <TabButton
            active
            icon={<Grid3X3 className="w-3.5 h-3.5" />}
            label="Videos"
          />
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
            <TiktokIcon className="w-10 h-10 text-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">
            No Videos Yet
          </p>
          <p className="text-sm text-muted-foreground">
            Videos will appear after scraping completes
          </p>
        </div>
      </div>
    );
  }

  const videosCount = posts.length;

  return (
    <div className="border-t border-border">
      {/* Tabs */}
      <div className="flex justify-center gap-8 border-b border-border">
        <TabButton
          active
          icon={<Grid3X3 className="w-3.5 h-3.5" />}
          label="Videos"
        />
      </div>

      {/* Grid - TikTok style with vertical videos */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Video count */}
      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">
          {videosCount} videos loaded
        </p>
      </div>
    </div>
  );
};
