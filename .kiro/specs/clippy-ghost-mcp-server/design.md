# Design Document

## Overview

The Clippy's Ghost MCP Server is a Node.js application that implements the Model Context Protocol to expose four system-level tools to the Kiro AI. The server runs as a standalone process communicating via stdio, enabling Clippy to transcend browser limitations and interact directly with the user's operating system for maximum haunting effectiveness.

## Architecture

### High-Level Architecture

```
┌─────────────┐         MCP Protocol (stdio)        ┌──────────────────┐
│   Kiro AI   │ ◄──────────────────────────────────► │   MCP Server     │
│  (Client)   │         JSON-RPC Messages            │   (Node.js)      │
└─────────────┘                                      └──────────────────┘
                                                              │
                                                              │ Invokes
                                                              ▼
                                    ┌─────────────────────────────────────┐
                                    │      Tool Implementations           │
                                    ├─────────────────────────────────────┤
                                    │  • haunt_desktop                    │
                                    │  • play_system_sound                │
                                    │  • read_project_context             │
                                    │  • manage_memory                    │
                                    └─────────────────────────────────────┘
                                                │
                                                │ Interacts with
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │         Operating System Resources            │
                        ├───────────────────────────────────────────────┤
                        │  • File System (Desktop, Project Files)       │
                        │  • Audio System (System Sounds)               │
                        │  • Process Execution (Shell Commands)         │
                        │  • Persistent Storage (clippy_memory.json)    │
                        └───────────────────────────────────────────────┘
```

### Communication Flow

1. Kiro AI sends tool invocation request via stdin (JSON-RPC format)
2. MCP Server receives and validates request using Zod schemas
3. Server executes appropriate tool handler
4. Tool handler interacts with OS resources (file system, processes, etc.)
5. Server returns result via stdout (JSON-RPC format)
6. Errors and debug logs go to stderr only

## Components and Interfaces

### 1. Server Initialization

**Module:** `index.js` (main entry point)

**Responsibilities:**
- Initialize MCP Server instance with stdio transport
- Register all four tools with their schemas
- Set up error handling for uncaught exceptions
- Start listening for requests

