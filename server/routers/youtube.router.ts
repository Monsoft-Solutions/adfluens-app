import { z } from 'zod';
import { router, publicProcedure } from '../trpc.config.js';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

const getYoutubeApiKey = () => process.env.YOUTUBE_API_KEY || '';

export const youtubeRouter = router({
  /**
   * Resolve a channel handle/name to a channel ID
   */
  resolveChannel: publicProcedure
    .input(z.object({ identifier: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const { identifier } = input;
      const apiKey = getYoutubeApiKey();

      if (!apiKey) {
        throw new Error('YouTube API key not configured on server');
      }

      // Check if already a channel ID
      if (/^UC[\w-]{21,22}$/.test(identifier)) {
        return { channelId: identifier };
      }

      // Try resolving as handle
      let handle = identifier.trim();
      if (!handle.startsWith('@')) {
        handle = `@${handle}`;
      }

      const handleParams = new URLSearchParams({
        part: 'id',
        forHandle: handle,
        key: apiKey,
      });

      const handleRes = await fetch(`${YOUTUBE_BASE_URL}/channels?${handleParams.toString()}`);

      if (handleRes.ok) {
        const handleData = await handleRes.json();
        if (handleData.items && handleData.items.length > 0) {
          return { channelId: handleData.items[0].id };
        }
      }

      // Fallback to search
      const searchParams = new URLSearchParams({
        part: 'snippet',
        type: 'channel',
        q: identifier,
        key: apiKey,
        maxResults: '1',
      });

      const searchRes = await fetch(`${YOUTUBE_BASE_URL}/search?${searchParams.toString()}`);
      const searchData = await searchRes.json();

      if (!searchRes.ok) {
        throw new Error(searchData.error?.message || 'Failed to resolve channel');
      }

      if (!searchData.items || searchData.items.length === 0) {
        throw new Error(`Could not find channel for: ${identifier}`);
      }

      const channelId = searchData.items[0].id.channelId;
      if (!channelId) {
        throw new Error('Invalid response from YouTube API');
      }

      return { channelId };
    }),

  /**
   * Fetch videos for a channel with statistics
   */
  getVideos: publicProcedure
    .input(z.object({ channelId: z.string().min(1) }))
    .query(async ({ input }) => {
      const { channelId } = input;
      const apiKey = getYoutubeApiKey();

      if (!apiKey) {
        throw new Error('YouTube API key not configured on server');
      }

      // Search for videos in the channel
      const searchParams = new URLSearchParams({
        part: 'snippet',
        channelId: channelId,
        order: 'viewCount',
        type: 'video',
        maxResults: '20',
        key: apiKey,
      });

      const searchRes = await fetch(`${YOUTUBE_BASE_URL}/search?${searchParams.toString()}`);
      const searchData = await searchRes.json();

      if (!searchRes.ok) {
        throw new Error(searchData.error?.message || 'Failed to search videos');
      }

      if (!searchData.items || searchData.items.length === 0) {
        return { videos: [] };
      }

      // Extract video IDs
      const videoIds = searchData.items
        .filter((item: any) => item.id.videoId)
        .map((item: any) => item.id.videoId)
        .join(',');

      if (!videoIds) {
        return { videos: [] };
      }

      // Fetch video details with statistics
      const videosParams = new URLSearchParams({
        part: 'snippet,statistics',
        id: videoIds,
        key: apiKey,
      });

      const videosRes = await fetch(`${YOUTUBE_BASE_URL}/videos?${videosParams.toString()}`);
      const videosData = await videosRes.json();

      if (!videosRes.ok) {
        throw new Error(videosData.error?.message || 'Failed to fetch video details');
      }

      // Format response
      const videos = videosData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        viewCount: item.statistics.viewCount || '0',
        likeCount: item.statistics.likeCount || '0',
        commentCount: item.statistics.commentCount || '0',
      }));

      return { videos };
    }),

  /**
   * Fetch comments for a video
   */
  getComments: publicProcedure
    .input(z.object({ videoId: z.string().min(1) }))
    .query(async ({ input }) => {
      const { videoId } = input;
      const apiKey = getYoutubeApiKey();

      if (!apiKey) {
        throw new Error('YouTube API key not configured on server');
      }

      const params = new URLSearchParams({
        part: 'snippet',
        videoId: videoId,
        maxResults: '20',
        textFormat: 'plainText',
        key: apiKey,
      });

      const response = await fetch(`${YOUTUBE_BASE_URL}/commentThreads?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch comments');
      }

      const comments = (data.items || []).map((item: any) => ({
        id: item.id,
        authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
        authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
        textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
        likeCount: item.snippet.topLevelComment.snippet.likeCount.toString(),
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      }));

      return { comments };
    }),
});

