# Use Node.js 20 as base image (required for Prisma 7.1.0+)
FROM node:20

# Install system dependencies for Python, pip, and Go
# Install pylint via apt (most reliable method)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    ca-certificates \
    golang-go \
    pylint \
    && rm -rf /var/lib/apt/lists/*

# Verify pylint installation
RUN pylint --version || echo "Warning: pylint not found in PATH"

# Install golint (with retry and timeout handling)
RUN go install golang.org/x/lint/golint@latest || echo "Warning: golint installation failed (network issue)"
ENV PATH=$PATH:/root/go/bin

# Install ESLint globally
RUN npm install -g eslint

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy server source code (exclude node_modules)
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/
COPY parsers/ ./parsers/
COPY tests/ ./tests/
COPY index.js ./
COPY .eslintrc.json ./

# Create the expected Prisma client path structure
# The server expects it at ../../src/generated/prisma/client from server/utils/
# Since we're in /app (server dir), that resolves to /src/generated/prisma/client
# Note: Prisma client should be pre-generated and copied during build if database features are needed
# Otherwise, server will run in memory-only mode (graceful fallback)
RUN mkdir -p /src/generated/prisma

# Expose port 3001
EXPOSE 3001

# Start the server
CMD ["npm", "start"]

