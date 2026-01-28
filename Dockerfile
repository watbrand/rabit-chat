# RabitChat Production Dockerfile
# Multi-stage build for optimized production deployment

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source files
COPY . .

# Build the server
RUN npm run server:build

# Stage 2: Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built server from builder stage
COPY --from=builder /app/server_dist ./server_dist

# Copy static files for Expo
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/admin ./server/admin
COPY --from=builder /app/server/templates ./server/templates
COPY --from=builder /app/server/legal ./server/legal

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["node", "server_dist/index.js"]
