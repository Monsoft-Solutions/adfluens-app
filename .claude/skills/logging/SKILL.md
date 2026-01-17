---
name: logging
description: Guide structured logging using @repo/logger package with Winston. Use when adding logs, debugging, or understanding log patterns.
allowed-tools: Read, Glob, Grep
---

# Logging Guide

This skill provides guidance for structured logging using the `@repo/logger` package in the YouTube Channel Analyzer project.

## Package Overview

The `@repo/logger` package provides Winston-based structured logging with request correlation and context propagation.

```typescript
import { Logger } from "@repo/logger";

const logger = new Logger({ context: "feature-name" });
```

## Log Levels

| Level   | Use Case                                            |
| ------- | --------------------------------------------------- |
| `error` | Unrecoverable failures, exceptions, critical issues |
| `warn`  | Recoverable issues, rate limits, deprecations       |
| `info`  | Important business events, state changes, startup   |
| `http`  | Request/response logging (used by middleware)       |
| `debug` | Development details, variable values, diagnostics   |

## Basic Usage

### Creating a Logger

Each service file should create a logger with a descriptive context:

```typescript
import { Logger } from "@repo/logger";

const logger = new Logger({ context: "meta-bot" });
```

### Logging Messages

```typescript
// Error with exception
logger.error("Failed to process message", error, { messageId, userId });

// Warning for recoverable issues
logger.warn("Rate limit approaching", { currentRate, limit });

// Info for important business events
logger.info("User completed onboarding", { userId, organizationId });

// Debug for development details
logger.debug("Processing webhook payload", { payload });
```

### Method Signatures

```typescript
logger.error(message: string, errorOrMeta?: unknown, meta?: Record<string, unknown>): void
logger.warn(message: string, errorOrMeta?: unknown, meta?: Record<string, unknown>): void
logger.info(message: string, errorOrMeta?: unknown, meta?: Record<string, unknown>): void
logger.http(message: string, errorOrMeta?: unknown, meta?: Record<string, unknown>): void
logger.debug(message: string, errorOrMeta?: unknown, meta?: Record<string, unknown>): void
```

## Child Loggers

Create child loggers for sub-contexts:

```typescript
const logger = new Logger({ context: "meta-bot" });
const aiLogger = logger.child("ai"); // Context: "meta-bot:ai"
const flowLogger = logger.child("flow"); // Context: "meta-bot:flow"

aiLogger.info("Generating response"); // [meta-bot:ai] Generating response
```

## Request Context

Request context (requestId, userId, organizationId) is automatically included via AsyncLocalStorage:

```typescript
// In middleware - context is set automatically
// In service code - context is included in logs automatically

logger.info("Processing request");
// Output includes: { requestId: "abc-123", userId: "user_1", ... }
```

### Manual Context Updates

```typescript
import { updateContext } from "@repo/logger";

// Add user context after authentication
updateContext({
  userId: user.id,
  organizationId: session.activeOrganizationId,
});
```

## Error Logging Patterns

### With Error Object

```typescript
try {
  await processMessage(message);
} catch (error) {
  logger.error("Failed to process message", error, {
    messageId: message.id,
    conversationId,
  });
  throw error;
}
```

### Without Error Object

```typescript
if (!user) {
  logger.error("User not found", undefined, { userId });
  throw new TRPCError({ code: "NOT_FOUND" });
}
```

### With Cause Chain

Errors with `.cause` are automatically serialized with the full chain.

## Performance Timing

```typescript
import { timeAsync, PerformanceMarker } from "@repo/logger";

// Simple timing
const result = await timeAsync(
  "ai-generation",
  async () => generateResponse(prompt),
  logger
);

// Multi-step timing
const marker = new PerformanceMarker("flow-execution");
marker.mark("start");

await executeNode(node);
marker.mark("node-executed");

await sendMessage(response);
marker.mark("message-sent");

logger.info("Flow completed", { timing: marker.getSummary() });
```

## Output Formats

### Development (Pretty)

```
10:30:45.123 INFO  [meta-bot] Processing message (abc12345) {"conversationId":"conv_1"}
```

### Production (JSON)

```json
{
  "level": "info",
  "message": "Processing message",
  "timestamp": "2024-01-16T10:30:45.123Z",
  "context": "meta-bot",
  "requestId": "abc-123",
  "conversationId": "conv_1"
}
```

## Best Practices

1. **Use appropriate log levels** - Don't log everything as error
2. **Include context** - Always add relevant IDs and metadata
3. **Log important business events** with `info` level
4. **Don't log sensitive data** - Never log passwords, tokens, or PII
5. **Use child loggers** for sub-components within a feature
6. **Keep messages concise** - Context goes in metadata, not message
7. **Log at boundaries** - Log when entering/exiting important operations

## Common Patterns

### Service Method Logging

```typescript
export async function processConversation(conversationId: string) {
  logger.info("Processing conversation", { conversationId });

  try {
    const result = await doWork();
    logger.info("Conversation processed successfully", {
      conversationId,
      resultCount: result.length,
    });
    return result;
  } catch (error) {
    logger.error("Failed to process conversation", error, { conversationId });
    throw error;
  }
}
```

### Webhook Handler Logging

```typescript
export async function handleWebhook(payload: WebhookPayload) {
  logger.info("Received webhook", {
    type: payload.type,
    objectId: payload.object.id,
  });

  // Process...

  logger.info("Webhook processed", { type: payload.type });
}
```

### Background Job Logging

```typescript
export async function processScheduledJob(jobId: string) {
  logger.info("Starting scheduled job", { jobId });

  const processed = 0;
  for (const item of items) {
    // Process item
    processed++;
  }

  logger.info("Scheduled job completed", { jobId, processed });
}
```

## Migration from console.\*

When migrating from `console.*`:

```typescript
// Before
console.error("[meta-bot] Failed to process:", error);

// After
logger.error("Failed to process", error);
// Context "[meta-bot]" comes from logger instance
```
