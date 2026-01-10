/**
 * Meta Service
 *
 * Business logic for Meta (Facebook/Instagram) integration.
 * Handles OAuth flow, connection management, and token refresh.
 */

import { randomUUID } from "crypto";
import {
  db,
  eq,
  and,
  desc,
  sql,
  metaConnectionTable,
  metaPageTable,
  metaLeadTable,
  metaConversationTable,
  metaConversationConfigTable,
} from "@repo/db";
import type {
  MetaConnectionInsert,
  MetaPageInsert,
  MetaLeadInsert,
  MetaConversationInsert,
  MetaPageData,
} from "@repo/db";
import { env } from "@repo/env";
import {
  getMetaAuthUrl,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  refreshLongLivedToken,
  fetchUserInfo,
  fetchUserPages,
  fetchPageDetails,
  subscribePageToWebhooks,
  fetchLeadData,
  fetchLeadForm,
  sendMessage as sendMetaMessage,
  fetchUserProfile,
  fetchPageLeadForms,
  fetchFormLeads,
  fetchPageConversations,
  fetchInstagramConversations,
  fetchConversationMessages,
} from "./meta-api.utils";

// Token refresh buffer - refresh 10 days before expiration
const TOKEN_REFRESH_BUFFER_DAYS = 10;

// Pending connections storage (in-memory for simplicity, could use Redis in production)
const pendingConnections = new Map<
  string,
  {
    organizationId: string;
    userId: string;
    accessToken: string;
    accessTokenExpiresAt?: Date;
    metaUserId: string;
    metaUserName?: string;
    scopes: string;
    createdAt: Date;
  }
>();

// Clean up old pending connections every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    for (const [id, conn] of pendingConnections) {
      if (now - conn.createdAt.getTime() > maxAge) {
        pendingConnections.delete(id);
      }
    }
  },
  10 * 60 * 1000
);

// ============================================================================
// OAuth Flow
// ============================================================================

/**
 * Generate OAuth URL for Meta connection
 */
