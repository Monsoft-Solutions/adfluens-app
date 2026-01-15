/**
 * Content Service
 *
 * Business logic for creating and publishing content to social media platforms.
 * Handles CRUD operations, media uploads, and platform-specific publishing.
 */

import {
  db,
  eq,
  and,
  desc,
  inArray,
  contentPostTable,
  contentPostAccountTable,
  platformConnectionTable,
} from "@repo/db";
import type {
  ContentPostRow,
  ContentPostInsert,
  ContentPostMediaJson,
  ContentPostPublishResultJson,
  ContentPostAccountInsert,
  PlatformConnectionRow,
  MetaPageRow,
} from "@repo/db";
import type {
  ContentPostCreateInputV2,
  ContentPostUpdateInput,
  ContentPostListInput,
} from "@repo/types/content/content-post.type";
import type {
  PlatformPublishResult,
  PlatformValidationError,
  PlatformValidationWarning,
} from "@repo/types/content/platform-specs.type";
import { TRPCError } from "@trpc/server";

import { getAdapter, getAllSpecs } from "./platform-adapters";
import * as metaContentApi from "../meta/meta-content-api.utils";
import {
  getConnectionsByIds,
  resolveCredentials,
} from "../platform-connection/platform-connection.service";
import { mediaStorage } from "@repo/media-storage";

// =============================================================================
// Types
// =============================================================================

type ListPostsResult = {
  posts: ContentPostRow[];
  nextCursor?: string;
};

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create a new content post with multi-account support (V2)
 *
 * Creates a post and links it to multiple platform connections.
 */
export async function createPostV2(
  input: ContentPostCreateInputV2,
  organizationId: string,
  userId: string
): Promise<ContentPostRow & { accounts: PlatformConnectionRow[] }> {
  // Get the platform connections
  const connections = await db.query.platformConnectionTable.findMany({
    where: and(
      inArray(platformConnectionTable.id, input.accountIds),
      eq(platformConnectionTable.organizationId, organizationId),
      eq(platformConnectionTable.status, "active")
    ),
  });

  if (connections.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No valid platform connections found",
    });
  }

  // Ensure all requested accounts were found
  if (connections.length !== input.accountIds.length) {
    const foundIds = new Set(connections.map((c) => c.id));
    const missingIds = input.accountIds.filter((id) => !foundIds.has(id));
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Some platform connections not found or inactive: ${missingIds.join(", ")}`,
    });
  }

  // Extract unique platforms from connections
  const platforms = [...new Set(connections.map((c) => c.platform))];

  // Validate against each platform
  for (const platform of platforms) {
    const adapter = getAdapter(platform);
    const mockPost = {
      caption: input.caption,
      hashtags: input.hashtags || null,
      media: input.media as ContentPostMediaJson[],
    } as ContentPostRow;

    const validation = adapter.validate(mockPost);
    if (!validation.isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Validation failed for ${platform}: ${validation.errors.map((e: PlatformValidationError) => e.message).join(", ")}`,
      });
    }
  }

  // Create the post
  const [post] = await db
    .insert(contentPostTable)
    .values({
      organizationId,
      platforms,
      caption: input.caption,
      hashtags: input.hashtags || null,
      media: input.media as ContentPostMediaJson[],
      status: "draft",
      createdByUserId: userId,
    })
    .returning();

  if (!post) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create post",
    });
  }

  // Link post to platform connections
  const postAccountInserts: ContentPostAccountInsert[] = connections.map(
    (conn) => ({
      contentPostId: post.id,
      platformConnectionId: conn.id,
      status: "pending" as const,
    })
  );

  await db.insert(contentPostAccountTable).values(postAccountInserts);

  return { ...post, accounts: connections };
}

/**
 * Get a single post by ID
 */
export async function getPost(
  postId: string,
  organizationId: string
): Promise<ContentPostRow | null> {
  const post = await db.query.contentPostTable.findFirst({
    where: and(
      eq(contentPostTable.id, postId),
      eq(contentPostTable.organizationId, organizationId)
    ),
  });

  return post || null;
}

