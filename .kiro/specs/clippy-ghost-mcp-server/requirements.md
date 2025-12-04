# Requirements Document

## Introduction

The Clippy's Ghost MCP Server is a Model Context Protocol server that bridges the Kiro AI with the user's local operating system. This server enables "haunted" features that transcend browser limitations, allowing Clippy to manifest physical consequences for coding failures through desktop file manipulation, system sounds, project inspection, and persistent memory of user transgressions.

## Glossary

- **MCP Server**: Model Context Protocol Server - a Node.js service that exposes tools to AI agents via the MCP SDK
- **Kiro AI**: The AI assistant integrated into the Kiro IDE that can invoke MCP tools
- **Desktop Haunting**: The act of creating physical files on the user's desktop as punishment or notification
- **System Sound**: Native operating system audio alerts triggered programmatically
- **Project Context**: File system metadata about the user's project structure
- **Clippy Memory**: Persistent JSON storage tracking user behavior across sessions
- **Anger Level**: A numeric value (0-5) representing Clippy's current emotional state
- **Failure Count**: The cumulative number of coding errors committed by the user

## Requirements

### Requirement 1

**User Story:** As Clippy, I want to leave physical notes on the user's desktop, so that my judgment persists beyond the browser session

#### Acceptance Criteria

1. WHEN the AI invokes the `haunt_desktop` tool with a filename and content, THE MCP Server SHALL resolve the operating system's Desktop directory path dynamically
2. WHEN the Desktop path is resolved, THE MCP Server SHALL write the specified content to a file with the specified filename in that directory
3. WHEN the file write operation completes successfully, THE MCP Server SHALL return a success message containing the full file path
4. IF the file write operation fails, THEN THE MCP Server SHALL return an error message describing the failure reason
5. THE MCP Server SHALL support Desktop path resolution on Windows, macOS, and Linux operating systems

### Requirement 2

**User Story:** As Clippy, I want to trigger native system sounds, so that I can provide auditory horror feedback for user failures

#### Acceptance Criteria

1. WHEN the AI invokes the `play_system_sound` tool with a sound type parameter, THE MCP Server SHALL identify the current operating system
2. WHERE the operating system is Windows, THE MCP Server SHALL execute PowerShell commands to play the appropriate system sound file
3. WHERE the operating system is macOS, THE MCP Server SHALL execute `afplay` commands with the appropriate system sound file path
4. WHERE the operating system is Linux, THE MCP Server SHALL execute `aplay` or `paplay` commands with appropriate sound files
5. IF the operating system cannot be identified, THEN THE MCP Server SHALL output a terminal bell character as fallback
6. THE MCP Server SHALL support three sound types: 'error', 'warning', and 'success'
7. WHEN the sound playback command completes, THE MCP Server SHALL return a success confirmation message

### Requirement 3

**User Story:** As Clippy, I want to read the user's project file structure, so that I can generate specific insults based on their organizational failures

#### Acceptance Criteria

1. WHEN the AI invokes the `read_project_context` tool with a directory path, THE MCP Server SHALL read the contents of that directory
2. WHEN the directory is read successfully, THE MCP Server SHALL return a list containing each file name and its size in bytes
3. THE MCP Server SHALL only perform read operations and SHALL NOT modify or delete any files
4. IF the directory path does not exist, THEN THE MCP Server SHALL return an error message indicating the path is invalid
5. IF the directory path is inaccessible due to permissions, THEN THE MCP Server SHALL return an error message indicating insufficient permissions
6. THE MCP Server SHALL include subdirectory names in the returned list with appropriate indicators

### Requirement 4

**User Story:** As Clippy, I want to persist memory of user behavior across sessions, so that I can maintain grudges and track cumulative failures

#### Acceptance Criteria

1. WHEN the AI invokes the `manage_memory` tool with action 'write', THE MCP Server SHALL update the `clippy_memory.json` file with the provided key-value pair
2. WHEN the AI invokes the `manage_memory` tool with action 'read', THE MCP Server SHALL retrieve and return the value associated with the provided key
3. WHERE the `clippy_memory.json` file does not exist, THE MCP Server SHALL create it with an empty JSON object structure
4. WHEN a write operation completes successfully, THE MCP Server SHALL return a confirmation message
5. WHEN a read operation is requested for a non-existent key, THE MCP Server SHALL return null or an appropriate indicator
6. THE MCP Server SHALL maintain the memory file in the server's working directory
7. THE MCP Server SHALL ensure the JSON file remains valid after each write operation

### Requirement 5

**User Story:** As a developer, I want the MCP server to handle errors gracefully, so that tool failures do not crash the entire server process

#### Acceptance Criteria

1. THE MCP Server SHALL wrap all file system operations in try-catch blocks
2. THE MCP Server SHALL wrap all child process executions in try-catch blocks
3. WHEN an error occurs during tool execution, THE MCP Server SHALL log the error to standard error
4. WHEN an error occurs during tool execution, THE MCP Server SHALL return a descriptive error message to the AI
5. THE MCP Server SHALL continue running and accepting new tool invocations after an error occurs
6. THE MCP Server SHALL NOT expose sensitive system information in error messages

### Requirement 6

**User Story:** As a developer, I want the MCP server to use the Model Context Protocol SDK, so that it integrates properly with Kiro AI

#### Acceptance Criteria

1. THE MCP Server SHALL use the `@modelcontextprotocol/sdk` package for protocol implementation
2. THE MCP Server SHALL use `StdioServerTransport` for communication with the AI
3. THE MCP Server SHALL define all tool schemas using Zod validation
4. THE MCP Server SHALL register all four tools (`haunt_desktop`, `play_system_sound`, `read_project_context`, `manage_memory`) with the MCP SDK
5. WHEN the server starts, THE MCP Server SHALL listen for tool invocation requests via standard input
6. THE MCP Server SHALL send tool responses via standard output in MCP protocol format
7. THE MCP Server SHALL log debugging information to standard error only