export function generateMetaOAuthUrl(
  organizationId: string,
  userId: string,
  redirectPath?: string
): string {
  const state = Buffer.from(
    JSON.stringify({
      organizationId,
      userId,
      redirectPath: redirectPath || "/settings",
    })
  ).toString("base64");

  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/meta/callback`;

  return getMetaAuthUrl(env.FACEBOOK_CLIENT_ID, redirectUri, state);
}

/**
 * Handle OAuth callback - exchange code for tokens and create pending connection
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<{ setupCode: string; redirectPath: string }> {
  // Decode state
  const stateData = JSON.parse(
    Buffer.from(state, "base64").toString("utf8")
  ) as {
    organizationId: string;
    userId: string;
    redirectPath: string;
  };

  const redirectUri = `${env.BETTER_AUTH_URL}/api/auth/meta/callback`;

  // Exchange code for short-lived token
  const shortLivedTokens = await exchangeCodeForToken(
    code,
    env.FACEBOOK_CLIENT_ID,
    env.FACEBOOK_CLIENT_SECRET,
    redirectUri
  );

  // Exchange for long-lived token
  const longLivedTokens = await exchangeForLongLivedToken(
    shortLivedTokens.accessToken,
    env.FACEBOOK_CLIENT_ID,
    env.FACEBOOK_CLIENT_SECRET
  );

  // Get user info
  const userInfo = await fetchUserInfo(longLivedTokens.accessToken);

  // Create pending connection
  const setupCode = randomUUID();
  pendingConnections.set(setupCode, {
    organizationId: stateData.organizationId,
    userId: stateData.userId,
    accessToken: longLivedTokens.accessToken,
    accessTokenExpiresAt: longLivedTokens.expiresAt,
    metaUserId: userInfo.id,
    metaUserName: userInfo.name,
    scopes:
      "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,instagram_basic,instagram_manage_messages,leads_retrieval,ads_read",
    createdAt: new Date(),
  });

  return {
    setupCode,
    redirectPath: stateData.redirectPath,
  };
}

/**
 * Get pending connection by setup code
 */
export function getPendingConnection(setupCode: string, userId: string) {
  const pending = pendingConnections.get(setupCode);
  if (!pending) {
    throw new Error("Setup code not found or expired");
  }
  if (pending.userId !== userId) {
    throw new Error("Unauthorized access to setup code");
  }
  return pending;
}

/**
 * List available pages from pending connection
 */
export async function listAvailablePages(setupCode: string, userId: string) {
  const pending = getPendingConnection(setupCode, userId);
  return fetchUserPages(pending.accessToken);
}

/**
 * Complete connection by selecting pages
 */
export async function completeConnection(
  setupCode: string,
  userId: string,
  selectedPages: Array<{
    pageId: string;
    pageName: string;
    pageAccessToken: string;
    instagramAccountId?: string;
    instagramUsername?: string;
  }>
): Promise<string> {
  const pending = getPendingConnection(setupCode, userId);

  // Check if connection already exists
  const existingConnection = await db.query.metaConnectionTable.findFirst({
    where: eq(metaConnectionTable.organizationId, pending.organizationId),
  });

  let connectionId: string;

  if (existingConnection) {
    // Update existing connection
    await db
      .update(metaConnectionTable)
      .set({
        accessToken: pending.accessToken,
        accessTokenExpiresAt: pending.accessTokenExpiresAt,
        metaUserId: pending.metaUserId,
        metaUserName: pending.metaUserName,
        scopes: pending.scopes,
        status: "active",
        lastError: null,
        lastValidatedAt: new Date(),
      })
      .where(eq(metaConnectionTable.id, existingConnection.id));

    connectionId = existingConnection.id;

    // Remove old pages that are not in the new selection
    const selectedPageIds = selectedPages.map((p) => p.pageId);
    await db.delete(metaPageTable).where(
      and(
        eq(metaPageTable.metaConnectionId, connectionId),
        sql`${metaPageTable.pageId} NOT IN (${sql.join(
          selectedPageIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
    );
  } else {
    // Create new connection
    const connectionData: MetaConnectionInsert = {
      organizationId: pending.organizationId,
      connectedByUserId: pending.userId,
      metaUserId: pending.metaUserId,
      metaUserName: pending.metaUserName,
      accessToken: pending.accessToken,
      accessTokenExpiresAt: pending.accessTokenExpiresAt,
      scopes: pending.scopes,
      status: "active",
    };

    const [newConnection] = await db
      .insert(metaConnectionTable)
      .values(connectionData)
      .returning({ id: metaConnectionTable.id });

    connectionId = newConnection!.id;
  }

  // Add or update pages
  for (const page of selectedPages) {
    const existingPage = await db.query.metaPageTable.findFirst({
      where: and(
        eq(metaPageTable.metaConnectionId, connectionId),
        eq(metaPageTable.pageId, page.pageId)
      ),
    });

    // Fetch page details
    let pageData: MetaPageData | undefined;
    try {
      const details = await fetchPageDetails(page.pageId, page.pageAccessToken);
      pageData = {
        category: details.category,
        about: details.about,
        description: details.description,
        website: details.website,
        phone: details.phone,
        emails: details.emails,
        location: details.location,
        coverPhoto: details.coverPhoto,
        profilePicture: details.profilePicture,
        followersCount: details.followersCount,
        fanCount: details.fanCount,
      };
    } catch (error) {
      console.error(`Failed to fetch page details for ${page.pageId}:`, error);
    }

    // Subscribe to webhooks
    let webhookSubscribed = false;
    try {
      webhookSubscribed = await subscribePageToWebhooks(
        page.pageId,
        page.pageAccessToken
      );
    } catch (error) {
      console.error(
        `Failed to subscribe to webhooks for ${page.pageId}:`,
        error
      );
    }

    if (existingPage) {
      await db
        .update(metaPageTable)
        .set({
          pageName: page.pageName,
          pageAccessToken: page.pageAccessToken,
          instagramAccountId: page.instagramAccountId,
          instagramUsername: page.instagramUsername,
          pageData,
          webhookSubscribed,
          status: "active",
          lastError: null,
          lastSyncedAt: new Date(),
        })
        .where(eq(metaPageTable.id, existingPage.id));
    } else {
      const pageInsert: MetaPageInsert = {
        metaConnectionId: connectionId,
        organizationId: pending.organizationId,
        pageId: page.pageId,
        pageName: page.pageName,
        pageAccessToken: page.pageAccessToken,
        instagramAccountId: page.instagramAccountId,
        instagramUsername: page.instagramUsername,
        pageData,
        webhookSubscribed,
        status: "active",
      };

      await db.insert(metaPageTable).values(pageInsert);
    }
  }

  // Clean up pending connection
  pendingConnections.delete(setupCode);

  return connectionId;
}

// ============================================================================
// Connection Management
// ============================================================================

/**
 * Get Meta connection for organization
 */
export async function getConnection(organizationId: string) {
  return db.query.metaConnectionTable.findFirst({
    where: eq(metaConnectionTable.organizationId, organizationId),
  });
}

/**
 * Get pages for organization
 */
export async function getPages(organizationId: string) {
  const connection = await getConnection(organizationId);
  if (!connection) return [];

  return db.query.metaPageTable.findMany({
    where: eq(metaPageTable.metaConnectionId, connection.id),
    orderBy: [desc(metaPageTable.createdAt)],
  });
}

/**
 * Get a specific page
 */
export async function getPage(pageId: string, organizationId: string) {
  return db.query.metaPageTable.findFirst({
    where: and(
      eq(metaPageTable.id, pageId),
      eq(metaPageTable.organizationId, organizationId)
    ),
  });
}

/**
 * Disconnect Meta integration
 */
export async function disconnect(organizationId: string): Promise<void> {
  const connection = await getConnection(organizationId);
  if (!connection) return;

  // Delete all related data (cascades will handle pages, leads, conversations)
  await db
    .delete(metaConnectionTable)
    .where(eq(metaConnectionTable.id, connection.id));
}

/**
 * Update page settings
 */
export async function updatePage(
  pageId: string,
  organizationId: string,
  updates: { messengerEnabled?: boolean; instagramDmEnabled?: boolean }
): Promise<void> {
  await db
    .update(metaPageTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(metaPageTable.id, pageId),
        eq(metaPageTable.organizationId, organizationId)
      )
    );
}

