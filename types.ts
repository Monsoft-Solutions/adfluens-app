export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
  channelTitle: string;
}

export interface SearchResultItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
      medium: { url: string };
      default: { url: string };
    };
    channelTitle: string;
  };
}

export interface VideoDetailsItem {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
      medium: { url: string };
      default: { url: string };
    };
    channelTitle: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface SearchApiResponse {
  items: SearchResultItem[];
  error?: {
    message: string;
  };
}

export interface VideosApiResponse {
  items: VideoDetailsItem[];
  error?: {
    message: string;
  };
}