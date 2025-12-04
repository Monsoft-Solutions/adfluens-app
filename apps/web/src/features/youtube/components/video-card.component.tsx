import React from "react";
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import { Eye, ThumbsUp, MessageCircle, Calendar } from "lucide-react";
import { Card, CardContent, formatCompactNumber, cn } from "@repo/ui";

type VideoCardProps = {
  video: YouTubeVideo;
  onClick: (video: YouTubeVideo) => void;
};

/**
 * Video card component displaying video thumbnail and stats
 * Uses shadcn/ui Card component with "Soft Brutalism" styling from DESIGN.md
 * No drop shadows - uses border and translate for hover effects
 */
export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Card
      onClick={() => onClick(video)}
      className={cn(
        "group overflow-hidden cursor-pointer flex flex-col h-full",
        "border border-border transition-all duration-200",
        "hover:-translate-y-1 hover:border-foreground/20"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Content */}
      <CardContent className="p-5 flex flex-col flex-grow">
        <h3
          className={cn(
            "font-semibold text-card-foreground leading-snug line-clamp-2 mb-2",
            "group-hover:text-primary transition-colors"
          )}
          title={video.title}
        >
          {video.title}
        </h3>

        <p className="text-xs text-muted-foreground font-medium mb-4">
          {video.channelTitle}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-muted-foreground">
          <StatItem
            icon={<Eye className="w-3.5 h-3.5" />}
            value={formatCompactNumber(parseInt(video.viewCount, 10))}
            label="Views"
          />
          <StatItem
            icon={<ThumbsUp className="w-3.5 h-3.5" />}
            value={formatCompactNumber(parseInt(video.likeCount, 10))}
            label="Likes"
          />
          <StatItem
            icon={<MessageCircle className="w-3.5 h-3.5" />}
            value={formatCompactNumber(parseInt(video.commentCount, 10))}
            label="Comments"
          />
          <StatItem
            icon={<Calendar className="w-3.5 h-3.5" />}
            value={formatDate(video.publishedAt)}
            label="Uploaded"
          />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Individual stat item component for video metrics
 */
const StatItem: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
}> = ({ icon, value, label }) => (
  <div className="flex items-center gap-1.5" title={label}>
    <span className="text-muted-foreground/60">{icon}</span>
    <span className="font-medium">{value}</span>
  </div>
);
