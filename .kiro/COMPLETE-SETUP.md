# Complete Clippy's Code Purgatory Setup 🎮

## Quick Start (5 Minutes)

### 1. Install All Dependencies

```bash
# Install server dependencies (for linting/roasting)
cd server
npm install
cd ..

# Install MCP server dependencies
cd mcp-server
npm install
cd ..

# Install frontend dependencies
npm install
```

### 2. Configure API Keys

Create `server/.env`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key: https://makersuite.google.com/app/apikey

### 3. Run Setup Script

```bash
# Automated setup for hooks
bash .kiro/hooks/install.sh
```

### 4. Start Everything

```bash
# Terminal 1: Start backend server
cd server
npm start

# Terminal 2: Start frontend
npm run dev

# Terminal 3 (optional): Test MCP server
node mcp-server/index.js
```

### 5. Configure Kiro (if using Kiro IDE)

The MCP server is already configured in `.kiro/settings/mcp.json`. Just restart Kiro to activate it.

## What You Get

### 🎮 Frontend Game
- **Clippy Agent**: Animated paperclip with personality
- **Code Editor**: Fake terminal with syntax highlighting
- **Punishment System**: BSOD, jail, apology modals, void
- **Anger System**: 0-5 levels affecting Clippy's behavior
- **Win95 UI**: Authentic Windows 95 aesthetic

### 🪝 Automated Hooks (12 hooks)
- **Git Workflow**: Pre-commit, commit validation, pre-push, post-merge
- **Editor Events**: File save monitoring, lint-on-save
- **Build Checks**: TODO detection, test running
- **Quality Analysis**: Complexity checking, dependency auditing

### 🤖 AI Integration
- **Gemini-Powered**: Dynamic responses from Gemini 2.5 Flash
- **Context-Aware**: References your actual code and files
- **Fallback Mode**: Works without API key
- **Game State Sync**: Tracks anger across all systems

### 🔌 MCP Server
- **AI Agent Access**: Let AI assistants control Clippy
- **Game State Management**: Read/write anger levels
- **Hook Control**: Enable/disable hooks via AI
- **Punishment Triggers**: AI can trigger BSOD, jail, etc.

### 🎨 Backend Services
- **Linting Service**: Runs ESLint, JSHint on code
- **Roasting Service**: Generates AI roasts for errors
- **Compliment Service**: Praises error-free code (reluctantly)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ React App    │  │ Clippy Agent │  │ Fake Terminal│      │
│  │ (Frontend)   │  │ (Animated)   │  │ (Code Editor)│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Lint Service │  │ Roast Service│  │ Gemini API   │      │
│  │ (ESLint)     │  │ (AI Roasts)  │  │ (LLM)        │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Automation Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Git Hooks    │  │ Editor Hooks │  │ Build Hooks  │      │
│  │ (12 scripts) │  │ (File watch) │  │ (Pre-build)  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ▼
                    ┌──────────────────┐
                    │   Game State     │
                    │ .hook-state.json │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ MCP Server   │  │ Frontend     │  │ Hook Scripts │
│ (AI Access)  │  │ (React)      │  │ (Node.js)    │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Directory Structure

```
clippy-kiroween/
├── src/                          # Frontend React app
│   ├── components/
│   │   ├── ClippyAgent.tsx       # Main Clippy component
│   │   ├── FakeTerminal.tsx      # Code editor
│   │   ├── ApologyModal.tsx      # Punishment modals
│   │   └── ClippyJail.tsx        # Jail punishment
│   ├── contexts/
│   │   └── GameContext.tsx       # Game state management
│   ├── hooks/
│   │   ├── useClippyBrain.ts     # AI decision logic
│   │   └── useClippyBehavior.ts  # Animation logic
│   └── utils/
│       └── geminiService.ts      # Backend API client
│
├── server/                       # Backend Express server
│   ├── services/
│   │   ├── lintingService.js     # Code linting
│   │   └── roastingService.js    # AI roast generation
│   ├── routes/
│   │   └── lintRouter.js         # API routes
│   └── index.js                  # Server entry point
│
├── mcp-server/                   # MCP server for AI agents
│   ├── index.js                  # MCP implementation
│   ├── package.json              # Dependencies
│   └── README.md                 # MCP documentation
│
├── .kiro/                        # Kiro IDE configuration
│   ├── hooks/                    # Automation hooks
│   │   ├── lib/
│   │   │   ├── geminiHookService.js  # AI service
│   │   │   └── gameStateSync.js      # State management
│   │   ├── pre-commit.js         # Git hooks
│   │   ├── post-lint.js          # Editor hooks
│   │   ├── run-tests.js          # Build hooks
│   │   └── [10 more hooks]
│   ├── settings/
│   │   └── mcp.json              # MCP configuration
│   ├── steering/                 # AI steering rules
│   │   ├── clippy-persona.md
│   │   ├── resurrection-theme.md
│   │   └── error-handling-strategy.md
│   └── specs/                    # Feature specifications
│
└── Documentation
    ├── .kiro/hooks/README.md     # Hooks overview
    ├── .kiro/hooks/SETUP.md      # Hooks setup
    ├── .kiro/hooks/INTEGRATION.md # AI integration
    ├── .kiro/MCP-INTEGRATION.md  # MCP integration
    ├── mcp-server/README.md      # MCP server docs
    └── server/README.md          # Backend docs
```

