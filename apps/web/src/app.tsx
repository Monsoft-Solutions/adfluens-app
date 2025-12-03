import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider, trpcClient } from "./lib/trpc";
import { TooltipProvider } from "@repo/ui";
import { AppLayout } from "./shared/components/app-layout.component";
import { ChannelAnalyzerView } from "./features/youtube/views/channel-analyzer.view";
import { VideoDetailView } from "./features/youtube/views/video-detail.view";
import { VideoSearchView } from "./features/search/views/video-search.view";

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
 * Main application component with routing
 */
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<ChannelAnalyzerView />} />
                <Route path="/search" element={<VideoSearchView />} />
                <Route path="/video/:id" element={<VideoDetailView />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
};

export default App;
