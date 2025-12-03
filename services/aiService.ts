import { YouTubeVideo, YouTubeComment, ViralAnalysisResult } from "../types";

const API_BASE = '/api';

export const analyzeVideoContent = async (
  video: YouTubeVideo,
  comments: YouTubeComment[]
): Promise<ViralAnalysisResult> => {
  const res = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video, comments }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze video.');
  }

  return data;
};

export const chatWithVideoContext = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  video: YouTubeVideo,
  analysis: ViralAnalysisResult
): Promise<string> => {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, message, video, analysis }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to chat with AI.');
  }

  return data.response;
};
