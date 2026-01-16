/**
 * Meta AI Response Generation
 *
 * Generates AI-powered responses for Messenger and Instagram conversations
 * using business context from organization profiles.
 */

import { coreGenerateText } from "@monsoft/ai/core";
import {
  db,
  eq,
  organizationProfileTable,
  metaConversationTable,
} from "@repo/db";
import type { MetaConversationConfigRow } from "@repo/db";
import { Logger } from "@repo/logger";

const logger = new Logger({ context: "meta-ai" });

/**
 * Build AI context from organization profile and scraped data
 */
async function buildBusinessContext(
  organizationId: string,
  config: MetaConversationConfigRow
): Promise<string> {
  const contextParts: string[] = [];

  if (!config.useOrganizationContext && !config.useWebsiteContext) {
    return "";
  }

  const profile = await db.query.organizationProfileTable.findFirst({
    where: eq(organizationProfileTable.organizationId, organizationId),
  });

  if (!profile?.scrapedData) {
    return "";
  }

  const data = profile.scrapedData as {
    businessName?: string;
    description?: string;
    services?: string[];
    products?: string[];
    contactEmail?: string;
    contactPhone?: string;
    location?: string;
    valuePropositions?: string[];
    faq?: Array<{ question: string; answer: string }>;
  };

  if (data.businessName) {
    contextParts.push(`Business Name: ${data.businessName}`);
  }
  if (data.description) {
    contextParts.push(`About: ${data.description}`);
  }
  if (data.services?.length) {
    contextParts.push(`Services: ${data.services.join(", ")}`);
  }
  if (data.products?.length) {
    contextParts.push(`Products: ${data.products.join(", ")}`);
  }
  if (data.contactEmail) {
    contextParts.push(`Contact Email: ${data.contactEmail}`);
  }
  if (data.contactPhone) {
    contextParts.push(`Contact Phone: ${data.contactPhone}`);
  }
  if (data.location) {
    contextParts.push(`Location: ${data.location}`);
  }
  if (data.valuePropositions?.length) {
    contextParts.push(`Key Benefits: ${data.valuePropositions.join("; ")}`);
  }

  return contextParts.join("\n");
}

/**
 * Get conversation history for context
 */
async function getConversationHistory(conversationId: string): Promise<string> {
  const conversation = await db.query.metaConversationTable.findFirst({
    where: eq(metaConversationTable.id, conversationId),
  });

  if (!conversation?.recentMessages?.length) {
    return "";
  }

  return conversation.recentMessages
    .slice(-8) // Last 8 messages for context
    .map(
      (m) =>
        `${m.isFromPage ? "Assistant" : "Customer"}: ${m.text || "[attachment]"}`
    )
    .join("\n");
}

/**
 * Get tone instructions based on personality config
 */
function getToneInstructions(
  personality?: MetaConversationConfigRow["aiPersonality"]
): string {
  const toneMap: Record<string, string> = {
    professional: "Respond in a professional, business-appropriate manner.",
    friendly: "Respond in a warm, friendly, and approachable way.",
    casual: "Respond in a relaxed, conversational tone.",
    formal: "Respond in a formal, respectful manner.",
  };

  const tone = personality?.tone || "professional";
  let instructions: string =
    toneMap[tone] ??
    toneMap.professional ??
    "Respond in a professional manner.";

  const responseLength = personality?.responseLength || "auto";
  if (responseLength === "concise") {
    instructions += " Keep responses brief and to the point (1-2 sentences).";
  } else if (responseLength === "detailed") {
    instructions += " Provide thorough, helpful responses.";
  } else {
    instructions += " Match response length to the question complexity.";
  }

  if (personality?.useEmojis === false) {
    instructions += " Do not use emojis.";
  } else if (personality?.useEmojis === true) {
    instructions += " Use emojis sparingly to be friendly.";
  }

  if (personality?.customInstructions) {
    instructions += ` ${personality.customInstructions}`;
  }

  return instructions;
}

/**
 * Check if current time is within business hours
 */
function isWithinBusinessHours(
  businessHours?: MetaConversationConfigRow["businessHours"]
): boolean {
  if (!businessHours?.enabled) {
    return true; // No business hours configured, always available
  }

  const now = new Date();
  const timezone = businessHours.timezone || "UTC";

  // Get current time in business timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(
    parts.find((p) => p.type === "hour")?.value || "0",
    10
  );
  const currentMinute = parseInt(
    parts.find((p) => p.type === "minute")?.value || "0",
    10
  );
  const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
  const currentDay = now.getDay(); // 0 = Sunday

  // Find schedule for current day
  const todaySchedule = businessHours.schedule?.find(
    (s: { day: number; startTime: string; endTime: string }) =>
      s.day === currentDay
  );

  if (!todaySchedule) {
    return false; // No schedule for today
  }

  return (
    currentTime >= todaySchedule.startTime &&
    currentTime <= todaySchedule.endTime
  );
}

