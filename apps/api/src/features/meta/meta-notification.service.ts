/**
 * Meta Notification Service
 *
 * Handles in-app and email notifications for Meta events (leads, handoffs).
 */

import { db, eq, and, notificationTable, metaLeadTable } from "@repo/db";
import { env } from "@repo/env";
import { Logger } from "@repo/logger";

const logger = new Logger({ context: "meta-notification" });

/**
 * Create an in-app notification
 */
async function createNotification(input: {
  organizationId: string;
  userId?: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  actionUrl?: string;
}): Promise<void> {
  await db.insert(notificationTable).values({
    organizationId: input.organizationId,
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    payload: input.payload as never,
    actionUrl: input.actionUrl,
  });
}

/**
 * Send email notification (placeholder - implement with your email provider)
 */
async function _sendEmailNotification(
  to: string,
  subject: string,
  _htmlBody: string
): Promise<void> {
  // TODO: Implement with Resend, SendGrid, or other email service
  // Example with Resend:
  // import { Resend } from 'resend';
  // const resend = new Resend(env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'notifications@yourdomain.com',
  //   to,
  //   subject,
  //   html: htmlBody,
  // });

  logger.debug(`Email would be sent to ${to}: ${subject}`);
}

/**
 * Notify about a new lead from Meta Ads
 */
export async function notifyNewLead(input: {
  organizationId: string;
  leadId: string;
  pageId: string;
  pageName: string;
  leadName?: string;
  leadEmail?: string;
  formName?: string;
}): Promise<void> {
  // Create in-app notification
  await createNotification({
    organizationId: input.organizationId,
    type: "meta_lead",
    title: "New Lead from Meta Ads",
    body: `New lead${input.leadName ? ` from ${input.leadName}` : ""} via ${input.pageName}`,
    payload: {
      type: "meta_lead",
      leadId: input.leadId,
      pageId: input.pageId,
      pageName: input.pageName,
      leadName: input.leadName,
      leadEmail: input.leadEmail,
      formName: input.formName,
    },
    actionUrl: `/meta/leads/${input.leadId}`,
  });

  // Mark lead as notified
  await db
    .update(metaLeadTable)
    .set({ notificationsSent: true })
    .where(eq(metaLeadTable.id, input.leadId));

  // Send email notification
  // In a real implementation, you would fetch organization members and send to each
  const emailSubject = `New Lead: ${input.leadName || "Unknown"} via ${input.pageName}`;
  const emailBody = buildLeadEmailHtml(input);

  // For now, just log - implement actual email sending with your provider
  logger.debug(`Would send email: ${emailSubject}`);
  logger.debug(`Email body: ${emailBody.substring(0, 200)}...`);
}

/**
 * Notify about a conversation handoff request
 */
export async function notifyHandoffRequest(input: {
  organizationId: string;
  conversationId: string;
  pageId: string;
  pageName: string;
  platform: "messenger" | "instagram";
  reason: string;
}): Promise<void> {
  const platformName =
    input.platform === "messenger" ? "Messenger" : "Instagram";

  // Create in-app notification
  await createNotification({
    organizationId: input.organizationId,
    type: "meta_handoff",
    title: "Human Support Requested",
    body: `A customer on ${platformName} needs assistance`,
    payload: {
      type: "meta_handoff",
      conversationId: input.conversationId,
      pageId: input.pageId,
      pageName: input.pageName,
      platform: input.platform,
      reason: input.reason,
    },
    actionUrl: `/meta/conversations/${input.conversationId}`,
  });

  // TODO: Send email to handoff notification email if configured
}

/**
 * Build HTML email for new lead notification
 */
function buildLeadEmailHtml(input: {
  leadName?: string;
  leadEmail?: string;
  formName?: string;
  pageName: string;
}): string {
  const appUrl = env.APP_URL;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1877f2; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 12px; }
    .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
    .value { color: #333; font-size: 16px; margin-top: 4px; }
    .button { display: inline-block; background: #1877f2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Lead Received</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${input.leadName || "Not provided"}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value">${input.leadEmail || "Not provided"}</div>
      </div>
      <div class="field">
        <div class="label">Form</div>
        <div class="value">${input.formName || "Unknown"}</div>
      </div>
      <div class="field">
        <div class="label">Page</div>
        <div class="value">${input.pageName}</div>
      </div>
      <a href="${appUrl}/meta/leads" class="button">View in Dashboard</a>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get unread notification count for organization
 */
export async function getUnreadNotificationCount(
  organizationId: string
): Promise<number> {
  const result = await db.query.notificationTable.findMany({
    where: eq(notificationTable.organizationId, organizationId),
    columns: { isRead: true },
  });

  return result.filter((n) => !n.isRead).length;
}

/**
 * Get notifications for organization
 */
export async function getNotifications(
  organizationId: string,
  options?: { limit?: number; unreadOnly?: boolean }
) {
  const notifications = await db.query.notificationTable.findMany({
    where: eq(notificationTable.organizationId, organizationId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: options?.limit || 50,
  });

  if (options?.unreadOnly) {
    return notifications.filter((n) => !n.isRead);
  }

  return notifications;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  organizationId: string
): Promise<void> {
  await db
    .update(notificationTable)
    .set({ isRead: true })
    .where(
      and(
        eq(notificationTable.id, notificationId),
        eq(notificationTable.organizationId, organizationId)
      )
    );
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(
  organizationId: string
): Promise<void> {
  await db
    .update(notificationTable)
    .set({ isRead: true })
    .where(eq(notificationTable.organizationId, organizationId));
}
