/**
 * Meta Bot Memory Service
 *
 * Handles cross-session user memory for personalized interactions.
 * Stores and retrieves user preferences, past purchases, issues, and custom data.
 */

import {
  db,
  eq,
  and,
  desc,
  inArray,
  metaConversationTable,
  metaConversationStateTable,
} from "@repo/db";
import type { MetaUserMemory } from "@repo/db";

// =============================================================================
// Types
// =============================================================================

export type MemoryRecallConfig = {
  recallTypes: (
    | "name"
    | "preferences"
    | "purchases"
    | "issues"
    | "custom"
    | "all"
  )[];
  lookbackDays?: number;
  injectIntoAiContext?: boolean;
  outputVariable?: string;
};

export type MemoryStoreConfig = {
  memoryKey: string;
  value: unknown;
  overwrite?: boolean;
};

export type RecalledMemory = {
  name?: string;
  email?: string;
  phone?: string;
  preferences?: Record<string, string>;
  pastPurchases?: Array<{ product: string; date: string }>;
  pastIssues?: Array<{ issue: string; resolved: boolean; date: string }>;
  customData?: Record<string, unknown>;
  lastInteraction?: string;
};

// =============================================================================
// Memory Service
// =============================================================================

/**
 * Recall user memory from past conversations
 */
export async function recallUserMemory(
  participantId: string,
  metaPageId: string,
  config: MemoryRecallConfig
): Promise<RecalledMemory | null> {
  try {
    // Find all conversations for this participant on this page
    const conversations = await db.query.metaConversationTable.findMany({
      where: and(
        eq(metaConversationTable.participantId, participantId),
        eq(metaConversationTable.metaPageId, metaPageId)
      ),
      orderBy: [desc(metaConversationTable.updatedAt)],
      limit: 10,
    });

    if (conversations.length === 0) {
      return null;
    }

    // Fetch states for these conversations
    const conversationIds = conversations.map((c) => c.id);
    const states = await db.query.metaConversationStateTable.findMany({
      where: and(
        eq(
          metaConversationStateTable.organizationId,
          conversations[0]!.organizationId
        ),
        inArray(metaConversationStateTable.metaConversationId, conversationIds)
      ),
    });

    // Create a map of conversation ID to state
    const stateMap = new Map(states.map((s) => [s.metaConversationId, s]));

    // Aggregate memory from all conversations
    const memory: RecalledMemory = {
      preferences: {},
      customData: {},
    };

    const recallAll = config.recallTypes.includes("all");

    for (const conv of conversations) {
      const state = stateMap.get(conv.id);
      if (!state?.context?.userMemory) continue;

      const userMem = state.context.userMemory;

      // Recall name
      if ((recallAll || config.recallTypes.includes("name")) && userMem.name) {
        memory.name = memory.name || userMem.name;
        memory.email = memory.email || userMem.email;
        memory.phone = memory.phone || userMem.phone;
      }

      // Recall preferences
      if (
        (recallAll || config.recallTypes.includes("preferences")) &&
        userMem.preferences
      ) {
        memory.preferences = { ...memory.preferences, ...userMem.preferences };
      }

      // Recall past purchases
      if (
        (recallAll || config.recallTypes.includes("purchases")) &&
        userMem.pastPurchases
      ) {
        memory.pastPurchases = [
          ...(memory.pastPurchases || []),
          ...userMem.pastPurchases,
        ].slice(0, 10);
      }

      // Recall past issues
      if (
        (recallAll || config.recallTypes.includes("issues")) &&
        userMem.pastIssues
      ) {
        memory.pastIssues = [
          ...(memory.pastIssues || []),
          ...userMem.pastIssues,
        ].slice(0, 10);
      }

      // Recall custom data
      if (
        (recallAll || config.recallTypes.includes("custom")) &&
        userMem.customData
      ) {
        memory.customData = { ...memory.customData, ...userMem.customData };
      }

      // Track last interaction
      if (userMem.lastInteraction) {
        if (
          !memory.lastInteraction ||
          new Date(userMem.lastInteraction) > new Date(memory.lastInteraction)
        ) {
          memory.lastInteraction = userMem.lastInteraction;
        }
      }
    }

    return memory;
  } catch (error) {
    console.error("[meta-bot-memory] Failed to recall memory:", error);
    return null;
  }
}

/**
 * Store a memory value for a user
 */
