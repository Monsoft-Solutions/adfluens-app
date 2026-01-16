/**
 * Meta Graph API Utilities
 *
 * Low-level API client for interacting with Meta Graph API.
 * Handles Facebook Pages, Instagram Business accounts, messaging, and leads.
 */

// Type definitions inline to avoid import issues
export type MetaOAuthTokens = {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: Date;
};

export type MetaAvailablePage = {
  id: string;
  name: string;
  category?: string;
  accessToken: string;
  instagramBusinessAccount?: {
    id: string;
    username?: string;
  };
};

export type MetaLeadData = {
  id: string;
  created_time: string;
  form_id: string;
  ad_id?: string;
  ad_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
};

export type MetaLeadForm = {
  id: string;
  name: string;
  status?: string;
  page_id?: string;
};

// Meta Graph API version and base URL
const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Required OAuth scopes for Meta Business features
export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
  "pages_manage_posts", // Content publishing to Facebook Pages
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_content_publish", // Content publishing to Instagram
  "leads_retrieval",
  "ads_read",
  "pages_manage_ads",
].join(",");

// ============================================================================
// Generic Fetch Helper
// ============================================================================

/**
 * Generic fetch wrapper for Meta Graph API calls with authentication
 */
async function metaFetch<T>(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const separator = url.includes("?") ? "&" : "?";
  const urlWithToken = `${url}${separator}access_token=${accessToken}`;

  const response = await fetch(urlWithToken, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Meta API Error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage =
        errorJson.error?.message || errorJson.message || errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

// ============================================================================
// OAuth Functions
// ============================================================================

/**
 * Generate the OAuth authorization URL for Meta
 */
export function getMetaAuthUrl(
  appId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: META_SCOPES,
    response_type: "code",
  });

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for short-lived access token
 */
export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<MetaOAuthTokens> {
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const url = `${GRAPH_API_URL}/oauth/access_token?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange code: ${errorBody}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    token_type: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  };
}

/**
 * Exchange short-lived token for long-lived token (~60 days)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<MetaOAuthTokens> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const url = `${GRAPH_API_URL}/oauth/access_token?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to exchange for long-lived token: ${errorBody}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    token_type: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : undefined,
  };
}

/**
 * Refresh a long-lived token (extends expiration)
 */
export async function refreshLongLivedToken(
  longLivedToken: string,
  appId: string,
  appSecret: string
): Promise<MetaOAuthTokens> {
  // Meta uses the same endpoint for token refresh
  return exchangeForLongLivedToken(longLivedToken, appId, appSecret);
}

// ============================================================================
// User & Account Discovery
// ============================================================================

/**
 * Get user info from access token
 */
export async function fetchUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
}> {
  const url = `${GRAPH_API_URL}/me?fields=id,name`;
  return metaFetch(url, accessToken);
}

/**
 * Fetch Facebook Pages the user manages
 */
export async function fetchUserPages(
  accessToken: string
): Promise<MetaAvailablePage[]> {
  const url = `${GRAPH_API_URL}/me/accounts?fields=id,name,category,access_token,instagram_business_account{id,username}`;

  const response = await metaFetch<{
    data: Array<{
      id: string;
      name: string;
      category?: string;
      access_token: string;
      instagram_business_account?: {
        id: string;
        username?: string;
      };
    }>;
  }>(url, accessToken);

  return response.data.map((page) => ({
    id: page.id,
    name: page.name,
    category: page.category,
    accessToken: page.access_token,
    instagramBusinessAccount: page.instagram_business_account
      ? {
          id: page.instagram_business_account.id,
          username: page.instagram_business_account.username,
        }
      : undefined,
  }));
}

/**
 * Fetch detailed page info
 */
export async function fetchPageDetails(
  pageId: string,
  pageAccessToken: string
): Promise<{
  id: string;
  name: string;
  category?: string;
  about?: string;
  description?: string;
  website?: string;
  phone?: string;
  emails?: string[];
  location?: {
    city?: string;
    country?: string;
    street?: string;
    zip?: string;
  };
  coverPhoto?: string;
  profilePicture?: string;
  followersCount?: number;
  fanCount?: number;
}> {
  const fields = [
    "id",
    "name",
    "category",
    "about",
    "description",
    "website",
    "phone",
    "emails",
    "location",
    "cover{source}",
    "picture{url}",
    "followers_count",
    "fan_count",
  ].join(",");

  const url = `${GRAPH_API_URL}/${pageId}?fields=${fields}`;

  const response = await metaFetch<{
    id: string;
    name: string;
    category?: string;
    about?: string;
    description?: string;
    website?: string;
    phone?: string;
    emails?: string[];
    location?: {
      city?: string;
      country?: string;
      street?: string;
      zip?: string;
    };
    cover?: { source: string };
    picture?: { data: { url: string } };
    followers_count?: number;
    fan_count?: number;
  }>(url, pageAccessToken);

  return {
    id: response.id,
    name: response.name,
    category: response.category,
    about: response.about,
    description: response.description,
    website: response.website,
    phone: response.phone,
    emails: response.emails,
    location: response.location,
    coverPhoto: response.cover?.source,
    profilePicture: response.picture?.data?.url,
    followersCount: response.followers_count,
    fanCount: response.fan_count,
  };
}

