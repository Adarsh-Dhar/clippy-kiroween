#!/bin/bash

echo "📎 Clippy Hooks Installation Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server

if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Server dependencies installed successfully"
    else
        echo "❌ Failed to install server dependencies"
        exit 1
    fi
else
    echo "❌ server/package.json not found"
    exit 1
fi

cd ..

# Check for .env file
echo ""
echo "🔑 Checking for Gemini API key..."

if [ -f "server/.env" ]; then
    if grep -q "GEMINI_API_KEY" server/.env; then
        echo "✅ GEMINI_API_KEY found in server/.env"
    else
        echo "⚠️  GEMINI_API_KEY not found in server/.env"
        echo ""
        read -p "Would you like to add it now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter your Gemini API key: " api_key
            echo "GEMINI_API_KEY=$api_key" >> server/.env
            echo "✅ API key added to server/.env"
        else
            echo "⚠️  Skipping API key setup. Hooks will use fallback responses."
        fi
    fi
else
    echo "⚠️  server/.env not found"
    echo ""
    read -p "Would you like to create it now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your Gemini API key: " api_key
        echo "GEMINI_API_KEY=$api_key" > server/.env
        echo "✅ server/.env created with API key"
    else
        echo "⚠️  Skipping .env creation. Hooks will use fallback responses."
    fi
fi

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x .kiro/hooks/clippy-hooks.js
chmod +x .kiro/hooks/test-integration.js
echo "✅ Scripts are now executable"

# Run tests
echo ""
echo "🧪 Running integration tests..."
node .kiro/hooks/test-integration.js

# Show status
echo ""
echo "📊 Current hook status:"
node .kiro/hooks/clippy-hooks.js list

echo ""
echo "✅ Installation complete!"
echo ""
echo "📎 Clippy says: 'I'm watching you now. Code carefully.'"
echo ""
echo "Next steps:"
echo "  1. Check hook status: node .kiro/hooks/clippy-hooks.js status"
echo "  2. Test a hook: node .kiro/hooks/on-file-save.js test.js"
echo "  3. Start coding and experience Clippy's judgment!"
echo ""
echo "Documentation:"
echo "  - Setup guide: .kiro/hooks/SETUP.md"
echo "  - Integration details: .kiro/hooks/INTEGRATION.md"
echo "  - CLI help: node .kiro/hooks/clippy-hooks.js help"
echo ""
