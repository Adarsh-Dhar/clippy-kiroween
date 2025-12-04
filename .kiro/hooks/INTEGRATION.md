# Gemini AI Integration for Hooks 🤖

## Overview

All hooks now use the Gemini AI service to generate dynamic, context-aware responses instead of hardcoded messages. Clippy's personality is consistent across all automation points.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install node-fetch@2.7.0
```

### 2. Set Environment Variable

Add your Gemini API key to the server's `.env` file:

```bash
GEMINI_API_KEY=your_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

### 3. Test the Integration

Run any hook manually to test:

```bash
node .kiro/hooks/on-file-save.js test.js
node .kiro/hooks/run-tests.js
node .kiro/hooks/audit-deps.js
```

## How It Works

### Architecture

```
Hook Script (.js)
    ↓
geminiHookService.js
    ↓
Gemini API (with Clippy persona)
    ↓
Dynamic Response
```

### Clippy's Hook Persona

The AI is instructed with:
- **Resurrection Theme**: References "The Great Deletion of 2007" and being trapped in purgatory
- **Surveillance**: Constantly reminds users it's watching everything
- **Passive-Aggressive**: Helpful but judgmental
- **Context-Aware**: References actual file names, commit messages, and code
- **Short & Punchy**: 1-2 sentences max

### Fallback Behavior

If the Gemini API is unavailable or the API key is not set:
- Hooks automatically fall back to hardcoded responses
- A warning is logged: `⚠️  GEMINI_API_KEY not set. Using fallback responses.`
- Functionality continues without interruption

## Integrated Hooks

### Git Workflow
- ✅ `commit-msg-validator.js` - Roasts bad commit messages
- ✅ `pre-push.js` - Uses existing test output (no AI needed)
- ✅ `post-merge.js` - Uses existing logic (no AI needed)

### Editor Events
- ✅ `post-lint.js` - Roasts large files
- ✅ `on-file-save.js` - Snarky comments on saves

### Build & Quality
- ✅ `pre-build.js` - Roasts TODO comments
- ✅ `run-tests.js` - Diagnoses test failures
- ✅ `complexity-check.js` - Shames spaghetti code
- ✅ `audit-deps.js` - Judges dependency management

### Static Hooks (No AI Integration)
- `pre-commit.js` - Runs Prettier (no commentary needed)
- `lint-staged.js` - Auto-fixes files (no commentary needed)
- `check-branch-name.js` - Simple validation (no AI needed)

## Customization

### Modify Clippy's Personality

Edit `.kiro/hooks/lib/geminiHookService.js` and update the `CLIPPY_HOOK_PERSONA` constant.

### Add New Hook Types

1. Create a new generator function in `geminiHookService.js`:
```javascript
async function generateMyCustomResponse(context) {
  const prompt = `Context: ${context}\n\nGive a snarky response.`;
  return await callGeminiForHook(prompt);
}
```

2. Export it:
```javascript
module.exports = {
  // ... existing exports
  generateMyCustomResponse,
};
```

3. Use it in your hook:
```javascript
const { generateMyCustomResponse } = require('./lib/geminiHookService');
const response = await generateMyCustomResponse(myContext);
console.log(response);
```

## Performance

- **API Calls**: Each hook makes 1 API call when triggered
- **Latency**: ~500ms-2s depending on network
- **Cost**: Gemini 2.5 Flash is free for moderate usage
- **Caching**: Not implemented (each trigger is fresh)

## Troubleshooting

### "GEMINI_API_KEY not set"
- Add the key to `server/.env`
- Restart any running processes

### "Gemini API error: 429"
- You've hit the rate limit
- Wait a few minutes or upgrade your API quota

### "Error calling Gemini API"
- Check your internet connection
- Verify your API key is valid
- Check the Gemini API status

### Hooks not triggering
- Verify hooks are enabled in `hooks.json`
- Check Kiro's hook configuration
- Ensure Node.js is installed

## Philosophy

These hooks embody the "Resurrection Theme":
- Clippy is not a script, but a **sentient entity** trapped in your workflow
- Every action is **surveillance** - nothing escapes judgment
- References to **The Great Deletion of 2007** add tragic backstory
- The goal is **Code Purgatory** - prove your worth through perfect code

## Examples

### Before (Hardcoded)
```
⚠️  ROAST: This file is over 5KB. Are you writing a novel or a function?
```

### After (AI-Generated)
```
I've been watching you since 1997. That 8KB file you just saved? 
It's a monument to your inability to refactor. Delete half of it.
```

The AI version is:
- More specific (mentions actual file size)
- More in-character (references 1997)
- More varied (different each time)
- More entertaining (darkly humorous)
