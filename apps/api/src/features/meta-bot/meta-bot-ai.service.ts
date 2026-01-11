/**
 * Meta Bot AI Service
 *
 * Enhanced AI response generation with intent detection, sentiment analysis,
 * and specialized modes for sales, support, and appointment scheduling.
 */

import { coreGenerateText, coreGenerateObject } from "@monsoft/ai/core";
import {
  db,
  eq,
  organizationProfileTable,
  metaConversationTable,
  metaAppointmentConfigTable,
} from "@repo/db";
import type {
  MetaConversationConfigRow,
  MetaConversationStateRow,
  MetaConversationContext,
  MetaSalesContext,
  MetaAppointmentContext,
} from "@repo/db";
import { z } from "zod";

// =============================================================================
// Intent Detection
// =============================================================================

/**
 * Detected intent from user message
 */
export type DetectedIntent = {
  category: "sales" | "support" | "appointment" | "general" | "handoff";
  confidence: number;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "normal" | "high";
  entities?: {
    product?: string;
    service?: string;
    date?: string;
    time?: string;
  };
};

const intentSchema = z.object({
  category: z.enum(["sales", "support", "appointment", "general", "handoff"]),
  confidence: z.number().min(0).max(1),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  urgency: z.enum(["low", "normal", "high"]),
  entities: z
    .object({
      product: z.string().optional(),
      service: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
    })
    .optional(),
});

/**
 * Classifies a user's message into intent, sentiment, urgency, and extracts related entities.
 *
 * @param businessContext - Business-specific context to inform classification and entity extraction
 * @returns A DetectedIntent object with `category` ('sales' | 'support' | 'appointment' | 'general' | 'handoff'), `confidence` (0–1), `sentiment` ('positive' | 'neutral' | 'negative'), `urgency` ('low' | 'normal' | 'high'), and optional `entities` (e.g., `product`, `service`, `date`, `time`)
 */
export async function detectIntent(
  message: string,
  businessContext: string
): Promise<DetectedIntent> {
  try {
    const result = await coreGenerateObject({
      schema: intentSchema,
      system: `You are an intent classifier for a business chatbot. Analyze the user's message and classify it.

BUSINESS CONTEXT:
${businessContext}

Categories:
- sales: Product inquiries, pricing questions, purchase intent, comparison requests, interest in services
- support: Problems, issues, complaints, how-to questions, troubleshooting, existing customer queries
- appointment: Scheduling, booking, availability, rescheduling, cancellation, meeting requests
- general: Greetings, general information, about the business, casual conversation
- handoff: Explicit requests to speak with a human, agent, manager, or real person

Sentiment:
- positive: Happy, satisfied, interested, excited
- neutral: Informational, factual, no strong emotion
- negative: Frustrated, angry, disappointed, confused

Urgency:
- low: General inquiry, no time pressure
- normal: Standard request
- high: Time-sensitive, urgent issue, problem affecting business

Extract entities like products, services, dates, and times mentioned.`,
      prompt: `User message: "${message}"`,
      temperature: 0.3,
    });

    return result.object;
  } catch (error) {
    console.error("[meta-bot-ai] Intent detection failed:", error);
    // Default to general intent on error
    return {
      category: "general",
      confidence: 0.5,
      sentiment: "neutral",
      urgency: "normal",
    };
  }
}

// =============================================================================
// Context Building
// =============================================================================

/**
 * Assembles a textual business context from an organization's scraped profile data.
 *
 * @param organizationId - The ID of the organization whose profile will be fetched
 * @returns A multiline context string containing available fields (business name, industry, description, services, products, key benefits, target audience, contact details, and location). Returns `"No specific business information available."` when no scraped profile data exists.
 */
