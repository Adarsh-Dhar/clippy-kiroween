# Clippy's Ghost MCP Server

A Model Context Protocol server that enables Clippy to haunt your operating system with physical consequences for coding failures.

## Installation

```bash
cd clippy-mcp-server
npm install
```

## Usage

Start the server:
```bash
npm start
```

Run in debug mode:
```bash
npm run dev
```

## Tools

### 1. haunt_desktop
Leaves a physical note on the user's desktop.

**Parameters:**
- `filename` (string): Name of the file to create
- `content` (string): Text content to write

**Example:**
```json
{
  "filename": "CLIPPY_JUDGMENT.txt",
  "content": "Your code is an affront to computing."
}
```

### 2. play_system_sound
Triggers native OS audio alerts.

**Parameters:**
- `type` (enum): 'error', 'warning', or 'success'

**Example:**
```json
{
  "type": "error"
}
```

### 3. read_project_context
Reads file structure for generating specific insults.

**Parameters:**
- `directoryPath` (string): Path to directory to inspect

**Example:**
```json
{
  "directoryPath": "./src"
}
```

### 4. manage_memory
Persists user behavior across sessions.

**Parameters:**
- `action` (enum): 'read' or 'write'
- `key` (string): Memory key
- `value` (string, optional): Value to write

**Example (write):**
```json
{
  "action": "write",
  "key": "angerLevel",
  "value": "5"
}
```

**Example (read):**
```json
{
  "action": "read",
  "key": "angerLevel"
}
```

## Integration Testing

For comprehensive integration testing procedures, platform-specific requirements, and troubleshooting, see **[INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md)**.

### Quick Start Testing

#### Setup
1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Verify server logs appear in stderr

#### Kiro AI Integration

Add to your Kiro MCP configuration (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "clippy-ghost": {
      "command": "node",
      "args": ["./clippy-mcp-server/index.js"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Restart Kiro IDE to load the configuration.

#### Quick Validation

Test each tool manually or via Kiro AI:

1. **haunt_desktop**: Create a test file on Desktop
2. **play_system_sound**: Play an error sound
3. **read_project_context**: Read current directory
4. **manage_memory**: Write and read a test key

See [INTEGRATION_TESTING.md](./INTEGRATION_TESTING.md) for detailed test cases, platform-specific instructions, and troubleshooting

## Troubleshooting

### Server won't start
- Check Node.js version (requires ES modules support)
- Verify dependencies installed: `npm install`
- Check stderr logs for error messages

### Desktop haunting fails
- Verify Desktop directory exists
- Check file write permissions
- Ensure filename doesn't contain invalid characters

### Sounds don't play
- macOS: Verify sound files exist in `/System/Library/Sounds/`
- Windows: Ensure PowerShell is available
- Linux: Install `alsa-utils` or `pulseaudio-utils`

### Memory not persisting
- Check write permissions in server directory
- Verify `clippy_memory.json` is valid JSON
- Check stderr logs for parse errors

## Development

The server logs all activity to stderr:
- `[INFO]`: Normal operations
- `[DEBUG]`: Tool invocations and detailed operations
- `[WARN]`: Non-fatal issues
- `[ERROR]`: Tool execution failures
- `[FATAL]`: Server crashes

Stdout is reserved exclusively for MCP protocol messages.
