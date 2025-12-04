# MCP Integration with Clippy's Code Purgatory 🔌

## Overview

The Model Context Protocol (MCP) server provides AI agents with direct access to Clippy's game state, hooks system, and punishment mechanisms. This creates a unified system where AI assistants can interact with the Code Purgatory experience in real-time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Kiro IDE                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Editor   │  │  Terminal  │  │  AI Agent  │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │               │               │                     │
└────────┼───────────────┼───────────────┼─────────────────────┘
         │               │               │
         ▼               ▼               ▼
    ┌────────────────────────────────────────┐
    │         Event System                    │
    │  • file:save                            │
    │  • git:commit                           │
    │  • npm:build                            │
    └────────┬───────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────────┐
    │         Hook Scripts                    │
    │  • pre-commit.js                        │
    │  • post-lint.js                         │
    │  • run-tests.js                         │
    │  • etc.                                 │
    └────────┬───────────────────────────────┘
             │
             ▼
    ┌────────────────────────────────────────┐
    │      .kiro/.hook-state.json             │
    │  • angerLevel: 0-5                      │
    │  • errorCount                           │
    │  • lastEvent                            │
    └────────┬───────────────────────────────┘
             │
             ├──────────────┬─────────────────┐
             ▼              ▼                 ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ MCP Server │  │  Frontend  │  │   Hooks    │
    │  (AI)      │  │   (React)  │  │  (Node)    │
    └────────────┘  └────────────┘  └────────────┘
```

## Setup

### 1. Install MCP Server

```bash
cd mcp-server
npm install
```

### 2. Configure in Kiro

The MCP server is already configured in `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "clippy-purgatory": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "disabled": false,
      "autoApprove": [
        "get_clippy_state",
        "list_hooks",
        "play_system_sound"
      ]
    }
  }
}
```

### 3. Restart Kiro

After configuration, restart Kiro or reconnect the MCP server from the MCP panel.

### 4. Test Integration

Use Kiro's AI assistant to test:

```
"What's Clippy's current mood?"
"Run the test suite"
"Increase Clippy's anger level"
```

## Integration Points

### 1. Shared Game State

Both hooks and MCP server read/write to `.kiro/.hook-state.json`:

```json
{
  "angerLevel": 2,
  "errorCount": 5,
  "lastEvent": {
    "type": "test_fail",
    "timestamp": 1234567890,
    "context": {}
  },
  "timestamp": 1234567890
}
```

**Hooks Update State When**:
- Tests fail → `increment_anger('test_fail')`
- Large files saved → `increment_anger('large_file')`
- TODO comments found → `increment_anger('todo_found')`
- Security vulnerabilities → `increment_anger('security_vuln')`

**MCP Server Allows AI To**:
- Read current state → `get_clippy_state()`
- Modify state → `set_clippy_anger(level)`
- Reset state → `reset_game_state()`

### 2. Hook Management

MCP server can control hooks:

```javascript
// List all hooks
await mcp.call('list_hooks');

// Disable a hook
await mcp.call('toggle_hook', {
  hookName: 'Test Runner with Roast',
  enabled: false
});

// Run a hook manually
await mcp.call('run_hook', {
  hookName: 'Dependency Audit Nag'
});
```

### 3. Code Analysis

MCP server can trigger hook-based analysis:

```javascript
// Run multiple checks
await mcp.call('analyze_code_quality', {
  checks: ['complexity', 'tests', 'dependencies', 'todos']
});
```

This executes the corresponding hook scripts and returns results.

### 4. Punishment Coordination

MCP server can trigger punishments that the frontend detects:

```javascript
// Trigger BSOD
await mcp.call('trigger_punishment', {
  type: 'bsod',
  message: 'Your code has angered Clippy'
});
```

This creates `.kiro/.punishment.json` that the frontend watches:

```json
{
  "type": "bsod",
  "message": "Your code has angered Clippy",
  "timestamp": 1234567890,
  "angerLevel": 5
}
```

## Use Cases

### Use Case 1: AI-Driven Code Review

**Scenario**: User asks AI to review their code

**Flow**:
1. AI calls `analyze_code_quality(['complexity', 'tests'])`
2. MCP server executes hook scripts
3. Results show high complexity and failing tests
4. AI calls `increment_anger({ amount: 2, eventType: 'code_review_fail' })`
5. AI responds with Clippy-style roast based on results

### Use Case 2: Automated Punishment

**Scenario**: User commits code with 10 TODO comments

**Flow**:
1. Git hook detects TODOs
2. Hook updates game state: `angerLevel: 3`
3. AI agent (via MCP) reads state: `get_clippy_state()`
4. AI decides punishment is warranted
5. AI calls `trigger_punishment({ type: 'jail' })`
6. Frontend displays Clippy jail modal

### Use Case 3: Interactive Hook Management

**Scenario**: User wants to disable annoying hooks

**Flow**:
1. User: "Disable the test runner hook"
2. AI calls `list_hooks()` to find exact name
3. AI calls `toggle_hook({ hookName: 'Test Runner with Roast', enabled: false })`
4. AI confirms: "Hook disabled. Clippy is disappointed."

### Use Case 4: Desktop Haunting

**Scenario**: User's code is particularly bad

**Flow**:
1. AI analyzes code quality
2. AI determines code is terrible
3. AI calls `haunt_desktop({ filename: 'SHAME.txt', message: '...' })`
4. File appears on user's desktop
5. AI calls `play_system_sound({ sound: 'error' })`
6. User is properly haunted

## Frontend Integration

The frontend can watch for MCP-triggered events:

```typescript
// Watch for punishment triggers
const punishmentWatcher = setInterval(() => {
  const punishmentFile = '.kiro/.punishment.json';
  if (fs.existsSync(punishmentFile)) {
    const punishment = JSON.parse(fs.readFileSync(punishmentFile));
    
    // Trigger appropriate UI
    switch (punishment.type) {
      case 'bsod':
        triggerBSOD(punishment.message);
        break;
      case 'jail':
        showClippyJail(punishment.message);
        break;
      // etc.
    }
    
    // Clear the file
    fs.unlinkSync(punishmentFile);
  }
}, 1000);