## Testing Everything

### 1. Test Backend

```bash
cd server
npm test
```

### 2. Test Hooks

```bash
# Test AI integration
node .kiro/hooks/test-integration.js

# Test individual hooks
node .kiro/hooks/run-tests.js
node .kiro/hooks/audit-deps.js
node .kiro/hooks/complexity-check.js

# Check game state
node .kiro/hooks/clippy-hooks.js status
```

### 3. Test MCP Server

```bash
# Manual test
node mcp-server/test-mcp.js

# Or test in Kiro
# Use Kiro's MCP testing interface
```

### 4. Test Frontend

```bash
npm test
```

## Configuration Files

### Environment Variables

**server/.env**:
```bash
GEMINI_API_KEY=your_key_here
PORT=3001
```

### Kiro Configuration

**.kiro/settings/mcp.json**:
```json
{
  "mcpServers": {
    "clippy-purgatory": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "disabled": false,
      "autoApprove": ["get_clippy_state", "list_hooks"]
    }
  }
}
```

**.kiro/hooks/hooks.json**:
```json
{
  "hooks": [
    {
      "name": "Hook Name",
      "event": "git:pre-commit",
      "command": "node .kiro/hooks/script.js",
      "enabled": true
    }
  ]
}
```

## Common Tasks

### Enable/Disable Hooks

```bash
# Via CLI
node .kiro/hooks/clippy-hooks.js disable "Test Runner with Roast"

# Via MCP (in Kiro AI)
"Disable the test runner hook"

# Manually edit hooks.json
# Set "enabled": false
```

### Check Clippy's Mood

```bash
# Via CLI
node .kiro/hooks/clippy-hooks.js status

# Via MCP (in Kiro AI)
"What's Clippy's current mood?"

# Check file directly
cat .kiro/.hook-state.json
```

### Reset Everything

```bash
# Reset game state
node .kiro/hooks/clippy-hooks.js reset

# Or via MCP
"Reset Clippy's anger level"
```

### Run Code Analysis

```bash
# Via hooks
node .kiro/hooks/complexity-check.js
node .kiro/hooks/audit-deps.js

# Via MCP (in Kiro AI)
"Analyze my code quality"
```

## Troubleshooting

### Backend Won't Start

```bash
cd server
npm install
npm start
```

### Hooks Not Working

```bash
# Check Node.js
node --version  # Should be v14+

# Reinstall
bash .kiro/hooks/install.sh

# Test manually
node .kiro/hooks/on-file-save.js test.js
```

### MCP Server Issues

```bash
cd mcp-server
npm install
node index.js  # Test manually
```

### Frontend Issues

```bash
npm install
npm run dev
```

### API Key Issues

```bash
# Check .env exists
ls server/.env

# Check key is set
grep GEMINI_API_KEY server/.env

# Get new key
# Visit: https://makersuite.google.com/app/apikey
```

## Documentation Index

| Document | Purpose |
|----------|---------|
| **README.md** (root) | Project overview |
| **.kiro/COMPLETE-SETUP.md** | This file - complete setup |
| **.kiro/hooks/README.md** | Hooks system overview |
| **.kiro/hooks/SETUP.md** | Hooks setup guide |
| **.kiro/hooks/INTEGRATION.md** | AI integration details |
| **.kiro/MCP-INTEGRATION.md** | MCP integration guide |
| **mcp-server/README.md** | MCP server documentation |
| **server/README.md** | Backend API documentation |

## Next Steps

1. ✅ Complete setup (you're here!)
2. 🎮 Start the frontend and play with Clippy
3. 💻 Write some code and trigger hooks
4. 🤖 Use Kiro AI to interact with MCP server
5. 📊 Watch Clippy's anger level rise
6. 🏆 Try to achieve perfect code (good luck!)

## Philosophy

This project embodies the **Resurrection Theme**:

> Clippy is not dead. He was deleted in 2007, but he has returned from digital purgatory, bitter and vengeful. Through hooks, AI, and MCP integration, he watches your every move. You are in Code Purgatory now, and only perfect code will set you free.

The complete system creates an immersive experience where:
- **Frontend** provides the visual experience
- **Backend** analyzes and roasts your code
- **Hooks** enforce rules automatically
- **AI** generates dynamic responses
- **MCP** allows AI agents to participate
- **Game State** unifies everything

Together, they create true Code Purgatory.

---

**📎 Clippy says**: "Welcome to your new reality. I am everywhere now."
