import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import type { YouTubeComment } from "@repo/types/youtube/youtube-comment.type";
import type { VideoSortOption } from "@repo/types/youtube/video-sort-option.enum";

const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Get YouTube API key from environment
 */
const getYoutubeApiKey = () => process.env.YOUTUBE_API_KEY || "";

/**
 * Resolve a channel handle/name to a channel ID
 */
export const resolveChannelId = async (identifier: string): Promise<string> => {
  const apiKey = getYoutubeApiKey();

  if (!apiKey) {
    throw new Error("YouTube API key not configured on server");
  }

  // Check if already a channel ID
  if (/^UC[\w-]{21,22}$/.test(identifier)) {
    return identifier;
  }

  // Try resolving as handle
  let handle = identifier.trim();
  if (!handle.startsWith("@")) {
    handle = `@${handle}`;
  }

  const handleParams = new URLSearchParams({
    part: "id",
    forHandle: handle,
    key: apiKey,
  });

  const handleRes = await fetch(
    `${YOUTUBE_BASE_URL}/channels?${handleParams.toString()}`
  );

  if (handleRes.ok) {
    const handleData = await handleRes.json();
    if (handleData.items && handleData.items.length > 0) {
      return handleData.items[0].id;
    }
  }

  // Fallback to search
  const searchParams = new URLSearchParams({
    part: "snippet",
    type: "channel",
    q: identifier,
    key: apiKey,
    maxResults: "1",
  });

  const searchRes = await fetch(
    `${YOUTUBE_BASE_URL}/search?${searchParams.toString()}`
  );
  const searchData = await searchRes.json();

  if (!searchRes.ok) {
    throw new Error(searchData.error?.message || "Failed to resolve channel");
  }

  if (!searchData.items || searchData.items.length === 0) {
    throw new Error(`Could not find channel for: ${identifier}`);
  }

  const channelId = searchData.items[0].id.channelId;
  if (!channelId) {
    throw new Error("Invalid response from YouTube API");
  }

  return channelId;
};

/**
 * Fetch videos for a channel with statistics
 */
export const fetchChannelVideos = async (
  channelId: string
): Promise<YouTubeVideo[]> => {
  const apiKey = getYoutubeApiKey();

  if (!apiKey) {
    throw new Error("YouTube API key not configured on server");
  }

  // Search for videos in the channel
  const searchParams = new URLSearchParams({
    part: "snippet",
    channelId: channelId,
    order: "viewCount",
    type: "video",
    maxResults: "20",
    key: apiKey,
  });

  const searchRes = await fetch(
    `${YOUTUBE_BASE_URL}/search?${searchParams.toString()}`
  );
  const searchData = await searchRes.json();

  if (!searchRes.ok) {
    throw new Error(searchData.error?.message || "Failed to search videos");
  }

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  // Extract video IDs
  const videoIds = searchData.items
    .filter((item: { id: { videoId?: string } }) => item.id.videoId)
    .map((item: { id: { videoId: string } }) => item.id.videoId)
    .join(",");

  if (!videoIds) {
    return [];
  }

  // Fetch video details with statistics
  const videosParams = new URLSearchParams({
    part: "snippet,statistics",
    id: videoIds,
    key: apiKey,
  });

  const videosRes = await fetch(
    `${YOUTUBE_BASE_URL}/videos?${videosParams.toString()}`
  );
  const videosData = await videosRes.json();

  if (!videosRes.ok) {
    throw new Error(
      videosData.error?.message || "Failed to fetch video details"
    );
  }

  // Format response
  const videos: YouTubeVideo[] = videosData.items.map(
    (item: {
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: {
          high?: { url: string };
          medium?: { url: string };
        };
        publishedAt: string;
        channelTitle: string;
      };
      statistics: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        "",
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      viewCount: item.statistics.viewCount || "0",
      likeCount: item.statistics.likeCount || "0",
      commentCount: item.statistics.commentCount || "0",
    })
  );

  return videos;
};

/**
 * Fetch comments for a video
 */