**Key Dependencies:**
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
```

### 2. Tool: haunt_desktop

**Schema:**
```javascript
{
  filename: z.string().describe('Name of the file to create on desktop'),
  content: z.string().describe('Text content to write into the file')
}
```

**Implementation Strategy:**
- Use `os.homedir()` to get user's home directory
- Append `/Desktop` for macOS/Linux or `\\Desktop` for Windows
- Use `fs.writeFileSync()` for synchronous file creation
- Return full path on success
- Catch and return descriptive errors (permissions, disk full, etc.)

**Error Scenarios:**
- Desktop directory doesn't exist
- Insufficient write permissions
- Invalid filename characters
- Disk space exhausted

### 3. Tool: play_system_sound

**Schema:**
```javascript
{
  type: z.enum(['error', 'warning', 'success']).describe('Type of system sound to play')
}
```

**Implementation Strategy:**

**Platform Detection:**
```javascript
const platform = os.platform(); // 'win32', 'darwin', 'linux'
```

**Sound Mapping:**

| Type    | Windows Path                          | macOS Path                           | Linux Fallback |
|---------|---------------------------------------|--------------------------------------|----------------|
| error   | C:\\Windows\\Media\\Windows Error.wav | /System/Library/Sounds/Basso.aiff    | beep           |
| warning | C:\\Windows\\Media\\Windows Notify.wav| /System/Library/Sounds/Funk.aiff     | beep           |
| success | C:\\Windows\\Media\\tada.wav          | /System/Library/Sounds/Glass.aiff    | beep           |

**Execution Commands:**
- Windows: `powershell -c "(New-Object Media.SoundPlayer '[path]').PlaySync()"`
- macOS: `afplay [path]`
- Linux: `paplay [path]` or `aplay [path]` or fallback to `echo -e '\u0007'`

**Error Handling:**
- Command execution timeout (5 seconds)
- Sound file not found
- Audio system unavailable

### 4. Tool: read_project_context

**Schema:**
```javascript
{
  directoryPath: z.string().describe('Absolute or relative path to directory to inspect')
}
```

**Implementation Strategy:**
- Resolve relative paths against current working directory
- Use `fs.readdirSync()` with `withFileTypes: true` option
- For each entry, get stats using `fs.statSync()`
- Build result array with structure:
  ```javascript
  {
    name: string,
    type: 'file' | 'directory',
    size: number // bytes, 0 for directories
  }
  ```
- Sort results: directories first, then files alphabetically

**Security Constraints:**
- Read-only operations (no writes, deletes, or modifications)
- No following of symlinks outside project directory
- Path traversal protection (reject paths with `..` that escape project root)

**Error Scenarios:**
- Directory doesn't exist
- Permission denied
- Path is a file, not a directory

### 5. Tool: manage_memory

**Schema:**
```javascript
{
  action: z.enum(['read', 'write']).describe('Operation to perform'),
  key: z.string().describe('Memory key to read or write'),
  value: z.string().optional().describe('Value to write (required for write action)')
}
```

**Implementation Strategy:**

**Memory File Location:**
- Store in server's working directory: `./clippy_memory.json`
- Initialize as empty object `{}` if doesn't exist

**Write Operation:**
1. Read existing memory file (or create empty object)
2. Parse JSON
3. Update/add key-value pair
4. Write back to file with pretty formatting (`JSON.stringify(data, null, 2)`)
5. Return confirmation with key and value

**Read Operation:**
1. Read memory file (return null if doesn't exist)
2. Parse JSON
3. Return value for key (or null if key doesn't exist)

**Data Structure:**
```json
{
  "angerLevel": "3",
  "failureCount": "42",
  "lastInsult": "Your variable names are an affront to computing",
  "sessionStartTime": "2025-12-04T10:30:00Z"
}
```

**Error Scenarios:**
- JSON parse error (corrupted file)
- Write permission denied
- Missing value parameter for write action

## Data Models

### Tool Request (Input)

```typescript
interface ToolRequest {
  method: 'tools/call';
  params: {
    name: string; // Tool name
    arguments: Record<string, unknown>; // Tool-specific parameters
  };
}
```

### Tool Response (Output)

```typescript
interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string; // Result message or error description
  }>;
  isError?: boolean;
}
```

### Memory Storage Schema

```typescript
interface ClippyMemory {
  [key: string]: string; // All values stored as strings for simplicity
}
```

## Error Handling

### Error Handling Strategy

All tool implementations follow this pattern:

```javascript
async function toolHandler(args) {
  try {
    // Validate arguments (Zod handles this)
    // Perform operation
    // Return success response
    return {
      content: [{
        type: 'text',
        text: 'Success message'
      }]
    };
  } catch (error) {
    console.error(`[Tool Error] ${error.message}`, error.stack);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
}
```

### Logging Strategy

- **stdout**: Reserved exclusively for MCP protocol messages
- **stderr**: All debug logs, errors, and diagnostic information
- **Log Format**: `[Timestamp] [Level] Message`

Example:
```
[2025-12-04T10:30:15Z] [INFO] MCP Server started
[2025-12-04T10:30:20Z] [DEBUG] Tool invoked: haunt_desktop
[2025-12-04T10:30:21Z] [ERROR] Failed to write file: EACCES
```

### Critical Error Handling

- Uncaught exceptions: Log to stderr and exit gracefully
- SIGINT/SIGTERM: Clean up resources and exit
- Invalid MCP messages: Log error and continue listening

## Testing Strategy

### Unit Testing Approach

**Test Framework:** Node.js built-in `node:test` module (no external dependencies)

**Test Categories:**

1. **Tool Schema Validation**
   - Valid inputs pass Zod validation
   - Invalid inputs throw validation errors
   - Optional parameters handled correctly

2. **File System Operations**
   - Desktop file creation succeeds with valid inputs
   - Directory reading returns correct file list
   - Memory persistence across read/write cycles
   - Error handling for missing directories

3. **Platform-Specific Logic**
   - Sound command generation for each OS
   - Desktop path resolution for each OS
   - Fallback behavior when platform unknown

4. **Error Scenarios**
   - Permission denied errors
   - Invalid paths
   - Corrupted memory file
   - Missing required parameters

### Integration Testing

**Manual Testing Checklist:**

1. Start MCP server and verify it accepts connections
2. Invoke each tool via Kiro AI and verify responses
3. Check desktop for created files
4. Verify system sounds play on each platform
5. Confirm memory persists across server restarts
6. Test error scenarios (invalid paths, permissions)

### Test Execution

```bash
# Run unit tests
npm test

# Run server in debug mode
npm run dev
```

## Implementation Notes

### Package Configuration

**package.json requirements:**
```json
{
  "name": "clippy-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --inspect index.js",
    "test": "node --test"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "zod": "^3.22.0"
  }
}
```

### Cross-Platform Considerations

- Use `path.join()` for all path operations (handles separators)
- Use `os.EOL` for line endings in generated files
- Test on Windows, macOS, and Linux
- Provide graceful degradation when OS features unavailable

### Performance Considerations

- File operations are synchronous (acceptable for small files)
- Sound playback is fire-and-forget (don't wait for completion)
- Memory file kept small (< 1KB expected)
- No caching needed (operations are infrequent)

### Security Considerations

- Validate all file paths to prevent directory traversal
- Limit file sizes for desktop haunting (max 1MB)
- Read-only access for project context inspection
- No execution of user-provided code
- Sanitize error messages to avoid leaking system info
