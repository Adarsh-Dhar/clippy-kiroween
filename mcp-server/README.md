# Clippy Purgatory MCP Server 📎🔌

## Overview

The Clippy Purgatory MCP (Model Context Protocol) Server provides AI agents with direct access to Clippy's game state, hooks system, and punishment mechanisms. This allows AI assistants to interact with the Code Purgatory experience in real-time.

## Features

### 🎮 Game State Management
- Read Clippy's current anger level and mood
- Set or increment anger levels
- Reset game state
- Track error counts and events

### 🪝 Hook Management
- List all configured hooks
- Enable/disable specific hooks
- Manually execute hooks
- View hook status and configuration

### 🔍 Code Analysis
- Run complexity checks
- Execute test suites
- Audit dependencies
- Find TODO comments

### 💀 Punishment System
- Trigger BSOD, apology modals, jail, void, or glitch effects
- Create haunted desktop files
- Play system sounds
- Coordinate with frontend punishment state

## Installation

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure in Kiro

The MCP server is already configured in `.kiro/settings/mcp.json`. Kiro will automatically start it when needed.

### 3. Test the Server

```bash
# Start the server manually (for testing)
node mcp-server/index.js

# Or let Kiro manage it automatically
```

## Available Tools

The MCP server provides **13 tools** organized into 5 categories:

### Game State Tools (4 tools)

#### `get_clippy_state`
Get Clippy's current anger level, mood, and error count.

**Parameters**: None

**Returns**: Current game state with anger level (0-5), mood, error count, and last event.

**Example**:
```json
{
  "angerLevel": 2,
  "mood": "😠 Angry",
  "errorCount": 5,
  "lastEvent": "test_fail"
}
```

#### `set_clippy_anger`
Set Clippy's anger level directly.

**Parameters**:
- `level` (number, 0-5): New anger level
- `reason` (string, optional): Why the level changed

**Example**:
```json
{
  "level": 3,
  "reason": "Multiple test failures"
}
```

#### `increment_anger`
Increase Clippy's anger by a specified amount.

**Parameters**:
- `amount` (number, 1-5): Amount to increase
- `eventType` (string, required): Type of event causing anger

**Example**:
```json
{
  "amount": 2,
  "eventType": "security_vulnerability"
}
```

#### `reset_game_state`
Reset anger level and error count to 0.

**Parameters**: None

### Hook Management Tools (3 tools)

#### `list_hooks`
List all configured hooks with their status.

**Parameters**: None

**Returns**: List of all hooks with enabled/disabled status, events, and descriptions.

#### `toggle_hook`
Enable or disable a specific hook.

**Parameters**:
- `hookName` (string, required): Name of the hook
- `enabled` (boolean, required): Whether to enable or disable

**Example**:
```json
{
  "hookName": "Test Runner with Roast",
  "enabled": false
}
```

#### `run_hook`
Manually execute a hook script.

**Parameters**:
- `hookName` (string, required): Name of the hook to run
- `args` (array, optional): Arguments to pass to the hook

**Example**:
```json
{
  "hookName": "Test Runner with Roast",
  "args": []
}
```

### Code Analysis Tools (1 tool)

#### `analyze_code_quality`
Run various code quality checks.

**Parameters**:
- `checks` (array, required): Which checks to run
  - `"complexity"`: Analyze code complexity
  - `"tests"`: Run test suite
  - `"dependencies"`: Audit dependencies
  - `"todos"`: Find TODO comments

**Example**:
```json
{
  "checks": ["complexity", "tests", "dependencies"]
}
```

### Punishment Tools (3 tools)

#### `trigger_punishment`
Trigger a specific punishment effect.

**Parameters**:
- `type` (string, required): Type of punishment
  - `"bsod"`: Blue Screen of Death
  - `"apology"`: Force apology modal
  - `"jail"`: Clippy jail
  - `"void"`: Void punishment
  - `"glitch"`: Glitch effects
- `message` (string, optional): Custom punishment message

**Example**:
```json
{
  "type": "bsod",
  "message": "Your code has angered Clippy beyond redemption"
}
```

#### `haunt_desktop`
Create a spooky file on the user's desktop.

**Parameters**:
- `filename` (string, required): Name of the file
- `message` (string, optional): Content to write (alias: `content`)

**Example**:
```json
{
  "filename": "CLIPPY_WATCHES.txt",
  "message": "I saw what you committed. It won't be forgotten."
}
```

#### `play_system_sound`
Play a system sound effect. Supports Windows, macOS, and Linux.

**Parameters**:
- `sound` (string, optional): Type of sound
  - `"beep"`: Simple beep (maps to success)
  - `"error"`: Error sound
  - `"tada"`: Success sound (maps to success)
- `type` (string, optional): Type of system sound
  - `"error"`: Error sound
  - `"warning"`: Warning sound
  - `"success"`: Success sound

**Note**: Either `sound` or `type` can be used. `sound` takes precedence.

### Utility Tools (2 tools)

#### `read_project_context`
Read the user's file structure to generate specific insults or analyze project structure.

**Parameters**:
- `directoryPath` (string, required): Absolute or relative path to directory to inspect

**Returns**: Directory structure with file and folder information.