// ============================================================================
// Sync Functions
// ============================================================================

/**
 * Sync leads from Meta for a page
 */
export async function syncPageLeads(
  pageId: string,
  organizationId: string
): Promise<{ synced: number; errors: number }> {
  const page = await getPage(pageId, organizationId);
  if (!page) {
    throw new Error("Page not found");
  }

  let synced = 0;
  let errors = 0;

  try {
    // Fetch all lead forms for the page
    const formsResponse = await fetchPageLeadForms(
      page.pageId,
      page.pageAccessToken
    );

    // For each form, fetch leads
    for (const form of formsResponse.data) {
      try {
        const leadsResponse = await fetchFormLeads(
          form.id,
          page.pageAccessToken,
          100
        );

        for (const leadData of leadsResponse.data) {
          // Check if lead already exists
          const existingLead = await db.query.metaLeadTable.findFirst({
            where: eq(metaLeadTable.leadId, leadData.id),
          });

          if (existingLead) {
            continue; // Skip already synced leads
          }

          // Extract common fields from field_data
          let fullName: string | undefined;
          let email: string | undefined;
          let phone: string | undefined;

          const fieldData = leadData.field_data || [];
          for (const field of fieldData) {
            const value = field.values?.[0];
            if (!value) continue;

            switch (field.name?.toLowerCase()) {
              case "full_name":
              case "name":
                fullName = value;
                break;
              case "email":
                email = value;
                break;
              case "phone_number":
              case "phone":
                phone = value;
                break;
            }
          }

          const leadInsert: MetaLeadInsert = {
            metaPageId: page.id,
            organizationId: page.organizationId,
            leadId: leadData.id,
            formId: leadData.form_id,
            formName: form.name,
            adId: leadData.ad_id,
            adName: leadData.ad_name,
            campaignId: leadData.campaign_id,
            campaignName: leadData.campaign_name,
            leadCreatedAt: new Date(leadData.created_time),
            fullName,
            email,
            phone,
            fieldData: fieldData.length > 0 ? fieldData : undefined,
            status: "new",
          };

          await db.insert(metaLeadTable).values(leadInsert);
          synced++;
        }
      } catch (formError) {
        console.error(`Failed to sync leads from form ${form.id}:`, formError);
        errors++;
      }
    }

    // Update page last synced timestamp
    await db
      .update(metaPageTable)
      .set({ lastSyncedAt: new Date() })
      .where(eq(metaPageTable.id, pageId));
  } catch (error) {
    console.error(`Failed to sync leads for page ${pageId}:`, error);
    throw error;
  }

  return { synced, errors };
}

