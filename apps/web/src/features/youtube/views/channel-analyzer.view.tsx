import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@repo/ui";
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import { AnalyzerInput } from "../components/analyzer-input.component";
import { VideoGrid } from "../components/video-grid.component";
import { fetchChannelVideos } from "../utils/youtube.utils";

/**
 * Channel Analyzer view component
 * Allows users to analyze YouTube channel videos
 */
export const ChannelAnalyzerView: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (channelId: string) => {
    setLoading(true);
    setError(null);
    setVideos([]);

    try {
      const results = await fetchChannelVideos(channelId);
      setVideos(results);
      if (results.length === 0) {
        setError(
          "No videos found for this channel. Please check the Channel ID or Handle."
        );
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(
        errorMessage ||
          "An error occurred while fetching data. Please check your Channel ID/Handle."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    navigate(`/video/${video.id}`, { state: { video } });
  };

  return (
    <div className="animate-reveal">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-foreground mb-2 tracking-tight">
          Channel Analyzer
        </h1>
        <p className="text-muted-foreground">
          Enter a YouTube channel handle or ID to analyze their top videos
        </p>
      </div>

      <div className="mb-8">
        <AnalyzerInput onAnalyze={handleAnalyze} isLoading={loading} />
      </div>

      {error && (
        <div
          className={cn(
            "bg-destructive/10 border border-destructive/20 text-destructive",
            "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
          )}
        >
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">
            Resolving channel and fetching data...
          </p>
        </div>
      ) : (
        <VideoGrid videos={videos} onVideoClick={handleVideoClick} />
      )}
    </div>
  );
};