/**
 * Check if message should trigger human handoff
 */
export async function shouldTriggerHandoff(
  message: string,
  handoffKeywords: string[]
): Promise<boolean> {
  if (!handoffKeywords.length) {
    return false;
  }

  const lowerMessage = message.toLowerCase();
  return handoffKeywords.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );
}

/**
 * Check custom response rules for a match
 */
function checkResponseRules(
  message: string,
  rules?: MetaConversationConfigRow["responseRules"]
): string | null {
  if (!rules?.length) return null;

  const lowerMessage = message.toLowerCase();

  // Sort by priority (higher first)
  const sortedRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    const triggered = rule.triggers.some((trigger: string) =>
      lowerMessage.includes(trigger.toLowerCase())
    );

    if (triggered) {
      return rule.response;
    }
  }

  return null;
}

/**
 * Generate AI response for an incoming message
 */
export async function generateAiResponse(
  organizationId: string,
  config: MetaConversationConfigRow,
  newMessage: string,
  platform: "messenger" | "instagram",
  conversationId?: string
): Promise<string | null> {
  // Check business hours
  if (!isWithinBusinessHours(config.businessHours)) {
    return config.awayMessage || null;
  }

  // Check custom response rules first
  const ruleResponse = checkResponseRules(newMessage, config.responseRules);
  if (ruleResponse) {
    return ruleResponse;
  }

  // Build context
  const businessContext = await buildBusinessContext(organizationId, config);
  const conversationHistory = conversationId
    ? await getConversationHistory(conversationId)
    : "";
  const toneInstructions = getToneInstructions(config.aiPersonality);

  const systemPrompt = `You are a helpful customer service assistant for a business.

BUSINESS CONTEXT:
${businessContext || "No specific business information available."}

${config.additionalContext ? `ADDITIONAL CONTEXT:\n${config.additionalContext}\n` : ""}

INSTRUCTIONS:
- ${toneInstructions}
- Answer questions based on the business context provided
- If you don't know something specific, politely say you'll have a team member follow up
- Never make up information about products, services, pricing, or policies
- Be helpful and try to address the customer's needs
- This conversation is on ${platform === "messenger" ? "Facebook Messenger" : "Instagram Direct Messages"}
- Keep responses appropriate for chat messaging (not too long)
- If the customer wants to speak with a human, tell them you'll connect them with the team

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n` : ""}`;

  try {
    const result = await coreGenerateText({
      system: systemPrompt,
      prompt: `Customer message: "${newMessage}"\n\nRespond to this message:`,
      temperature: parseFloat(config.aiTemperature),
    });

    return result.text.trim();
  } catch (error) {
    logger.error("Failed to generate response", error);
    return null;
  }
}

/**
 * Test AI response generation (for preview in settings)
 */
export async function testAiResponse(
  organizationId: string,
  config: Partial<MetaConversationConfigRow>,
  testMessage: string
): Promise<string> {
  const fullConfig: MetaConversationConfigRow = {
    id: "test",
    metaPageId: "test",
    organizationId,
    aiEnabled: true,
    aiPersonality: config.aiPersonality || null,
    aiTemperature: config.aiTemperature ?? "0.70",
    welcomeMessage: config.welcomeMessage || null,
    awayMessage: config.awayMessage || null,
    businessHours: config.businessHours || null,
    responseRules: config.responseRules || null,
    handoffKeywords: config.handoffKeywords || null,
    handoffNotificationEmail: config.handoffNotificationEmail || null,
    useOrganizationContext: config.useOrganizationContext ?? true,
    useWebsiteContext: config.useWebsiteContext ?? true,
    additionalContext: config.additionalContext || null,
    salesAssistantEnabled: config.salesAssistantEnabled ?? false,
    customerSupportEnabled: config.customerSupportEnabled ?? true,
    appointmentSchedulingEnabled: config.appointmentSchedulingEnabled ?? false,
    flowsEnabled: config.flowsEnabled ?? false,
    fallbackToAi: config.fallbackToAi ?? true,
    salesConfig: config.salesConfig || null,
    supportConfig: config.supportConfig || null,
    autoTranslateEnabled: config.autoTranslateEnabled ?? false,
    supportedLanguages: config.supportedLanguages ?? ["en"],
    defaultLanguage: config.defaultLanguage ?? "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const response = await generateAiResponse(
    organizationId,
    fullConfig,
    testMessage,
    "messenger"
  );

  return response || "Unable to generate response";
}
