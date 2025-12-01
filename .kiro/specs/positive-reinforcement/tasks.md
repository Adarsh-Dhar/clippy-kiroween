# Implementation Plan

- [x] 1. Update backend roasting service to support compliments
- [x] 1.1 Add compliment system prompt constant
  - Create `COMPLIMENT_SYSTEM_PROMPT` with Clippy's passive-aggressive compliment persona
  - Include example responses and persona rules
  - _Requirements: 1.4, 4.1, 4.2, 4.5_

- [x] 1.2 Implement compliment generation function
  - Create `generateCompliment(code, language)` function
  - Construct prompt for LLM with code snippet
  - Call Gemini API with compliment system prompt
  - Handle errors with fallback mechanism
  - _Requirements: 1.1, 1.5, 4.3_

- [x] 1.3 Create fallback compliment function
  - Implement `getFallbackCompliment()` with predefined compliments array
  - Return random compliment from array
  - Ensure all fallbacks match Clippy's persona
  - _Requirements: 1.4, 4.1, 4.2_

- [x] 1.4 Modify callGeminiAPI to accept custom system prompt
  - Add optional `systemPrompt` parameter to `callGeminiAPI()`
  - Default to existing `SYSTEM_PROMPT` for backward compatibility
  - Use provided system prompt in request body
  - _Requirements: 1.1, 1.5_

- [x] 1.5 Update lintAndRoast function logic
  - Add conditional branch for `errors.length === 0` case
  - Call `generateCompliment()` when no errors found
  - Return response with `type: 'compliment'` and `message` field
  - Preserve existing roast logic for error cases
  - Add `type: 'roast'` to error responses for consistency
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Update frontend to handle compliment responses
- [x] 2.1 Add response type handling in ClippyAgent
  - Check for `response.type === 'compliment'` in feedback effect
  - Call `speak()` with compliment message
  - Distinguish compliment from roast responses
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 2.2 Implement happy animation for compliments
  - Trigger 'Congratulate' animation when compliment received
  - Add fallback to 'Idle1_1' if Congratulate unavailable
  - Ensure angry animations not triggered for compliments
  - _Requirements: 2.1, 2.2_

- [x] 2.3 Add sound effect support (optional)
  - Create `playSound()` helper function
  - Play 'Tada' or 'Chime' sound for compliments
  - Handle missing sound files gracefully
  - _Requirements: 2.3_

- [x] 2.4 Add TypeScript types for response schema
  - Define `ComplimentResponse` interface
  - Define `RoastResponse` interface
  - Create union type `FeedbackResponse`
  - Update component props and state types
  - _Requirements: 3.3, 3.4_

- [x] 3. Write tests for compliment functionality
- [x] 3.1 Backend unit tests for roastingService
  - Test compliment generation for clean code
  - Test fallback compliment when LLM fails
  - Test roast still works for error cases (regression)
  - Test response schema includes correct type field
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.5_

- [x] 3.2 Frontend unit tests for ClippyAgent
  - Test compliment triggers Congratulate animation
  - Test roast triggers angry animation (regression)
  - Test sound effect plays for compliments
  - Test graceful handling of missing type field
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.3 Integration test for end-to-end compliment flow
  - Submit clean code to /roast endpoint
  - Verify response contains compliment with correct type
  - Verify frontend displays message with happy animation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.3_
