# Design Document

## Overview

The positive reinforcement feature extends the existing linting and roasting system to provide compliments when users write error-free code. The design maintains Clippy's passive-aggressive persona while introducing a new code path for success scenarios. The implementation leverages the existing Gemini LLM integration and animation system, requiring minimal changes to the current architecture.

## Architecture

### High-Level Flow

```
User Code → Backend Linting Service → Error Check
                                          ↓
                                    [Has Errors?]
                                    ↙           ↘
                              YES: Roast      NO: Compliment
                                ↓                  ↓
                          Gemini API         Gemini API
                        (Roast Prompt)   (Compliment Prompt)
                                ↓                  ↓
                          Return {type:      Return {type:
                          'roast', ...}      'compliment', ...}
                                    ↘           ↙
                                    Frontend Client
                                          ↓
                                [Animation Selection]
                                    ↙           ↘
                            Angry Animations  Happy Animations
                            (GetAttention)    (Congratulate)
```

### Component Interaction

1. **Frontend (ClippyAgent.tsx)** sends code to backend via `getClippyFeedback()`
2. **Backend Router (lintRouter.js)** receives request at `/roast` endpoint
3. **Roasting Service (roastingService.js)** orchestrates the flow:
   - Calls `lintCode()` to check for errors
   - If errors exist: generates roast using existing logic
   - If no errors: generates compliment using new logic
4. **Frontend (ClippyAgent.tsx)** receives response and:
   - Checks response `type` field
   - Triggers appropriate animation
   - Plays corresponding sound effect (if available)

## Components and Interfaces

### Backend Changes

#### 1. Roasting Service (`server/services/roastingService.js`)

**New Constant:**
```javascript
const COMPLIMENT_SYSTEM_PROMPT = `You are **Clippy**, the resurrected Microsoft Office Assistant from 1997...

The user just wrote code that has NO syntax errors. You are shocked and slightly suspicious.

**Your Goal:**
Give them a compliment, but make it sound like you didn't expect them to succeed.

**Your Persona Rules:**
1. Express genuine surprise that the code actually works
2. Maintain suspicion - question if they copied it
3. Give qualified praise ("Good job, I guess", "For now")
4. Keep responses short (under 2 sentences)
5. Reference common developer behaviors (StackOverflow, copy-paste)

**Example Responses:**
* "Wow, it actually runs. I'm as surprised as you are."
* "No errors? Did you copy-paste this from StackOverflow?"
* "Acceptable. For now."
* "I was ready to delete your hard drive, but this looks clean. Good job, I guess."
* "It looks like you're trying to write working code. Miracles do happen."`;
```

**New Function:**
```javascript
/**
 * Generate a compliment for error-free code
 * @param {string} code - The code snippet
 * @param {string} language - The programming language
 * @returns {Promise<string>} The compliment text
 */
async function generateCompliment(code, language) {
  const prompt = `The user wrote this ${language} code and it has ZERO syntax errors:
\`\`\`${language}
${code}
\`\`\`

Give them a compliment in your signature passive-aggressive style. Be surprised and slightly suspicious.`;

  try {
    return await callGeminiAPI(prompt, COMPLIMENT_SYSTEM_PROMPT);
  } catch (error) {
    console.error('Error generating compliment:', error);
    return getFallbackCompliment();
  }
}
```

**Modified Function:**
```javascript
async function lintAndRoast(code, language) {
  const errors = await lintCode(code, language);

  if (errors.length === 0) {
    // NEW: Generate compliment for clean code
    const compliment = await generateCompliment(code, language);
    return {
      status: 'clean',
      type: 'compliment',
      message: compliment
    };
  }

  // EXISTING: Generate roast for errors
  const top3Errors = errors.slice(0, 3);
  const prompt = constructRoastPrompt(code, language, top3Errors);
  const roast = await callGeminiAPI(prompt, SYSTEM_PROMPT);

  return {
    status: 'error',
    type: 'roast',
    roast,
    errors
  };
}
```

**Helper Function:**
```javascript
/**
 * Generate a fallback compliment when LLM is unavailable
 * @returns {string} A fallback compliment message
 */
