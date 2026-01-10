/**
 * Meta Webhook Handler
 *
 * Processes incoming webhooks from Meta for messages and leads.
 */

import crypto from "crypto";
import type { Request, Response } from "express";
import { env } from "@repo/env";
import { db, eq, metaPageTable, metaConversationTable } from "@repo/db";
import {
  processLeadWebhook,
  getOrCreateConversation,
  updateConversationWithMessage,
  sendConversationMessage,
} from "./meta.service";
import { notifyNewLead } from "./meta-notification.service";
import { processIncomingMessage } from "../meta-bot/meta-bot.service";

/**
 * Verify webhook signature from Meta
 */
export function verifyWebhookSignature(req: Request, buf: Buffer): void {
  const signature = req.headers["x-hub-signature-256"] as string;

  if (!signature) {
    throw new Error("Missing X-Hub-Signature-256 header");
  }

  const verifyToken = env.META_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    throw new Error("META_WEBHOOK_VERIFY_TOKEN not configured");
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", env.FACEBOOK_CLIENT_SECRET)
      .update(buf)
      .digest("hex");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    throw new Error("Invalid webhook signature");
  }
}

/**
 * Handle webhook verification challenge (GET request)
 */
export function handleVerification(req: Request, res: Response): void {
  const mode = req.query["hub.mode"] as string;
  const token = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  const verifyToken = env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    // eslint-disable-next-line no-console
    console.log("[meta-webhook] Verification successful");
    res.status(200).send(challenge);
  } else {
    console.error("[meta-webhook] Verification failed");
    res.sendStatus(403);
  }
}

/**
 * Process incoming webhook events (POST request)
 */
export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  // Always respond 200 quickly to avoid retries
  res.sendStatus(200);

  const body = req.body;

  // Process asynchronously
  setImmediate(async () => {
    try {
      // Handle page events (Messenger and Leadgen)
      if (body.object === "page") {
        for (const entry of body.entry || []) {
          const pageId = entry.id as string;

          // Process messenger messages
          if (entry.messaging) {
            for (const event of entry.messaging) {
              await processMessengerEvent(pageId, event);
            }
          }

          // Process lead generation events
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === "leadgen") {
                await processLeadgenEvent(pageId, change.value);
              }
            }
          }
        }
      }

      // Handle Instagram events
      if (body.object === "instagram") {
        for (const entry of body.entry || []) {
          const igAccountId = entry.id as string;

          if (entry.messaging) {
            for (const event of entry.messaging) {
              await processInstagramEvent(igAccountId, event);
            }
          }
        }
      }
    } catch (error) {
      console.error("[meta-webhook] Error processing webhook:", error);
    }
  });
}

/**
 * Process a Messenger message event
 */
async function processMessengerEvent(
  pageId: string,
  event: {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: Array<{ type: string; payload?: { url?: string } }>;
    };
    postback?: { title: string; payload: string };
  }
): Promise<void> {
  // Skip if this is a message from the page itself
  if (event.sender.id === event.recipient.id) return;

  // Skip echo messages (messages sent by the page)
  const isFromPage = event.recipient.id === pageId;
  if (isFromPage) return;

  // Find the page in our database
  const page = await db.query.metaPageTable.findFirst({
    where: eq(metaPageTable.pageId, pageId),
  });

  if (!page) {
    console.error(`[meta-webhook] Page not found: ${pageId}`);
    return;
  }

  // Skip if Messenger is not enabled
  if (!page.messengerEnabled) return;

  const senderId = event.sender.id;
  const messageText = event.message?.text || event.postback?.title;
  const timestamp = new Date(event.timestamp).toISOString();

  // Get or create conversation
  const conversationId = await getOrCreateConversation(
    page.id,
    page.organizationId,
    "messenger",
    senderId, // Using sender ID as thread ID for Messenger
    senderId
  );

  // Update conversation with the message
  await updateConversationWithMessage(conversationId, {
    text: messageText,
    isFromPage: false,
    timestamp,
  });

  // Process through bot service
  if (messageText) {
    try {
      // Get participant name if available
      const conversation = await db.query.metaConversationTable.findFirst({
        where: eq(metaConversationTable.id, conversationId),
      });

      const botResult = await processIncomingMessage({
        conversationId,
        pageId: page.id,
        organizationId: page.organizationId,
        message: messageText,
        platform: "messenger",
        participantName: conversation?.participantName || undefined,
      });

      if (botResult.handled && botResult.response) {
        await sendConversationMessage(
          conversationId,
          page.organizationId,
          botResult.response
        );
      }
    } catch (error) {
      console.error("[meta-webhook] Bot processing failed:", error);
    }
  }
}

/**
 * Process an Instagram DM event
 */
async function processInstagramEvent(
  igAccountId: string,
  event: {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message: {
      mid: string;
      text?: string;
      attachments?: Array<{ type: string; payload?: unknown }>;
    };
  }
): Promise<void> {
  // Find the page with this Instagram account
  const page = await db.query.metaPageTable.findFirst({
    where: eq(metaPageTable.instagramAccountId, igAccountId),
  });

  if (!page) {
    console.error(`[meta-webhook] Instagram account not found: ${igAccountId}`);
    return;
  }

  // Skip if Instagram DM is not enabled
  if (!page.instagramDmEnabled) return;

  const senderId = event.sender.id;
  const messageText = event.message.text;
  const timestamp = new Date(event.timestamp).toISOString();

  // Skip if from page
  if (senderId === igAccountId) return;

  // Get or create conversation
  const conversationId = await getOrCreateConversation(
    page.id,
    page.organizationId,
    "instagram",
    senderId,
    senderId
  );

  // Update conversation with the message
  await updateConversationWithMessage(conversationId, {
    text: messageText,
    isFromPage: false,
    timestamp,
  });

  // Process through bot service
  if (messageText) {
    try {
      // Get participant name if available
      const conversation = await db.query.metaConversationTable.findFirst({
        where: eq(metaConversationTable.id, conversationId),
      });

      const botResult = await processIncomingMessage({
        conversationId,
        pageId: page.id,
        organizationId: page.organizationId,
        message: messageText,
        platform: "instagram",
        participantName: conversation?.participantName || undefined,
      });

      if (botResult.handled && botResult.response) {
        await sendConversationMessage(
          conversationId,
          page.organizationId,
          botResult.response
        );
      }
    } catch (error) {
      console.error("[meta-webhook] Bot processing failed:", error);
    }
  }
}

/**
 * Process a lead generation event
 */
async function processLeadgenEvent(
  pageId: string,
  value: {
    leadgen_id: string;
    page_id: string;
    form_id: string;
    ad_id?: string;
    adgroup_id?: string;
    created_time: number;
  }
): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`[meta-webhook] Processing lead: ${value.leadgen_id}`);

  const lead = await processLeadWebhook(
    value.page_id,
    value.leadgen_id,
    value.form_id,
    value.created_time
  );

  if (lead) {
    // Find the page for notification
    const page = await db.query.metaPageTable.findFirst({
      where: eq(metaPageTable.pageId, pageId),
    });

    if (page) {
      // Send notifications
      await notifyNewLead({
        organizationId: page.organizationId,
        leadId: lead.id!,
        pageId: page.id,
        pageName: page.pageName,
        leadName: lead.fullName || undefined,
        leadEmail: lead.email || undefined,
        formName: lead.formName || undefined,
      });
    }
  }
}