/**
 * Get a post or throw if not found
 */
export async function getPostOrThrow(
  postId: string,
  organizationId: string
): Promise<ContentPostRow> {
  const post = await getPost(postId, organizationId);

  if (!post) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Post not found",
    });
  }

  return post;
}

/**
 * List posts for an organization
 */
export async function listPosts(
  organizationId: string,
  options?: ContentPostListInput
): Promise<ListPostsResult> {
  const limit = options?.limit || 20;

  const conditions = [eq(contentPostTable.organizationId, organizationId)];

  if (options?.status) {
    conditions.push(eq(contentPostTable.status, options.status));
  }

  // If filtering by platform, we need to check if platform is in the platforms array
  // Drizzle doesn't have a direct contains for arrays, so we use SQL
  let posts: ContentPostRow[];

  if (options?.platform) {
    // Use raw SQL for array contains
    const { sql } = await import("drizzle-orm");
    posts = await db.query.contentPostTable.findMany({
      where: and(
        ...conditions,
        sql`${options.platform} = ANY(${contentPostTable.platforms})`
      ),
      orderBy: [desc(contentPostTable.createdAt)],
      limit: limit + 1,
    });
  } else {
    posts = await db.query.contentPostTable.findMany({
      where: and(...conditions),
      orderBy: [desc(contentPostTable.createdAt)],
      limit: limit + 1,
    });
  }

  const hasMore = posts.length > limit;
  const resultPosts = hasMore ? posts.slice(0, limit) : posts;
  const nextCursor = hasMore
    ? resultPosts[resultPosts.length - 1]?.id
    : undefined;

  return {
    posts: resultPosts,
    nextCursor,
  };
}

/**
 * Update a draft post
 */
export async function updatePost(
  postId: string,
  organizationId: string,
  updates: Partial<ContentPostUpdateInput>
): Promise<ContentPostRow> {
  const existingPost = await getPostOrThrow(postId, organizationId);

  if (existingPost.status !== "draft") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only draft posts can be updated",
    });
  }

  const updateData: Partial<ContentPostInsert> = {};

  if (updates.caption !== undefined) {
    updateData.caption = updates.caption;
  }

  if (updates.hashtags !== undefined) {
    updateData.hashtags = updates.hashtags;
  }

  if (updates.media !== undefined) {
    updateData.media = updates.media as ContentPostMediaJson[];
  }

  const [updatedPost] = await db
    .update(contentPostTable)
    .set(updateData)
    .where(
      and(
        eq(contentPostTable.id, postId),
        eq(contentPostTable.organizationId, organizationId)
      )
    )
    .returning();

  if (!updatedPost) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update post",
    });
  }

  return updatedPost;
}

/**
 * Delete a post
 */
export async function deletePost(
  postId: string,
  organizationId: string
): Promise<void> {
  const existingPost = await getPostOrThrow(postId, organizationId);

  if (existingPost.status === "published") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Published posts cannot be deleted. They must be unpublished from the platform first.",
    });
  }

  await db
    .delete(contentPostTable)
    .where(
      and(
        eq(contentPostTable.id, postId),
        eq(contentPostTable.organizationId, organizationId)
      )
    );
}

// =============================================================================
// Publishing
// =============================================================================

/**
 * Publish a post to all linked platform accounts (V2 flow)
 *
 * Resolves credentials from content_post_account → platform_connection → source table
 */