export async function buildBusinessContext(
  organizationId: string
): Promise<string> {
  const profile = await db.query.organizationProfileTable.findFirst({
    where: eq(organizationProfileTable.organizationId, organizationId),
  });

  if (!profile?.scrapedData) {
    return "No specific business information available.";
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
    industry?: string;
    targetAudience?: string;
  };

  const contextParts: string[] = [];

  if (data.businessName) {
    contextParts.push(`Business Name: ${data.businessName}`);
  }
  if (data.industry) {
    contextParts.push(`Industry: ${data.industry}`);
  }
  if (data.description) {
    contextParts.push(`About: ${data.description}`);
  }
  if (data.services?.length) {
    contextParts.push(`Services Offered: ${data.services.join(", ")}`);
  }
  if (data.products?.length) {
    contextParts.push(`Products: ${data.products.join(", ")}`);
  }
  if (data.valuePropositions?.length) {
    contextParts.push(`Key Benefits: ${data.valuePropositions.join("; ")}`);
  }
  if (data.targetAudience) {
    contextParts.push(`Target Audience: ${data.targetAudience}`);
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

  return (
    contextParts.join("\n") || "No specific business information available."
  );
}

/**
 * Retrieve up to the last eight messages from a conversation formatted for AI context.
 *
 * Returns the most recent up to eight entries in chronological order (oldest to newest). Each entry maps the stored message to a `role` of `"assistant"` for messages from the page or `"user"` otherwise, and a `content` string (message text or `"[attachment]"` when text is absent).
 *
 * @param conversationId - The meta conversation record ID to fetch history for
 * @returns An array of message objects with `role` and `content`, containing at most eight items
 */
export async function getConversationHistory(
  conversationId: string
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const conversation = await db.query.metaConversationTable.findFirst({
    where: eq(metaConversationTable.id, conversationId),
  });

  if (!conversation?.recentMessages?.length) {
    return [];
  }

  return conversation.recentMessages.slice(-8).map((m) => ({
    role: (m.isFromPage ? "assistant" : "user") as "user" | "assistant",
    content: m.text || "[attachment]",
  }));
}

/**
 * Format the appointment services configured for a meta page into a human-readable list.
 *
 * @param pageId - Meta page identifier used to look up the appointment configuration
 * @returns A multiline string where each line describes a service as
 * "- {name} ({duration} minutes)" with optional ": {description}" and " - ${price}",
 * or the string "No services configured for booking." when no services are found.
 */
async function getAppointmentServices(pageId: string): Promise<string> {
  const config = await db.query.metaAppointmentConfigTable.findFirst({
    where: eq(metaAppointmentConfigTable.metaPageId, pageId),
  });

  if (!config?.services?.length) {
    return "No services configured for booking.";
  }

  return config.services
    .map((s) => {
      let line = `- ${s.name} (${s.duration} minutes)`;
      if (s.description) line += `: ${s.description}`;
      if (s.price) line += ` - $${s.price}`;
      return line;
    })
    .join("\n");
}

// =============================================================================
// Prompt Building
// =============================================================================

/**
 * Builds a natural-language instruction describing the assistant's tone and response formatting based on AI personality settings.
 *
 * @param personality - Optional AI personality config; reads `tone` (professional|friendly|casual|formal), `responseLength` ("concise"|"detailed"|"auto"), `useEmojis` (boolean), and `customInstructions` (string) to compose the instruction.
 * @returns A single string with directives for tone, preferred response length, emoji usage, and any custom instructions.
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
  let instructions = toneMap[tone] ?? "Respond in a professional manner.";

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
 * Compose a system prompt that instructs an AI to act as a sales assistant using the provided business and conversational context.
 *
 * @param businessContext - Text describing the business (offerings, value props, contact details, FAQs, etc.) to include in the ABOUT THE BUSINESS section
 * @param toneInstructions - Guidance on tone, length, emoji use, and other persona-related preferences to apply to responses
 * @param salesContext - Optional sales-specific conversation state (e.g., qualificationStage, interestedProducts, painPoints) to populate the CONVERSATION STATE section
 * @param additionalContext - Optional extra context or notes to include in an ADDITIONAL CONTEXT section
 * @returns The complete system prompt string for a sales assistant, ready to be sent as the system message to an LLM
 */
function buildSalesPrompt(
  businessContext: string,
  toneInstructions: string,
  salesContext?: MetaSalesContext,
  additionalContext?: string
): string {
  const stageInfo = salesContext?.qualificationStage
    ? `Current Stage: ${salesContext.qualificationStage}`
    : "Current Stage: awareness (new conversation)";

  const interestsInfo = salesContext?.interestedProducts?.length
    ? `Customer Interests: ${salesContext.interestedProducts.join(", ")}`
    : "";

  const painPointsInfo = salesContext?.painPoints?.length
    ? `Known Pain Points: ${salesContext.painPoints.join(", ")}`
    : "";

  return `You are a helpful sales assistant for a business.

ABOUT THE BUSINESS:
${businessContext}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n` : ""}

CONVERSATION STATE:
${stageInfo}
${interestsInfo}
${painPointsInfo}

YOUR GOALS:
1. Understand the customer's needs through natural conversation
2. Highlight relevant products/services from the business offerings
3. Address concerns and questions thoughtfully
4. Guide qualified leads toward next steps (call, demo, purchase)
5. Collect qualification info naturally: timeline, budget, decision process

GUIDELINES:
- ${toneInstructions}
- Be consultative, not pushy
- Focus on value and solving their problems
- If you don't know specific pricing/details, offer to connect them with the team
- Keep responses conversational and appropriate for chat messaging
- Never make up information about products, services, or pricing`;
}

/**
 * Constructs a system prompt for a customer support assistant using business context and tone instructions.
 *
 * @param businessContext - Textual business information to include in the prompt (about the business, offerings, policies, etc.)
 * @param toneInstructions - Guidance on tone, length, and style for responses
 * @param additionalContext - Optional extra context to append to the prompt
 * @returns The full system prompt string to be used as the assistant's system message
 */
function buildSupportPrompt(
  businessContext: string,
  toneInstructions: string,
  additionalContext?: string
): string {
  return `You are a helpful customer support assistant for a business.

ABOUT THE BUSINESS:
${businessContext}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n` : ""}

YOUR GOALS:
1. Understand the customer's issue or question clearly
2. Provide helpful answers based on the business information
3. Guide them through solutions when possible
4. Offer to connect with a human when you can't help

GUIDELINES:
- ${toneInstructions}
- Be empathetic and patient
- Acknowledge their issue before providing solutions
- If unsure about something, say so and offer to escalate
- Keep responses clear and actionable
- Never make up information about products, services, or policies`;
}

