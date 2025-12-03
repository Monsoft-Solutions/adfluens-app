
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  publishedAt: string;
  channelTitle: string;
}

export interface YouTubeComment {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  publishedAt: string;
  likeCount: string;
}

export interface SearchResultItem {
  id: {
    videoId?: string;
    channelId?: string;
  };
  snippet: {
    title: string;
    description: string;
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
    description: string;
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

export interface CommentsApiResponse {
  items: Array<{
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
  }>;
  error?: {
    message: string;
  };
}

export interface ViralAnalysisResult {
  summary: string;
  hooks: string[];
  viralReasons: string[];
  contentIdeas: string[];
  sources?: Array<{ title: string; uri: string }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