export async function publishPost(
  postId: string,
  organizationId: string
): Promise<Record<string, PlatformPublishResult>> {
  const post = await getPostOrThrow(postId, organizationId);

  if (post.status === "published") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Post is already published",
    });
  }

  // Get linked platform accounts
  const postAccounts = await db.query.contentPostAccountTable.findMany({
    where: eq(contentPostAccountTable.contentPostId, postId),
  });

  if (postAccounts.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No platform accounts linked to this post",
    });
  }

  // Mark as pending
  await db
    .update(contentPostTable)
    .set({ status: "pending" })
    .where(eq(contentPostTable.id, postId));

  const results: Record<string, PlatformPublishResult> = {};
  let hasSuccess = false;
  let lastError: string | null = null;

  // Resolve platform connections
  const connectionIds = postAccounts.map((pa) => pa.platformConnectionId);
  const connections = await getConnectionsByIds(connectionIds, organizationId);

  // Publish to each linked account
  for (const account of postAccounts) {
    const connection = connections.find(
      (c) => c.id === account.platformConnectionId
    );
    if (!connection) {
      await updateAccountStatus(account.id, "failed", {
        error: "Platform connection not found",
      });
      continue;
    }

    try {
      const resolved = await resolveCredentials(connection);
      let result: PlatformPublishResult;

      if (connection.platform === "facebook") {
        const pageData = buildMetaPageData(resolved);
        result = await publishToFacebook(post, pageData);
      } else if (connection.platform === "instagram") {
        const pageData = buildMetaPageData(resolved);
        result = await publishToInstagram(post, pageData);
      } else {
        result = {
          success: false,
          error: `Platform ${connection.platform} not yet supported`,
        };
      }

      results[connection.platform] = result;
      await updateAccountStatus(
        account.id,
        result.success ? "published" : "failed",
        {
          postId: result.postId,
          permalink: result.permalink,
          error: result.error,
          publishedAt: result.success ? new Date().toISOString() : undefined,
        }
      );

      if (result.success) hasSuccess = true;
      else lastError = result.error || "Unknown error";
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      results[connection.platform] = { success: false, error: errorMessage };
      lastError = errorMessage;
      await updateAccountStatus(account.id, "failed", { error: errorMessage });
    }
  }

  // Build publish results JSON
  const publishResultsJson: Record<string, ContentPostPublishResultJson> = {};
  for (const [platform, result] of Object.entries(results)) {
    publishResultsJson[platform] = {
      postId: result.postId,
      permalink: result.permalink,
      error: result.error,
      publishedAt: result.success ? new Date().toISOString() : undefined,
    };
  }

  // Update post status
  await db
    .update(contentPostTable)
    .set({
      status: hasSuccess ? "published" : "failed",
      publishResults: publishResultsJson,
      lastError,
    })
    .where(eq(contentPostTable.id, postId));

  return results;
}

/**
 * Helper: Build MetaPageRow-compatible object from resolved credentials
 */
function buildMetaPageData(
  resolved: Awaited<ReturnType<typeof resolveCredentials>>
): MetaPageRow {
  return {
    pageId: resolved.credentials?.pageId as string,
    pageAccessToken: resolved.accessToken!,
    instagramAccountId: resolved.credentials?.instagramAccountId as
      | string
      | null,
  } as MetaPageRow;
}

/**
 * Helper: Update content_post_account status
 */
async function updateAccountStatus(
  accountId: string,
  status: "published" | "failed",
  publishResult: Record<string, unknown>
): Promise<void> {
  await db
    .update(contentPostAccountTable)
    .set({
      status,
      publishResult: publishResult as ContentPostPublishResultJson,
    })
    .where(eq(contentPostAccountTable.id, accountId));
}

/**
 * Publish to Facebook Page
 */
