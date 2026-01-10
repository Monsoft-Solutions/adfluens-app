---
name: ai-integration
description: Guide AI feature development using @monsoft/ai package with Langfuse telemetry. Use when building AI-powered features, text generation, or structured outputs.
allowed-tools: Read, Glob, Grep
---

# AI Integration Guide

This skill provides guidance for AI feature development using the `@monsoft/ai` package in the YouTube Channel Analyzer project.

## Package Overview

The `@monsoft/ai` package wraps Vercel AI SDK with Langfuse telemetry for observability.

```typescript
// Available imports
import {
  coreGenerateObject,
  coreGenerateText,
  coreStreamText,
  coreStreamObject,
} from "@monsoft/ai/core";
import { models } from "@monsoft/ai/models";
import { prompts } from "@monsoft/ai/prompts";
```

## Core Functions

### coreGenerateObject - Structured Outputs

Generate structured data with Zod schema validation:

```typescript
import { coreGenerateObject } from "@monsoft/ai/core";
import { z } from "zod";

const videoAnalysisSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyTopics: z.array(z.string()),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  viralPotential: z.number().min(0).max(100),
  suggestedTags: z.array(z.string()),
});

const result = await coreGenerateObject({
  model: "gpt-4o",
  schema: videoAnalysisSchema,
  prompt: `Analyze this YouTube video transcript and provide insights:

  Title: ${video.title}
  Transcript: ${video.transcript}`,
  telemetry: {
    name: "video-analysis",
    metadata: { videoId: video.id },
  },
});

// result.object is typed as z.infer<typeof videoAnalysisSchema>
const analysis = result.object;
```

### coreGenerateText - Text Generation

Generate plain text responses:

```typescript
import { coreGenerateText } from "@monsoft/ai/core";

const result = await coreGenerateText({
  model: "gpt-4o-mini",
  prompt: `Write a compelling video description for: ${video.title}

  Key points to include:
  - ${keyPoints.join("\n- ")}`,
  telemetry: {
    name: "description-generation",
    metadata: { videoId: video.id },
  },
});

const description = result.text;
```

### coreStreamText - Streaming Text

Stream text for real-time UI updates:

```typescript
import { coreStreamText } from "@monsoft/ai/core";

const stream = await coreStreamText({
  model: "gpt-4o",
  prompt: `Generate a detailed content strategy for this channel: ${channel.name}`,
  telemetry: {
    name: "strategy-generation",
    metadata: { channelId: channel.id },
  },
});

// In tRPC procedure with streaming
for await (const chunk of stream.textStream) {
  // Send chunk to client
  yield chunk;
}
```

### coreStreamObject - Streaming Structured Data

Stream structured data as it's generated:

```typescript
import { coreStreamObject } from "@monsoft/ai/core";

const contentIdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      estimatedViews: z.number(),
    })
  ),
});

const stream = await coreStreamObject({
  model: "gpt-4o",
  schema: contentIdeasSchema,
  prompt: `Generate 10 video ideas for: ${channel.niche}`,
  telemetry: {
    name: "content-ideas",
    metadata: { channelId: channel.id },
  },
});

for await (const partialObject of stream.partialObjectStream) {
  // partialObject contains partially generated data
  console.log(partialObject.ideas?.length ?? 0, "ideas so far");
}

const finalResult = await stream.object;
```

## Model Selection

```typescript
import { models } from "@monsoft/ai/models";

// Available models
const model = models.openai["gpt-4o"]; // Best quality
const model = models.openai["gpt-4o-mini"]; // Fast & cheap
const model = models.google["gemini-1.5-pro"]; // Google's best
const model = models.google["gemini-1.5-flash"]; // Google fast
```

### Model Selection Guidelines

| Use Case         | Recommended Model |
| ---------------- | ----------------- |
| Complex analysis | gpt-4o            |
| Simple tasks     | gpt-4o-mini       |
| Long context     | gemini-1.5-pro    |
| Fast responses   | gemini-1.5-flash  |
| Cost-sensitive   | gpt-4o-mini       |

## Prompt Patterns

### System + User Messages

```typescript
const result = await coreGenerateObject({
  model: "gpt-4o",
  schema: analysisSchema,
  messages: [
    {
      role: "system",
      content: `You are a YouTube analytics expert.
        Analyze videos for viral potential and engagement.`,
    },
    {
      role: "user",
      content: `Analyze this video: ${video.title}

        Metrics:
        - Views: ${video.viewCount}
        - Likes: ${video.likeCount}
        - Comments: ${video.commentCount}`,
    },
  ],
  telemetry: { name: "video-analysis" },
});
```

### Few-Shot Examples

```typescript
const result = await coreGenerateText({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: "Generate catchy YouTube titles based on the topic.",
    },
    { role: "user", content: "Topic: JavaScript tutorials" },
    {
      role: "assistant",
      content: "10 JavaScript Tricks That Will Blow Your Mind",
    },
    { role: "user", content: "Topic: Cooking pasta" },
    {
      role: "assistant",
      content: "The Secret to Restaurant-Quality Pasta at Home",
    },
    { role: "user", content: `Topic: ${topic}` },
  ],
  telemetry: { name: "title-generation" },
});
```

## Telemetry & Observability

All functions include Langfuse integration:

```typescript
telemetry: {
  name: "operation-name",        // Required: identifies the operation
  metadata: {                    // Optional: additional context
    userId: user.id,
    channelId: channel.id,
    feature: "video-analysis",
  },
}
```

View traces in Langfuse dashboard for:

- Request/response logging
- Token usage tracking
- Latency monitoring
- Error tracking
- Cost analysis

## Error Handling

```typescript
import { AISDKError } from "@monsoft/ai";

try {
  const result = await coreGenerateObject({
    model: "gpt-4o",
    schema: analysisSchema,
    prompt: prompt,
    telemetry: { name: "analysis" },
  });
  return result.object;
} catch (error) {
  if (error instanceof AISDKError) {
    // Handle AI-specific errors
    console.error("AI Error:", error.message);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "AI analysis failed",
    });
  }
  throw error;
}
```

## Best Practices

1. **Always use telemetry** for observability
2. **Use structured outputs** (coreGenerateObject) when possible
3. **Stream for long responses** to improve UX
4. **Select appropriate model** based on task complexity
5. **Handle errors gracefully** with fallbacks
6. **Cache results** when appropriate to reduce costs
