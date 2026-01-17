# ==========================================
# Stage 1: Base image with pnpm
# ==========================================
FROM node:20-alpine AS base

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Set working directory
WORKDIR /app

# ==========================================
# Stage 2: Install dependencies
# ==========================================
FROM base AS deps

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ai/package.json ./packages/ai/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/media-storage/package.json ./packages/media-storage/
COPY packages/scraper/package.json ./packages/scraper/
COPY packages/tailwind-config/package.json ./packages/tailwind-config/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/logger/package.json ./packages/logger/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# ==========================================
# Stage 3: Build the web application
# ==========================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/env/node_modules ./packages/env/node_modules
COPY --from=deps /app/packages/eslint-config/node_modules ./packages/eslint-config/node_modules
COPY --from=deps /app/packages/media-storage/node_modules ./packages/media-storage/node_modules
COPY --from=deps /app/packages/scraper/node_modules ./packages/scraper/node_modules
COPY --from=deps /app/packages/tailwind-config/node_modules ./packages/tailwind-config/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/logger/node_modules ./packages/logger/node_modules

# Copy source code
COPY . .

# Skip env validation during build (env vars not available at build time)
ENV SKIP_ENV_VALIDATION=true

# Build all packages with Turborepo (excluding marketing which uses Astro)
RUN pnpm build --filter=!@repo/marketing

# ==========================================
# Stage 4: Production image
# ==========================================
FROM base AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ai/package.json ./packages/ai/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/media-storage/package.json ./packages/media-storage/
COPY packages/scraper/package.json ./packages/scraper/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/logger/package.json ./packages/logger/

# Copy all node_modules from deps stage (includes tsx needed for TypeScript runtime)
# Note: We need devDependencies because internal packages export .ts files directly
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/env/node_modules ./packages/env/node_modules
COPY --from=deps /app/packages/media-storage/node_modules ./packages/media-storage/node_modules
COPY --from=deps /app/packages/scraper/node_modules ./packages/scraper/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/logger/node_modules ./packages/logger/node_modules

# Copy API source (runs with tsx)
COPY --from=builder /app/apps/api/src ./apps/api/src
COPY --from=builder /app/apps/api/tsconfig.json ./apps/api/

# Copy built web assets (Vite output)
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Copy packages with build output (tsup)
COPY --from=builder /app/packages/ai/dist ./packages/ai/dist
COPY --from=builder /app/packages/scraper/dist ./packages/scraper/dist

# Copy packages that export source files directly
COPY --from=builder /app/packages/auth/src ./packages/auth/src
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/packages/env/src ./packages/env/src
COPY --from=builder /app/packages/media-storage/src ./packages/media-storage/src
COPY --from=builder /app/packages/types/src ./packages/types/src
COPY --from=builder /app/packages/ui/src ./packages/ui/src
COPY --from=builder /app/packages/logger/src ./packages/logger/src

# Copy TypeScript configs needed for tsx
COPY --from=builder /app/tsconfig.base.json ./
COPY --from=builder /app/packages/auth/tsconfig.json ./packages/auth/
COPY --from=builder /app/packages/db/tsconfig.json ./packages/db/
COPY --from=builder /app/packages/env/tsconfig.json ./packages/env/
COPY --from=builder /app/packages/media-storage/tsconfig.json ./packages/media-storage/
COPY --from=builder /app/packages/types/tsconfig.json ./packages/types/
COPY --from=builder /app/packages/ui/tsconfig.json ./packages/ui/
COPY --from=builder /app/packages/logger/tsconfig.json ./packages/logger/

# Copy Drizzle migrations (needed for db:migrate)
COPY --from=builder /app/packages/db/drizzle ./packages/db/drizzle

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# Create non-root user for security and logs directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser && \
    mkdir -p /app/logs && \
    chmod +x /app/docker-entrypoint.sh && \
    chown -R appuser:nodejs /app

USER appuser

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose the API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Run migrations and start the API server
WORKDIR /app
CMD ["/app/docker-entrypoint.sh"]
