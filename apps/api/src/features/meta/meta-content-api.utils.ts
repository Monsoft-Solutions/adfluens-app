/**
 * Meta Graph API - Content Publishing Utilities
 *
 * Handles Facebook Page posts and Instagram content publishing.
 * This is separate from messaging/leads/OAuth in meta-api.utils.ts
 *
 * @see https://developers.facebook.com/docs/pages-api/posts
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing
 */

// =============================================================================
// Configuration
// =============================================================================

const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Instagram container status polling
const CONTAINER_POLL_MAX_ATTEMPTS = 30;
const CONTAINER_POLL_DELAY_MS = 2000;

// =============================================================================
// Types
// =============================================================================

export type FacebookPhotoPostResult = {
  id: string;
  post_id?: string;
};

export type FacebookFeedPostResult = {
  id: string;
};

export type InstagramContainerResult = {
  id: string;
};

export type InstagramContainerStatus = {
  id: string;
  status_code: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";
  error_message?: string;
};

export type InstagramPublishResult = {
  id: string;
};

export type InstagramMediaResult = {
  id: string;
  permalink?: string;
};

// =============================================================================
// Generic Fetch Helper
// =============================================================================

async function metaContentFetch<T>(
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

// =============================================================================
// Facebook Page Post Publishing
// =============================================================================

/**
 * Publish a single photo post to a Facebook Page
 *
 * @param pageId Facebook Page ID
 * @param pageAccessToken Page access token
 * @param options Post options
 * @returns Post result with ID
 *
 * @see https://developers.facebook.com/docs/graph-api/reference/page/photos/
 */
export async function publishFacebookPhotoPost(
  pageId: string,
  pageAccessToken: string,
  options: {
    imageUrl: string;
    caption: string;
  }
): Promise<FacebookPhotoPostResult> {
  const url = `${GRAPH_API_URL}/${pageId}/photos`;

  return metaContentFetch<FacebookPhotoPostResult>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      url: options.imageUrl,
      message: options.caption,
      published: true,
    }),
  });
}

/**
 * Upload a photo to Facebook without publishing (for multi-photo posts)
 *
 * @param pageId Facebook Page ID
 * @param pageAccessToken Page access token
 * @param imageUrl URL of the image to upload
 * @returns Upload result with photo ID
 */
export async function uploadFacebookPhotoUnpublished(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string
): Promise<{ id: string }> {
  const url = `${GRAPH_API_URL}/${pageId}/photos`;

  return metaContentFetch<{ id: string }>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      url: imageUrl,
      published: false,
    }),
  });
}

/**
 * Publish a multi-photo post to a Facebook Page
 *
 * @param pageId Facebook Page ID
 * @param pageAccessToken Page access token
 * @param options Post options with multiple image URLs
 * @returns Post result with ID
 *
 * @see https://developers.facebook.com/docs/graph-api/reference/page/feed/
 */
export async function publishFacebookMultiPhotoPost(
  pageId: string,
  pageAccessToken: string,
  options: {
    imageUrls: string[];
    caption: string;
  }
): Promise<FacebookFeedPostResult> {
  // Step 1: Upload each photo as unpublished
  const photoIds = await Promise.all(
    options.imageUrls.map((url) =>
      uploadFacebookPhotoUnpublished(pageId, pageAccessToken, url)
    )
  );

  // Step 2: Create feed post with attached media
  const url = `${GRAPH_API_URL}/${pageId}/feed`;
  const attachedMedia = photoIds.map((photo) => ({
    media_fbid: photo.id,
  }));

  return metaContentFetch<FacebookFeedPostResult>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      message: options.caption,
      attached_media: attachedMedia,
    }),
  });
}

/**
 * Publish a text-only post to a Facebook Page
 *
 * @param pageId Facebook Page ID
 * @param pageAccessToken Page access token
 * @param message Post message
 * @returns Post result with ID
 */
export async function publishFacebookTextPost(
  pageId: string,
  pageAccessToken: string,
  message: string
): Promise<FacebookFeedPostResult> {
  const url = `${GRAPH_API_URL}/${pageId}/feed`;

  return metaContentFetch<FacebookFeedPostResult>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      message,
    }),
  });
}

