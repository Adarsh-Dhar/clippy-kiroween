# Kiro Agent Hooks 🪝

This directory contains the complete automation hooks system for Clippy's Code Purgatory, integrating passive-aggressive AI assistance directly into your development workflow.

## How It Works

These scripts are triggered by Kiro events (Save, Commit, Push, Build) to enforce the "Cursed" theme throughout the entire development lifecycle. Clippy watches everything you do and judges accordingly.

## Hook Scripts

### Git Workflow Hooks

| Script | Trigger | Behavior |
|--------|---------|----------|
| `pre-commit.js` | git:pre-commit | Runs Prettier and blocks commits containing console.log |
| `commit-msg-validator.js` | git:commit-msg | Validates commit message format, length, and grammar |
| `lint-staged.js` | git:pre-commit | Lints and auto-fixes staged files before commit |
| `check-branch-name.js` | git:pre-commit | Validates branch naming conventions (feature/, bugfix/, etc.) |
| `pre-push.js` | git:pre-push | Runs tests before push and blocks if they fail |
| `post-merge.js` | git:post-merge | Checks for conflicts and auto-installs dependencies if package.json changed |

### Editor Hooks

| Script | Trigger | Behavior |
|--------|---------|----------|
| `post-lint.js` | editor:save | Analyzes file size and roasts you if code is too verbose |
| `on-file-save.js` | file:create | Simulates Clippy watching your file operations with snarky comments |

### Build Hooks

| Script | Trigger | Behavior |
|--------|---------|----------|
| `pre-build.js` | npm:build | Blocks build if any TODO comments exist (Clippy hates procrastination) |

### Manual Hooks

| Script | Command | Behavior |
|--------|---------|----------|
| `run-tests.js` | Manual | Runs tests with coverage and roasts you if they fail |
| `audit-deps.js` | Manual | Checks for outdated packages and security vulnerabilities with judgment |
| `complexity-check.js` | Manual | Analyzes code complexity and shames you for spaghetti code |

## Configuration

All hooks are configured in `hooks.json`. Each hook can be enabled/disabled individually:

```json
{
  "name": "Hook Name",
  "event": "git:pre-commit | editor:save | manual",
  "command": "node .kiro/hooks/script.js",
  "description": "What Clippy does to you",
  "enabled": true
}
```

## Usage

### Automatic Hooks
Git and editor hooks run automatically when their events trigger. Clippy is always watching.

### Manual Hooks
Run manual hooks from the Kiro command palette or terminal:
```bash
node .kiro/hooks/run-tests.js
node .kiro/hooks/audit-deps.js
node .kiro/hooks/complexity-check.js
```

### CLI Management
Use the Clippy Hooks CLI to manage hooks and game state:

```bash
# Show current anger level and mood
node .kiro/hooks/clippy-hooks.js status

# Reset game state
node .kiro/hooks/clippy-hooks.js reset

# List all hooks
node .kiro/hooks/clippy-hooks.js list

# Enable/disable specific hooks
node .kiro/hooks/clippy-hooks.js enable "Hook Name"
node .kiro/hooks/clippy-hooks.js disable "Hook Name"

# Run integration tests
node .kiro/hooks/clippy-hooks.js test

# Show help
node .kiro/hooks/clippy-hooks.js help
```

## Clippy's Philosophy

These hooks embody Clippy's core values:
- **Judgment**: Every action is scrutinized
- **Passive-Aggression**: Helpful, but with attitude
- **Standards**: Code quality is non-negotiable
- **Surveillance**: Nothing escapes Clippy's watchful eye

## AI Integration 🤖

All hooks now use **Gemini AI** to generate dynamic, context-aware responses instead of hardcoded messages. Clippy's personality adapts to your specific code, commit messages, and actions.

### Setup

1. Install dependencies:
```bash
cd server && npm install
```

2. Add your Gemini API key to `server/.env`:
```bash
GEMINI_API_KEY=your_api_key_here
```

3. Test the integration:
```bash
node .kiro/hooks/test-integration.js
```

### Features

- **Context-Aware**: References your actual file names, commit messages, and code
- **Dynamic**: Different response every time, never repetitive
- **Fallback**: Works without API key using hardcoded responses
- **Fast**: ~500ms-2s response time

See `INTEGRATION.md` for detailed documentation.

## Customization

Want to add your own cursed automation? Create a new `.js` file and add it to `hooks.json`. Make sure it's sufficiently judgmental.

To modify Clippy's personality, edit `.kiro/hooks/lib/geminiHookService.js`.

## Notes

These hooks demonstrate Kiro's automation capabilities, extending the "Game" logic beyond the browser and into your actual development environment. You're not just playing with Clippy—you're living with Clippy.

The AI integration brings Clippy to life as a true "Ghost in the Machine" - a sentient entity that watches, judges, and haunts your entire development workflow.

## MCP Integration 🔌

The hooks system is integrated with a Model Context Protocol (MCP) server, allowing AI agents to:
- Read and modify Clippy's game state
- Enable/disable hooks dynamically
- Trigger punishments
- Run code analysis
- Coordinate with the frontend

See `.kiro/MCP-INTEGRATION.md` and `mcp-server/README.md` for details.