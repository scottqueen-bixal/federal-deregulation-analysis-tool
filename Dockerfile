# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install git (needed for some npm packages)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set execute permissions for entrypoint scripts
RUN chmod +x entrypoint.sh

# Clean any existing Prisma client and generate new one
RUN rm -rf src/generated/prisma && DATABASE_URL="postgresql://postgres:password@localhost:5432/ecfr" npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Create necessary directories and change ownership
RUN mkdir -p /app/.next /app/node_modules && chown -R nextjs:nodejs /app/.next /app/node_modules

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]
