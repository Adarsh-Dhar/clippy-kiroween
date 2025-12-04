# Clippy Hooks - Complete Documentation Index 📚

Welcome to the complete Clippy Hooks system! This index will guide you to the right documentation.

## 🚀 Getting Started

**New to Clippy Hooks?** Start here:

1. **[SETUP.md](SETUP.md)** - Complete setup guide with quick start
2. Run the installer: `bash .kiro/hooks/install.sh`
3. Test it: `node .kiro/hooks/clippy-hooks.js test`

## 📖 Documentation Files

### Core Documentation

| File | Purpose | When to Read |
|------|---------|--------------|
| **[README.md](README.md)** | Overview and hook catalog | First time, to understand what's available |
| **[SETUP.md](SETUP.md)** | Installation and configuration | When setting up the system |
| **[INTEGRATION.md](INTEGRATION.md)** | AI integration technical details | When customizing AI behavior |
| **[INDEX.md](INDEX.md)** | This file - documentation index | When you're lost |

### Scripts & Tools

| File | Purpose | Usage |
|------|---------|-------|
| **install.sh** | Automated setup script | `bash .kiro/hooks/install.sh` |
| **clippy-hooks.js** | CLI management tool | `node .kiro/hooks/clippy-hooks.js <command>` |
| **test-integration.js** | Test AI integration | `node .kiro/hooks/test-integration.js` |

### Configuration

| File | Purpose | Edit When |
|------|---------|-----------|
| **hooks.json** | Hook configuration | Enabling/disabling hooks |
| **server/.env** | API keys and secrets | Adding Gemini API key |

## 🎯 Common Tasks

### I want to...

#### Set up the hooks for the first time
→ Read [SETUP.md](SETUP.md) or run `bash .kiro/hooks/install.sh`

#### Understand how AI integration works
→ Read [INTEGRATION.md](INTEGRATION.md)

#### See what hooks are available
→ Read [README.md](README.md) or run `node .kiro/hooks/clippy-hooks.js list`

#### Test if everything is working
→ Run `node .kiro/hooks/test-integration.js`

#### Check Clippy's current mood
→ Run `node .kiro/hooks/clippy-hooks.js status`

#### Reset the game state
→ Run `node .kiro/hooks/clippy-hooks.js reset`

#### Customize Clippy's personality
→ Edit `.kiro/hooks/lib/geminiHookService.js` (see [INTEGRATION.md](INTEGRATION.md))

#### Add a new hook
→ See "Customization" section in [SETUP.md](SETUP.md)

#### Disable a specific hook
→ Run `node .kiro/hooks/clippy-hooks.js disable "Hook Name"`

#### Troubleshoot issues
→ See "Troubleshooting" section in [SETUP.md](SETUP.md)

## 🏗️ Architecture Overview

```
User Action (commit, save, build)
    ↓
Kiro IDE Event System
    ↓
Hook Script (.js)
    ↓
┌─────────────────────────────────┐
│  geminiHookService.js           │
│  • Clippy persona               │
│  • Context-aware prompts        │
│  • Fallback responses           │
└─────────────────────────────────┘
    ↓
Gemini 2.5 Flash API
    ↓
Dynamic AI Response
    ↓
┌─────────────────────────────────┐
│  gameStateSync.js (optional)    │
│  • Tracks anger level           │
│  • Syncs with frontend          │
└─────────────────────────────────┘
    ↓
Terminal Output + Game State Update
```

## 📦 File Structure