// ============================================================================
// Webhook Subscription
// ============================================================================

/**
 * Subscribe a page to webhook events
 */
export async function subscribePageToWebhooks(
  pageId: string,
  pageAccessToken: string,
  subscribedFields: string[] = ["messages", "messaging_postbacks", "leadgen"]
): Promise<boolean> {
  const url = `${GRAPH_API_URL}/${pageId}/subscribed_apps`;

  const response = await metaFetch<{ success: boolean }>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      subscribed_fields: subscribedFields,
    }),
  });

  return response.success;
}

/**
 * Unsubscribe a page from webhook events
 */
export async function unsubscribePageFromWebhooks(
  pageId: string,
  pageAccessToken: string
): Promise<boolean> {
  const url = `${GRAPH_API_URL}/${pageId}/subscribed_apps`;

  const response = await metaFetch<{ success: boolean }>(url, pageAccessToken, {
    method: "DELETE",
  });

  return response.success;
}

// ============================================================================
// Lead Retrieval
// ============================================================================

/**
 * Fetch lead data by lead ID
 */
export async function fetchLeadData(
  leadId: string,
  pageAccessToken: string
): Promise<MetaLeadData> {
  const fields = [
    "id",
    "created_time",
    "form_id",
    "ad_id",
    "ad_name",
    "campaign_id",
    "campaign_name",
    "field_data",
  ].join(",");

  const url = `${GRAPH_API_URL}/${leadId}?fields=${fields}`;

  return metaFetch(url, pageAccessToken);
}

/**
 * Fetch lead form info
 */
export async function fetchLeadForm(
  formId: string,
  pageAccessToken: string
): Promise<MetaLeadForm> {
  const url = `${GRAPH_API_URL}/${formId}?fields=id,name,status,page_id`;
  return metaFetch(url, pageAccessToken);
}

// ============================================================================
// Messaging (Messenger & Instagram)
// ============================================================================

/**
 * Send a message via Messenger or Instagram
 *
 * Uses HUMAN_AGENT message tag to extend the messaging window from 24 hours to 7 days.
 * This is required for human agent responses outside the standard 24-hour window.
 * @see https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags
 */
export async function sendMessage(
  pageId: string,
  pageAccessToken: string,
  recipientId: string,
  messageText: string
): Promise<{ recipient_id: string; message_id: string }> {
  const url = `${GRAPH_API_URL}/${pageId}/messages`;

  return metaFetch(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: messageText },
      messaging_type: "MESSAGE_TAG",
      tag: "HUMAN_AGENT",
    }),
  });
}

/**
 * Get user profile for a conversation participant
 */
export async function fetchUserProfile(
  userId: string,
  pageAccessToken: string
): Promise<{
  id: string;
  name?: string;
  profile_pic?: string;
}> {
  const url = `${GRAPH_API_URL}/${userId}?fields=id,name,profile_pic`;

  try {
    return await metaFetch(url, pageAccessToken);
  } catch {
    // User profile may not be available due to privacy settings
    return { id: userId };
  }
}

/**
 * Get conversation thread messages
 */
export async function fetchConversationMessages(
  conversationId: string,
  pageAccessToken: string,
  limit = 10
): Promise<{
  data: Array<{
    id: string;
    created_time: string;
    from: { id: string; name?: string };
    to: { data: Array<{ id: string; name?: string }> };
    message?: string;
    attachments?: { data: Array<{ type: string; payload?: { url?: string } }> };
  }>;
  paging?: { next?: string; previous?: string };
}> {
  const fields = [
    "id",
    "created_time",
    "from",
    "to",
    "message",
    "attachments",
  ].join(",");
  const url = `${GRAPH_API_URL}/${conversationId}/messages?fields=${fields}&limit=${limit}`;

  return metaFetch(url, pageAccessToken);
}

/**
 * Get page conversations (Messenger)
 */
