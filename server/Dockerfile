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

# Upgrade pip and install Python linter (pylint)
# Use --break-system-packages for Debian 12+ systems, with fallback for older systems
RUN python3 -m pip install --upgrade --no-cache-dir pip setuptools wheel
RUN python3 -m pip install --no-cache-dir --break-system-packages pylint || \
    python3 -m pip install --no-cache-dir pylint || \
    (python3 -m pip install --no-cache-dir --user pylint && \
     ln -s /root/.local/bin/pylint /usr/local/bin/pylint)

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