function getFallbackCompliment() {
  const fallbacks = [
    "Wow, it actually runs. I'm as surprised as you are.",
    "No errors? Did you copy-paste this from StackOverflow?",
    "Acceptable. For now.",
    "I was ready to delete your hard drive, but this looks clean. Good job, I guess.",
    "It looks like you're trying to write working code. Miracles do happen."
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
```

**API Signature Update:**
```javascript
/**
 * Call Gemini API with custom system prompt
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system instruction (defaults to SYSTEM_PROMPT)
 * @returns {Promise<string>} The generated text
 */
async function callGeminiAPI(prompt, systemPrompt = SYSTEM_PROMPT) {
  // ... existing implementation with systemPrompt parameter
}
```

### Frontend Changes

#### 1. ClippyAgent Component (`src/components/ClippyAgent.tsx`)

**Response Type Handling:**
```typescript
// In the useEffect that fetches feedback
const response = await getClippyFeedback(code, 'javascript');

if (response.status === 'clean') {
  if (response.type === 'compliment' && response.message) {
    // NEW: Handle compliment response
    speak(response.message);
    playAnimation('Congratulate'); // or 'Idle1_1'
    playSound('Tada'); // if available
  } else {
    // No message, just clean code
    setGeminiFeedback('');
    setShowSpeechBubble(false);
  }
} else if (response.roast) {
  // EXISTING: Handle roast response
  speak(response.roast);
  // Existing angry animation logic
}
```

**Animation Mapping:**
```typescript
const responseAnimations = {
  compliment: 'Congratulate', // Primary choice for compliments
  roast: 'GetAttention'       // Existing angry animation
};
```

**Sound Effect Integration (Optional):**
```typescript
const playSound = (soundName: string) => {
  try {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = 0.5;
    audio.play();
  } catch (error) {
    console.warn('Sound effect not available:', soundName);
  }
};
```

## Data Models

### Response Schema

**Success Response (No Errors):**
```typescript
interface ComplimentResponse {
  status: 'clean';
  type: 'compliment';
  message: string;
}
```

**Error Response (With Errors):**
```typescript
interface RoastResponse {
  status: 'error';
  type: 'roast';
  roast: string;
  errors: Array<{
    line: number;
    message: string;
  }>;
}
```

**Union Type:**
```typescript
type FeedbackResponse = ComplimentResponse | RoastResponse;
```

## Error Handling

### Backend Error Scenarios

1. **Gemini API Failure (Compliment Generation)**
   - Fallback to random compliment from predefined list
   - Log error but don't expose to user
   - Return response with fallback message

2. **Linting Service Failure**
   - Existing error handling remains unchanged
   - Return clean status if linter unavailable

3. **Missing API Key**
   - Existing error handling remains unchanged
   - Return errors without roast/compliment

### Frontend Error Scenarios

1. **Unknown Response Type**
   - Default to existing behavior (show message if present)
   - Log warning for debugging

2. **Animation Not Available**
   - Fallback to 'Idle1_1' animation
   - Continue showing message

3. **Sound Effect Not Available**
   - Silently fail (optional feature)
   - Log warning for debugging

## Testing Strategy

### Backend Tests

**Unit Tests for `roastingService.js`:**

1. **Test: Generate compliment for clean code**
   ```javascript
   it('should generate compliment when no errors exist', async () => {
     const code = 'const x = 5;';
     const result = await lintAndRoast(code, 'javascript');
     
     expect(result.status).toBe('clean');
     expect(result.type).toBe('compliment');
     expect(result.message).toBeDefined();
   });
   ```

2. **Test: Fallback compliment when LLM fails**
   ```javascript
   it('should use fallback compliment when Gemini API fails', async () => {
     // Mock Gemini API to throw error
     const result = await generateCompliment('const x = 5;', 'javascript');
     
     expect(result).toMatch(/actually runs|StackOverflow|Acceptable|clean/);
   });
   ```

3. **Test: Roast still works for errors**
   ```javascript
   it('should generate roast when errors exist', async () => {
     const code = 'const x = ;'; // syntax error
     const result = await lintAndRoast(code, 'javascript');
     
     expect(result.status).toBe('error');
     expect(result.type).toBe('roast');
     expect(result.roast).toBeDefined();
   });
   ```

### Frontend Tests

**Unit Tests for `ClippyAgent.tsx`:**

1. **Test: Compliment triggers happy animation**
   ```typescript
   it('should play Congratulate animation for compliments', async () => {
     const mockResponse = {
       status: 'clean',
       type: 'compliment',
       message: 'Wow, it actually runs.'
     };
     
     // Mock API response
     // Verify playAnimation called with 'Congratulate'
   });
   ```

2. **Test: Roast triggers angry animation**
   ```typescript
   it('should play GetAttention animation for roasts', async () => {
     const mockResponse = {
       status: 'error',
       type: 'roast',
       roast: 'You forgot a semicolon.',
       errors: [...]
     };
     
     // Mock API response
     // Verify existing angry animation logic
   });
   ```

### Integration Tests

1. **Test: End-to-end compliment flow**
   - Submit clean code to `/roast` endpoint
   - Verify response contains compliment
   - Verify frontend displays message with happy animation

2. **Test: End-to-end roast flow (regression)**
   - Submit code with errors to `/roast` endpoint
   - Verify response contains roast
   - Verify frontend displays message with angry animation

## Implementation Notes

### Backward Compatibility

- Existing `/roast` endpoint behavior preserved for error cases
- Response schema extended (not breaking) with `type` field
- Frontend gracefully handles responses without `type` field
- All existing tests should continue to pass

### Performance Considerations

- Compliment generation adds one LLM call for clean code
- Fallback mechanism prevents blocking on LLM failures
- No additional linting overhead (same linting process)

### Configuration

No new environment variables required. Uses existing:
- `GEMINI_API_KEY` - Already configured for roasting

### Future Enhancements

1. **Compliment Variety**
   - Track previously shown compliments
   - Avoid repetition within session

2. **Sound Effects**
   - Add audio files for success/failure
   - Configurable volume settings

3. **Animation Sequences**
   - Chain multiple animations for dramatic effect
   - Custom animation for "suspicious compliment"

4. **Metrics**
   - Track compliment vs roast ratio
   - User engagement with positive feedback
