# @repo/ai

Centralized AI package for the YouTube Channel Analyzer application. Consolidates all AI-related operations, models, prompts, and schemas built on top of the [Vercel AI SDK](https://sdk.vercel.ai/).

## Features

- **Core Wrappers**: Centralized configuration for AI SDK functions with telemetry
- **Type-Safe Schemas**: Zod schemas for structured AI outputs
- **Model Management**: Centralized model definitions with capability metadata
- **Telemetry**: Langfuse integration for AI observability

## Installation

This is a workspace package. Add it to your app's `package.json`:

```json
{
  "dependencies": {
    "@repo/ai": "workspace:*"
  }
}
```

Required environment variables:

```bash
OPENAI_API_KEY=sk-...
LANGFUSE_SECRET_KEY=...  # Optional, for telemetry
LANGFUSE_PUBLIC_KEY=...  # Optional, for telemetry
```

## Quick Start

```typescript
// Import core AI functions
import { coreGenerateObject, coreGenerateText, coreStreamText } from "@repo/ai";

// Import model configuration
import { AVAILABLE_MODELS, DEFAULT_CHAT_MODEL_ID } from "@repo/ai/models";
```

## Architecture

```
packages/ai/src/
├── core/                    # AI SDK wrappers with centralized config
│   ├── generate-object.core.ts
│   ├── generate-text.core.ts
│   ├── stream-object.core.ts
│   └── stream-text.core.ts
├── functions/               # High-level AI operations (placeholder)
├── schemas/                 # Zod schemas for structured outputs
├── models/                  # Model definitions and helpers
│   └── available-models.constant.ts
├── prompts/                 # Prompt templates
│   └── chat/
└── telemetry/               # Observability configuration
    └── telemetry.config.ts
```

### Export Paths

The package provides multiple export paths for granular imports:

| Path                 | Description                                      |
| -------------------- | ------------------------------------------------ |
| `@repo/ai`           | Main exports (core functions, models, telemetry) |
| `@repo/ai/core`      | Core wrapper functions only                      |
| `@repo/ai/functions` | High-level AI operation functions                |
| `@repo/ai/schemas`   | Zod schemas and types                            |
| `@repo/ai/models`    | Model definitions and helpers                    |
| `@repo/ai/prompts`   | Prompt templates and formatters                  |
| `@repo/ai/telemetry` | Telemetry configuration                          |

## Core Functions

Core functions wrap the AI SDK with centralized configuration and telemetry.

### coreGenerateObject

Generate structured objects using a Zod schema:

```typescript
import { coreGenerateObject } from "@repo/ai";
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  interests: z.array(z.string()),
});

const result = await coreGenerateObject({
  schema: userSchema,
  system: "You are a helpful assistant that extracts user information",
  prompt:
    "Extract info from: John Doe is 30 years old and loves hiking and photography",
  modelId: "gpt-4o-mini", // Optional, defaults to DEFAULT_CHAT_MODEL_ID
  temperature: 0.3, // Optional, defaults to 0.7
});

console.log(result.object);
// { name: 'John Doe', age: 30, interests: ['hiking', 'photography'] }
```

### coreGenerateText

Generate text responses (supports both prompt and messages):

```typescript
import { coreGenerateText } from "@repo/ai";

// Simple prompt
const result = await coreGenerateText({
  system: "You are a helpful assistant",
  prompt: "Write a haiku about coding",
});

// Chat-based with messages
const chatResult = await coreGenerateText({
  system: "You are a helpful assistant",
  messages: [
    { role: "user", content: "Hello!" },
    { role: "assistant", content: "Hi there!" },
    { role: "user", content: "How are you?" },
  ],
});
```

### coreStreamText

Stream text responses in real-time:

```typescript
import { coreStreamText } from "@repo/ai";

const result = coreStreamText({
  system: "You are a helpful assistant",
  messages: [{ role: "user", content: "Tell me a story" }],
  modelId: "gpt-4.1",
  smoothStreaming: true, // Enable word-by-word streaming
  onFinish: async ({ text }) => {
    await saveToDatabase(text);
  },
});

// Use in API route
return result.toTextStreamResponse();
```

### coreStreamObject

Stream structured objects progressively:

```typescript
import { coreStreamObject } from "@repo/ai";

const { partialObjectStream } = coreStreamObject({
  schema: mySchema,
  system: "Generate a user profile",
  prompt: "Create a detailed profile for a tech enthusiast",
});

for await (const partialObject of partialObjectStream) {
  console.log(partialObject); // Partial object as it's generated
}
```

## Model Configuration

### Available Models

```typescript
import {
  type AIModel,
  AVAILABLE_MODELS,
  DEFAULT_CHAT_MODEL_ID,
  type ModelTier,
  getModelById,
  getModelsByTier,
  getRecommendedModels,
  isValidModelId,
} from "@repo/ai/models";

// Get all recommended models
const recommended = getRecommendedModels();

// Get models by pricing tier
const premiumModels = getModelsByTier("premium");

// Validate model ID
if (isValidModelId(userSelectedModel)) {
  // Use the model
}
```

### Default Models

| Use Case              | Default Model  | Constant                                 |
| --------------------- | -------------- | ---------------------------------------- |
| Chat                  | `gpt-4.1`      | `DEFAULT_CHAT_MODEL_ID`                  |
| Classification        | `gpt-4.1-nano` | `DEFAULT_CLASSIFICATION_MODEL_ID`        |
| Conversation Analysis | `gpt-4.1-mini` | `DEFAULT_CONVERSATION_ANALYSIS_MODEL_ID` |
| Quick Questions       | `gpt-4.1-mini` | `DEFAULT_QUICK_QUESTIONS_MODEL_ID`       |
| Deep Analysis         | `gpt-4.1`      | `DEFAULT_DEEP_DIVE_ANALYSIS_MODEL_ID`    |

## Telemetry

The package integrates with Langfuse for AI observability. Telemetry is automatically included in all core functions via `experimental_telemetry: telemetryConfig`.

```typescript
import { telemetryConfig } from "@repo/ai/telemetry";

// Telemetry is automatically enabled
// Traces are sent to Langfuse when LANGFUSE_ENABLED=true
```

## TypeScript Types

All types are exported and fully typed:

```typescript
import type {
  // Core types
  CoreMessage,
  CoreBaseOptions,
  CoreGenerateObjectOptions,
  CoreStreamTextOptions,
  GenerateObjectResult,
  StreamTextResult,
  // Model types
  AIModel,
  ModelCapability,
  ModelProvider,
  ModelTier,
} from "@repo/ai";
```

## Related Documentation

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Langfuse Documentation](https://langfuse.com/docs)
- [Zod Documentation](https://zod.dev/)
