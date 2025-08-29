# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install git and bash (needed for some npm packages and entrypoint)
RUN apk add --no-cache git bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Clean any existing Prisma client and generate new one (will be regenerated in entrypoint)
RUN rm -rf src/generated/prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Create necessary directories and change ownership
RUN mkdir -p /app/.next /app/node_modules && chown -R nextjs:nodejs /app/.next /app/node_modules

# Change ownership of app directory and set script permissions
RUN chown -R nextjs:nodejs /app
RUN chmod +x /app/entrypoint.sh
USER nextjs

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]
