import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import { VideoDetail } from "../components/video-detail.component";

/**
 * Video Detail view component
 * Displays detailed information about a video
 */
export const VideoDetailView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const video = location.state?.video as YouTubeVideo | undefined;

  const handleBack = () => {
    navigate(-1);
  };

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">
          Video not found. Please go back and select a video.
        </p>
      </div>
    );
  }

  return <VideoDetail video={video} onBack={handleBack} />;
};
