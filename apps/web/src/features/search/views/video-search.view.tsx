import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { cn, Badge } from "@repo/ui";
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import {
  VIDEO_SORT_OPTIONS,
  type VideoSortOption,
} from "@repo/types/youtube/video-sort-option.enum";
import { VideoGrid } from "../../youtube/components/video-grid.component";
import { SearchInput } from "../components/search-input.component";
import { SortSelect } from "../components/sort-select.component";

/**
 * Video Search view component
 * Allows users to search YouTube videos globally with sorting options
 */
export const VideoSearchView: React.FC = () => {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<VideoSortOption>(
    VIDEO_SORT_OPTIONS.VIEWS
  );
  const [hasSearched, setHasSearched] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    ...trpc.youtube.searchVideos.queryOptions({
      query: searchQuery,
      sortBy,
      maxResults: 20,
    }),
    enabled: !!searchQuery && hasSearched,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
  };

  const handleSortChange = (newSortBy: VideoSortOption) => {
    setSortBy(newSortBy);
    if (hasSearched && searchQuery) {
      refetch();
    }
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    navigate(`/video/${video.id}`, { state: { video } });
  };

  const videos = data?.videos ?? [];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Video Search
        </h1>
        <p className="text-muted-foreground">
          Search YouTube videos and sort results by views, likes, comments, or
          date
        </p>
      </div>

      {/* Search Controls */}
      <div className="mb-8 space-y-4">
        <SearchInput
          onSearch={handleSearch}
          isLoading={isLoading}
          placeholder="Search YouTube videos..."
        />

        {hasSearched && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="font-normal">
                  {'"'}
                  {searchQuery}
                  {'"'}
                </Badge>
              )}
              {videos.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {videos.length} results
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <SortSelect
                value={sortBy}
                onChange={handleSortChange}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div
          className={cn(
            "bg-destructive/10 border border-destructive/20 text-destructive",
            "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
          )}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">
            Searching YouTube...
          </p>
        </div>
      )}

      {/* Empty State - Before Search */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-full p-6 mb-6">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Search for Videos
          </h2>
          <p className="text-muted-foreground max-w-md">
            Enter a search query above to find videos on YouTube. You can sort
            results by views, likes, comments, or upload date.
          </p>
        </div>
      )}

      {/* Empty State - No Results */}
      {hasSearched && !isLoading && videos.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-full p-6 mb-6">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Videos Found
          </h2>
          <p className="text-muted-foreground max-w-md">
            No videos matched your search query. Try different keywords or
            adjust your search terms.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && videos.length > 0 && (
        <VideoGrid videos={videos} onVideoClick={handleVideoClick} />
      )}
    </div>
  );
};