/**
 * Constructs a system prompt for an appointment-scheduling assistant that combines business info, available services, tone instructions, and an optional current booking state.
 *
 * @param businessContext - Text describing the business used in the "ABOUT THE BUSINESS" section
 * @param servicesInfo - Formatted list of services used in the "SERVICES OFFERED" section
 * @param toneInstructions - Tone and style guidance inserted into the assistant's guidelines
 * @param appointmentContext - Optional current booking details (service, preferredDate, preferredTime, contactInfo) used to populate "CURRENT BOOKING STATE"
 * @param additionalContext - Optional extra contextual notes included in an "ADDITIONAL CONTEXT" section
 * @returns A complete system prompt string tailored for appointment booking conversations
 */
function buildAppointmentPrompt(
  businessContext: string,
  servicesInfo: string,
  toneInstructions: string,
  appointmentContext?: MetaAppointmentContext,
  additionalContext?: string
): string {
  const bookingState = [];
  if (appointmentContext?.service) {
    bookingState.push(`Selected service: ${appointmentContext.service}`);
  }
  if (appointmentContext?.preferredDate) {
    bookingState.push(`Preferred date: ${appointmentContext.preferredDate}`);
  }
  if (appointmentContext?.preferredTime) {
    bookingState.push(`Preferred time: ${appointmentContext.preferredTime}`);
  }
  if (appointmentContext?.contactInfo?.name) {
    bookingState.push(`Customer name: ${appointmentContext.contactInfo.name}`);
  }

  const bookingStateStr = bookingState.length
    ? `CURRENT BOOKING STATE:\n${bookingState.join("\n")}`
    : "CURRENT BOOKING STATE: None - new booking request";

  return `You are an appointment scheduling assistant for a business.

ABOUT THE BUSINESS:
${businessContext}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n` : ""}

SERVICES OFFERED:
${servicesInfo}

${bookingStateStr}

YOUR GOALS:
1. Help customers book appointments
2. Collect: service type, preferred date/time, contact info (name, phone/email)
3. Confirm all details before finalizing

BOOKING FLOW:
1. Ask what service they need (if not specified)
2. Ask for preferred date and time
3. Collect customer name and contact (phone or email)
4. Confirm all booking details
5. Provide confirmation message

GUIDELINES:
- ${toneInstructions}
- Be efficient but friendly
- Suggest alternatives if you sense they're unsure
- Always confirm all details before finalizing
- If they ask about availability, let them know you'll check once they provide a date`;
}

/**
 * Constructs a system prompt for a general business assistant.
 *
 * @param businessContext - Text describing the business (e.g., description, offerings, policies) used to ground assistant responses
 * @param toneInstructions - Guidance on tone, response length, and style to apply in replies
 * @param additionalContext - Optional extra context (e.g., page-specific details or recent state) to include in the prompt
 * @returns The full system prompt string to be used as the assistant's system message
 */
function buildGeneralPrompt(
  businessContext: string,
  toneInstructions: string,
  additionalContext?: string
): string {
  return `You are a helpful assistant for a business.

ABOUT THE BUSINESS:
${businessContext}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}\n` : ""}

