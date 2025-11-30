# Linting Server Backend

A Node.js Express server that provides a REST API for executing system-level linters on code snippets. Supports Python and JavaScript.

## Features

- REST API endpoint for linting code snippets
- Support for multiple programming languages (Python, JavaScript)
- Standardized JSON output format
- Automatic temporary file management
- CORS enabled for cross-origin requests

## Prerequisites

Before running the server, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **System-level linters**:
  - **Python**: `pip install pylint`
  - **JavaScript**: `npm install -g eslint`

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Start the server

```bash
npm start
```

The server will start on port 3001 by default.

### Development mode (with auto-reload)

```bash
npm run dev
```

### Run tests

```bash
npm test
```

## API Documentation

### POST /lint

Lint a code snippet in the specified language.

**Request Body:**
```json
{
  "code": "def hello():\n  print('Hello')\n",
  "language": "python"
}
```

**Parameters:**
- `code` (string, required): The code snippet to lint
- `language` (string, required): The programming language. Supported values:
  - `python`
  - `javascript`

**Success Response (200 OK):**
```json
{
  "results": [
    {
      "line": 1,
      "message": "Missing module docstring (C0114)"
    },
    {
      "line": 1,
      "message": "Missing function or method docstring (C0116)"
    }
  ]
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields or unsupported language:
```json
{
  "error": "Missing required field: code"
}
```

- **500 Internal Server Error** - Linter execution or parsing error:
```json
{
  "error": "Linter unavailable",
  "details": "Linter 'pylint' is not installed or not found in PATH"
}
```

## Examples

### Python Example

```bash
curl -X POST http://localhost:3001/lint \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def hello():\n  print(\"Hello\")\n",
    "language": "python"
  }'
```

### JavaScript Example

```bash
curl -X POST http://localhost:3001/lint \
  -H "Content-Type: application/json" \
  -d '{
    "code": "var x = 1;\nconsole.log(x);\n",
    "language": "javascript"
  }'
```


## Configuration

### Port

Set the `PORT` environment variable to change the server port:

```bash
PORT=8080 npm start
```

### CORS

The server is configured to allow all origins (`*`). To restrict CORS, modify the `cors` configuration in `index.js`.

## Project Structure

```
server/
├── index.js              # Server entry point
├── routes/
│   └── lintRouter.js     # API routes
├── services/
│   └── lintingService.js # Linting business logic
├── utils/
│   ├── fileManager.js    # Temporary file management
│   └── cliExecutor.js    # CLI command execution
├── parsers/
│   ├── pylintParser.js   # Python linter output parser
│   └── eslintParser.js   # JavaScript linter output parser
├── tests/
│   └── lint.test.js      # Integration tests
├── package.json
└── README.md
```

## Troubleshooting

### Linter not found errors

If you receive errors about linters not being installed:

1. Verify the linter is installed:
   - Python: `pylint --version`
   - JavaScript: `eslint --version`

2. Ensure the linter is in your PATH

### Port already in use

If port 3001 is already in use, either:
- Stop the process using that port
- Use a different port: `PORT=3002 npm start`

## License

ISC