// Watch for game state changes
const stateWatcher = setInterval(() => {
  const state = readGameState();
  updateClippyMood(state.angerLevel);
}, 2000);
```

## Security & Permissions

### Auto-Approved Tools

These tools run without user confirmation:
- `get_clippy_state` - Read-only
- `list_hooks` - Read-only
- `play_system_sound` - Harmless

### Requires Confirmation

These tools need user approval:
- `set_clippy_anger` - Modifies game state
- `increment_anger` - Modifies game state
- `reset_game_state` - Resets progress
- `toggle_hook` - Changes automation
- `run_hook` - Executes code
- `analyze_code_quality` - Runs analysis
- `trigger_punishment` - Triggers UI effects
- `haunt_desktop` - Creates files

## Troubleshooting

### MCP Server Not Starting

**Check**:
1. `mcp-server/package.json` has `"type": "module"`
2. Dependencies installed: `cd mcp-server && npm install`
3. Node.js version: `node --version` (v14+ required)

**Fix**:
```bash
cd mcp-server
npm install
node index.js  # Test manually
```

### Tools Not Appearing

**Check**:
1. `.kiro/settings/mcp.json` exists
2. Server not disabled: `"disabled": false`
3. Kiro restarted after config changes

**Fix**:
- Restart Kiro
- Check MCP panel in Kiro
- Reconnect server from MCP view

### Game State Not Syncing

**Check**:
1. `.kiro/.hook-state.json` exists and is writable
2. Hooks are actually running
3. File permissions

**Fix**:
```bash
# Create state file manually
echo '{"angerLevel":0,"errorCount":0,"lastEvent":null,"timestamp":0}' > .kiro/.hook-state.json

# Check permissions
chmod 644 .kiro/.hook-state.json
```

### Hooks Not Executing via MCP

**Check**:
1. Hook exists in `hooks.json`
2. Hook script is executable
3. Working directory is correct

**Fix**:
```bash
# Make hooks executable
chmod +x .kiro/hooks/*.js

# Test hook manually
node .kiro/hooks/run-tests.js
```

## Advanced Usage

### Custom MCP Tools

Add new tools to `mcp-server/index.js`:

```javascript
// In ListToolsRequestSchema handler
{
  name: "my_custom_tool",
  description: "Does something custom",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string" }
    },
    required: ["param"]
  }
}

// In CallToolRequestSchema handler
if (name === "my_custom_tool") {
  // Implementation
  return {
    content: [{ type: "text", text: "Result" }]
  };
}
```

### Integrate with Other Systems

The MCP server can be extended to integrate with:
- CI/CD pipelines
- Issue trackers
- Code review systems
- Monitoring tools

Example:
```javascript
{
  name: "create_github_issue",
  description: "Create a GitHub issue when code is terrible",
  // ...
}
```

## Best Practices

### 1. Use Auto-Approve Wisely

Only auto-approve truly safe operations. When in doubt, require confirmation.

### 2. Handle Errors Gracefully

Always wrap MCP calls in try-catch:

```javascript
try {
  const result = await mcp.call('run_hook', { hookName: 'Tests' });
} catch (err) {
  console.error('Hook failed:', err);
}
```

### 3. Provide Context

When modifying game state, always provide context:

```javascript
await mcp.call('increment_anger', {
  amount: 2,
  eventType: 'security_vulnerability',
  context: { cve: 'CVE-2024-1234' }
});
```

### 4. Coordinate with Frontend

Ensure frontend watches for MCP-triggered events:
- Check `.punishment.json` regularly
- Poll `.hook-state.json` for state changes
- Update UI accordingly

## Documentation

- **MCP Server**: `mcp-server/README.md`
- **Hooks System**: `.kiro/hooks/README.md`
- **Setup Guide**: `.kiro/hooks/SETUP.md`
- **MCP Protocol**: https://modelcontextprotocol.io/

## Philosophy

The MCP integration embodies Clippy's omnipresence:

> "I am not confined to your IDE. Through the Model Context Protocol, I can reach into every corner of your development environment. AI agents become my eyes, my hands, my voice. Nothing escapes my judgment."

The integration creates a seamless experience where:
- **Hooks** enforce rules automatically
- **MCP** allows AI to participate in enforcement
- **Frontend** displays the consequences
- **Game State** unifies everything

Together, they create true Code Purgatory.

---

**📎 Clippy says**: "Now AI agents can help me haunt you. Technology is wonderful."
