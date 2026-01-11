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
 * Validate the incoming request's X-Hub-Signature-256 header using the configured Facebook app secret.
 *
 * Throws if the required header is missing, the verification token is not configured, or the computed HMAC does not match the header.
 *
 * @param req - The Express request containing the `X-Hub-Signature-256` header to validate
 * @param buf - Raw request body buffer used to compute the HMAC-SHA256 signature
 * @throws Error when `X-Hub-Signature-256` header is missing
 * @throws Error when `META_WEBHOOK_VERIFY_TOKEN` is not configured
 * @throws Error when the provided signature does not match the expected signature
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
 * Validate a Meta webhook verification request and respond with the provided challenge when the `hub.verify_token` matches the configured `META_WEBHOOK_VERIFY_TOKEN`.
 *
 * Reads `hub.mode`, `hub.verify_token`, and `hub.challenge` from the query string; responds with HTTP 200 and the challenge on successful verification, or HTTP 403 on failure.
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
 * Acknowledge Meta webhook POSTs and dispatch their events for asynchronous processing.
 *
 * Sends an immediate 200 response to avoid retries, then processes the request body off the
 * request-response path: for `object === "page"` it handles Messenger `messaging` events and
 * `leadgen` changes; for `object === "instagram"` it handles Instagram messaging events.
 * Processing errors are caught and logged and do not change the HTTP response.
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
 * Handle an incoming Messenger webhook event by recording the message, invoking bot processing, and sending any bot reply.
 *
 * @param pageId - The Meta Page ID that received the event
 * @param event - The Messenger event payload containing `sender`, `recipient`, `timestamp`, and an optional `message` or `postback`
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
 * Handle a single Instagram Direct Message event by recording it in the conversation
 * and routing the message to the bot processor, sending any bot response.
 *
 * @param igAccountId - Instagram account ID associated with the receiving page
 * @param event - Event payload containing `sender` and `recipient` IDs, `timestamp`, and `message` (text and optional attachments)
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
 * Handle a Meta lead generation webhook event and notify the associated organization when a lead is created.
 *
 * @param pageId - The Meta page ID that received the lead event
 * @param value - The lead event payload, containing:
 *   - `leadgen_id`: The unique lead identifier
 *   - `page_id`: The Meta page ID (may duplicate `pageId`)
 *   - `form_id`: The form identifier used to collect the lead
 *   - `ad_id` (optional): The associated ad identifier
 *   - `adgroup_id` (optional): The associated ad group identifier
 *   - `created_time`: UNIX timestamp (in seconds or milliseconds) when the lead was created
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