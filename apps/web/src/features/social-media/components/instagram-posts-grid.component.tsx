/**
 * Instagram Posts Grid Component
 *
 * Displays an Instagram-style grid of posts with minimal design,
 * matching Instagram's native look and feel.
 *
 * @module web/features/social-media/components/instagram-posts-grid
 */

import React, { useState } from "react";
import {
  Heart,
  MessageCircle,
  Play,
  Film,
  Images,
  Grid3X3,
  Clapperboard,
  ImageIcon,
} from "lucide-react";
import { cn } from "@repo/ui";

/**
 * Post data type matching SocialMediaPostRow from database
 */
type InstagramPostData = {
  id: string;
  shortcode: string;
  mediaType: string;
  productType: string | null;
  caption: string | null;
  postUrl: string | null;
  thumbnailUrl: string | null;
  playCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  videoDuration: number | null;
  takenAt: Date | string | null;
};

type InstagramPostsGridProps = {
  /** Array of Instagram posts to display */
  posts: InstagramPostData[] | null;

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
 * Single post card component - Instagram style
 */
const PostCard: React.FC<{ post: InstagramPostData }> = ({ post }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = () => {
    if (post.postUrl) {
      window.open(post.postUrl, "_blank", "noopener,noreferrer");
    }
  };

  const isVideo = post.mediaType === "video" || post.productType === "clips";
  const isCarousel = post.mediaType === "carousel";
  const isReel = post.productType === "clips";

  return (
    <div
      onClick={handleClick}
      className="relative aspect-square cursor-pointer group bg-neutral-900"
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
          <ImageIcon className="w-8 h-8 text-neutral-600" />
        </div>
      )}

      {/* Media Type Icon (top-right) */}
      {isReel && (
        <div className="absolute top-2 right-2">
          <Clapperboard className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
      {isVideo && !isReel && (
        <div className="absolute top-2 right-2">
          <Play className="w-5 h-5 text-white fill-white drop-shadow-lg" />
        </div>
      )}
      {isCarousel && (
        <div className="absolute top-2 right-2">
          <Images className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}

      {/* Play count for videos (bottom-left) */}
      {isVideo && post.playCount !== null && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-sm font-semibold drop-shadow-lg">
          <Play className="w-4 h-4 fill-white" />
          {formatCount(post.playCount)}
        </div>
      )}

      {/* Hover Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center gap-6",
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
  <div className="aspect-square bg-neutral-800 animate-pulse" />
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
 * Instagram Posts Grid component
 */
export const InstagramPostsGrid: React.FC<InstagramPostsGridProps> = ({
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
            label="Posts"
          />
          <TabButton icon={<Film className="w-3.5 h-3.5" />} label="Reels" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-0.5">
          {[...Array(12)].map((_, i) => (
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
            label="Posts"
          />
          <TabButton icon={<Film className="w-3.5 h-3.5" />} label="Reels" />
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full border-2 border-foreground flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-foreground" strokeWidth={1} />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">
            No Posts Yet
          </p>
          <p className="text-sm text-muted-foreground">
            Posts will appear after scraping completes
          </p>
        </div>
      </div>
    );
  }

  // Count reels vs regular posts
  const reelsCount = posts.filter((p) => p.productType === "clips").length;
  const postsCount = posts.length;

  return (
    <div className="border-t border-border">
      {/* Tabs */}
      <div className="flex justify-center gap-8 border-b border-border">
        <TabButton
          active
          icon={<Grid3X3 className="w-3.5 h-3.5" />}
          label={`Posts`}
        />
        {reelsCount > 0 && (
          <TabButton icon={<Film className="w-3.5 h-3.5" />} label={`Reels`} />
        )}
      </div>

      {/* Grid - Instagram uses 3 columns with 1-3px gap */}
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Post count */}
      <div className="py-4 text-center">
        <p className="text-xs text-muted-foreground">
          {postsCount} posts loaded
        </p>
      </div>
    </div>
  );
};
