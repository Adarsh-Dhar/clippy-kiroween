# Clippy's Code Purgatory 📎

A Windows 95-themed IDE simulator where the resurrected Microsoft Office Assistant judges your code quality with passive-aggressive commentary. Built with React, TypeScript, Express.js, Gemini AI, and Clippy.js.

## Features

- **Windows 95 Authentic UI**: Pixel-perfect retro styling with beveled borders and authentic color palette
- **Clippy Agent**: Animated Clippy that reacts to your code quality, typing speed, and mouse movements
- **Code Linting**: Real-time linting support for Python, JavaScript, Go, C, C++, and Java
- **Memory System**: Persistent memory using PostgreSQL/Prisma to remember your coding mistakes
- **Game State**: Anger level system (0-5) that triggers punishments and animations
- **MCP Integration**: 13 MCP tools for AI agent control and coordination
- **Automated Hooks**: 12 Git/editor hooks with AI-powered roasts and quality checks
- **Punishment System**: BSOD, jail, void, apology modals, and glitch effects

## Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL (via Docker Compose)
- Python 3+ (for Python linting)
- System linters (see below)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:
   ```bash
   # Database Configuration
   DATABASE_URL="postgresql://postgres:example@localhost:5434/clippy_memory?schema=public"
   
   # API Configuration
   VITE_API_URL="http://localhost:3001"
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   
   # Optional: Google Gemini API key for AI-generated feedback
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

   Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey) (optional but recommended)

3. **Start the database**:
   ```bash
   docker compose up -d db
   ```

4. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   Or for development:
   ```bash
   npx prisma migrate dev
   ```

5. **Set up the linting server**:
   ```bash
   cd server
   npm install
   ```

   Install system linters:
   - Python: `pip install pylint`
   - JavaScript: `npm install -g eslint`
   - Go: `go install golang.org/x/tools/cmd/goimports@latest`
   - C/C++: `gcc` and `g++` should be installed
   - Java: `javac` should be installed

6. **Start the backend server**:
   ```bash
   cd server
   npm start
   ```

   The server runs on port 3001 by default.

7. **Set up MCP server (optional, for AI agent integration)**:
   ```bash
   cd mcp-server
   npm install
   ```

   The MCP server is automatically configured in `.kiro/settings/mcp.json` and will be used by Kiro IDE when available.

8. **Start the frontend**:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Project Structure

```
clippy-kiroween/
├── src/                    # React frontend (TypeScript)
│   ├── components/         # UI components (ClippyAgent, MainWindow, etc.)
│   ├── contexts/           # React contexts (Game, FileSystem, Editor)
│   ├── hooks/              # Custom hooks (useClippyBrain, useExecution)
│   ├── services/           # API services (memory, gameState)
│   └── utils/              # Utilities (codeValidator, geminiService)
├── server/                 # Express backend
│   ├── routes/             # API routes (lint, memory, gameState)
│   ├── services/           # Business logic (linting, memory, roasting)
│   └── parsers/            # Language-specific linter parsers
├── mcp-server/             # MCP server for AI agent integration
├── prisma/                 # Database schema and migrations
├── .kiro/                  # Kiro IDE configuration
│   ├── hooks/              # 12 automated Git/editor hooks
│   ├── specs/              # 9 feature specifications
│   └── steering/           # 4 steering files for AI personality
└── public/                 # Static assets (Clippy.js, sounds)
```

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Database Management

```bash
# Open Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

## API Endpoints

The backend server provides:

- `POST /lint` - Lint code for various languages (Python, JavaScript, C, C++, Java)
- `POST /roast` - Lint code and generate AI-powered roasts (requires Gemini API key)
- `GET/POST /api/memory` - Manage Clippy's persistent memory
- `GET/POST /api/game-state` - Read/update game state (anger level, errors)

## MCP Server

The MCP server provides 13 tools for AI agent integration:

- **Game State**: `get_clippy_state`, `set_clippy_anger`, `increment_anger`, `reset_game_state`
- **Hook Management**: `list_hooks`, `toggle_hook`, `run_hook`
- **Code Analysis**: `analyze_code_quality`
- **Punishments**: `trigger_punishment`, `haunt_desktop`, `play_system_sound`
- **Utilities**: `read_project_context`, `manage_memory`

See `mcp-server/README.md` for detailed documentation.

## Hooks System

12 automated hooks integrate Clippy into your development workflow:

- **Git Hooks**: pre-commit, commit-msg validation, lint-staged, branch name checks, pre-push tests, post-merge
- **Editor Hooks**: file save comments, post-lint roasts
- **Build Hooks**: pre-build TODO checks
- **Manual Hooks**: test runner, complexity checks, dependency audits

See `.kiro/hooks/README.md` for setup and configuration.

## Documentation

- **[KIRO_USAGE.md](KIRO_USAGE.md)** - Comprehensive guide on using Kiro IDE features
- **[mcp-server/README.md](mcp-server/README.md)** - MCP server documentation
- **[.kiro/hooks/README.md](.kiro/hooks/README.md)** - Hooks system documentation

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL, Prisma ORM
- **AI**: Google Gemini API
- **Animation**: Clippy.js
- **Build**: Vite, Vitest

## License

ISC

---

**📎 Clippy says**: "I've been watching you since 1997. Your code quality determines my mood. Choose wisely."
