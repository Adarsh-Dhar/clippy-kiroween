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