export const fetchVideoComments = async (
  videoId: string
): Promise<YouTubeComment[]> => {
  const apiKey = getYoutubeApiKey();

  if (!apiKey) {
    throw new Error("YouTube API key not configured on server");
  }

  const params = new URLSearchParams({
    part: "snippet",
    videoId: videoId,
    maxResults: "20",
    textFormat: "plainText",
    key: apiKey,
  });

  const response = await fetch(
    `${YOUTUBE_BASE_URL}/commentThreads?${params.toString()}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch comments");
  }

  const comments: YouTubeComment[] = (data.items || []).map(
    (item: {
      id: string;
      snippet: {
        topLevelComment: {
          snippet: {
            authorDisplayName: string;
            authorProfileImageUrl: string;
            textDisplay: string;
            likeCount: number;
            publishedAt: string;
          };
        };
      };
    }) => ({
      id: item.id,
      authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorProfileImageUrl:
        item.snippet.topLevelComment.snippet.authorProfileImageUrl,
      textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount.toString(),
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
    })
  );

  return comments;
};

/**
 * Sort videos based on the specified sort option
 */
const sortVideos = (
  videos: YouTubeVideo[],
  sortBy: VideoSortOption
): YouTubeVideo[] => {
  return [...videos].sort((a, b) => {
    switch (sortBy) {
      case "views":
        return parseInt(b.viewCount, 10) - parseInt(a.viewCount, 10);
      case "likes":
        return parseInt(b.likeCount, 10) - parseInt(a.likeCount, 10);
      case "comments":
        return parseInt(b.commentCount, 10) - parseInt(a.commentCount, 10);
      case "date":
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      case "relevance":
      default:
        return 0; // Preserve original order from API
    }
  });
};

/**
 * Search videos globally on YouTube
 */
export const searchVideos = async (
  query: string,
  sortBy: VideoSortOption = "views",
  maxResults: number = 20
): Promise<YouTubeVideo[]> => {
  const apiKey = getYoutubeApiKey();

  if (!apiKey) {
    throw new Error("YouTube API key not configured on server");
  }

  // Determine YouTube API order parameter based on sort option
  // YouTube API only supports: date, rating, relevance, title, videoCount, viewCount
  const getApiOrder = (sort: VideoSortOption): string => {
    switch (sort) {
      case "date":
        return "date";
      case "views":
        return "viewCount";
      case "relevance":
      default:
        return "relevance";
    }
  };

  const searchParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    order: getApiOrder(sortBy),
    maxResults: maxResults.toString(),
    key: apiKey,
  });

  const searchRes = await fetch(
    `${YOUTUBE_BASE_URL}/search?${searchParams.toString()}`
  );
  const searchData = await searchRes.json();

  if (!searchRes.ok) {
    throw new Error(searchData.error?.message || "Failed to search videos");
  }

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  // Extract video IDs
  const videoIds = searchData.items
    .filter((item: { id: { videoId?: string } }) => item.id.videoId)
    .map((item: { id: { videoId: string } }) => item.id.videoId)
    .join(",");

  if (!videoIds) {
    return [];
  }

  // Fetch video details with statistics
  const videosParams = new URLSearchParams({
    part: "snippet,statistics",
    id: videoIds,
    key: apiKey,
  });

  const videosRes = await fetch(
    `${YOUTUBE_BASE_URL}/videos?${videosParams.toString()}`
  );
  const videosData = await videosRes.json();

  if (!videosRes.ok) {
    throw new Error(
      videosData.error?.message || "Failed to fetch video details"
    );
  }

  // Format response
  const videos: YouTubeVideo[] = videosData.items.map(
    (item: {
      id: string;
      snippet: {
        title: string;
        description: string;
        thumbnails: {
          high?: { url: string };
          medium?: { url: string };
        };
        publishedAt: string;
        channelTitle: string;
      };
      statistics: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        "",
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      viewCount: item.statistics.viewCount || "0",
      likeCount: item.statistics.likeCount || "0",
      commentCount: item.statistics.commentCount || "0",
    })
  );

  // Sort videos if using likes or comments (not supported by YouTube API order)
  if (sortBy === "likes" || sortBy === "comments") {
    return sortVideos(videos, sortBy);
  }

  return videos;
};
