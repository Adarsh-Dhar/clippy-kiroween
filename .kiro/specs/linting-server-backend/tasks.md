# Implementation Plan

- [x] 1. Initialize server project structure and dependencies
  - Create `server` directory in project root
  - Initialize package.json with Node.js project configuration
  - Install dependencies: express, cors, body-parser, tmp
  - Create directory structure: routes/, services/, utils/, parsers/
  - _Requirements: 1.4_

- [x] 2. Implement file manager utility
  - [x] 2.1 Create fileManager.js with temp file creation function
    - Write `createTempFile(code, extension)` function using tmp library
    - Ensure unique filename generation for concurrent requests
    - Return filepath for created temporary file
    - _Requirements: 2.5, 4.1, 4.4_
  
  - [x] 2.2 Add temp file deletion function
    - Write `deleteTempFile(filepath)` function
    - Handle errors gracefully if file doesn't exist
    - _Requirements: 4.2, 4.3_

- [x] 3. Implement CLI executor utility
  - [x] 3.1 Create cliExecutor.js with command execution function
    - Write `executeLinter(command, args, filepath)` using child_process
    - Capture stdout and stderr from command execution
    - Set 30-second timeout for linter execution
    - Return object with stdout, stderr, and exitCode
    - _Requirements: 5.4_
  
  - [x] 3.2 Add error handling for command execution
    - Handle command not found errors (linter not installed)
    - Handle timeout errors
    - Log execution errors to console
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 4. Implement output parsers for each language
  - [x] 4.1 Create pylintParser.js
    - Write `parsePylintOutput(stdout, stderr)` function
    - Parse JSON output from pylint
    - Extract line number and message from each error object
    - Return standardized array of { line, message } objects
    - _Requirements: 2.1, 3.1, 3.2, 3.3_
  
  - [x] 4.2 Create golintParser.js
    - Write `parseGolintOutput(stdout, stderr)` function
    - Parse text output using regex (format: file:line:col: message)
    - Extract line numbers and messages
    - Handle empty output (no errors found)
    - Return standardized array of { line, message } objects
    - _Requirements: 2.2, 3.1, 3.2, 3.3_
  
  - [x] 4.3 Create eslintParser.js
    - Write `parseEslintOutput(stdout, stderr)` function
    - Parse JSON output from eslint
    - Extract messages from results array
    - Return standardized array of { line, message } objects
    - _Requirements: 2.3, 3.1, 3.2, 3.3_
  
  - [x] 4.4 Add error handling for parser failures
    - Wrap parsing logic in try-catch blocks
    - Return appropriate error messages when parsing fails
    - _Requirements: 5.3_

- [x] 5. Implement linting service
  - [x] 5.1 Create lintingService.js with language configuration
    - Define LINTER_CONFIG object mapping languages to commands, extensions, and parsers
    - Include configurations for python, go, and javascript
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 5.2 Implement main lintCode function
    - Write `lintCode(code, language)` async function
    - Validate language is supported
    - Create temporary file using fileManager
    - Execute linter using cliExecutor
    - Parse output using appropriate parser
    - Delete temporary file in finally block
    - Return standardized results array
    - _Requirements: 1.2, 3.4, 4.2, 4.3_
  
  - [x] 5.3 Add validation and error handling
    - Validate language parameter against supported languages
    - Return descriptive error for unsupported languages
    - Ensure temp file cleanup on both success and error paths
    - _Requirements: 2.4, 5.1, 5.2, 5.3_

- [x] 6. Implement API router and endpoint
  - [x] 6.1 Create lintRouter.js with POST /lint endpoint
    - Define POST /lint route handler
    - Extract code and language from request body
    - Validate required fields are present
    - Call lintingService.lintCode()
    - Return JSON response with results array
    - _Requirements: 1.1, 1.2, 3.5_
  
  - [x] 6.2 Add request validation and error responses
    - Check for missing code field (return 400)
    - Check for missing language field (return 400)
    - Handle service errors (return 500)
    - Return descriptive error messages in JSON format
    - _Requirements: 1.5, 2.4, 5.1, 5.2, 5.3_

- [x] 7. Create server entry point and configure Express
  - [x] 7.1 Create server/index.js with Express setup
    - Initialize Express application
    - Configure CORS middleware with origin: '*'
    - Configure body-parser with 10mb limit
    - Register lintRouter at root path
    - Start server on port 3001
    - Log server startup message
    - _Requirements: 1.3, 1.4_
  
  - [x] 7.2 Add centralized error handling middleware
    - Create Express error handler middleware
    - Log errors to console
    - Return appropriate HTTP status codes
    - Format error responses consistently
    - _Requirements: 5.5_

- [x] 8. Create integration tests for the API
  - Write tests for POST /lint with valid Python code
  - Write tests for POST /lint with valid Go code
  - Write tests for POST /lint with valid JavaScript code
  - Write tests for missing required fields (400 errors)
  - Write tests for unsupported language (400 error)
  - Write tests for code with no errors (empty results array)
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 3.4, 3.5_

