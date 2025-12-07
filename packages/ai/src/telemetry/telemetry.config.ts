/**
 * Telemetry Configuration
 *
 * Centralized configuration for AI SDK telemetry.
 * Uses Langfuse for observability and tracing.
 *
 * @module @repo/ai/telemetry
 */

/**
 * Telemetry configuration for AI SDK experimental_telemetry
 *
 * When LANGFUSE_ENABLED is 'true', telemetry will be sent to Langfuse.
 * The OpenTelemetry instrumentation in the Next.js apps will process these spans.
 *
 * @example
 * ```typescript
 * import { telemetryConfig } from '@repo/ai/telemetry'
 *
 * const result = await generateText({
 *   model: openai('gpt-4o'),
 *   prompt: 'Hello',
 *   experimental_telemetry: telemetryConfig,
 * })
 * ```
 */
export const telemetryConfig = {
  /** Enable telemetry when LANGFUSE_ENABLED env var is 'true' */
  isEnabled: true,
};
