import React from 'react';
import { YouTubeVideo } from '../types';
import { Eye, ThumbsUp, MessageCircle, Calendar } from 'lucide-react';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: (video: YouTubeVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div 
      onClick={() => onClick(video)}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200 overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-red-600 transition-colors" title={video.title}>
          {video.title}
        </h3>
        
        <p className="text-xs text-gray-500 font-medium mb-4">
          {video.channelTitle}
        </p>

        <div className="mt-auto grid grid-cols-2 gap-y-3 gap-x-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5" title="Views">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">{formatNumber(video.viewCount)}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Likes">
            <ThumbsUp className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">{formatNumber(video.likeCount)}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Comments">
            <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">{formatNumber(video.commentCount)}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Uploaded">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">{formatDate(video.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};