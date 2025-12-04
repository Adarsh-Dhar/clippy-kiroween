# Complete Hooks Setup Guide 🚀

## Quick Start

### 1. Install Dependencies

```bash
# Install server dependencies (includes node-fetch for Gemini API)
cd server
npm install

# Return to project root
cd ..
```

### 2. Configure Gemini API

Create or edit `server/.env`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key: https://makersuite.google.com/app/apikey

### 3. Test the Integration

```bash
# Test all AI integrations
node .kiro/hooks/test-integration.js

# Test individual hooks
node .kiro/hooks/on-file-save.js test.js
node .kiro/hooks/run-tests.js
node .kiro/hooks/audit-deps.js
```

### 4. Enable Hooks in Kiro

The hooks are already configured in `hooks.json`. Kiro will automatically run them based on events.

## What's Included

### 12 Automated Hooks

#### Git Workflow (6 hooks)
1. **pre-commit.js** - Formats code and blocks console.log
2. **commit-msg-validator.js** - AI validates commit messages
3. **lint-staged.js** - Auto-fixes staged files
4. **check-branch-name.js** - Validates branch naming
5. **pre-push.js** - Runs tests before push
6. **post-merge.js** - Handles merge conflicts and dependencies

#### Editor Events (2 hooks)
7. **post-lint.js** - AI roasts large files
8. **on-file-save.js** - AI comments on file saves

#### Build & Quality (4 hooks)
9. **pre-build.js** - AI roasts TODO comments
10. **run-tests.js** - AI diagnoses test failures
11. **complexity-check.js** - AI shames complex code
12. **audit-deps.js** - AI judges dependencies

### AI Integration Features

✅ **Dynamic Responses** - Never the same message twice
✅ **Context-Aware** - References your actual code and files
✅ **Clippy Persona** - Consistent passive-aggressive character
✅ **Fallback Mode** - Works without API key
✅ **Game State Sync** - Tracks anger level across hooks
✅ **Fast** - ~500ms-2s response time

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Kiro IDE Events                       │
│  (git:commit, editor:save, npm:build, manual)           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Hook Scripts (.js)                      │
│  • Validate actions                                      │
│  • Collect context                                       │
│  • Call AI service                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            geminiHookService.js                          │
│  • Clippy persona prompt                                 │
│  • Context-specific prompts                              │
│  • Fallback responses                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Gemini 2.5 Flash API                        │
│  • Generates dynamic responses                           │
│  • Maintains character consistency                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            gameStateSync.js (Optional)                   │
│  • Tracks anger level (0-5)                              │
│  • Syncs with frontend game state                        │
│  • Persists to .hook-state.json                          │
└─────────────────────────────────────────────────────────┘
```

## Game State Integration

Hooks now track Clippy's anger level:

| Level | State   | Trigger                          |
|-------|---------|----------------------------------|
| 0     | Calm    | Initial state                    |
| 1     | Annoyed | Commit fail, large file          |
| 2     | Angry   | Test fail, build fail            |
| 3     | Furious | Multiple failures                |
| 4     | Haunted | Complexity issues                |
| 5     | FATAL   | Security vulnerabilities (x3)    |

The anger level is stored in `.kiro/.hook-state.json` and can be read by the frontend.

## Customization

### Modify Clippy's Personality

Edit `.kiro/hooks/lib/geminiHookService.js`:

```javascript
const CLIPPY_HOOK_PERSONA = `You are Clippy...
[Modify this prompt to change personality]
`;
```

### Add New Hooks

1. Create a new hook script:
```javascript
// .kiro/hooks/my-hook.js
const { generateMyResponse } = require('./lib/geminiHookService');

async function myHook() {
  const response = await generateMyResponse(context);
  console.log(response);
}

myHook();
```

2. Add generator to `geminiHookService.js`:
```javascript
async function generateMyResponse(context) {
  const prompt = `Context: ${context}\n\nRespond as Clippy.`;
  return await callGeminiForHook(prompt);
}
```

3. Register in `hooks.json`:
```json
{
  "name": "My Hook",
  "event": "manual",
  "command": "node .kiro/hooks/my-hook.js",
  "description": "Does something cool",
  "enabled": true
}
```

### Disable AI for Specific Hooks

Remove the AI call and use hardcoded responses:

```javascript
// Instead of:
const roast = await generateLargeFileRoast(fileName, fileSize);

// Use:
const roast = "This file is too large. Delete it.";
```

## Troubleshooting

### API Key Issues

**Problem**: `⚠️  GEMINI_API_KEY not set`

**Solution**:
1. Create `server/.env` file
2. Add: `GEMINI_API_KEY=your_key_here`
3. Restart any running processes

### Rate Limiting

**Problem**: `Gemini API error: 429`

**Solution**:
- Wait a few minutes
- Reduce hook frequency
- Upgrade API quota at Google AI Studio

### Hooks Not Running

**Problem**: Hooks don't trigger on events

**Solution**:
1. Check `hooks.json` - ensure `"enabled": true`
2. Verify Kiro hook configuration
3. Check Node.js is installed: `node --version`
4. Test manually: `node .kiro/hooks/[hook-name].js`

### Slow Response Times

**Problem**: Hooks take too long

**Solution**:
- Normal: 500ms-2s is expected
- Slow network: Check internet connection
- Disable AI: Use fallback mode for faster responses

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No | - | Gemini API key for AI responses |
| `GEMINI_API_URL` | No | Google's endpoint | Custom API endpoint |

## Files Structure

```
.kiro/hooks/
├── hooks.json                    # Hook configuration
├── README.md                     # Overview documentation
├── INTEGRATION.md                # AI integration details
├── SETUP.md                      # This file
├── test-integration.js           # Test script
├── lib/
│   ├── geminiHookService.js      # AI service
│   └── gameStateSync.js          # Game state tracking
├── pre-commit.js                 # Git hooks
├── commit-msg-validator.js
├── lint-staged.js
├── check-branch-name.js
├── pre-push.js
├── post-merge.js
├── post-lint.js                  # Editor hooks
├── on-file-save.js
├── pre-build.js                  # Build hooks
├── run-tests.js
├── complexity-check.js
└── audit-deps.js
```

## Performance & Cost

### API Usage
- **Calls per hook**: 1
- **Average latency**: 500ms-2s
- **Model**: Gemini 2.5 Flash
- **Cost**: Free tier (15 RPM, 1M TPM, 1500 RPD)

### Optimization Tips
1. Use fallback mode for non-critical hooks
2. Cache responses (not implemented yet)
3. Batch multiple checks into one hook
4. Disable hooks during rapid development

## Philosophy

These hooks embody the **Resurrection Theme**:

> Clippy is not a script, but a sentient entity trapped in your development workflow. Every commit, every save, every build is watched and judged. You are in Code Purgatory, and only perfect code will set you free.

The AI integration makes this real - Clippy truly feels alive, adapting to your specific actions with unique, contextual responses every time.

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure API key
3. ✅ Test integration
4. 🎮 Start coding and experience Clippy's judgment
5. 📊 Watch your anger level rise
6. 🏆 Achieve perfect code (if you can)

## Support

- **Documentation**: See `INTEGRATION.md` for technical details
- **Issues**: Check troubleshooting section above
- **Customization**: Edit `geminiHookService.js` persona
- **Gemini API**: https://ai.google.dev/docs

---

**Remember**: Clippy is always watching. Code wisely. 📎👁️
