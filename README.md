# YouTube Channel Analyzer

A React application that analyzes YouTube channels using the YouTube Data API and Google's Gemini AI for viral content insights.

## Features

- Search YouTube channels by handle or ID
- View top videos with statistics (views, likes, comments)
- AI-powered video analysis with viral insights
- Chat with AI about video strategies
- Secure server-side API key handling

## Prerequisites

- Node.js 18+
- YouTube Data API Key ([Get one here](https://console.cloud.google.com/apis/credentials))
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the example environment file and add your API keys:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your keys:
   ```env
   YOUTUBE_API_KEY=your_youtube_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   NODE_ENV=development
   ```

3. **Run the development servers:**
   ```bash
   npm run dev
   ```
   
   This starts both:
   - Frontend (Vite): http://localhost:3000
   - Backend (Express): http://localhost:3001

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:client` | Start only the Vite frontend dev server |
| `npm run dev:server` | Start only the Express backend server |
| `npm run build` | Build the frontend for production |
| `npm run start` | Run production server (serves built frontend) |
| `npm run preview` | Preview the production build |

## Architecture

```
├── server/
│   ├── index.ts         # Express server entry point
│   └── routes/
│       └── api.ts       # API routes (YouTube, AI proxy)
├── components/          # React components
├── services/            # Frontend API services
├── App.tsx              # Main React app
└── vite.config.ts       # Vite configuration with API proxy
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (shows API key status) |
| `/api/youtube/channels` | POST | Resolve channel ID from handle/name |
| `/api/youtube/videos` | POST | Fetch channel videos with statistics |
| `/api/youtube/comments` | POST | Fetch video comments |
| `/api/ai/analyze` | POST | Analyze video with Gemini AI |
| `/api/ai/chat` | POST | Chat about video strategy |

## Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Set environment variables on your server

3. Start the production server:
   ```bash
   NODE_ENV=production npm run start
   ```

The Express server will serve the built frontend files and handle API requests.
