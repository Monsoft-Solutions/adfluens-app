# ==========================================
# Adfluens Marketing Site - Dockerfile
# Independent deployment for Dokploy
# ==========================================

# ==========================================
# Stage 1: Base image with pnpm
# ==========================================
FROM node:20-alpine AS base

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# ==========================================
# Stage 2: Install dependencies
# ==========================================
FROM base AS deps

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only the packages needed for marketing site
COPY apps/marketing/package.json ./apps/marketing/
COPY packages/tailwind-config/package.json ./packages/tailwind-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ==========================================
# Stage 3: Build the Astro site
# ==========================================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/marketing/node_modules ./apps/marketing/node_modules
COPY --from=deps /app/packages/tailwind-config/node_modules ./packages/tailwind-config/node_modules
COPY --from=deps /app/packages/eslint-config/node_modules ./packages/eslint-config/node_modules

# Copy source files
COPY apps/marketing ./apps/marketing
COPY packages/tailwind-config ./packages/tailwind-config
COPY packages/eslint-config ./packages/eslint-config

# Copy workspace config needed for build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Build the marketing site
WORKDIR /app/apps/marketing
RUN pnpm build

# ==========================================
# Stage 4: Production image with nginx
# ==========================================
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY apps/marketing/nginx.conf /etc/nginx/nginx.conf

# Copy built static files to nginx html directory
COPY --from=builder /app/apps/marketing/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port 8080 (non-privileged port)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
