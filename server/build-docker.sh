#!/bin/bash

# Build script for server Docker image
# This script builds from the project root to access Prisma schema

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

IMAGE_NAME="clippy-server"
TAG="${1:-latest}"

echo "🔨 Building Docker image: ${IMAGE_NAME}:${TAG}"
echo "=========================================="
echo "📁 Build context: $PROJECT_ROOT"
echo "📄 Dockerfile: server/Dockerfile"
echo ""

# Check if Docker is running (skip check to avoid hanging - build will fail fast if Docker isn't running)
echo "🔍 Starting build (Docker check will happen during build)..."

# Skip cleanup to avoid hanging - proceed directly to build
echo "🚀 Starting build process..."

# Function to create fallback Dockerfile
create_fallback_dockerfile() {
    echo "🔧 Creating fallback Dockerfile (using pip for pylint)..."
    cat > server/Dockerfile.fallback << 'EOF'
# Use Node.js 18 as base image
FROM node:18

# Install system dependencies for Python, pip, and Go
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    ca-certificates \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Install pylint via pip (fallback method)
# Try with --break-system-packages first, then without
RUN python3 -m pip install --no-cache-dir --break-system-packages pylint 2>/dev/null || \
    python3 -m pip install --no-cache-dir pylint || \
    (python3 -m pip install --no-cache-dir --user pylint && \
     export PATH="$HOME/.local/bin:$PATH" && \
     echo 'export PATH="$HOME/.local/bin:$PATH"' >> /root/.bashrc)

# Ensure pylint is in PATH
ENV PATH="${PATH}:/root/.local/bin"

# Verify pylint installation
RUN pylint --version || python3 -m pylint --version || echo "Warning: pylint verification failed"

# Install golint
RUN go install golang.org/x/lint/golint@latest
ENV PATH=$PATH:/root/go/bin

# Install ESLint globally
RUN npm install -g eslint

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy server source code
COPY . .

# Expose port 3001
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
EOF
}

# Try building with main Dockerfile first
echo "📦 Attempting build with main Dockerfile..."
echo "⏳ This may take a few minutes..."
echo "🔍 Starting Docker build..."
echo ""
# Try with BuildKit enabled (it should handle the COPY commands better now)
set +e  # Temporarily disable exit on error to capture build status
docker build \
    --progress=plain \
    --no-cache \
    -t "${IMAGE_NAME}:${TAG}" \
    -f server/Dockerfile \
    . 2>&1 | tee server/build.log
BUILD_EXIT_CODE=${PIPESTATUS[0]}
set -e  # Re-enable exit on error

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Build successful with main Dockerfile!"
    rm -f server/Dockerfile.fallback server/build.log
    echo "📝 Image: ${IMAGE_NAME}:${TAG}"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 3001:3001 ${IMAGE_NAME}:${TAG}"
    exit 0
else
    echo ""
    echo "⚠️  Build failed with main Dockerfile"
    
    # Check if it's a pylint issue
    if grep -qi "pylint\|package.*not found\|unable to locate" server/build.log; then
        echo "🔍 Detected pylint installation issue, trying fallback method..."
        create_fallback_dockerfile
        
        echo "📦 Attempting build with fallback Dockerfile..."
        if docker build \
            --progress=plain \
            --no-cache \
            -t "${IMAGE_NAME}:${TAG}" \
            -f server/Dockerfile.fallback \
            . 2>&1 | tee server/build-fallback.log; then
            echo ""
            echo "✅ Build successful with fallback Dockerfile!"
            echo "💡 Consider updating main Dockerfile to use pip method"
            rm -f server/build.log server/build-fallback.log
            echo "📝 Image: ${IMAGE_NAME}:${TAG}"
            echo ""
            echo "To run the container:"
            echo "  docker run -p 3001:3001 ${IMAGE_NAME}:${TAG}"
            exit 0
        else
            echo ""
            echo "❌ Build failed with fallback Dockerfile too!"
            echo "📋 Check server/build-fallback.log for details"
            exit 1
        fi
    else
        echo "❌ Build failed for unknown reason"
        echo "📋 Check server/build.log for details"
        exit 1
    fi
fi

