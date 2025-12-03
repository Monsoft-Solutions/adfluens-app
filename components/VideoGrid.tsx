import React from 'react';
import { YouTubeVideo } from '../types';
import { VideoCard } from './VideoCard';

interface VideoGridProps {
  videos: YouTubeVideo[];
}

export const VideoGrid: React.FC<VideoGridProps> = ({ videos }) => {
  if (videos.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        Top Hits
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {videos.length} videos
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};