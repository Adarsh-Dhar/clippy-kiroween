# Clippy Hooks - Quick Reference Card 📎

## Installation (One-Time)

```bash
bash .kiro/hooks/install.sh
```

## CLI Commands

```bash
# Check Clippy's mood
node .kiro/hooks/clippy-hooks.js status

# Reset anger level
node .kiro/hooks/clippy-hooks.js reset

# List all hooks
node .kiro/hooks/clippy-hooks.js list

# Test AI integration
node .kiro/hooks/clippy-hooks.js test
```

## Manual Hook Execution

```bash
# Run tests with AI roast
node .kiro/hooks/run-tests.js

# Check dependencies
node .kiro/hooks/audit-deps.js

# Analyze code complexity
node .kiro/hooks/complexity-check.js
```

## Automatic Triggers

| Event | Hook | What It Does |
|-------|------|--------------|
| `git commit` | pre-commit | Formats code, blocks console.log |
| `git commit` | commit-msg | AI validates message |
| `git push` | pre-push | Runs tests |
| `file save` | post-lint | AI roasts large files |
| `npm build` | pre-build | AI roasts TODO comments |

## Anger Level System

```
0 😊 Calm       → Tests pass, good code
1 😐 Annoyed    → Minor issues
2 😠 Angry      → Test/build failures
3 🤬 Furious    → Multiple failures
4 👻 Haunted    → High complexity
5 💀 FATAL      → Security issues
```

## Configuration

**API Key**: `server/.env`
```bash
GEMINI_API_KEY=your_key_here
```

**Enable/Disable Hooks**: `hooks.json`
```json
{
  "enabled": true  // or false
}
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not set" | Add to `server/.env` |
| Hooks not running | Check `hooks.json` enabled status |
| Slow responses | Normal (500ms-2s for AI) |
| Rate limit error | Wait or upgrade API quota |

## File Locations

```
.kiro/hooks/
├── hooks.json              # Configuration
├── lib/
│   ├── geminiHookService.js  # AI service
│   └── gameStateSync.js      # State tracking
└── [hook-name].js          # Individual hooks
```

## Documentation

- **Setup**: [SETUP.md](SETUP.md)
- **AI Details**: [INTEGRATION.md](INTEGRATION.md)
- **Overview**: [README.md](README.md)
- **Full Index**: [INDEX.md](INDEX.md)

## Emergency Commands

```bash
# Reset everything
node .kiro/hooks/clippy-hooks.js reset

# Disable all hooks temporarily
# Edit hooks.json and set all "enabled": false

# Test without AI
# Remove GEMINI_API_KEY from server/.env
```

---

**📎 Clippy says**: "I'm watching. Always watching."
