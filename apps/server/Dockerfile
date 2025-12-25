# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy workspace configuration first (for better layer caching)
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./

# Copy server package.json
COPY apps/server/package.json ./apps/server/

# Install dependencies (this layer will be cached if package.json doesn't change)
RUN pnpm install --frozen-lockfile

# Copy server source code
COPY apps/server ./apps/server

# Build the application
WORKDIR /app/apps/server
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml* ./

# Copy server package.json
COPY apps/server/package.json ./apps/server/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --filter server

# Copy built application from builder stage
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Set working directory to server
WORKDIR /app/apps/server

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]

