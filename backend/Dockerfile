FROM node:18-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Add Tini for better process handling
RUN apk add --no-cache tini

# Install production dependencies first (layer caching optimization)
FROM base AS deps
COPY package*.json ./
RUN npm install --production

# Build stage for development dependencies
FROM deps AS dev-deps
RUN npm ci

# Final stage
FROM base

# Set environment variables
ENV NODE_ENV=production

# Copy package files 
COPY package*.json ./

# Copy dependences from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy app source code
COPY . .

# Create log directory with proper permissions
RUN mkdir -p logs && \
    chown -R node:node logs

# Create upload directory with proper permissions
RUN mkdir -p uploads && \
    chown -R node:node uploads

# Set timezone
ENV TZ=UTC

# Switch to non-root user
USER node

# Expose API port
EXPOSE 3000

# Use tini as entrypoint
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "server.js"]