export async function storeUserMemory(
  currentMemory: MetaUserMemory | undefined,
  config: MemoryStoreConfig
): Promise<MetaUserMemory> {
  const memory: MetaUserMemory = currentMemory || {};

  // Handle special memory keys
  switch (config.memoryKey) {
    case "name":
      if (config.overwrite || !memory.name) {
        memory.name = String(config.value);
      }
      break;
    case "email":
      if (config.overwrite || !memory.email) {
        memory.email = String(config.value);
      }
      break;
    case "phone":
      if (config.overwrite || !memory.phone) {
        memory.phone = String(config.value);
      }
      break;
    case "preference":
      if (typeof config.value === "object" && config.value !== null) {
        const prefValue = config.value as { key: string; value: string };
        memory.preferences = memory.preferences || {};
        memory.preferences[prefValue.key] = prefValue.value;
      }
      break;
    case "purchase":
      if (typeof config.value === "object" && config.value !== null) {
        const purchase = config.value as { product: string; date?: string };
        memory.pastPurchases = memory.pastPurchases || [];
        memory.pastPurchases.push({
          product: purchase.product,
          date: purchase.date || new Date().toISOString(),
        });
      }
      break;
    case "issue":
      if (typeof config.value === "object" && config.value !== null) {
        const issue = config.value as {
          issue: string;
          resolved?: boolean;
          date?: string;
        };
        memory.pastIssues = memory.pastIssues || [];
        memory.pastIssues.push({
          issue: issue.issue,
          resolved: issue.resolved ?? false,
          date: issue.date || new Date().toISOString(),
        });
      }
      break;
    default:
      // Store in custom data
      memory.customData = memory.customData || {};
      if (config.overwrite || !(config.memoryKey in memory.customData)) {
        memory.customData[config.memoryKey] = config.value;
      }
  }

  // Update last interaction
  memory.lastInteraction = new Date().toISOString();

  return memory;
}

/**
 * Build a memory context string for AI prompts
 */
export function buildMemoryPrompt(memory: RecalledMemory | null): string {
  if (!memory) {
    return "";
  }

  const parts: string[] = [];

  if (memory.name) {
    parts.push(`Customer name: ${memory.name}`);
  }

  if (memory.lastInteraction) {
    const lastDate = new Date(memory.lastInteraction);
    const daysAgo = Math.floor(
      (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAgo === 0) {
      parts.push("Last interaction: Today");
    } else if (daysAgo === 1) {
      parts.push("Last interaction: Yesterday");
    } else {
      parts.push(`Last interaction: ${daysAgo} days ago`);
    }
  }

  if (memory.pastPurchases && memory.pastPurchases.length > 0) {
    const recentPurchases = memory.pastPurchases.slice(0, 3);
    const purchaseList = recentPurchases
      .map((p) => `${p.product} (${new Date(p.date).toLocaleDateString()})`)
      .join(", ");
    parts.push(`Previous purchases: ${purchaseList}`);
  }

  if (memory.pastIssues && memory.pastIssues.length > 0) {
    const unresolvedIssues = memory.pastIssues.filter((i) => !i.resolved);
    if (unresolvedIssues.length > 0) {
      parts.push(
        `Unresolved issues: ${unresolvedIssues.map((i) => i.issue).join(", ")}`
      );
    }
  }

  if (memory.preferences && Object.keys(memory.preferences).length > 0) {
    const prefs = Object.entries(memory.preferences)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    parts.push(`Known preferences: ${prefs}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `\n\n## Returning Customer Context\n${parts.join("\n")}`;
}

/**
 * Extract memory from conversation for storage
 * This analyzes the conversation to automatically extract key information
 */
export async function extractMemoryFromConversation(
  message: string,
  existingMemory: MetaUserMemory | undefined
): Promise<MetaUserMemory> {
  const memory: MetaUserMemory = existingMemory || {};

  // Simple extraction patterns
  // In a production system, this could use AI for more sophisticated extraction

  // Extract name (patterns like "my name is X" or "I'm X")
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /i am (\w+)/i,
    /this is (\w+)/i,
    /call me (\w+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match?.[1] && !memory.name) {
      memory.name = match[1];
      break;
    }
  }

  // Extract email
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const emailMatch = message.match(emailPattern);
  if (emailMatch?.[1] && !memory.email) {
    memory.email = emailMatch[1];
  }

  // Extract phone (simple patterns)
  const phonePattern = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/;
  const phoneMatch = message.match(phonePattern);
  if (phoneMatch?.[1] && !memory.phone) {
    memory.phone = phoneMatch[1];
  }

  // Update last interaction
  memory.lastInteraction = new Date().toISOString();

  return memory;
}