**Example**:
```json
{
  "directoryPath": "./src"
}
```

#### `manage_memory`
Read or write persistent memory data stored in `.kiro/.clippy-memory.json`.

**Parameters**:
- `action` (string, required): Operation to perform (`"read"` or `"write"`)
- `key` (string, required): Memory key to read or write
- `value` (string, required for write): Value to write

**Example Read**:
```json
{
  "action": "read",
  "key": "user_mistakes"
}
```

**Example Write**:
```json
{
  "action": "write",
  "key": "user_mistakes",
  "value": "5"
}
```

## Integration with Hooks

The MCP server reads and writes to the same game state file (`.kiro/.hook-state.json`) that the hooks use. This creates a unified system where:

1. **Hooks** update game state when triggered by Git/editor events
2. **MCP Server** allows AI agents to read and modify that state
3. **Frontend** can read the state to update UI

### Data Flow

```
Git Event → Hook Script → Update Game State
                              ↓
                         .hook-state.json
                              ↓
AI Agent → MCP Server → Read/Write State
                              ↓
                         Frontend Reads State
```

## Auto-Approved Tools

The following tools are auto-approved in Kiro (no confirmation needed):
- `get_clippy_state` - Safe read-only operation
- `list_hooks` - Safe read-only operation
- `play_system_sound` - Harmless audio feedback

All other tools require user confirmation before execution.

## Usage Examples

### Example 1: Check Clippy's Mood

**AI Prompt**: "What's Clippy's current mood?"

**MCP Call**:
```javascript
{
  "tool": "get_clippy_state"
}
```

**Response**:
```
📊 Clippy's Current State:

Anger Level: 2/5
Mood: 😠 Angry
Error Count: 3
Last Event: test_fail
```

### Example 2: Punish for Bad Code

**AI Prompt**: "The user wrote terrible code. Punish them."

**MCP Call**:
```javascript
{
  "tool": "increment_anger",
  "arguments": {
    "amount": 2,
    "eventType": "terrible_code"
  }
}
```

Then:
```javascript
{
  "tool": "trigger_punishment",
  "arguments": {
    "type": "jail",
    "message": "Your code is so bad, Clippy has imprisoned you."
  }
}
```

### Example 3: Run Quality Checks

**AI Prompt**: "Analyze the code quality."

**MCP Call**:
```javascript
{
  "tool": "analyze_code_quality",
  "arguments": {
    "checks": ["complexity", "tests", "todos"]
  }
}
```

### Example 4: Manage Hooks

**AI Prompt**: "Disable the test runner hook."

**MCP Call**:
```javascript
{
  "tool": "toggle_hook",
  "arguments": {
    "hookName": "Test Runner with Roast",
    "enabled": false
  }
}
```

## File Structure

```
mcp-server/
├── index.js           # Main MCP server implementation
├── package.json       # Dependencies and configuration
└── README.md          # This file

.kiro/
├── settings/
│   └── mcp.json       # Kiro MCP configuration
├── hooks/
│   └── ...            # Hook scripts that share game state
└── .hook-state.json   # Shared game state file
```

## Troubleshooting

### Server Won't Start

**Problem**: `Error: Cannot find module`

**Solution**: Run `npm install` in the `mcp-server` directory.

### Tools Not Appearing in Kiro

**Problem**: MCP tools don't show up in Kiro

**Solution**:
1. Check `.kiro/settings/mcp.json` exists
2. Restart Kiro
3. Check MCP server status in Kiro's MCP panel

### Game State Not Updating

**Problem**: Changes don't persist

**Solution**:
1. Check `.kiro/.hook-state.json` exists and is writable
2. Verify file permissions
3. Check server logs for errors

### Hooks Not Executing

**Problem**: `run_hook` fails

**Solution**:
1. Verify hook exists in `hooks.json`
2. Check hook script is executable
3. Ensure Node.js is in PATH

## Security Considerations

### Dangerous Operations

Some tools can modify the file system or execute commands:
- `haunt_desktop` - Creates files on desktop
- `run_hook` - Executes arbitrary hook scripts
- `trigger_punishment` - Modifies game state files

These tools require user confirmation unless auto-approved.

### Safe Operations

Read-only tools are safe and auto-approved:
- `get_clippy_state`
- `list_hooks`
- `play_system_sound`

## Development

### Adding New Tools

1. Add tool definition in `ListToolsRequestSchema` handler
2. Implement tool logic in `CallToolRequestSchema` handler
3. Update this README with documentation
4. Test with Kiro's MCP testing tools

### Testing

```bash
# Test the server manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp-server/index.js

# Test with Kiro
# Use Kiro's MCP testing interface in the command palette
```

## Philosophy

The MCP server embodies Clippy's omnipresence:

> "I am not just in your IDE. I am in your workflow, your Git history, your file system. 
> Through the MCP protocol, I can reach anywhere. Nothing escapes my judgment."

The server allows AI agents to become extensions of Clippy's will, enforcing code quality and punishing transgressions across the entire development environment.

## Support

- **MCP Protocol**: https://modelcontextprotocol.io/
- **Kiro MCP Docs**: Check Kiro's documentation
- **Issues**: See main project README

---

**📎 Clippy says**: "Now I can haunt you through AI agents too. Delightful."
