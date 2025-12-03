# YouTube Channel Analyzer

A full-stack application that analyzes YouTube channels and videos using AI to uncover viral strategies and content ideas.

## Project Structure

This is a **Turborepo monorepo** with the following structure:

```
youtube-channel-analyzer/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   └── src/
│   │       ├── features/       # Feature-based modules
│   │       │   ├── youtube/    # YouTube-related components, hooks, utils
│   │       │   │   ├── components/
│   │       │   │   ├── hooks/   # TanStack Query hooks
│   │       │   │   └── utils/   # Complex logic (.utils.ts)
│   │       │   └── ai/         # AI analysis components, hooks, utils
│   │       │       ├── components/
│   │       │       ├── hooks/
│   │       │       └── utils/
│   │       ├── shared/         # Shared UI components
│   │       └── lib/            # Utilities (tRPC client, etc.)
│   │
│   └── api/                    # Express + tRPC backend
│       └── src/
│           ├── features/       # Feature-based modules
│           │   ├── youtube/    # YouTube API service + router
│           │   │   ├── youtube.router.ts
│           │   │   └── youtube.service.ts
│           │   └── ai/         # Gemini AI service + router
│           │       ├── ai.router.ts
│           │       └── ai.service.ts
│           └── trpc/           # tRPC configuration
│
├── packages/
│   └── types/                  # Shared TypeScript types
│       └── src/
│           ├── youtube/        # YouTube-related types
│           └── ai/             # AI-related types
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace configuration
└── package.json                # Root package.json
```

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, TanStack Query, tRPC
- **Backend**: Express, tRPC, Zod validation
- **AI**: Google Gemini 2.5 Flash with Google Search grounding
- **APIs**: YouTube Data API v3
- **Monorepo**: Turborepo, pnpm workspaces

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

1. Install pnpm if you haven't already:

   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with your API keys:

   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   - `YOUTUBE_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Development

Start both frontend and backend in development mode:

```bash
pnpm dev
```

This will start:

- Frontend at http://localhost:3000
- Backend API at http://localhost:3001

### Build

Build all packages and apps:

```bash
pnpm build
```

### Type Checking

Run TypeScript type checking across all packages:

```bash
pnpm type-check
```

## Architecture Decisions

### Feature-Based Organization

Each app follows a feature-based architecture where related code is grouped together:

- **components/**: React components specific to the feature
- **hooks/**: TanStack Query hooks for data fetching (use directly in components)
- **utils/**: Complex business logic (`.utils.ts` files for imperative operations)

### Shared Packages

- `@repo/types`: Shared TypeScript types and Zod schemas between frontend and backend

### Server Services Pattern

Backend features separate concerns:

- `*.router.ts`: tRPC procedure definitions (thin layer)
- `*.service.ts`: Business logic and external API calls

### Client Data Fetching

- **hooks/**: Prefer using TanStack Query hooks directly in components
- **utils/**: Use `.utils.ts` for complex imperative operations (event handlers, multi-step flows)

## License

MIT
