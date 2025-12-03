import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider, trpcClient } from "./lib/trpc";
import { Header } from "./components/Header";
import { AnalyzerInput } from "./components/AnalyzerInput";
import { VideoGrid } from "./components/VideoGrid";
import { VideoDetail } from "./components/VideoDetail";
import { YouTubeVideo } from "./types/youtube/youtube-video.type";
import { fetchChannelVideos } from "./services/youtubeService";
import { AlertCircle, Loader2 } from "lucide-react";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigation State
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
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />

          <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
            {/* If a video is selected, show details. Otherwise show Search + Grid */}
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
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">
                      Resolving channel and fetching data...
                    </p>
                  </div>
                ) : (
                  <VideoGrid videos={videos} onVideoClick={handleVideoClick} />
                )}
              </>
            )}
          </main>

          <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} YouTube Channel Analyzer</p>
          </footer>
        </div>
      </TRPCProvider>
    </QueryClientProvider>
  );
};

export default App;
