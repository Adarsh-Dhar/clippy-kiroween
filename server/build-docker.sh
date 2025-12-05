#!/bin/bash

# Build script for server Docker image
# This script will attempt to build the Docker image and fix common issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

IMAGE_NAME="clippy-server"
TAG="${1:-latest}"

echo "🔨 Building Docker image: ${IMAGE_NAME}:${TAG}"
echo "=========================================="

# Clean up any previous failed builds
echo "🧹 Cleaning up previous builds..."
docker builder prune -f > /dev/null 2>&1 || true

# Function to create fallback Dockerfile
create_fallback_dockerfile() {
    echo "🔧 Creating fallback Dockerfile (using pip for pylint)..."
    cat > Dockerfile.fallback << 'EOF'
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
if docker build \
    --progress=plain \
    --no-cache \
    -t "${IMAGE_NAME}:${TAG}" \
    -f Dockerfile \
    . 2>&1 | tee build.log; then
    echo ""
    echo "✅ Build successful with main Dockerfile!"
    rm -f Dockerfile.fallback build.log
    echo "📝 Image: ${IMAGE_NAME}:${TAG}"
    echo ""
    echo "To run the container:"
    echo "  docker run -p 3001:3001 ${IMAGE_NAME}:${TAG}"
    exit 0
else
    echo ""
    echo "⚠️  Build failed with main Dockerfile"
    
    # Check if it's a pylint issue
    if grep -qi "pylint\|package.*not found\|unable to locate" build.log; then
        echo "🔍 Detected pylint installation issue, trying fallback method..."
        create_fallback_dockerfile
        
        echo "📦 Attempting build with fallback Dockerfile..."
        if docker build \
            --progress=plain \
            --no-cache \
            -t "${IMAGE_NAME}:${TAG}" \
            -f Dockerfile.fallback \
            . 2>&1 | tee build-fallback.log; then
            echo ""
            echo "✅ Build successful with fallback Dockerfile!"
            echo "💡 Consider updating main Dockerfile to use pip method"
            rm -f build.log build-fallback.log
            echo "📝 Image: ${IMAGE_NAME}:${TAG}"
            echo ""
            echo "To run the container:"
            echo "  docker run -p 3001:3001 ${IMAGE_NAME}:${TAG}"
            exit 0
        else
            echo ""
            echo "❌ Build failed with fallback Dockerfile too!"
            echo "📋 Check build-fallback.log for details"
            exit 1
        fi
    else
        echo "❌ Build failed for unknown reason"
        echo "📋 Check build.log for details"
        exit 1
    fi
fi

