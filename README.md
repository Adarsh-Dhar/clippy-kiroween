# clippy-kiroween

## Setup

### Environment Variables

1. Create a `.env` file in the root directory with the following variables:
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

2. Get your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey) (optional)

Note: The app will work without the API key, but Clippy will use fallback messages instead of AI-generated feedback.

### Database Setup

1. Start the PostgreSQL database using Docker Compose:
   ```bash
   docker compose up -d db
   ```

2. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

   Or for development:
   ```bash
   npx prisma migrate dev
   ```

3. Verify database connection:
   ```bash
   npx prisma studio
   ```

### Linting Server

The app uses a backend server for real linting. To run it:

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install system linters (required):
   - Python: `pip install pylint`
   - JavaScript: `npm install -g eslint`

4. Start the server:
   ```bash
   npm start
   ```

5. Configure frontend (optional):
   Add to `.env`:
   ```
   VITE_LINT_API_URL=http://localhost:3001
   ```

The server runs on port 3001 by default.
