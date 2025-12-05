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

# Copy root package.json (for Prisma dependencies)
COPY package.json ./
COPY package-lock.json* pnpm-lock.yaml* ./

# Copy Prisma schema and config
COPY prisma/ ./prisma/
COPY prisma.config.ts ./

# Install root dependencies (includes Prisma)
RUN npm install

# Generate Prisma client
# The schema outputs to ../src/generated/prisma from prisma/, which becomes /app/src/generated/prisma
RUN npx prisma generate

# Copy generated Prisma client to where the server expects it
# Server looks for ../../src/generated/prisma/client from /app/server/utils/
# That resolves to /src/generated/prisma/client
RUN mkdir -p /src/generated/prisma && \
    if [ -d "src/generated/prisma" ]; then \
      cp -r src/generated/prisma/* /src/generated/prisma/; \
    elif [ -d "node_modules/.prisma/client" ]; then \
      cp -r node_modules/.prisma/client/* /src/generated/prisma/; \
    else \
      echo "Warning: Prisma client not found in expected locations"; \
    fi

# Copy all server files at once
# Using server/ syntax (with trailing slash) tells Docker to copy directory contents
COPY server ./server
# Remove node_modules if it was copied (shouldn't happen due to .dockerignore, but just in case)
RUN cd ./server && \
    rm -rf node_modules 2>/dev/null || true && \
    # Ensure .eslintrc.json exists (create default if missing)
    if [ ! -f .eslintrc.json ]; then \
      cat > .eslintrc.json << 'EOF'
{
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "script"
  },
  "rules": {
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
EOF
    fi

# Install server dependencies
WORKDIR /app/server
RUN npm install

# Expose port 3001
EXPOSE 3001

# Start the server
CMD ["npm", "start"]

