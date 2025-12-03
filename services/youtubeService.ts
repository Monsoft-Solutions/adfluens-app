import { YouTubeVideo, YouTubeComment } from "../types";

const API_BASE = "/api";

export const fetchChannelVideos = async (
  channelIdentifier: string
): Promise<YouTubeVideo[]> => {
  if (!channelIdentifier) {
    throw new Error("Channel ID/Handle is required.");
  }

  // Step 1: Resolve the channel identifier to a channel ID
  const channelRes = await fetch(`${API_BASE}/youtube/channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: channelIdentifier }),
  });

  const channelData = await channelRes.json();

  if (!channelRes.ok) {
    throw new Error(
      channelData.error || "Failed to resolve channel identifier."
    );
  }

  const { channelId } = channelData;

  // Step 2: Fetch videos for the channel
  const videosRes = await fetch(`${API_BASE}/youtube/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId }),
  });

  const videosData = await videosRes.json();

  if (!videosRes.ok) {
    throw new Error(videosData.error || "Failed to fetch videos.");
  }

  return videosData.videos || [];
};

export const fetchVideoComments = async (
  videoId: string
): Promise<YouTubeComment[]> => {
  const res = await fetch(`${API_BASE}/youtube/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch comments.");
  }

  return data.comments || [];
};
