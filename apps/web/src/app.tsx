import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider, trpcClient } from "./lib/trpc";
import { Header } from "./shared/components/header.component";
import { AnalyzerInput } from "./features/youtube/components/analyzer-input.component";
import { VideoGrid } from "./features/youtube/components/video-grid.component";
import { VideoDetail } from "./features/youtube/components/video-detail.component";
import { fetchChannelVideos } from "./features/youtube/utils/youtube.utils";
import type { YouTubeVideo } from "@repo/types";
import { AlertCircle, Loader2 } from "lucide-react";
import { TooltipProvider, cn } from "@repo/ui";

/**
 * React Query client configuration with optimized defaults
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Main application component
 */
const App: React.FC = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  const handleAnalyze = async (channelId: string) => {
    setLoading(true);
    setError(null);
    setVideos([]);
    setSelectedVideo(null);

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
    setSelectedVideo(video);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToGrid = () => {
    setSelectedVideo(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
              {selectedVideo ? (
                <VideoDetail video={selectedVideo} onBack={handleBackToGrid} />
              ) : (
                <>
                  <div className="mb-8">
                    <AnalyzerInput
                      onAnalyze={handleAnalyze}
                      isLoading={loading}
                    />
                  </div>

                  {error && (
                    <div
                      className={cn(
                        "bg-destructive/10 border border-destructive/20 text-destructive",
                        "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
                      )}
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
                    <VideoGrid
                      videos={videos}
                      onVideoClick={handleVideoClick}
                    />
                  )}
                </>
              )}
            </main>

            <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground text-sm">
              <p>© {new Date().getFullYear()} YouTube Channel Analyzer</p>
            </footer>
          </div>
        </TooltipProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
};

export default App;
