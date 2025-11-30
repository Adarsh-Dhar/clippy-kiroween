# Implementation Plan: Voice Apology System

- [x] 1. Create TypeScript type definitions for Speech Recognition API
  - Create `src/types/speechRecognition.d.ts` file
  - Define interfaces for `SpeechRecognition`, `SpeechRecognitionEvent`, `SpeechRecognitionResult`, and related types
  - Extend `Window` interface to include `SpeechRecognition` and `webkitSpeechRecognition` constructors
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Extend GameContext with reset functionality
  - Add `resetGame` method to `GameContextType` interface in `src/contexts/GameContext.tsx`
  - Implement `resetGame` function that resets `angerLevel` to 0, `errorCount` to 0, and `gameState` to 'PLAYING'
  - Export `resetGame` in the context value object
  - _Requirements: 5.2, 5.3_

- [x] 3. Create ApologyModal component with voice recognition
  - [x] 3.1 Create component file and basic structure
    - Create `src/components/ApologyModal.tsx` file
    - Define `ApologyModalProps` interface with `isOpen`, `onApologyAccepted`, and `onTimeout` props
    - Set up component state for mode ('voice' | 'typing'), listening status, transcript, and timers
    - Implement conditional rendering based on `isOpen` prop
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Implement Speech Recognition API detection and initialization
    - Add useEffect hook to detect Speech Recognition API availability on mount
    - Check for `window.SpeechRecognition` or `window.webkitSpeechRecognition`
    - Set mode to 'voice' if available, 'typing' if not
    - Initialize recognition instance with `continuous: true` and `interimResults: true`
    - Start listening automatically when in voice mode
    - _Requirements: 2.1, 2.2, 2.3, 4.1_

  - [x] 3.3 Implement voice transcript processing and apology detection
    - Add `onresult` event handler to speech recognition
    - Extract transcript from recognition results
    - Normalize transcript to lowercase for case-insensitive matching
    - Check if transcript contains "sorry" or "apologize" keywords
    - Call `onApologyAccepted` callback when apology keyword is detected
    - _Requirements: 2.4, 2.5_

  - [x] 3.4 Implement 5-second silence timeout mechanism
    - Start a 5-second timer when component mounts in voice mode
    - Reset timer whenever speech is detected (on `onresult` event)
    - Call `onTimeout` callback when timer expires without detecting apology
    - Clear timer on component unmount
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.5 Implement error handling for speech recognition
    - Add `onerror` event handler to speech recognition
    - Handle 'not-allowed' and 'service-not-allowed' errors by switching to typing mode
    - Handle other errors by attempting to restart recognition if within timeout window
    - Log errors to console for debugging
    - _Requirements: 4.1_

  - [x] 3.6 Implement cleanup on unmount
    - Stop speech recognition in cleanup function
    - Clear all timers in cleanup function
    - Abort any ongoing recognition processes
    - _Requirements: 2.3_

- [x] 4. Implement typing fallback mode in ApologyModal
  - [x] 4.1 Create typing mode UI elements
    - Add conditional rendering for typing mode when Speech API is unavailable
    - Create text input field with proper styling (black background, white text, white border)
    - Display instruction text: "Type 'I am sorry Clippy' 10 times"
    - Add progress counter display showing "X/10" format
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 4.2 Implement typed apology validation
    - Create state for tracking typed text and apology count
    - Add form submit handler for input field
    - Validate that typed text exactly matches "I am sorry Clippy" (case-insensitive)
    - Increment apology count only on valid submissions
    - Clear input field after valid submission
    - _Requirements: 4.3, 4.4_

  - [x] 4.3 Implement completion logic for typing mode
    - Check if apology count reaches 10 after each valid submission
    - Call `onApologyAccepted` callback when count reaches 10
    - Update progress counter display after each submission
    - _Requirements: 4.4, 4.5_

- [x] 5. Create visual styling for ApologyModal
  - [x] 5.1 Implement modal overlay and base styling
    - Add full-screen fixed overlay with `rgba(0, 0, 0, 0.95)` background
    - Set z-index to 10000 to appear above game elements
    - Center content vertically and horizontally using flexbox
    - Add fade-in animation (300ms duration)
    - _Requirements: 1.2, 1.3_

  - [x] 5.2 Create pulsating microphone icon for voice mode
    - Add SVG microphone icon (80px × 80px, red color)
    - Implement CSS keyframe animation for scale pulse (1.0 to 1.2, 1s duration, infinite)
    - Add drop shadow effect to icon
    - Position icon above text content
    - _Requirements: 1.3, 2.2_

  - [x] 5.3 Style text elements and typography
    - Apply Windows 95 font family (MS Sans Serif fallback)
    - Style main text "SAY IT. SAY YOU ARE SORRY." with 24px size, bold weight, white color
    - Add 2px letter spacing for emphasis
    - Center-align all text content
    - Style typing mode instruction text and progress counter
    - _Requirements: 1.3, 4.2_

- [x] 6. Integrate ApologyModal into App component
  - [x] 6.1 Add modal rendering logic to AppContent
    - Import `ApologyModal` component in `src/App.tsx`
    - Add conditional rendering: show modal when `angerLevel === 4`
    - Pass `isOpen={true}` when condition is met
    - _Requirements: 1.1_

  - [x] 6.2 Implement modal callback handlers
    - Create `handleApologyAccepted` function that calls `resetGame()` from GameContext
    - Create `handleApologyTimeout` function that sets `angerLevel` to 5
    - Pass both handlers as props to `ApologyModal`
    - _Requirements: 3.2, 5.1, 5.2_

  - [x] 6.3 Verify modal prevents interaction with underlying components
    - Ensure modal overlay blocks pointer events to game elements
    - Test that modal appears above all game UI except BSOD
    - Verify modal closes after successful apology or timeout
    - _Requirements: 1.4, 5.1, 5.3_

- [x] 7. Write unit tests for ApologyModal component
  - Create `src/components/ApologyModal.test.tsx` file
  - Write tests for rendering in both voice and typing modes
  - Write tests for Speech Recognition API detection and initialization
  - Write tests for apology keyword detection ("sorry", "apologize")
  - Write tests for 5-second silence timeout
  - Write tests for typing fallback validation and counter
  - Write tests for cleanup on unmount
  - Mock Speech Recognition API for consistent test behavior
  - _Requirements: All_

- [x] 8. Write integration tests for game flow
  - Extend `src/App.test.tsx` with ApologyModal integration tests
  - Test modal appearance at anger level 4
  - Test successful apology resets anger level to 0
  - Test timeout increases anger level to 5 and triggers BSOD
  - Test GameContext `resetGame` function integration
  - _Requirements: 1.1, 3.2, 5.1, 5.2_
