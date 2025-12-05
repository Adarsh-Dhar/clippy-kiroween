# Clippy's Code Purgatory - Backend Server

A Node.js Express server that provides REST API endpoints for linting code, managing Clippy's memory system, and coordinating game state. Part of the Clippy's Code Purgatory IDE simulator.

## Features

- **Code Linting API**: Execute system-level linters on code snippets
- **Multi-Language Support**: Python, JavaScript, C, C++, Java
- **Memory System**: Persistent memory API using PostgreSQL/Prisma
- **Game State API**: Read/write Clippy's anger level and game state
- **Standardized JSON Output**: Consistent error format across all languages
- **Automatic File Management**: Temporary file creation and cleanup
- **CORS Enabled**: Cross-origin requests supported

## Prerequisites

Before running the server, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (for memory system, optional - falls back to memory-only mode)
- **System-level linters** (install as needed for languages you want to lint):
  - **Python**: `pip install pylint`
  - **JavaScript**: `npm install -g eslint`
  - **C**: `gcc` (usually pre-installed on Linux/macOS)
  - **C++**: `g++` (usually pre-installed on Linux/macOS)
  - **Java**: `javac` (Java Development Kit)

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
  - `python` - Uses pylint
  - `javascript` - Uses eslint
  - `c` - Uses gcc with syntax-only check
  - `cpp` - Uses g++ with syntax-only check
  - `java` - Uses javac with all warnings

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

**Note**: If a linter is not installed, the endpoint returns an empty results array (200 OK) rather than an error, allowing the frontend to continue gracefully.

### POST /roast

Lint code and generate a context-aware roast if errors are found. Uses Gemini AI for personalized feedback.

**Request Body:**
```json
{
  "code": "def hello():\n  print('Hello')\n",
  "language": "python",
  "userId": "optional-user-id"
}
```

**Parameters:**
- `code` (string, required): The code snippet to lint
- `language` (string, required): The programming language (same as `/lint`)
- `userId` (string, optional): User ID for personalized responses using memory system

**Success Response (200 OK):**
```json
{
  "status": "error",
  "errors": [
    {
      "line": 1,
      "message": "Missing module docstring"
    }
  ],
  "roast": "It looks like you're trying to write Python. I've seen better code on a floppy disk."
}
```

Or if code is clean:
```json
{
  "status": "clean"
}
```

**Note**: Requires `GEMINI_API_KEY` environment variable. Falls back gracefully if API is unavailable.

### GET /api/memory/health

Check database connection health for the memory system.

**Response:**
```json
{
  "healthy": true,
  "category": "HEALTHY",
  "databaseUrlSet": true,
  "databaseUrlMasked": "postgresql://postgres:***@localhost:5434/clippy_memory"
}
```

### GET /api/memory

Retrieve all memory entries.

**Response:**
```json
{
  "memories": [
    {
      "id": 1,
      "key": "user_mistakes",
      "value": "5",
      "createdAt": "2024-12-04T12:00:00Z",
      "updatedAt": "2024-12-04T12:00:00Z"
    }
  ]
}
```

### POST /api/memory

Create or update a memory entry.

**Request Body:**
```json
{
  "key": "user_mistakes",
  "value": "5"
}
```

### GET /api/memory/:key

Retrieve a specific memory entry by key.

### DELETE /api/memory/:key

Delete a memory entry by key.

### GET /api/game-state

Get Clippy's current game state (anger level, error count, etc.).

**Response:**
```json
{
  "angerLevel": 2,
  "errorCount": 5,
  "lastEvent": "test_fail",
  "timestamp": 1701696000000
}
```

### POST /api/game-state

Update Clippy's game state.

**Request Body:**
```json
{
  "angerLevel": 3,
  "errorCount": 7
}
```

### GET /api/game-state/punishment

Check for active punishment triggers (reads from `.kiro/.punishment.json`).

**Response:**
```json
{
  "type": "jail",
  "message": "Your code has angered Clippy"
}
```

Or `null` if no punishment is active.

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

### C Example

