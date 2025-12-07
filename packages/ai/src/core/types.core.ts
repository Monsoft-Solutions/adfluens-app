/**
 * Core AI Types
 *
 * Shared types for all core AI wrapper functions.
 *
 * @module @repo/ai/core/types
 */
import type { z } from "zod";

/**
 * Base options shared by all core AI functions
 */
export type CoreBaseOptions = {
  /** Model ID to use (e.g., 'gpt-4o', 'gpt-4o-mini') */
  modelId?: string;
  /** Temperature for generation (0-2, lower = more deterministic) */
  temperature?: number;
};

/**
 * Message format for chat-based functions
 */
export type CoreMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Options for generateObject core function
 */
export type CoreGenerateObjectOptions<TSchema extends z.ZodType> =
  CoreBaseOptions & {
    /** Zod schema for structured output */
    schema: TSchema;
    /** System prompt for the AI */
    system?: string;
    /** User prompt for the AI */
    prompt: string;
  };

/**
 * Options for generateText core function with prompt
 */
export type CoreGenerateTextPromptOptions = CoreBaseOptions & {
  /** System prompt for the AI */
  system?: string;
  /** User prompt for the AI */
  prompt: string;
  /** Maximum output tokens */
  maxTokens?: number;
};

/**
 * Options for generateText core function with messages
 */
export type CoreGenerateTextMessagesOptions = CoreBaseOptions & {
  /** System prompt for the AI */
  system?: string;
  /** Messages for chat-based generation */
  messages: CoreMessage[];
  /** Maximum output tokens */
  maxTokens?: number;
};

/**
 * Options for generateText core function (either prompt or messages)
 */
export type CoreGenerateTextOptions =
  | CoreGenerateTextPromptOptions
  | CoreGenerateTextMessagesOptions;

/**
 * Options for streamObject core function
 */
export type CoreStreamObjectOptions<TSchema extends z.ZodType> =
  CoreBaseOptions & {
    /** Zod schema for structured output */
    schema: TSchema;
    /** System prompt for the AI */
    system?: string;
    /** User prompt for the AI */
    prompt: string;
  };

/**
 * Options for streamText core function
 */
export type CoreStreamTextOptions = CoreBaseOptions & {
  /** System prompt for the AI */
  system?: string;
  /** Messages for chat-based streaming */
  messages: CoreMessage[];
  /** Maximum output tokens */
  maxTokens?: number;
  /** Enable smooth streaming (word-by-word or line-by-line) */
  smoothStreaming?:
    | boolean
    | {
        /** Delay between chunks in milliseconds */
        delayInMs?: number;
        /** Chunking strategy */
        chunking?: "word" | "line";
      };
  /** Callback when streaming finishes */
  onFinish?: (result: { text: string }) => void | Promise<void>;
};