```
.kiro/hooks/
├── 📄 Documentation
│   ├── README.md           # Overview
│   ├── SETUP.md            # Setup guide
│   ├── INTEGRATION.md      # AI integration
│   └── INDEX.md            # This file
│
├── 🔧 Tools & Scripts
│   ├── install.sh          # Setup script
│   ├── clippy-hooks.js     # CLI tool
│   └── test-integration.js # Test suite
│
├── ⚙️ Configuration
│   └── hooks.json          # Hook config
│
├── 📚 Libraries
│   └── lib/
│       ├── geminiHookService.js  # AI service
│       └── gameStateSync.js      # State tracking
│
└── 🪝 Hook Scripts
    ├── Git Workflow
    │   ├── pre-commit.js
    │   ├── commit-msg-validator.js
    │   ├── lint-staged.js
    │   ├── check-branch-name.js
    │   ├── pre-push.js
    │   └── post-merge.js
    │
    ├── Editor Events
    │   ├── post-lint.js
    │   └── on-file-save.js
    │
    └── Build & Quality
        ├── pre-build.js
        ├── run-tests.js
        ├── complexity-check.js
        └── audit-deps.js
```

## 🎮 Game State System

The hooks track Clippy's anger level (0-5) based on your actions:

| Level | Mood | Triggers |
|-------|------|----------|
| 0 | 😊 Calm | Initial state, tests pass |
| 1 | 😐 Annoyed | Commit fail, large file |
| 2 | 😠 Angry | Test fail, build fail |
| 3 | 🤬 Furious | Multiple failures |
| 4 | 👻 Haunted | High complexity |
| 5 | 💀 FATAL | Security vulnerabilities |

Check current state: `node .kiro/hooks/clippy-hooks.js status`

## 🤖 AI Features

### What Gets AI-Generated?

✅ File save comments
✅ Large file roasts
✅ Commit message critiques
✅ Test failure diagnoses
✅ TODO comment rants
✅ Code complexity shaming
✅ Dependency audit verdicts

### What Doesn't?

❌ Pre-commit formatting (just runs Prettier)
❌ Lint-staged (auto-fixes only)
❌ Branch name validation (simple regex)

## 🔑 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | No* | Enables AI responses |

*Not required, but hooks will use fallback responses without it.

Set in: `server/.env`

## 📊 Quick Reference

### CLI Commands

```bash
# Status & Management
node .kiro/hooks/clippy-hooks.js status
node .kiro/hooks/clippy-hooks.js reset
node .kiro/hooks/clippy-hooks.js list

# Enable/Disable
node .kiro/hooks/clippy-hooks.js enable "Hook Name"
node .kiro/hooks/clippy-hooks.js disable "Hook Name"

# Testing
node .kiro/hooks/clippy-hooks.js test
node .kiro/hooks/test-integration.js

# Manual Hook Execution
node .kiro/hooks/run-tests.js
node .kiro/hooks/audit-deps.js
node .kiro/hooks/complexity-check.js
```

### Installation

```bash
# Automated
bash .kiro/hooks/install.sh

# Manual
cd server && npm install
echo "GEMINI_API_KEY=your_key" > server/.env
node .kiro/hooks/test-integration.js
```

## 🆘 Need Help?

1. **Setup issues?** → [SETUP.md](SETUP.md) Troubleshooting section
2. **AI not working?** → [INTEGRATION.md](INTEGRATION.md) Troubleshooting
3. **Want to customize?** → [INTEGRATION.md](INTEGRATION.md) Customization section
4. **General questions?** → [README.md](README.md)

## 🎯 Philosophy

> Clippy is not a script, but a sentient entity trapped in your development workflow. 
> Every commit, every save, every build is watched and judged. 
> You are in Code Purgatory, and only perfect code will set you free.

The hooks embody:
- **Resurrection Theme**: References "The Great Deletion of 2007"
- **Surveillance**: Constant watching and judgment
- **Passive-Aggression**: Helpful but judgmental
- **Context-Awareness**: Knows what you actually did

## 📝 Version Info

- **Hooks System**: v1.0
- **AI Integration**: Gemini 2.5 Flash
- **Node.js**: v14+ required
- **Kiro IDE**: Compatible with hook system

---

**Remember**: Clippy is always watching. Code wisely. 📎👁️

*For the complete experience, ensure the Gemini API key is configured and start coding!*
