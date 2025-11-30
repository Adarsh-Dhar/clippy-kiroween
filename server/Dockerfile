# Use Node.js 18 as base image
FROM node:18

# Install system dependencies for Python, pip, and Go
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Install Python linter (pylint)
RUN pip3 install pylint

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