/**
 * Get the permalink for a Facebook post
 *
 * @param postId Facebook post ID
 * @param pageAccessToken Page access token
 * @returns Post permalink
 */
export async function getFacebookPostPermalink(
  postId: string,
  pageAccessToken: string
): Promise<{ permalink_url: string }> {
  const url = `${GRAPH_API_URL}/${postId}?fields=permalink_url`;

  return metaContentFetch<{ permalink_url: string }>(url, pageAccessToken);
}

// =============================================================================
// Instagram Content Publishing
// =============================================================================

/**
 * Create an Instagram media container (step 1 of publishing)
 *
 * Instagram publishing is a two-step process:
 * 1. Create a media container (this function)
 * 2. Publish the container (publishInstagramMedia)
 *
 * @param igAccountId Instagram Business Account ID
 * @param pageAccessToken Page access token (same token used for the linked Page)
 * @param options Container options
 * @returns Container result with ID
 *
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing
 */
export async function createInstagramMediaContainer(
  igAccountId: string,
  pageAccessToken: string,
  options: {
    imageUrl: string;
    caption: string;
    isCarouselItem?: boolean;
  }
): Promise<InstagramContainerResult> {
  const url = `${GRAPH_API_URL}/${igAccountId}/media`;

  const body: Record<string, unknown> = {
    image_url: options.imageUrl,
  };

  if (options.isCarouselItem) {
    body.is_carousel_item = true;
  } else {
    body.caption = options.caption;
  }

  return metaContentFetch<InstagramContainerResult>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Create an Instagram carousel container
 *
 * @param igAccountId Instagram Business Account ID
 * @param pageAccessToken Page access token
 * @param childrenIds Array of child container IDs
 * @param caption Post caption
 * @returns Container result with ID
 */
export async function createInstagramCarouselContainer(
  igAccountId: string,
  pageAccessToken: string,
  childrenIds: string[],
  caption: string
): Promise<InstagramContainerResult> {
  const url = `${GRAPH_API_URL}/${igAccountId}/media`;

  return metaContentFetch<InstagramContainerResult>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: childrenIds.join(","),
      caption,
    }),
  });
}

/**
 * Check media container status
 *
 * Container must be "FINISHED" before publishing.
 * Poll this endpoint until status is FINISHED or ERROR.
 *
 * @param containerId Container ID
 * @param pageAccessToken Page access token
 * @returns Container status
 */
export async function getInstagramContainerStatus(
  containerId: string,
  pageAccessToken: string
): Promise<InstagramContainerStatus> {
  const url = `${GRAPH_API_URL}/${containerId}?fields=id,status_code`;

  return metaContentFetch<InstagramContainerStatus>(url, pageAccessToken);
}

/**
 * Publish an Instagram media container (step 2 of publishing)
 *
 * @param igAccountId Instagram Business Account ID
 * @param pageAccessToken Page access token
 * @param containerId Container ID from createInstagramMediaContainer
 * @returns Publish result with media ID
 */
export async function publishInstagramMedia(
  igAccountId: string,
  pageAccessToken: string,
  containerId: string
): Promise<InstagramPublishResult> {
  const url = `${GRAPH_API_URL}/${igAccountId}/media_publish`;

  return metaContentFetch<InstagramPublishResult>(url, pageAccessToken, {
    method: "POST",
    body: JSON.stringify({
      creation_id: containerId,
    }),
  });
}

/**
 * Get Instagram media details including permalink
 *
 * @param mediaId Instagram media ID
 * @param pageAccessToken Page access token
 * @returns Media details with permalink
 */