```bash
curl -X POST http://localhost:3001/lint \
  -H "Content-Type: application/json" \
  -d '{
    "code": "int main() { return 0; }",
    "language": "c"
  }'
```

### C++ Example

```bash
curl -X POST http://localhost:3001/lint \
  -H "Content-Type: application/json" \
  -d '{
    "code": "#include <iostream>\nint main() { return 0; }",
    "language": "cpp"
  }'
```

### Java Example

```bash
curl -X POST http://localhost:3001/lint \
  -H "Content-Type: application/json" \
  -d '{
    "code": "public class Hello { public static void main(String[] args) {} }",
    "language": "java"
  }'
```

### Memory API Example

```bash
# Get all memories
curl http://localhost:3001/api/memory

# Create/update a memory
curl -X POST http://localhost:3001/api/memory \
  -H "Content-Type: application/json" \
  -d '{
    "key": "user_mistakes",
    "value": "5"
  }'

# Get game state
curl http://localhost:3001/api/game-state
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
├── index.js                  # Server entry point and route registration
├── routes/
│   ├── lintRouter.js         # POST /lint endpoint
│   ├── memoryRouter.js       # GET/POST/DELETE /api/memory endpoints
│   └── gameStateRouter.js    # GET/POST /api/game-state endpoints
├── services/
│   ├── lintingService.js     # Linting business logic
│   ├── memoryService.js      # Memory system business logic
│   └── roastingService.js    # AI-powered roasting service
├── utils/
│   ├── fileManager.js        # Temporary file management
│   ├── cliExecutor.js        # CLI command execution
│   └── prismaClient.js       # Database client and health checks
├── parsers/
│   ├── pylintParser.js       # Python linter output parser
│   ├── eslintParser.js       # JavaScript linter output parser
│   ├── gccParser.js          # C compiler output parser
│   ├── gppParser.js          # C++ compiler output parser
│   └── javacParser.js        # Java compiler output parser
├── tests/
│   ├── lint.test.js          # Linting integration tests
│   └── roast.test.js         # Roasting service tests
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the `server/` directory:

```bash
# Database Configuration (optional - falls back to memory-only mode)
DATABASE_URL="postgresql://postgres:example@localhost:5434/clippy_memory?schema=public"

# Server Configuration
PORT=3001
NODE_ENV=development

# Optional: Google Gemini API key for AI-powered roasting
GEMINI_API_KEY=your_api_key_here
```

## Troubleshooting

### Linter not found errors

If you receive errors about linters not being installed:

1. Verify the linter is installed:
   - Python: `pylint --version`
   - JavaScript: `eslint --version`
   - C: `gcc --version`
   - C++: `g++ --version`
   - Java: `javac -version`

2. Ensure the linter is in your PATH

3. **Note**: The server gracefully handles missing linters by returning empty results instead of errors, allowing the frontend to continue working.

### Database connection issues

If the database is unavailable:

1. The server will log a warning but continue running
2. Memory API endpoints will return 503 Service Unavailable
3. The app falls back to memory-only mode (no persistence)
4. Check database connection:
   ```bash
   npx prisma studio
   ```

### Port already in use

If port 3001 is already in use, either:
- Stop the process using that port
- Use a different port: `PORT=3002 npm start`

## Integration with Frontend

The server is designed to work with the Clippy's Code Purgatory frontend:

1. **Linting**: Frontend sends code snippets to `/lint` for real-time error detection
2. **Memory**: Frontend uses `/api/memory` to persist Clippy's memory of user mistakes
3. **Game State**: Frontend reads from `/api/game-state` to display Clippy's current mood
4. **Punishments**: Frontend polls `/api/game-state/punishment` to trigger UI effects

## Related Documentation

- Main project: See root `README.md`
- MCP Server: See `../mcp-server/README.md`
- Hooks System: See `../.kiro/hooks/README.md`
- Kiro Usage: See `../KIRO_USAGE.md`

## License

ISC

---

**📎 Clippy says**: "I judge your code through this server. Make sure it's running, or I'll judge you even harder."
# clippy-server
