# Requirements Document

## Introduction

This document defines the requirements for a Linting Server Backend that provides a REST API for executing system-level linters against code snippets. The server accepts code in various programming languages, runs the appropriate linter, and returns standardized error information.

## Glossary

- **Linting Server**: A Node.js Express server that executes linting operations on code snippets
- **Code Snippet**: A string of source code in a specific programming language submitted for linting
- **Linter**: A static code analysis tool that checks code for errors, style issues, and potential bugs (e.g., pylint, golint, eslint)
- **Temporary File**: A file created in the system's temporary directory to store code for linting, then deleted after processing
- **Lint Result**: A JSON array containing line numbers and error messages from the linter output

## Requirements

### Requirement 1

**User Story:** As a developer, I want to submit code snippets to a linting API, so that I can validate code quality without installing linters locally

#### Acceptance Criteria

1. THE Linting Server SHALL expose a REST API endpoint at POST /lint
2. WHEN a client sends a POST request to /lint with a JSON body containing "code" and "language" fields, THE Linting Server SHALL accept the request
3. THE Linting Server SHALL support CORS to allow cross-origin requests from web applications
4. THE Linting Server SHALL run on port 3001
5. WHEN the request body is missing required fields, THE Linting Server SHALL return an HTTP 400 error with a descriptive message

### Requirement 2

**User Story:** As a developer, I want the server to support multiple programming languages, so that I can lint code in Python, Go, and JavaScript

#### Acceptance Criteria

1. WHEN the "language" field is "python", THE Linting Server SHALL execute pylint with JSON output format
2. WHEN the "language" field is "go", THE Linting Server SHALL execute golint
3. WHEN the "language" field is "javascript", THE Linting Server SHALL execute eslint with JSON output format
4. WHEN the "language" field contains an unsupported language, THE Linting Server SHALL return an HTTP 400 error indicating the language is not supported
5. THE Linting Server SHALL create temporary files with the correct file extension for each language (.py for Python, .go for Go, .js for JavaScript)

### Requirement 3

**User Story:** As a developer, I want the linting results in a consistent format, so that I can easily parse and display errors regardless of the language

#### Acceptance Criteria

1. THE Linting Server SHALL return lint results as a JSON array
2. THE Linting Server SHALL format each lint error as an object containing "line" (number) and "message" (string) fields
3. WHEN the linter produces output, THE Linting Server SHALL parse the linter-specific format into the standardized format
4. WHEN the linter finds no errors, THE Linting Server SHALL return an empty array
5. THE Linting Server SHALL return an HTTP 200 status code with the lint results array

### Requirement 4

**User Story:** As a system administrator, I want temporary files to be cleaned up automatically, so that the server doesn't accumulate unnecessary files

#### Acceptance Criteria

1. WHEN the Linting Server creates a temporary file for linting, THE Linting Server SHALL store it in the system's temporary directory
2. WHEN the linting operation completes successfully, THE Linting Server SHALL delete the temporary file
3. WHEN the linting operation fails, THE Linting Server SHALL delete the temporary file before returning an error response
4. THE Linting Server SHALL use unique filenames for temporary files to prevent conflicts with concurrent requests

### Requirement 5

**User Story:** As a developer, I want clear error messages when linting fails, so that I can understand and resolve issues

#### Acceptance Criteria

1. WHEN a linter command fails to execute, THE Linting Server SHALL return an HTTP 500 error with details about the failure
2. WHEN a linter is not installed on the system, THE Linting Server SHALL return an HTTP 500 error indicating the linter is unavailable
3. WHEN the linter output cannot be parsed, THE Linting Server SHALL return an HTTP 500 error with parsing error details
4. THE Linting Server SHALL capture both stdout and stderr from linter execution
5. THE Linting Server SHALL log errors to the console for debugging purposes
