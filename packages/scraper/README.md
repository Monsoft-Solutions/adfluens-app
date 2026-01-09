# @monsoft/scraper

Web and social media scraping clients for ScrapingDog and ScrapeCreator APIs.

## Features

- **ScrapingDog Client** - Web scraping with JavaScript rendering support
- **ScrapeCreator Client** - Social media profile and posts scraping
  - Instagram profiles and posts
  - TikTok profiles and posts
  - Facebook pages
- Built-in retry logic with exponential backoff for rate limiting
- TypeScript support with full type definitions
- ESM module format

## Installation

```bash
npm install @monsoft/scraper
# or
pnpm add @monsoft/scraper
# or
yarn add @monsoft/scraper
```

## Configuration

API keys can be provided via constructor or environment variables:

| Client              | Constructor Option | Environment Variable    |
| ------------------- | ------------------ | ----------------------- |
| ScrapingDogClient   | `apiKey`           | `SCRAPINGDOG_API_KEY`   |
| ScrapeCreatorClient | `apiKey`           | `SCRAPECREATOR_API_KEY` |

## Usage

### ScrapingDog Client

```typescript
import { ScrapingDogClient } from "@monsoft/scraper";

// Option 1: Provide API key via constructor
const client = new ScrapingDogClient({ apiKey: "your-api-key" });

// Option 2: Use environment variable (SCRAPINGDOG_API_KEY)
const client = new ScrapingDogClient();

// Scrape a webpage
const html = await client.scrape("https://example.com");

// Scrape as markdown (recommended for text extraction)
const markdown = await client.scrapeAsMarkdown("https://example.com");

// Enable dynamic rendering for JavaScript-heavy sites
const content = await client.scrapeAsMarkdown("https://example.com", true);
```

### ScrapeCreator Client

```typescript
import { ScrapeCreatorClient } from "@monsoft/scraper";

// Option 1: Provide API key via constructor
const client = new ScrapeCreatorClient({ apiKey: "your-api-key" });

// Option 2: Use environment variable (SCRAPECREATOR_API_KEY)
const client = new ScrapeCreatorClient();

// Scrape Instagram profile
const instagramProfile = await client.scrapeInstagramProfile("username");

// Scrape Instagram posts (with optional pagination cursor)
const instagramPosts = await client.scrapeInstagramPosts("username");
const nextPage = await client.scrapeInstagramPosts(
  "username",
  posts.next_max_id
);

// Scrape TikTok profile
const tiktokProfile = await client.scrapeTiktokProfile("username");

// Scrape TikTok posts (with optional pagination cursor)
const tiktokPosts = await client.scrapeTiktokPosts("username");
const nextPage = await client.scrapeTiktokPosts("username", posts.max_cursor);

// Scrape Facebook page
const facebookPage = await client.scrapeFacebookProfile(
  "https://facebook.com/pagename"
);
```

### Social Media Scrapers (High-Level API)

```typescript
import {
  scrapeInstagramProfile,
  scrapeTiktokProfile,
  scrapeFacebookPage,
  extractInstagramHandle,
} from "@monsoft/scraper";

// Extract handle from URL
const handle = extractInstagramHandle("https://instagram.com/username");

// Scrape profiles (returns standardized result objects)
const instagramResult = await scrapeInstagramProfile(
  "https://instagram.com/username"
);
const tiktokResult = await scrapeTiktokProfile("https://tiktok.com/@username");
const facebookResult = await scrapeFacebookPage(
  "https://facebook.com/pagename"
);
```

### Website Scraper (requires @monsoft/ai)

The `scrapeWebsite` function uses AI to extract structured business information from websites:

```typescript
import { scrapeWebsite } from "@monsoft/scraper";

const result = await scrapeWebsite("https://example.com");

if (result.success) {
  console.log(result.data); // Extracted business information
  console.log(result.rawContent); // Raw markdown content
}
```

> **Note:** This feature requires `@monsoft/ai` as a peer dependency.

## API Reference

### ScrapingDogClient

#### Constructor

```typescript
new ScrapingDogClient(config?: ScrapingDogClientConfig)
```

| Option   | Type     | Description                                           |
| -------- | -------- | ----------------------------------------------------- |
| `apiKey` | `string` | API key (falls back to `SCRAPINGDOG_API_KEY` env var) |

#### Methods

| Method             | Parameters                                                         | Returns           | Description            |
| ------------------ | ------------------------------------------------------------------ | ----------------- | ---------------------- |
| `scrape`           | `url: string, options?: { dynamic?: boolean, markdown?: boolean }` | `Promise<string>` | Scrape a URL           |
| `scrapeAsMarkdown` | `url: string, dynamic?: boolean`                                   | `Promise<string>` | Scrape URL as markdown |

### ScrapeCreatorClient

#### Constructor

```typescript
new ScrapeCreatorClient(config?: ScrapeCreatorClientConfig)
```

| Option   | Type     | Description                                             |
| -------- | -------- | ------------------------------------------------------- |
| `apiKey` | `string` | API key (falls back to `SCRAPECREATOR_API_KEY` env var) |

#### Methods

| Method                   | Parameters                        | Returns                                          | Description              |
| ------------------------ | --------------------------------- | ------------------------------------------------ | ------------------------ |
| `scrapeInstagramProfile` | `handle: string`                  | `Promise<ScrapecreatorInstagramProfileResponse>` | Scrape Instagram profile |
| `scrapeInstagramPosts`   | `handle: string, cursor?: string` | `Promise<ScrapecreatorInstagramPostsResponse>`   | Scrape Instagram posts   |
| `scrapeTiktokProfile`    | `handle: string`                  | `Promise<ScrapecreatorTiktokProfileResponse>`    | Scrape TikTok profile    |
| `scrapeTiktokPosts`      | `handle: string, cursor?: number` | `Promise<ScrapecreatorTiktokPostsResponse>`      | Scrape TikTok posts      |
| `scrapeFacebookProfile`  | `facebookUrl: string`             | `Promise<ScrapecreatorFacebookPageResponse>`     | Scrape Facebook page     |

## Rate Limiting

Both clients include built-in retry logic with exponential backoff for 429 (rate limit) errors:

- Maximum 5 retries
- Base delay: 1 second
- Maximum delay: 30 seconds
- Jitter applied to prevent thundering herd

## License

MIT
