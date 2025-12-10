# @monsoft/ai

AI utilities for structured outputs, text generation, and content analysis. Built on top of the Vercel AI SDK.

## Features

- **Core AI Functions** - Wrapper functions with centralized configuration and telemetry
  - `coreGenerateObject` - Generate structured JSON output
  - `coreGenerateText` - Generate text responses
  - `coreStreamObject` - Stream structured JSON output
  - `coreStreamText` - Stream text responses
- **Model Management** - Pre-configured AI models with capability metadata
- **Extraction Functions** - High-level functions for common AI tasks
- **Telemetry** - Built-in Langfuse integration for observability
- Full TypeScript support with type-safe schemas
- ESM module format

## Installation

```bash
npm install @monsoft/ai
# or
pnpm add @monsoft/ai
# or
yarn add @monsoft/ai
```

## Usage

### Core AI Functions

```typescript
import {
  coreGenerateObject,
  coreGenerateText,
  coreStreamText,
} from "@monsoft/ai";
import { z } from "zod";

// Generate structured output
const result = await coreGenerateObject({
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  system: "You are a helpful assistant",
  prompt: "Extract the name and age from: John is 25 years old",
});

console.log(result.object); // { name: 'John', age: 25 }

// Generate text
const textResult = await coreGenerateText({
  system: "You are a helpful assistant",
  prompt: "Explain what TypeScript is in one sentence",
});

console.log(textResult.text);

// Stream text (for chat applications)
const stream = coreStreamText({
  system: "You are a helpful assistant",
  messages: [{ role: "user", content: "Hello!" }],
  smoothStreaming: true,
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Subpath Imports

The package provides subpath exports for more granular imports:

```typescript
// Core functions only
import { coreGenerateObject } from "@monsoft/ai/core";

// Functions
import { extractOrganizationProfile } from "@monsoft/ai/functions";

// Models
import { AVAILABLE_MODELS, getModelById } from "@monsoft/ai/models";

// Prompts
import { organizationExtractionPrompt } from "@monsoft/ai/prompts";

// Telemetry
import { telemetryConfig } from "@monsoft/ai/telemetry";
```

### Model Selection

```typescript
import {
  AVAILABLE_MODELS,
  getModelById,
  getModelsByTier,
  getRecommendedModels,
  DEFAULT_CHAT_MODEL_ID,
} from "@monsoft/ai/models";

// Get all available models
console.log(AVAILABLE_MODELS);

// Get a specific model
const model = getModelById("gpt-4o");

// Get models by tier (economy, standard, premium)
const premiumModels = getModelsByTier("premium");

// Get recommended models for a capability
const recommendedForChat = getRecommendedModels("chat");
```

### Organization Profile Extraction

```typescript
import { extractOrganizationProfile } from "@monsoft/ai/functions";

const profile = await extractOrganizationProfile(websiteContent, {
  modelId: "gpt-4o-mini", // Optional: override default model
});

console.log(profile);
// {
//   name: 'Company Name',
//   description: '...',
//   industry: '...',
//   ...
// }
```

## API Reference

### Core Functions

#### `coreGenerateObject<T>(options)`

Generate structured JSON output matching a Zod schema.

| Option    | Type           | Description                                      |
| --------- | -------------- | ------------------------------------------------ |
| `schema`  | `ZodSchema<T>` | Zod schema for the output structure              |
| `system`  | `string`       | System prompt                                    |
| `prompt`  | `string`       | User prompt                                      |
| `modelId` | `string`       | Optional model ID (uses default if not provided) |

Returns: `Promise<GenerateObjectResult<T>>`

#### `coreGenerateText(options)`

Generate text responses.

| Option                 | Type                        | Description                     |
| ---------------------- | --------------------------- | ------------------------------- |
| `system`               | `string`                    | System prompt                   |
| `prompt` or `messages` | `string` or `CoreMessage[]` | Input prompt or message history |
| `modelId`              | `string`                    | Optional model ID               |

Returns: `Promise<GenerateTextResult>`

#### `coreStreamText(options)`

Stream text responses (for real-time chat).

| Option            | Type            | Description             |
| ----------------- | --------------- | ----------------------- |
| `system`          | `string`        | System prompt           |
| `messages`        | `CoreMessage[]` | Message history         |
| `smoothStreaming` | `boolean`       | Enable smooth streaming |
| `modelId`         | `string`        | Optional model ID       |

Returns: `StreamTextResult`

#### `coreStreamObject<T>(options)`

Stream structured JSON output.

| Option    | Type           | Description               |
| --------- | -------------- | ------------------------- |
| `schema`  | `ZodSchema<T>` | Zod schema for the output |
| `system`  | `string`       | System prompt             |
| `prompt`  | `string`       | User prompt               |
| `modelId` | `string`       | Optional model ID         |

Returns: `StreamObjectResult<T>`

### Model Types

```typescript
type AIModel = {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google";
  tier: "economy" | "standard" | "premium";
  capabilities: ("chat" | "extraction" | "analysis" | "coding")[];
  contextWindow: number;
  maxOutput: number;
};
```

## Environment Variables

The package uses the following environment variables:

| Variable              | Description                         |
| --------------------- | ----------------------------------- |
| `OPENAI_API_KEY`      | OpenAI API key                      |
| `LANGFUSE_SECRET_KEY` | Langfuse secret key (for telemetry) |
| `LANGFUSE_PUBLIC_KEY` | Langfuse public key (for telemetry) |

## License

MIT
