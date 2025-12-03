import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const GEMINI_MODEL = 'gemini-2.5-flash';

// Helper to get API keys from environment
const getYoutubeApiKey = () => process.env.YOUTUBE_API_KEY || '';
const getGeminiApiKey = () => process.env.GEMINI_API_KEY || '';

// ==================== YOUTUBE ROUTES ====================

/**
 * POST /api/youtube/channels
 * Resolve a channel handle/name to a channel ID
 */
router.post('/youtube/channels', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    const apiKey = getYoutubeApiKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured on server' });
    }

    if (!identifier) {
      return res.status(400).json({ error: 'Channel identifier is required' });
    }

    // Check if already a channel ID
    if (/^UC[\w-]{21,22}$/.test(identifier)) {
      return res.json({ channelId: identifier });
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
        return res.json({ channelId: handleData.items[0].id });
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
      return res.status(searchRes.status).json({ error: searchData.error?.message || 'Failed to resolve channel' });
    }

    if (!searchData.items || searchData.items.length === 0) {
      return res.status(404).json({ error: `Could not find channel for: ${identifier}` });
    }

    const channelId = searchData.items[0].id.channelId;
    if (!channelId) {
      return res.status(404).json({ error: 'Invalid response from YouTube API' });
    }

    res.json({ channelId });
  } catch (error: any) {
    console.error('Channel resolution error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/youtube/videos
 * Fetch videos for a channel with statistics
 */
router.post('/youtube/videos', async (req: Request, res: Response) => {
  try {
    const { channelId } = req.body;
    const apiKey = getYoutubeApiKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured on server' });
    }

    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
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
      return res.status(searchRes.status).json({ error: searchData.error?.message || 'Failed to search videos' });
    }

    if (!searchData.items || searchData.items.length === 0) {
      return res.json({ videos: [] });
    }

    // Extract video IDs
    const videoIds = searchData.items
      .filter((item: any) => item.id.videoId)
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) {
      return res.json({ videos: [] });
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
      return res.status(videosRes.status).json({ error: videosData.error?.message || 'Failed to fetch video details' });
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

    res.json({ videos });
  } catch (error: any) {
    console.error('Videos fetch error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/youtube/comments
 * Fetch comments for a video
 */
router.post('/youtube/comments', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;
    const apiKey = getYoutubeApiKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured on server' });
    }

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
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
      return res.status(response.status).json({ error: data.error?.message || 'Failed to fetch comments' });
    }

    const comments = (data.items || []).map((item: any) => ({
      id: item.id,
      authorDisplayName: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorProfileImageUrl: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
      textDisplay: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount.toString(),
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
    }));

    res.json({ comments });
  } catch (error: any) {
    console.error('Comments fetch error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// ==================== AI ROUTES ====================

/**
 * POST /api/ai/analyze
 * Analyze a video using Gemini AI
 */
router.post('/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { video, comments } = req.body;
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    if (!video) {
      return res.status(400).json({ error: 'Video data is required' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const commentsText = (comments || [])
      .slice(0, 20)
      .map((c: any) => `- "${c.textDisplay}" (Likes: ${c.likeCount})`)
      .join('\n');

    const prompt = `
      You are an expert video strategist. 
      Please analyze this YouTube video by using Google Search to find its content, transcript, or summary information using the provided URL.
      
      Video URL: https://www.youtube.com/watch?v=${video.id}
      
      Context Data:
      Title: ${video.title}
      Channel: ${video.channelTitle}
      Description: ${video.description}
      
      Audience Sentiment (Comments):
      ${commentsText}

      Task:
      1. Summarize the video content.
      2. Identify the "Hooks" (why people clicked).
      3. Explain the "Viral Reasons" (why people shared/watched).
      4. Provide 3-5 "Content Ideas" inspired by this video.

      OUTPUT FORMAT:
      You must return a strictly valid JSON object. Do not include markdown formatting (like \`\`\`json).
      The JSON structure must be:
      {
        "summary": "string",
        "hooks": ["string", "string"],
        "viralReasons": ["string", "string"],
        "contentIdeas": ["string", "string"]
      }
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse JSON from response
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        result = JSON.parse(jsonStr.substring(start, end + 1));
      } else {
        return res.status(500).json({ error: 'Invalid JSON format returned by AI' });
      }
    }

    // Extract sources from grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      result.sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri && web.title)
        .map((web: any) => ({ title: web.title, uri: web.uri }));
    }

    res.json(result);
  } catch (error: any) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze video' });
  }
});

/**
 * POST /api/ai/chat
 * Chat with AI about a video
 */
router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { history, message, video, analysis } = req.body;
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    if (!message || !video || !analysis) {
      return res.status(400).json({ error: 'Message, video, and analysis data are required' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const contextSystemInstruction = `
      You are a helpful AI assistant discussing a specific YouTube video.
      
      CONTEXT:
      Video URL: https://www.youtube.com/watch?v=${video.id}
      Video Title: ${video.title}
      Channel: ${video.channelTitle}
      Analysis Summary: ${analysis.summary}
      Viral Reasons: ${analysis.viralReasons.join(', ')}
      
      Answer the user's questions specifically about this video, marketing strategies, or content creation. Keep answers practical and actionable.
    `;

    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      history: history || [],
      config: {
        systemInstruction: contextSystemInstruction,
      },
    });

    const response = await chat.sendMessage({ message });
    const responseText = response.text;

    res.json({ response: responseText });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to chat with AI' });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    youtube: !!getYoutubeApiKey(),
    gemini: !!getGeminiApiKey()
  });
});

export default router;

