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
  "instagram_basic",
  "instagram_manage_messages",
  "leads_retrieval",
  "ads_read",
].join(",");

// ============================================================================
// Generic Fetch Helper
// ============================================================================

/**
 * Performs an authenticated HTTP request to the Meta Graph API and returns the parsed JSON response.
 *
 * @param url - Graph API endpoint; `access_token` will be appended to the query string.
 * @param accessToken - OAuth access token used for the request.
 * @param options - Optional fetch options to merge with defaults (a JSON Content-Type header is added).
 * @returns The parsed response as `T`, or an empty object if the response body is empty.
 * @throws Error when the HTTP response is not OK; the error message will prefer any message returned by the API.
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
 * Builds the Facebook OAuth authorization URL containing the requested scopes, redirect URI, and state.
 *
 * @param appId - The Facebook App ID
 * @param redirectUri - The redirect URI where Facebook will send the authorization code
 * @param state - Opaque value returned to the redirect URI to maintain request state (e.g., CSRF token)
 * @returns The URL to initiate the OAuth authorization flow
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
 * Exchange an OAuth authorization code for a short-lived Meta access token.
 *
 * @returns An object containing `accessToken`, `tokenType`, optional `expiresIn` (seconds), and optional `expiresAt` (Date when the token expires)
 * @throws {Error} If the token exchange request fails; the error message includes the response body
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
 * Exchange a short-lived Facebook access token for a long-lived access token.
 *
 * @returns An object with `accessToken`, `tokenType`, optional `expiresIn` (seconds) and an optional `expiresAt` Date when the expiration is provided by the API.
 * @throws Error if the token exchange fails (non-OK HTTP response).
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
 * Extend the expiration of a long-lived Meta access token.
 *
 * @returns Refreshed OAuth tokens including `accessToken`, `tokenType`, `expiresIn`, and `expiresAt`
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
 * Retrieves the user's Facebook profile id and name associated with the given access token.
 *
 * @returns An object with `id` (the user ID) and `name` (the user's full name)
 */
export async function fetchUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
}> {
  const url = `${GRAPH_API_URL}/me?fields=id,name`;
  return metaFetch(url, accessToken);
}