async function publishToFacebook(
  post: ContentPostRow,
  page: MetaPageRow
): Promise<PlatformPublishResult> {
  const adapter = getAdapter("facebook");
  const caption = adapter.formatCaption(post.caption, post.hashtags);

  // Get stored URLs from media
  const imageUrls = post.media
    .map((m: ContentPostMediaJson) => m.storedUrl || m.url)
    .filter((url: string | undefined): url is string => !!url);

  if (imageUrls.length === 0) {
    return {
      success: false,
      error: "No valid image URLs found",
    };
  }

  try {
    let result: { id: string };

    if (imageUrls.length === 1) {
      // Single image post
      result = await metaContentApi.publishFacebookPhotoPost(
        page.pageId,
        page.pageAccessToken,
        {
          imageUrl: imageUrls[0]!,
          caption,
        }
      );
    } else {
      // Multi-image post
      result = await metaContentApi.publishFacebookMultiPhotoPost(
        page.pageId,
        page.pageAccessToken,
        {
          imageUrls,
          caption,
        }
      );
    }

    // Get permalink
    let permalink: string | undefined;
    try {
      const postDetails = await metaContentApi.getFacebookPostPermalink(
        result.id,
        page.pageAccessToken
      );
      permalink = postDetails.permalink_url;
    } catch {
      // Permalink fetch failed, but post was successful
    }

    return {
      success: true,
      postId: result.id,
      permalink,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Facebook publish failed",
    };
  }
}

/**
 * Publish to Instagram Business Account
 */
async function publishToInstagram(
  post: ContentPostRow,
  page: MetaPageRow
): Promise<PlatformPublishResult> {
  if (!page.instagramAccountId) {
    return {
      success: false,
      error: "No Instagram Business account linked to this page",
    };
  }

  const adapter = getAdapter("instagram");
  const caption = adapter.formatCaption(post.caption, post.hashtags);

  // Get stored URLs from media
  const imageUrls = post.media
    .map((m: ContentPostMediaJson) => m.storedUrl || m.url)
    .filter((url: string | undefined): url is string => !!url);

  if (imageUrls.length === 0) {
    return {
      success: false,
      error: "No valid image URLs found",
    };
  }

  try {
    let result: { mediaId: string; permalink: string };

    if (imageUrls.length === 1) {
      // Single image post
      result = await metaContentApi.publishInstagramSingleImage(
        page.instagramAccountId,
        page.pageAccessToken,
        {
          imageUrl: imageUrls[0]!,
          caption,
        }
      );
    } else {
      // Carousel post
      result = await metaContentApi.publishInstagramCarousel(
        page.instagramAccountId,
        page.pageAccessToken,
        {
          imageUrls,
          caption,
        }
      );
    }

    return {
      success: true,
      postId: result.mediaId,
      permalink: result.permalink,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Instagram publish failed",
    };
  }
}

// =============================================================================
// Media Upload
// =============================================================================

/**
 * Upload media from a URL to storage
 */
export async function uploadMediaFromUrl(
  organizationId: string,
  sourceUrl: string
): Promise<{ url: string; storedUrl: string }> {
  try {
    const storedUrl = await mediaStorage.uploadFromUrl(
      sourceUrl,
      `content/${organizationId}/media`
    );

    return {
      url: sourceUrl,
      storedUrl,
    };
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to upload media: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a post against platform requirements
 */
export function validatePost(post: {
  platforms: string[];
  caption: string;
  hashtags?: string[] | null;
  media: ContentPostMediaJson[];
}): {
  isValid: boolean;
  platformResults: Record<
    string,
    { isValid: boolean; errors: string[]; warnings: string[] }
  >;
} {
  const platformResults: Record<
    string,
    { isValid: boolean; errors: string[]; warnings: string[] }
  > = {};
  let isValid = true;

  for (const platform of post.platforms) {
    const adapter = getAdapter(platform);
    const mockPost = {
      caption: post.caption,
      hashtags: post.hashtags || null,
      media: post.media,
    } as ContentPostRow;

    const validation = adapter.validate(mockPost);
    platformResults[platform] = {
      isValid: validation.isValid,
      errors: validation.errors.map((e: PlatformValidationError) => e.message),
      warnings: validation.warnings.map(
        (w: PlatformValidationWarning) => w.message
      ),
    };

    if (!validation.isValid) {
      isValid = false;
    }
  }

  return { isValid, platformResults };
}

// =============================================================================
// Platform Specs
// =============================================================================

/**
 * Get specifications for all supported platforms
 */
export function getPlatformSpecs() {
  return getAllSpecs();
}
