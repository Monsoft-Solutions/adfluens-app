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

/**
 * Assemble a textual business context from an organization's scraped profile data.
 *
 * Includes available fields such as business name, description, services, products,
 * contact email/phone, location, and value propositions; each present field becomes
 * a separate line in the resulting text.
 *
 * @param organizationId - The ID of the organization whose profile to read
 * @param config - Conversation config; context is only built when `useOrganizationContext`
 *                 or `useWebsiteContext` is enabled on this config
 * @returns The assembled business context as newline-separated lines, or an empty string
 *          if context usage is disabled or no scraped data is available
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
 * Assemble a compact text snapshot of the most recent messages from a conversation for use as context.
 *
 * @param conversationId - The conversation identifier to retrieve messages for
 * @returns A newline-separated string of up to the last 8 messages, each prefixed with `Assistant:` or `Customer:` and using `[attachment]` when a message has no text; returns an empty string if there are no recent messages
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
 * Compose a single instruction string that conveys tone, preferred response length, emoji usage, and any custom directives for the AI.
 *
 * @param personality - Optional AI personality settings. Recognized fields: `tone` ("professional" | "friendly" | "casual" | "formal"), `responseLength` ("concise" | "detailed" | "auto"), `useEmojis` (boolean), and `customInstructions` (string).
 * @returns A combined instruction string describing tone, length guidance, emoji policy, and appended custom instructions when provided.
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
 * Determine whether the current time (in the configured timezone) falls within the provided business hours schedule.
 *
 * @param businessHours - Business hours configuration with `enabled`, optional `timezone`, and a `schedule` array of entries `{ day, startTime, endTime }` where `day` is 0 = Sunday.
 * @returns `true` if business hours are not enabled or if the current time (adjusted to `timezone` or UTC) is between today's `startTime` and `endTime`; `false` otherwise.
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
 * Determine whether an incoming message contains any handoff keywords signaling a human handoff.
 *
 * @param message - The incoming message text to inspect
 * @param handoffKeywords - Array of keywords that should trigger a handoff when present in `message`
 * @returns `true` if any keyword from `handoffKeywords` appears in `message` (case-insensitive), `false` otherwise
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
 * Finds the highest-priority active response rule whose trigger is contained in the message.
 *
 * Performs a case-insensitive substring match against each rule's triggers; rules are filtered to active ones and evaluated by descending priority.
 *
 * @param message - Incoming customer message to evaluate.
 * @param rules - Optional array of configured response rules to check.
 * @returns The response text from the first matching rule, or `null` if none match.
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
 * Generate an AI-powered customer service reply for an incoming message using organization and conversation context.
 *
 * @param organizationId - Organization ID used to load business profile and scraped data for context
 * @param config - Conversation configuration that controls business hours, AI personality, temperature, response rules, additional context, and away message
 * @param newMessage - The incoming customer message to respond to
 * @param platform - The messaging platform ("messenger" or "instagram") used to tailor the system prompt
 * @param conversationId - Optional conversation ID to include recent conversation history in the prompt
 * @returns The generated response text (trimmed). Returns the configured away message when outside business hours if present, otherwise `null` when no response can be produced or generation fails.
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
    console.error("[meta-ai] Failed to generate response:", error);
    return null;
  }
}

/**
 * Generate a preview AI response using the provided partial configuration.
 *
 * @param organizationId - The organization ID to scope the configuration and context
 * @param config - Partial conversation configuration used to build a complete test configuration (missing fields will be filled with sensible defaults)
 * @param testMessage - The customer message to send to the AI for generating the preview
 * @returns The generated response text, or the fallback string "Unable to generate response" if no response could be produced
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