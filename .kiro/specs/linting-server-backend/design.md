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
  language: string   // Required: 'python' | 'go' | 'javascript' | 'c' | 'cpp' | 'java'
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
  },
  c: {
    extension: '.c',
    command: 'gcc',
    args: ['-fsyntax-only', '-fdiagnostics-format=json'],
    parser: parseGccOutput
  },
  cpp: {
    extension: '.cpp',
    command: 'g++',
    args: ['-fsyntax-only', '-fdiagnostics-format=json'],
    parser: parseGppOutput
  },
  java: {
    extension: '.java',
    command: 'javac',
    args: ['-Xlint:all'],
    parser: parseJavacOutput,
    requiresClassNameExtraction: true
  }
}
```

### 4. File Manager (`server/utils/fileManager.js`)

**Functions:**
```javascript
// Create temporary file with code content
async function createTempFile(code, extension, customName)

// Delete temporary file
async function deleteTempFile(filepath)

// Extract Java class name from code
function extractJavaClassName(code)
```

**Implementation Details:**
- Uses `tmp` library for temporary file creation
- Generates unique filenames to prevent conflicts
- Ensures cleanup in both success and error cases
- For Java files, supports custom filename based on public class name
- Uses regex pattern `public class (\w+)` to extract Java class names
- Defaults to "Main.java" if no public class is found

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

**`gccParser.js`:**
- Attempts to parse JSON output from gcc (if -fdiagnostics-format=json is supported)
- Falls back to parsing stderr text output using regex pattern `filename:line:col: error: message`
- Extracts line number and error message from compiler diagnostics
- Handles both error and warning messages

**`gppParser.js`:**
- Attempts to parse JSON output from g++ (if -fdiagnostics-format=json is supported)
- Falls back to parsing stderr text output using regex pattern `filename:line:col: error: message`
- Extracts line number and error message from compiler diagnostics
- Handles both error and warning messages

**`javacParser.js`:**
- Parses stderr text output from javac
- Uses regex to extract errors in format `Filename.java:line: error: message`
- Handles warning messages with format `Filename.java:line: warning: message`
- Extracts line numbers and messages into standardized format

## Data Models

### Lint Request
```typescript
interface LintRequest {
  code: string;
  language: 'python' | 'go' | 'javascript' | 'c' | 'cpp' | 'java';
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
- Test full /lint endpoint with valid code samples for all six languages
- Test error cases (invalid language, missing fields)
- Test concurrent requests to ensure file cleanup
- Test with actual linter tools installed
- Test Java class name extraction with various class declarations
- Test C/C++ with both JSON and text output formats
- Test compiler error messages are correctly parsed

### Manual Testing
- Verify linters are installed (pylint, golint, eslint)
- Test with various code samples containing errors
- Test with valid code (no errors)
- Test with large code snippets
- Verify CORS headers allow cross-origin requests

## Language-Specific Implementation Details

### C and C++ (gcc/g++)
- Use `-fsyntax-only` flag to check syntax without generating binaries
- Use `-fdiagnostics-format=json` flag for structured output (if supported by compiler version)
- Fallback to parsing stderr text output if JSON format is not available
- Text format pattern: `filename:line:col: error/warning: message`
- Both stdout and stderr should be captured for comprehensive error reporting

### Java (javac)
- Requires filename to match public class name for successful compilation
- Extract class name using regex: `/public\s+class\s+(\w+)/`
- If no public class found, use default filename "Main.java"
- Use `-Xlint:all` flag to enable all compiler warnings
- Parse stderr output in format: `Filename.java:line: error/warning: message`
- Handle multi-line error messages by capturing continuation lines

### Compiler Version Compatibility
- gcc/g++ JSON output format available in GCC 9.0+
- For older versions, gracefully fall back to text parsing
- Test both JSON and text parsing paths during implementation

## Security Considerations

1. **Input Validation**: Strictly validate language parameter to prevent command injection
2. **File Isolation**: Use system temp directory with unique filenames
3. **Resource Limits**: Set body size limit (10mb) and command timeout (30s)
4. **No Code Execution**: Only run predefined linter commands, never execute user code directly
5. **Error Messages**: Avoid exposing system paths or internal details in error responses
6. **Java Class Name Extraction**: Sanitize extracted class names to prevent directory traversal attacks

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
- Requires system-level linters/compilers installed:
  - Python: `pylint`
  - Go: `golint`
  - JavaScript: `eslint`
  - C: `gcc`
  - C++: `g++`
  - Java: `javac` (JDK)
- Environment variable for port (default: 3001)
- Suitable for containerization (Docker)
- For Docker deployments, ensure build-essential (gcc/g++) and default-jdk packages are installed
