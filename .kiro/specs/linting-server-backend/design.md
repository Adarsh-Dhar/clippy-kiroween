# Design Document

## Overview

The Linting Server Backend is a Node.js Express application that provides a REST API for executing system-level linters on code snippets. The server accepts code in multiple programming languages (Python, Go, JavaScript), writes the code to temporary files, executes the appropriate linter CLI tool, parses the output into a standardized JSON format, and returns the results to the client.

## Architecture

The system follows a simple three-layer architecture:

1. **API Layer**: Express routes and middleware for handling HTTP requests
2. **Service Layer**: Business logic for linting operations, file management, and output parsing
3. **Execution Layer**: Child process management for running linter CLI commands

```
Client Request → Express Router → Linting Service → CLI Executor → Linter Tool
                                        ↓
                                  File Manager
                                        ↓
                                  Output Parser
                                        ↓
Client Response ← Express Router ← Standardized Results
```

## Components and Interfaces

### 1. Server Entry Point (`server/index.js`)

**Responsibilities:**
- Initialize Express application
- Configure middleware (CORS, body-parser)
- Register routes
- Start server on port 3001

**Configuration:**
```javascript
{
  port: 3001,
  cors: { origin: '*' },
  bodyParser: { limit: '10mb' }
}
```

### 2. Linting Router (`server/routes/lintRouter.js`)

**Endpoint:**
- `POST /lint`

**Request Schema:**
```typescript
{
  code: string,      // Required: The code snippet to lint
  language: string   // Required: 'python' | 'go' | 'javascript'
}
```

**Response Schema:**
```typescript
{
  results: Array<{
    line: number,
    message: string
  }>
}
```

**Error Responses:**
- 400: Invalid request (missing fields, unsupported language)
- 500: Linting execution error

### 3. Linting Service (`server/services/lintingService.js`)

**Main Function:**
```javascript
async function lintCode(code, language)
```

**Workflow:**
1. Validate language support
2. Create temporary file with appropriate extension
3. Execute linter command
4. Parse linter output
5. Clean up temporary file
6. Return standardized results

**Language Configuration:**
```javascript
const LINTER_CONFIG = {
  python: {
    extension: '.py',
    command: 'pylint',
    args: ['--output-format=json'],
    parser: parsePylintOutput
  },
  go: {
    extension: '.go',
    command: 'golint',
    args: [],
    parser: parseGolintOutput
  },
  javascript: {
    extension: '.js',
    command: 'eslint',
    args: ['--format=json'],
    parser: parseEslintOutput
  }
}
```

### 4. File Manager (`server/utils/fileManager.js`)

**Functions:**
```javascript
// Create temporary file with code content
async function createTempFile(code, extension)

// Delete temporary file
async function deleteTempFile(filepath)
```

**Implementation Details:**
- Uses `tmp` library for temporary file creation
- Generates unique filenames to prevent conflicts
- Ensures cleanup in both success and error cases

### 5. CLI Executor (`server/utils/cliExecutor.js`)

**Function:**
```javascript
async function executeLinter(command, args, filepath)
```

**Returns:**
```javascript
{
  stdout: string,
  stderr: string,
  exitCode: number
}
```

**Implementation:**
- Uses Node.js `child_process.exec` or `spawn`
- Captures both stdout and stderr
- Handles command execution errors
- Sets reasonable timeout (e.g., 30 seconds)

### 6. Output Parsers (`server/parsers/`)

**Parser Interface:**
```javascript
function parseOutput(stdout, stderr) {
  return Array<{ line: number, message: string }>
}
```

**Individual Parsers:**

**`pylintParser.js`:**
- Parses JSON output from pylint
- Extracts line number and message from each error object
- Handles pylint-specific error codes and categories

**`golintParser.js`:**
- Parses text output from golint (format: `file:line:col: message`)
- Uses regex to extract line numbers and messages
- Handles cases where golint returns no output (no errors)

**`eslintParser.js`:**
- Parses JSON output from eslint
- Extracts messages from the results array
- Handles multiple files (though we only lint one)

## Data Models

### Lint Request
```typescript
interface LintRequest {
  code: string;
  language: 'python' | 'go' | 'javascript';
}
```

### Lint Result
```typescript
interface LintResult {
  line: number;
  message: string;
}
```

### Lint Response
```typescript
interface LintResponse {
  results: LintResult[];
}
```

### Error Response
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
}
```

## Error Handling

### Validation Errors (400)
- Missing `code` field
- Missing `language` field
- Unsupported language value

### Execution Errors (500)
- Linter command not found (linter not installed)
- File system errors (cannot create/delete temp file)
- Command execution timeout
- Parser errors (cannot parse linter output)

### Error Handling Strategy
1. Wrap all async operations in try-catch blocks
2. Ensure temporary files are deleted in finally blocks
3. Log all errors to console with context
4. Return user-friendly error messages (avoid exposing system details)
5. Use Express error handling middleware for centralized error responses

## Testing Strategy

### Unit Tests
- Test each parser with sample linter outputs
- Test file manager create/delete operations
- Test CLI executor with mock commands
- Test input validation logic

### Integration Tests
- Test full /lint endpoint with valid code samples
- Test error cases (invalid language, missing fields)
- Test concurrent requests to ensure file cleanup
- Test with actual linter tools installed

### Manual Testing
- Verify linters are installed (pylint, golint, eslint)
- Test with various code samples containing errors
- Test with valid code (no errors)
- Test with large code snippets
- Verify CORS headers allow cross-origin requests

## Security Considerations

1. **Input Validation**: Strictly validate language parameter to prevent command injection
2. **File Isolation**: Use system temp directory with unique filenames
3. **Resource Limits**: Set body size limit (10mb) and command timeout (30s)
4. **No Code Execution**: Only run predefined linter commands, never execute user code directly
5. **Error Messages**: Avoid exposing system paths or internal details in error responses

## Performance Considerations

1. **Async Operations**: Use async/await for all I/O operations
2. **Concurrent Requests**: Support multiple simultaneous linting requests
3. **Timeout**: Prevent long-running linter processes from blocking
4. **Memory**: Clean up temporary files immediately after use
5. **Response Time**: Target < 5 seconds for typical code snippets

## Dependencies

```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "body-parser": "^1.20.0",
  "tmp": "^0.2.1"
}
```

## Deployment Notes

- Requires Node.js 16+ runtime
- Requires system-level linters installed: `pylint`, `golint`, `eslint`
- Environment variable for port (default: 3001)
- Suitable for containerization (Docker)
