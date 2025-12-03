import React from "react";
import type { YouTubeVideo } from "@repo/types";
import { VideoCard } from "./video-card.component";
import { Badge } from "@repo/ui";

type VideoGridProps = {
  videos: YouTubeVideo[];
  onVideoClick: (video: YouTubeVideo) => void;
};

/**
 * Grid layout for displaying video cards
 */
export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onVideoClick,
}) => {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
        Top Hits
        <Badge variant="secondary" className="font-normal">
          {videos.length} videos
        </Badge>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} onClick={onVideoClick} />
        ))}
      </div>
    </div>
  );
};
