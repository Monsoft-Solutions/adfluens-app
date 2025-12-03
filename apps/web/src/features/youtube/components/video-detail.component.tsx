import React, { useEffect, useState } from "react";
import type { YouTubeVideo, YouTubeComment } from "@repo/types";
import { trpcClient } from "@/lib/trpc";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MessageCircle,
  ThumbsUp,
  User,
  Loader2,
} from "lucide-react";
import { VideoAnalyzer } from "../../ai/components/video-analyzer.component";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Separator,
  formatCompactNumber,
  cn,
} from "@repo/ui";

type VideoDetailProps = {
  video: YouTubeVideo;
  onBack: () => void;
};

/**
 * Video detail page showing embedded player, stats, and comments
 */
export const VideoDetail: React.FC<VideoDetailProps> = ({ video, onBack }) => {
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoadingComments(true);
        const { comments } = await trpcClient.youtube.getComments.query({
          videoId: video.id,
        });
        setComments(comments);
      } catch {
        setCommentsError(
          "Could not load comments. They might be disabled for this video."
        );
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [video.id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="animate-in slide-in-from-right-4 duration-300 pb-20">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Channel
      </Button>

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
          <Card className="border-border/50">
            <CardContent className="p-6">
              <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-4 border-b border-border">
                <span className="font-semibold text-primary">
                  {video.channelTitle}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(video.publishedAt)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-b border-border">
                <StatCard
                  icon={<Eye className="w-5 h-5" />}
                  value={formatCompactNumber(parseInt(video.viewCount, 10))}
                  label="Views"
                />
                <StatCard
                  icon={<ThumbsUp className="w-5 h-5" />}
                  value={formatCompactNumber(parseInt(video.likeCount, 10))}
                  label="Likes"
                />
                <StatCard
                  icon={<MessageCircle className="w-5 h-5" />}
                  value={formatCompactNumber(parseInt(video.commentCount, 10))}
                  label="Comments"
                />
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Description
                </h3>
                <div
                  className={cn(
                    "text-sm text-muted-foreground whitespace-pre-line",
                    !showFullDesc && "line-clamp-3"
                  )}
                >
                  {video.description || "No description available."}
                </div>
                {video.description && video.description.length > 150 && (
                  <Button
                    variant="link"
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="text-primary font-medium mt-2 p-0 h-auto"
                  >
                    {showFullDesc ? "Show less" : "Show more"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Comments */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col max-h-[800px] border-border/50">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Top Comments
              </CardTitle>
            </CardHeader>

            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-4">
                {loadingComments ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-sm">Loading comments...</p>
                  </div>
                ) : commentsError ? (
                  <div className="text-center p-4 text-muted-foreground bg-muted rounded-lg text-sm">
                    {commentsError}
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    No comments found.
                  </div>
                ) : (
                  comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* AI Analysis Section - Full Width Below */}
      <div className="mt-8">
        <VideoAnalyzer video={video} comments={comments} />
      </div>
    </div>
  );
};

/**
 * Stat card component for video metrics
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string;
  label: string;
}> = ({ icon, value, label }) => (
  <div className="flex flex-col items-center justify-center p-3 bg-muted rounded-lg">
    <span className="text-muted-foreground mb-1">{icon}</span>
    <span className="font-bold text-foreground">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

/**
 * Comment item component
 */
const CommentItem: React.FC<{ comment: YouTubeComment }> = ({ comment }) => (
  <div className="flex gap-3">
    <div className="flex-shrink-0">
      {comment.authorProfileImageUrl ? (
        <img
          src={comment.authorProfileImageUrl}
          alt={comment.authorDisplayName}
          className="w-8 h-8 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorDisplayName)}&background=random`;
          }}
        />
      ) : (
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-xs font-bold text-foreground truncate">
          {comment.authorDisplayName}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {new Date(comment.publishedAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed break-words">
        {comment.textDisplay}
      </p>
      <div className="flex items-center gap-1 mt-1.5 text-muted-foreground/60">
        <ThumbsUp className="w-3 h-3" />
        <span className="text-xs">
          {formatCompactNumber(parseInt(comment.likeCount, 10))}
        </span>
      </div>
    </div>
  </div>
);
