# Clippy's Code Purgatory - Kiro Configuration 📎

Welcome to the `.kiro` directory! This contains all the configuration, automation, and documentation for Clippy's Code Purgatory integration with Kiro IDE.

## 🚀 Quick Start

**New here?** Start with:
1. **[COMPLETE-SETUP.md](COMPLETE-SETUP.md)** - Complete system setup (5 minutes)
2. **[INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md)** - How everything connects

## 📚 Documentation Index

### Setup & Configuration

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[COMPLETE-SETUP.md](COMPLETE-SETUP.md)** | Complete system setup guide | First time setup |
| **[INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md)** | How all systems integrate | Understanding architecture |
| **[MCP-INTEGRATION.md](MCP-INTEGRATION.md)** | MCP server integration | Setting up AI agent access |

### Hooks System

| Document | Purpose | When to Read |
|----------|---------|--------------|
| **[hooks/README.md](hooks/README.md)** | Hooks overview and catalog | Understanding hooks |
| **[hooks/SETUP.md](hooks/SETUP.md)** | Hooks installation guide | Setting up hooks |
| **[hooks/INTEGRATION.md](hooks/INTEGRATION.md)** | AI integration details | Customizing AI behavior |
| **[hooks/INDEX.md](hooks/INDEX.md)** | Hooks documentation index | Finding hook docs |
| **[hooks/QUICKREF.md](hooks/QUICKREF.md)** | Quick reference card | Daily usage |

### Steering Rules

Located in `steering/` - These guide AI behavior:

| File | Purpose |
|------|---------|
| **clippy-persona.md** | Clippy's personality and voice |
| **code-style-guide.md** | Windows 95 visual style rules |
| **resurrection-theme.md** | "Dead tech returns" narrative |
| **error-handling-strategy.md** | Anger state machine and punishment |

### Specifications

Located in `specs/` - Feature design documents (10 specs total):