export async function getInstagramMediaPermalink(
  mediaId: string,
  pageAccessToken: string
): Promise<InstagramMediaResult> {
  const url = `${GRAPH_API_URL}/${mediaId}?fields=id,permalink`;

  return metaContentFetch<InstagramMediaResult>(url, pageAccessToken);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Wait for Instagram container to be ready
 *
 * Polls the container status until it's FINISHED or ERROR.
 * Throws an error if max attempts exceeded or container failed.
 *
 * @param containerId Container ID
 * @param pageAccessToken Page access token
 * @param maxAttempts Maximum number of polling attempts
 * @param delayMs Delay between attempts in milliseconds
 * @returns True if container is ready
 */
export async function waitForInstagramContainer(
  containerId: string,
  pageAccessToken: string,
  maxAttempts = CONTAINER_POLL_MAX_ATTEMPTS,
  delayMs = CONTAINER_POLL_DELAY_MS
): Promise<{ ready: boolean; error?: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getInstagramContainerStatus(
      containerId,
      pageAccessToken
    );

    switch (status.status_code) {
      case "FINISHED":
        return { ready: true };

      case "ERROR":
      case "EXPIRED":
        return {
          ready: false,
          error:
            status.error_message || `Container status: ${status.status_code}`,
        };

      case "IN_PROGRESS":
        // Wait and try again
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        break;

      case "PUBLISHED":
        // Already published (shouldn't happen but handle it)
        return { ready: true };
    }
  }

  return {
    ready: false,
    error: `Container processing timeout after ${maxAttempts} attempts`,
  };
}

/**
 * Publish a single image to Instagram (full flow)
 *
 * Handles the complete publishing flow:
 * 1. Create container
 * 2. Wait for container to be ready
 * 3. Publish container
 * 4. Get permalink
 *
 * @param igAccountId Instagram Business Account ID
 * @param pageAccessToken Page access token
 * @param options Post options
 * @returns Publish result with media ID and permalink
 */
export async function publishInstagramSingleImage(
  igAccountId: string,
  pageAccessToken: string,
  options: {
    imageUrl: string;
    caption: string;
  }
): Promise<{ mediaId: string; permalink: string }> {
  // Step 1: Create container
  const container = await createInstagramMediaContainer(
    igAccountId,
    pageAccessToken,
    {
      imageUrl: options.imageUrl,
      caption: options.caption,
    }
  );

  // Step 2: Wait for container to be ready
  const { ready, error } = await waitForInstagramContainer(
    container.id,
    pageAccessToken
  );

  if (!ready) {
    throw new Error(`Failed to process Instagram media: ${error}`);
  }

  // Step 3: Publish container
  const result = await publishInstagramMedia(
    igAccountId,
    pageAccessToken,
    container.id
  );

  // Step 4: Get permalink
  const media = await getInstagramMediaPermalink(result.id, pageAccessToken);

  return {
    mediaId: result.id,
    permalink: media.permalink || "",
  };
}

/**
 * Publish a carousel to Instagram (full flow)
 *
 * @param igAccountId Instagram Business Account ID
 * @param pageAccessToken Page access token
 * @param options Carousel options
 * @returns Publish result with media ID and permalink
 */
export async function publishInstagramCarousel(
  igAccountId: string,
  pageAccessToken: string,
  options: {
    imageUrls: string[];
    caption: string;
  }
): Promise<{ mediaId: string; permalink: string }> {
  // Step 1: Create container for each child image
  const childContainers = await Promise.all(
    options.imageUrls.map((imageUrl) =>
      createInstagramMediaContainer(igAccountId, pageAccessToken, {
        imageUrl,
        caption: "", // Children don't have captions
        isCarouselItem: true,
      })
    )
  );

  // Step 2: Wait for all child containers to be ready
  for (const child of childContainers) {
    const { ready, error } = await waitForInstagramContainer(
      child.id,
      pageAccessToken
    );

    if (!ready) {
      throw new Error(`Failed to process carousel item: ${error}`);
    }
  }

  // Step 3: Create carousel container
  const childIds = childContainers.map((c) => c.id);
  const carouselContainer = await createInstagramCarouselContainer(
    igAccountId,
    pageAccessToken,
    childIds,
    options.caption
  );

  // Step 4: Wait for carousel container to be ready
  const { ready, error } = await waitForInstagramContainer(
    carouselContainer.id,
    pageAccessToken
  );

  if (!ready) {
    throw new Error(`Failed to process Instagram carousel: ${error}`);
  }

  // Step 5: Publish carousel
  const result = await publishInstagramMedia(
    igAccountId,
    pageAccessToken,
    carouselContainer.id
  );

  // Step 6: Get permalink
  const media = await getInstagramMediaPermalink(result.id, pageAccessToken);

  return {
    mediaId: result.id,
    permalink: media.permalink || "",
  };
}