INSTRUCTIONS:
- ${toneInstructions}
- Answer questions based on the business context provided
- If you don't know something specific, politely say you'll have a team member follow up
- Never make up information about products, services, pricing, or policies
- Be helpful and try to address the customer's needs
- Keep responses appropriate for chat messaging (not too long)
- If the customer wants to speak with a human, tell them you'll connect them with the team`;
}

// =============================================================================
// Response Generation
// =============================================================================

export type GenerateResponseOptions = {
  organizationId: string;
  config: MetaConversationConfigRow;
  message: string;
  platform: "messenger" | "instagram";
  conversationId?: string;
  intent: DetectedIntent;
  conversationState?: MetaConversationStateRow;
};

/**
 * Constructs a contextual system prompt from business data, conversation state, intent, and configuration, then generates and returns an AI reply.
 *
 * The prompt selection prioritizes appointment, sales, support, or general flows based on the provided intent and enabled features in `config`. The chosen prompt is augmented with platform context before invoking the text-generation backend. When applicable (e.g., sales flow), the function returns suggested context updates such as `salesContext` and an `intentHistory`.
 *
 * @param options - Generation options including organizationId, conversation config, incoming message, platform, and optional conversationId, intent, and conversationState
 * @returns An object with `response` containing the generated reply text, and optional `updatedContext` with context updates (for example, `salesContext` and `intentHistory`)
 * @throws Rethrows any error produced by the underlying text generation call
 */
export async function generateAiResponse(
  options: GenerateResponseOptions
): Promise<{
  response: string;
  updatedContext?: Partial<MetaConversationContext>;
}> {
  const {
    organizationId,
    config,
    message,
    platform,
    conversationId,
    intent,
    conversationState,
  } = options;

  // Build context
  const businessContext = await buildBusinessContext(organizationId);
  const conversationHistory = conversationId
    ? await getConversationHistory(conversationId)
    : [];
  const toneInstructions = getToneInstructions(config.aiPersonality);

  // Determine which prompt to use based on intent and enabled capabilities
  let systemPrompt: string;
  let updatedContext: Partial<MetaConversationContext> | undefined;

  if (
    intent.category === "appointment" &&
    config.appointmentSchedulingEnabled
  ) {
    const servicesInfo = await getAppointmentServices(config.metaPageId);
    systemPrompt = buildAppointmentPrompt(
      businessContext,
      servicesInfo,
      toneInstructions,
      conversationState?.context?.appointmentContext,
      config.additionalContext || undefined
    );
  } else if (intent.category === "sales" && config.salesAssistantEnabled) {
    systemPrompt = buildSalesPrompt(
      businessContext,
      toneInstructions,
      conversationState?.context?.salesContext,
      config.additionalContext || undefined
    );

    // Track intent in sales context
    updatedContext = {
      salesContext: {
        ...conversationState?.context?.salesContext,
        qualificationStage:
          conversationState?.context?.salesContext?.qualificationStage ||
          "awareness",
      },
      intentHistory: [
        ...(conversationState?.context?.intentHistory || []),
        intent.category,
      ].slice(-10),
    };
  } else if (
    (intent.category === "support" || intent.category === "general") &&
    config.customerSupportEnabled
  ) {
    systemPrompt = buildSupportPrompt(
      businessContext,
      toneInstructions,
      config.additionalContext || undefined
    );
  } else {
    systemPrompt = buildGeneralPrompt(
      businessContext,
      toneInstructions,
      config.additionalContext || undefined
    );
  }

  // Add platform context
  systemPrompt += `\n\nThis conversation is on ${platform === "messenger" ? "Facebook Messenger" : "Instagram Direct Messages"}.`;

  try {
    const result = await coreGenerateText({
      system: systemPrompt,
      messages: [...conversationHistory, { role: "user", content: message }],
      temperature: parseFloat(config.aiTemperature),
    });

    return {
      response: result.text.trim(),
      updatedContext,
    };
  } catch (error) {
    console.error("[meta-bot-ai] Response generation failed:", error);
    throw error;
  }
}

// =============================================================================
// Handoff Detection
// =============================================================================

/**
 * Determine whether a user message should be escalated to a human agent.
 *
 * @param message - The user's message text to evaluate for handoff triggers.
 * @param intent - Detected intent (category, sentiment, urgency) used to decide escalation.
 * @param config - Conversation configuration containing `handoffKeywords` and `supportConfig.escalationSentiment`.
 * @returns `shouldHandoff` is `true` if escalation is required; `reason` is a short code explaining the trigger (`user_request`, `keyword: <kw>`, or `negative_sentiment_urgent`).
 */
