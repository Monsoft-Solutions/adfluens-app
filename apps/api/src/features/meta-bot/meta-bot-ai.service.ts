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
 * Detect intent and sentiment from user message
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
 * Build business context from organization profile
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
 * Get conversation history for context
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
 * Get appointment services for context
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
 * Build sales assistant system prompt
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
 * Build support assistant system prompt
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
 * Build appointment scheduling system prompt
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
 * Build general assistant system prompt
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
  memoryContext?: string;
};

/**
 * Generate AI response based on intent and context
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
    memoryContext,
  } = options;

  // Build context
  const businessContext = await buildBusinessContext(organizationId);
  const conversationHistory = conversationId
    ? await getConversationHistory(conversationId)
    : [];
  const toneInstructions = getToneInstructions(config.aiPersonality);

  // Include memory context if available (for returning customers)
  const fullBusinessContext = memoryContext
    ? `${businessContext}${memoryContext}`
    : businessContext;

  // Determine which prompt to use based on intent and enabled capabilities
  let systemPrompt: string;
  let updatedContext: Partial<MetaConversationContext> | undefined;

  if (
    intent.category === "appointment" &&
    config.appointmentSchedulingEnabled
  ) {
    const servicesInfo = await getAppointmentServices(config.metaPageId);
    systemPrompt = buildAppointmentPrompt(
      fullBusinessContext,
      servicesInfo,
      toneInstructions,
      conversationState?.context?.appointmentContext,
      config.additionalContext || undefined
    );
  } else if (intent.category === "sales" && config.salesAssistantEnabled) {
    systemPrompt = buildSalesPrompt(
      fullBusinessContext,
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
      fullBusinessContext,
      toneInstructions,
      config.additionalContext || undefined
    );
  } else {
    systemPrompt = buildGeneralPrompt(
      fullBusinessContext,
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
 * Check if message should trigger human handoff
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
 * Check custom response rules for a match
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
 * Check if current time is within business hours
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
// Language Detection & Translation
// =============================================================================

/**
 * Detected language result
 */
export type DetectedLanguage = {
  code: string;
  name: string;
  confidence: number;
};

const languageSchema = z.object({
  code: z.string().length(2),
  name: z.string(),
  confidence: z.number().min(0).max(1),
});

/**
 * Detect the language of a message
 */
export async function detectLanguage(
  message: string
): Promise<DetectedLanguage> {
  try {
    const result = await coreGenerateObject({
      schema: languageSchema,
      system: `You are a language detection expert. Analyze the message and identify the language.
Return the ISO 639-1 two-letter language code (e.g., "en", "es", "fr", "de", "pt", "zh", "ja", "ko").
Common codes: en=English, es=Spanish, fr=French, de=German, pt=Portuguese, it=Italian,
zh=Chinese, ja=Japanese, ko=Korean, ar=Arabic, ru=Russian, hi=Hindi, nl=Dutch.`,
      prompt: `Detect the language of this message: "${message}"`,
      temperature: 0.1,
    });

    return result.object;
  } catch (error) {
    console.error("[meta-bot-ai] Language detection failed:", error);
    // Default to English on error
    return {
      code: "en",
      name: "English",
      confidence: 0.5,
    };
  }
}

/**
 * Translate a message to the target language
 */
export async function translateMessage(
  text: string,
  targetLanguage: string,
  targetLanguageName?: string
): Promise<string> {
  // Skip translation if already in English or target is English
  if (targetLanguage === "en") {
    return text;
  }

  const langName = targetLanguageName || targetLanguage;

  try {
    const result = await coreGenerateText({
      system: `You are a professional translator. Translate the text to ${langName}.
Rules:
- Preserve the original tone and meaning
- Keep any placeholders/variables like {{name}} or {product} unchanged
- Preserve markdown formatting if present
- Keep emojis unchanged
- Do not add any explanations, just return the translated text`,
      prompt: text,
      temperature: 0.3,
    });

    return result.text.trim();
  } catch (error) {
    console.error("[meta-bot-ai] Translation failed:", error);
    // Return original text on error
    return text;
  }
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(
  languageCode: string,
  supportedLanguages?: string[]
): boolean {
  if (!supportedLanguages || supportedLanguages.length === 0) {
    return true; // If no list specified, support all
  }
  return supportedLanguages.includes(languageCode);
}

// =============================================================================
// Test Response (for settings preview)
// =============================================================================

/**
 * Test AI response generation (for preview in settings)
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
    autoTranslateEnabled: config.autoTranslateEnabled ?? false,
    supportedLanguages: config.supportedLanguages ?? ["en"],
    defaultLanguage: config.defaultLanguage ?? "en",
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
