import React, { useEffect, useState } from 'react';
import { YouTubeVideo } from '../types/youtube/youtube-video.type';
import { YouTubeComment } from '../types/youtube/youtube-comment.type';
import { fetchVideoComments } from '../services/youtube.service';
import { ArrowLeft, Calendar, Eye, MessageCircle, ThumbsUp, User } from 'lucide-react';
import { VideoAnalyzer } from './video-analyzer.component';

interface VideoDetailProps {
  video: YouTubeVideo;
  onBack: () => void;
}

export const VideoDetail: React.FC<VideoDetailProps> = ({ video, onBack }) => {
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoadingComments(true);
        const data = await fetchVideoComments(video.id);
        setComments(data);
      } catch (err: any) {
        setCommentsError('Could not load comments. They might be disabled for this video.');
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [video.id]);

  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors mb-6 font-medium group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Channel
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Video & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>

          {/* Video Header & Stats */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{video.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-4 border-b border-gray-100">
              <span className="font-semibold text-red-600">{video.channelTitle}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(video.publishedAt)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100">
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg">
                <Eye className="w-5 h-5 text-gray-500 mb-1" />
                <span className="font-bold text-gray-900">{formatNumber(video.viewCount)}</span>
                <span className="text-xs text-gray-500">Views</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-gray-500 mb-1" />
                <span className="font-bold text-gray-900">{formatNumber(video.likeCount)}</span>
                <span className="text-xs text-gray-500">Likes</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="w-5 h-5 text-gray-500 mb-1" />
                <span className="font-bold text-gray-900">{formatNumber(video.commentCount)}</span>
                <span className="text-xs text-gray-500">Comments</span>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <div className={`text-sm text-gray-600 whitespace-pre-line ${showFullDesc ? '' : 'line-clamp-3'}`}>
                {video.description || "No description available."}
              </div>
              {video.description && video.description.length > 150 && (
                <button 
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-sm text-red-600 font-medium mt-2 hover:underline"
                >
                  {showFullDesc ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Comments */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm h-full flex flex-col max-h-[800px]">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-red-600" />
                Top Comments
              </h3>
            </div>
            
            <div className="overflow-y-auto p-4 space-y-4 flex-grow custom-scrollbar">
              {loadingComments ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                  <div className="w-8 h-8 border-2 border-red-200 border-t-red-600 rounded-full animate-spin mb-2"></div>
                  <p className="text-sm">Loading comments...</p>
                </div>
              ) : commentsError ? (
                <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg text-sm">
                  {commentsError}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center p-4 text-gray-500">No comments found.</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {comment.authorProfileImageUrl ? (
                        <img 
                          src={comment.authorProfileImageUrl} 
                          alt={comment.authorDisplayName} 
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorDisplayName)}&background=random`;
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-900 truncate">{comment.authorDisplayName}</span>
                        <span className="text-[10px] text-gray-400">{new Date(comment.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed break-words">{comment.textDisplay}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-gray-400">
                        <ThumbsUp className="w-3 h-3" />
                        <span className="text-xs">{formatNumber(comment.likeCount)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Analysis Section - Full Width Below */}
      <div className="mt-8">
        <VideoAnalyzer video={video} comments={comments} />
      </div>
    </div>
  );
};