/**
 * Sync conversations from Meta for a page (both Messenger and Instagram)
 */
export async function syncPageConversations(
  pageId: string,
  organizationId: string,
  platform?: "messenger" | "instagram"
): Promise<{
  synced: number;
  errors: number;
  messenger: number;
  instagram: number;
  instagramError?: string;
}> {
  const page = await getPage(pageId, organizationId);
  if (!page) {
    throw new Error("Page not found");
  }

  // Store validated page reference for TypeScript narrowing across async boundaries
  const validatedPage = page;

  let synced = 0;
  let errors = 0;
  let messengerSynced = 0;
  let instagramSynced = 0;
  let instagramErrorMsg: string | undefined;

  // Helper function to sync conversations for a platform
  async function syncPlatformConversations(
    conversations: Array<{
      id: string;
      updated_time: string;
      participants: {
        data: Array<{ id: string; name?: string; username?: string }>;
      };
      messages?: {
        data: Array<{ id: string; message?: string; created_time: string }>;
      };
    }>,
    targetPlatform: "messenger" | "instagram",
    accountId: string,
    pageData: NonNullable<typeof page>
  ): Promise<{ synced: number; errors: number }> {
    let platformSynced = 0;
    let platformErrors = 0;

    console.log("Syncing conversations for platform:", targetPlatform);

    for (const conv of conversations) {
      try {
        // Check if conversation already exists
        const existingConv = await db.query.metaConversationTable.findFirst({
          where: and(
            eq(metaConversationTable.metaPageId, pageData.id),
            eq(metaConversationTable.threadId, conv.id)
          ),
        });

        if (existingConv) {
          continue;
        }

        // Get participant info (first non-page participant)
        const participant = conv.participants?.data?.find(
          (p) => p.id !== accountId && p.id !== pageData.pageId
        );
        if (!participant) {
          continue;
        }

        // Try to get participant profile
        let participantName = participant.name || participant.username;
        let participantProfilePic: string | undefined;

        try {
          const profile = await fetchUserProfile(
            participant.id,
            pageData.pageAccessToken
          );
          participantName = profile.name || participantName;
          participantProfilePic = profile.profile_pic;
        } catch {
          // Profile may not be available
        }

        // Get last message preview
        const lastMessage = conv.messages?.data?.[0];

        const conversationInsert: MetaConversationInsert = {
          metaPageId: pageData.id,
          organizationId: pageData.organizationId,
          platform: targetPlatform,
          threadId: conv.id,
          participantId: participant.id,
          participantName,
          participantProfilePic,
          lastMessagePreview: lastMessage?.message?.substring(0, 100),
          lastMessageAt: lastMessage
            ? new Date(lastMessage.created_time)
            : new Date(conv.updated_time),
          aiEnabled: true,
          messageCount: 0,
        };

        // Fetch full message history for this conversation
        try {
          const messagesResponse = await fetchConversationMessages(
            conv.id,
            pageData.pageAccessToken,
            10
          );

          const recentMessages = messagesResponse.data.map((msg) => ({
            id: msg.id,
            timestamp: msg.created_time,
            senderId: msg.from.id,
            isFromPage:
              msg.from.id === pageData.pageId || msg.from.id === accountId,
            text: msg.message,
          }));

          conversationInsert.recentMessages = recentMessages.reverse();
          conversationInsert.messageCount = recentMessages.length;
        } catch {
          // Messages fetch failed, continue without history
        }

        await db.insert(metaConversationTable).values(conversationInsert);
        platformSynced++;
      } catch (convError) {
        console.error(
          `Failed to sync ${targetPlatform} conversation ${conv.id}:`,
          convError
        );
        platformErrors++;
      }
    }

    return { synced: platformSynced, errors: platformErrors };
  }

  try {
    // Sync Messenger conversations (if not specifically requesting Instagram only)
    if (!platform || platform === "messenger") {
      try {
        const messengerResponse = await fetchPageConversations(
          validatedPage.pageId,
          validatedPage.pageAccessToken,
          "messenger",
          50
        );

        const result = await syncPlatformConversations(
          messengerResponse.data,
          "messenger",
          validatedPage.pageId,
          validatedPage
        );
        messengerSynced = result.synced;
        synced += result.synced;
        errors += result.errors;
      } catch (messengerError) {
        console.error(
          `Failed to fetch Messenger conversations:`,
          messengerError
        );
      }
    }

    // Sync Instagram conversations (if page has Instagram account connected)
    if (
      (!platform || platform === "instagram") &&
      validatedPage.instagramAccountId
    ) {
      try {
        const instagramResponse = await fetchInstagramConversations(
          validatedPage.instagramAccountId,
          validatedPage.pageAccessToken,
          50
        );

        const result = await syncPlatformConversations(
          instagramResponse.data,
          "instagram",
          validatedPage.instagramAccountId,
          validatedPage
        );
        instagramSynced = result.synced;
        synced += result.synced;
        errors += result.errors;
      } catch (instagramError) {
        console.error(
          `Failed to fetch Instagram conversations:`,
          instagramError
        );
        // Capture user-friendly error message
        const errorMsg =
          instagramError instanceof Error
            ? instagramError.message
            : String(instagramError);
        if (errorMsg.includes("Application does not have the capability")) {
          instagramErrorMsg =
            "Instagram Messaging API not enabled. Enable it in Meta Developer Console → Your App → Add Products → Instagram Messaging.";
        } else {
          instagramErrorMsg = `Instagram sync failed: ${errorMsg}`;
        }
      }
    }

    // Update page last synced timestamp
    await db
      .update(metaPageTable)
      .set({ lastSyncedAt: new Date() })
      .where(eq(metaPageTable.id, pageId));
  } catch (error) {
    console.error(`Failed to sync conversations for page ${pageId}:`, error);
    throw error;
  }

  return {
    synced,
    errors,
    messenger: messengerSynced,
    instagram: instagramSynced,
    instagramError: instagramErrorMsg,
  };
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Check if token needs refresh and refresh if necessary
 */
export async function ensureValidToken(
  organizationId: string
): Promise<string> {
  const connection = await getConnection(organizationId);
  if (!connection) {
    throw new Error("No Meta connection found for organization");
  }

  if (connection.status === "error") {
    throw new Error(
      connection.lastError || "Meta connection is in error state"
    );
  }

  // Check if token is expired or about to expire
  const now = new Date();
  const bufferDate = new Date(
    now.getTime() + TOKEN_REFRESH_BUFFER_DAYS * 24 * 60 * 60 * 1000
  );

  if (
    connection.accessTokenExpiresAt &&
    connection.accessTokenExpiresAt <= bufferDate
  ) {
    try {
      const newTokens = await refreshLongLivedToken(
        connection.accessToken,
        env.FACEBOOK_CLIENT_ID,
        env.FACEBOOK_CLIENT_SECRET
      );

      await db
        .update(metaConnectionTable)
        .set({
          accessToken: newTokens.accessToken,
          accessTokenExpiresAt: newTokens.expiresAt,
          lastValidatedAt: now,
          lastError: null,
        })
        .where(eq(metaConnectionTable.id, connection.id));

      return newTokens.accessToken;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Token refresh failed";

      await db
        .update(metaConnectionTable)
        .set({
          status: "error",
          lastError: errorMessage,
        })
        .where(eq(metaConnectionTable.id, connection.id));

      throw new Error(`Meta token refresh failed: ${errorMessage}`);
    }
  }

  return connection.accessToken;
}

/**
 * Get valid page access token
 */
export async function getValidPageToken(
  pageId: string,
  organizationId: string
): Promise<string> {
  const page = await getPage(pageId, organizationId);
  if (!page) {
    throw new Error("Page not found");
  }

  if (page.status === "error") {
    throw new Error(page.lastError || "Page is in error state");
  }

  // Page tokens don't expire if derived from long-lived user tokens
  return page.pageAccessToken;
}

// ============================================================================
// Lead Management
// ============================================================================

/**
 * Process a lead webhook event
 */
export async function processLeadWebhook(
  pageId: string,
  leadgenId: string,
  formId: string,
  createdTime: number
): Promise<MetaLeadInsert | null> {
  // Find the page
  const page = await db.query.metaPageTable.findFirst({
    where: eq(metaPageTable.pageId, pageId),
  });

  if (!page) {
    console.error(`Page not found for lead webhook: ${pageId}`);
    return null;
  }

  // Check if lead already exists
  const existingLead = await db.query.metaLeadTable.findFirst({
    where: eq(metaLeadTable.leadId, leadgenId),
  });

  if (existingLead) {
    return null; // Already processed
  }

  try {
    // Fetch lead data from Meta API
    const leadData = await fetchLeadData(leadgenId, page.pageAccessToken);

    // Fetch form info
    let formName: string | undefined;
    try {
      const formInfo = await fetchLeadForm(formId, page.pageAccessToken);
      formName = formInfo.name;
    } catch {
      // Form info is optional
    }

    // Extract common fields
    let fullName: string | undefined;
    let email: string | undefined;
    let phone: string | undefined;

    for (const field of leadData.field_data) {
      const value = field.values[0];
      switch (field.name.toLowerCase()) {
        case "full_name":
        case "name":
          fullName = value;
          break;
        case "email":
          email = value;
          break;
        case "phone_number":
        case "phone":
          phone = value;
          break;
      }
    }

    const leadInsert: MetaLeadInsert = {
      metaPageId: page.id,
      organizationId: page.organizationId,
      leadId: leadgenId,
      formId,
      formName,
      adId: leadData.ad_id,
      adName: leadData.ad_name,
      campaignId: leadData.campaign_id,
      campaignName: leadData.campaign_name,
      leadCreatedAt: new Date(createdTime * 1000),
      fullName,
      email,
      phone,
      fieldData: leadData.field_data,
      status: "new",
    };

    const [insertedLead] = await db
      .insert(metaLeadTable)
      .values(leadInsert)
      .returning();

    return insertedLead!;
  } catch (error) {
    console.error(`Failed to process lead ${leadgenId}:`, error);
    return null;
  }
}

/**
 * Get leads for organization
 */
export async function getLeads(
  organizationId: string,
  options?: {
    pageId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }
) {
  const conditions = [eq(metaLeadTable.organizationId, organizationId)];

  if (options?.pageId) {
    conditions.push(eq(metaLeadTable.metaPageId, options.pageId));
  }

  if (options?.status) {
    conditions.push(eq(metaLeadTable.status, options.status));
  }

  return db.query.metaLeadTable.findMany({
    where: and(...conditions),
    orderBy: [desc(metaLeadTable.leadCreatedAt)],
    limit: options?.limit || 20,
  });
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  leadId: string,
  organizationId: string,
  status: string,
  notes?: string
) {
  const updateData: Partial<MetaLeadInsert> = { status };
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  await db
    .update(metaLeadTable)
    .set(updateData)
    .where(
      and(
        eq(metaLeadTable.id, leadId),
        eq(metaLeadTable.organizationId, organizationId)
      )
    );
}

// ============================================================================
// Conversation Management
// ============================================================================

/**
 * Get or create conversation for a message
 */
export async function getOrCreateConversation(
  pageId: string,
  organizationId: string,
  platform: "messenger" | "instagram",
  threadId: string,
  participantId: string
): Promise<string> {
  // Check if conversation exists
  const existing = await db.query.metaConversationTable.findFirst({
    where: and(
      eq(metaConversationTable.metaPageId, pageId),
      eq(metaConversationTable.threadId, threadId)
    ),
  });

  if (existing) {
    return existing.id;
  }

  // Get page info for fetching user profile
  const page = await db.query.metaPageTable.findFirst({
    where: eq(metaPageTable.id, pageId),
  });

  // Try to get participant info
  let participantName: string | undefined;
  let participantProfilePic: string | undefined;

  if (page) {
    try {
      const profile = await fetchUserProfile(
        participantId,
        page.pageAccessToken
      );
      participantName = profile.name;
      participantProfilePic = profile.profile_pic;
    } catch {
      // User profile may not be available
    }
  }

  const conversationInsert: MetaConversationInsert = {
    metaPageId: pageId,
    organizationId,
    platform,
    threadId,
    participantId,
    participantName,
    participantProfilePic,
    aiEnabled: true,
    messageCount: 0,
  };

  const [newConversation] = await db
    .insert(metaConversationTable)
    .values(conversationInsert)
    .returning({ id: metaConversationTable.id });

  return newConversation!.id;
}

/**
 * Update conversation with new message
 */
export async function updateConversationWithMessage(
  conversationId: string,
  message: {
    text?: string;
    isFromPage: boolean;
    timestamp: string;
  }
) {
  const conversation = await db.query.metaConversationTable.findFirst({
    where: eq(metaConversationTable.id, conversationId),
  });

  if (!conversation) return;

  const recentMessages = conversation.recentMessages || [];

  // Add new message to recent messages (keep last 10)
  const newMessage = {
    id: randomUUID(),
    timestamp: message.timestamp,
    senderId: message.isFromPage ? "page" : "user",
    isFromPage: message.isFromPage,
    text: message.text,
  };

  recentMessages.push(newMessage);
  if (recentMessages.length > 10) {
    recentMessages.shift();
  }

  await db
    .update(metaConversationTable)
    .set({
      lastMessagePreview: message.text?.substring(0, 100),
      lastMessageAt: new Date(message.timestamp),
      recentMessages,
      messageCount: (conversation.messageCount || 0) + 1,
    })
    .where(eq(metaConversationTable.id, conversationId));
}

/**
 * Send a message in a conversation
 */
export async function sendConversationMessage(
  conversationId: string,
  organizationId: string,
  text: string
): Promise<void> {
  const conversation = await db.query.metaConversationTable.findFirst({
    where: and(
      eq(metaConversationTable.id, conversationId),
      eq(metaConversationTable.organizationId, organizationId)
    ),
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const page = await db.query.metaPageTable.findFirst({
    where: eq(metaPageTable.id, conversation.metaPageId),
  });

  if (!page) {
    throw new Error("Page not found");
  }

  // Send message via Meta API
  await sendMetaMessage(
    page.pageId,
    page.pageAccessToken,
    conversation.participantId,
    text
  );

  // Update conversation
  await updateConversationWithMessage(conversationId, {
    text,
    isFromPage: true,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get conversations for organization
 */
export async function getConversations(
  organizationId: string,
  options?: {
    pageId?: string;
    platform?: "messenger" | "instagram";
    needsAttention?: boolean;
    limit?: number;
  }
) {
  const conditions = [eq(metaConversationTable.organizationId, organizationId)];

  if (options?.pageId) {
    conditions.push(eq(metaConversationTable.metaPageId, options.pageId));
  }

  if (options?.platform) {
    conditions.push(eq(metaConversationTable.platform, options.platform));
  }

  if (options?.needsAttention !== undefined) {
    conditions.push(
      eq(metaConversationTable.needsAttention, options.needsAttention)
    );
  }

  return db.query.metaConversationTable.findMany({
    where: and(...conditions),
    orderBy: [desc(metaConversationTable.lastMessageAt)],
    limit: options?.limit || 20,
  });
}

// ============================================================================
// AI Configuration
// ============================================================================

/**
 * Get conversation config for a page
 */
export async function getConversationConfig(
  pageId: string,
  organizationId: string
) {
  return db.query.metaConversationConfigTable.findFirst({
    where: and(
      eq(metaConversationConfigTable.metaPageId, pageId),
      eq(metaConversationConfigTable.organizationId, organizationId)
    ),
  });
}

/**
 * Update conversation config
 */
export async function updateConversationConfig(
  pageId: string,
  organizationId: string,
  config: Partial<{
    aiEnabled: boolean;
    aiPersonality: {
      tone: "professional" | "friendly" | "casual" | "formal";
      responseLength: "concise" | "detailed" | "auto";
      useEmojis: boolean;
      customInstructions?: string;
    };
    aiTemperature: number;
    welcomeMessage: string;
    awayMessage: string;
    businessHours: {
      enabled: boolean;
      timezone: string;
      schedule: Array<{
        day: number;
        startTime: string;
        endTime: string;
      }>;
    };
    handoffKeywords: string[];
    handoffNotificationEmail: string;
    useOrganizationContext: boolean;
    useWebsiteContext: boolean;
    additionalContext: string;
  }>
) {
  const existing = await getConversationConfig(pageId, organizationId);

  if (existing) {
    await db
      .update(metaConversationConfigTable)
      .set(config)
      .where(eq(metaConversationConfigTable.id, existing.id));
  } else {
    await db.insert(metaConversationConfigTable).values({
      metaPageId: pageId,
      organizationId,
      ...config,
    });
  }
}
