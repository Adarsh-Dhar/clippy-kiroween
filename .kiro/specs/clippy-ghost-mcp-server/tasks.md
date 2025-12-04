# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Create `clippy-mcp-server` directory in project root
  - Initialize `package.json` with type: "module" and required dependencies (@modelcontextprotocol/sdk, zod)
  - Create `index.js` as main entry point
  - Add npm scripts for start, dev, and test
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implement MCP server initialization and transport
  - Import required modules from MCP SDK (Server, StdioServerTransport)
  - Create Server instance with server info (name: "clippy-ghost-mcp-server", version: "1.0.0")
  - Initialize StdioServerTransport for stdio communication
  - Connect server to transport
  - Add error handling for uncaught exceptions and signals (SIGINT, SIGTERM)
  - _Requirements: 6.1, 6.2, 6.5, 6.6, 5.5_

- [x] 3. Implement haunt_desktop tool
  - [x] 3.1 Define Zod schema for haunt_desktop tool
    - Create schema with filename (string) and content (string) parameters
    - Add descriptive text for each parameter
    - _Requirements: 1.1, 6.3_
  
  - [x] 3.2 Implement desktop path resolution logic
    - Use os.homedir() to get user home directory
    - Detect platform using os.platform() and append appropriate Desktop path
    - Handle Windows (\\Desktop), macOS (/Desktop), and Linux (/Desktop) paths
    - _Requirements: 1.1, 1.5_
  
  - [x] 3.3 Implement file writing logic with error handling
    - Use fs.writeFileSync to create file at resolved desktop path
    - Wrap in try-catch block to handle errors (permissions, disk space, invalid filename)
    - Return success message with full file path on success
    - Return descriptive error message on failure
    - Log errors to stderr
    - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.3, 5.4_
  
  - [x] 3.4 Register haunt_desktop tool with MCP server
    - Add tool to server's tool list with schema and handler
    - _Requirements: 6.4_

- [x] 4. Implement play_system_sound tool
  - [x] 4.1 Define Zod schema for play_system_sound tool
    - Create schema with type parameter as enum ('error', 'warning', 'success')
    - Add descriptive text for parameter
    - _Requirements: 2.6, 6.3_
  
  - [x] 4.2 Implement platform detection and sound mapping
    - Detect OS using os.platform()
    - Create sound path mapping for each platform and sound type
    - Windows: Map to C:\\Windows\\Media\\ sound files
    - macOS: Map to /System/Library/Sounds/ sound files
    - Linux/Unknown: Use terminal bell fallback
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 4.3 Implement sound playback execution
    - Use child_process.exec to run platform-specific commands
    - Windows: PowerShell with Media.SoundPlayer
    - macOS: afplay command
    - Linux: aplay or paplay command
    - Fallback: Output \u0007 terminal bell character
    - Wrap in try-catch block for error handling
    - Return success confirmation message
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.7, 5.2, 5.3, 5.4_
  
  - [x] 4.4 Register play_system_sound tool with MCP server
    - Add tool to server's tool list with schema and handler
    - _Requirements: 6.4_

- [x] 5. Implement read_project_context tool
  - [x] 5.1 Define Zod schema for read_project_context tool
    - Create schema with directoryPath (string) parameter
    - Add descriptive text for parameter
    - _Requirements: 3.1, 6.3_
  
  - [x] 5.2 Implement directory reading logic
    - Use fs.readdirSync with withFileTypes option
    - For each entry, get file stats using fs.statSync
    - Build result array with name, type (file/directory), and size
    - Sort results with directories first, then alphabetically
    - _Requirements: 3.2, 3.6_
  
  - [x] 5.3 Implement security constraints and error handling
    - Validate path to prevent directory traversal attacks
    - Ensure read-only operations (no modifications)
    - Wrap in try-catch for errors (path not found, permissions, path is file)
    - Return descriptive error messages
    - Log errors to stderr
    - _Requirements: 3.3, 3.4, 3.5, 5.1, 5.3, 5.4, 5.6_
  
  - [x] 5.4 Register read_project_context tool with MCP server
    - Add tool to server's tool list with schema and handler
    - _Requirements: 6.4_

- [x] 6. Implement manage_memory tool
  - [x] 6.1 Define Zod schema for manage_memory tool
    - Create schema with action (enum: 'read'/'write'), key (string), and optional value (string)
    - Add descriptive text for each parameter
    - _Requirements: 4.1, 4.2, 6.3_
  
  - [x] 6.2 Implement memory file initialization
    - Define memory file path as ./clippy_memory.json in server directory
    - Create helper function to ensure file exists with empty object {}
    - _Requirements: 4.3, 4.6_
  
  - [x] 6.3 Implement write operation
    - Read existing memory file or create empty object
    - Parse JSON content
    - Update/add key-value pair
    - Write back to file with pretty formatting (JSON.stringify with indent)
    - Ensure JSON validity after write
    - Return confirmation message with key and value
    - _Requirements: 4.1, 4.4, 4.7_
  
  - [x] 6.4 Implement read operation
    - Read memory file (return null if doesn't exist)
    - Parse JSON content
    - Return value for requested key (or null if key doesn't exist)
    - _Requirements: 4.2, 4.5_
  
  - [x] 6.5 Implement error handling for memory operations
    - Wrap all operations in try-catch blocks
    - Handle JSON parse errors (corrupted file)
    - Handle file permission errors
    - Handle missing value parameter for write action
    - Log errors to stderr
    - Return descriptive error messages
    - _Requirements: 5.1, 5.3, 5.4, 5.5_
  
  - [x] 6.6 Register manage_memory tool with MCP server
    - Add tool to server's tool list with schema and handler
    - _Requirements: 6.4_

- [x] 7. Implement logging and debugging infrastructure
  - Create logging utility that writes only to stderr
  - Add timestamp and log level to all log messages
  - Add debug logs for tool invocations
  - Ensure stdout is reserved exclusively for MCP protocol messages
  - _Requirements: 5.3, 6.7_

- [x] 8. Add comprehensive error handling and process management
  - Add global uncaught exception handler that logs to stderr
  - Add SIGINT and SIGTERM handlers for graceful shutdown
  - Ensure server continues running after individual tool errors
  - Sanitize error messages to avoid exposing sensitive system information
  - _Requirements: 5.5, 5.6_

- [ ]* 9. Create test suite for tool implementations
  - Set up Node.js test framework (node:test)
  - Write unit tests for haunt_desktop (valid inputs, error scenarios)
  - Write unit tests for play_system_sound (platform detection, command generation)
  - Write unit tests for read_project_context (directory reading, security validation)
  - Write unit tests for manage_memory (read/write operations, persistence)
  - Write tests for error scenarios (permissions, invalid paths, corrupted data)
  - Add npm test script to run all tests
  - _Requirements: All requirements validation_

- [x] 10. Create integration testing documentation
  - Document manual testing checklist for each tool
  - Document how to test with Kiro AI integration
  - Document platform-specific testing requirements (Windows, macOS, Linux)
  - Create example MCP configuration for Kiro
  - _Requirements: All requirements validation_