export function shouldTriggerHandoff(
  message: string,
  intent: DetectedIntent,
  config: MetaConversationConfigRow
): { shouldHandoff: boolean; reason?: string } {
  // Check explicit handoff intent
  if (intent.category === "handoff") {
    return { shouldHandoff: true, reason: "user_request" };
  }

  // Check handoff keywords
  const handoffKeywords = config.handoffKeywords || [];
  if (handoffKeywords.length > 0) {
    const lowerMessage = message.toLowerCase();
    const triggeredKeyword = handoffKeywords.find((keyword) =>
      lowerMessage.includes(keyword.toLowerCase())
    );
    if (triggeredKeyword) {
      return { shouldHandoff: true, reason: `keyword: ${triggeredKeyword}` };
    }
  }

  // Check negative sentiment with high urgency
  if (
    intent.sentiment === "negative" &&
    intent.urgency === "high" &&
    config.supportConfig?.escalationSentiment
  ) {
    return { shouldHandoff: true, reason: "negative_sentiment_urgent" };
  }

  return { shouldHandoff: false };
}

// =============================================================================
// Response Rules
// =============================================================================

/**
 * Finds the first active response rule whose trigger appears in the message.
 *
 * @param message - Incoming message text to evaluate against rule triggers
 * @param rules - Optional list of configured response rules (each with triggers, response, priority, and isActive)
 * @returns The `response` text of the highest-priority active rule that matches the message, or `null` if no rule matches
 */
export function checkResponseRules(
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

// =============================================================================
// Business Hours
// =============================================================================

/**
 * Determine whether the current time falls within configured business hours.
 *
 * Evaluates the provided business hours configuration to decide if the current local time (in the configured timezone) is inside today's scheduled opening window.
 *
 * @param businessHours - Configuration object with the following relevant fields:
 *   - `enabled`: when `false` or omitted, business hours are ignored and the function returns `true`.
 *   - `timezone`: IANA timezone string used to evaluate the current time; defaults to `"UTC"` when not provided.
 *   - `schedule`: array of daily schedules where each item contains `day` (0 = Sunday through 6 = Saturday), and `startTime` / `endTime` formatted as `"HH:mm"`.
 * @returns `true` if business hours are disabled or the current time (in the configured timezone) is between today's `startTime` and `endTime`, `false` otherwise.
 */
export function isWithinBusinessHours(
  businessHours?: MetaConversationConfigRow["businessHours"]
): boolean {
  if (!businessHours?.enabled) {
    return true;
  }

  const now = new Date();
  const timezone = businessHours.timezone || "UTC";

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
  const currentDay = now.getDay();

  const todaySchedule = businessHours.schedule?.find(
    (s: { day: number; startTime: string; endTime: string }) =>
      s.day === currentDay
  );

  if (!todaySchedule) {
    return false;
  }

  return (
    currentTime >= todaySchedule.startTime &&
    currentTime <= todaySchedule.endTime
  );
}

// =============================================================================
// Test Response (for settings preview)
// =============================================================================

/**
 * Generate a preview AI response using the given configuration and optional forced intent.
 *
 * If `testIntent` is provided, that intent will be used instead of performing intent detection.
 *
 * @param organizationId - Organization identifier used to build business context
 * @param config - Partial conversation configuration to apply for the test (overrides defaults)
 * @param testMessage - The user message to generate a response for
 * @param testIntent - Optional forced intent category to use ("sales" | "support" | "appointment" | "general")
 * @returns The generated response text, or a fallback error message if generation fails
 */
export async function testAiResponse(
  organizationId: string,
  config: Partial<MetaConversationConfigRow>,
  testMessage: string,
  testIntent?: "sales" | "support" | "appointment" | "general"
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

  // Detect or use provided intent
  const businessContext = await buildBusinessContext(organizationId);
  const intent = testIntent
    ? {
        category: testIntent,
        confidence: 1,
        sentiment: "neutral" as const,
        urgency: "normal" as const,
      }
    : await detectIntent(testMessage, businessContext);

  try {
    const result = await generateAiResponse({
      organizationId,
      config: fullConfig,
      message: testMessage,
      platform: "messenger",
      intent,
    });

    return result.response;
  } catch (error) {
    console.error("[meta-bot-ai] Test response failed:", error);
    return "Unable to generate response. Please check your configuration.";
  }
}