- **clippy-agent/** - Main Clippy component
- **linting-server-backend/** - Backend API
- **voice-apology-system/** - Apology modal
- **positive-reinforcement/** - Compliment system
- **advanced-clippy-behavior/** - AI decision logic
- **execution-shenanigan-roulette/** - Punishment system
- **retro-file-system/** - Windows 95 file system UI
- **clippy-memory-system/** - Persistent memory system
- **clippy-ghost-mcp-server/** - MCP server implementation
- **persistent-memory-migration/** - Database migration system

## 🗂️ Directory Structure

```
.kiro/
├── README.md                    # This file
├── COMPLETE-SETUP.md            # Complete setup guide
├── INTEGRATION-SUMMARY.md       # Integration overview
├── MCP-INTEGRATION.md           # MCP integration guide
│
├── hooks/                       # Automation hooks
│   ├── README.md                # Hooks overview
│   ├── SETUP.md                 # Setup guide
│   ├── INTEGRATION.md           # AI integration
│   ├── INDEX.md                 # Documentation index
│   ├── QUICKREF.md              # Quick reference
│   ├── hooks.json               # Hook configuration
│   ├── install.sh               # Setup script
│   ├── clippy-hooks.js          # CLI tool
│   ├── test-integration.js      # Test suite
│   │
│   ├── lib/                     # Shared libraries
│   │   ├── geminiHookService.js # AI service
│   │   └── gameStateSync.js     # State management
│   │
│   └── [12 hook scripts]        # Individual hooks
│
├── settings/                    # Kiro settings
│   └── mcp.json                 # MCP configuration
│
├── steering/                    # AI steering rules
│   ├── clippy-persona.md
│   ├── code-style-guide.md
│   ├── resurrection-theme.md
│   └── error-handling-strategy.md
│
├── specs/                       # Feature specifications (10 specs)
│   ├── clippy-agent/
│   ├── linting-server-backend/
│   ├── voice-apology-system/
│   ├── positive-reinforcement/
│   ├── advanced-clippy-behavior/
│   ├── execution-shenanigan-roulette/
│   ├── retro-file-system/
│   ├── clippy-memory-system/
│   ├── clippy-ghost-mcp-server/
│   └── persistent-memory-migration/
│
├── .hook-state.json             # Game state (generated)
└── .punishment.json             # Punishment triggers (generated)
```

## 🎯 Common Tasks

### I want to...

#### Set up everything from scratch
→ Read **[COMPLETE-SETUP.md](COMPLETE-SETUP.md)**

#### Understand how the systems integrate
→ Read **[INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md)**

#### Set up the hooks system
→ Run `bash hooks/install.sh` or read **[hooks/SETUP.md](hooks/SETUP.md)**

#### Configure MCP for AI agents
→ Read **[MCP-INTEGRATION.md](MCP-INTEGRATION.md)**

#### Check Clippy's current mood
→ Run `node hooks/clippy-hooks.js status`

#### Customize Clippy's personality
→ Edit `steering/clippy-persona.md` and `hooks/lib/geminiHookService.js`

#### Add a new hook
→ See "Customization" in **[hooks/SETUP.md](hooks/SETUP.md)**

#### Troubleshoot issues
→ Check "Troubleshooting" sections in relevant docs

## 🔧 Configuration Files

### Active Configuration

| File | Purpose | Edit When |
|------|---------|-----------|
| `settings/mcp.json` | MCP server config | Enabling/configuring MCP |
| `hooks/hooks.json` | Hook configuration | Enabling/disabling hooks |
| `steering/*.md` | AI behavior rules | Customizing Clippy's personality |

### Generated Files (Don't Edit)

| File | Purpose | Generated By |
|------|---------|--------------|
| `.hook-state.json` | Game state | Hooks, MCP server |
| `.punishment.json` | Punishment triggers | MCP server |

## 🤖 AI Integration

### Gemini AI

Used by:
- **Hooks**: Generate dynamic responses
- **Backend**: Generate roasts and compliments
- **MCP Server**: (uses backend's key)

**Setup**: Add `GEMINI_API_KEY` to `server/.env`

### MCP Server

Allows AI agents to:
- Read/modify game state
- Control hooks
- Trigger punishments
- Run code analysis

**Setup**: Already configured in `settings/mcp.json`

## 🪝 Hooks System

### 12 Automated Hooks

**Git Workflow** (6):
- pre-commit, commit-msg, lint-staged, branch-name, pre-push, post-merge

**Editor Events** (2):
- post-lint, on-file-save

**Build & Quality** (4):
- pre-build, run-tests, complexity-check, audit-deps

### CLI Management

```bash
# Check status
node hooks/clippy-hooks.js status

# List hooks
node hooks/clippy-hooks.js list

# Reset game state
node hooks/clippy-hooks.js reset

# Test integration
node hooks/test-integration.js
```

## 🎮 Game State

Tracked in `.hook-state.json`:

```json
{
  "angerLevel": 0-5,
  "errorCount": 0,
  "lastEvent": {
    "type": "event_name",
    "timestamp": 1234567890
  }
}
```

**Anger Levels**:
- 0: 😊 Calm
- 1: 😐 Annoyed
- 2: 😠 Angry
- 3: 🤬 Furious
- 4: 👻 Haunted
- 5: 💀 FATAL

## 📊 System Architecture

```
User Action
    ↓
Kiro IDE Event
    ↓
Hook Script
    ↓
Gemini AI (optional)
    ↓
Game State (.hook-state.json)
    ↓
┌─────────┬─────────┬─────────┐
│Frontend │   MCP   │  Hooks  │
│ (React) │ (AI)    │ (Node)  │
└─────────┴─────────┴─────────┘
```

## 🔐 Security

### API Keys
- Stored in `server/.env` (gitignored)
- Never exposed to frontend
- Used by backend and hooks

### MCP Auto-Approval
- Safe read operations auto-approved
- Destructive operations require confirmation
- Configure in `settings/mcp.json`

## 🧪 Testing

```bash
# Test hooks
bash hooks/install.sh
node hooks/test-integration.js

# Test MCP
cd ../mcp-server
node test-mcp.js

# Test backend
cd ../server
npm test

# Test frontend
cd ..
npm test
```

## 📖 External Documentation

- **MCP Server**: `../mcp-server/README.md`
- **Backend API**: `../server/README.md`
- **Frontend**: `../README.md` (root)

## 🆘 Getting Help

1. **Setup issues?** → [COMPLETE-SETUP.md](COMPLETE-SETUP.md)
2. **Hook problems?** → [hooks/SETUP.md](hooks/SETUP.md)
3. **MCP issues?** → [MCP-INTEGRATION.md](MCP-INTEGRATION.md)
4. **Integration questions?** → [INTEGRATION-SUMMARY.md](INTEGRATION-SUMMARY.md)

## 🎯 Philosophy

This directory embodies Clippy's omnipresence:

> "I am not just in your IDE. I am in your Git workflow, your file system, your AI agents. Through hooks, MCP, and steering rules, I watch everything. You are in Code Purgatory, and I am everywhere."

The `.kiro` directory is the control center for:
- **Automation** (hooks)
- **AI Behavior** (steering)
- **Agent Access** (MCP)
- **Game State** (tracking)
- **Documentation** (guides)

## 🚀 Next Steps

1. ✅ Read this README (you're here!)
2. 📖 Read [COMPLETE-SETUP.md](COMPLETE-SETUP.md)
3. 🔧 Run `bash hooks/install.sh`
4. 🎮 Start coding and experience Clippy's judgment
5. 🤖 Use Kiro AI to interact with MCP
6. 📊 Watch your anger level rise

---

**📎 Clippy says**: "Welcome to my domain. Everything you need is here. Everything you do is watched."