export async function fetchPageConversations(
  pageId: string,
  pageAccessToken: string,
  platform: "messenger" | "instagram" = "messenger",
  limit = 20
): Promise<{
  data: Array<{
    id: string;
    updated_time: string;
    participants: { data: Array<{ id: string; name?: string }> };
    messages?: {
      data: Array<{ id: string; message?: string; created_time: string }>;
    };
  }>;
  paging?: { next?: string };
}> {
  const fields = [
    "id",
    "updated_time",
    "participants",
    "messages.limit(1){id,message,created_time}",
  ].join(",");

  // For Instagram, use the Instagram-specific endpoint
  // For Messenger, use the page conversations endpoint
  const url =
    platform === "instagram"
      ? `${GRAPH_API_URL}/${pageId}/conversations?fields=${fields}&limit=${limit}&platform=instagram`
      : `${GRAPH_API_URL}/${pageId}/conversations?fields=${fields}&limit=${limit}`;

  return metaFetch(url, pageAccessToken);
}

/**
 * Get Instagram conversations using Instagram Account ID
 */
export async function fetchInstagramConversations(
  instagramAccountId: string,
  pageAccessToken: string,
  limit = 20
): Promise<{
  data: Array<{
    id: string;
    updated_time: string;
    participants: { data: Array<{ id: string; username?: string }> };
    messages?: {
      data: Array<{ id: string; message?: string; created_time: string }>;
    };
  }>;
  paging?: { next?: string };
}> {
  const fields = [
    "id",
    "updated_time",
    "participants",
    "messages.limit(1){id,message,created_time}",
  ].join(",");

  const url = `${GRAPH_API_URL}/${instagramAccountId}/conversations?fields=${fields}&limit=${limit}&platform=instagram`;

  return metaFetch(url, pageAccessToken);
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Debug/inspect an access token
 */
export async function debugToken(
  tokenToInspect: string,
  appAccessToken: string
): Promise<{
  data: {
    app_id: string;
    user_id?: string;
    is_valid: boolean;
    expires_at?: number;
    scopes?: string[];
  };
}> {
  const url = `${GRAPH_API_URL}/debug_token?input_token=${tokenToInspect}`;
  return metaFetch(url, appAccessToken);
}

/**
 * Get app access token for API calls
 */
export async function getAppAccessToken(
  appId: string,
  appSecret: string
): Promise<string> {
  const url = `${GRAPH_API_URL}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to get app access token");
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

// ============================================================================
// Lead Sync Functions
// ============================================================================

/**
 * Fetch all lead forms for a page
 */
export async function fetchPageLeadForms(
  pageId: string,
  pageAccessToken: string
): Promise<{
  data: Array<{
    id: string;
    name: string;
    status?: string;
    leads_count?: number;
  }>;
  paging?: { next?: string };
}> {
  const url = `${GRAPH_API_URL}/${pageId}/leadgen_forms?fields=id,name,status,leads_count`;
  return metaFetch(url, pageAccessToken);
}

/**
 * Fetch leads from a specific form
 */
export async function fetchFormLeads(
  formId: string,
  pageAccessToken: string,
  limit = 50
): Promise<{
  data: MetaLeadData[];
  paging?: { next?: string; cursors?: { after?: string } };
}> {
  const fields = [
    "id",
    "created_time",
    "form_id",
    "ad_id",
    "ad_name",
    "campaign_id",
    "campaign_name",
    "field_data",
  ].join(",");
  const url = `${GRAPH_API_URL}/${formId}/leads?fields=${fields}&limit=${limit}`;
  return metaFetch(url, pageAccessToken);
}

/**
 * Fetch leads from a page directly (alternative method)
 */
export async function fetchPageLeads(
  pageId: string,
  pageAccessToken: string,
  limit = 50
): Promise<{
  data: MetaLeadData[];
  paging?: { next?: string };
}> {
  const fields = [
    "id",
    "created_time",
    "form_id",
    "ad_id",
    "ad_name",
    "campaign_id",
    "campaign_name",
    "field_data",
  ].join(",");
  const url = `${GRAPH_API_URL}/${pageId}/leadgen_forms?fields=leads.limit(${limit}){${fields}}`;

  try {
    const result = await metaFetch<{
      data: Array<{
        leads?: { data: MetaLeadData[] };
      }>;
    }>(url, pageAccessToken);

    // Flatten leads from all forms
    const allLeads: MetaLeadData[] = [];
    for (const form of result.data) {
      if (form.leads?.data) {
        allLeads.push(...form.leads.data);
      }
    }
    return { data: allLeads };
  } catch {
    return { data: [] };
  }
}
