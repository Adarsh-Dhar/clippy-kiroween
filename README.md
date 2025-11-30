# clippy-kiroween

## Setup

### Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. Add your API key to `.env`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

Note: The app will work without the API key, but Clippy will use fallback messages instead of AI-generated feedback.

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
