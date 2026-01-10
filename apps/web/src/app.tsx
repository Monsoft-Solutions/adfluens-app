import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider, trpcClient } from "./lib/trpc";
import { AuthProvider } from "./lib/auth.provider";
import { ThemeProvider } from "./lib/theme.provider";
import { TooltipProvider } from "@repo/ui";
import { AppLayout } from "./shared/components/app-layout.component";
import { ProtectedRoute } from "./shared/components/protected-route.component";
import { ChannelAnalyzerView } from "./features/youtube/views/channel-analyzer.view";
import { VideoDetailView } from "./features/youtube/views/video-detail.view";
import { VideoSearchView } from "./features/search/views/video-search.view";
import { OrganizationSettingsView } from "./features/organization/views/organization-settings.view";
import { InstagramView } from "./features/social-media/views/instagram.view";
import { FacebookView } from "./features/social-media/views/facebook.view";
import { TiktokView } from "./features/social-media/views/tiktok.view";
import { GMBView } from "./features/gmb/views/gmb.view";
import { MetaView } from "./features/meta/views/meta.view";
import { SignInView } from "./features/auth/views/sign-in.view";
import { SignUpView } from "./features/auth/views/sign-up.view";

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
 * All routes except auth routes are protected and require authentication
 *
 * Provider hierarchy:
 * - ThemeProvider: Manages light/dark theme with system preference detection
 * - QueryClientProvider: TanStack Query for data fetching
 * - TRPCProvider: Type-safe API calls
 * - AuthProvider: Better Auth session management
 * - TooltipProvider: Radix UI tooltips
 */
const App: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
          <AuthProvider>
            <TooltipProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public auth routes - outside main layout */}
                  <Route path="/sign-in" element={<SignInView />} />
                  <Route path="/sign-up" element={<SignUpView />} />

                  {/* Protected routes - require authentication */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<ChannelAnalyzerView />} />
                      <Route path="/search" element={<VideoSearchView />} />
                      <Route path="/video/:id" element={<VideoDetailView />} />
                      <Route
                        path="/settings"
                        element={<OrganizationSettingsView />}
                      />
                      <Route
                        path="/social/instagram"
                        element={<InstagramView />}
                      />
                      <Route
                        path="/social/facebook"
                        element={<FacebookView />}
                      />
                      <Route path="/social/tiktok" element={<TiktokView />} />
                      <Route path="/gmb" element={<GMBView />} />
                      <Route path="/meta" element={<MetaView />} />
                    </Route>
                  </Route>
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
