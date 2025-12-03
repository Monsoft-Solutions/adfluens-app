import { SearchApiResponse, VideosApiResponse, YouTubeVideo } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const fetchChannelVideos = async (channelId: string, apiKey: string): Promise<YouTubeVideo[]> => {
  if (!channelId || !apiKey) {
    throw new Error('Channel ID and API Key are required.');
  }

  // Step 1: Search for videos in the channel
  const searchParams = new URLSearchParams({
    part: 'snippet',
    channelId: channelId,
    order: 'viewCount',
    type: 'video',
    maxResults: '20',
    key: apiKey,
  });

  const searchRes = await fetch(`${BASE_URL}/search?${searchParams.toString()}`);
  const searchData: SearchApiResponse = await searchRes.json();

  if (!searchRes.ok) {
    throw new Error(searchData.error?.message || 'Failed to search for videos.');
  }

  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }

  // Step 2: Extract Video IDs
  const videoIds = searchData.items.map((item) => item.id.videoId).join(',');

  // Step 3: Fetch detailed statistics for these IDs
  const videosParams = new URLSearchParams({
    part: 'snippet,statistics',
    id: videoIds,
    key: apiKey,
  });

  const videosRes = await fetch(`${BASE_URL}/videos?${videosParams.toString()}`);
  const videosData: VideosApiResponse = await videosRes.json();

  if (!videosRes.ok) {
    throw new Error(videosData.error?.message || 'Failed to fetch video details.');
  }

  // Step 4: Merge and Format Data
  return videosData.items.map((item) => ({
    id: item.id,
    title: item.snippet.title,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
    publishedAt: item.snippet.publishedAt,
    channelTitle: item.snippet.channelTitle,
    viewCount: item.statistics.viewCount || '0',
    likeCount: item.statistics.likeCount || '0',
    commentCount: item.statistics.commentCount || '0',
  }));
};