/**
 * Retrieve the Facebook Pages the current user manages.
 *
 * Maps the Graph API response into an array of MetaAvailablePage objects. Each entry includes the page's id, name, category, the page access token, and an optional instagramBusinessAccount with id and username when available.
 *
 * @param accessToken - The user's access token used to query the Graph API
 * @returns An array of MetaAvailablePage objects for pages the user manages
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
 * Retrieve detailed metadata for a Facebook Page and normalize selected fields.
 *
 * @param pageId - The Page's Graph API ID
 * @param pageAccessToken - A valid Page access token with permissions to read page fields
 * @returns An object containing the page's id, name, optional contact and profile fields, counts, and resolved cover/profile image URLs
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
 * Subscribe a Facebook Page to the app's webhook events.
 *
 * @param pageId - The Page ID to subscribe
 * @param pageAccessToken - A Page access token with manage_pages/webhooks permissions
 * @param subscribedFields - List of webhook fields to subscribe the page to (e.g., "messages", "messaging_postbacks", "leadgen")
 * @returns `true` if the subscription request succeeded, `false` otherwise
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
 * Unsubscribes a Facebook Page from all subscribed webhook events.
 *
 * @returns `true` if the page was successfully unsubscribed, `false` otherwise.
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
 * Retrieve a lead's details from the Meta Graph API by lead ID.
 *
 * @param leadId - The Meta lead ID to fetch.
 * @param pageAccessToken - A Page access token with permission to read lead data.
 * @returns An object containing lead fields: `id`, `created_time`, `form_id`, `ad_id`, `ad_name`, `campaign_id`, `campaign_name`, and `field_data`.
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
 * Retrieve metadata for a lead generation form.
 *
 * @param formId - The Graph API ID of the lead form to fetch
 * @param pageAccessToken - A page access token with permission to read the page's leadgen forms
 * @returns The lead form object containing `id`, `name`, `status`, and `page_id`
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
 * Sends a text message from a Page to a recipient on Messenger or Instagram.
 *
 * Uses the `HUMAN_AGENT` message tag to extend the messaging window up to seven days.
 *
 * @param pageId - The Facebook Page ID sending the message
 * @param pageAccessToken - A Page access token with messaging permissions
 * @param recipientId - The recipient's ID (PSID or Instagram user ID)
 * @param messageText - The text content to send
 * @returns An object with `recipient_id` and `message_id` as returned by the Graph API
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
 * Fetches a user's public profile (id, name, profile picture) using a page access token.
 *
 * @returns The profile object containing `id` and, when available, `name` and `profile_pic`. If the profile cannot be retrieved (for example due to privacy settings), returns an object with only `id`.
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
 * Retrieves messages for a conversation thread.
 *
 * @param conversationId - The conversation (thread) ID to fetch messages from.
 * @param pageAccessToken - Page access token with permissions to read the conversation.
 * @param limit - Maximum number of messages to return (default 10).
 * @returns An object containing `data`, an array of message objects (each with `id`, `created_time`, `from`, `to`, optional `message`, and optional `attachments`), and an optional `paging` object with `next` and `previous` links.
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
 * Retrieve conversations for a page from Messenger or Instagram.
 *
 * @param pageId - The page ID to query
 * @param pageAccessToken - Page access token with permissions to read conversations
 * @param platform - Which platform to query: `"messenger"` (default) or `"instagram"`
 * @param limit - Maximum number of conversations to request
 * @returns An object with a `data` array of conversations (each with `id`, `updated_time`, `participants`, and optional `messages`) and an optional `paging.next` URL
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
 * Retrieve conversations for the specified Instagram account.
 *
 * @param instagramAccountId - The Instagram account ID to query (typically the account linked to a Page)
 * @param pageAccessToken - Page access token with permissions to read conversations
 * @param limit - Maximum number of conversations to return
 * @returns An object with `data` containing conversation summaries (each has `id`, `updated_time`, `participants`, and an optional `messages` preview) and an optional `paging.next` URL
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
 * Inspect a Meta access token's validity and metadata.
 *
 * @param tokenToInspect - The access token to inspect
 * @param appAccessToken - An app access token used to authorize the debug request
 * @returns An object with a `data` property containing `app_id`, optional `user_id`, `is_valid`, optional `expires_at` (UNIX timestamp in seconds), and optional `scopes` array
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
 * Obtain the app access token using the app credentials.
 *
 * @returns The app access token string.
 * @throws If the Graph API response is not OK.
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
 * Retrieve lead form metadata for a Facebook Page.
 *
 * @returns An object containing `data`, an array of lead forms (each with `id`, `name`, and optional `status` and `leads_count`), and an optional `paging.next` URL for pagination.
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
 * Retrieve leads submitted to a specific Facebook lead form.
 *
 * @param formId - The ID of the lead form to fetch leads from
 * @param pageAccessToken - A page access token with permission to read lead data
 * @param limit - Maximum number of leads to return (default 50)
 * @returns An object containing `data`, an array of lead records (each including `id`, `created_time`, `form_id`, `ad_id`, `ad_name`, `campaign_id`, `campaign_name`, and `field_data`), and an optional `paging` object with `next` and cursor `after` values
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
 * Retrieve lead entries from all lead forms on a page and consolidate them into a single list.
 *
 * Fetches each leadgen form for the given page and aggregates the leads from each form into `data`.
 * If the fetch fails, the function returns an empty `data` array instead of throwing.
 *
 * @param pageId - Facebook Page ID to query for leadgen forms
 * @param pageAccessToken - Page access token with permission to read lead forms and leads
 * @param limit - Maximum number of leads to request per form (default: 50)
 * @returns An object with `data` containing the collected leads; `paging` may include a `next` URL if available
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