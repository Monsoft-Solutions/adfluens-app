import { SearchApiResponse, VideosApiResponse, YouTubeVideo } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

const resolveChannelId = async (input: string, apiKey: string): Promise<string> => {
  // 1. Check if input is likely a Channel ID (starts with UC, approx 24 chars)
  if (/^UC[\w-]{21,22}$/.test(input)) {
    return input;
  }

  // 2. Try resolving as a Handle (e.g. @username)
  // Even if user didn't type @, we check if adding it helps (common user behavior)
  let handle = input.trim();
  if (!handle.startsWith('@')) {
    handle = `@${handle}`;
  }

  try {
    const handleParams = new URLSearchParams({
      part: 'id',
      forHandle: handle,
      key: apiKey,
    });

    const handleRes = await fetch(`${BASE_URL}/channels?${handleParams.toString()}`);
    
    if (handleRes.ok) {
      const handleData = await handleRes.json();
      if (handleData.items && handleData.items.length > 0) {
        return handleData.items[0].id;
      }
    }
  } catch (err) {
    console.warn('Handle resolution failed, falling back to search.', err);
  }

  // 3. Fallback: Search for the channel by query (expensive, 100 quota cost)
  // This handles plain names that aren't exact handles or if handle lookup failed
  const searchParams = new URLSearchParams({
    part: 'snippet',
    type: 'channel',
    q: input,
    key: apiKey,
    maxResults: '1',
  });

  const searchRes = await fetch(`${BASE_URL}/search?${searchParams.toString()}`);
  const searchData: SearchApiResponse = await searchRes.json();

  if (!searchRes.ok) {
    throw new Error(searchData.error?.message || 'Failed to resolve channel identifier.');
  }

  if (!searchData.items || searchData.items.length === 0) {
    throw new Error(`Could not find channel for identifier: ${input}`);
  }

  const foundId = searchData.items[0].id.channelId;
  if (!foundId) {
    throw new Error(`Invalid response resolving channel: ${input}`);
  }
  
  return foundId;
};

export const fetchChannelVideos = async (channelIdentifier: string, apiKey: string): Promise<YouTubeVideo[]> => {
  if (!channelIdentifier || !apiKey) {
    throw new Error('Channel ID/Handle and API Key are required.');
  }

  // Step 1: Resolve the input to a Channel ID
  const channelId = await resolveChannelId(channelIdentifier, apiKey);

  // Step 2: Search for videos in the channel
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

  // Step 3: Extract Video IDs (filtering out any items without a videoId)
  const videoIds = searchData.items
    .filter(item => item.id.videoId)
    .map((item) => item.id.videoId)
    .join(',');

  if (!videoIds) {
    return [];
  }

  // Step 4: Fetch detailed statistics for these IDs
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

  // Step 5: Merge and Format Data
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