- [x] 9. Create package.json scripts and documentation
  - Add start script to run the server
  - Add dev script with nodemon for development
  - Create README.md with setup instructions
  - Document required linter installations (pylint, golint, eslint)
  - Document API endpoint usage with examples
  - _Requirements: 1.4_


- [ ] 10. Implement C language support with gcc
  - [ ] 10.1 Create gccParser.js for C compiler output
    - Write `parseGccOutput(stdout, stderr)` function
    - Attempt to parse JSON output format first (if -fdiagnostics-format=json is supported)
    - Implement fallback text parsing using regex pattern `filename:line:col: (error|warning): message`
    - Extract line numbers and messages from stderr
    - Return standardized array of { line, message } objects
    - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 10.2 Add C language configuration to lintingService
    - Add 'c' entry to LINTER_CONFIG with extension '.c', command 'gcc', and args ['-fsyntax-only', '-fdiagnostics-format=json']
    - Wire up gccParser to the C language configuration
    - _Requirements: 2.4, 2.8_
  
  - [ ] 10.3 Test C linting with sample code
    - Create test cases with C code containing syntax errors
    - Verify gcc execution and output parsing
    - Test both JSON and text output format handling
    - _Requirements: 2.4, 7.1, 7.2_

- [ ] 11. Implement C++ language support with g++
  - [ ] 11.1 Create gppParser.js for C++ compiler output
    - Write `parseGppOutput(stdout, stderr)` function
    - Attempt to parse JSON output format first (if -fdiagnostics-format=json is supported)
    - Implement fallback text parsing using regex pattern `filename:line:col: (error|warning): message`
    - Extract line numbers and messages from stderr
    - Return standardized array of { line, message } objects
    - _Requirements: 2.5, 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 11.2 Add C++ language configuration to lintingService
    - Add 'cpp' entry to LINTER_CONFIG with extension '.cpp', command 'g++', and args ['-fsyntax-only', '-fdiagnostics-format=json']
    - Wire up gppParser to the C++ language configuration
    - _Requirements: 2.5, 2.8_
  
  - [ ] 11.3 Test C++ linting with sample code
    - Create test cases with C++ code containing syntax errors
    - Verify g++ execution and output parsing
    - Test both JSON and text output format handling
    - _Requirements: 2.5, 7.1, 7.2_

- [ ] 12. Implement Java class name extraction for proper file naming
  - [ ] 12.1 Add extractJavaClassName function to fileManager
    - Write `extractJavaClassName(code)` function using regex pattern `public\s+class\s+(\w+)`
    - Return extracted class name if found, otherwise return 'Main'
    - Sanitize class name to prevent directory traversal attacks
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 12.2 Update createTempFile to support custom filenames
    - Modify `createTempFile(code, extension, customName)` to accept optional customName parameter
    - When customName is provided, use it instead of auto-generated name
    - Ensure unique filenames even with custom names (append random suffix if needed)
    - _Requirements: 6.2, 6.4_

- [ ] 13. Implement Java language support with javac
  - [ ] 13.1 Create javacParser.js for Java compiler output
    - Write `parseJavacOutput(stdout, stderr)` function
    - Parse stderr text output using regex pattern `\w+\.java:(\d+): (error|warning): (.+)`
    - Handle multi-line error messages by capturing continuation lines
    - Extract line numbers and messages
    - Return standardized array of { line, message } objects
    - _Requirements: 2.6, 3.1, 3.2, 3.3_
  
  - [ ] 13.2 Add Java language configuration to lintingService
    - Add 'java' entry to LINTER_CONFIG with extension '.java', command 'javac', args ['-Xlint:all']
    - Set requiresClassNameExtraction flag to true for Java
    - Wire up javacParser to the Java language configuration
    - _Requirements: 2.6, 2.8_
  
  - [ ] 13.3 Update lintCode function to handle Java class name extraction
    - Check if language config has requiresClassNameExtraction flag
    - If true, extract class name from code using fileManager.extractJavaClassName()
    - Pass custom filename to createTempFile for Java files
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 13.4 Test Java linting with sample code
    - Create test cases with Java code containing public class declarations
    - Test with code containing no public class (should use Main.java)
    - Verify javac execution and output parsing
    - Test that filename matches class name
    - _Requirements: 2.6, 6.1, 6.2, 6.3_

- [ ] 14. Update API documentation and tests for new languages
  - [ ] 14.1 Update server README with new language support
    - Document C, C++, and Java language support
    - Add installation instructions for gcc, g++, and javac
    - Provide example API requests for each new language
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [ ] 14.2 Add integration tests for C, C++, and Java
    - Write tests for POST /lint with valid C code
    - Write tests for POST /lint with valid C++ code
    - Write tests for POST /lint with valid Java code
    - Write tests for Java class name extraction scenarios
    - Verify error responses are in standardized format
    - _Requirements: 2.4, 2.5, 2.6, 6.1, 6.2, 6.3_
